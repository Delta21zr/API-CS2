import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonList, IonItem, IonCheckbox, IonThumbnail, IonLabel, IonButton, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { flask, checkmarkCircle, closeCircle } from 'ionicons/icons';
import { ApiService } from '../services/api.service';
import { UserInventory, MarketItem } from '../interfaces/models';

@Component({
  selector: 'app-tab4',
  templateUrl: './tab4.page.html',
  styleUrls: ['./tab4.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonList, IonItem, IonCheckbox, IonThumbnail, IonLabel, IonButton, IonIcon, CommonModule, FormsModule]
})
export class Tab4Page implements OnInit {
  inventoryItems: UserInventory[] = [];
  marketCatalog: MarketItem[] = [];
  
  // Guardamos un map con el ID del inventario -> boolean (seleccionado)
  selectedItems: { [key: number]: boolean } = {};
  
  resultItem: MarketItem | null = null;
  totalCost: number = 0;
  isSimulating: boolean = false;

  currentUserId = 1;

  constructor(private apiService: ApiService) {
    addIcons({ flask, checkmarkCircle, closeCircle });
  }

  ngOnInit() {
    this.loadData();
  }

  ionViewWillEnter() {
    // Recargar inventario cada vez que entra a la pestaña por si compró nuevas armas
    this.loadData();
    this.resetSimulation();
  }

  loadData() {
    this.apiService.getInventories().subscribe({
      next: (data) => {
        this.inventoryItems = data.filter(item => item.user_id == this.currentUserId);
      }
    });

    this.apiService.getMarketItems().subscribe({
      next: (data) => {
        this.marketCatalog = data;
      }
    });
  }

  get selectedCount(): number {
    return Object.values(this.selectedItems).filter(v => v).length;
  }

  toggleSelection(item: UserInventory) {
    if (!item.id) return;
    
    // Si ya seleccionó 10 y está intentando agregar otro, bloqueamos
    if (this.selectedCount >= 10 && !this.selectedItems[item.id]) {
      // Ignorar, ya llegó al límite
      return;
    }
    
    this.selectedItems[item.id] = !this.selectedItems[item.id];
    this.calculateCost();
  }

  calculateCost() {
    this.totalCost = this.inventoryItems
      .filter(item => item.id && this.selectedItems[item.id])
      .reduce((acc, curr) => acc + curr.purchase_price, 0);
  }

  simulateTradeUp() {
    if (this.selectedCount !== 10) return;
    if (this.marketCatalog.length === 0) return;

    this.isSimulating = true;
    this.resultItem = null;

    // Efecto visual de "Ruleta"
    setTimeout(() => {
      // PROTOTIPO: Escoger un arma aleatoria del catálogo completo
      // (En la versión final, se filtraría por rareza +1 y misma colección)
      const randomIndex = Math.floor(Math.random() * this.marketCatalog.length);
      this.resultItem = this.marketCatalog[randomIndex];
      this.isSimulating = false;
    }, 1500);
  }

  resetSimulation() {
    this.selectedItems = {};
    this.resultItem = null;
    this.totalCost = 0;
    this.isSimulating = false;
  }

  getProfitOrLoss() {
    if (!this.resultItem) return 0;
    return (this.resultItem.current_price || 0) - this.totalCost;
  }
}
