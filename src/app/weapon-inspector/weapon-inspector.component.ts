import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonRange,
  IonBadge
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  close,
  sparkles,
  sync,
  download
} from 'ionicons/icons';

export interface InspectableWeapon {
  item_id?: string;
  name: string;
  exterior?: string;
  rarity?: string;
  image_url?: string;
  current_price?: number;
  purchase_price?: number;
}

@Component({
  selector: 'app-weapon-inspector',
  templateUrl: './weapon-inspector.component.html',
  styleUrls: ['./weapon-inspector.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonRange,
    IonBadge
  ]
})
export class WeaponInspectorComponent implements OnInit {
  @Input() isOpen = false;
  @Input() weapon: InspectableWeapon | null = null;
  @Output() closeInspector = new EventEmitter<void>();

  // Coordenadas 3D de inclinación e iluminación holográfica
  rotateX = 0;
  rotateY = 0;
  glareX = 50;
  glareY = 50;
  isInteracting = false;
  autoOrbit = true;

  // Estados de animación visual
  isInspectingAnim = false;

  // Parámetros de desgaste del arma
  floatValue = 0.0342;

  constructor() {
    addIcons({
      close,
      sparkles,
      sync,
      download
    });
  }

  ngOnInit() {
    this.syncFloatWithExterior();
  }

  onModalWillPresent() {
    this.syncFloatWithExterior();
    this.triggerInspectAnimation();
  }

  private syncFloatWithExterior() {
    const ext = (this.weapon?.exterior || '').toLowerCase();
    if (ext.includes('factory new') || ext.includes('recién fabricado')) {
      this.floatValue = 0.0184;
    } else if (ext.includes('minimal wear') || ext.includes('casi nuevo')) {
      this.floatValue = 0.0942;
    } else if (ext.includes('field-tested') || ext.includes('algo desgastado')) {
      this.floatValue = 0.2415;
    } else if (ext.includes('well-worn') || ext.includes('bastante desgastado')) {
      this.floatValue = 0.4120;
    } else if (ext.includes('battle-scarred') || ext.includes('deplorable')) {
      this.floatValue = 0.6890;
    } else {
      this.floatValue = 0.0342;
    }
  }

  dismiss() {
    this.closeInspector.emit();
  }

  // ==========================================================
  // INTERACCIÓN 3D TÁCTIL Y MOUSE (GIROSCOPIO / HOLOGRAMA)
  // ==========================================================
  onStagePointerMove(event: MouseEvent | TouchEvent, stageEl: HTMLElement) {
    const rect = stageEl.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if (window.TouchEvent && event instanceof TouchEvent) {
      if (event.touches.length === 0) return;
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else if (event instanceof MouseEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const percentX = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const percentY = Math.max(0, Math.min(100, (y / rect.height) * 100));

    this.glareX = percentX;
    this.glareY = percentY;

    // Convertir posición a rotación 3D (-25° a +25°)
    this.rotateY = ((percentX - 50) / 50) * 26;
    this.rotateX = ((50 - percentY) / 50) * 20;
    this.isInteracting = true;
    this.autoOrbit = false;
  }

  onStagePointerLeave() {
    this.isInteracting = false;
    this.rotateX = 0;
    this.rotateY = 0;
    this.glareX = 50;
    this.glareY = 50;
  }

  toggleAutoOrbit() {
    this.autoOrbit = !this.autoOrbit;
    if (this.autoOrbit) {
      this.rotateX = 0;
      this.rotateY = 0;
    }
  }

  // ==========================================================
  // ANIMACIÓN VISUAL DE INSPECCIÓN (GIRO 360°)
  // ==========================================================
  triggerInspectAnimation() {
    this.isInspectingAnim = false;
    setTimeout(() => {
      this.isInspectingAnim = true;
      setTimeout(() => {
        this.isInspectingAnim = false;
      }, 1350);
    }, 20);
  }

  onFloatChange(event: any) {
    const val = Number(event.detail.value);
    if (!isNaN(val)) {
      this.floatValue = Number(val.toFixed(4));
    }
  }

  getWearCategoryLabel(): string {
    if (this.floatValue < 0.07) return 'Factory New (Recién Fabricado)';
    if (this.floatValue < 0.15) return 'Minimal Wear (Casi Nuevo)';
    if (this.floatValue < 0.38) return 'Field-Tested (Algo Desgastado)';
    if (this.floatValue < 0.45) return 'Well-Worn (Bastante Desgastado)';
    return 'Battle-Scarred (Deplorable)';
  }

  getWeaponImageFilter(): string {
    // Simula el desgaste de pintura (Float Wear) sobre el arma
    const wear = this.floatValue;
    const contrast = (1 - wear * 0.22).toFixed(2);
    const brightness = (1 - wear * 0.28).toFixed(2);
    const sepia = (wear * 0.35).toFixed(2);
    const saturate = (1.15 - wear * 0.55).toFixed(2);
    return `contrast(${contrast}) brightness(${brightness}) sepia(${sepia}) saturate(${saturate}) drop-shadow(0 18px 28px rgba(0, 0, 0, 0.78))`;
  }

  onImgError(event: any) {
    if (event && event.target) {
      event.target.src = 'assets/weapons/cs2_fallback.svg';
    }
  }

  // ==========================================================
  // EXPORTAR CAPTURA MULTIMEDIA EN PNG (CANVAS RENDER)
  // ==========================================================
  exportShowcaseCard() {
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fondo estilo CS2 Bóveda
    const grad = ctx.createRadialGradient(450, 220, 40, 450, 260, 500);
    grad.addColorStop(0, '#1e293b');
    grad.addColorStop(0.6, '#0f172a');
    grad.addColorStop(1, '#070a0f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Borde neón ámbar
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

    // Textos de cabecera
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('PORTAFOLIO CS2 • FICHA DE INSPECCIÓN 3D', 44, 58);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(this.weapon?.name || 'CS2 Weapon Skin', 44, 98);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(
      `${this.getWearCategoryLabel()}  |  FLOAT: ${this.floatValue.toFixed(4)}`,
      44,
      132
    );

    if (this.weapon?.current_price !== undefined) {
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 26px monospace';
      ctx.fillText(`VALOR DE MERCADO STEAM: $${Number(this.weapon.current_price).toFixed(2)} USD`, 44, 452);
    }

    // Descargar PNG
    const triggerDownload = () => {
      const link = document.createElement('a');
      const safeName = (this.weapon?.name || 'cs2-skin').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `cs2_inspect_${safeName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    if (this.weapon?.image_url) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 240, 145, 420, 270);
        triggerDownload();
      };
      img.onerror = () => {
        triggerDownload();
      };
      img.src = this.weapon.image_url;
    } else {
      triggerDownload();
    }
  }
}
