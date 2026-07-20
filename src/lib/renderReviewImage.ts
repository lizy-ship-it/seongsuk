// Canvas renderer for one Instagram review page (PRD §15, §19, §20).
// Colors are hardcoded (not CSS vars) so the exported image looks identical
// regardless of the viewer's light/dark theme.

export const RATIOS = {
  "4:5": { w: 1080, h: 1350 },
  "1:1": { w: 1080, h: 1080 },
} as const;

export type Ratio = keyof typeof RATIOS;

export interface RenderReview {
  rating: number;
  comment: string;
  author: string;
}

export interface RenderPageInput {
  reviews: RenderReview[];
  monthLabel: string; // e.g. "JUNE BOOK CLUB"
  bookTitle: string;
  ratio: Ratio;
}

const C = {
  paper: "#FBF9F4",
  ink: "#211E1A",
  muted: "#6F6A61",
  line: "#E7E1D6",
  star: "#C79A2E",
  starEmpty: "#E7E1D6",
  accent: "#2F5D50",
};

const SANS = `-apple-system, "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif`;
const SERIF = `Georgia, "Times New Roman", serif`;

/** Wrap text to a pixel width, breaking mid-word (Korean has no spaces). */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const ch of text) {
    if (ch === "\n") {
      lines.push(line);
      line = "";
      continue;
    }
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line !== "") {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function stars(rating: number): { full: string; empty: string } {
  const f = Math.max(0, Math.min(5, Math.round(rating)));
  return { full: "★".repeat(f), empty: "★".repeat(5 - f) };
}

/** Draw a full review page onto a 2D context. Canvas must be sized to ratio. */
export function renderReviewPage(
  ctx: CanvasRenderingContext2D,
  input: RenderPageInput,
) {
  const { w, h } = RATIOS[input.ratio];
  const M = 96;
  const contentW = w - M * 2;

  // Background
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, w, h);

  // Header: book title only (no month label, no footer brand)
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = C.ink;
  ctx.font = `italic 46px ${SERIF}`;
  ctx.fillText(`『${input.bookTitle}』`, M, M + 56);

  // Header rule
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(M, M + 92);
  ctx.lineTo(w - M, M + 92);
  ctx.stroke();

  // Review blocks area
  const areaTop = M + 92 + 56;
  const areaBottom = h - M;

  const STAR_FONT = 40;
  const COMMENT_FONT = 38;
  const COMMENT_LH = 54;
  const AUTHOR_FONT = 26;
  const GAP_STARS_COMMENT = 26;
  const GAP_COMMENT_AUTHOR = 22;

  // Measure each block.
  ctx.font = `400 ${COMMENT_FONT}px ${SANS}`;
  const blocks = input.reviews.map((r) => {
    const lines = wrapText(ctx, r.comment, contentW);
    const height =
      STAR_FONT +
      GAP_STARS_COMMENT +
      lines.length * COMMENT_LH +
      GAP_COMMENT_AUTHOR +
      AUTHOR_FONT;
    return { r, lines, height };
  });

  const totalHeight = blocks.reduce((s, b) => s + b.height, 0);
  const n = blocks.length;
  const free = areaBottom - areaTop - totalHeight;
  const gap = n > 1 ? Math.max(40, free / (n - 1)) : 0;

  let y = areaTop;
  // If content overflows, top-align (gap already clamped); otherwise space-between.
  if (free < 0) y = areaTop;

  blocks.forEach((b, i) => {
    // Stars
    ctx.textAlign = "left";
    ctx.font = `400 ${STAR_FONT}px ${SANS}`;
    const s = stars(b.r.rating);
    ctx.fillStyle = C.star;
    ctx.fillText(s.full, M, y + STAR_FONT);
    const fullW = ctx.measureText(s.full).width;
    ctx.fillStyle = C.starEmpty;
    ctx.fillText(s.empty, M + fullW, y + STAR_FONT);

    // Comment
    let cy = y + STAR_FONT + GAP_STARS_COMMENT + COMMENT_FONT;
    ctx.fillStyle = C.ink;
    ctx.font = `400 ${COMMENT_FONT}px ${SANS}`;
    for (const line of b.lines) {
      ctx.fillText(line, M, cy);
      cy += COMMENT_LH;
    }

    // Author
    ctx.fillStyle = C.muted;
    ctx.font = `400 ${AUTHOR_FONT}px ${SANS}`;
    ctx.fillText(`— ${b.r.author}`, M, cy - COMMENT_LH + AUTHOR_FONT + GAP_COMMENT_AUTHOR - 6);

    y += b.height;

    // Divider between blocks
    if (i < n - 1) {
      const dy = y + gap / 2;
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 40, dy);
      ctx.lineTo(w / 2 + 40, dy);
      ctx.stroke();
      y += gap;
    }
  });
}

/** Draw text with manual letter spacing (canvas letterSpacing support varies). */
function drawTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
) {
  let cx = x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + spacing;
  }
}
