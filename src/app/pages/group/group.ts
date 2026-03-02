import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [CommonModule, CardModule],
  templateUrl: './group.html',
  styleUrl: './group.css',
})
export class Group {
  totalCount = 42;
}
