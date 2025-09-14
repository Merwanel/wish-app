import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TagsService } from './tags.service';
import { WishService } from './wish.service';
import { Letter, WishWRate } from '../schemas/wish.schema';

describe('TagsService', () => {
  let service: TagsService;
  let wishService: WishService;
  let httpMock: HttpTestingController;

  const createMockLetter = (char: string): Letter => ({
    letter: char,
    is_a_match: false
  });

  const createMockWish = (
    id: number, name: string, tags: string[], comment: string = 'Test comment'
  ): WishWRate => ({
    id,
    name: {
      val: name,
      letters: name.split('').map(createMockLetter)
    },
    comment: {
      val: comment,
      letters: comment.split('').map(createMockLetter)
    },
    tags: tags.map((tag, index) => ({
      id: `tag-${id}-${index}`,
      val: tag,
      letters: tag.split('').map(createMockLetter)
    })),
    matchRate: 1,
    track_id: `2025-07-14T00:00:00.000Z${id}`,
    createdAt: new Date().toISOString(),
    picture: new Uint8Array()
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TagsService,
        WishService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(TagsService);
    wishService = TestBed.inject(WishService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with empty tags set', () => {
      expect(service.getTags).toBeInstanceOf(Set);
      expect(service.getTags.size).toBe(0);
    });

    it('should have WishService dependency injected', () => {
      expect(service.WishService).toBeTruthy();
      expect(service.WishService).toBeInstanceOf(WishService);
    });
  });

  describe('Tag Collection Building', () => {
    it('should build tags from single wish with multiple tags', () => {
      const mockWishes = [
        createMockWish(1, 'Test Wish', ['tag1', 'tag2', 'tag3'])
      ];
      wishService.setWishes = mockWishes;

      service.buildTags();

      expect(service.getTags.size).toBe(3);
      expect(service.getTags.has('tag1')).toBe(true);
      expect(service.getTags.has('tag2')).toBe(true);
      expect(service.getTags.has('tag3')).toBe(true);
    });

    it('should build tags from multiple wishes', () => {
      const mockWishes = [
        createMockWish(1, 'Wish 1', ['books', 'fiction']),
        createMockWish(2, 'Wish 2', ['movies', 'action']),
        createMockWish(3, 'Wish 3', ['games', 'rpg'])
      ];
      wishService.setWishes = mockWishes;

      service.buildTags();

      expect(service.getTags.size).toBe(6);
      expect(service.getTags.has('books')).toBe(true);
      expect(service.getTags.has('fiction')).toBe(true);
      expect(service.getTags.has('movies')).toBe(true);
      expect(service.getTags.has('action')).toBe(true);
      expect(service.getTags.has('games')).toBe(true);
      expect(service.getTags.has('rpg')).toBe(true);
    });

    it('should handle wishes with no tags', () => {
      const mockWishes = [
        createMockWish(1, 'Wish without tags', [])
      ];
      wishService.setWishes = mockWishes;

      service.buildTags();

      expect(service.getTags.size).toBe(0);
    });

    it('should handle empty wishes array', () => {
      wishService.setWishes = [];

      service.buildTags();

      expect(service.getTags.size).toBe(0);
    });
  });

  describe('Tag Uniqueness and Deduplication', () => {
    it('should deduplicate identical tags from same wish', () => {
      const mockWishes = [
        createMockWish(1, 'Test Wish', ['duplicate', 'duplicate', 'unique'])
      ];
      wishService.setWishes = mockWishes;

      service.buildTags();

      expect(service.getTags.size).toBe(2);
      expect(service.getTags.has('duplicate')).toBe(true);
      expect(service.getTags.has('unique')).toBe(true);
    });

    it('should deduplicate identical tags across multiple wishes', () => {
      const mockWishes = [
        createMockWish(1, 'Wish 1', ['common', 'unique1']),
        createMockWish(2, 'Wish 2', ['common', 'unique2']),
        createMockWish(3, 'Wish 3', ['common', 'unique3'])
      ];
      wishService.setWishes = mockWishes;

      service.buildTags();

      expect(service.getTags.size).toBe(4);
      expect(service.getTags.has('common')).toBe(true);
      expect(service.getTags.has('unique1')).toBe(true);
      expect(service.getTags.has('unique2')).toBe(true);
      expect(service.getTags.has('unique3')).toBe(true);
    });

    it('should handle case-sensitive tag deduplication', () => {
      const mockWishes = [
        createMockWish(1, 'Test Wish', ['Tag', 'tag', 'TAG'])
      ];
      wishService.setWishes = mockWishes;

      service.buildTags();

      expect(service.getTags.size).toBe(3);
      expect(service.getTags.has('Tag')).toBe(true);
      expect(service.getTags.has('tag')).toBe(true);
      expect(service.getTags.has('TAG')).toBe(true);
    });
  });

  describe('Integration with WishService', () => {
    it('should access wishes through WishService.getWishes', () => {
      const mockWishes = [
        createMockWish(1, 'Test Wish', ['integration'])
      ];
      wishService.setWishes = mockWishes;

      service.buildTags();

      expect(service.getTags.has('integration')).toBe(true);
    });

    it('should handle when WishService has no wishes', () => {
      wishService.setWishes = [];

      service.buildTags();

      expect(service.getTags.size).toBe(0);
    });

    it('should rebuild tags when called multiple times', () => {
      const firstWishes = [createMockWish(1, 'First', ['tag1'])];
      wishService.setWishes = firstWishes;
      service.buildTags();
      expect(service.getTags.size).toBe(1);
      expect(service.getTags.has('tag1')).toBe(true);

      const secondWishes = [
        createMockWish(1, 'First', ['tag1']),
        createMockWish(2, 'Second', ['tag2'])
      ];
      wishService.setWishes = secondWishes;
      service.buildTags();

      expect(service.getTags.size).toBe(2);
      expect(service.getTags.has('tag1')).toBe(true);
      expect(service.getTags.has('tag2')).toBe(true);
    });
  });

  describe('Tag State Management', () => {
    it('should accumulate tags when wishes are updated', () => {
      wishService.setWishes = [createMockWish(1, 'First', ['initial'])];
      service.buildTags();
      expect(service.getTags.size).toBe(1);

      wishService.setWishes = [
        createMockWish(1, 'First', ['initial']),
        createMockWish(2, 'Second', ['additional'])
      ];
      service.buildTags();

      expect(service.getTags.size).toBe(2);
      expect(service.getTags.has('initial')).toBe(true);
      expect(service.getTags.has('additional')).toBe(true);
    });

    it('should handle wishes with undefined or null tags gracefully', () => {
      const mockWishWithoutTags: WishWRate = {
        id: 1,
        name: { val: 'Test', letters: [] },
        comment: { val: 'Test', letters: [] },
        tags: undefined as any,
        createdAt: new Date().toISOString(),
        picture: new Uint8Array()
      };

      wishService.setWishes = [mockWishWithoutTags];

      expect(() => service.buildTags()).not.toThrow();
      expect(service.getTags.size).toBe(0);
    });
  });
});