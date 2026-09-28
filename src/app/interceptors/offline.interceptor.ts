import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, Observable, throwError, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { NetworkService } from '../services/network.service';
import { CacheService } from '../services/cache.service';
import { ToastController } from '@ionic/angular';

export const offlineInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const networkService = inject(NetworkService);
  const cacheService = inject(CacheService);
  const toastController = inject(ToastController);

  const isOnline = networkService.getCurrentStatus();

  if (req.method === 'GET') {
    if (isOnline) {
      return next(req).pipe(
        tap(event => {
          if (event instanceof HttpResponse) {
            cacheService.setCache(req.urlWithParams, event.body);
          }
        }),
        catchError((error: HttpErrorResponse) => {
          return throwError(() => error);
        })
      );
    } else {
      // Intentar obtener de la caché si estamos offline
      return from(cacheService.getCache(req.urlWithParams)).pipe(
        switchMap(cachedData => {
          if (cachedData) {
            toastController.create({
              message: 'Mostrando datos cacheados en modo offline.',
              duration: 2000,
              color: 'warning'
            }).then(toast => toast.present());
            return of(new HttpResponse({ body: cachedData, status: 200 }));
          } else {
            toastController.create({
              message: 'No hay datos almacenados para esta vista. Necesitas conexión a internet.',
              duration: 3000,
              color: 'danger'
            }).then(toast => toast.present());
            return throwError(() => new Error('No cache available and offline'));
          }
        })
      );
    }
  } else {
    // Peticiones de escritura (POST, PUT, DELETE)
    if (isOnline) {
      return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
          toastController.create({
            message: 'Error al comunicarse con el servidor.',
            duration: 3000,
            color: 'danger'
          }).then(toast => toast.present());
          return throwError(() => error);
        })
      );
    } else {
      toastController.create({
        message: 'No hay conexión. No puedes guardar cambios en modo offline.',
        duration: 3000,
        color: 'danger'
      }).then(toast => toast.present());
      return throwError(() => new Error('Offline, cannot write data'));
    }
  }
};
