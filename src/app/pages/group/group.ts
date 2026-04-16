import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { TagModule } from 'primeng/tag';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { ChipModule } from 'primeng/chip';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { GroupsService } from '../../services/groups.service';
import { PermissionService } from '../../services/permission.service';
import { UsersService } from '../../services/users.service';
import { catchError, finalize, of } from 'rxjs';

export interface AppGroup {
  id?: string;
  lider?: string | null;
  lider_id?: string | null;
  creador_id?: string | null;
  nombre?: string;
  integrantes?: number;
  tickets?: number;
  descripcion?: string;
  members?: string[];
}

interface GroupPermissionMemberVM {
  id: string;
  nombre_completo: string;
  email: string | null;
  permission_names: string[];
  selected_permissions: string[];
}

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    CardModule, 
    TagModule,
    DialogModule, 
    ButtonModule, 
    InputTextModule, 
    SelectModule,
    ChipModule,
    AvatarModule,
    AvatarGroupModule,
    DividerModule,
    ToastModule,
    ProgressSpinnerModule,
    HasPermissionDirective
  ],
  providers: [MessageService],
  templateUrl: './group.html',
  styleUrl: './group.css',
})
export class Group implements OnInit {
  private groupsService = inject(GroupsService);
  private messageService = inject(MessageService);
  private permissionService = inject(PermissionService);
  private usersService = inject(UsersService);
  private route = inject(ActivatedRoute);

  groups: AppGroup[] = [];
  group!: AppGroup;
  
  groupDialog: boolean = false;
  submitted: boolean = false;
  savingGroup: boolean = false;
  totalCount = 0;
  loading: boolean = false;
  isLoadingPage = signal(true);

  // Add Member Dialog states
  addMemberDialog: boolean = false;
  newMemberEmail: string = '';
  addMemberSubmitted: boolean = false;
  savingMember: boolean = false;
  selectedGroupForMember: AppGroup | null = null;
  currentUserId = '';
  isGlobalAdmin = false;

  // Manage group permissions dialog
  managePermissionsDialog = false;
  selectedGroupForPermissions: AppGroup | null = null;
  permissionsLoading = false;
  permissionsSaving = false;
  availablePermissionOptions: Array<{ nombre: string; descripcion: string | null }> = [];
  memberPermissionRows: GroupPermissionMemberVM[] = [];
  leaderOptions: Array<{ label: string; value: string }> = [];
  selectedLeaderId: string | null = null;
  private editingSnapshot: { nombre: string; descripcion: string; lider_id: string | null } | null =
    null;

  ngOnInit() {
    this.isGlobalAdmin = this.permissionService.hasPermission('users_delete');
    this.usersService
      .getMe()
      .pipe(catchError(() => of(null)))
      .subscribe((meRes: any) => {
        if (meRes?.data?.length) {
          this.currentUserId = meRes.data[0].id;
        }
        this.loadGroups();
      });
  }

  loadGroups() {
    this.loading = true;
    this.groupsService
      .getMyGroups()
      .pipe(
        catchError((err) => {
          const msg =
            err?.error?.data?.[0]?.message ??
            'No se pudieron cargar los grupos.';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: msg,
          });
          return of({ statusCode: 500, intOpCode: 1, data: [] as any[] });
        }),
        finalize(() => {
          this.loading = false;
          this.isLoadingPage.set(false);
        }),
      )
      .subscribe((res) => {
        const rows = res.data ?? [];
        this.groups = rows.map((g: any) => ({
          id: g.id,
          nombre: g.nombre,
          descripcion: g.descripcion ?? undefined,
          lider: g.autor ?? null,
          lider_id: g.lider_id ?? null,
          creador_id: g.creador_id ?? null,
          integrantes: g.integrantes ?? 0,
          tickets: g.tickets ?? 0,
          members: g.members ?? [],
        }));
        this.updateTotalCount();
        this.openPermissionsFromQueryParamIfAny();
      });
  }

  private openPermissionsFromQueryParamIfAny() {
    const groupId = this.route.snapshot.queryParamMap.get('managePermissions');
    if (!groupId) return;
    const target = this.groups.find((g) => g.id === groupId);
    if (!target) return;
    if (!this.canManageGroupPermissions(target)) return;
    this.openManagePermissionsDialog(target);
  }

  updateTotalCount() {
    this.totalCount = this.groups.length;
  }

  openNew() {
    this.group = {};
    this.submitted = false;
    this.groupDialog = true;
  }

  editGroup(g: AppGroup) {
    this.group = { ...g };
    this.selectedLeaderId = g.lider_id ?? null;
    this.editingSnapshot = {
      nombre: g.nombre ?? '',
      descripcion: g.descripcion ?? '',
      lider_id: g.lider_id ?? null,
    };
    this.leaderOptions = [];
    if (this.isGlobalAdmin && g.id) {
      this.groupsService
        .getGroupMemberPermissions(g.id)
        .pipe(catchError(() => of(null)))
        .subscribe((res: any) => {
          const payload = res?.data?.[0];
          const members = payload?.members ?? [];
          this.leaderOptions = members.map((m: any) => ({
            label: m.nombre_completo,
            value: m.id,
          }));
        });
    }
    this.groupDialog = true;
  }

  deleteGroup(g: AppGroup) {
    if (!g.id) return;
    this.groupsService
      .deleteGroup(g.id)
      .pipe(
        catchError((err) => {
          const msg =
            err?.error?.data?.[0]?.message ??
            'No se pudo eliminar el grupo.';
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
          detail: res.data?.[0]?.message ?? 'Grupo eliminado correctamente.',
        });
        this.groupDialog = false;
        this.loadGroups();
      });
  }

  hideDialog() {
    this.groupDialog = false;
    this.submitted = false;
    this.savingGroup = false;
    this.leaderOptions = [];
    this.selectedLeaderId = null;
    this.editingSnapshot = null;
  }

  saveGroup() {
    this.submitted = true;

    if (!this.group.nombre?.trim()) return;

    this.savingGroup = true;
    const payload = {
      nombre: this.group.nombre.trim(),
      descripcion: this.group.descripcion?.trim() || undefined,
    };

    if (this.group.id) {
      const previous = this.editingSnapshot;
      const nextNombre = payload.nombre ?? '';
      const nextDescripcion = payload.descripcion ?? '';
      const hasGroupChanges =
        !previous ||
        nextNombre !== previous.nombre ||
        nextDescripcion !== previous.descripcion;
      const hasLeaderChange =
        this.isGlobalAdmin &&
        !!this.selectedLeaderId &&
        this.selectedLeaderId !== previous?.lider_id;

      const onDone = (okMessage?: string) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Listo',
          detail: okMessage ?? 'Grupo actualizado correctamente.',
        });
        this.groupDialog = false;
        this.group = {};
        this.hideDialog();
        this.loadGroups();
      };

      const applyLeaderUpdateIfNeeded = () => {
        if (!hasLeaderChange || !this.selectedLeaderId) {
          this.savingGroup = false;
          onDone();
          return;
        }
        this.groupsService
          .updateLider(this.group.id!, this.selectedLeaderId)
          .pipe(
            catchError((err) => {
              const msg =
                err?.error?.data?.[0]?.message ??
                'No se pudo actualizar el líder del grupo.';
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: msg,
              });
              return of(null);
            }),
          )
          .subscribe((leaderRes) => {
            this.savingGroup = false;
            if (!leaderRes) return;
            onDone(leaderRes.data?.[0]?.message ?? 'Grupo y líder actualizados correctamente.');
          });
      };

      if (hasGroupChanges) {
        this.groupsService
          .updateGroup(this.group.id, payload)
          .pipe(
            catchError((err) => {
              const msg =
                err?.error?.data?.[0]?.message ??
                'No se pudo actualizar el grupo.';
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: msg,
              });
              this.savingGroup = false;
              return of(null);
            }),
          )
          .subscribe((groupRes) => {
            if (!groupRes) return;
            applyLeaderUpdateIfNeeded();
          });
      } else {
        applyLeaderUpdateIfNeeded();
      }
      return;
    }

    this.groupsService
      .createGroup(payload)
      .pipe(
        catchError((err) => {
          const msg =
            err?.error?.data?.[0]?.message ??
            'No se pudo crear el grupo.';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: msg,
          });
          return of(null);
        }),
        finalize(() => this.savingGroup = false)
      )
      .subscribe((res) => {
        if (!res) return;
        this.messageService.add({
          severity: 'success',
          summary: 'Listo',
          detail: res.data?.[0]?.message ?? 'Grupo creado correctamente.',
        });
        this.groupDialog = false;
        this.group = {};
        this.loadGroups();
      });
  }

  // --- Add Member Functionality ---
  openAddMemberDialog(g: AppGroup) {
    this.selectedGroupForMember = g;
    this.newMemberEmail = '';
    this.addMemberSubmitted = false;
    this.addMemberDialog = true;
  }

  closeAddMemberDialog() {
    this.addMemberDialog = false;
    this.newMemberEmail = '';
    this.addMemberSubmitted = false;
    this.savingMember = false;
    this.selectedGroupForMember = null;
  }

  saveMember() {
    this.addMemberSubmitted = true;

    if (!this.newMemberEmail?.trim().includes('@')) return;
    if (!this.selectedGroupForMember || !this.selectedGroupForMember.id) return;

    this.savingMember = true;
    const payload = { email: this.newMemberEmail.trim() };

    this.groupsService
      .addMember(this.selectedGroupForMember.id, payload)
      .pipe(
        catchError((err) => {
          const msg =
            err?.error?.data?.[0]?.message ??
            'No se pudo añadir al integrante.';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: msg,
          });
          return of(null);
        }),
        finalize(() => this.savingMember = false)
      )
      .subscribe((res) => {
        if (!res) return;
        this.messageService.add({
          severity: 'success',
          summary: 'Listo',
          detail: res.data?.[0]?.message ?? 'Integrante añadido correctamente.',
        });
        this.closeAddMemberDialog();
        this.loadGroups();
      });
  }

  canManageGroupPermissions(g: AppGroup): boolean {
    if (!g.id) return false;
    return (
      this.isGlobalAdmin ||
      g.creador_id === this.currentUserId ||
      g.lider_id === this.currentUserId
    );
  }

  openManagePermissionsDialog(g: AppGroup) {
    if (!g.id) return;
    if (!this.canManageGroupPermissions(g)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin acceso',
        detail: 'No tienes permiso para gestionar permisos internos en este grupo.',
      });
      return;
    }

    this.selectedGroupForPermissions = g;
    this.managePermissionsDialog = true;
    this.permissionsLoading = true;
    this.availablePermissionOptions = [];
    this.memberPermissionRows = [];

    this.groupsService
      .getGroupMemberPermissions(g.id)
      .pipe(
        catchError((err) => {
          const msg =
            err?.error?.data?.[0]?.message ??
            'No se pudieron cargar los permisos internos del grupo.';
          this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
          return of(null);
        }),
        finalize(() => (this.permissionsLoading = false)),
      )
      .subscribe((res: any) => {
        if (!res?.data?.length) return;
        const payload = res.data[0];
        this.availablePermissionOptions = payload.available_permissions ?? [];
        this.memberPermissionRows = (payload.members ?? []).map((m: any) => ({
          id: m.id,
          nombre_completo: m.nombre_completo,
          email: m.email,
          permission_names: m.permission_names ?? [],
          selected_permissions: [...(m.permission_names ?? [])],
        }));
      });
  }

  closeManagePermissionsDialog() {
    this.managePermissionsDialog = false;
    this.permissionsLoading = false;
    this.permissionsSaving = false;
    this.selectedGroupForPermissions = null;
    this.memberPermissionRows = [];
    this.availablePermissionOptions = [];
  }

  canEditMemberPermissions(member: GroupPermissionMemberVM): boolean {
    if (!this.selectedGroupForPermissions) return false;
    const isCreator = this.selectedGroupForPermissions.creador_id === this.currentUserId;
    const isSelf = member.id === this.currentUserId;
    // Regla solicitada: si quien edita es creador, no puede editar sus propios permisos.
    if (isCreator && isSelf) return false;
    return true;
  }

  toggleAllPermissions(member: GroupPermissionMemberVM, checked: boolean) {
    if (!this.canEditMemberPermissions(member)) return;
    member.selected_permissions = checked
      ? this.availablePermissionOptions.map((p) => p.nombre)
      : [];
  }

  togglePermission(member: GroupPermissionMemberVM, permissionName: string, checked: boolean) {
    if (!this.canEditMemberPermissions(member)) return;
    if (checked) {
      if (!member.selected_permissions.includes(permissionName)) {
        member.selected_permissions = [...member.selected_permissions, permissionName];
      }
      return;
    }
    member.selected_permissions = member.selected_permissions.filter(
      (name) => name !== permissionName,
    );
  }

  isAllSelected(member: GroupPermissionMemberVM): boolean {
    if (this.availablePermissionOptions.length === 0) return false;
    return member.selected_permissions.length === this.availablePermissionOptions.length;
  }

  saveMemberPermissions(member: GroupPermissionMemberVM) {
    if (!this.selectedGroupForPermissions?.id) return;
    if (!this.canEditMemberPermissions(member)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Regla de seguridad',
        detail: 'Como creador del grupo no puedes editar tus propios permisos.',
      });
      return;
    }

    this.permissionsSaving = true;
    this.groupsService
      .updateGroupMemberPermissions(
        this.selectedGroupForPermissions.id,
        member.id,
        member.selected_permissions,
      )
      .pipe(
        catchError((err) => {
          const msg =
            err?.error?.data?.[0]?.message ??
            'No se pudieron actualizar los permisos del integrante.';
          this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
          return of(null);
        }),
        finalize(() => (this.permissionsSaving = false)),
      )
      .subscribe((res: any) => {
        if (!res) return;
        member.permission_names = [...member.selected_permissions];
        this.messageService.add({
          severity: 'success',
          summary: 'Listo',
          detail: res?.data?.[0]?.message ?? 'Permisos actualizados correctamente.',
        });
      });
  }

  // findIndexById/createId removidos: el backend controla UUIDs.
}
