import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { ToastController, ModalController } from '@ionic/angular';
import { offlineInterceptor } from './offline.interceptor';
import { NetworkService } from '../services/network.service';
import { CacheService } from '../services/cache.service';
import { SyncService } from '../services/sync.service';

describe('offlineInterceptor (Consulta Remota, Caché Local y Encolado Offline)', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let networkService: NetworkService;
  let cacheService: CacheService;
  let syncService: SyncService;

  beforeEach(async () => {
    const toastSpy = jasmine.createSpyObj('ToastController', ['create']);
    toastSpy.create.and.resolveTo({ present: () => Promise.resolve() } as any);
    const modalSpy = jasmine.createSpyObj('ModalController', ['create']);
    modalSpy.create.and.resolveTo({ present: () => Promise.resolve() } as any);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([offlineInterceptor])),
        provideHttpClientTesting(),
        NetworkService,
        CacheService,
        SyncService,
        { provide: ToastController, useValue: toastSpy },
        { provide: ModalController, useValue: modalSpy }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    networkService = TestBed.inject(NetworkService);
    cacheService = TestBed.inject(CacheService);
    syncService = TestBed.inject(SyncService);

    await cacheService.clearCache();
    await syncService.clearQueue();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe realizar consulta remota cuando está online y persistir respuesta en caché local', async () => {
    networkService.setConnectionStatus(true, false);
    const url = 'http://localhost/api.php?table=market_items';
    const remoteData = [{ item_id: 'AK-47 | Redline', current_price: 25.0 }];

    const resPromise = firstValueFrom(http.get<any[]>(url));
    const req = httpMock.expectOne(url);
    req.flush(remoteData);

    const response = await resPromise;
    expect(response).toEqual(remoteData);

    const cached = await cacheService.getCache(url);
    expect(cached).toEqual(remoteData);
  });

  it('debe servir datos desde la persistencia local cuando no hay conexión a internet', async () => {
    const url = 'http://localhost/api.php?table=market_items';
    const cachedItems = [{ item_id: 'M4A1-S | Printstream', current_price: 180.0 }];
    await cacheService.setCache(url, cachedItems);

    networkService.setConnectionStatus(false, false);

    const response = await firstValueFrom(http.get<any[]>(url));
    expect(response).toEqual(cachedItems);
  });

  it('debe encolar escrituras (POST) en SyncService cuando está en modo offline sin perder datos', async () => {
    networkService.setConnectionStatus(false, false);
    const url = 'http://localhost/api.php?table=user_inventory';
    const payload = { user_id: 1, item_id: 'Desert Eagle | Blaze', purchase_price: 450, quantity: 1 };

    const response: any = await firstValueFrom(http.post(url, payload));
    expect(response.offline).toBeTrue();
    expect(response.queued).toBeTrue();

    const queue = await syncService.getQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].body).toEqual(payload);
  });
});
