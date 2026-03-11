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
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';

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

@Component({
  selector: 'app-group-tickets',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TagModule,
    TableModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    ToggleButtonModule,
    TooltipModule,
    DividerModule,
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

  // ── Dialog state ──────────────────────────────────────────────────────
  ticketDialog: boolean = false;
  isEditing: boolean = false;
  selectedTicket!: Ticket;
  submitted: boolean = false;

  // ── Editable copy used by the form ─────────────────────────────────────
  editTicket!: Ticket;

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

  // ── Mock member list ─────────────────────────────────────────────────
  miembros = ['Juan Pérez', 'María Gómez', 'Carlos Ruiz', 'Ana Flores', 'Luis Torres'];
  miembroOptions = this.miembros.map(m => ({ label: m, value: m }));

  // ── Mock groups lookup ────────────────────────────────────────────────
  private groupsMap: Record<number, string> = {
    101: 'Desarrollo Frontend',
    102: 'Soporte Nivel 2',
    103: 'QA & Testing',
  };

  // ── Mock Tickets (all groups combined) ────────────────────────────────
  allTickets: Ticket[] = [
    {
      id: 1, titulo: 'Error en pantalla de login', descripcion: 'Los usuarios no pueden iniciar sesión desde Firefox.',
      estado: 'pendiente', asignadoA: 'Juan Pérez', prioridad: 'Alta',
      fechaCreacion: new Date('2026-03-01'), fechaLimite: new Date('2026-03-15'),
      comentarios: 'Reproducido en Firefox 121+.', historialCambios: ['Creado el 01/03/2026']
    },
    {
      id: 2, titulo: 'Actualizar dependencias npm', descripcion: 'Varias dependencias tienen vulnerabilidades conocidas.',
      estado: 'en progreso', asignadoA: 'María Gómez', prioridad: 'Media',
      fechaCreacion: new Date('2026-03-02'), fechaLimite: new Date('2026-03-20'),
      comentarios: '', historialCambios: ['Creado el 02/03/2026', 'Iniciado el 05/03/2026']
    },
    {
      id: 3, titulo: 'Agregar dark mode al dashboard', descripcion: 'Implementar modo oscuro que respete la preferencia del sistema.',
      estado: 'pendiente', asignadoA: 'Carlos Ruiz', prioridad: 'Baja',
      fechaCreacion: new Date('2026-03-03'), fechaLimite: new Date('2026-04-01'),
      comentarios: 'Usar media query prefers-color-scheme.', historialCambios: ['Creado el 03/03/2026']
    },
    {
      id: 4, titulo: 'Optimizar consultas SQL lentas', descripcion: 'Varias rutas de la API tardan más de 3 segundos.',
      estado: 'revisión', asignadoA: 'Ana Flores', prioridad: 'Alta',
      fechaCreacion: new Date('2026-03-04'), fechaLimite: new Date('2026-03-18'),
      comentarios: 'Índices añadidos, pendiente pruebas de carga.', historialCambios: ['Creado el 04/03/2026', 'En revisión el 09/03/2026']
    },
    {
      id: 5, titulo: 'Corrección de typos en documentación', descripcion: 'Varios archivos README tienen errores tipográficos menores.',
      estado: 'finalizada', asignadoA: 'Juan Pérez', prioridad: 'Baja',
      fechaCreacion: new Date('2026-02-28'), fechaLimite: new Date('2026-03-10'),
      comentarios: 'Completado.', historialCambios: ['Creado el 28/02/2026', 'Finalizado el 08/03/2026']
    },
    {
      id: 6, titulo: 'Pruebas de regresión del módulo de pagos', descripcion: 'Suite completa de tests antes del release v2.',
      estado: 'en progreso', asignadoA: 'Luis Torres', prioridad: 'Alta',
      fechaCreacion: new Date('2026-03-05'), fechaLimite: new Date('2026-03-22'),
      comentarios: '70% completado.', historialCambios: ['Creado el 05/03/2026']
    },
    {
      id: 7, titulo: 'Refactorizar servicio de autenticación', descripcion: 'El AuthService tiene demasiadas responsabilidades.',
      estado: 'pendiente', asignadoA: 'María Gómez', prioridad: 'Media',
      fechaCreacion: new Date('2026-03-06'), fechaLimite: new Date('2026-03-30'),
      comentarios: '', historialCambios: ['Creado el 06/03/2026']
    },
    {
      id: 8, titulo: 'Agregar paginación al listado de usuarios', descripcion: 'La tabla carga todos los registros sin paginar.',
      estado: 'pendiente', asignadoA: 'Carlos Ruiz', prioridad: 'Media',
      fechaCreacion: new Date('2026-03-07'), fechaLimite: new Date('2026-03-25'),
      comentarios: '', historialCambios: ['Creado el 07/03/2026']
    },
  ];

  // ── Filtered: only tickets for the requested group ────────────────────
  // (Simulated: group 101 gets id 1-3, 102 gets id 4-5, 103 gets id 6-8)
  tickets: Ticket[] = [];

  // ── Stats (assigned tickets by priority — upper cards) ─────────────────
  alta = 0;
  media = 0;
  baja = 0;

  // ── Permission shortcuts (read in template via permissionService) ──────
  get canAdd()    { return this.permissionService.hasPermission('ticket_add'); }
  get canEdit()   { return this.permissionService.hasPermission('ticket_edit'); }
  get canDelete() { return this.permissionService.hasPermission('ticket_delete'); }

  // ── Kanban computed ────────────────────────────────────────────────────
  get ticketsAlta()  { return this.tickets.filter(t => t.prioridad === 'Alta'); }
  get ticketsMedia() { return this.tickets.filter(t => t.prioridad === 'Media'); }
  get ticketsBaja()  { return this.tickets.filter(t => t.prioridad === 'Baja'); }

  // ── Priority tag severity mapping ─────────────────────────────────────
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

    // Simulate filtering: distribute mock tickets based on groupId
    const groupTicketIds: Record<number, number[]> = {
      101: [1, 2, 3],
      102: [4, 5, 6],
      103: [6, 7, 8],
    };
    const ids = groupTicketIds[this.groupId] ?? [];
    this.tickets = this.allTickets.filter(t => ids.includes(t.id));

    this.calcStats();
  }

  private calcStats() {
    this.alta  = this.tickets.filter(t => t.prioridad === 'Alta').length;
    this.media = this.tickets.filter(t => t.prioridad === 'Media').length;
    this.baja  = this.tickets.filter(t => t.prioridad === 'Baja').length;
  }

  // ── Navigation ────────────────────────────────────────────────────────
  goBack() { this.router.navigate(['/home']); }

  // ── New Ticket ────────────────────────────────────────────────────────
  openNew() {
    this.isEditing = false;
    this.submitted = false;
    this.editTicket = {
      id: 0,
      titulo: '', descripcion: '',
      estado: 'pendiente',
      asignadoA: '',
      prioridad: 'Media',
      fechaCreacion: new Date(),
      fechaLimite: new Date(),
      comentarios: '',
      historialCambios: []
    };
    this.ticketDialog = true;
  }

  // ── View/Edit existing ticket ─────────────────────────────────────────
  openTicket(t: Ticket, editMode: boolean = false) {
    this.submitted = false;
    this.isEditing = editMode;
    this.selectedTicket = t;
    this.editTicket = { ...t, historialCambios: [...t.historialCambios] };
    this.ticketDialog = true;
  }

  closeDialog() {
    this.ticketDialog = false;
    this.submitted = false;
  }

  // ── Save ──────────────────────────────────────────────────────────────
  saveTicket() {
    this.submitted = true;
    if (!this.editTicket.titulo?.trim() || !this.editTicket.asignadoA) return;

    if (this.editTicket.id === 0) {
      // Create
      const newId = Math.max(...this.allTickets.map(t => t.id)) + 1;
      const newTicket: Ticket = { ...this.editTicket, id: newId, fechaCreacion: new Date() };
      newTicket.historialCambios = [`Creado el ${new Date().toLocaleDateString()}`];
      this.tickets = [...this.tickets, newTicket];
    } else {
      // Update
      this.editTicket.historialCambios = [
        ...this.editTicket.historialCambios,
        `Editado el ${new Date().toLocaleDateString()}`
      ];
      this.tickets = this.tickets.map(t => t.id === this.editTicket.id ? { ...this.editTicket } : t);
    }

    this.calcStats();
    this.closeDialog();
  }

  // ── Delete ────────────────────────────────────────────────────────────
  deleteTicket(t: Ticket) {
    this.tickets = this.tickets.filter(x => x.id !== t.id);
    this.calcStats();
    this.closeDialog();
  }
}
