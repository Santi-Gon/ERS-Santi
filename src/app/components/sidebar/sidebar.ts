import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, RippleModule, AvatarModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  menuItems = [
    { label: 'Inicio', icon: 'pi pi-home', routerLink: '/home' },
    { label: 'Oferta Educativa', icon: 'pi pi-book', routerLink: '/oferta' }, // Ejemplo visual
    { label: 'Divisiones', icon: 'pi pi-building', routerLink: '/divisiones' } // Ejemplo visual
  ];
}
