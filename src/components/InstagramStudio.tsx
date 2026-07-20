"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { planPages } from "@/lib/reviewLayout";
import {
  renderReviewPage,
  RATIOS,
  type Ratio,
} from "@/lib/renderReviewImage";

interface StudioReview {
  id: string;
  rating: number;
  comment: string;
  author: string;
}

export function InstagramStudio({
  monthLabel,
  bookTitle,
  reviews,
}: {
  monthLabel: string;
  bookTitle: string;
  reviews: StudioReview[];
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(reviews.map((r) => r.id)),
  );
  const [pageIndex, setPageIndex] = useState(0);
  const ratio: Ratio = "4:5";
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const byId = useMemo(
    () => Object.fromEntries(reviews.map((r) => [r.id, r])),
    [reviews],
  );

  const selectedReviews = useMemo(
    () => reviews.filter((r) => selected.has(r.id)),
    [reviews, selected],
  );

  const pages = useMemo(
    () =>
      planPages(
        selectedReviews.map((r) => ({ id: r.id, comment: r.comment })),
      ),
    [selectedReviews],
  );

  // Keep pageIndex in range when selection changes.
  useEffect(() => {
    if (pageIndex >= pages.length) setPageIndex(Math.max(0, pages.length - 1));
  }, [pages.length, pageIndex]);

  // Draw the current page.
  useEffect(() => {
    const canvas = canvasRef.current;
    const page = pages[pageIndex];
    if (!canvas || !page) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderReviewPage(ctx, {
      monthLabel,
      bookTitle,
      ratio,
      reviews: page.reviewIds.map((id) => ({
        rating: byId[id].rating,
        comment: byId[id].comment,
        author: byId[id].author,
      })),
    });
  }, [pages, pageIndex, byId, monthLabel, bookTitle]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function renderToBlob(pageIdx: number): Promise<Blob | null> {
    const page = pages[pageIdx];
    if (!page) return null;
    const { w, h } = RATIOS[ratio];
    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    const ctx = off.getContext("2d");
    if (!ctx) return null;
    renderReviewPage(ctx, {
      monthLabel,
      bookTitle,
      ratio,
      reviews: page.reviewIds.map((id) => ({
        rating: byId[id].rating,
        comment: byId[id].comment,
        author: byId[id].author,
      })),
    });
    return new Promise((resolve) => off.toBlob((b) => resolve(b), "image/png"));
  }

  function save(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadCurrent() {
    const blob = await renderToBlob(pageIndex);
    if (blob) save(blob, `bookclub-${pageIndex + 1}.png`);
  }

  async function downloadAll() {
    for (let i = 0; i < pages.length; i++) {
      const blob = await renderToBlob(i);
      if (blob) save(blob, `bookclub-${i + 1}.png`);
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  const canGenerate = selectedReviews.length >= 2;
  const { w, h } = RATIOS[ratio];

  return (
    <div className="space-y-8">
      {/* STEP 1 — selection */}
      <section>
        <p className="eyebrow">STEP 1 · 리뷰 선택</p>
        <p className="text-sm text-muted mt-1 mb-3">
          SNS 공개에 동의한 리뷰만 표시돼요. 최소 2개 이상 선택하세요.
        </p>
        <ul className="space-y-2">
          {reviews.map((r) => (
            <li key={r.id}>
              <label className="flex items-start gap-3 rounded-xl border border-line p-3 cursor-pointer hover:bg-accent-soft">
                <input
                  type="checkbox"
                  checked={selected.has(r.id)}
                  onChange={() => toggle(r.id)}
                  className="mt-1 size-4 accent-[var(--accent)]"
                />
                <span className="flex-1">
                  <span className="text-star text-sm">
                    {"★".repeat(Math.round(r.rating))}
                  </span>
                  <span className="text-line text-sm">
                    {"★".repeat(5 - Math.round(r.rating))}
                  </span>
                  <span className="block text-sm mt-0.5">{r.comment}</span>
                  <span className="block text-xs text-muted mt-0.5">
                    — {r.author}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      {/* STEP 2 — auto layout summary */}
      <section>
        <p className="eyebrow">STEP 2 · 자동 배치</p>
        {canGenerate ? (
          <div className="mt-2 rounded-xl border border-line p-4 text-sm">
            <p className="font-medium">
              {selectedReviews.length}개의 리뷰 → {pages.length}장의 이미지
            </p>
            <ul className="mt-2 space-y-1 text-muted">
              {pages.map((p, i) => (
                <li key={i}>
                  PAGE {String(i + 1).padStart(2, "0")} — {p.reviewIds.length}{" "}
                  reviews
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">
              한줄평 길이에 따라 한 장에 2~4명씩 자동 배치됩니다.
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-danger">
            이미지를 만들려면 최소 2개의 리뷰가 필요해요.
          </p>
        )}
      </section>

      {/* STEP 3 — preview carousel */}
      {canGenerate && (
        <section>
          <p className="eyebrow">STEP 3 · 미리보기</p>
          <div className="mt-3 flex flex-col items-center">
            <div className="rounded-xl overflow-hidden border border-line shadow-sm">
              <canvas
                ref={canvasRef}
                width={w}
                height={h}
                className="block w-[300px] h-auto"
              />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                aria-label="이전 페이지"
                onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
                disabled={pageIndex === 0}
                className="size-11 rounded-full bg-paper flex items-center justify-center text-lg disabled:opacity-30"
              >
                ←
              </button>
              <span className="text-sm text-muted nums min-w-14 text-center">
                {pageIndex + 1} / {pages.length}
              </span>
              <button
                type="button"
                aria-label="다음 페이지"
                onClick={() =>
                  setPageIndex((i) => Math.min(pages.length - 1, i + 1))
                }
                disabled={pageIndex === pages.length - 1}
                className="size-11 rounded-full bg-paper flex items-center justify-center text-lg disabled:opacity-30"
              >
                →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* STEP 4 — download */}
      {canGenerate && (
        <section>
          <p className="eyebrow">STEP 4 · 다운로드</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={downloadAll}
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white"
            >
              전체 이미지 다운로드 ({pages.length}장)
            </button>
            <button
              onClick={downloadCurrent}
              className="rounded-full border border-line px-5 py-2.5 text-sm font-medium hover:bg-accent-soft"
            >
              현재 이미지만 다운로드
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
