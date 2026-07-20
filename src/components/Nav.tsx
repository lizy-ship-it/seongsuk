"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "홈", icon: HomeIcon },
  { href: "/schedule", label: "일정", icon: CalendarIcon },
  { href: "/meeting", label: "모임", icon: BookIcon },
  { href: "/archive", label: "기록", icon: ArchiveIcon },
];

/** Fixed bottom tab bar (mobile-app pattern). */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
      <div className="mx-auto max-w-[480px] px-3 pb-[env(safe-area-inset-bottom)]">
        <div className="pointer-events-auto mb-3 rounded-full bg-ink/95 backdrop-blur shadow-lg flex items-center justify-around px-2 py-2">
          {LINKS.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex flex-col items-center gap-0.5 rounded-full px-4 py-1.5 transition-colors ${
                  active ? "text-surface" : "text-surface/45"
                }`}
              >
                <Icon active={active} />
                <span className="text-[10px] font-medium">{l.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

type IconProps = { active?: boolean };
const base = "size-5";
const sw = (a?: boolean) => (a ? 2.2 : 1.8);

function HomeIcon({ active }: IconProps) {
  return (
    <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw(active)} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}
function CalendarIcon({ active }: IconProps) {
  return (
    <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw(active)} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4.5" width="18" height="16" rx="3" />
      <path d="M3 9h18M8 3v3M16 3v3" />
    </svg>
  );
}
function BookIcon({ active }: IconProps) {
  return (
    <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw(active)} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z" />
      <path d="M5 4v13a3 3 0 0 1 3-3h11" />
    </svg>
  );
}
function ArchiveIcon({ active }: IconProps) {
  return (
    <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw(active)} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="5" rx="1.5" />
      <path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4" />
    </svg>
  );
}
