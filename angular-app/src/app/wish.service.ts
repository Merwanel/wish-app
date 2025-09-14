import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_DB_URL } from '../const';
import { map, switchMap, from } from 'rxjs';
import { convertBase64ToUint8ArrayAndAddUUIDToTagsAndAddLetters, convertBase64ToUint8ArrayAndAddUUIDToTagsAndAddLettersArray, convertUint8ArrayToBase64, convertUint8ArrayToBase64Partial, Letter, Wish, WishOmitId, WishPartial, WishWRate } from '../schemas/wish.schema';
import { TagsService } from './tags.service';
import { getGoodRateAndPath, isArrayEqual } from './utils/getSuggestions';
import { buildLettersFromOptimalPath } from './utils/letters';
import { base64ToUint8Array, uint8ArrayToBase64 } from 'uint8array-extras';
import { z } from "zod";
import { WishDTO } from "shared-schemas";

@Injectable({
  providedIn: 'root'
})
export class WishService {
  constructor(private http: HttpClient) { }
  private wishes: WishWRate[] = [];
  private search_words: string[] = [];
  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  private tagsService?: TagsService;

  get getWishes() { return this.wishes; };
  set setWishes(wishes: WishWRate[]) { this.wishes = wishes; };
  setWish(wish: WishWRate, idx: number) { this.wishes[idx] = wish; };
  forceDetectChange() { this.wishes = [...this.getWishes] }

  get getSearchWords() { return this.search_words; };
  set setSearch_words(search_words: string[]) {
    if (isArrayEqual(this.search_words, search_words)) {
      return;
    }
    this.search_words = [...search_words];
    this.matchingAllWishes()
    if( this.search_words.length == 0 ) {
      const is_increasing = false ;
      this.sortWishesBy('createdAt', is_increasing);
    }
    else {
      const is_increasing = false;
      this.sortWishesBy('matchRate', is_increasing);
    }
  }

  fetchWishes(TagsService?: TagsService): Promise<void> {
    if (TagsService) {
      this.tagsService = TagsService;
    }

    return new Promise<void>((resolve, reject) => {
      this.http
        .get(`${API_DB_URL}all-wishes`, {})
        .pipe(map((wishes) => WishDTO.array().parse(wishes)))
        .pipe(map((wishes) => convertBase64ToUint8ArrayAndAddUUIDToTagsAndAddLettersArray(wishes)))
        .subscribe({
          next: (wishes) => {
            this.wishes = wishes.map((wish) => { return { ...wish, track_id: new Date().toISOString() + wish.id } });
            if (this.search_words.length) {
              this.matchingAllWishes()
              const is_increasing = false;
              this.sortWishesBy('matchRate', is_increasing);
            }
            else {
              const is_increasing = false;
              this.sortWishesBy('createdAt', is_increasing);
            }
            const tagsServiceToUse = TagsService || this.tagsService;
            if (tagsServiceToUse) {
              tagsServiceToUse.buildTags()
            }
            resolve();
          },
          error: (err) => {
            reject(err);
          }
        });
    });
  }

  mergeMatchingLetters(oldL: Letter[], newL: Letter[]): Letter[] {
    if (oldL.length !== newL.length) {
      throw (`oldL:${oldL} and newL:${newL} should have equal length`);
    }
    for (let i = 0; i < oldL.length; i++) {
      newL[i].is_a_match ||= oldL[i].is_a_match;
    }
    return newL;
  }
  helper(search_word: string, v: { val: string, letters: Letter[] }) {
    const { good_rate, optimal_path } = getGoodRateAndPath(search_word, v.val);
    v.letters = buildLettersFromOptimalPath(v.val, optimal_path)
    return good_rate;
  }
  matchingWish(wish: WishWRate) {
    if (this.search_words.length === 0) {
      wish.matchRate = 1;
      return;
    }
    wish.matchRate = 0;
    for (const search_word of this.search_words) {
      wish.matchRate = Math.max(wish.matchRate, this.helper(search_word, wish.name));
      wish.matchRate = Math.max(wish.matchRate, this.helper(search_word, wish.comment));

      for (const tag of wish.tags) {
        wish.matchRate = Math.max(wish.matchRate, this.helper(search_word, tag));
      }
    }
  }
  matchingAllWishes() {
    for (const wish of this.wishes) {
      this.matchingWish(wish);
    }
  }

  sortWishesBy(key_to_compare: 'matchRate' | 'createdAt', is_increasing: boolean) {
    function compare(key: keyof WishWRate, a: WishWRate, b: WishWRate) {

      if (a[key] === undefined || a[key] === null || b[key] === undefined || b[key] === null) {
        return 0;
      }
      if (a[key] < b[key]) {
        if (is_increasing == true) { return -1; }
        return 1
      }
      if (a[key] > b[key]) {
        if (is_increasing == true) { return 1; }
        return -1
      }

      return a.id - b.id;
    }
    this.wishes.sort(compare.bind(undefined, key_to_compare))
  }

  addWish(wishData: WishOmitId) {
    const WishDataToSend = convertUint8ArrayToBase64(wishData)
    return this.http
      .post(`${API_DB_URL}new-wish`, JSON.stringify(WishDataToSend), { 'headers': this.headers })
      .pipe(
        switchMap((res) => {
          return from(this.fetchWishes()).pipe(
            map(() => res)
          );
        })
      );
  }

  updateWish(wishData: WishPartial) {
    const WishDataToSend = convertUint8ArrayToBase64Partial(wishData);
    const req = this.http
      .patch(`${API_DB_URL}update-wish`, JSON.stringify(WishDataToSend), { headers: this.headers })
      .pipe(
        map((res) => WishDTO.parse(res)),
      )
      .pipe(
        map((res) => convertBase64ToUint8ArrayAndAddUUIDToTagsAndAddLetters(res)),
      )
      .pipe<WishWRate>(
        map((wish) => {
          this.matchingWish(wish);
          return { ...wish, track_id: new Date().toISOString() + wish.id };
        })
      )
    req.subscribe(
      (res) => { this.fetchWishes(); }
    );
    return req;
  }

  deleteWish(id: Number) {
    this.http
      .delete(`${API_DB_URL}delete-wish/${id}`)
      .subscribe((res) => { this.fetchWishes() })
  }
  convertImage(image: Uint8Array) {
    const image_base64 = uint8ArrayToBase64(image)
    const req = this.http
      .post(
        `${API_DB_URL}convert-image`, JSON.stringify({ image_base64 }), { headers: this.headers }
      )
      .pipe(map(
        (res) => {
          return z.string().parse(res);
        }
      ))
      .pipe(map(
        (res) => base64ToUint8Array(res)
      ));
    return req;
  }
}
