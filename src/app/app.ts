import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PermissionService } from './services/permission.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'

  
})
export class App {
  constructor(private permsSvc: PermissionService) {
    // Al login, cargar permisos del JWT
    const jwtPerms = [
      'groups_view', 'groups_edit', 'groups_delete', 'groups_add',
      'group_view', 'group_edit', 'group_delte', 'group_add', 
      'user_view', 'users_view', 'users_edit', 'user_edit', 'users_add', 'user_add', 'users_delete', 'user_delete',
      'ticket_view', 'tickets_view', 'ticket_add', 'tickets_add', 'ticket_edit', 'tickets_edit', 'tickets_delete', 'ticket_delete'
    ];
    this.permsSvc.setPermissions(jwtPerms);
  }

  protected readonly title = signal('ERS-Santi');

}
