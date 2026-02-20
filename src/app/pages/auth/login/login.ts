import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ButtonModule, InputTextModule, CardModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

}
