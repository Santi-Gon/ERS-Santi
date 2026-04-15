import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { InputMaskModule } from 'primeng/inputmask';
import { MultiSelectModule } from 'primeng/multiselect';

import { PermissionService } from '../../services/permission.service';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { UsersService } from '../../services/users.service';
import { catchError, finalize, of } from 'rxjs';

const ALL_PERMISSIONS = [
  'ticket_add','ticket_edit','ticket_delete','ticket_view',
  'groups_add','groups_edit','groups_delete',
  'users_add','users_edit','users_delete','users_view',
];

export interface AppUser {
  id: string;
  nombre: string;
  email: string;
  permisos: string[];
  activo: boolean;
  // Campos para creación (fase siguiente: POST /users/add)
  usuario?: string;
  telefono?: string;
  contrasenia?: string;
  direccion?: string;
  fecha_nacimiento?: string;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  providers: [ConfirmationService, MessageService],
  imports: [
    CommonModule, FormsModule,
    CardModule, ButtonModule, TableModule, DialogModule,
    InputTextModule, TagModule, ChipModule, DividerModule,
    SelectModule, ConfirmDialogModule, TooltipModule,
    PasswordModule, InputMaskModule, MultiSelectModule,
    ToastModule,
    HasPermissionDirective
  ],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css'
})
export class AdminUsers implements OnInit {
  private permissionService = inject(PermissionService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private usersService = inject(UsersService);
  private router = inject(Router);

  users: AppUser[] = [];
  editUser!: AppUser;
  userDialog: boolean = false;
  isEditing: boolean = false;
  submitted: boolean = false;
  loading: boolean = false;

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

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.usersService
      .getAllUsers()
      .pipe(
        catchError((err) => {
          const msg =
            err?.error?.data?.[0]?.message ??
            'No se pudo cargar la lista de usuarios.';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: msg,
          });
          return of({ statusCode: 500, intOpCode: 1, data: [] as any[] });
        }),
        finalize(() => (this.loading = false)),
      )
      .subscribe((res) => {
        const rows = res.data ?? [];
        this.users = rows.map((u: any) => ({
          id: u.id,
          nombre: u.nombre_completo,
          email: u.email,
          permisos: u.permisos ?? [],
          activo: !!u.activo,
        }));
      });
  }

  openNew() {
    // UI ampliada, pero la creación real se conectará en una fase posterior.
    this.editUser = {
      id: '',
      nombre: '',
      email: '',
      permisos: [],
      activo: true,
      usuario: '',
      telefono: '',
      contrasenia: '',
      direccion: '',
      fecha_nacimiento: '',
    };
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
    if (!this.editUser.id) {
      if (!this.editUser.usuario?.trim()) return;
      if (!this.editUser.telefono?.trim()) return;
      if (!this.editUser.contrasenia?.trim()) return;

      this.usersService
        .addUser({
          nombre_completo: this.editUser.nombre.trim(),
          usuario: this.editUser.usuario.trim(),
          email: this.editUser.email.trim(),
          contrasenia: this.editUser.contrasenia,
          telefono: this.editUser.telefono,
          direccion: this.editUser.direccion?.trim() || undefined,
          fecha_nacimiento: this.editUser.fecha_nacimiento?.trim() || undefined,
          permisos_iniciales:
            this.editUser.permisos?.length ? this.editUser.permisos : undefined,
        })
        .pipe(
          catchError((err) => {
            const msg =
              err?.error?.data?.[0]?.message ?? 'No se pudo crear el usuario.';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: msg,
            });
            return of(null);
          }),
        )
        .subscribe((res) => {
          if (!res) return;
          this.messageService.add({
            severity: 'success',
            summary: 'Listo',
            detail: res.data?.[0]?.message ?? 'Usuario creado correctamente.',
          });
          this.closeDialog();
          this.loadUsers();
        });
      return;
    }

    this.usersService
      .updateUserAdmin(this.editUser.id, {
        nombre_completo: this.editUser.nombre,
        email: this.editUser.email,
        activo: this.editUser.activo,
      })
      .pipe(
        catchError((err) => {
          const msg =
            err?.error?.data?.[0]?.message ??
            'No se pudo actualizar el usuario.';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: msg,
          });
          return of(null);
        }),
      )
      .subscribe((res) => {
        if (!res) return;
        this.messageService.add({
          severity: 'success',
          summary: 'Listo',
          detail: res.data?.[0]?.message ?? 'Usuario actualizado correctamente.',
        });
        this.closeDialog();
        this.loadUsers();
      });
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
        this.usersService
          .deleteUserAdmin(u.id)
          .pipe(
            catchError((err) => {
              const msg =
                err?.error?.data?.[0]?.message ??
                'No se pudo eliminar el usuario.';
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: msg,
              });
              return of(null);
            }),
          )
          .subscribe((res) => {
            if (!res) return;
            this.messageService.add({
              severity: 'success',
              summary: 'Listo',
              detail: res.data?.[0]?.message ?? 'Usuario eliminado.',
            });
            this.loadUsers();
          });
      }
    });
  }

  toggleActive(u: AppUser) {
    const next = !u.activo;
    this.usersService
      .updateUserAdmin(u.id, { activo: next })
      .pipe(
        catchError((err) => {
          const msg =
            err?.error?.data?.[0]?.message ??
            'No se pudo actualizar el estado.';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: msg,
          });
          return of(null);
        }),
      )
      .subscribe((res) => {
        if (!res) return;
        this.messageService.add({
          severity: 'success',
          summary: 'Listo',
          detail: res.data?.[0]?.message ?? 'Estado actualizado.',
        });
        this.loadUsers();
      });
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
    this.usersService
      .updatePermissions(this.permUser.id, updated)
      .pipe(
        catchError((err) => {
          const msg =
            err?.error?.data?.[0]?.message ??
            'No se pudieron actualizar los permisos.';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: msg,
          });
          return of(null);
        }),
      )
      .subscribe((res) => {
        if (!res) return;
        this.messageService.add({
          severity: 'success',
          summary: 'Listo',
          detail:
            res.data?.[0]?.message ??
            'Permisos actualizados correctamente.',
        });
        this.permDialog = false;
        this.loadUsers();
      });
  }

  closePermDialog() { this.permDialog = false; }
}
