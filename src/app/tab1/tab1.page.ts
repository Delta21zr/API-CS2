import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent, IonIcon, IonList, IonListHeader, IonLabel, IonItem, IonThumbnail, IonButton, IonInput, IonButtons } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { caretUp, trash, pencil } from 'ionicons/icons';
import { ApiService } from '../services/api.service';
import { MarketItem } from '../interfaces/models';

@Component({
  selector: 'app-tab1',
  templateUrl: './tab1.page.html',
  styleUrls: ['./tab1.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent, IonIcon, IonList, IonListHeader, IonLabel, IonItem, IonThumbnail, IonButton, IonInput, IonButtons, CommonModule, FormsModule]
})
export class Tab1Page implements OnInit {
  marketItems: MarketItem[] = [];
  newItem: MarketItem = { item_id: '', name: '', current_price: 0 };

  constructor(private apiService: ApiService) {
    addIcons({ caretUp, trash, pencil });
  }

  ngOnInit() {
    this.loadItems();
  }

  loadItems() {
    this.apiService.getMarketItems().subscribe({
      next: (data) => this.marketItems = data,
      error: (err) => console.error('Error cargando items', err)
    });
  }

  addItem() {
    if(!this.newItem.item_id || !this.newItem.name) return;
    this.apiService.createMarketItem(this.newItem).subscribe({
      next: () => {
        this.loadItems();
        this.newItem = { item_id: '', name: '', current_price: 0 }; // reset
      },
      error: (err) => console.error('Error creando', err)
    });
  }

  deleteItem(id: string) {
    this.apiService.deleteMarketItem(id).subscribe({
      next: () => this.loadItems(),
      error: (err) => console.error('Error borrando', err)
    });
  }
}