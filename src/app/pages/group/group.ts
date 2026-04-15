import { Component, OnInit, inject } from '@angular/core';
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
  totalCount = 0;
  loading: boolean = false;

  // Add Member Dialog states
  addMemberDialog: boolean = false;
  newMemberEmail: string = '';
  addMemberSubmitted: boolean = false;
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
        finalize(() => (this.loading = false)),
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
    this.groups = this.groups.filter(val => val.id !== g.id);
    this.groupDialog = false;
    this.updateTotalCount();
  }

  hideDialog() {
    this.groupDialog = false;
    this.submitted = false;
  }

  saveGroup() {
    this.submitted = true;

    if (this.group.nombre?.trim()) {
      if (this.group.id) {
        this.groups[this.findIndexById(this.group.id)] = this.group;
      } else {
        this.group.id = this.createId();
        this.groups.push(this.group);
      }

      this.groups = [...this.groups];
      this.groupDialog = false;
      this.group = {};
      this.updateTotalCount();
    }
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
    this.selectedGroupForMember = null;
  }

  saveMember() {
    this.addMemberSubmitted = true;

    // Simulate sending invitation and adding member if email is valid-ish
    if (this.newMemberEmail?.trim().includes('@')) {
      if (this.selectedGroupForMember) {
        // Find group and increment integrantes
        const index = this.findIndexById(this.selectedGroupForMember.id!);
        if (index !== -1) {
           const currentIntegrantes = this.groups[index].integrantes || 0;
           this.groups[index].integrantes = currentIntegrantes + 1;
           // Trigger change detection for pure pipes/components by re-assigning
           this.groups = [...this.groups];
        }
      }
      this.closeAddMemberDialog();
    }
  }

  findIndexById(id: string): number {
    let index = -1;
    for (let i = 0; i < this.groups.length; i++) {
        if (this.groups[i].id === id) {
            index = i;
            break;
        }
    }
    return index;
  }

  createId(): string {
    let id = '';
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for ( var i = 0; i < 5; i++ ) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }
}
