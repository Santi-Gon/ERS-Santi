import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface ApiEnvelope<T> {
  statusCode: number;
  intOpCode: number;
  data: T[];
}

export interface BackendUserRow {
  id: string;
  nombre_completo: string;
  usuario: string;
  email: string;
  telefono?: string | null;
  activo: boolean;
  fecha_creacion?: string;
  permisos: string[];
}

export interface BackendMe {
  id: string;
  nombre_completo: string;
  usuario: string;
  email: string;
  telefono?: string | null;
  direccion?: string | null;
  fecha_nacimiento?: string | null;
  activo: boolean;
  fecha_creacion?: string;
  permisos: string[];
}

export interface UpdateUserAdminPayload {
  nombre_completo?: string;
  email?: string;
  activo?: boolean;
}

export interface UpdateMePayload {
  nombre_completo?: string;
  usuario?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  fecha_nacimiento?: string;
}

export interface UpdatePasswordPayload {
  contrasenia_actual: string;
  nueva_contrasenia: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/users`;

  getAllUsers(): Observable<ApiEnvelope<BackendUserRow>> {
    return this.http.get<ApiEnvelope<BackendUserRow>>(this.baseUrl);
  }

  getMe(): Observable<ApiEnvelope<BackendMe>> {
    return this.http.get<ApiEnvelope<BackendMe>>(`${this.baseUrl}/me`);
  }

  updateMe(payload: UpdateMePayload): Observable<ApiEnvelope<any>> {
    return this.http.patch<ApiEnvelope<any>>(`${this.baseUrl}/me`, payload);
  }

  updateMyPassword(payload: UpdatePasswordPayload): Observable<ApiEnvelope<any>> {
    return this.http.patch<ApiEnvelope<any>>(`${this.baseUrl}/me/password`, payload);
  }

  deactivateMe(): Observable<ApiEnvelope<any>> {
    return this.http.delete<ApiEnvelope<any>>(`${this.baseUrl}/me`);
  }

  updateUserAdmin(userId: string, payload: UpdateUserAdminPayload): Observable<ApiEnvelope<any>> {
    return this.http.patch<ApiEnvelope<any>>(`${this.baseUrl}/${userId}`, payload);
  }

  updatePermissions(userId: string, permisos: string[]): Observable<ApiEnvelope<any>> {
    return this.http.put<ApiEnvelope<any>>(`${this.baseUrl}/${userId}/permissions`, { permisos });
  }

  deleteUserAdmin(userId: string): Observable<ApiEnvelope<any>> {
    return this.http.delete<ApiEnvelope<any>>(`${this.baseUrl}/${userId}`);
  }
}

