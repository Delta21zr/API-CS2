
import { Component, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular';
import { Router } from '@angular/router'; // Para redirigir tras el login
import { PaperScope, Path, Group, Color, Point, Size } from 'paper';
import axios from 'axios';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule]
})
export class LoginPage implements AfterViewInit {
  @ViewChild('canvasElement', { static: true }) canvasElement!: ElementRef<HTMLCanvasElement>;

  // Variables de interfaz
  slideBoxMargin: string = '50%';
  topLayerMargin: string = '0';

  // Variables de Formulario
  loginData = { username: '', password: '' };
  signupData = { email: '', username: '', password: '' };

  // Variables de PaperJS
  scope!: paper.PaperScope;
  shapeGroup: any;
  positionArray: any[] = [];
  canvasWidth!: number;
  canvasHeight!: number;
  canvasMiddleX!: number;
  canvasMiddleY!: number;

  constructor(private router: Router) { }

  // ======================
  // Peticiones HTTP con Axios
  // ======================
  async onLogin() {
    try {
      // Reemplaza con la URL local o pública de tu script PHP
      const apiUrl = 'http://localhost/tu_proyecto/login.php';

      const response = await axios.post(apiUrl, this.loginData);

      if (response.data.success) {
        console.log('Login exitoso:', response.data.message);
        // Redirigir a las tabs una vez logueado
        this.router.navigate(['/']);
      } else {
        alert('Error: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error al conectar con la API', error);
      alert('No se pudo conectar con el servidor.');
    }
  }

  onSignup() {
    console.log('Datos listos para registrar:', this.signupData);
    // Aquí iría tu petición axios.post('.../signup.php', this.signupData)
  }

  // ======================
  // Toggle Animado UI
  // ======================
  goToSignup() {
    this.slideBoxMargin = '0';
    this.topLayerMargin = '100%';
  }

  goToLogin() {
    if (window.innerWidth > 769) {
      this.slideBoxMargin = '50%';
    } else {
      this.slideBoxMargin = '20%';
    }
    this.topLayerMargin = '0';
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (this.topLayerMargin === '0' && window.innerWidth <= 769) {
      this.slideBoxMargin = '20%';
    } else if (this.topLayerMargin === '0' && window.innerWidth > 769) {
      this.slideBoxMargin = '50%';
    }
  }

  // ======================
  // Initiate Canvas Seguro
  // ======================
  ngAfterViewInit() {
    this.initPaper();
  }

  initPaper() {
    const canvas = this.canvasElement.nativeElement;
    if (canvas.offsetWidth === 0 || canvas.offsetHeight === 0) {
      setTimeout(() => this.initPaper(), 50);
      return;
    }
    this.scope = new PaperScope();
    this.scope.setup(canvas);
    this.scope.view.viewSize = new Size(canvas.offsetWidth, canvas.offsetHeight);

    this.shapeGroup = new this.scope.Group();
    this.initializeShapes();

    this.scope.view.onFrame = (event: any) => {
      if (event.count % 4 === 0) {
        for (let i = 0; i < this.shapeGroup.children.length; i++) {
          if (i % 2 === 0) {
            this.shapeGroup.children[i].rotate(-0.1);
          } else {
            this.shapeGroup.children[i].rotate(0.1);
          }
        }
      }
    };

    this.scope.view.onResize = (event: any) => {
      this.getCanvasBounds();
      for (let i = 0; i < this.shapeGroup.children.length; i++) {
        this.shapeGroup.children[i].position = this.positionArray[i];
      }
      if (this.canvasWidth < 700) {
        this.shapeGroup.children[3].opacity = 0;
        this.shapeGroup.children[2].opacity = 0;
        this.shapeGroup.children[5].opacity = 0;
      } else {
        this.shapeGroup.children[3].opacity = 1;
        this.shapeGroup.children[2].opacity = 1;
        this.shapeGroup.children[5].opacity = 1;
      }
    };
  }

  getCanvasBounds() {
    this.canvasWidth = this.scope.view.size.width;
    this.canvasHeight = this.scope.view.size.height;
    this.canvasMiddleX = this.canvasWidth / 2;
    this.canvasMiddleY = this.canvasHeight / 2;

    const position1 = { x: (this.canvasMiddleX / 2) + 100, y: 100 };
    const position2 = { x: 200, y: this.canvasMiddleY };
    const position3 = { x: (this.canvasMiddleX - 50) + (this.canvasMiddleX / 2), y: 150 };
    const position4 = { x: 0, y: this.canvasMiddleY + 100 };
    const position5 = { x: this.canvasWidth - 130, y: this.canvasHeight - 75 };
    const position6 = { x: this.canvasMiddleX + 80, y: this.canvasHeight - 50 };
    const position7 = { x: this.canvasWidth + 60, y: this.canvasMiddleY - 50 };
    const position8 = { x: this.canvasMiddleX + 100, y: this.canvasMiddleY + 100 };

    this.positionArray = [
      new Point(position3.x, position3.y), new Point(position2.x, position2.y),
      new Point(position5.x, position5.y), new Point(position4.x, position4.y),
      new Point(position1.x, position1.y), new Point(position6.x, position6.y),
      new Point(position7.x, position7.y), new Point(position8.x, position8.y)
    ];
  }

  initializeShapes() {
    this.getCanvasBounds();
    const shapePathData = [
      'M231,352l445-156L600,0L452,54L331,3L0,48L231,352', 'M0,0l64,219L29,343l535,30L478,37l-133,4L0,0z',
      'M0,65l16,138l96,107l270-2L470,0L337,4L0,65z', 'M333,0L0,94l64,219L29,437l570-151l-196-42L333,0',
      'M331.9,3.6l-331,45l231,304l445-156l-76-196l-148,54L331.9,3.6z', 'M389,352l92-113l195-43l0,0l0,0L445,48l-80,1L122.7,0L0,275.2L162,297L389,352',
      'M 50 100 L 300 150 L 550 50 L 750 300 L 500 250 L 300 450 L 50 100', 'M 700 350 L 500 350 L 700 500 L 400 400 L 200 450 L 250 350 L 100 300 L 150 50 L 350 100 L 250 150 L 450 150 L 400 50 L 550 150 L 350 250 L 650 150 L 650 50 L 700 150 L 600 250 L 750 250 L 650 300 L 700 350'
    ];

    for (let i = 0; i < shapePathData.length; i++) {
      const headerShape = new this.scope.Path(shapePathData[i]);
      headerShape.strokeColor = new Color('rgba(255, 255, 255, 0.5)');
      headerShape.strokeWidth = 2;
      headerShape.scale(2);
      headerShape.position = this.positionArray[i];
      this.shapeGroup.addChild(headerShape);
    }
  }
}