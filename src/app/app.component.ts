import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { NetworkService } from './services/network.service';
import { SyncService } from './services/sync.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [CommonModule, IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  isOnline = true;
  pendingCount = 0;
  isSyncing = false;
  lastSyncTime: string | null = null;

  constructor(
    public networkService: NetworkService,
    public syncService: SyncService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.networkService.currentStatus.subscribe(online => {
      this.isOnline = online;
      this.cdr.markForCheck();
    });

    this.syncService.pendingCount$.subscribe(count => {
      this.pendingCount = count;
      this.cdr.markForCheck();
    });

    this.syncService.isSyncing$.subscribe(syncing => {
      this.isSyncing = syncing;
      this.cdr.markForCheck();
    });

    this.syncService.lastSyncTime$.subscribe(time => {
      this.lastSyncTime = time;
      this.cdr.markForCheck();
    });
  }

  async manualSync(): Promise<void> {
    await this.syncService.syncPendingOperations();
  }

  toggleOfflineSimulation(): void {
    this.networkService.setConnectionStatus(!this.isOnline, true);
  }
}

