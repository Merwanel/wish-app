import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayLettersComponent } from './display-letters.component';

describe('DisplayLettersComponent', () => {
  let component: DisplayLettersComponent;
  let fixture: ComponentFixture<DisplayLettersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayLettersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisplayLettersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
