import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { WishesComponent } from './wishes.component';
import { WishService } from '../wish.service';
import { TagsService } from '../tags.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { WishWRate } from '../../schemas/wish.schema';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

describe('WishesComponent', () => {
  let component: WishesComponent;
  let fixture: ComponentFixture<WishesComponent>;
  let wishService: jasmine.SpyObj<WishService>;
  let tagsService: jasmine.SpyObj<TagsService>;
  let router: jasmine.SpyObj<Router>;
  let queryParams: BehaviorSubject<any>;

  let mutableMockWishes: WishWRate[];
  
  const initialMockWishes: WishWRate[] = [
    {
      id: 1,
      name: { val: 'Wish 1', letters: [] },
      comment: { val: 'Comment 1', letters: [] },
      tags: [{ id: '1', val: 'tag1', letters: [] }],
      createdAt: new Date().toISOString(),
      picture: new Uint8Array(),
      matchRate: .3
    },
    {
      id: 2,
      name: { val: 'Wish 2', letters: [] },
      comment: { val: 'Comment 2', letters: [] },
      tags: [{ id: '2', val: 'tag2', letters: [] }],
      createdAt: new Date().toISOString(),
      picture: new Uint8Array(),
      matchRate: 1
    }
  ];

  beforeEach(async () => {
    mutableMockWishes = JSON.parse(JSON.stringify(initialMockWishes));

    wishService = jasmine.createSpyObj('WishService',
      ['fetchWishes', 'forceDetectChange'],
      {
        getWishes: mutableMockWishes,
        getSearchWords: [],
      });
    wishService.fetchWishes.and.returnValue(Promise.resolve());
    
    wishService.setWish= jasmine.createSpy('setWish').and.callFake((wish:WishWRate, idx:number) => {
        mutableMockWishes[idx] = wish;
    }),

    Object.defineProperty(wishService, 'setWishes', {
      set: jasmine.createSpy('setWishes').and.callFake((wishes: WishWRate[]) => {
        mutableMockWishes = wishes;
      }),
    });
    
    Object.defineProperty(wishService, 'getWishes', {
      get: jasmine.createSpy('getWishes').and.callFake(() => mutableMockWishes),
    });


    tagsService = jasmine.createSpyObj('TagsService', ['buildTags']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    queryParams = new BehaviorSubject({});

    await TestBed.configureTestingModule({
      providers: [
        { provide: WishService, useValue: wishService },
        { provide: TagsService, useValue: tagsService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: queryParams.asObservable()
          }
        },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WishesComponent);
    component = fixture.componentInstance;
    component.threshold = 0;
    component.ngOnInit();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch wishes on init', () => {
    expect(wishService.fetchWishes).toHaveBeenCalledWith(tagsService);
  });

  it('should handle query params changes', fakeAsync(() => {
    queryParams.next({ page: '2', size: '5', search: 'test+query' });
    tick();

    expect(component.currentPage).toBe(2);
    expect(component.itemsPerPage).toBe(5);
    expect(component.search_words).toEqual(['test', 'query']);
  }));

  it('should calculate total pages correctly', () => {
    component.itemsPerPage = 1;
    component.displayWishesForThatPage();
    expect(component.totalPages).toBe(mutableMockWishes.length);
  });

  it('should navigate to next page', fakeAsync(async () => {
    component.currentPage = 1;
    component.totalPages = 2;

    await component.nextPage();

    expect(router.navigate).toHaveBeenCalledWith(
      [],
      jasmine.objectContaining({
        queryParams: jasmine.objectContaining({
          page: 2
        })
      })
    );
  }));

  it('should navigate to previous page', fakeAsync(async () => {
    component.currentPage = 2;
    component.totalPages = 2;

    await component.prevPage();

    expect(router.navigate).toHaveBeenCalledWith(
      [],
      jasmine.objectContaining({
        queryParams: jasmine.objectContaining({
          page: 1
        })
      })
    );
  }));

  it('should wrap around to last page when going previous from first page', fakeAsync(async () => {
    component.currentPage = 1;
    component.totalPages = 3;

    await component.prevPage();

    expect(router.navigate).toHaveBeenCalledWith(
      [],
      jasmine.objectContaining({
        queryParams: jasmine.objectContaining({
          page: 3
        })
      })
    );
  }));

  it('should wrap around to first page when going next from last page', fakeAsync(async () => {
    component.currentPage = 3;
    component.totalPages = 3;

    await component.nextPage();

    expect(router.navigate).toHaveBeenCalledWith(
      [],
      jasmine.objectContaining({
        queryParams: jasmine.objectContaining({
          page: 1
        })
      })
    );
  }));

  it('should toggle add mode', () => {
    expect(component.adding).toBeFalse();
    component.onToogleAdd();
    expect(component.adding).toBeTrue();
    component.onToogleAdd();
    expect(component.adding).toBeFalse();
  });

  it('should change display mode', () => {
    component.onClickDoChangeDisplayMode('display-list');
    expect(component.display_mode).toBe('display-list');

    component.onClickDoChangeDisplayMode('display-big-images');
    expect(component.display_mode).toBe('display-big-images');
  });

  it('should handle wish updates', () => {
    const updatedWish = { ...mutableMockWishes[0], name: { val: 'Updated Wish', letters: [] } };
    component.onWishUpdatedDoUpdateWish({ wish: updatedWish, idx: 0 });

    expect(wishService.setWish).toHaveBeenCalledWith(updatedWish, 0);
    expect(wishService.forceDetectChange).toHaveBeenCalled();
    expect(component.display_wishes[0].wish).toEqual(updatedWish);
  });

  it('should handle wish deletion', () => {
    const originalLength = mutableMockWishes.length;
    component.onWishDeletedDoUpdateDisplay({ idx: 0 });
    fixture.detectChanges();

    expect(wishService.forceDetectChange).toHaveBeenCalled();
    expect(mutableMockWishes.length).toBe(originalLength - 1); 
    expect(component.display_wishes.length).toBe(originalLength - 1); 
    expect(component.display_wishes[0].wish.id).toBe(2);
  });

  it('should filter wishes based on match rate threshold', () => {
    component.threshold = 0.6;

    component.displayWishesForThatPage();
    expect(component.display_wishes.length).toBe(1);
  });
});