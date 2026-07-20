import { getCurrentUser } from "@/lib/session";
import {
  getCurrentMeeting,
  attendanceTally,
  type FullMeeting,
} from "@/lib/meeting";
import { statusReached, ATTENDANCE_STATUS_LABEL } from "@/lib/types";
import {
  formatDateDisplay,
  formatTime,
  monthFull,
  daysUntil,
} from "@/lib/format";
import {
  Card,
  Eyebrow,
  Chip,
  BookCover,
  PlaceLink,
  ActionLink,
} from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { PlaceForm } from "@/components/PlaceForm";
import {
  setBook,
  respondAttendance,
  saveQuestions,
  markReady,
  completeMeeting,
  startNextMeeting,
} from "@/lib/actions/meeting";

export default async function MeetingPage() {
  const user = (await getCurrentUser())!;
  const meeting = await getCurrentMeeting();
  if (!meeting) {
    return (
      <div className="text-center py-20">
        <Eyebrow>Meeting</Eyebrow>
        <p className="text-muted mt-3">진행 중인 모임이 없어요.</p>
      </div>
    );
  }

  const isHost = meeting.hostId === user.id;
  const dateLocked = statusReached(meeting.status, "DATE_CONFIRMED");
  const inAttendance = meeting.status === "ATTENDANCE_CHECK";
  const placeStage =
    statusReached(meeting.status, "ATTENDANCE_CHECK") &&
    !statusReached(meeting.status, "COMPLETE");
  const tally = attendanceTally(meeting.attendances);
  const attending = meeting.attendances.filter(
    (a) => a.status === "ATTENDING",
  );
  const myAttendance = meeting.attendances.find((a) => a.userId === user.id);

  return (
    <div className="space-y-8">
      <header>
        <Eyebrow>{monthFull(meeting.month)} Book Club</Eyebrow>
        <h1 className="font-display text-3xl mt-2">모임</h1>
      </header>

      {/* Final notice summary (PRD §11) */}
      <FinalNotice meeting={meeting} attendingCount={attending.length} />

      {/* Meeting finished — everyone records a review (PRD §12-13) */}
      {statusReached(meeting.status, "COMPLETE") && (
        <Card>
          <Eyebrow>모임 완료</Eyebrow>
          <p className="font-display text-xl font-semibold mt-1">
            모임이 끝났어요 📖
          </p>
          <p className="text-sm text-muted mt-1">
            이번 책 별점과 한줄평을 남기면 기록에 저장돼요.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <ActionLink href={`/archive/${meeting.id}#review`} variant="accent">
              한줄평 남기기
            </ActionLink>
            <ActionLink href={`/archive/${meeting.id}`} variant="ghost">
              기록 보기
            </ActionLink>
          </div>
          <div className="mt-4 pt-4 border-t border-line">
            <p className="text-sm text-muted mb-2">
              모임이 끝났어요. 다음 달 모임을 열면 하고 싶은 사람이 다음 책장을
              맡아요.
            </p>
            <form action={startNextMeeting}>
              <input type="hidden" name="meetingId" value={meeting.id} />
              <SubmitButton className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-surface">
                다음 모임 시작하기 →
              </SubmitButton>
            </form>
          </div>
        </Card>
      )}

      {/* Book selection (host, when missing) */}
      {!meeting.book && isHost && (
        <Card>
          <div className="flex items-center gap-2">
            <Eyebrow>이달의 책 선정</Eyebrow>
            <Chip tone="accent">책장 전용</Chip>
          </div>
          <form action={setBook} className="mt-3 space-y-3">
            <input type="hidden" name="meetingId" value={meeting.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                name="title"
                placeholder="책 제목"
                required
                className="rounded-lg border border-line bg-paper px-3 py-2 text-sm"
              />
              <input
                name="author"
                placeholder="저자"
                className="rounded-lg border border-line bg-paper px-3 py-2 text-sm"
              />
            </div>
            <input
              name="coverUrl"
              placeholder="표지 이미지 URL (선택)"
              className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm"
            />
            <button className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white">
              책 등록
            </button>
          </form>
        </Card>
      )}

      {/* Attendance re-check */}
      {dateLocked && (
        <Card>
          <div className="flex items-center justify-between">
            <Eyebrow>참석 여부 재확인</Eyebrow>
            {inAttendance ? (
              <Chip tone="accent">확인 중</Chip>
            ) : (
              <Chip tone="muted">마감</Chip>
            )}
          </div>

          {/* Member response */}
          {!isHost && inAttendance && (
            <div className="mt-4">
              <p className="text-sm text-muted mb-3">
                장소 예약을 위해 최종 참석 여부를 알려주세요.
              </p>
              <div className="flex gap-2">
                {(["ATTENDING", "NOT_ATTENDING"] as const).map((s) => (
                  <form key={s} action={respondAttendance}>
                    <input type="hidden" name="meetingId" value={meeting.id} />
                    <input type="hidden" name="status" value={s} />
                    <SubmitButton
                      className={`rounded-full px-5 py-3 text-sm font-semibold border transition-colors ${
                        myAttendance?.status === s
                          ? "bg-accent text-white border-accent"
                          : "border-line hover:bg-accent-soft"
                      }`}
                    >
                      {ATTENDANCE_STATUS_LABEL[s]}
                    </SubmitButton>
                  </form>
                ))}
              </div>
              {myAttendance && myAttendance.status !== "NO_RESPONSE" && (
                <p className="text-xs text-muted mt-3">
                  현재 응답: {ATTENDANCE_STATUS_LABEL[myAttendance.status as keyof typeof ATTENDANCE_STATUS_LABEL]}
                </p>
              )}
            </div>
          )}

          {/* Host / summary view */}
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <Tally label="참석 가능" value={tally.attending} tone="accent" />
            <Tally label="참석 불가" value={tally.notAttending} />
            <Tally label="미응답" value={tally.noResponse} />
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <RosterLine
              label="참석"
              names={meeting.attendances
                .filter((a) => a.status === "ATTENDING")
                .map((a) => a.user.name)}
            />
            <RosterLine
              label="불참"
              names={meeting.attendances
                .filter((a) => a.status === "NOT_ATTENDING")
                .map((a) => a.user.name)}
            />
            <RosterLine
              label="미응답"
              names={meeting.attendances
                .filter((a) => a.status === "NO_RESPONSE")
                .map((a) => a.user.name)}
            />
          </div>
        </Card>
      )}

      {/* Place */}
      {placeStage && isHost && (
        <Card>
          <div className="flex items-center gap-2">
            <Eyebrow>장소 선정 및 예약</Eyebrow>
            <Chip tone="accent">책장 전용</Chip>
          </div>
          <PlaceForm
            meetingId={meeting.id}
            attendingCount={tally.attending}
            initial={{
              name: meeting.place?.name,
              address: meeting.place?.address,
              link: meeting.place?.link,
              cost: meeting.place?.cost,
              note: meeting.place?.note,
            }}
          />
        </Card>
      )}

      {/* Discussion questions */}
      <Card>
        <Eyebrow>Discussion Questions</Eyebrow>
        {isHost && !statusReached(meeting.status, "COMPLETE") ? (
          <form action={saveQuestions} className="mt-3 space-y-3">
            <input type="hidden" name="meetingId" value={meeting.id} />
            <p className="text-sm text-muted">권장 3~5개. 비운 칸은 무시됩니다.</p>
            {[0, 1, 2, 3, 4].map((i) => (
              <input
                key={i}
                name="questions"
                defaultValue={meeting.discussionQuestions[i]?.content ?? ""}
                placeholder={`질문 ${String(i + 1).padStart(2, "0")}`}
                className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm"
              />
            ))}
            <button className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white">
              질문 저장
            </button>
          </form>
        ) : meeting.discussionQuestions.length > 0 ? (
          <ol className="mt-3 space-y-3">
            {meeting.discussionQuestions.map((q) => (
              <li key={q.id} className="flex gap-3">
                <span className="font-display text-accent text-sm">
                  {String(q.order).padStart(2, "0")}
                </span>
                <span className="text-sm">{q.content}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-muted">아직 질문이 없어요.</p>
        )}
      </Card>

      {/* Host: finish the meeting once the date is locked */}
      {isHost && dateLocked && !statusReached(meeting.status, "COMPLETE") && (
        <Card className="border-dashed">
          <div className="flex items-center gap-2">
            <Eyebrow>모임 마무리</Eyebrow>
            <Chip tone="accent">책장 전용</Chip>
          </div>
          <p className="text-sm text-muted mt-2">
            모임이 끝났다면 완료하세요. 완료하면 기록(아카이브)에 저장되고, 모두
            한줄평을 남길 수 있어요.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {meeting.status === "PLACE_CONFIRMED" && (
              <form action={markReady}>
                <input type="hidden" name="meetingId" value={meeting.id} />
                <SubmitButton className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold hover:bg-accent-soft">
                  최종 안내 완료
                </SubmitButton>
              </form>
            )}
            <form action={completeMeeting}>
              <input type="hidden" name="meetingId" value={meeting.id} />
              <SubmitButton className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-surface">
                이달의 모임 완료
              </SubmitButton>
            </form>
          </div>
        </Card>
      )}
    </div>
  );
}

function FinalNotice({
  meeting,
  attendingCount,
}: {
  meeting: FullMeeting;
  attendingCount: number;
}) {
  const d = meeting.confirmedDate;
  const dday = d ? daysUntil(d) : null;
  return (
    <Card className="!bg-ink text-white border-ink">
      <div className="flex items-start justify-between">
        <p className="eyebrow !text-white/60">
          {monthFull(meeting.month)} Book Club
        </p>
        {dday != null && dday >= 0 && (
          <span className="text-xs text-white/70">D-{dday}</span>
        )}
      </div>
      <div className="mt-4 flex gap-4">
        {meeting.book && (
          <BookCover
            title={meeting.book.title}
            author={meeting.book.author}
            coverUrl={meeting.book.coverUrl}
            size="sm"
          />
        )}
        <div className="space-y-1">
          {meeting.book ? (
            <>
              <p className="font-display text-2xl leading-snug">
                『{meeting.book.title}』
              </p>
              <p className="text-white/70 text-sm">{meeting.book.author}</p>
            </>
          ) : (
            <p className="text-white/60">책 선정 예정</p>
          )}
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <Field label="책장" value={meeting.host?.name ?? "미정"} />
        <Field
          label="DATE"
          value={
            d ? `${formatDateDisplay(d)} ${formatTime(d)}` : "날짜 미정"
          }
        />
        <Field
          label="PLACE"
          value={
            meeting.place?.reserved ? (
              <PlaceLink dark name={meeting.place.name} link={meeting.place.link} />
            ) : (
              "장소 선정 예정"
            )
          }
        />
        <Field label="MEMBERS" value={`참석 예정 ${attendingCount}명`} />
      </div>
    </Card>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[0.65rem] tracking-widest text-white/50 font-display">
        {label}
      </p>
      <p className="mt-0.5">{value}</p>
    </div>
  );
}

function Tally({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "accent";
}) {
  return (
    <div
      className={`rounded-xl border py-3 ${
        tone === "accent" ? "border-accent/40 bg-accent-soft" : "border-line"
      }`}
    >
      <p className="text-2xl font-display">{value}</p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );
}

function RosterLine({ label, names }: { label: string; names: string[] }) {
  if (names.length === 0) return null;
  return (
    <p>
      <span className="text-muted">{label}</span>{" "}
      <span>{names.join(", ")}</span>
    </p>
  );
}
