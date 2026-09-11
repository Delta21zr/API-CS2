
import { Routes } from '@angular/router';

export const routes: Routes = [
  // Ruta por defecto que redirige al login apenas abre la app
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage)
  },
  // La ruta de tus pestañas (las protege o las cargas tras loguear)
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  }
];