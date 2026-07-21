"use client";

import { useRef, useState } from "react";
import { setBook } from "@/lib/actions/meeting";
import { SubmitButton } from "@/components/SubmitButton";

/** Downscale an uploaded image to a small JPEG data URL (keeps the DB light). */
function fileToDataUrl(file: File, maxSide = 600): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no ctx"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function BookForm({
  meetingId,
  initial,
  submitLabel = "책 등록",
}: {
  meetingId: string;
  initial?: { title?: string; author?: string; coverUrl?: string | null };
  submitLabel?: string;
}) {
  const initialIsUrl = !!initial?.coverUrl?.startsWith("http");
  const [uploaded, setUploaded] = useState<string>(
    initialIsUrl ? "" : (initial?.coverUrl ?? ""),
  );
  const [url, setUrl] = useState<string>(initialIsUrl ? initial!.coverUrl! : "");
  const [loading, setLoading] = useState(false);
  const [broken, setBroken] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Uploaded photo wins; otherwise the pasted URL.
  const cover = uploaded || url;

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setBroken(false);
    try {
      setUploaded(await fileToDataUrl(file));
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm";

  return (
    <form action={setBook} className="mt-3 space-y-3">
      <input type="hidden" name="meetingId" value={meetingId} />
      <input type="hidden" name="coverUrl" value={cover} />

      <div className="flex gap-4">
        {/* Cover preview / picker */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="shrink-0 w-24 aspect-[2/3] rounded-xl border border-dashed border-line bg-paper overflow-hidden flex items-center justify-center text-xs text-muted"
        >
          {cover && !broken ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt="표지"
              className="w-full h-full object-cover"
              onError={() => setBroken(true)}
            />
          ) : loading ? (
            "불러오는 중…"
          ) : (
            <span className="text-center px-2 leading-tight">
              표지 사진
              <br />
              추가
            </span>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onPick}
          className="hidden"
        />

        <div className="flex-1 space-y-3">
          <input
            name="title"
            defaultValue={initial?.title ?? ""}
            placeholder="책 제목"
            required
            className={inputCls}
          />
          <input
            name="author"
            defaultValue={initial?.author ?? ""}
            placeholder="저자"
            className={inputCls}
          />
        </div>
      </div>

      {/* URL option (kept) */}
      <div>
        <input
          value={url}
          onChange={(e) => {
            setUrl(e.target.value.trim());
            setBroken(false);
          }}
          placeholder="또는 표지 이미지 URL 붙여넣기"
          inputMode="url"
          className={inputCls}
        />
        {broken && cover && (
          <p className="text-xs text-danger mt-1">
            이미지를 불러올 수 없어요. 다른 URL이거나, 사진 파일로 올려보세요.
          </p>
        )}
        {(uploaded || url) && (
          <button
            type="button"
            onClick={() => {
              setUploaded("");
              setUrl("");
              setBroken(false);
              if (fileRef.current) fileRef.current.value = "";
            }}
            className="text-xs text-muted hover:text-danger mt-1"
          >
            표지 지우기
          </button>
        )}
      </div>

      <SubmitButton className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
