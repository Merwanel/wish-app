import { Letter } from "../../schemas/wish.schema";
import { buildLettersFromOptimalPath } from "./letters";

export type Suggestion = {
  tag: string,
  letters: Letter[],
  good_rate: number
}

export const FUZZY_SEARCH_LAXISM_THRESHOLD = .99 ;


export function distanceLevenshtein(word1: string, word2: string) : {
    distance: number;
    optimal_path: number[];
} {
  word1 = word1.toLowerCase() ;
  word2 = word2.toLowerCase() ;

  const memo : number[][] = [];
  for(let i1: number = 0; i1 < word1.length; i1++) {
    memo[i1] = [];
    for(let i2: number = 0; i2 < word2.length; i2++) {
      memo[i1][i2] = 0;
    }
  }
  const path : number[] = []
  let optimal_path : number[]= []
  function choose({i1, i2} : {i1:number, i2:number}) : number {
    if (!optimal_path || optimal_path.length < path.length) {
      optimal_path = path.slice() ;
    }
    if ( i1 == word1.length && i2 == word2.length ) { return 0 ; } 
    if ( i1 == word1.length ) { return word2.length - i2 ; } 
    if ( i2 == word2.length ) { return word1.length - i1 ; }
    if ( memo[i1][i2] != 0 ) { return  memo[i1][i2] ; } 

    if (word1[i1] == word2[i2]) { 
      path.push(i2) ;
      const res = choose({i1:i1+1, i2:i2+1}) ; 
      path.pop()
      return res ;
    }
    const insert = 1 + choose({i1, i2:i2+1}) ;
    const delete_ = 1 + choose({i1:i1+1, i2}) ;
    const replace = 1 + choose({i1:i1+1, i2:i2+1}) ;
    memo[i1][i2] = Math.min(insert, delete_, replace) ;
    return  memo[i1][i2] ;
  } 
  const distance = choose({i1:0, i2:0}) ;
  return { distance , optimal_path};
};


export function getGoodRateAndPath(word1: string, word2: string) {
  const {distance, optimal_path} = distanceLevenshtein(word1, word2) ;
  const nb_good = word2.length - distance ;
  const nb_good_max = word1.length ;
  const good_rate = nb_good_max === 0 ? 1 : nb_good / nb_good_max;
  return {good_rate, optimal_path} ;
}


export function getSuggestions(search_tag: string, all_tags: Set<string>) {
    if(!all_tags) {
        return [] ;
    }
    const suggestions: Suggestion[] = [] ;
    all_tags.forEach((tagIn) => {
      const {good_rate, optimal_path} = getGoodRateAndPath(search_tag, tagIn) ;
      if( good_rate  >=  FUZZY_SEARCH_LAXISM_THRESHOLD) {
        const letters = buildLettersFromOptimalPath(tagIn, optimal_path) ;
        suggestions.push({good_rate, tag:tagIn, letters}) ;
      }
    })
    suggestions.sort((tag1, tag2) => tag2.good_rate - tag1.good_rate ) ;
    return suggestions;
  }

  export function isArrayEqual<T>(a: T[], b: T[]) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }