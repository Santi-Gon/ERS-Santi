import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
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
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { UsersService } from '../../services/users.service';
import { TicketsService } from '../../services/tickets.service';
import { GroupsService } from '../../services/groups.service';
import { catchError, finalize, of, forkJoin } from 'rxjs';

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
    ToastModule,
    ProgressSpinnerModule
  ],
  providers: [MessageService],
  templateUrl: './user.html',
  styleUrl: './user.css',
})
export class User implements OnInit {
  private usersService = inject(UsersService);
  private ticketsService = inject(TicketsService);
  private groupsService = inject(GroupsService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  currentUserId: string = '';

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

  // Mock assigned tickets removed, using backend array
  assignedTickets: any[] = [];

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
  isLoadingMyTickets: boolean = true;

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
        if (!me) {
          this.cdr.detectChanges();
          return;
        }
        this.currentUserId = me.id;
        this.userInfo.username = me.usuario;
        this.userInfo.fullName = me.nombre_completo;
        this.userInfo.email = me.email;
        this.userInfo.address = me.direccion ?? '';
        this.userInfo.birthDate = me.fecha_nacimiento ?? '';
        this.userInfo.phone = me.telefono ?? '';
        this.recomputeInitialsAndAge();
        this.cdr.detectChanges();

        this.loadAssignedTickets();
      });
  }

  loadAssignedTickets() {
    this.isLoadingMyTickets = true;
    this.groupsService.getMyGroups().pipe(catchError(() => of({data: []}))).subscribe((res: any) => {
       const groups = res.data || [];
       if (!groups.length) {
          this.assignedTickets = [];
          this.isLoadingMyTickets = false;
          this.cdr.detectChanges();
          return;
       }
       const requests = groups.map((g: any) => 
           this.ticketsService.getTicketsByGroup(g.id).pipe(
              catchError(() => of({ data: [] }))
           )
       );
       
       forkJoin(requests).subscribe((results: any) => {
          let myTickets: any[] = [];
          results.forEach((r: any, idx: number) => {
             const groupName = groups[idx].nombre;
             const tks = r.data || [];
             const filtered = tks.filter((t: any) => t.asignado?.id === this.currentUserId);
             filtered.forEach((t: any) => {
                myTickets.push({
                   id: t.id,
                   titulo: t.titulo,
                   estado: t.estado?.nombre || 'pendiente',
                   prioridad: t.prioridad?.nombre || 'Media',
                   fechaCreacion: t.creado_en ? new Date(t.creado_en) : null,
                   fechaLimite: t.fecha_final ? new Date(t.fecha_final) : null,
                   grupo: groupName
                });
             });
          });
          this.assignedTickets = myTickets;
          this.isLoadingMyTickets = false;
          this.cdr.detectChanges();
       });
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
