import { Routes } from '@angular/router';
import { WishesComponent } from './wishes/wishes.component';
import { ErrorComponent } from './error/error.component';

export const routes: Routes = [
  { path: 'error', component: ErrorComponent },
  { path: '', component: WishesComponent },
];
