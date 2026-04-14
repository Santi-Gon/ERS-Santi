import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { InputMaskModule } from 'primeng/inputmask';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';

import { MessageService } from 'primeng/api';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CardModule,
    DatePickerModule,
    InputMaskModule,
    ToastModule,
    MessageModule,
    RouterModule

  ],
  providers: [MessageService],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  formularioRegistro: FormGroup;
  cargando: boolean = false;
  simbolosEspeciales: string = '@#$%^&*!';

  private authService = inject(AuthService);

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private router: Router
  ) {
    this.formularioRegistro = this.fb.group({
      usuario: ['', Validators.required],
      nombreCompleto: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      contrasenia: ['', [Validators.required, this.validarContraseniaFuerte.bind(this)]],
      confirmarContrasenia: ['', Validators.required],
      direccion: ['', Validators.required],
      fechaNacimiento: [null, [Validators.required, this.validarMayoriaEdad]],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]]
    }, { validators: this.confirmarContraseniasIguales });
  }

  // Validador: Al menos 10 caracteres y símbolos especiales
  validarContraseniaFuerte(control: AbstractControl): ValidationErrors | null {
    const valor = control.value;
    if (!valor) return null;

    const tieneLongitud = valor.length >= 10;
    const tieneSimbolo = /[!@#$%^&*(),.?":{}|<>]/.test(valor);

    if (!tieneLongitud || !tieneSimbolo) {
      return { contraseniaDebil: true };
    }
    return null;
  }

  // Validador: Mayoría de edad (18 años)
  validarMayoriaEdad(control: AbstractControl): ValidationErrors | null {
    const fecha = control.value;
    if (!fecha) return null;

    const hoy = new Date();
    const nacimiento = new Date(fecha);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }

    return edad >= 18 ? null : { menorDeEdad: true };
  }

  // Validador: Coincidencia de contraseñas
  confirmarContraseniasIguales(group: AbstractControl): ValidationErrors | null {
    const contrasenia = group.get('contrasenia')?.value;
    const confirmar = group.get('confirmarContrasenia')?.value;
    return contrasenia === confirmar ? null : { noCoincide: true };
  }

  registrarUsuario() {
    if (this.formularioRegistro.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario Inválido',
        detail: 'Por favor corregir los errores en el formulario.'
      });
      return;
    }

    this.cargando = true;
    const form = this.formularioRegistro.value;
    
    // Mapeo directo al DTO del backend
    const payload = {
      usuario: form.usuario,
      nombre_completo: form.nombreCompleto,
      email: form.email,
      contrasenia: form.contrasenia,
      direccion: form.direccion,
      fecha_nacimiento: form.fechaNacimiento instanceof Date ? form.fechaNacimiento.toISOString().split('T')[0] : form.fechaNacimiento,
      telefono: form.telefono
    };

    this.authService.register(payload).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Registro Exitoso',
          detail: 'Su cuenta ha sido creada correctamente.'
        });
        this.cargando = false;
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.cargando = false;
        const msg = err.error?.data?.[0]?.message || 'Ocurrió un error al registrarse.';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: msg
        });
      }
    });
  }
}


