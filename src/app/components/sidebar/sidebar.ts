import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { HasPermissionDirective } from '../../directives/has-permission.directive';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, ButtonModule, RippleModule, AvatarModule, HasPermissionDirective],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent {
  menuItems = [
    { label: 'Inicio', icon: 'pi pi-home', routerLink: '/home' },
    { label: 'Grupos', icon: 'pi pi-users', routerLink: '/group',
      permissions: ['groups_edit', 'groups_delete', 'groups_add'] },
    { label: 'Administración', icon: 'pi pi-shield', routerLink: '/admin/users',
      permissions: ['users_add', 'users_edit', 'users_delete', 'users_view'] },
  ];
}