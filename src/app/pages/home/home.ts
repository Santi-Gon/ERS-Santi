import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { PermissionService } from '../../services/permission.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TagModule, DividerModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private permissionService = inject(PermissionService);
  private router = inject(Router);

  // Stats
  highPriorityCount = 0;
  mediumPriorityCount = 0;
  lowPriorityCount = 0;
  assignedTicketsCount = 0;
  isMaster = false;

  // Mock data for current user
  currentUserId = 1;

  // Mock Groups
  myGroups = [
    { id: 101, name: 'Desarrollo Frontend', description: 'Equipo encargado del dashboard en Angular', membersCount: 5 },
    { id: 102, name: 'Soporte Nivel 2', description: 'Atención a tickets técnicos avanzados', membersCount: 8 },
    { id: 103, name: 'QA & Testing', description: 'Pruebas automatizadas y manuales', membersCount: 3 }
  ];

  // Mock Tickets
  allTickets = [
    { id: 1, title: 'Error en login', status: 'pendiente', assignedTo: 1, priority: 'Alta', groupId: 101 },
    { id: 2, title: 'Actualizar dependencias', status: 'en progreso', assignedTo: 1, priority: 'Media', groupId: 101 },
    { id: 3, title: 'Revisar logs de servidor', status: 'revisión', assignedTo: 2, priority: 'Alta', groupId: 102 },
    { id: 4, title: 'Botón desfasado', status: 'pendiente', assignedTo: 3, priority: 'Baja', groupId: 101 },
    { id: 5, title: 'Corregir typos en docs', status: 'finalizada', assignedTo: 1, priority: 'Baja', groupId: 103 },
    { id: 6, title: 'Testing de API', status: 'pendiente', assignedTo: 2, priority: 'Media', groupId: 103 },
  ];

  ngOnInit() {
    this.checkPermissions();
    this.calculateStats();
  }

  private checkPermissions() {
    // Simulamos que ser 'master' es tener, por ejemplo, los permisos de edicion/borrado de usuarios o grupos
    this.isMaster = this.permissionService.hasPermission(['users_edit', 'groups_edit']);
  }

  private calculateStats() {
    let ticketsToAnalyze = this.allTickets;

    // Si NO es maestro, solo ve las stats de sus tickets asignados
    if (!this.isMaster) {
      ticketsToAnalyze = this.allTickets.filter(t => t.assignedTo === this.currentUserId);
    }

    this.assignedTicketsCount = this.allTickets.filter(t => t.assignedTo === this.currentUserId).length;
    this.highPriorityCount = ticketsToAnalyze.filter(t => t.priority === 'Alta').length;
    this.mediumPriorityCount = ticketsToAnalyze.filter(t => t.priority === 'Media').length;
    this.lowPriorityCount = ticketsToAnalyze.filter(t => t.priority === 'Baja').length;
  }

  goToGroupDetails(groupId: number) {
    // Redirección simulada a una futura ruta de grupo
    console.log('Navegando a los detalles del grupo:', groupId);
    // this.router.navigate(['/group', groupId]);
  }
}
