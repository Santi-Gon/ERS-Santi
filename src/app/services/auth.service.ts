import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, tap } from 'rxjs';

export interface AuthResponse {
  statusCode: number;
  intOpCode: number;
  data: {
    message?: string;
    access_token?: string;
    user?: {
      id: string;
      nombre_completo: string;
      correo: string;
      [key: string]: any;
    };
    permissions?: string[];
  }[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'ers_token';
  private readonly USER_KEY = 'ers_user';

  login(identifier: string, contrasenia: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { identifier, contrasenia }).pipe(
      tap(res => {
        const token = res.data?.[0]?.access_token;
        const user = res.data?.[0]?.user;
        if (token) {
          this.setToken(token);
        }
        if (user) {
          this.setCurrentUser(user);
        }
      })
    );
  }

  register(userData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData);
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  getCurrentUser(): any {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(this.USER_KEY);
      if (stored) return JSON.parse(stored);
    }
    return null;
  }

  setCurrentUser(user: any): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

