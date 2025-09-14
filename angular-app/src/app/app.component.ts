import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeComponent } from './theme/theme.component';

@Component({
  selector: 'app-root',
  imports: [ RouterOutlet, ThemeComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [
    
  ],
})
export class AppComponent {
}