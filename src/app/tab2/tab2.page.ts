import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonList, IonItem, IonThumbnail, IonLabel, IonCard, IonCardContent, IonButton, IonIcon, IonButtons, IonModal, IonInput, IonSearchbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { trash, add, wallet, sparkles, eye } from 'ionicons/icons';
import { ApiService } from '../services/api.service';
import { MarketItem, UserInventory } from '../interfaces/models';
import { ChangeDetectorRef } from '@angular/core';
import { WeaponInspectorComponent, InspectableWeapon } from '../weapon-inspector/weapon-inspector.component';

@Component({
  selector: 'app-tab2',
  templateUrl: './tab2.page.html',
  styleUrls: ['./tab2.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonToolbar, IonTitle, IonList, IonItem, IonThumbnail, IonLabel, IonCard, IonCardContent, IonButton, IonIcon, IonButtons, IonModal, IonInput, IonSearchbar, CommonModule, FormsModule, WeaponInspectorComponent]
})
export class Tab2Page {
  inventoryItems: UserInventory[] = [];
  marketCatalog: MarketItem[] = [];
  filteredCatalog: MarketItem[] = [];
  isModalOpen = false;

  // Estado del Inspector Holográfico 3D
  isInspectorOpen = false;
  inspectedWeapon: InspectableWeapon | null = null;

  // Usuario simulado (en el futuro vendrá del login)
  currentUserId = 1;

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {
    addIcons({ trash, add, wallet, sparkles, eye });
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUserId = JSON.parse(userStr).id;
    }
  }

  newItem: UserInventory = {
    user_id: this.currentUserId,
    item_id: '',
    purchase_price: 0,
    quantity: 1
  };

  openWeaponInspector(item?: UserInventory) {
    if (item) {
      this.inspectedWeapon = {
        item_id: item.item_id,
        name: item.name || 'CS2 Weapon Skin',
        exterior: item.exterior || 'Factory New',
        rarity: item.rarity || 'Covert',
        image_url: item.image_url,
        current_price: item.current_price,
        purchase_price: item.purchase_price
      };
    } else {
      // Arma de demostración si la bóveda está vacía o sin conexión
      this.inspectedWeapon = {
        item_id: 'demo-dlore',
        name: 'AWP | Dragon Lore',
        exterior: 'Factory New',
        rarity: 'Contraband',
        image_url: 'assets/weapons/awp_dragon_lore.svg',
        current_price: 11450.00,
        purchase_price: 8900.00
      };
    }
    this.isInspectorOpen = true;
  }

  closeWeaponInspector() {
    this.isInspectorOpen = false;
  }

  onImgError(event: any) {
    if (event && event.target) {
      event.target.src = 'assets/weapons/cs2_fallback.svg';
    }
  }



  ionViewWillEnter() {
    this.loadInventory();
    this.loadCatalog(); // Para llenar la lista del modal
  }

  loadInventory() {
    this.apiService.getInventories().subscribe({
      next: (data) => {
        // Filtrar simulando sesión iniciada
        this.inventoryItems = data.filter(item => item.user_id == this.currentUserId);
        this.cdr.detectChanges(); // Forzar actualización visual
      },
      error: (err) => console.error('Error cargando inventario', err)
    });
  }

  loadCatalog() {
    this.apiService.getMarketItems().subscribe({
      next: (data) => {
        this.marketCatalog = data;
        this.filteredCatalog = data.slice(0, 20);
      },
      error: (err) => console.error('Error cargando catálogo', err)
    });
  }

  filterCatalog(event: any) {
    const term = event.target.value.trim();
    if (!term) {
      this.filteredCatalog = this.marketCatalog.slice(0, 20);
      return;
    }
    this.apiService.searchMarketItems(term).subscribe({
      next: (data) => {
        this.filteredCatalog = data;
      },
      error: (err) => console.error('Error buscando', err)
    });
  }

  selectItemForModal(item: MarketItem) {
    this.newItem.item_id = item.item_id;
  }

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }

  addInventoryItem() {
    if (!this.newItem.item_id || this.newItem.purchase_price < 0) return;
    
    // Asegurarnos de que asigne el ID del usuario actual de la sesión
    this.newItem.user_id = this.currentUserId;

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
