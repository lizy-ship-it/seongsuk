"use client";

import { useEffect, useRef, useState } from "react";
import { savePlace } from "@/lib/actions/meeting";
import { SubmitButton } from "@/components/SubmitButton";
import type { PlaceResult } from "@/app/api/places/search/route";

interface InitialPlace {
  name?: string | null;
  address?: string | null;
  link?: string | null;
  cost?: number | null;
  note?: string | null;
}

export function PlaceForm({
  meetingId,
  initial,
  attendingCount,
}: {
  meetingId: string;
  initial?: InitialPlace;
  attendingCount: number;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [link, setLink] = useState(initial?.link ?? "");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced Naver search.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/places/search?q=${encodeURIComponent(q)}`,
        );
        const data = await res.json();
        setConfigured(data.configured);
        setResults(data.items ?? []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // Probe configuration once on focus (so we can hide search if no keys).
  async function probe() {
    if (configured !== null) return;
    try {
      const res = await fetch("/api/places/search?q=");
      const data = await res.json();
      setConfigured(data.configured);
    } catch {
      setConfigured(false);
    }
  }

  // Close dropdown on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function select(r: PlaceResult) {
    setName(r.name);
    setAddress(r.address);
    setLink(r.mapUrl);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  const inputCls =
    "w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm";

  return (
    <form action={savePlace} className="mt-3 space-y-3">
      <input type="hidden" name="meetingId" value={meetingId} />

      {/* Naver place search */}
      {configured !== false && (
        <div ref={boxRef} className="relative">
          <div className="relative">
            <input
              type="search"
              value={query}
              onFocus={probe}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="네이버로 장소 검색 (예: 연남동 스터디룸)…"
              className={inputCls}
              autoComplete="off"
            />
            {loading && (
              <span
                aria-hidden
                className="absolute right-3 top-1/2 -translate-y-1/2 size-4 rounded-full border-2 border-muted border-t-transparent animate-spin"
              />
            )}
          </div>
          {open && results.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full rounded-xl border border-line bg-surface shadow-lg overflow-hidden">
              {results.map((r, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => select(r)}
                    className="w-full text-left px-3 py-2.5 hover:bg-accent-soft"
                  >
                    <span className="block text-sm font-medium">{r.name}</span>
                    <span className="block text-xs text-muted truncate">
                      {r.address}
                      {r.category ? ` · ${r.category}` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {configured === false && (
        <p className="text-xs text-muted">
          네이버 검색 키가 없어 직접 입력 중이에요. (.env의 NAVER_CLIENT_ID/SECRET 설정 시 검색 활성화)
        </p>
      )}

      {/* Fields (auto-filled by search, still editable) */}
      <input
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="장소명"
        required
        className={inputCls}
      />
      <input
        name="address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="주소"
        className={inputCls}
      />
      <input
        name="link"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        placeholder="네이버 지도 링크"
        className={inputCls}
      />
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-xs text-accent hover:underline"
        >
          네이버 지도에서 보기 ↗
        </a>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="datetime-local"
          name="datetime"
          className={inputCls}
        />
        <input
          name="cost"
          defaultValue={initial?.cost ?? ""}
          placeholder="예약 비용 (선택)"
          inputMode="numeric"
          className={inputCls}
        />
      </div>
      <input
        name="note"
        defaultValue={initial?.note ?? ""}
        placeholder="참고사항 (선택)"
        className={inputCls}
      />

      <p className="text-xs text-muted">
        최종 참석 인원(참석 {attendingCount}명)에 맞춰 장소를 예약하세요.
      </p>

      <div className="flex gap-2">
        <SubmitButton className="rounded-full border border-line px-5 py-3 text-sm font-semibold hover:bg-accent-soft">
          임시 저장
        </SubmitButton>
        <SubmitButton
          name="confirm"
          value="1"
          className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white"
        >
          장소 확정
        </SubmitButton>
      </div>
    </form>
  );
}
