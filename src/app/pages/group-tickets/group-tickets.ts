import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { ChipModule } from 'primeng/chip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { PermissionService } from '../../services/permission.service';
import { HasPermissionDirective } from '../../directives/has-permission.directive';

import { TicketsService, BackendTicket } from '../../services/tickets.service';
import { GroupsService } from '../../services/groups.service';
import { UsersService } from '../../services/users.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

export interface Ticket {
  id: string; // was number, now UUID string
  titulo: string;
  descripcion: string;
  estado: string; // 'pendiente' | 'en progreso' | 'revisión' | 'finalizada'
  prioridad: string; // 'Alta' | 'Media' | 'Baja'
  asignadoId: string | null;
  asignadoNombre: string;
  autorId: string;
  autorNombre: string;
  fechaCreacion: string | Date;
  fechaLimite: string | Date | null;
  historialCambios: any[];
  comentariosArray: any[];
  comentariosText?: string;
}

const CURRENT_USER = 'Juan Pérez';

@Component({
  selector: 'app-group-tickets',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    CardModule, ButtonModule, TagModule, TableModule,
    DialogModule, InputTextModule, TextareaModule, SelectModule,
    TooltipModule, DividerModule, ChipModule, ToastModule,
    ProgressSpinnerModule,
    HasPermissionDirective
  ],
  providers: [MessageService],
  templateUrl: './group-tickets.html',
  styleUrl: './group-tickets.css'
})
export class GroupTickets implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private permissionService = inject(PermissionService);
  private ticketsService = inject(TicketsService);
  private messageService = inject(MessageService);
  private usersService = inject(UsersService);
  private groupsService = inject(GroupsService);

  groupId!: string; // Backend usa UUID (string) pero supongamos que lo extraemos de la URL. Si la URL tenia numeros, esto es string.
  groupName: string = '';
  isKanbanView: boolean = false;

  // ── Filters ───────────────────────────────────────────────────────────
  filterMine: boolean = false;
  filterUnassigned: boolean = false;
  filterHighPriority: boolean = false;

  // ── DnD state ─────────────────────────────────────────────────────────
  draggingTicket: Ticket | null = null;
  dropTargetColumn: string | null = null;

  // ── Dialog state ──────────────────────────────────────────────────────
  ticketDialog: boolean = false;
  isEditing: boolean = false;
  editTicket!: Ticket;
  submitted: boolean = false;

  // ── Options for selects ───────────────────────────────────────────────
  estadoOptions = [
    { label: 'Pendiente',   value: 'pendiente' },
    { label: 'En Progreso', value: 'en progreso' },
    { label: 'Revisión',    value: 'revisión' },
    { label: 'Finalizada',  value: 'finalizada' },
  ];

  prioridadOptions = [
    { label: 'Alta', value: 'Alta' },
    { label: 'Media', value: 'Media' },
    { label: 'Baja',  value: 'Baja' },
  ];

  // Esto se debería llenar con la llamada a grupos (para simplificar usamos un mock adaptado a ID)
  // Miembros reales del sistema:
  miembroOptions: { label: string, value: string }[] = [];
  allUsers: any[] | null = null;
  groupMemberNames: string[] | null = null;
  currentUserId: string | null = null;
  isAdmin: boolean = false;

  private groupsMap: Record<string, string> = {
    '101': 'Desarrollo Frontend',
    '102': 'Soporte Nivel 2',
    '103': 'QA & Testing',
  };

  tickets: Ticket[] = [];
  loading = false;
  savingTicket = false;
  isLoadingPage = signal(true);
  private pendingRequests = 0;

  // ── Stats ──────────────────────────────────────────────────────────────
  get totalTickets()    { return this.filteredTickets.length; }
  get countPendiente()  { return this.filteredTickets.filter(t => t.estado === 'pendiente').length; }
  get countEnProgreso() { return this.filteredTickets.filter(t => t.estado === 'en progreso').length; }
  get countRevision()   { return this.filteredTickets.filter(t => t.estado === 'revisión').length; }
  get countFinalizada() { return this.filteredTickets.filter(t => t.estado === 'finalizada').length; }

  // ── Filtered list (applies active filters) ────────────────────────────
  get filteredTickets(): Ticket[] {
    let result = this.tickets;
    if (this.filterMine)          result = result.filter(t => t.asignadoNombre === CURRENT_USER);
    if (this.filterUnassigned)    result = result.filter(t => !t.asignadoId);
    if (this.filterHighPriority)  result = result.filter(t => t.prioridad === 'Alta');
    return result;
  }

  // ── Kanban by status ──────────────────────────────────────────────────
  get kanbanPendiente()  { return this.filteredTickets.filter(t => t.estado === 'pendiente'); }
  get kanbanEnProgreso() { return this.filteredTickets.filter(t => t.estado === 'en progreso'); }
  get kanbanRevision()   { return this.filteredTickets.filter(t => t.estado === 'revisión'); }
  get kanbanFinalizada() { return this.filteredTickets.filter(t => t.estado === 'finalizada'); }

  // ── Permissions ───────────────────────────────────────────────────────
  get canAdd()    { return this.permissionService.hasPermission('ticket_add'); }
  get canEdit()   { return this.permissionService.hasPermission('ticket_edit'); }
  get canDelete() { return this.permissionService.hasPermission('ticket_delete'); }

  // ── Severity helpers ──────────────────────────────────────────────────
  prioridadSeverity(p: string): 'danger' | 'warn' | 'success' {
    return p === 'Alta' ? 'danger' : p === 'Media' ? 'warn' : 'success';
  }

  estadoSeverity(e: string): 'secondary' | 'info' | 'warn' | 'success' {
    switch (e) {
      case 'pendiente':   return 'secondary';
      case 'en progreso': return 'info';
      case 'revisión':    return 'warn';
      case 'finalizada':  return 'success';
      default:            return 'secondary';
    }
  }

  ngOnInit() {
    this.groupId = this.route.snapshot.paramMap.get('id') || '';
    this.groupName = `Cargando...`;
    
    this.isLoadingPage.set(true);
    this.pendingRequests = 3;

    this.loadGroupDetails();
    this.loadTickets();
    this.loadUsersOptions();
    
    // Obtener información del usuario actual para reglas
    this.usersService.getMe().subscribe((res) => {
      if (res && res.data && res.data.length > 0) {
        this.currentUserId = res.data[0].id;
        this.isAdmin = this.permissionService.hasPermission('users_delete'); // Asumimos users_delete como super admin
      }
    });
  }

  private decrementPending() {
    this.pendingRequests--;
    if (this.pendingRequests <= 0) {
      this.isLoadingPage.set(false);
    }
  }

  loadGroupDetails() {
    this.groupsService.getGrupoById(this.groupId).pipe(
      catchError(() => of(null)),
      finalize(() => this.decrementPending())
    ).subscribe((res: any) => {
      if (res && res.data && res.data.length > 0) {
          const g = res.data[0];
          this.groupName = g.nombre || `Grupo ${this.groupId}`;
          this.groupMemberNames = g.members || [];
      } else {
          this.groupName = `Grupo ${this.groupId}`;
          this.groupMemberNames = [];
      }
      this.buildMiembroOptions();
    });
  }

  loadUsersOptions() {
    this.usersService.getAllUsers().pipe(
      catchError(() => of({ data: [] })),
      finalize(() => this.decrementPending())
    ).subscribe((res: any) => {
      this.allUsers = res.data ?? [];
      this.buildMiembroOptions();
    });
  }

  buildMiembroOptions() {
    if (this.allUsers !== null && this.groupMemberNames !== null) {
      const filteredUsers = this.allUsers.filter((u: any) => this.groupMemberNames!.includes(u.nombre_completo));
      this.miembroOptions = filteredUsers.map((u: any) => ({
        label: u.nombre_completo,
        value: u.id
      }));
    }
  }

  loadTickets() {
    this.loading = true;
    this.ticketsService.getTicketsByGroup(this.groupId).pipe(
      catchError(err => {
        this.messageService.add({severity: 'error', detail: 'No se pudieron cargar los tickets'});
        return of([]);
      }),
      finalize(() => {
        this.loading = false;
        this.decrementPending();
      })
    ).subscribe((res: any) => {
      const data = res.data ?? [];
      this.tickets = data.map((b: any) => ({
        id: b.id,
        titulo: b.titulo,
        descripcion: b.descripcion || '',
        estado: b.estado?.nombre || 'pendiente',
        prioridad: b.prioridad?.nombre || 'Media',
        asignadoId: b.asignado?.id || null,
        asignadoNombre: b.asignado?.nombre_completo || '',
        autorId: b.autor?.id,
        autorNombre: b.autor?.nombre_completo || '',
        fechaCreacion: b.creado_en,
        fechaLimite: b.fecha_final || null,
        historialCambios: b.historial || [],
        comentariosArray: b.comentarios || []
      }));
    });
  }

  // ── Navigation ────────────────────────────────────────────────────────
  goBack() { this.router.navigate(['/home']); }

  // ── Filters ───────────────────────────────────────────────────────────
  toggleFilter(filter: 'mine' | 'unassigned' | 'high') {
    if (filter === 'mine')       this.filterMine = !this.filterMine;
    if (filter === 'unassigned') this.filterUnassigned = !this.filterUnassigned;
    if (filter === 'high')       this.filterHighPriority = !this.filterHighPriority;
  }

  // ── Drag and Drop ─────────────────────────────────────────────────────
  onDragStart(ticket: Ticket) {
    this.draggingTicket = ticket;
  }

  onDragOver(event: DragEvent, estado: string) {
    event.preventDefault();
    this.dropTargetColumn = estado;
  }

  onDragLeave() {
    this.dropTargetColumn = null;
  }

  onDrop(event: DragEvent, newEstado: string) {
    event.preventDefault();
    if (!this.draggingTicket) return;

    // Regla de Negocio: Sólo admin, autor o asignado pueden mover estados
    if (!this.canEditStatus(this.draggingTicket)) {
      this.messageService.add({severity:'error', summary:'Denegado', detail: 'No tienes permiso para mover este ticket.'});
      this.draggingTicket = null;
      this.dropTargetColumn = null;
      return;
    }

    if (this.draggingTicket.estado !== newEstado) {
      const ticketId = this.draggingTicket.id;
      // Actualizamos localmente para fluidez visual rápida
      const idx = this.tickets.findIndex(t => t.id === ticketId);
      if (idx !== -1) {
        this.tickets[idx].estado = newEstado;
        this.tickets = [...this.tickets]; 
      }
      
      // Enviamos a la API
      this.ticketsService.updateTicketState(ticketId, newEstado).pipe(
        catchError(err => {
          this.messageService.add({severity:'error', detail: 'No se pudo actualizar el estado'});
          this.loadTickets(); // rollback
          return of(null);
        })
      ).subscribe();
    }
    this.draggingTicket = null;
    this.dropTargetColumn = null;
  }

  // ── Dialog ─────────────────────────────────────────────────────────────
  canEditFull(ticket: Ticket): boolean {
    if (!ticket || ticket.id === '') return true; // Si es nuevo, puede
    return this.isAdmin || (this.currentUserId !== null && this.currentUserId === ticket.autorId);
  }

  canEditStatus(ticket: Ticket): boolean {
    if (!ticket || ticket.id === '') return true;
    return this.canEditFull(ticket) || (this.currentUserId !== null && this.currentUserId === ticket.asignadoId);
  }

  openNew() {
    this.isEditing = true;
    this.submitted = false;
    this.editTicket = {
      id: '', titulo: '', descripcion: '',
      estado: 'pendiente', prioridad: 'Media', asignadoId: null, asignadoNombre: '',
      autorId: '', autorNombre: '',
      fechaCreacion: new Date(), fechaLimite: null,
      comentariosArray: [], historialCambios: []
    };
    this.ticketDialog = true;
  }

  openTicket(t: Ticket, editMode: boolean = false) {
    this.submitted = false;
    this.isEditing = editMode;
    this.editTicket = { ...t, historialCambios: [...t.historialCambios] };
    this.ticketDialog = true;
  }

  closeDialog() { this.ticketDialog = false; this.submitted = false; this.savingTicket = false; }

  saveTicket() {
    this.submitted = true;
    if (!this.editTicket.titulo?.trim()) return;

    this.savingTicket = true;
    if (!this.editTicket.id || this.editTicket.id === '') {
      // Create
      const payload = {
        grupo_id: this.groupId,
        titulo: this.editTicket.titulo,
        descripcion: this.editTicket.descripcion || undefined,
        estado_nombre: this.editTicket.estado,
        prioridad_nombre: this.editTicket.prioridad,
        asignado_id: this.editTicket.asignadoId || undefined,
        fecha_final: this.editTicket.fechaLimite ? new Date(this.editTicket.fechaLimite).toISOString() : undefined
      };
      
      this.ticketsService.createTicket(payload).pipe(
        catchError(err => {
          this.messageService.add({severity: 'error', detail: err.error?.data?.[0]?.message || 'Error al crear', summary: 'Error'});
          return of(null);
        }),
        finalize(() => this.savingTicket = false)
      ).subscribe(res => {
        if(res) {
          this.messageService.add({severity: 'success', detail: 'Ticket creado'});
          this.closeDialog();
          this.loadTickets();
        }
      });
    } else {
      // Update
      const payload = {
        titulo: this.editTicket.titulo,
        descripcion: this.editTicket.descripcion || undefined,
        prioridad_nombre: this.editTicket.prioridad,
        asignado_id: this.editTicket.asignadoId || null,
        fecha_final: this.editTicket.fechaLimite ? new Date(this.editTicket.fechaLimite).toISOString() : null
      };

      this.ticketsService.updateTicket(this.editTicket.id, payload).pipe(
        catchError(err => {
          this.messageService.add({severity: 'error', detail: err.error?.data?.[0]?.message || 'Error al actualizar', summary: 'Error'});
          return of(null);
        }),
        finalize(() => this.savingTicket = false)
      ).subscribe(res => {
        if(res) {
          this.messageService.add({severity: 'success', detail: 'Ticket actualizado'});
          this.closeDialog();
          this.loadTickets();
        }
      });
    }
  }

  deleteTicket(t: Ticket) {
    this.ticketsService.deleteTicket(t.id).pipe(
      catchError(err => {
        this.messageService.add({severity: 'error', detail: err.error?.data?.[0]?.message || 'Error al eliminar', summary: 'Error'});
        return of(null);
      })
    ).subscribe(res => {
      if(res) {
        this.messageService.add({severity: 'success', detail: 'Ticket eliminado'});
        this.loadTickets();
      }
      this.closeDialog();
    });
  }
}
