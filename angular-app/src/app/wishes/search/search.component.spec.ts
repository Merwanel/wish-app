import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchComponent } from './search.component';

describe('SearchComponent', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;

  const testDataScenarios = [
    { description: 'empty string', input: '', expected: '' },
    { description: 'single word', input: 'test', expected: 'test' },
    { description: 'multiple words', input: 'test search query', expected: 'test search query' },
    { description: 'special characters', input: 'test@#$%', expected: 'test@#$%' },
    { description: 'numbers and letters', input: 'test123', expected: 'test123' },
    { description: 'whitespace only', input: '   ', expected: '   ' },
    { description: 'mixed case', input: 'TeSt CaSe', expected: 'TeSt CaSe' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchComponent],
    }).compileComponents();
    

    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    component.val = ''; 
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update search value on input change', () => {
    fixture.componentRef.setInput('val', 'test value');
    fixture.detectChanges();
    expect(component.search.val).toBe('test value');
  });

  describe('EventEmitter verification', () => {
    it('should have searchChange EventEmitter', () => {
      expect(component.searchChange).toBeDefined();
      expect(component.searchChange.emit).toBeDefined();
    });


    it('should emit searchChange event when onInput is called', () => {
      spyOn(component.searchChange, 'emit');
      component.search.val = 'test search';
      
      component.onInputDoEmit();
      
      expect(component.searchChange.emit).toHaveBeenCalledWith('test search');
    });
  });

  describe('Test data scenarios for various input combinations', () => {
    testDataScenarios.forEach(scenario => {
      it(`should handle ${scenario.description} input correctly`, () => {
        fixture.componentRef.setInput('val', scenario.input);
        fixture.detectChanges();
        
        expect(component.search.val).toBe(scenario.expected);
        expect(component.val).toBe(scenario.input);
      });
    });

    it('should update letters when input value changes', () => {
      testDataScenarios.forEach(scenario => {
        fixture.componentRef.setInput('val', scenario.input);
        fixture.detectChanges();
        
        expect(component.search.letters).toBeDefined();
        expect(Array.isArray(component.search.letters)).toBe(true);
      });
    });

    it('should emit correct values for different input scenarios', () => {
      spyOn(component.searchChange, 'emit');
      testDataScenarios.forEach(scenario => {
        
        component.search.val = scenario.input;
        
        component.onInputDoEmit();
        expect(component.searchChange.emit).toHaveBeenCalledWith(scenario.expected);
        
        (component.searchChange.emit as jasmine.Spy).calls.reset();
      });
    });
  });

  describe('Component lifecycle and state management', () => {
    it('should initialize search value from input on ngOnInit', () => {
      component.val = 'initial value';
      component.ngOnInit();
      
      expect(component.search.val).toBe('initial value');
    });

    it('should update search value on ngOnChanges', () => {
      component.val = 'changed value';
      component.ngOnChanges();
      
      expect(component.search.val).toBe('changed value');
    });

    it('should maintain internal state consistency', () => {
      const testValue = 'consistency test';
      fixture.componentRef.setInput('val', testValue);
      fixture.detectChanges();
      
      expect(component.val).toBe(testValue);
      expect(component.search.val).toBe(testValue);
    });
  });
});
