import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

// DTOs e Interfaces
export interface BackendTicket {
  id: string;
  titulo: string;
  descripcion: string;
  grupo_id: string;
  autor_id: string;
  asignado_id: string | null;
  creado_en: string;
  fecha_final: string | null;
  estado: { id: string; nombre: string; color: string };
  prioridad: { id: string; nombre: string };
  autor: { id: string; nombre_completo: string };
  asignado: { id: string; nombre_completo: string } | null;
  // Propiedades opcionales que vienen en el detalle
  historial?: any[];
  comentarios?: any[];
}

export interface CreateTicketPayload {
  grupo_id: string;
  titulo: string;
  prioridad_nombre: string;
  estado_nombre?: string;
  descripcion?: string;
  asignado_id?: string;
  fecha_final?: string;
}

export interface UpdateTicketPayload {
  titulo?: string;
  descripcion?: string;
  prioridad_nombre?: string;
  asignado_id?: string | null;
  fecha_final?: string | null;
}

@Injectable({ providedIn: 'root' })
export class TicketsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/tickets`;

  getTicketsByGroup(groupId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/grupo/${groupId}`);
  }

  getTicketById(ticketId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${ticketId}`);
  }

  createTicket(payload: CreateTicketPayload): Observable<any> {
    return this.http.post<any>(this.baseUrl, payload);
  }

  updateTicket(ticketId: string, payload: UpdateTicketPayload): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/${ticketId}`, payload);
  }

  updateTicketState(ticketId: string, estado_nombre: string): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/${ticketId}/estado`, { estado_nombre });
  }

  deleteTicket(ticketId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${ticketId}`);
  }

  addComment(ticketId: string, contenido: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${ticketId}/comentarios`, { contenido });
  }

  deleteComment(ticketId: string, commentId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${ticketId}/comentarios/${commentId}`);
  }
}
