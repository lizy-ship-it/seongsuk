// App-level union types + labels for status fields stored as String in SQLite.

/** Meeting lifecycle. Order matters for progress display (PRD §6). */
export const MEETING_STATUS = [
  "BOOK_SELECTION",
  "DATE_VOTING",
  "DATE_CONFIRMED",
  "ATTENDANCE_CHECK",
  "PLACE_CONFIRMED",
  "READY",
  "COMPLETE",
] as const;

export type MeetingStatus = (typeof MEETING_STATUS)[number];

/** Short labels for the progress stepper on HOME. */
export const MEETING_STATUS_LABEL: Record<MeetingStatus, string> = {
  BOOK_SELECTION: "책 선정",
  DATE_VOTING: "날짜 투표",
  DATE_CONFIRMED: "날짜 확정",
  ATTENDANCE_CHECK: "참석 확인",
  PLACE_CONFIRMED: "장소 확정",
  READY: "모임 준비",
  COMPLETE: "완료",
};

export function statusIndex(status: string): number {
  const i = MEETING_STATUS.indexOf(status as MeetingStatus);
  return i === -1 ? 0 : i;
}

/** True if `status` is at or past `target` in the lifecycle. */
export function statusReached(status: string, target: MeetingStatus): boolean {
  return statusIndex(status) >= statusIndex(target);
}

export const ATTENDANCE_STATUS = [
  "ATTENDING",
  "NOT_ATTENDING",
  "NO_RESPONSE",
] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[number];

export const ATTENDANCE_STATUS_LABEL: Record<AttendanceStatus, string> = {
  ATTENDING: "참석 가능",
  NOT_ATTENDING: "참석 불가",
  NO_RESPONSE: "미응답",
};

export type ImageRatio = "4:5" | "1:1";
