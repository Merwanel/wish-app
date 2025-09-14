import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Letter } from '../../schemas/wish.schema';


@Component({
  selector: 'app-display-letters',
  imports: [NgClass],
  templateUrl: './display-letters.component.html',
  styleUrl: './display-letters.component.css'
})
export class DisplayLettersComponent {
  @Input({required:true}) letters!: Letter[];
}
