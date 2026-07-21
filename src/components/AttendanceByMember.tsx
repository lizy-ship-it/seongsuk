"use client";

import { useState } from "react";

export interface AttendanceMeeting {
  id: string;
  label: string; // e.g. "2026 · 6월"
  bookTitle: string | null;
  /** userId -> status */
  statuses: Record<string, string>;
}

const STATUS_LABEL: Record<string, string> = {
  ATTENDING: "참석",
  NOT_ATTENDING: "불참",
  NO_RESPONSE: "미응답",
};
const STATUS_STYLE: Record<string, string> = {
  ATTENDING: "bg-accent-soft text-accent",
  NOT_ATTENDING: "bg-danger/10 text-danger",
  NO_RESPONSE: "bg-line/60 text-muted",
  NONE: "bg-line/40 text-muted",
};

export function AttendanceByMember({
  members,
  meetings,
}: {
  members: { id: string; name: string }[];
  meetings: AttendanceMeeting[];
}) {
  const [sel, setSel] = useState(members[0]?.id ?? "");

  const attendedCount = meetings.filter(
    (m) => m.statuses[sel] === "ATTENDING",
  ).length;

  return (
    <div>
      {/* Member tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {members.map((m) => (
          <button
            key={m.id}
            onClick={() => setSel(m.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              sel === m.id
                ? "bg-ink text-surface"
                : "bg-paper text-muted hover:text-ink"
            }`}
          >
            {m.name}
          </button>
        ))}
      </div>

      {/* Selected member's record */}
      <p className="mt-4 text-sm">
        <span className="font-semibold">
          {members.find((m) => m.id === sel)?.name}
        </span>{" "}
        <span className="text-muted">
          · 참석 {attendedCount}회 / 전체 {meetings.length}회
        </span>
      </p>

      <ul className="mt-3 divide-y divide-line">
        {meetings.map((m) => {
          const st = m.statuses[sel] ?? "NONE";
          return (
            <li key={m.id} className="flex items-center justify-between py-3 gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{m.label}</p>
                {m.bookTitle && (
                  <p className="text-xs text-muted truncate">
                    『{m.bookTitle}』
                  </p>
                )}
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[st]}`}
              >
                {STATUS_LABEL[st] ?? "기록 없음"}
              </span>
            </li>
          );
        })}
        {meetings.length === 0 && (
          <li className="py-6 text-center text-sm text-muted">
            아직 완료된 모임이 없어요.
          </li>
        )}
      </ul>
    </div>
  );
}
