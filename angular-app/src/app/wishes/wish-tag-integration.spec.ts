import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { WishService } from '../wish.service';
import { TagsService } from '../tags.service';
import { WishPartial } from '../../schemas/wish.schema';
import { API_DB_URL } from '../../const';
import { uint8ArrayToBase64 } from 'uint8array-extras';

describe('Wish-Tag Integration Tests', () => {
  let wishService: WishService;
  let tagsService: TagsService;
  let httpMock: HttpTestingController;
  
  const createMockApiWish = (overrides: any = {}) => ({
    id: 1,
    name: 'Test Wish',
    comment: 'Test Comment',
    tags: ['gaming', 'adventure'],
    picture: uint8ArrayToBase64(new Uint8Array([1, 2, 3, 4])),
    createdAt: '2023-01-01T00:00:00.000Z',
    ...overrides
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        WishService,
        TagsService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    wishService = TestBed.inject(WishService);
    tagsService = TestBed.inject(TagsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Wish Creation with Tags', () => {
    it('should create wish with new tags and update tag collection', async () => {
      const initialWishes = [
        createMockApiWish({ id: 1, tags: ['existing', 'common'] }),
        createMockApiWish({ id: 2, tags: ['common', 'old'] })
      ];

      const fetchPromise = wishService.fetchWishes(tagsService);
      const fetchReq = httpMock.expectOne(`${API_DB_URL}all-wishes`);
      fetchReq.flush(initialWishes);

      await fetchPromise;

      expect(tagsService.getTags.has('existing')).toBe(true);
      expect(tagsService.getTags.has('common')).toBe(true);
      expect(tagsService.getTags.has('old')).toBe(true);
      expect(tagsService.getTags.has('newtag')).toBe(false);

      const newWishData = {
        name: 'New Game',
        comment: 'Exciting new game',
        tags: ['common', 'newtag', 'fresh'],
        picture: new Uint8Array([5, 6, 7, 8]),
        createdAt: new Date().toISOString()
      };

      wishService.addWish(newWishData).subscribe({
        complete: () => {
          expect(tagsService.getTags.has('newtag')).toBe(true);
          expect(tagsService.getTags.has('fresh')).toBe(true);
          expect(tagsService.getTags.size).toBe(5);
        },
      });

      const createReq = httpMock.expectOne(`${API_DB_URL}new-wish`);
      expect(createReq.request.method).toBe('POST');
      createReq.flush({ success: true });

      const refetchReq = httpMock.expectOne(`${API_DB_URL}all-wishes`);
      const requestBody = JSON.parse(createReq.request.body);
      expect(requestBody.tags).toEqual(['common', 'newtag', 'fresh']);

      const updatedWishes = [
        ...initialWishes,
        createMockApiWish({
          id: 3,
          name: 'New Game',
          comment: 'Exciting new game',
          tags: ['common', 'newtag', 'fresh']
        })
      ];

      refetchReq.flush(updatedWishes);


      expect(tagsService.getTags.has('existing')).toBe(true);
      expect(tagsService.getTags.has('common')).toBe(true);
      expect(tagsService.getTags.has('old')).toBe(true);
      expect(tagsService.getTags.has('newtag')).toBe(true);
      expect(tagsService.getTags.has('fresh')).toBe(true);
      expect(tagsService.getTags.size).toBe(5);
    });
  });

  describe('Tag Building from Multiple Wishes', () => {
    it('should aggregate tags from multiple wishes correctly', async () => {
      const multipleWishes = [
        createMockApiWish({ id: 1, tags: ['rpg', 'fantasy', 'singleplayer'] }),
        createMockApiWish({ id: 2, tags: ['fps', 'multiplayer', 'competitive'] }),
        createMockApiWish({ id: 3, tags: ['rpg', 'multiplayer', 'coop'] }),
        createMockApiWish({ id: 4, tags: ['strategy', 'fantasy', 'turnbased'] })
      ];

      const fetchPromise = wishService.fetchWishes(tagsService);
      const fetchReq = httpMock.expectOne(`${API_DB_URL}all-wishes`);
      fetchReq.flush(multipleWishes);
      await fetchPromise;

      const expectedTags = new Set([
        'rpg', 'fantasy', 'singleplayer',
        'fps', 'multiplayer', 'competitive',
        'coop', 'strategy', 'turnbased'
      ]);

      expect(tagsService.getTags.size).toBe(expectedTags.size);
      expectedTags.forEach(tag => {
        expect(tagsService.getTags.has(tag)).toBe(true);
      });
    });

    it('should handle empty wishes array for tag building', async () => {
      const fetchPromise = wishService.fetchWishes(tagsService);
      const fetchReq = httpMock.expectOne(`${API_DB_URL}all-wishes`);
      fetchReq.flush([]);
      await fetchPromise;

      expect(tagsService.getTags.size).toBe(0);
    });
  });

  describe('Wish Updates Affecting Tag Collections', () => {
    it('should update tag collection when wish tags are modified', async () => {
      const initialWishes = [
        createMockApiWish({ id: 1, tags: ['old', 'common'] }),
        createMockApiWish({ id: 2, tags: ['common', 'stable'] })
      ];

      const fetchPromise = wishService.fetchWishes(tagsService);
      const fetchReq = httpMock.expectOne(`${API_DB_URL}all-wishes`);
      fetchReq.flush(initialWishes);
      await fetchPromise;

      expect(tagsService.getTags.has('old')).toBe(true);
      expect(tagsService.getTags.has('common')).toBe(true);
      expect(tagsService.getTags.has('stable')).toBe(true);
      expect(tagsService.getTags.has('new')).toBe(false);

      const wishUpdate: WishPartial = {
        id: 1,
        tags: ['new', 'common', 'updated']
      };

      wishService.updateWish(wishUpdate);

      const updateReq = httpMock.expectOne(`${API_DB_URL}update-wish`);
      expect(updateReq.request.method).toBe('PATCH');
      const requestBody = JSON.parse(updateReq.request.body);
      expect(requestBody.tags).toEqual(['new', 'common', 'updated']);

      const updatedWish = createMockApiWish({
        id: 1,
        tags: ['new', 'common', 'updated']
      });
      updateReq.flush(updatedWish);

      const refetchReq = httpMock.expectOne(`${API_DB_URL}all-wishes`);
      const updatedWishes = [
        createMockApiWish({ id: 1, tags: ['new', 'common', 'updated'] }),
        createMockApiWish({ id: 2, tags: ['common', 'stable'] })
      ];
      refetchReq.flush(updatedWishes);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(tagsService.getTags.has('old')).toBe(false);
      expect(tagsService.getTags.has('common')).toBe(true);
      expect(tagsService.getTags.has('stable')).toBe(true);
      expect(tagsService.getTags.has('new')).toBe(true);
      expect(tagsService.getTags.has('updated')).toBe(true);
    });

    it('should handle wish update removing all tags', async () => {
      const initialWishes = [
        createMockApiWish({ id: 1, tags: ['remove', 'these'] }),
        createMockApiWish({ id: 2, tags: ['keep', 'these'] })
      ];

      const fetchPromise = wishService.fetchWishes(tagsService);
      const fetchReq = httpMock.expectOne(`${API_DB_URL}all-wishes`);
      fetchReq.flush(initialWishes);
      await fetchPromise;

      const wishUpdate: WishPartial = {
        id: 1,
        tags: []
      };

      wishService.updateWish(wishUpdate);

      const updateReq = httpMock.expectOne(`${API_DB_URL}update-wish`);
      updateReq.flush(createMockApiWish({ id: 1, tags: [] }));

      const refetchReq = httpMock.expectOne(`${API_DB_URL}all-wishes`);
      const updatedWishes = [
        createMockApiWish({ id: 1, tags: [] }),
        createMockApiWish({ id: 2, tags: ['keep', 'these'] })
      ];
      refetchReq.flush(updatedWishes);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(tagsService.getTags.has('remove')).toBe(false);
      expect(tagsService.getTags.has('these')).toBe(true);
      expect(tagsService.getTags.has('keep')).toBe(true);
      expect(tagsService.getTags.size).toBe(2);
    });
  });
});