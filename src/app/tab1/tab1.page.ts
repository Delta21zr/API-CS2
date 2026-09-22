import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonItem, IonBadge, IonSearchbar, IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCardSubtitle } from '@ionic/angular';
import { ApiService } from '../services/api.service';
import { MarketItem } from '../interfaces/models';

@Component({
  selector: 'app-tab1',
  templateUrl: './tab1.page.html',
  styleUrls: ['./tab1.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonToolbar, IonTitle, IonItem, IonBadge, IonSearchbar, IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCardSubtitle, CommonModule, FormsModule]
})
export class Tab1Page implements OnInit {
  marketItems: MarketItem[] = [];
  filteredItems: MarketItem[] = [];
  searchTerm: string = '';

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadItems();
  }

  loadItems() {
    this.apiService.getMarketItems().subscribe({
      next: (data) => {
        this.marketItems = data;
        this.filteredItems = data;
      },
      error: (err) => console.error('Error cargando items', err)
    });
  }

  filterItems(event: any) {
    const term = event.target.value.trim();
    this.searchTerm = term;
    
    if (!term) {
      this.filteredItems = this.marketItems;
      return;
    }

    this.apiService.searchMarketItems(term).subscribe({
      next: (data) => {
        this.filteredItems = data;
      },
      error: (err) => console.error('Error buscando items', err)
    });
  }

  // Helper color para la rareza
  getRarityColor(rarity: string | undefined): string {
    if (!rarity) return 'medium';
    const r = rarity.toLowerCase();
    if (r.includes('covert')) return 'danger';
    if (r.includes('classified')) return 'tertiary'; // Rosa/Morado
    if (r.includes('restricted')) return 'secondary'; // Morado oscuro
    if (r.includes('mil-spec')) return 'primary'; // Azul
    if (r.includes('industrial')) return 'medium'; // Celeste
    return 'dark'; // Consumer grade o cajas
  }
}