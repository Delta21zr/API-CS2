import { Component } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cart, briefcase, analytics, flask } from 'ionicons/icons';

import { CommonModule } from '@angular/common';
import { settings, logOutOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, CommonModule],
})
export class TabsPage {
  isAdmin: boolean = false;

  constructor() {
    addIcons({ cart, briefcase, analytics, flask, settings, logOutOutline });
    this.checkAdminStatus();
  }

  checkAdminStatus() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      // Para este prototipo, hardcodeamos que 'alan' (o 'admin') es el administrador
      if (user.username.toLowerCase() === 'alan' || user.username.toLowerCase() === 'admin') {
        this.isAdmin = true;
      }
    }
  }

  logout() {
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
}
