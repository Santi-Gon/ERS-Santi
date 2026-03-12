import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, AvatarModule, MenuModule, RippleModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  private router = inject(Router);

  // Mock current user
  currentUser = {
    name: 'Juan Pérez',
    email: 'juan.perez@ers.com',
    initials: 'JP'
  };

  profileMenuItems: MenuItem[] = [
    {
      label: 'Mi Perfil',
      icon: 'pi pi-user',
      command: () => this.router.navigate(['/user'])
    },
    { separator: true },
    {
      label: 'Cerrar Sesión',
      icon: 'pi pi-power-off',
      styleClass: 'text-red-400',
      command: () => this.router.navigate(['/login'])
    }
  ];

  onToggle() {
    this.toggleSidebar.emit();
  }
}
