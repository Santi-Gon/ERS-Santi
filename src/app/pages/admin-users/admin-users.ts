import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService } from 'primeng/api';

import { PermissionService } from '../../services/permission.service';
import { HasPermissionDirective } from '../../directives/has-permission.directive';

const ALL_PERMISSIONS = [
  'ticket_add','ticket_edit','ticket_delete','ticket_view',
  'groups_add','groups_edit','groups_delete',
  'users_add','users_edit','users_delete','users_view',
];

export interface AppUser {
  id: number;
  nombre: string;
  email: string;
  rol: 'Admin' | 'Editor' | 'Viewer';
  permisos: string[];
  activo: boolean;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  providers: [ConfirmationService],
  imports: [
    CommonModule, FormsModule,
    CardModule, ButtonModule, TableModule, DialogModule,
    InputTextModule, TagModule, ChipModule, DividerModule,
    SelectModule, ConfirmDialogModule, TooltipModule,
    HasPermissionDirective
  ],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css'
})
export class AdminUsers implements OnInit {
  private permissionService = inject(PermissionService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);

  users: AppUser[] = [];
  editUser!: AppUser;
  userDialog: boolean = false;
  isEditing: boolean = false;
  submitted: boolean = false;

  allPermissions = ALL_PERMISSIONS;

  // Grouped labels for the permissions dialog
  permGroups = [
    { label: 'Tickets', key: 'ticket', perms: ALL_PERMISSIONS.filter(p => p.startsWith('ticket')) },
    { label: 'Grupos',  key: 'groups', perms: ALL_PERMISSIONS.filter(p => p.startsWith('groups')) },
    { label: 'Usuarios',key: 'users',  perms: ALL_PERMISSIONS.filter(p => p.startsWith('users'))  },
  ];

  // Permissions dialog state
  permDialog: boolean = false;
  permUser!: AppUser;
  tempPerms: Set<string> = new Set();

  rolOptions = [
    { label: 'Admin',  value: 'Admin'  },
    { label: 'Editor', value: 'Editor' },
    { label: 'Viewer', value: 'Viewer' },
  ];

  ngOnInit() {
    this.users = [
      { id: 1, nombre: 'Juan Pérez',   email: 'juan.perez@ers.com',  rol: 'Admin',  activo: true,
        permisos: [...ALL_PERMISSIONS] },
      { id: 2, nombre: 'María Gómez',  email: 'maria.gomez@ers.com', rol: 'Editor', activo: true,
        permisos: ['ticket_add','ticket_edit','ticket_view','groups_edit'] },
      { id: 3, nombre: 'Carlos Ruiz',  email: 'carlos.ruiz@ers.com', rol: 'Viewer', activo: true,
        permisos: ['ticket_view'] },
      { id: 4, nombre: 'Ana Flores',   email: 'ana.flores@ers.com',  rol: 'Editor', activo: false,
        permisos: ['ticket_add','ticket_edit','ticket_view'] },
      { id: 5, nombre: 'Luis Torres',  email: 'luis.torres@ers.com', rol: 'Viewer', activo: true,
        permisos: ['ticket_view','groups_edit'] },
    ];
  }

  openNew() {
    this.editUser = { id: 0, nombre: '', email: '', rol: 'Viewer', permisos: [], activo: true };
    this.isEditing = true;
    this.submitted = false;
    this.userDialog = true;
  }

  editRow(u: AppUser) {
    this.editUser = { ...u, permisos: [...u.permisos] };
    this.isEditing = true;
    this.submitted = false;
    this.userDialog = true;
  }

  closeDialog() { this.userDialog = false; this.submitted = false; }

  saveUser() {
    this.submitted = true;
    if (!this.editUser.nombre.trim() || !this.editUser.email.trim()) return;
    if (this.editUser.id === 0) {
      this.editUser.id = Math.max(...this.users.map(u => u.id), 0) + 1;
      this.users = [...this.users, { ...this.editUser }];
    } else {
      this.users = this.users.map(u => u.id === this.editUser.id ? { ...this.editUser } : u);
    }
    this.closeDialog();
  }

  confirmDelete(u: AppUser) {
    this.confirmationService.confirm({
      message: `¿Eliminar al usuario "${u.nombre}"? Esta acción no se puede deshacer.`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.users = this.users.filter(x => x.id !== u.id);
      }
    });
  }

  toggleActive(u: AppUser) {
    this.users = this.users.map(x => x.id === u.id ? { ...x, activo: !x.activo } : x);
  }

  // ── Permissions dialog ───────────────────────────────────────────────
  openPermDialog(u: AppUser) {
    this.permUser = u;
    this.tempPerms = new Set(u.permisos);
    this.permDialog = true;
  }

  hasPerm(p: string): boolean {
    return this.tempPerms.has(p);
  }

  togglePerm(p: string) {
    if (this.tempPerms.has(p)) {
      this.tempPerms.delete(p);
    } else {
      this.tempPerms.add(p);
    }
  }

  savePerms() {
    const updated = Array.from(this.tempPerms);
    this.users = this.users.map(u =>
      u.id === this.permUser.id ? { ...u, permisos: updated } : u
    );
    this.permDialog = false;
  }

  closePermDialog() { this.permDialog = false; }

  rolSeverity(r: string): 'danger' | 'warn' | 'info' {
    return r === 'Admin' ? 'danger' : r === 'Editor' ? 'warn' : 'info';
  }
}
