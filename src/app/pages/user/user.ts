import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, CardModule, AvatarModule],
  templateUrl: './user.html',
  styleUrl: './user.css',
})
export class User {
  userInfo = {
    username: 'admin2026',
    fullName: 'Administrador Demo',
    email: 'admin@erpsanti.com',
    address: 'Av. Siempre Viva 123, Ciudad',
    birthDate: '1990-05-15',
    age: 35,
    phone: '5551234567'
  };
}
