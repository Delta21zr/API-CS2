import { Injectable } from '@angular/core';
import { Network, ConnectionStatus } from '@capacitor/network';
import { BehaviorSubject, Subject } from 'rxjs';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private status = new BehaviorSubject<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  public currentStatus = this.status.asObservable();

  private connectionLostSubject = new Subject<void>();
  public connectionLost$ = this.connectionLostSubject.asObservable();

  private connectionRecoveredSubject = new Subject<void>();
  public connectionRecovered$ = this.connectionRecoveredSubject.asObservable();

  constructor(private toastController: ToastController) {
    this.init();
  }

  public async init(): Promise<void> {
    try {
      const netStatus = await Network.getStatus();
      this.status.next(netStatus.connected);
    } catch {
      this.status.next(typeof navigator !== 'undefined' ? navigator.onLine : true);
    }

    try {
      await Network.addListener('networkStatusChange', (netStatus: ConnectionStatus) => {
        this.setConnectionStatus(netStatus.connected, true);
      });
    } catch {
      // Fallback para entornos web sin plugin nativo
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.setConnectionStatus(true, true));
      window.addEventListener('offline', () => this.setConnectionStatus(false, true));
    }
  }

  public getCurrentStatus(): boolean {
    return this.status.getValue();
  }

  /**
   * Actualiza el estado de conexión y dispara eventos de pérdida o recuperación de internet
   */
  public setConnectionStatus(connected: boolean, showNotification: boolean = true): void {
    const previous = this.status.getValue();
    this.status.next(connected);

    if (previous && !connected) {
      this.connectionLostSubject.next();
      if (showNotification) {
        this.showToast('Sin conexión a internet. Cambiando a modo offline (persistencia local activa).', false);
      }
    } else if (!previous && connected) {
      this.connectionRecoveredSubject.next();
      if (showNotification) {
        this.showToast('Conexión a internet restaurada. Sincronizando datos pendientes...', true);
      }
    }
  }

  private async showToast(message: string, isOnline: boolean = this.getCurrentStatus()): Promise<void> {
    try {
      const toast = await this.toastController.create({
        message,
        duration: 3000,
        position: 'bottom',
        color: isOnline ? 'success' : 'danger'
      });
      await toast.present();
    } catch {
      // Ignorar si ToastController no está disponible en entorno headless
    }
  }
}

