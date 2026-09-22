import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent, IonIcon, IonItem, IonSpinner, IonSearchbar, IonList, IonThumbnail, IonLabel, IonSegment, IonSegmentButton } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { trendingUp, trendingDown, analytics, search } from 'ionicons/icons';
import { ApiService } from '../services/api.service';
import { MarketItem, PriceHistory } from '../interfaces/models';
import { ChartConfiguration, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-tab3',
  templateUrl: './tab3.page.html',
  styleUrls: ['./tab3.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent, IonIcon, IonItem, IonSpinner, IonSearchbar, IonList, IonThumbnail, IonLabel, IonSegment, IonSegmentButton, CommonModule, FormsModule, BaseChartDirective]
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
    addIcons({ trendingUp, trendingDown, analytics, search });
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
          label: 'Precio ($)',
          backgroundColor: 'rgba(76, 175, 80, 0.2)',
          borderColor: 'rgba(76, 175, 80, 1)',
          pointRadius: prices.length === 1 ? 5 : 0, // <-- Muestra el punto si solo hay 1 dato
          pointHoverRadius: 6,
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
