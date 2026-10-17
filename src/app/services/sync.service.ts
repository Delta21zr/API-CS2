import { Injectable } from '@angular/core';
import { HttpBackend, HttpClient, HttpRequest } from '@angular/common/http';
import { BehaviorSubject, Subject, lastValueFrom } from 'rxjs';
import { ToastController } from '@ionic/angular';
import { CacheService } from './cache.service';
import { NetworkService } from './network.service';

export interface SyncOperation {
  id: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  body: any;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  public readonly SYNC_QUEUE_KEY = 'cs2_sync_queue';

  private directHttp: HttpClient;

  private pendingCountSubject = new BehaviorSubject<number>(0);
  public pendingCount$ = this.pendingCountSubject.asObservable();

  private isSyncingSubject = new BehaviorSubject<boolean>(false);
  public isSyncing$ = this.isSyncingSubject.asObservable();

  private lastSyncTimeSubject = new BehaviorSubject<string | null>(null);
  public lastSyncTime$ = this.lastSyncTimeSubject.asObservable();

  private syncCompletedSubject = new Subject<{ synced: number; failed: number }>();
  public syncCompleted$ = this.syncCompletedSubject.asObservable();

  constructor(
    httpBackend: HttpBackend,
    private cacheService: CacheService,
    private networkService: NetworkService,
    private toastController: ToastController
  ) {
    this.directHttp = new HttpClient(httpBackend);
    this.initSyncService();
  }

  public async initSyncService(): Promise<void> {
    const queue = await this.getQueue();
    this.pendingCountSubject.next(queue.length);

    const lastSync = await this.cacheService.getLastSyncTime();
    this.lastSyncTimeSubject.next(lastSync);

    // Escuchar recuperación de conexión para sincronizar automáticamente
    this.networkService.connectionRecovered$.subscribe(() => {
      this.syncPendingOperations();
    });
  }

  public async getQueue(): Promise<SyncOperation[]> {
    const queue = await this.cacheService.getCache<SyncOperation[]>(this.SYNC_QUEUE_KEY);
    return Array.isArray(queue) ? queue : [];
  }

  public async enqueueOperation(
    method: string,
    url: string,
    body: any = null
  ): Promise<SyncOperation> {
    const queue = await this.getQueue();
    const operation: SyncOperation = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      method: method.toUpperCase() as SyncOperation['method'],
      url,
      body,
      timestamp: Date.now()
    };

    queue.push(operation);
    await this.cacheService.setCache(this.SYNC_QUEUE_KEY, queue);
    await this.cacheService.applyOptimisticWrite(method, url, body);
    this.pendingCountSubject.next(queue.length);

    return operation;
  }

  public async syncPendingOperations(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncingSubject.getValue() || !this.networkService.getCurrentStatus()) {
      return { synced: 0, failed: 0 };
    }

    this.isSyncingSubject.next(true);
    try {
      const queue = await this.getQueue();
      if (queue.length === 0) {
        return { synced: 0, failed: 0 };
      }

      let synced = 0;
      let failed = 0;
      const remainingQueue: SyncOperation[] = [];

      for (const op of queue) {
        try {
          const req = new HttpRequest(op.method, op.url, op.body);
          await lastValueFrom(this.directHttp.request(req));
          synced++;
        } catch {
          failed++;
          remainingQueue.push(op);
        }
      }

      await this.cacheService.setCache(this.SYNC_QUEUE_KEY, remainingQueue);
      this.pendingCountSubject.next(remainingQueue.length);

      if (synced > 0) {
        const nowIso = new Date().toISOString();
        await this.cacheService.setLastSyncTime(nowIso);
        this.lastSyncTimeSubject.next(nowIso);
        await this.showSyncToast(
          `Sincronización completada: ${synced} operación(es) sincronizada(s) con el servidor.`,
          'success'
        );
      }

      const result = { synced, failed };
      this.syncCompletedSubject.next(result);
      return result;
    } finally {
      this.isSyncingSubject.next(false);
    }
  }

  public async clearQueue(): Promise<void> {
    await this.cacheService.setCache(this.SYNC_QUEUE_KEY, []);
    this.pendingCountSubject.next(0);
  }

  private async showSyncToast(message: string, color: 'success' | 'warning' | 'danger'): Promise<void> {
    try {
      const toast = await this.toastController.create({
        message,
        duration: 2500,
        position: 'bottom',
        color
      });
      await toast.present();
    } catch {
      // Ignorar si no hay DOM activo en tests
    }
  }
}
