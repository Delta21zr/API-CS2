import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent, IonIcon, IonItem, IonSpinner, IonSearchbar, IonList, IonThumbnail, IonLabel } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { trendingUp, trendingDown, analytics, search } from 'ionicons/icons';
import { ApiService } from '../services/api.service';
import { MarketItem, PriceHistory } from '../interfaces/models';
import { ChartConfiguration, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-tab3',
  templateUrl: './tab3.page.html',
  styleUrls: ['./tab3.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent, IonIcon, IonItem, IonSpinner, IonSearchbar, IonList, IonThumbnail, IonLabel, CommonModule, FormsModule, BaseChartDirective]
})
export class Tab3Page implements OnInit {
  marketCatalog: MarketItem[] = [];
  filteredCatalog: MarketItem[] = [];
  searchTerm: string = '';
  
  selectedItem: MarketItem | null = null;
  selectedItemId: string = '';
  
  isLoading = false;
  assistantMessage = '';
  assistantTitle = '';
  assistantColor = '';
  
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

  constructor(private apiService: ApiService) {
    addIcons({ trendingUp, trendingDown, analytics, search });
  }

  ngOnInit() {
    this.apiService.getMarketItems().subscribe({
      next: (data) => {
        this.marketCatalog = data;
      },
      error: (err) => console.error(err)
    });
  }

  filterCatalog(event: any) {
    const term = event.target.value.toLowerCase();
    this.searchTerm = term;
    
    if (!term) {
      this.filteredCatalog = [];
      return;
    }
    
    this.filteredCatalog = this.marketCatalog.filter(item => 
      item.name.toLowerCase().includes(term)
    ).slice(0, 10); // Mostrar máximo 10 sugerencias
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
    console.log("Iniciando petición a API para:", this.selectedItemId);
    
    this.apiService.getPriceHistory(this.selectedItemId).subscribe({
      next: (history: PriceHistory[]) => {
        console.log("Respuesta de API recibida, registros:", history ? history.length : 'null/undefined');
        try {
          if (history && history.length > 0) {
            this.processChartData(history);
            this.generateAssistantAdvice(history);
          } else {
            console.warn("El historial está vacío");
          }
        } catch (e) {
          console.error("Error procesando historia:", e);
        } finally {
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error("Error en HTTP GET:", err);
        this.isLoading = false;
      }
    });
  }

  processChartData(history: PriceHistory[]) {
    const labels = history.map(h => {
      const date = new Date(h.recorded_at);
      return `${date.getDate()}/${date.getMonth()+1}`;
    });
    const prices = history.map(h => Number(h.price));

    this.lineChartData = {
      datasets: [
        {
          data: prices,
          label: 'Precio ($)',
          backgroundColor: 'rgba(76, 175, 80, 0.2)',
          borderColor: 'rgba(76, 175, 80, 1)',
          pointBackgroundColor: 'rgba(76, 175, 80, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(76, 175, 80, 0.8)',
          fill: 'origin',
        }
      ],
      labels: labels
    };
  }

  generateAssistantAdvice(history: PriceHistory[]) {
    if (history.length < 2) {
      this.assistantTitle = 'Datos Insuficientes';
      this.assistantMessage = 'No hay suficiente historial para dar una recomendación.';
      this.assistantColor = 'medium';
      return;
    }

    const firstPrice = Number(history[0].price);
    const lastPrice = Number(history[history.length - 1].price);
    const diff = lastPrice - firstPrice;
    const diffPercentage = (diff / firstPrice) * 100;

    if (diffPercentage > 10) {
      this.assistantColor = 'success';
      this.assistantTitle = '🔥 ¡Excelente Momento para Vender!';
      this.assistantMessage = `El precio ha subido un ${diffPercentage.toFixed(2)}% en los últimos 30 días. La tendencia es fuertemente alcista. Si la tienes en tu inventario, vender ahora te dará buen profit.`;
    } else if (diffPercentage < -10) {
      this.assistantColor = 'primary'; // Azul en ionic
      this.assistantTitle = '🛒 ¡Momento Ideal de Compra!';
      this.assistantMessage = `El precio ha caído un ${Math.abs(diffPercentage).toFixed(2)}% este mes. Ha tocado un valle, por lo que es una gran oportunidad para comprar barato y esperar el rebote.`;
    } else {
      this.assistantColor = 'warning';
      this.assistantTitle = '⚖️ Mercado Estable';
      this.assistantMessage = `El precio ha variado un ${diffPercentage.toFixed(2)}%. La tendencia es neutra. Te recomendamos "Hold" (mantener) o esperar a una clara ruptura del mercado antes de operar.`;
    }
  }
}
