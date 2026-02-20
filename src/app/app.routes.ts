import { Routes } from '@angular/router';

export const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./pages/landing-page/landing-page')
      .then(m => m.LandingPage) 
  },
  { 
    path: 'login', 
    loadComponent: () => import('./pages/auth/login/login')
      .then(m => m.Login)
  },
  { 
    path: 'register', 
    loadComponent: () => import('./pages/auth/register/register')
      .then(m => m.Register)
  },
  { 
    path: '**', 
    redirectTo: '' 
  }
];
