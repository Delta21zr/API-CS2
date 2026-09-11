import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonListHeader, IonLabel, IonItem, IonToggle, IonButton, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { notifications, notificationsOff, addCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonListHeader, IonLabel, IonItem, IonToggle, IonButton, IonIcon],
})
export class Tab3Page {
  constructor() {
    addIcons({ notifications, notificationsOff, addCircleOutline });
  }
}
