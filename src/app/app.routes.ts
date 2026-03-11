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
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout').then(m => m.MainLayout),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home').then(m => m.Home)
      },
      {
        path: 'user',
        loadComponent: () => import('./pages/user/user').then(m => m.User)
      },
      {
        path: 'group',
        loadComponent: () => import('./pages/group/group').then(m => m.Group)
      },
      {
        path: 'group/:id/tickets',
        loadComponent: () => import('./pages/group-tickets/group-tickets').then(m => m.GroupTickets)
      }
    ]
  },
  { 
    path: '**', 
    redirectTo: '' 
  }
];
