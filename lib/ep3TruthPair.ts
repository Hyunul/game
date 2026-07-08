import { EP3_TRUTH_PAIRS } from './puzzles-ep3';

export const EP3_TRUTH_IDS = Object.keys(EP3_TRUTH_PAIRS);

export type Ep3TruthPairResult =
  | { readonly kind: 'new'; readonly puzzleId: string }
  | { readonly kind: 'already-found'; readonly puzzleId: string }
  | { readonly kind: 'wrong'; readonly puzzleId: string }
  | { readonly kind: 'blocked' };

export function resolveEp3TruthPair(
  answer: string,
  solved: readonly string[],
  canAttempt: (puzzleId: string) => boolean,
): Ep3TruthPairResult {
  const match = EP3_TRUTH_IDS.find((pid) => EP3_TRUTH_PAIRS[pid] === answer);
  if (match && solved.includes(match)) return { kind: 'already-found', puzzleId: match };
  if (match && canAttempt(match)) return { kind: 'new', puzzleId: match };

  const target = EP3_TRUTH_IDS.find((pid) => canAttempt(pid));
  return target ? { kind: 'wrong', puzzleId: target } : { kind: 'blocked' };
}
