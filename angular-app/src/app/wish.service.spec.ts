import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { WishService } from './wish.service';
import { API_DB_URL } from '../const';
import { Letter, WishOmitId, WishToSend, WishWRate } from '../schemas/wish.schema';
import { provideHttpClient } from '@angular/common/http';

describe('WishService', () => {
  let service: WishService;
  let httpMock: HttpTestingController;

  const createMockLetter = (char: string): Letter => ({
	letter: char,
	is_a_match: false
  });

  beforeEach(() => {
	TestBed.configureTestingModule({
	  providers: [
		WishService,
		provideHttpClient(),
		provideHttpClientTesting()
	  ]
	});
	service = TestBed.inject(WishService);
	httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
	httpMock.verify();
  });

  it('should be created', () => {
	expect(service).toBeTruthy();
  });

  describe('fetchWishes', () => {
		it('should fetch wishes and update service state', async () => {
			const mockWishes: WishToSend[] = [{
				id: 1,
				name: 'Test Wish',
				comment: 'Test Comment',
				tags: ['test'],
				createdAt: new Date().toISOString(),
				picture: ""
			}];

			const fetchPromise = service.fetchWishes();
			
			const req = httpMock.expectOne(`${API_DB_URL}all-wishes`);
			expect(req.request.method).toBe('GET');
			req.flush(mockWishes);

			await fetchPromise;
			
			expect(service.getWishes.length).toBe(1);
			expect(service.getWishes[0].name.val).toBe('Test Wish');
		});
  });

  describe('addWish', () => {
		it('should send POST request and refresh wishes with updated data', () => {
			const mockWish: WishOmitId = {
				name: 'New Wish',
				comment: 'New Comment',
				tags: ['new'],
				createdAt: new Date().toISOString(),
				picture: new Uint8Array()
			};

			const mockResponse: WishToSend[] = [{
				id: 1,
				name: 'New Wish',
				comment: 'New Comment',
				tags: ['new'],
				createdAt: mockWish.createdAt,
				picture: '' 
			}];

			service.addWish(mockWish).subscribe({
        complete: () => {
					expect(service.getWishes.length).toBe(1);
					expect(service.getWishes[0].name.val).toBe('New Wish');
					expect(service.getWishes[0].comment.val).toBe('New Comment');
					expect(service.getWishes[0].tags[0].val).toBe('new');
        },
      });


			const addReq = httpMock.expectOne(`${API_DB_URL}new-wish`);
			expect(addReq.request.method).toBe('POST');
			addReq.flush({ success: true });

			const fetchReq = httpMock.expectOne(`${API_DB_URL}all-wishes`);
			expect(fetchReq.request.method).toBe('GET');
			fetchReq.flush(mockResponse);

		});
  });

  describe('search feature', () => {
		it('should update search words and match rates', () => {
			const mockWishes: WishWRate[] = [
			{
				id: 1,
				name: { 
					val: 'Test Wish', 
					letters: 'Test Wish'.split('').map(createMockLetter)
				},
				comment: { 
					val: 'Test Comment', 
					letters: 'Test Comment'.split('').map(createMockLetter)
				},
				tags: [{ 
					id: '123',
					val: 'test', 
					letters: 'test'.split('').map(createMockLetter)
				}],
				matchRate: 0,
				track_id: '2025-07-14T00:00:00.000Z1',
				createdAt: new Date().toISOString(),
				picture: new Uint8Array()
			}
			];

			service.setWishes = mockWishes;
			service.setSearch_words = ['Test'];
			
			expect(service.getSearchWords).toEqual(['Test']);
			expect(service.getWishes[0].matchRate).toBeGreaterThan(0);
		});
  });
});
