import { Injectable } from '@angular/core';
import { Network, ConnectionStatus } from '@capacitor/network';
import { BehaviorSubject } from 'rxjs';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private status = new BehaviorSubject<boolean>(true);
  public currentStatus = this.status.asObservable();

  constructor(private toastController: ToastController) {
    this.init();
  }

  private async init() {
    const status = await Network.getStatus();
    this.status.next(status.connected);

    Network.addListener('networkStatusChange', async (status: ConnectionStatus) => {
      this.status.next(status.connected);
      this.showToast(status.connected ? 'Conexión a internet restaurada' : 'Sin conexión a internet. Cambiando a modo offline.');
    });
  }

  getCurrentStatus(): boolean {
    return this.status.getValue();
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: this.getCurrentStatus() ? 'success' : 'danger'
    });
    await toast.present();
  }
}
