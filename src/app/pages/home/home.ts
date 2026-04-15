import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { PermissionService } from '../../services/permission.service';
import { GroupsService } from '../../services/groups.service';
import { catchError, of } from 'rxjs';

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
  private groupsService = inject(GroupsService);

  // Stats
  highPriorityCount = 0;
  mediumPriorityCount = 0;
  lowPriorityCount = 0;
  assignedTicketsCount = 0;
  isMaster = false;

  // Mock data for current user
  currentUserId = 1;

  myGroups: Array<{
    id: string;
    name: string;
    description: string;
    membersCount: number;
  }> = [];

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
    this.loadMyGroups();
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

  private loadMyGroups() {
    this.groupsService
      .getMyGroups()
      .pipe(
        catchError(() =>
          of({ statusCode: 500, intOpCode: 1, data: [] as any[] }),
        ),
      )
      .subscribe((res) => {
        const rows = res.data ?? [];
        this.myGroups = rows.map((g: any) => ({
          id: g.id,
          name: g.nombre,
          description: g.descripcion ?? 'Sin descripción',
          membersCount: g.integrantes ?? 0,
        }));
      });
  }

  goToGroupDetails(groupId: string) {
    this.router.navigate(['/group', groupId, 'tickets']);
  }
}
