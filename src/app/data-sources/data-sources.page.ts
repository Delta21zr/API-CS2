import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButtons, IonBackButton, IonBadge, IonButton } from '@ionic/angular';
import { NetworkService } from '../services/network.service';
import { SyncService, SyncOperation } from '../services/sync.service';

@Component({
  selector: 'app-data-sources',
  templateUrl: './data-sources.page.html',
  styleUrls: ['./data-sources.page.scss'],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButtons, IonBackButton, IonBadge, IonButton, CommonModule, FormsModule]
})
export class DataSourcesPage implements OnInit {
  serverConfig: any = null;
  isOnline = true;
  pendingCount = 0;
  lastSyncTime: string | null = null;
  queuedOperations: SyncOperation[] = [];

  constructor(
    private networkService: NetworkService,
    private syncService: SyncService
  ) { }

  ngOnInit() {
    const configStr = localStorage.getItem('serverConfig');
    if (configStr) {
      try {
        this.serverConfig = JSON.parse(configStr);
      } catch (e) {
        console.error('Error al parsear config', e);
      }
    }

    this.networkService.currentStatus.subscribe(status => {
      this.isOnline = status;
    });

    this.syncService.pendingCount$.subscribe(async count => {
      this.pendingCount = count;
      this.queuedOperations = await this.syncService.getQueue();
    });

    this.syncService.lastSyncTime$.subscribe(time => {
      this.lastSyncTime = time;
    });
  }

  async syncNow() {
    await this.syncService.syncPendingOperations();
    this.queuedOperations = await this.syncService.getQueue();
  }
}

