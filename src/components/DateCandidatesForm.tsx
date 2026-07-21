"use client";

import { useState } from "react";
import { addCandidates } from "@/lib/actions/schedule";
import { SubmitButton } from "@/components/SubmitButton";

/** Add any number of candidate dates (rows can be added/removed freely). */
export function DateCandidatesForm({
  meetingId,
  submitLabel = "후보 등록하고 투표 열기",
}: {
  meetingId: string;
  submitLabel?: string;
}) {
  const [rows, setRows] = useState<string[]>(["", ""]);

  function update(i: number, v: string) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? v : r)));
  }
  function add() {
    setRows((prev) => [...prev, ""]);
  }
  function remove(i: number) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)));
  }

  return (
    <form action={addCandidates} className="space-y-3">
      <input type="hidden" name="meetingId" value={meetingId} />
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="datetime-local"
              name="dates"
              value={r}
              onChange={(e) => update(i, e.target.value)}
              className="flex-1 rounded-lg border border-line bg-paper px-3 py-2.5 text-sm"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="이 날짜 삭제"
              className="shrink-0 size-11 rounded-lg border border-line text-muted hover:text-danger hover:border-danger"
            >
              −
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        className="w-full rounded-lg border border-dashed border-line py-2.5 text-sm text-muted hover:border-accent hover:text-accent"
      >
        + 날짜 추가
      </button>

      <SubmitButton className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
