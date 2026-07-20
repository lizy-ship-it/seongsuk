const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** 2026.07.19 SAT */
export function formatDateDisplay(date: Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const wk = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][d.getDay()];
  return `${y}.${m}.${day} ${wk}`;
}

/** 7월 19일 (토) */
export function formatDateKo(date: Date): string {
  const d = new Date(date);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;
}

/** 15:00 */
export function formatTime(date: Date): string {
  const d = new Date(date);
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

/** 7/19 */
export function formatShort(date: Date): string {
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

/** JUL 2026 */
export function formatMonthLabel(year: number, month: number): string {
  return `${MONTHS[month - 1]} ${year}`;
}

/** Whole-month title, e.g. "JULY". */
const MONTH_FULL = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
];
export function monthFull(month: number): string {
  return MONTH_FULL[month - 1];
}

/** Days from now until date (rounded). Positive = future. */
export function daysUntil(date: Date, now: Date = new Date()): number {
  const ms = new Date(date).getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
