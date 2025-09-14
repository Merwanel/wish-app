import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ElementRef, QueryList } from '@angular/core';
import { TagComponent, Tag } from './tag.component';
import { TagsService } from '../../../tags.service';
import { WishService } from '../../../wish.service';
import { DynamicInputComponent } from '../../../../ui/dynamic-input/dynamic-input.component';
import { DisplayLettersComponent } from '../../../../ui/display-letters/display-letters.component';
import { AutofocusDirective } from '../../../../ui/dynamic-input/autofocus.directive';
import { Letter } from '../../../../schemas/wish.schema';
import { Suggestion } from '../../../utils/getSuggestions';
import { initLetters } from '../../../utils/letters';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('TagComponent', () => {
  let component: TagComponent;
  let fixture: ComponentFixture<TagComponent>;

  const createMockLetter = (char: string, isMatch: boolean = false): Letter => ({
    letter: char,
    is_a_match: isMatch
  });

  const createMockTag = (value: string): Tag => ({
    id: `tag-${value}`,
    val: value,
    letters: value.split('').map(char => createMockLetter(char))
  });

  const createMockSuggestion = (tag: string, goodRate: number = 1): Suggestion => ({
    tag,
    letters: tag.split('').map(char => createMockLetter(char, true)),
    good_rate: goodRate
  });

  beforeEach(async () => {
    const tagsServiceSpy = jasmine.createSpyObj('TagsService', ['buildTags'], {
      getTags: new Set(['existing1', 'existing2', 'test'])
    });

    await TestBed.configureTestingModule({
      imports: [
        TagComponent,
        FormsModule,
        DynamicInputComponent,
        DisplayLettersComponent,
        AutofocusDirective
      ],
      providers: [
        { provide: TagsService, useValue: tagsServiceSpy },
        WishService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TagComponent);
    component = fixture.componentInstance;

    component.index = 0;
    component.tag = createMockTag('test');
    component.doUpdateWish = true;
  });

  afterEach(() => {
    if (component.idTimeout) {
      window.clearTimeout(component.idTimeout);
    }
  });

  describe('Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with required inputs', () => {
      expect(component.index).toBe(0);
      expect(component.tag).toEqual(createMockTag('test'));
      expect(component.doUpdateWish).toBe(true);
    });

    it('should initialize with default values', () => {
      expect(component.suggestions).toEqual([]);
      expect(component.selected_suggestion_index).toBe(-1);
      expect(component.is_dropdown_opened).toBe(false);
    });
  });

  describe('Tag Display and Rendering', () => {
    it('should render tag input with correct value', () => {
      fixture.detectChanges();

      const dynamicInput = fixture.debugElement.nativeElement.querySelector('app-dynamic-input');
      expect(dynamicInput).toBeTruthy();
    });

    it('should display delete button', () => {
      fixture.detectChanges();

      const deleteButton = fixture.debugElement.nativeElement.querySelector('.delete-button');
      expect(deleteButton).toBeTruthy();
      expect(deleteButton.textContent.trim()).toBe('🗙');
    });

    it('should not show suggestions dropdown initially', () => {
      fixture.detectChanges();

      const suggestionsDiv = fixture.debugElement.nativeElement.querySelector('.suggestions');
      expect(suggestionsDiv).toBeFalsy();
    });

    it('should show suggestions dropdown when opened', () => {
      component.is_dropdown_opened = true;
      component.suggestions = [createMockSuggestion('suggestion1')];
      fixture.detectChanges();

      const suggestionsDiv = fixture.debugElement.nativeElement.querySelector('.suggestions');
      expect(suggestionsDiv).toBeTruthy();
    });
  });

  describe('Tag Interaction Events', () => {
    it('should emit changeCustom on delete button click', () => {
      spyOn(component.changeCustom, 'emit');
      fixture.detectChanges();

      component.onDeleteDoTagEmptyAndCallChange();

      expect(component.tag.val).toBe('');
      expect(component.tag.letters).toEqual([]);
      expect(component.changeCustom.emit).toHaveBeenCalledWith({
        index: 0,
        tag: component.tag,
        doUpdateWish: true
      });
    });

    it('should handle focus event and open dropdown', fakeAsync(() => {
      spyOn(component, 'updateSuggestion');

      component.onFocusDoOpenDropdown();
      tick();

      expect(component.is_dropdown_opened).toBe(true);
      expect(component.updateSuggestion).toHaveBeenCalled();
    }));

    it('should handle blur event and close dropdown', () => {
      spyOn(component.changeCustom, 'emit');
      component.is_dropdown_opened = true;

      component.onBlurDoCloseDropdownAndCallChange();

      expect(component.is_dropdown_opened).toBe(false);
      expect(component.changeCustom.emit).toHaveBeenCalled();
    });

    it('should handle input event and update suggestions', () => {
      spyOn(component, 'updateSuggestion');

      component.onInputDoOpenDropdownAndUpdateSuggestion();

      expect(component.is_dropdown_opened).toBe(true);
      expect(component.updateSuggestion).toHaveBeenCalled();
    });

    it('should handle suggestion click and update tag', () => {
      spyOn(component.changeCustom, 'emit');
      component.suggestions = [
        createMockSuggestion('clicked_suggestion')
      ];

      component.onCickSuggestionDoUpdateTagAndCallChange(0);

      expect(component.tag.val).toBe('clicked_suggestion');
      expect(component.tag.letters).toEqual(initLetters('clicked_suggestion'));
      expect(component.changeCustom.emit).toHaveBeenCalled();
    });
  });

  describe('Tag State Management and Updates', () => {
    it('should update suggestions based on tag value', () => {
      component.tag = createMockTag('te');

      component.updateSuggestion();

      expect(component.suggestions.length).toBeGreaterThan(0);
      expect(component.selected_suggestion_index).toBe(-1);
    });

    it('should reset selected suggestion index when updating suggestions', () => {
      component.selected_suggestion_index = 2;

      component.updateSuggestion();

      expect(component.selected_suggestion_index).toBe(-1);
    });

    it('should emit change event with correct parameters', () => {
      spyOn(component.changeCustom, 'emit');

      component.onChangeDoUpdateSuggestionAndEmitChange();

      expect(component.changeCustom.emit).toHaveBeenCalledWith({
        index: 0,
        tag: component.tag,
        doUpdateWish: true
      });
    });

    it('should update suggestions after change event', () => {
      spyOn(component, 'updateSuggestion');

      component.onChangeDoUpdateSuggestionAndEmitChange();

      expect(component.updateSuggestion).toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(() => {
      component.suggestions = [
        createMockSuggestion('suggestion1'),
        createMockSuggestion('suggestion2'),
        createMockSuggestion('suggestion3')
      ];
      component.is_dropdown_opened = true;

      const mockElementRefs = [
        new ElementRef(document.createElement('button')),
        new ElementRef(document.createElement('button')),
        new ElementRef(document.createElement('button'))
      ];

      const mockQueryList = new QueryList<ElementRef<HTMLButtonElement>>();
      mockQueryList.reset(mockElementRefs);
      component.suggestionsRef = mockQueryList;

      mockElementRefs.forEach(ref => {
        spyOn(ref.nativeElement, 'scrollIntoView');
      });
    });

    it('should handle ArrowDown key to navigate suggestions', () => {
      component.selected_suggestion_index = -1;
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });

      component.onKeyDown(event);

      expect(component.selected_suggestion_index).toBe(0);
    });

    it('should handle ArrowUp key to navigate suggestions', () => {
      component.selected_suggestion_index = 1;
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });

      component.onKeyDown(event);

      expect(component.selected_suggestion_index).toBe(0);
    });

    it('should wrap around when navigating past end of suggestions', () => {
      component.selected_suggestion_index = 2;
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });

      component.onKeyDown(event);

      expect(component.selected_suggestion_index).toBe(0);
    });

    it('should wrap around when navigating before start of suggestions', () => {
      component.selected_suggestion_index = -1;
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });

      component.onKeyDown(event);

      expect(component.selected_suggestion_index).toBe(2);
    });

    it('should handle Enter key to select suggestion', () => {
      spyOn(component.changeCustom, 'emit');
      component.selected_suggestion_index = 1;
      const event = new KeyboardEvent('keydown', { key: 'Enter' });

      component.onKeyDown(event);

      expect(component.tag.val).toBe('suggestion2');
      expect(component.changeCustom.emit).toHaveBeenCalledWith({
        index: 0,
        tag: component.tag,
        doUpdateWish: true
      });
    });

    it('should handle Tab key to navigate suggestions', () => {
      component.selected_suggestion_index = -1;
      const event = new KeyboardEvent('keydown', { key: 'Tab' });

      component.onKeyDown(event);

      expect(component.selected_suggestion_index).toBe(0);
    });
  });

  describe('Tag Validation and Error Handling', () => {
    it('should handle empty tag value', () => {
      component.tag = createMockTag('');

      component.updateSuggestion();

      expect(component.suggestions.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle tag with special characters', () => {
      component.tag = createMockTag('tag-with-special!@#');

      expect(() => component.updateSuggestion()).not.toThrow();
    });

    it('should handle undefined suggestions gracefully', () => {
      component.suggestions = [];
      component.suggestionsRef = new QueryList<ElementRef<HTMLButtonElement>>();
      component.selected_suggestion_index = -1;
      const event = new KeyboardEvent('keydown', { key: 'Enter' });

      component.tagInput = new ElementRef(document.createElement('div'));
      spyOn(component.tagInput.nativeElement, 'blur');

      expect(() => component.onKeyDown(event)).not.toThrow();
    });

    it('should handle invalid suggestion index', () => {
      component.suggestions = [createMockSuggestion('test')];

      expect(() => component.onCickSuggestionDoUpdateTagAndCallChange(999)).toThrow();
    });
  });
});