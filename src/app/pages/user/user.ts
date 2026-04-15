import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { FieldsetModule } from 'primeng/fieldset';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { UsersService } from '../../services/users.service';
import { catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    CardModule, 
    AvatarModule, 
    FieldsetModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    TagModule,
    TableModule,
    DividerModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './user.html',
  styleUrl: './user.css',
})
export class User implements OnInit {
  private usersService = inject(UsersService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);

  userInfo = {
    username: 'admin2026',
    fullName: 'Juan Pérez',
    email: 'juan.perez@erpsanti.com',
    address: 'Av. Siempre Viva 123, Ciudad',
    birthDate: '1990-05-15',
    age: 35,
    phone: '5551234567',
    initials: 'JP'
  };

  // Mock assigned tickets
  assignedTickets = [
    { id: 1, titulo: 'Error en pantalla de login', estado: 'pendiente', prioridad: 'Alta',
      fechaCreacion: new Date('2026-03-01'), fechaLimite: new Date('2026-03-15'), grupo: 'Desarrollo Frontend' },
    { id: 5, titulo: 'Corrección de typos en docs', estado: 'finalizada', prioridad: 'Baja',
      fechaCreacion: new Date('2026-02-28'), fechaLimite: new Date('2026-03-10'), grupo: 'QA & Testing' },
    { id: 9, titulo: 'Revisión de diseño de login', estado: 'en progreso', prioridad: 'Media',
      fechaCreacion: new Date('2026-03-08'), fechaLimite: new Date('2026-03-22'), grupo: 'Desarrollo Frontend' },
  ];

  get ticketsAbiertos()   { return this.assignedTickets.filter(t => t.estado === 'pendiente').length; }
  get ticketsEnProgreso() { return this.assignedTickets.filter(t => t.estado === 'en progreso').length; }
  get ticketsFinalizados(){ return this.assignedTickets.filter(t => t.estado === 'finalizada').length; }

  estadoSeverity(e: string): 'secondary' | 'info' | 'warn' | 'success' {
    switch (e) {
      case 'pendiente':   return 'secondary';
      case 'en progreso': return 'info';
      case 'revisión':    return 'warn';
      case 'finalizada':  return 'success';
      default:            return 'secondary';
    }
  }
  prioridadSeverity(p: string): 'danger' | 'warn' | 'success' {
    return p === 'Alta' ? 'danger' : p === 'Media' ? 'warn' : 'success';
  }

  // Dialogs
  editDialogVisible: boolean = false;
  passwordDialogVisible: boolean = false;
  submittedProfile: boolean = false;
  submittedPassword: boolean = false;

  // Forms
  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  loadingProfile: boolean = false;
  savingProfile: boolean = false;
  savingPassword: boolean = false;

  ngOnInit() {
    this.initForms();
    this.loadMe();
  }

  initForms() {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required]],
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      address: [''],
      birthDate: [''],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    });

    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(10)]],
        confirmNewPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  passwordMatchValidator(frm: FormGroup) {
    // usada solo para passwordForm (new/confirm)
    return frm.controls['newPassword']?.value === frm.controls['confirmNewPassword']?.value
      ? null : { 'mismatch': true };
  }

  private recomputeInitialsAndAge() {
    const name = this.userInfo.fullName?.trim() || 'Usuario';
    const parts = name.split(' ').map(s => s.trim()).filter(Boolean);
    this.userInfo.initials = parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();

    if (this.userInfo.birthDate) {
      const birthYear = new Date(this.userInfo.birthDate).getFullYear();
      const currentYear = new Date().getFullYear();
      this.userInfo.age = currentYear - birthYear;
    }
  }

  loadMe() {
    this.loadingProfile = true;
    this.usersService
      .getMe()
      .pipe(
        catchError((err) => {
          const msg =
            err?.error?.data?.[0]?.message ?? 'No se pudo cargar tu perfil.';
          this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
          return of({ statusCode: 500, intOpCode: 1, data: [] as any[] });
        }),
        finalize(() => (this.loadingProfile = false)),
      )
      .subscribe((res) => {
        const me = res.data?.[0];
        if (!me) return;
        this.userInfo.username = me.usuario;
        this.userInfo.fullName = me.nombre_completo;
        this.userInfo.email = me.email;
        this.userInfo.address = me.direccion ?? '';
        this.userInfo.birthDate = me.fecha_nacimiento ?? '';
        this.userInfo.phone = me.telefono ?? '';
        this.recomputeInitialsAndAge();
      });
  }

  openEditDialog() {
    this.profileForm.patchValue({
      fullName: this.userInfo.fullName,
      username: this.userInfo.username,
      email: this.userInfo.email,
      address: this.userInfo.address,
      birthDate: this.userInfo.birthDate,
      phone: this.userInfo.phone,
    });
    this.submittedProfile = false;
    this.editDialogVisible = true;
  }

  openPasswordDialog() {
    this.passwordForm.reset({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    });
    this.submittedPassword = false;
    this.passwordDialogVisible = true;
  }

  hideDialog() {
    this.editDialogVisible = false;
    this.submittedProfile = false;
  }

  hidePasswordDialog() {
    this.passwordDialogVisible = false;
    this.submittedPassword = false;
  }

  saveProfile() {
    this.submittedProfile = true;
    if (this.profileForm.invalid) return;

    const v = this.profileForm.value;
    this.savingProfile = true;
    this.usersService
      .updateMe({
        nombre_completo: v.fullName,
        usuario: v.username,
        email: v.email,
        direccion: v.address || undefined,
        fecha_nacimiento: v.birthDate || undefined,
        telefono: v.phone,
      })
      .pipe(
        catchError((err) => {
          const msg =
            err?.error?.data?.[0]?.message ?? 'No se pudo actualizar tu perfil.';
          this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
          return of(null);
        }),
        finalize(() => (this.savingProfile = false)),
      )
      .subscribe((res) => {
        if (!res) return;
        this.messageService.add({
          severity: 'success',
          summary: 'Listo',
          detail: res.data?.[0]?.message ?? 'Perfil actualizado.',
        });
        this.editDialogVisible = false;
        this.submittedProfile = false;
        this.loadMe();
      });
  }

  changePassword() {
    this.submittedPassword = true;
    if (this.passwordForm.invalid) return;

    const v = this.passwordForm.value;
    this.savingPassword = true;
    this.usersService
      .updateMyPassword({
        contrasenia_actual: v.currentPassword,
        nueva_contrasenia: v.newPassword,
      })
      .pipe(
        catchError((err) => {
          const msg =
            err?.error?.data?.[0]?.message ?? 'No se pudo cambiar la contraseña.';
          this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
          return of(null);
        }),
        finalize(() => (this.savingPassword = false)),
      )
      .subscribe((res) => {
        if (!res) return;
        this.messageService.add({
          severity: 'success',
          summary: 'Listo',
          detail: res.data?.[0]?.message ?? 'Contraseña actualizada.',
        });
        this.passwordDialogVisible = false;
        this.submittedPassword = false;
      });
  }

  deleteAccount() {
    if (!confirm('¿Estás seguro de que deseas dar de baja tu cuenta? Esta acción no se puede deshacer.')) return;
    this.usersService
      .deactivateMe()
      .pipe(
        catchError((err) => {
          const msg =
            err?.error?.data?.[0]?.message ?? 'No se pudo dar de baja tu cuenta.';
          this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
          return of(null);
        }),
      )
      .subscribe((res) => {
        if (!res) return;
        this.messageService.add({
          severity: 'success',
          summary: 'Listo',
          detail: res.data?.[0]?.message ?? 'Cuenta dada de baja.',
        });
      });
  }
}
