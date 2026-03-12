import { Component, OnInit } from '@angular/core';
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
    DividerModule
  ],
  templateUrl: './user.html',
  styleUrl: './user.css',
})
export class User implements OnInit {
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

  editDialogVisible: boolean = false;
  editForm!: FormGroup;
  submitted: boolean = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.editForm = this.fb.group({
      fullName: ['', [Validators.required]],
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      address: ['', [Validators.required]],
      birthDate: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(frm: FormGroup) {
    return frm.controls['password'].value === frm.controls['confirmPassword'].value 
      ? null : { 'mismatch': true };
  }

  openEditDialog() {
    this.editForm.patchValue({
      fullName: this.userInfo.fullName,
      username: this.userInfo.username,
      email: this.userInfo.email,
      address: this.userInfo.address,
      birthDate: this.userInfo.birthDate,
      phone: this.userInfo.phone,
      password: '',
      confirmPassword: ''
    });
    this.submitted = false;
    this.editDialogVisible = true;
  }

  hideDialog() {
    this.editDialogVisible = false;
    this.submitted = false;
  }

  saveProfile() {
    this.submitted = true;

    if (this.editForm.valid) {
      const formValues = this.editForm.value;
      
      // Update local userInfo
      this.userInfo.fullName = formValues.fullName;
      this.userInfo.username = formValues.username;
      this.userInfo.email = formValues.email;
      this.userInfo.address = formValues.address;
      this.userInfo.birthDate = formValues.birthDate;
      this.userInfo.phone = formValues.phone;

      // Recalculate age based on new birthDate
      const birthYear = new Date(formValues.birthDate).getFullYear();
      const currentYear = new Date().getFullYear();
      this.userInfo.age = currentYear - birthYear;

      this.editDialogVisible = false;
      this.submitted = false;
    }
  }

  deleteAccount() {
    // Simulated delete logic
    if (confirm('¿Estás seguro de que deseas dar de baja tu cuenta? Esta acción no se puede deshacer.')) {
      alert('Tu cuenta ha sido dada de baja localmente (Simulación).');
      // Here you would typically redirect logic or clear session
    }
  }
}
