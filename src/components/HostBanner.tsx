import type { FullMeeting } from "@/lib/meeting";
import { SubmitButton } from "@/components/SubmitButton";
import {
  claimHost,
  releaseHost,
  requestHostChange,
  cancelHostRequest,
  grantHostChange,
  declineHostChange,
} from "@/lib/actions/host";

/** Top-of-home banner: who is this month's host + claim/change controls. */
export function HostBanner({
  meeting,
  userId,
}: {
  meeting: FullMeeting;
  userId: string;
}) {
  const monthLabel = `${meeting.month}월 책장`;
  const isHost = meeting.hostId === userId;
  const requester = meeting.hostChangeRequestedBy;
  const iRequested = meeting.hostChangeRequestedById === userId;

  const hidden = (
    <input type="hidden" name="meetingId" value={meeting.id} />
  );

  // No host yet — anyone can claim.
  if (!meeting.host) {
    return (
      <div className="rounded-2xl bg-accent-soft border border-accent/20 p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{meeting.month}월 책장 미정</p>
          <p className="text-xs text-muted mt-0.5">하고 싶은 사람이 먼저 맡아요.</p>
        </div>
        <form action={claimHost}>
          {hidden}
          <SubmitButton className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white whitespace-nowrap">
            내가 책장 맡기
          </SubmitButton>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-ink text-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="eyebrow !text-surface/60">{monthLabel}</span>
          <span className="text-sm font-semibold">
            {meeting.host.name}
            {isHost && " (나)"}
          </span>
        </div>

        {/* Non-host: request takeover */}
        {!isHost &&
          (iRequested ? (
            <form action={cancelHostRequest}>
              {hidden}
              <SubmitButton className="rounded-full bg-surface/15 px-3 py-1.5 text-xs font-medium text-surface whitespace-nowrap">
                요청됨 · 취소
              </SubmitButton>
            </form>
          ) : (
            <form action={requestHostChange}>
              {hidden}
              <SubmitButton className="rounded-full bg-surface/15 px-3 py-1.5 text-xs font-medium text-surface whitespace-nowrap">
                책장 변경 요청
              </SubmitButton>
            </form>
          ))}

        {/* Host with no pending request: step down */}
        {isHost && !requester && (
          <form action={releaseHost}>
            {hidden}
            <SubmitButton className="rounded-full bg-surface/15 px-3 py-1.5 text-xs font-medium text-surface whitespace-nowrap">
              책장 내려놓기
            </SubmitButton>
          </form>
        )}
      </div>

      {/* Host with a pending takeover request */}
      {isHost && requester && (
        <div className="mt-3 rounded-xl bg-surface/10 p-3 flex items-center justify-between gap-2">
          <p className="text-xs">
            <strong>{requester.name}</strong>님이 책장을 하고 싶어해요.
          </p>
          <div className="flex gap-1.5">
            <form action={grantHostChange}>
              {hidden}
              <SubmitButton className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-ink whitespace-nowrap">
                넘기기
              </SubmitButton>
            </form>
            <form action={declineHostChange}>
              {hidden}
              <SubmitButton className="rounded-full bg-surface/15 px-3 py-1.5 text-xs font-medium text-surface whitespace-nowrap">
                거절
              </SubmitButton>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
