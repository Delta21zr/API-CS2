import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ToastController } from '@ionic/angular';
import { NetworkService } from './network.service';

describe('NetworkService (Pérdida y Recuperación de Conexión)', () => {
  let service: NetworkService;
  let toastSpy: jasmine.SpyObj<ToastController>;

  beforeEach(() => {
    toastSpy = jasmine.createSpyObj('ToastController', ['create']);
    toastSpy.create.and.resolveTo({
      present: () => Promise.resolve()
    } as any);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        NetworkService,
        { provide: ToastController, useValue: toastSpy }
      ]
    });

    service = TestBed.inject(NetworkService);
  });

  it('debe detectar pérdida de conexión a internet y emitir connectionLost$', () => {
    service.setConnectionStatus(true, false);
    let lostEmitted = false;
    service.connectionLost$.subscribe(() => {
      lostEmitted = true;
    });

    service.setConnectionStatus(false, true);

    expect(service.getCurrentStatus()).toBeFalse();
    expect(lostEmitted).toBeTrue();
  });

  it('debe detectar recuperación de conexión a internet y emitir connectionRecovered$', () => {
    service.setConnectionStatus(false, false);
    let recoveredEmitted = false;
    service.connectionRecovered$.subscribe(() => {
      recoveredEmitted = true;
    });

    service.setConnectionStatus(true, true);

    expect(service.getCurrentStatus()).toBeTrue();
    expect(recoveredEmitted).toBeTrue();
  });
});
