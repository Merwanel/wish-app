import { Letter } from "../../schemas/wish.schema";

export function buildLettersFromOptimalPath(word2:string, optimal_path: number[]) : Letter[] {
  let i_path = 0 
  const letters : Letter[] = [] ;
  for(let i = 0 ; i < word2.length ; i++) {
    let is_a_match = false ;
    if ( i_path < optimal_path.length && i == optimal_path[i_path]) {
        is_a_match = true ;
        i_path ++ ;
    }
    letters.push({letter:word2[i] , is_a_match}) ;
  }
  return letters;
}

export function initLetters(val: string) : Letter[] {
  return val.split('').map(c => {return {
    letter: c,
    is_a_match: false
  }});
}