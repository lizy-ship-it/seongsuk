"use client";

import { useState } from "react";
import { submitReview } from "@/lib/actions/review";
import { SubmitButton } from "@/components/SubmitButton";

const MAX_LEN = 120;

export function ReviewForm({
  meetingId,
  initial,
}: {
  meetingId: string;
  initial?: {
    rating: number;
    comment: string;
    readBook: boolean;
    attended: boolean;
    snsConsent: boolean;
  };
}) {
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(initial?.comment ?? "");

  const shown = hover || rating;

  return (
    <form action={submitReview} className="space-y-4">
      <input type="hidden" name="meetingId" value={meetingId} />
      <input type="hidden" name="rating" value={rating} />

      {/* Stars */}
      <div>
        <p className="text-sm font-medium mb-2">별점</p>
        <div
          className="flex gap-1 text-3xl"
          onMouseLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n}점`}
              onMouseEnter={() => setHover(n)}
              onClick={() => setRating(n)}
              className={n <= shown ? "text-star" : "text-line"}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div>
        <p className="text-sm font-medium mb-2">한줄평</p>
        <textarea
          name="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, MAX_LEN))}
          rows={3}
          placeholder="짧은 감상을 남겨주세요"
          className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm resize-none"
        />
        <p className="text-right text-xs text-muted">
          {comment.length}/{MAX_LEN}
        </p>
      </div>

      {/* Flags */}
      <div className="space-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="readBook"
            defaultChecked={initial?.readBook ?? true}
            className="size-4 accent-[var(--accent)]"
          />
          책을 읽었어요
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="attended"
            defaultChecked={initial?.attended ?? false}
            className="size-4 accent-[var(--accent)]"
          />
          모임에 참석했어요
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="snsConsent"
            defaultChecked={initial?.snsConsent ?? false}
            className="size-4 accent-[var(--accent)]"
          />
          이 한줄평을 독서모임 SNS 콘텐츠에 사용하는 것에 동의합니다.
        </label>
      </div>

      <SubmitButton
        disabled={rating < 1 || comment.trim().length === 0}
        className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white"
      >
        {initial ? "한줄평 수정" : "한줄평 남기기"}
      </SubmitButton>
    </form>
  );
}
