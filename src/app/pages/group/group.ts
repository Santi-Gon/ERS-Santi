import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

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
import { catchError, finalize, of } from 'rxjs';

export interface AppGroup {
  id?: string;
  lider?: string | null;
  nombre?: string;
  integrantes?: number;
  tickets?: number;
  descripcion?: string;
  members?: string[];
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

  ngOnInit() {
    this.loadGroups();
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
          integrantes: g.integrantes ?? 0,
          tickets: g.tickets ?? 0,
          members: g.members ?? [],
        }));
        this.updateTotalCount();
      });
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
            return of(null);
          }),
          finalize(() => this.savingGroup = false)
        )
        .subscribe((res) => {
          if (!res) return;
          this.messageService.add({
            severity: 'success',
            summary: 'Listo',
            detail: res.data?.[0]?.message ?? 'Grupo actualizado correctamente.',
          });
          this.groupDialog = false;
          this.group = {};
          this.loadGroups();
        });
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

  // findIndexById/createId removidos: el backend controla UUIDs.
}
