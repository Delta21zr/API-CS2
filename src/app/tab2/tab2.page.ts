import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonList, IonItem, IonThumbnail, IonLabel, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCardSubtitle, IonButton, IonIcon, IonButtons, IonModal, IonInput, IonSearchbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { trash, add, wallet } from 'ionicons/icons';
import { ApiService } from '../services/api.service';
import { MarketItem, UserInventory } from '../interfaces/models';

@Component({
  selector: 'app-tab2',
  templateUrl: './tab2.page.html',
  styleUrls: ['./tab2.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonToolbar, IonTitle, IonList, IonItem, IonThumbnail, IonLabel, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCardSubtitle, IonButton, IonIcon, IonButtons, IonModal, IonInput, IonSearchbar, CommonModule, FormsModule]
})
export class Tab2Page implements OnInit {
  inventoryItems: UserInventory[] = [];
  marketCatalog: MarketItem[] = [];
  filteredCatalog: MarketItem[] = [];
  isModalOpen = false;

  // Usuario simulado (en el futuro vendrá del login)
  currentUserId = 1;

  newItem: UserInventory = {
    user_id: this.currentUserId,
    item_id: '',
    purchase_price: 0,
    quantity: 1
  };

  constructor(private apiService: ApiService) {
    addIcons({ trash, add, wallet });
  }

  ngOnInit() {
    this.loadInventory();
    this.loadCatalog(); // Para llenar la lista del modal
  }

  loadInventory() {
    this.apiService.getInventories().subscribe({
      next: (data) => {
        // Filtrar simulando sesión iniciada
        this.inventoryItems = data.filter(item => item.user_id == this.currentUserId);
      },
      error: (err) => console.error('Error cargando inventario', err)
    });
  }

  loadCatalog() {
    this.apiService.getMarketItems().subscribe({
      next: (data) => {
        this.marketCatalog = data;
        // Solo mostrar los primeros 20 al abrir para no saturar
        this.filteredCatalog = data.slice(0, 20);
      },
      error: (err) => console.error('Error cargando catálogo', err)
    });
  }

  filterCatalog(event: any) {
    const term = event.target.value.toLowerCase();
    if (!term) {
      this.filteredCatalog = this.marketCatalog.slice(0, 20);
      return;
    }
    this.filteredCatalog = this.marketCatalog.filter(item => item.name.toLowerCase().includes(term)).slice(0, 50);
  }

  selectItemForModal(item: MarketItem) {
    this.newItem.item_id = item.item_id;
  }

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }

  addInventoryItem() {
    if (!this.newItem.item_id || this.newItem.purchase_price < 0) return;
    
    this.apiService.createInventory(this.newItem).subscribe({
      next: () => {
        this.loadInventory();
        this.setOpen(false);
        this.newItem = { user_id: this.currentUserId, item_id: '', purchase_price: 0, quantity: 1 };
      },
      error: (err) => console.error('Error guardando', err)
    });
  }

  deleteInventoryItem(id: number | undefined) {
    if(!id) return;
    this.apiService.deleteInventory(id).subscribe({
      next: () => this.loadInventory(),
      error: (err) => console.error('Error borrando', err)
    });
  }

  // Cálculos de Profit
  calculateTotalValue() {
    return this.inventoryItems.reduce((acc, curr) => acc + ((curr.current_price || 0) * (curr.quantity || 1)), 0);
  }

  calculateTotalSpent() {
    return this.inventoryItems.reduce((acc, curr) => acc + (curr.purchase_price * (curr.quantity || 1)), 0);
  }

  calculateTotalProfit() {
    return this.calculateTotalValue() - this.calculateTotalSpent();
  }
}
