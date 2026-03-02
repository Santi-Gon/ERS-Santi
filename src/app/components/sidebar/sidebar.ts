import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, ButtonModule, RippleModule, AvatarModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent {
  menuItems = [
    { label: 'Inicio', icon: 'pi pi-home', routerLink: '/home' },
    { label: 'Grupos', icon: 'pi pi-users', routerLink: '/group' },
    { label: 'Usuarios', icon: 'pi pi-user', routerLink: '/user' }
  ];
}