
import { Directive, ElementRef, Input } from '@angular/core';

@Directive({
  selector: '[autofocus]'
})
export class AutofocusDirective {
  @Input() autofocus = false ;
  constructor(private host: ElementRef) {}

  ngAfterViewInit() {
    if(this.autofocus) {
      this.host.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
      this.host.nativeElement.focus();
    } 
  }
}