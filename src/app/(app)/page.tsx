import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getCurrentMeeting } from "@/lib/meeting";
import { resolveUserAction } from "@/lib/action";
import { formatDateDisplay, formatTime, monthFull } from "@/lib/format";
import { BookCover, Card, Eyebrow, ProgressStepper } from "@/components/ui";
import { HostBanner } from "@/components/HostBanner";

export default async function HomePage() {
  const user = (await getCurrentUser())!;
  const meeting = await getCurrentMeeting();

  if (!meeting) {
    return (
      <div className="text-center py-20">
        <Eyebrow>Book Club</Eyebrow>
        <h1 className="font-display text-3xl mt-3">아직 모임이 없어요</h1>
        <p className="text-muted mt-3">첫 모임을 만들어 시작해보세요.</p>
      </div>
    );
  }

  const action = resolveUserAction(meeting, user.id);
  const isHost = meeting.hostId === user.id;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Eyebrow>{monthFull(meeting.month)} BOOK CLUB</Eyebrow>
        <h1 className="font-display text-3xl sm:text-4xl mt-2">이번 달 모임</h1>
      </div>

      {/* Who is this month's host (+ claim / change controls) */}
      <HostBanner meeting={meeting} userId={user.id} />

      {/* Action card — the most prominent element (PRD §6) */}
      <Card
        className={action.info ? "" : "!bg-ink text-surface"}
      >
        <p
          className={`eyebrow ${action.info ? "" : "!text-white/70"}`}
        >
          {isHost ? "책장 · 지금 할 일" : "지금 할 일"}
        </p>
        <h2
          className={`font-display text-2xl mt-2 ${
            action.info ? "" : "text-white"
          }`}
        >
          {action.title}
        </h2>
        {action.desc && (
          <p
            className={`mt-2 text-sm ${
              action.info ? "text-muted" : "text-white/85"
            }`}
          >
            {action.desc}
          </p>
        )}
        {action.href && action.cta && (
          <div className="mt-5">
            {action.info ? (
              <Link
                href={action.href}
                className="inline-flex items-center rounded-full border border-line px-5 py-2.5 text-sm font-medium hover:bg-accent-soft transition-colors"
              >
                {action.cta} →
              </Link>
            ) : (
              <Link
                href={action.href}
                className="inline-flex items-center rounded-full bg-surface px-5 py-2.5 text-sm font-semibold text-ink hover:opacity-90 transition-opacity"
              >
                {action.cta} →
              </Link>
            )}
          </div>
        )}
      </Card>

      {/* Progress — compact, no wrapper card */}
      <ProgressStepper status={meeting.status} />

      {/* Meeting essentials — one clean list card */}
      <Card>
        {meeting.book ? (
          <div className="flex gap-4 items-center">
            <BookCover
              title={meeting.book.title}
              author={meeting.book.author}
              coverUrl={meeting.book.coverUrl}
              size="sm"
            />
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold leading-snug">
                {meeting.book.title}
              </p>
              <p className="text-sm text-muted mt-0.5">{meeting.book.author}</p>
            </div>
          </div>
        ) : (
          <p className="text-muted text-sm">책 선정 예정</p>
        )}

        <dl className="mt-5 divide-y divide-line text-sm">
          <Row
            label="책장"
            value={
              meeting.host
                ? `${meeting.host.name}${isHost ? " (나)" : ""}`
                : "미정"
            }
            muted={!meeting.host}
          />
          <Row
            label="날짜"
            value={
              meeting.confirmedDate
                ? `${formatDateDisplay(meeting.confirmedDate)} ${formatTime(meeting.confirmedDate)}`
                : "날짜 투표 중"
            }
            muted={!meeting.confirmedDate}
          />
          <Row
            label="장소"
            value={meeting.place?.reserved ? meeting.place.name : "장소 선정 예정"}
            muted={!meeting.place?.reserved}
          />
        </dl>
      </Card>

      <Link
        href="/meeting"
        className="block text-center text-sm text-muted hover:text-ink"
      >
        모임 정보 전체 보기 →
      </Link>
    </div>
  );
}

function Row({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 gap-4">
      <dt className="text-muted shrink-0">{label}</dt>
      <dd
        className={`font-medium text-right ${muted ? "text-muted font-normal" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
