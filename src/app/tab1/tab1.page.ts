import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent, IonIcon, IonList, IonListHeader, IonLabel, IonItem, IonThumbnail } from '@ionic/angular';
import axios from 'axios';
import { addIcons } from 'ionicons';
import { caretUp } from 'ionicons/icons';

@Component({
  selector: 'app-tab1',
  templateUrl: './tab1.page.html',
  styleUrls: ['./tab1.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent, IonIcon, IonList, IonListHeader, IonLabel, IonItem, IonThumbnail, CommonModule, FormsModule]
})
export class Tab1Page implements AfterViewInit {
  loginData = { username: '', password: '' };

  constructor() {
    addIcons({ caretUp });
  }

  ngAfterViewInit() {
    // La vista ya no necesita PaperJS
  }

  async onLogin() {
    try {
      const apiUrl = 'http://localhost/api_ionic/login.php';
      const response = await axios.post(apiUrl, this.loginData);
      if (response.data.success) {
        alert('Login exitoso: ' + response.data.message);
      } else {
        alert('Error: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error al conectar con la API', error);
      alert('No se pudo conectar con el servidor.');
    }
  }
}