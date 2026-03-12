import { Component, OnInit, inject } from '@angular/core';
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

import { PermissionService } from '../../services/permission.service';
import { HasPermissionDirective } from '../../directives/has-permission.directive';

export interface Ticket {
  id: number;
  titulo: string;
  descripcion: string;
  estado: 'pendiente' | 'en progreso' | 'revisión' | 'finalizada';
  asignadoA: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  fechaCreacion: Date;
  fechaLimite: Date;
  comentarios: string;
  historialCambios: string[];
}

const CURRENT_USER = 'Juan Pérez';

@Component({
  selector: 'app-group-tickets',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    CardModule, ButtonModule, TagModule, TableModule,
    DialogModule, InputTextModule, TextareaModule, SelectModule,
    TooltipModule, DividerModule, ChipModule,
    HasPermissionDirective
  ],
  templateUrl: './group-tickets.html',
  styleUrl: './group-tickets.css'
})
export class GroupTickets implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private permissionService = inject(PermissionService);

  groupId!: number;
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

  miembros = ['Juan Pérez', 'María Gómez', 'Carlos Ruiz', 'Ana Flores', 'Luis Torres'];
  miembroOptions = this.miembros.map(m => ({ label: m, value: m }));

  private groupsMap: Record<number, string> = {
    101: 'Desarrollo Frontend',
    102: 'Soporte Nivel 2',
    103: 'QA & Testing',
  };

  // ── Mock Tickets ──────────────────────────────────────────────────────
  allGroupTickets: Ticket[] = [
    {
      id: 1, titulo: 'Error en pantalla de login', descripcion: 'Usuarios no pueden iniciar sesión desde Firefox.',
      estado: 'pendiente', asignadoA: 'Juan Pérez', prioridad: 'Alta',
      fechaCreacion: new Date('2026-03-01'), fechaLimite: new Date('2026-03-15'),
      comentarios: 'Reproducido en Firefox 121+.', historialCambios: ['Creado el 01/03/2026']
    },
    {
      id: 2, titulo: 'Actualizar dependencias npm', descripcion: 'Varias dependencias tienen vulnerabilidades.',
      estado: 'en progreso', asignadoA: 'María Gómez', prioridad: 'Media',
      fechaCreacion: new Date('2026-03-02'), fechaLimite: new Date('2026-03-20'),
      comentarios: '', historialCambios: ['Creado el 02/03/2026', 'Iniciado el 05/03/2026']
    },
    {
      id: 3, titulo: 'Agregar dark mode al dashboard', descripcion: 'Implementar modo oscuro.',
      estado: 'pendiente', asignadoA: '', prioridad: 'Baja',
      fechaCreacion: new Date('2026-03-03'), fechaLimite: new Date('2026-04-01'),
      comentarios: '', historialCambios: ['Creado el 03/03/2026']
    },
    {
      id: 4, titulo: 'Optimizar consultas SQL lentas', descripcion: 'Varias rutas tardan más de 3s.',
      estado: 'revisión', asignadoA: 'Ana Flores', prioridad: 'Alta',
      fechaCreacion: new Date('2026-03-04'), fechaLimite: new Date('2026-03-18'),
      comentarios: 'Índices añadidos.', historialCambios: ['Creado el 04/03/2026', 'En revisión el 09/03/2026']
    },
    {
      id: 5, titulo: 'Corrección de typos en docs', descripcion: 'Archivos README con errores tipográficos.',
      estado: 'finalizada', asignadoA: 'Juan Pérez', prioridad: 'Baja',
      fechaCreacion: new Date('2026-02-28'), fechaLimite: new Date('2026-03-10'),
      comentarios: 'Completado.', historialCambios: ['Creado el 28/02/2026', 'Finalizado el 08/03/2026']
    },
    {
      id: 6, titulo: 'Pruebas de regresión módulo pagos', descripcion: 'Suite completa de tests antes del release v2.',
      estado: 'en progreso', asignadoA: 'Luis Torres', prioridad: 'Alta',
      fechaCreacion: new Date('2026-03-05'), fechaLimite: new Date('2026-03-22'),
      comentarios: '70% completado.', historialCambios: ['Creado el 05/03/2026']
    },
    {
      id: 7, titulo: 'Refactorizar AuthService', descripcion: 'El AuthService tiene demasiadas responsabilidades.',
      estado: 'pendiente', asignadoA: '', prioridad: 'Media',
      fechaCreacion: new Date('2026-03-06'), fechaLimite: new Date('2026-03-30'),
      comentarios: '', historialCambios: ['Creado el 06/03/2026']
    },
    {
      id: 8, titulo: 'Paginación al listado de usuarios', descripcion: 'La tabla carga todos los registros.',
      estado: 'revisión', asignadoA: 'Carlos Ruiz', prioridad: 'Media',
      fechaCreacion: new Date('2026-03-07'), fechaLimite: new Date('2026-03-25'),
      comentarios: '', historialCambios: ['Creado el 07/03/2026']
    },
  ];

  tickets: Ticket[] = [];

  // ── Stats ──────────────────────────────────────────────────────────────
  get totalTickets()    { return this.filteredTickets.length; }
  get countPendiente()  { return this.filteredTickets.filter(t => t.estado === 'pendiente').length; }
  get countEnProgreso() { return this.filteredTickets.filter(t => t.estado === 'en progreso').length; }
  get countRevision()   { return this.filteredTickets.filter(t => t.estado === 'revisión').length; }
  get countFinalizada() { return this.filteredTickets.filter(t => t.estado === 'finalizada').length; }

  // ── Filtered list (applies active filters) ────────────────────────────
  get filteredTickets(): Ticket[] {
    let result = this.tickets;
    if (this.filterMine)          result = result.filter(t => t.asignadoA === CURRENT_USER);
    if (this.filterUnassigned)    result = result.filter(t => !t.asignadoA || t.asignadoA === '');
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
    this.groupId = Number(this.route.snapshot.paramMap.get('id'));
    this.groupName = this.groupsMap[this.groupId] ?? `Grupo ${this.groupId}`;
    const groupTicketIds: Record<number, number[]> = {
      101: [1, 2, 3, 4],
      102: [4, 5, 6],
      103: [6, 7, 8],
    };
    const ids = groupTicketIds[this.groupId] ?? [];
    this.tickets = this.allGroupTickets.filter(t => ids.includes(t.id));
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

  onDrop(event: DragEvent, newEstado: Ticket['estado']) {
    event.preventDefault();
    if (this.draggingTicket && this.draggingTicket.estado !== newEstado) {
      const idx = this.tickets.findIndex(t => t.id === this.draggingTicket!.id);
      if (idx !== -1) {
        this.tickets[idx].estado = newEstado;
        this.tickets[idx].historialCambios = [
          ...this.tickets[idx].historialCambios,
          `Estado cambiado a "${newEstado}" el ${new Date().toLocaleDateString()}`
        ];
        this.tickets = [...this.tickets]; // trigger CD
      }
    }
    this.draggingTicket = null;
    this.dropTargetColumn = null;
  }

  // ── Dialog ─────────────────────────────────────────────────────────────
  openNew() {
    this.isEditing = true;
    this.submitted = false;
    this.editTicket = {
      id: 0, titulo: '', descripcion: '',
      estado: 'pendiente', asignadoA: '', prioridad: 'Media',
      fechaCreacion: new Date(), fechaLimite: new Date(),
      comentarios: '', historialCambios: []
    };
    this.ticketDialog = true;
  }

  openTicket(t: Ticket, editMode: boolean = false) {
    this.submitted = false;
    this.isEditing = editMode;
    this.editTicket = { ...t, historialCambios: [...t.historialCambios] };
    this.ticketDialog = true;
  }

  closeDialog() { this.ticketDialog = false; this.submitted = false; }

  saveTicket() {
    this.submitted = true;
    if (!this.editTicket.titulo?.trim() || !this.editTicket.asignadoA) return;
    if (this.editTicket.id === 0) {
      const newId = Math.max(...this.tickets.map(t => t.id), 0) + 1;
      const t: Ticket = { ...this.editTicket, id: newId, fechaCreacion: new Date() };
      t.historialCambios = [`Creado el ${new Date().toLocaleDateString()}`];
      this.tickets = [...this.tickets, t];
    } else {
      this.editTicket.historialCambios.push(`Editado el ${new Date().toLocaleDateString()}`);
      this.tickets = this.tickets.map(t => t.id === this.editTicket.id ? { ...this.editTicket } : t);
    }
    this.closeDialog();
  }

  deleteTicket(t: Ticket) {
    this.tickets = this.tickets.filter(x => x.id !== t.id);
    this.closeDialog();
  }
}
