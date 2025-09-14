import { Injectable } from '@angular/core';
import { WishService } from './wish.service';

@Injectable({
  providedIn: 'root'
})
export class TagsService {
  private tags = new Set<string>() ;
  constructor(public WishService: WishService) {}

  get getTags() {return this.tags} ;
  buildTags() {
    this.tags.clear();
    this.WishService.getWishes.forEach(wish => {
      if(wish.tags) {
        wish.tags.forEach(tag => this.tags.add(tag.val))
      }
    })
  }
}
