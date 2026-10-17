import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, Observable, throwError, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { NetworkService } from '../services/network.service';
import { CacheService } from '../services/cache.service';
import { SyncService } from '../services/sync.service';
import { ToastController, ModalController } from '@ionic/angular';
import { ErrorModalComponent } from '../error-modal/error-modal.component';

export const offlineInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const networkService = inject(NetworkService);
  const cacheService = inject(CacheService);
  const syncService = inject(SyncService);
  const toastController = inject(ToastController);
  const modalController = inject(ModalController);

  const isOnline = networkService.getCurrentStatus();

  const showToast = (message: string, color: string, duration = 2500) => {
    try {
      toastController.create({ message, duration, color }).then(toast => toast.present());
    } catch {}
  };

  const showErrorModal = async (error: HttpErrorResponse) => {
    let config: any = { ip: 'unknown' };
    try {
      config = JSON.parse(localStorage.getItem('serverConfig') || '{}');
    } catch(e) {}

    const errorData = {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      ip: config.ip,
      headers: req.headers.keys().reduce((acc: any, key) => {
        acc[key] = req.headers.get(key);
        return acc;
      }, {}),
      payload: req.body || null,
      response: error.error
    };

    try {
      const modal = await modalController.create({
        component: ErrorModalComponent,
        componentProps: { errorData }
      });
      await modal.present();
    } catch {}
  };

  const serveFromCacheOrThrow = (originalError?: HttpErrorResponse): Observable<HttpEvent<any>> => {
    return from(cacheService.getCache(req.urlWithParams)).pipe(
      switchMap(cachedData => {
        if (cachedData !== null && cachedData !== undefined) {
          showToast('Mostrando datos cacheados en modo offline.', 'warning', 2000);
          return of(new HttpResponse({ body: cachedData, status: 200 }));
        } else {
          showToast('No hay datos almacenados para esta vista. Necesitas conexión a internet.', 'danger', 3000);
          if (originalError) {
            showErrorModal(originalError);
            return throwError(() => originalError);
          }
          return throwError(() => new Error('No cache available and offline'));
        }
      })
    );
  };

  const enqueueWriteOffline = (): Observable<HttpEvent<any>> => {
    return from(syncService.enqueueOperation(req.method, req.urlWithParams, req.body)).pipe(
      switchMap(op => {
        showToast(
          'Sin conexión: Cambio guardado localmente y encolado para sincronización.',
          'warning',
          3000
        );
        return of(
          new HttpResponse({
            status: 200,
            body: {
              offline: true,
              queued: true,
              syncId: op.id,
              message: 'Guardado localmente para sincronización'
            }
          })
        );
      })
    );
  };

  if (req.method === 'GET') {
    if (isOnline) {
      return next(req).pipe(
        tap(event => {
          if (event instanceof HttpResponse) {
            cacheService.setCache(req.urlWithParams, event.body);
            cacheService.setLastSyncTime();
          }
        }),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 0) {
            // Fallo de red inesperado: usar caché local si existe
            return serveFromCacheOrThrow(error);
          }
          showErrorModal(error);
          return throwError(() => error);
        })
      );
    } else {
      return serveFromCacheOrThrow();
    }
  } else {
    // Peticiones de escritura (POST, PUT, PATCH, DELETE)
    if (isOnline) {
      return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 0) {
            // Si la conexión cae durante la escritura, encolamos localmente
            return enqueueWriteOffline();
          }
          showErrorModal(error);
          return throwError(() => error);
        })
      );
    } else {
      return enqueueWriteOffline();
    }
  }
};

