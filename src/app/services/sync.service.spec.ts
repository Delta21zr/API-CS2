import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ToastController } from '@ionic/angular';
import { SyncService } from './sync.service';
import { CacheService } from './cache.service';
import { NetworkService } from './network.service';

describe('SyncService (Sincronización de Información y Cola Offline)', () => {
  let syncService: SyncService;
  let cacheService: CacheService;
  let networkService: NetworkService;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    const toastSpy = jasmine.createSpyObj('ToastController', ['create']);
    toastSpy.create.and.resolveTo({ present: () => Promise.resolve() } as any);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        CacheService,
        NetworkService,
        SyncService,
        { provide: ToastController, useValue: toastSpy }
      ]
    });

    cacheService = TestBed.inject(CacheService);
    await cacheService.clearCache();

    networkService = TestBed.inject(NetworkService);
    syncService = TestBed.inject(SyncService);
    httpMock = TestBed.inject(HttpTestingController);
    await syncService.clearQueue();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe encolar operaciones de escritura cuando está offline y actualizar el contador pendiente', async () => {
    networkService.setConnectionStatus(false, false);

    const op = await syncService.enqueueOperation(
      'POST',
      'http://localhost/api.php?table=user_inventory',
      { user_id: 1, item_id: 'AK-47 | Vulcan', purchase_price: 95, quantity: 1 }
    );

    expect(op.id).toContain('sync_');
    const queue = await syncService.getQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].method).toBe('POST');
  });

  it('debe sincronizar las operaciones encoladas con el servidor al recuperar la conexión', async () => {
    networkService.setConnectionStatus(false, false);

    await syncService.enqueueOperation(
      'POST',
      'http://localhost/api.php?table=user_inventory',
      { user_id: 1, item_id: 'AWP | Asiimov', purchase_price: 110, quantity: 1 }
    );

    const completedPromise = new Promise<{ synced: number; failed: number }>(resolve => {
      syncService.syncCompleted$.subscribe(res => resolve(res));
    });

    // Al recuperar conexión, SyncService dispara syncPendingOperations() automáticamente
    networkService.setConnectionStatus(true, false);

    await new Promise(resolve => setTimeout(resolve, 25));

    const req = httpMock.expectOne('http://localhost/api.php?table=user_inventory');
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Creado exitosamente', id: 99 });

    const result = await completedPromise;
    expect(result.synced).toBe(1);
    expect(result.failed).toBe(0);

    const remaining = await syncService.getQueue();
    expect(remaining.length).toBe(0);
  });
});
