// Core layout engine for the Instagram review carousel (PRD §16-20).
//
// Rules:
//  - Each page holds MIN..MAX reviews (2..4).
//  - Longer reviews take more vertical space, so fewer fit per page.
//  - Readability wins over count: we never cram 4 long reviews onto one page.
//  - No orphan pages: every page has at least 2 reviews (the [2,4] size
//    constraint guarantees this; e.g. 5 -> 3+2, never 4+1).
//  - Balanced: among equal-page-count options we prefer even splits
//    (6 -> 3+3, not 4+2).
//
// The function is pure so it can be unit-tested and run identically on the
// server (planning/preview counts) and client (canvas rendering).

export const MIN_PER_PAGE = 2;
export const MAX_PER_PAGE = 4;

/** Chars that fit on one line of comment text at the target image width. */
const CHARS_PER_LINE = 18;
/** Fixed lines each review block always uses: star row + author row. */
const BLOCK_OVERHEAD_LINES = 2;
/** Soft per-page line budget. Overflow beyond this is penalized, not banned. */
const SOFT_CAP_LINES = 15;

// Cost weights, tuned so that: overflow forces a split; an extra page is
// avoided unless needed; ties break toward balanced, well-filled pages.
const PAGE_BASE = 10;
const OVERFLOW_W = 3;
const EMPTY_W = 0.4;
const BALANCE_W = 0.6;

export interface LayoutReview {
  id: string;
  comment: string;
}

export interface PagePlan {
  /** Review ids on this page, in order. */
  reviewIds: string[];
}

/** Estimate how many vertical "lines" a review block occupies. */
export function estimateBlockLines(comment: string): number {
  const commentLines = Math.max(1, Math.ceil(comment.length / CHARS_PER_LINE));
  return BLOCK_OVERHEAD_LINES + commentLines;
}

function groupLineSum(group: LayoutReview[]): number {
  return group.reduce((sum, r) => sum + estimateBlockLines(r.comment), 0);
}

/** Enumerate every contiguous partition whose parts are all in [MIN, MAX]. */
function* partitions(
  items: LayoutReview[],
  start: number,
): Generator<LayoutReview[][]> {
  if (start === items.length) {
    yield [];
    return;
  }
  const remaining = items.length - start;
  for (let size = MIN_PER_PAGE; size <= MAX_PER_PAGE; size++) {
    if (size > remaining) break;
    // The leftover after taking `size` must itself be partitionable:
    // leftover 0 is fine, leftover 1 is a dead end (< MIN).
    const leftover = remaining - size;
    if (leftover === 1) continue;
    const head = items.slice(start, start + size);
    for (const tail of partitions(items, start + size)) {
      yield [head, ...tail];
    }
  }
}

function scorePartition(pages: LayoutReview[][]): number {
  const lineSums = pages.map(groupLineSum);
  const mean = lineSums.reduce((a, b) => a + b, 0) / lineSums.length;

  let cost = PAGE_BASE * pages.length;
  for (const sum of lineSums) {
    const overflow = Math.max(0, sum - SOFT_CAP_LINES);
    cost += OVERFLOW_W * overflow * overflow; // grows fast: discourages cramming
    const empty = Math.max(0, SOFT_CAP_LINES - sum);
    cost += EMPTY_W * empty; // mild: discourages near-empty pages
    cost += BALANCE_W * (sum - mean) * (sum - mean); // reward even splits
  }
  return cost;
}

/**
 * Split selected reviews into carousel pages of 2-4 reviews each, sized by
 * text length. Input order is preserved. Returns [] if fewer than MIN reviews.
 */
export function planPages(reviews: LayoutReview[]): PagePlan[] {
  if (reviews.length < MIN_PER_PAGE) return [];

  let best: LayoutReview[][] | null = null;
  let bestCost = Infinity;
  for (const partition of partitions(reviews, 0)) {
    const cost = scorePartition(partition);
    if (cost < bestCost) {
      bestCost = cost;
      best = partition;
    }
  }

  // partitions() always yields at least one valid split for n >= 2.
  return (best ?? [reviews]).map((group) => ({
    reviewIds: group.map((r) => r.id),
  }));
}

/** Human summary like "3장의 이미지 · PAGE 01 — 3 reviews ..." data. */
export function summarizePlan(pages: PagePlan[]): {
  pageCount: number;
  perPage: number[];
} {
  return {
    pageCount: pages.length,
    perPage: pages.map((p) => p.reviewIds.length),
  };
}
