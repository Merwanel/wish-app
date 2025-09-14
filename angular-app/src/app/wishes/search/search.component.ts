import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DynamicInputComponent } from "../../../ui/dynamic-input/dynamic-input.component";
import { initLetters } from '../../utils/letters';

@Component({
  selector: 'app-search',
  imports: [DynamicInputComponent],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchComponent {
  @Input({required: true}) val! : string ;
  @Output() searchChange = new EventEmitter<string>();
  
  search = {val:'', letters:initLetters("")} ;

  constructor() {}
  
  ngOnInit() {
    this.search.val = this.val ;
    this.search.letters = initLetters(this.search.val) ;
  }

  ngOnChanges() {
    this.search.val = this.val ;
    this.search.letters = initLetters(this.search.val) ;
  }
    
  onInputDoEmit() {
    this.searchChange.emit(this.search.val);
  }
  
  onEnterDoUnfocus(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      window.focus();
    }
  }
}
