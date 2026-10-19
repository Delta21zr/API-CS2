import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardContent, IonIcon, IonSpinner, IonSearchbar, IonLabel, IonSegment, IonSegmentButton } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { trendingUp, trendingDown, analytics, search, sparkles } from 'ionicons/icons';
import { ApiService } from '../services/api.service';
import { MarketItem, PriceHistory } from '../interfaces/models';
import { ChartConfiguration, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { WeaponInspectorComponent, InspectableWeapon } from '../weapon-inspector/weapon-inspector.component';

import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-tab3',
  templateUrl: './tab3.page.html',
  styleUrls: ['./tab3.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardContent, IonIcon, IonSpinner, IonSearchbar, IonLabel, IonSegment, IonSegmentButton, CommonModule, FormsModule, BaseChartDirective, WeaponInspectorComponent]
})
export class Tab3Page implements OnInit {
  marketCatalog: MarketItem[] = [];
  filteredCatalog: MarketItem[] = [];
  searchTerm: string = '';
  
  selectedItem: MarketItem | null = null;
  selectedItemId: string = '';
  
  isLoading = false;
  
  fullHistory: PriceHistory[] = [];
  selectedRange: number = 30; // por defecto 30 días

  // Estado del Inspector 3D Holográfico
  isInspectorOpen = false;
  inspectedWeapon: InspectableWeapon | null = null;

  // Vitrina rápida multimedia para inspección 3D inmediata con assets locales 100% confiables
  featuredShowcaseSkins: InspectableWeapon[] = [
    {
      item_id: 'showcase-dlore',
      name: 'AWP | Dragon Lore',
      exterior: 'Factory New',
      rarity: 'Contraband',
      current_price: 11450.00,
      image_url: 'assets/weapons/awp_dragon_lore.svg'
    },
    {
      item_id: 'showcase-karambit',
      name: '★ Karambit | Doppler (Sapphire)',
      exterior: 'Factory New',
      rarity: 'Covert Knife',
      current_price: 9850.00,
      image_url: 'assets/weapons/karambit_doppler.svg'
    },
    {
      item_id: 'showcase-ak47',
      name: 'AK-47 | Fire Serpent',
      exterior: 'Minimal Wear',
      rarity: 'Covert Rifle',
      current_price: 1420.50,
      image_url: 'assets/weapons/ak47_fire_serpent.svg'
    }
  ];

  onImgError(event: any) {
    if (event && event.target) {
      event.target.src = 'assets/weapons/cs2_fallback.svg';
    }
  }

  // Chart.js Data
  public lineChartData: ChartConfiguration['data'] = {
    datasets: [],
    labels: []
  };
  
  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      y: { position: 'left', title: { display: true, text: 'Precio ($)' } }
    }
  };
  public lineChartType: ChartType = 'line';

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {
    addIcons({ trendingUp, trendingDown, analytics, search, sparkles });
  }

  openInspectorForSelected() {
    if (this.selectedItem) {
      this.inspectedWeapon = {
        item_id: this.selectedItem.item_id,
        name: this.selectedItem.name,
        exterior: this.selectedItem.exterior || 'Factory New',
        rarity: this.selectedItem.rarity || 'Covert',
        image_url: this.selectedItem.image_url,
        current_price: this.selectedItem.current_price
      };
      this.isInspectorOpen = true;
    }
  }

  openInspectorShowcase(skin: InspectableWeapon) {
    this.inspectedWeapon = skin;
    this.isInspectorOpen = true;
  }

  closeWeaponInspector() {
    this.isInspectorOpen = false;
  }

  ngOnInit() {
    // Ya no descargamos todo el catálogo al inicio
  }

  filterCatalog(event: any) {
    const term = event.target.value.trim();
    this.searchTerm = term;
    
    if (!term) {
      this.filteredCatalog = [];
      return;
    }
    
    this.apiService.searchMarketItems(term).subscribe({
      next: (data) => {
        this.filteredCatalog = data;
      },
      error: (err) => console.error(err)
    });
  }

  selectWeapon(item: MarketItem) {
    this.selectedItem = item;
    this.selectedItemId = item.item_id;
    this.searchTerm = ''; // Limpiar buscador para ocultar la lista
    this.filteredCatalog = []; // Ocultar lista
    this.loadHistory();
  }

  loadHistory() {
    if (!this.selectedItemId) return;
    this.isLoading = true;
    
    this.apiService.getPriceHistory(this.selectedItemId).subscribe({
      next: (history: PriceHistory[]) => {
        try {
          if (history && history.length > 0) {
            this.fullHistory = history;
            this.updateChartData(); // Llama a la función que filtra según selectedRange
          }
        } catch (e) {
          console.error("Error procesando historia:", e);
        } finally {
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error("Error en HTTP GET:", err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  changeRange(days: any) {
    if (days) {
      this.selectedRange = Number(days);
      this.updateChartData();
    }
  }

  updateChartData() {
    if (this.fullHistory.length === 0) return;

    // Tomar solo los últimos X días de la historia total (que viene de más viejo a más nuevo)
    const recentHistory = this.fullHistory.slice(-this.selectedRange);

    const labels = recentHistory.map(h => {
      const date = new Date(h.recorded_at);
      return `${date.getDate()}/${date.getMonth()+1}/${date.getFullYear().toString().slice(-2)}`;
    });
    const prices = recentHistory.map(h => Number(h.price));

    this.lineChartData = {
      datasets: [
        {
          data: prices,
          label: 'Precio ($ USD)',
          backgroundColor: 'rgba(56, 189, 248, 0.18)',
          borderColor: '#38bdf8',
          pointBackgroundColor: '#f59e0b',
          pointBorderColor: '#0b0e14',
          pointRadius: prices.length === 1 ? 5 : 2,
          pointHoverRadius: 6,
          tension: 0.3,
          fill: 'origin',
        }
      ],
      labels: labels
    };
    
    // Forzar redibujado de la gráfica
    this.lineChartData = { ...this.lineChartData };
    this.cdr.detectChanges();
  }
}
