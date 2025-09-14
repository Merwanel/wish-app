import { Component, Output, Input, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutofocusDirective } from './autofocus.directive';
import { NgClass } from '@angular/common';
import { Letter } from '../../schemas/wish.schema';
import { DisplayLettersComponent } from "../display-letters/display-letters.component";
import { initLetters } from '../../app/utils/letters';


/**
 * An input whose width adapts to its content
 * 
 * USAGE :
 *  
 *   <app-dynamic-input [(inputModel)]="value" />
 * 
 *   <app-dynamic-input [(inputModel)]="value" (change)="onChange(...)" />
 * 
 *   <app-dynamic-input 
 *     [(inputModel)]="tag" 
 *     [is_tag]="true"
 *     [is_autofocus]="tag === ''"
 *     (ref)="recieveRef($event)"
 *     (change)="onChange()" (focus)="onFocus()" (blur)="onBlur()" (input)="onInput()"
 *     (keydown)="onKeyDown($event)"    
 *   />
 */
@Component({
  selector: 'app-dynamic-input',
  imports: [FormsModule, AutofocusDirective, NgClass, DisplayLettersComponent],
  templateUrl: './dynamic-input.component.html',
  styleUrl: './dynamic-input.component.css'
})
export class DynamicInputComponent {

  @Input({required:true}) inputModel!: {val:string, letters:Letter[]} ;
  @Input() input_id = "";
  @Input() is_autofocus = false;
  @Input() is_tag = false;
  @Input() is_comment = false;

  @Output() inputModelChange = new EventEmitter<{val:string, letters:Letter[]}>();
  @Output() ref = new EventEmitter<ElementRef>();
  @Output() focus = new EventEmitter<never>();
  @Output() blur = new EventEmitter<never>();
  

  @ViewChild('InputRef') InputRef! : ElementRef<HTMLDivElement> ;


  ngAfterViewInit() {
    this.ref.emit(this.InputRef) ;
  }

  onInputDoSync() {
    this.inputModel.letters = initLetters(this.inputModel.val)
  }
  
  onSubmitDoPreventDefault(event:Event) {
    event.preventDefault() ;
  }

  onFocusDoEmit() {
    this.focus.emit();
  } 

  onBlurDoEmit() {
    this.blur.emit();
  } 
}
