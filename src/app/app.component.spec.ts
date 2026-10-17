import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideIonicAngular } from '@ionic/angular';

import { AppComponent } from './app.component';
import { NetworkService } from './services/network.service';

describe('AppComponent (Identificación Visual Online / Offline)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideIonicAngular(),
        provideRouter([]),
        provideHttpClient()
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('debe mostrar identificación visual de estado Online y cambiar a Offline al perder conexión', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const networkService = TestBed.inject(NetworkService);

    networkService.setConnectionStatus(true, false);
    fixture.detectChanges();

    const bannerEl: HTMLElement = fixture.nativeElement.querySelector('#connection-status-banner');
    const textEl: HTMLElement = fixture.nativeElement.querySelector('#connection-status-text');
    expect(bannerEl.classList.contains('online')).toBeTrue();
    expect(textEl.textContent).toContain('En línea (Online)');

    // Simular pérdida de internet
    networkService.setConnectionStatus(false, false);
    fixture.detectChanges();

    expect(bannerEl.classList.contains('offline')).toBeTrue();
    expect(textEl.textContent).toContain('Sin conexión (Modo Offline');
  });
});
