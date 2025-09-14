import { Component } from '@angular/core';
import { WishService } from '../wish.service';
import { WishComponent } from "./wish/wish.component";
import { TagsService } from '../tags.service';
import { AddWishComponent } from './add-wish/add-wish.component';
import { SearchComponent } from "./search/search.component";
import { FUZZY_SEARCH_LAXISM_THRESHOLD } from '../utils/getSuggestions';
import { BetterSelectComponent, option } from '../../ui/better-select/better-select.component';
import { PaginationComponent } from '../../ui/pagination/pagination.component';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { WishWRate } from '../../schemas/wish.schema';

export type DisplayMode = 'display-big-images'|'display-list' ;

@Component({
  selector: 'app-wishes',
  imports: [WishComponent, AddWishComponent, SearchComponent, BetterSelectComponent, PaginationComponent],
  templateUrl: './wishes.component.html',
  styleUrl: './wishes.component.css'
})
export class WishesComponent {
  display_wishes : {ori_idx:number,wish:WishWRate}[] = [] ;
  wishes_matching : WishWRate[] = [] ;

  threshold = FUZZY_SEARCH_LAXISM_THRESHOLD;
  adding = false ;
  options : option[] = [
    {val:'☐ big images', selected_val:'☐', val_to_emit:'display-big-images'}, 
    {val:'☰ list', selected_val:'☰', val_to_emit:'display-list'},
  ]
  display_mode : DisplayMode = this.options[0].val_to_emit ;

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
  search_words : string[] = [];


  private routeSubscription!: Subscription;

  constructor(
    public WishService: WishService, public TagsService: TagsService,
    private activatedRoute: ActivatedRoute, private router: Router
  ) {}
  
  ngOnInit() {
    this.WishService.fetchWishes(this.TagsService) ;

    this.routeSubscription = this.activatedRoute.queryParams.subscribe((params: Params) => {
      this.currentPage = Number(params['page']) || 1;
      if( Number(params['size']) > 0 ) this.itemsPerPage = Number(params['size']);
      this.search_words = params['search'] ? params['search'].split('+') : [];
      this.WishService.setSearch_words = this.search_words;
      this.totalPages = Math.ceil(this.WishService.getWishes.length / this.itemsPerPage);
      this.displayWishesForThatPage() ;
    });
    
  }
  ngOnDestroy() {
    this.routeSubscription.unsubscribe();
  }
  
  async nextPage() {
    await this.goToPage(this.currentPage+1) ;
    this.displayWishesForThatPage() ;
  }
  async prevPage() {
    await this.goToPage(this.currentPage-1) ;
    this.displayWishesForThatPage() ;
  }

  async goToPage(page: number) {
    if (page < 1 ) {
      page = this.totalPages ;
    }
    if (page > this.totalPages) {
      page = 1 ;
    }
    await this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { page: page, size: this.itemsPerPage, search: this.WishService.getSearchWords.join('+') },
      queryParamsHandling: 'merge'
    })
  }
  
  displayWishesForThatPage() {
    const startIndex = (this.currentPage-1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.wishes_matching = this.WishService.getWishes.filter(
      (wish) => wish.matchRate === undefined || wish.matchRate >= this.threshold
    )
    this.totalPages = Math.ceil(this.wishes_matching.length / this.itemsPerPage);
    this.display_wishes = this.wishes_matching.slice(startIndex, endIndex).map((wish, idx) => {
      return {ori_idx: startIndex + idx, wish} ;
    });    
  }
  
  onToogleAdd() {
    this.adding = !this.adding ;
  }
  onClickDoChangeDisplayMode(new_display_mode: DisplayMode) {
    this.display_mode = new_display_mode ;
  }
  onWishUpdatedDoUpdateWish(event: {wish:WishWRate, idx:number}) {
    this.WishService.setWish(event.wish, event.idx) ;
    this.WishService.forceDetectChange() ;
    this.displayWishesForThatPage() ;
  }
  onWishDeletedDoUpdateDisplay(event: {idx:number}) {
    this.WishService.setWishes = this.WishService.getWishes.filter((_, idx) => idx !== event.idx);
    this.WishService.forceDetectChange() ;
    this.totalPages = Math.ceil(this.WishService.getWishes.length / this.itemsPerPage);
    this.displayWishesForThatPage() ;
  }
  onWishAddedDoUpdateDisplay() {
    this.WishService.forceDetectChange() ;
    this.displayWishesForThatPage() ;
  }
  
  async onSearchChangeUpdateURL(searchValue: string) {
    searchValue = searchValue || '' ;
    const searchWords = searchValue.trim() ? searchValue.split(' ').filter(word => word.length > 0) : [];
    this.search_words = searchWords;
    this.WishService.setSearch_words = searchWords;
    
    await this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { 
        page: 1,
        size: this.itemsPerPage, 
        search: searchWords.length > 0 ? searchWords.join('+') : null 
      },
      queryParamsHandling: 'merge'
    });
  }
  
  async onChangeDoUpdatePerPage(event: Event) {
    this.itemsPerPage = Number((event.target as HTMLSelectElement).value);
    
    await this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { 
        page: 1,
        size: this.itemsPerPage, 
        search: this.search_words.length > 0 ? this.search_words.join('+') : null 
      },
      queryParamsHandling: 'merge'
    });
  }
}