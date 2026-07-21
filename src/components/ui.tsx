import Link from "next/link";
import {
  MEETING_STATUS,
  MEETING_STATUS_LABEL,
  statusIndex,
  type MeetingStatus,
} from "@/lib/types";

/** Amber star rating. */
export function Stars({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const full = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span
      className={`text-star tracking-tight ${className}`}
      aria-label={`별점 ${value}점`}
    >
      {"★".repeat(full)}
      <span className="text-line">{"★".repeat(5 - full)}</span>
    </span>
  );
}

/** Book cover; stylized color block when no image. */
export function BookCover({
  title,
  author,
  coverUrl,
  className = "",
  size = "md",
}: {
  title: string;
  author?: string;
  coverUrl?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dims = { sm: "w-16", md: "w-24", lg: "w-32" }[size];
  if (coverUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={coverUrl}
        alt={title}
        className={`${dims} aspect-[2/3] rounded-xl object-cover ${className}`}
      />
    );
  }
  return (
    <div
      className={`${dims} aspect-[2/3] rounded-lg flex flex-col justify-between p-2.5 overflow-hidden bg-paper border border-line ${className}`}
    >
      <span className="font-display font-semibold text-[0.7rem] leading-tight text-ink/80 line-clamp-4">
        {title}
      </span>
      {author && (
        <span className="text-[0.55rem] text-muted truncate">{author}</span>
      )}
    </div>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

/** Place name; a Naver-map link with an external cue when `link` is set. */
export function PlaceLink({
  name,
  link,
  dark = false,
  className = "",
}: {
  name: string;
  link?: string | null;
  dark?: boolean;
  className?: string;
}) {
  if (!link) return <span className={className}>{name}</span>;
  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-1 ${
        dark
          ? "text-surface underline decoration-surface/40 underline-offset-2"
          : "text-accent hover:underline underline-offset-2"
      } ${className}`}
    >
      {name}
      <span aria-hidden>↗</span>
    </a>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-surface p-5 border border-line/70 ${className}`}
    >
      {children}
    </div>
  );
}

const CHIP_TONES = {
  default: "bg-paper text-ink",
  accent: "bg-accent-soft text-accent",
  muted: "bg-line/70 text-muted",
  live: "bg-accent text-white",
  upcoming: "bg-indigo/15 text-indigo",
  past: "bg-star/15 text-star",
} as const;

export function Chip({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: keyof typeof CHIP_TONES;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${CHIP_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/** Primary pill button-as-link (plum-black). */
export function ActionLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "accent" | "ghost";
}) {
  const styles = {
    primary: "bg-ink text-surface hover:opacity-90",
    accent: "bg-accent text-white hover:opacity-90",
    ghost: "bg-paper text-ink hover:bg-line/60",
  }[variant];
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-opacity ${styles}`}
    >
      {children}
    </Link>
  );
}

/** Minimal lifecycle progress: current stage label + thin bar (PRD §6). */
export function ProgressStepper({ status }: { status: string }) {
  const current = statusIndex(status);
  const total = MEETING_STATUS.length;
  const pct = ((current + 1) / total) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm font-medium">
          {MEETING_STATUS_LABEL[MEETING_STATUS[current] as MeetingStatus]}
        </span>
        <span className="text-xs text-muted nums">
          {current + 1} / {total}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-line overflow-hidden">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
