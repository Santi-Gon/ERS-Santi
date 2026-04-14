import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { PermissionService } from '../../../services/permission.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CardModule,
    ToastModule,
    RouterModule
  ],
  providers: [MessageService],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  formularioLogin: FormGroup;
  cargando: boolean = false;
  
  private authService = inject(AuthService);
  private permissionService = inject(PermissionService);

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private router: Router
  ) {
    this.formularioLogin = this.fb.group({
      usuario: ['', Validators.required],
      contrasenia: ['', Validators.required]
    });
  }

  iniciarSesion() {
    if (this.formularioLogin.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Por favor, complete todos los campos.'
      });
      return;
    }

    this.cargando = true;
    const { usuario, contrasenia } = this.formularioLogin.value;

    this.authService.login(usuario, contrasenia).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Bienvenido al sistema'
        });
        // Si el backend devuelve permisos, el interceptor ya guardó el token
        // y podemos leer los permisos o actualizarlos aquí si es necesario
        if (res.data?.[0]?.permissions) {
           this.permissionService.setPermissions(res.data[0].permissions);
        }
        this.cargando = false;
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.cargando = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.data?.[0]?.message || 'Usuario o contraseña incorrectos'
        });
      }
    });
  }
}


