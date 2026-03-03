import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';

export interface AppGroup {
  id?: string;
  nivel?: number;
  autor?: string;
  nombre?: string;
  integrantes?: number;
  tickets?: number;
  descripcion?: string;
}

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    CardModule, 
    TableModule, 
    DialogModule, 
    ButtonModule, 
    InputTextModule, 
    InputNumberModule
  ],
  templateUrl: './group.html',
  styleUrl: './group.css',
})
export class Group implements OnInit {
  groups: AppGroup[] = [];
  group!: AppGroup;
  
  groupDialog: boolean = false;
  submitted: boolean = false;
  totalCount = 0;

  ngOnInit() {
    this.groups = [
      { id: '1000', nivel: 1, autor: 'Juan Pérez', nombre: 'Desarrollo Frontend', integrantes: 5, tickets: 12, descripcion: 'Equipo encargado de la interfaz de usuario.' },
      { id: '1001', nivel: 2, autor: 'María Gómez', nombre: 'Backend Services', integrantes: 8, tickets: 25, descripcion: 'Equipo de APIs y base de datos.' },
      { id: '1002', nivel: 1, autor: 'Carlos Ruiz', nombre: 'QA Automation', integrantes: 3, tickets: 5, descripcion: 'Automatización de pruebas y calidad.' }
    ];
    this.updateTotalCount();
  }

  updateTotalCount() {
    this.totalCount = this.groups.length;
  }

  openNew() {
    this.group = {};
    this.submitted = false;
    this.groupDialog = true;
  }

  editGroup(g: AppGroup) {
    this.group = { ...g };
    this.groupDialog = true;
  }

  deleteGroup(g: AppGroup) {
    this.groups = this.groups.filter(val => val.id !== g.id);
    this.groupDialog = false;
    this.updateTotalCount();
  }

  hideDialog() {
    this.groupDialog = false;
    this.submitted = false;
  }

  saveGroup() {
    this.submitted = true;

    if (this.group.nombre?.trim()) {
      if (this.group.id) {
        this.groups[this.findIndexById(this.group.id)] = this.group;
      } else {
        this.group.id = this.createId();
        this.groups.push(this.group);
      }

      this.groups = [...this.groups];
      this.groupDialog = false;
      this.group = {};
      this.updateTotalCount();
    }
  }

  findIndexById(id: string): number {
    let index = -1;
    for (let i = 0; i < this.groups.length; i++) {
        if (this.groups[i].id === id) {
            index = i;
            break;
        }
    }
    return index;
  }

  createId(): string {
    let id = '';
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for ( var i = 0; i < 5; i++ ) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }
}
