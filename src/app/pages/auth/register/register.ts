import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [ButtonModule, InputTextModule, CardModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {

}
