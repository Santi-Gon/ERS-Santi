import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PermissionService } from '../../services/permission.service';
import { GroupsService } from '../../services/groups.service';
import { UsersService } from '../../services/users.service';
import { TicketsService } from '../../services/tickets.service';
import { catchError, of, forkJoin } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TagModule, DividerModule, ProgressSpinnerModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private permissionService = inject(PermissionService);
  private router = inject(Router);
  private groupsService = inject(GroupsService);
  private usersService = inject(UsersService);
  private ticketsService = inject(TicketsService);

  // Stats
  highPriorityCount = 0;
  mediumPriorityCount = 0;
  lowPriorityCount = 0;
  assignedTicketsCount = 0;
  isMaster = false;
  isLoading = true;

  // Real user ID UUID
  currentUserId: string = '';

  myGroups: Array<{
    id: string;
    name: string;
    description: string;
    membersCount: number;
  }> = [];

  allTickets: any[] = [];

  ngOnInit() {
    this.checkPermissions();
    // 1. Obtener mi UUID
    this.usersService.getMe().pipe(catchError(() => of(null))).subscribe((meRes: any) => {
      if (meRes && meRes.data && meRes.data.length > 0) {
        this.currentUserId = meRes.data[0].id;
      }
      // 2. Cargar mis grupos
      this.loadMyGroups();
    });
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
        
        if (this.myGroups.length > 0) {
          this.loadGlobalTickets();
        } else {
          this.allTickets = [];
          this.calculateStats();
          this.isLoading = false;
        }
      });
  }

  private loadGlobalTickets() {
      const requests = this.myGroups.map(g => this.ticketsService.getTicketsByGroup(g.id).pipe(catchError(() => of({ data: [] }))));
      forkJoin(requests).subscribe(results => {
          let globalTickets: any[] = [];
          results.forEach((res: any) => {
              if (res && res.data) {
                  globalTickets = globalTickets.concat(res.data);
              }
          });
          
          this.allTickets = globalTickets.map((b: any) => ({
              id: b.id,
              title: b.titulo,
              status: b.estado?.nombre || 'pendiente',
              assignedTo: b.asignado?.id || null, 
              priority: b.prioridad?.nombre || 'Media',
              groupId: b.grupo_id
          }));
          
          this.calculateStats();
          this.isLoading = false;
      });
  }

  goToGroupDetails(groupId: string) {
    this.router.navigate(['/group', groupId, 'tickets']);
  }
}
