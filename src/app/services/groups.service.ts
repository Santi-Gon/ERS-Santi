import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface ApiEnvelope<T> {
  statusCode: number;
  intOpCode: number;
  data: T[];
}

export interface BackendGroupRow {
  id: string;
  nombre: string;
  descripcion: string | null;
  autor: string | null;
  lider_id: string | null;
  creador_id: string | null;
  integrantes: number;
  tickets: number;
  members: string[];
  creado_en: string;
}

export interface CreateGroupPayload {
  nombre: string;
  descripcion?: string;
}

export interface UpdateGroupPayload {
  nombre?: string;
  descripcion?: string;
}

@Injectable({ providedIn: 'root' })
export class GroupsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/grupos`;

  getMyGroups(): Observable<ApiEnvelope<BackendGroupRow>> {
    return this.http.get<ApiEnvelope<BackendGroupRow>>(this.baseUrl);
  }

  createGroup(payload: CreateGroupPayload): Observable<ApiEnvelope<any>> {
    return this.http.post<ApiEnvelope<any>>(this.baseUrl, payload);
  }

  updateGroup(groupId: string, payload: UpdateGroupPayload): Observable<ApiEnvelope<any>> {
    return this.http.patch<ApiEnvelope<any>>(`${this.baseUrl}/${groupId}`, payload);
  }

  deleteGroup(groupId: string): Observable<ApiEnvelope<any>> {
    return this.http.delete<ApiEnvelope<any>>(`${this.baseUrl}/${groupId}`);
  }
}

