import { getCurrentUser } from "@/lib/session";
import { getCurrentMeeting } from "@/lib/meeting";
import { statusReached } from "@/lib/types";
import { formatDateKo, formatTime } from "@/lib/format";
import { Card, Eyebrow, Chip } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { DateCandidatesForm } from "@/components/DateCandidatesForm";
import {
  submitVote,
  confirmDate,
  changeConfirmedDate,
} from "@/lib/actions/schedule";

export default async function SchedulePage() {
  const user = (await getCurrentUser())!;
  const meeting = await getCurrentMeeting();
  if (!meeting) {
    return <EmptyState />;
  }

  const isHost = meeting.hostId === user.id;
  const votingOpen = meeting.status === "DATE_VOTING";
  const confirmed = statusReached(meeting.status, "DATE_CONFIRMED");
  const isComplete = statusReached(meeting.status, "COMPLETE");

  const members = await getMemberCount();
  const candidates = meeting.dateCandidates.map((c) => ({
    ...c,
    count: c.votes.length,
    isConfirmed:
      meeting.confirmedDate != null &&
      new Date(c.date).getTime() === new Date(meeting.confirmedDate).getTime(),
  }));
  const best = Math.max(0, ...candidates.map((c) => c.count));
  const myVotes = new Set(
    meeting.dateCandidates
      .flatMap((c) => c.votes)
      .filter((v) => v.userId === user.id)
      .map((v) => v.candidateId),
  );
  const votedUserIds = new Set(
    meeting.dateCandidates.flatMap((c) => c.votes.map((v) => v.userId)),
  );

  return (
    <div className="space-y-8">
      <header>
        <Eyebrow>Schedule</Eyebrow>
        <h1 className="font-display text-3xl mt-2">일정 조율</h1>
        <p className="text-muted text-sm mt-2">
          가능한 날짜를 모아 모임 날짜를 정해요.
        </p>
      </header>

      {/* BOOK_SELECTION: host registers candidate dates */}
      {meeting.status === "BOOK_SELECTION" && (
        <Card>
          {isHost ? (
            <>
              <div className="mb-3">
                <p className="font-medium">후보 날짜 등록</p>
                <p className="text-sm text-muted mt-1">
                  투표에 올릴 날짜를 원하는 만큼 추가하세요. 비운 칸은 무시됩니다.
                </p>
              </div>
              <DateCandidatesForm meetingId={meeting.id} />
            </>
          ) : (
            <p className="text-muted text-sm">
              책장이 후보 날짜를 등록하면 투표가 열려요.
            </p>
          )}
        </Card>
      )}

      {/* Candidate list with counts + BEST */}
      {candidates.length > 0 && (
        <Card>
          <div className="flex items-center justify-between">
            <Eyebrow>후보 날짜</Eyebrow>
            {confirmed ? (
              <Chip tone="accent">투표 마감</Chip>
            ) : (
              <Chip tone="muted">복수 선택 가능</Chip>
            )}
          </div>

          <ul className="mt-4 divide-y divide-line">
            {candidates.map((c) => {
              const isBest = c.count === best && best > 0;
              return (
                <li
                  key={c.id}
                  className={`flex items-center gap-3 py-3 ${
                    c.isConfirmed ? "bg-accent-soft -mx-2 px-2 rounded-lg" : ""
                  }`}
                >
                  {votingOpen && (
                    <input
                      type="checkbox"
                      name="candidateIds"
                      value={c.id}
                      form="voteForm"
                      defaultChecked={myVotes.has(c.id)}
                      className="size-4 accent-[var(--accent)]"
                    />
                  )}
                  <div className="flex-1">
                    <span className="font-medium">{formatDateKo(c.date)}</span>
                    <span className="text-muted text-sm ml-2">
                      {formatTime(c.date)}
                    </span>
                    {c.isConfirmed && <Chip tone="accent">확정</Chip>}
                  </div>
                  <div className="flex items-center gap-2">
                    {isBest && !confirmed && <Chip tone="accent">BEST</Chip>}
                    <span className="text-sm tabular-nums">
                      <strong>{c.count}</strong>
                      <span className="text-muted">명</span>
                    </span>
                  </div>
                  {isHost && votingOpen && (
                    <form action={confirmDate}>
                      <input type="hidden" name="meetingId" value={meeting.id} />
                      <input type="hidden" name="candidateId" value={c.id} />
                      <SubmitButton className="rounded-full border border-accent/40 text-accent text-xs px-3 py-1.5 hover:bg-accent-soft whitespace-nowrap">
                        이 날로 확정
                      </SubmitButton>
                    </form>
                  )}
                  {isHost && confirmed && !isComplete && !c.isConfirmed && (
                    <form action={changeConfirmedDate}>
                      <input type="hidden" name="meetingId" value={meeting.id} />
                      <input type="hidden" name="candidateId" value={c.id} />
                      <SubmitButton className="rounded-full border border-line text-muted text-xs px-3 py-1.5 hover:border-accent hover:text-accent whitespace-nowrap">
                        이 날로 변경
                      </SubmitButton>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>

          {votingOpen && (
            <form id="voteForm" action={submitVote} className="mt-4">
              <input type="hidden" name="meetingId" value={meeting.id} />
              <SubmitButton className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white">
                내 가능 날짜 저장
              </SubmitButton>
            </form>
          )}

          {isHost && votingOpen && (
            <details className="mt-4 border-t border-line pt-4">
              <summary className="text-sm text-accent cursor-pointer">
                + 날짜 후보 더 추가 (책장)
              </summary>
              <div className="mt-3">
                <DateCandidatesForm
                  meetingId={meeting.id}
                  submitLabel="날짜 추가"
                />
              </div>
            </details>
          )}
        </Card>
      )}

      {/* Response status */}
      {candidates.length > 0 && (
        <Card>
          <Eyebrow>응답 현황</Eyebrow>
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip tone="accent">투표 완료 {votedUserIds.size}명</Chip>
            <Chip tone="muted">미응답 {members - votedUserIds.size}명</Chip>
          </div>
          {confirmed && meeting.confirmedDate && (
            <p className="mt-4 text-sm">
              <span className="text-muted">확정된 날짜</span>{" "}
              <strong className="font-display">
                {formatDateKo(meeting.confirmedDate)}{" "}
                {formatTime(meeting.confirmedDate)}
              </strong>
            </p>
          )}
        </Card>
      )}
    </div>
  );
}

async function getMemberCount() {
  const { prisma } = await import("@/lib/prisma");
  return prisma.user.count();
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <Eyebrow>Schedule</Eyebrow>
      <p className="text-muted mt-3">진행 중인 모임이 없어요.</p>
    </div>
  );
}
