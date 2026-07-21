// All meeting dates are displayed in Korea time (KST), regardless of where the
// server runs (Vercel runs in UTC), so times never drift.
const TZ = "Asia/Seoul";

function kstParts(date: Date) {
  const d = new Date(date);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  }).formatToParts(d);
  const m = Object.fromEntries(parts.map((p) => [p.type, p.value])) as Record<
    string,
    string
  >;
  return {
    year: m.year,
    month: m.month,
    day: m.day,
    hour: m.hour === "24" ? "00" : m.hour,
    minute: m.minute,
    weekdayEn: m.weekday, // Mon, Tue, ...
  };
}

const WK_KO = ["일", "월", "화", "수", "목", "금", "토"];
function kstWeekdayKo(date: Date): string {
  const wd = new Intl.DateTimeFormat("ko-KR", {
    timeZone: TZ,
    weekday: "short",
  }).format(new Date(date));
  return wd.replace("요일", "");
}

/** 2026.07.19 SAT */
export function formatDateDisplay(date: Date): string {
  const p = kstParts(date);
  return `${p.year}.${p.month}.${p.day} ${p.weekdayEn.toUpperCase()}`;
}

/** 7월 19일 (토) */
export function formatDateKo(date: Date): string {
  const p = kstParts(date);
  return `${Number(p.month)}월 ${Number(p.day)}일 (${kstWeekdayKo(date)})`;
}

/** 15:00 */
export function formatTime(date: Date): string {
  const p = kstParts(date);
  return `${p.hour}:${p.minute}`;
}

/** 7/19 */
export function formatShort(date: Date): string {
  const p = kstParts(date);
  return `${Number(p.month)}/${Number(p.day)}`;
}

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

/** JUL 2026 */
export function formatMonthLabel(year: number, month: number): string {
  return `${MONTHS[month - 1]} ${year}`;
}

const MONTH_FULL = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
];
export function monthFull(month: number): string {
  return MONTH_FULL[month - 1];
}

/** Days from now until date (KST calendar days). Positive = future. */
export function daysUntil(date: Date, now: Date = new Date()): number {
  const dayMs = 24 * 60 * 60 * 1000;
  // Compare KST calendar dates (midnight KST) to avoid off-by-one at TZ edges.
  const toKstMidnight = (d: Date) => {
    const p = kstParts(d);
    return Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day));
  };
  return Math.round((toKstMidnight(date) - toKstMidnight(now)) / dayMs);
}

// Keep the plain weekday list exported name in case it's referenced.
export { WK_KO };
