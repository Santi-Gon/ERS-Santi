import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { RouterModule, Router } from '@angular/router';

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

    // Simulamos una carga
    setTimeout(() => {
      if (usuario === 'admin' && contrasenia === 'admin123') {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Bienvenido al sistema'
        });
        // Aquí podrías redirigir
        // this.router.navigate(['/dashboard']);
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Usuario o contraseña incorrectos'
        });
      }
      this.cargando = false;
    }, 1500);
  }
}

