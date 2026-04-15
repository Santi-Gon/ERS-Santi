import { Component, EventEmitter, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { RippleModule } from 'primeng/ripple';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, AvatarModule, MenuModule, RippleModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();

  private router = inject(Router);
  private authService = inject(AuthService);

  currentUser = {
    name: 'Invitado',
    email: 'invitado@domain.com',
    initials: 'IN'
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
      command: () => {
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    }
  ];

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUser.name = user.nombre_completo || user.usuario || 'Usuario';
      this.currentUser.email = user.email || user.correo || '';
      
      // Compute Initials
      const parts = this.currentUser.name.split(' ').map(s => s.trim()).filter(Boolean);
      this.currentUser.initials = parts.length > 1 
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : this.currentUser.name.substring(0, 2).toUpperCase();
    }
  }

  onToggle() {
    this.toggleSidebar.emit();
  }
}

