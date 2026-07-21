import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getMeetingById, averageRating } from "@/lib/meeting";
import { formatMonthLabel, formatDateDisplay, formatTime } from "@/lib/format";
import { BookCover, Card, Eyebrow, Stars, Chip, PlaceLink } from "@/components/ui";
import { ReviewForm } from "@/components/ReviewForm";

export default async function ArchiveDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = (await getCurrentUser())!;
  const meeting = await getMeetingById(id);
  if (!meeting) notFound();

  const avg = averageRating(meeting.reviews);
  const attending = meeting.attendances.filter((a) => a.status === "ATTENDING");
  const notAttending = meeting.attendances.filter(
    (a) => a.status === "NOT_ATTENDING",
  );
  const myReview = meeting.reviews.find((r) => r.userId === user.id);
  const consented = meeting.reviews.filter((r) => r.snsConsent);

  return (
    <div className="space-y-8">
      <Link href="/archive" className="text-sm text-muted hover:text-ink">
        ← 아카이브
      </Link>

      {/* Book header */}
      <Card>
        <Eyebrow>{formatMonthLabel(meeting.year, meeting.month)}</Eyebrow>
        <div className="mt-4 flex gap-4 items-start">
          {meeting.book && (
            <BookCover
              title={meeting.book.title}
              author={meeting.book.author}
              coverUrl={meeting.book.coverUrl}
              size="md"
            />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl leading-snug">
              {meeting.book ? `『${meeting.book.title}』` : "책 미정"}
            </h1>
            {meeting.book && (
              <p className="text-muted text-sm mt-1">{meeting.book.author}</p>
            )}
            {avg != null && (
              <div className="mt-3 flex items-center gap-x-2 gap-y-1 flex-wrap">
                <span className="flex items-center gap-2">
                  <Stars value={avg} />
                  <span className="font-display text-lg leading-none">{avg}</span>
                </span>
                <span className="text-muted text-sm">
                  / 5 · 리뷰 {meeting.reviews.length}개
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Meeting meta */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <Eyebrow>Meeting</Eyebrow>
          <p className="mt-2 text-sm">
            {meeting.confirmedDate
              ? `${formatDateDisplay(meeting.confirmedDate)} ${formatTime(meeting.confirmedDate)}`
              : "날짜 기록 없음"}
          </p>
          {meeting.place && (
            <p className="text-sm mt-1">
              <PlaceLink
                name={meeting.place.name}
                link={meeting.place.link}
                className="text-sm"
              />
            </p>
          )}
        </Card>
        <Card>
          <Eyebrow>책장 &amp; 참석</Eyebrow>
          <p className="mt-2 text-sm">책장 {meeting.host?.name ?? "미정"}</p>
          <div className="mt-2 space-y-1 text-sm">
            <p>
              <span className="text-muted">참석 {attending.length}명</span>{" "}
              {attending.map((a) => a.user.name).join(", ") || "기록 없음"}
            </p>
            {notAttending.length > 0 && (
              <p>
                <span className="text-muted">불참 {notAttending.length}명</span>{" "}
                {notAttending.map((a) => a.user.name).join(", ")}
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Discussion */}
      {meeting.discussionQuestions.length > 0 && (
        <Card>
          <Eyebrow>Discussion</Eyebrow>
          <ol className="mt-3 space-y-2">
            {meeting.discussionQuestions.map((q) => (
              <li key={q.id} className="flex gap-3 text-sm">
                <span className="font-display text-accent">
                  {String(q.order).padStart(2, "0")}
                </span>
                {q.content}
              </li>
            ))}
          </ol>
        </Card>
      )}

      {/* Member reviews */}
      <Card>
        <div className="flex items-center justify-between gap-2">
          <Eyebrow>Member Reviews</Eyebrow>
          {consented.length >= 2 ? (
            <Link
              href={`/archive/${meeting.id}/instagram`}
              className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-white whitespace-nowrap"
            >
              ↓ 리뷰 이미지 다운로드
            </Link>
          ) : (
            <span className="text-xs text-muted whitespace-nowrap">
              SNS 공개 리뷰 2개↑ 시 이미지 생성
            </span>
          )}
        </div>
        {meeting.reviews.length === 0 ? (
          <p className="mt-3 text-sm text-muted">아직 리뷰가 없어요.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {meeting.reviews.map((r) => (
              <li key={r.id} className="border-b border-line pb-4 last:border-0">
                <Stars value={r.rating} className="text-sm" />
                <p className="mt-1.5 text-sm">{r.comment}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-xs text-muted">— {r.user.nickname}</span>
                  {r.snsConsent && <Chip tone="muted">SNS 공개</Chip>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Write / edit my review */}
      <Card>
        <div id="review" className="scroll-mt-20">
          <Eyebrow>{myReview ? "내 한줄평" : "이번 책은 어떠셨나요?"}</Eyebrow>
          <p className="text-sm text-muted mt-1 mb-4">
            책을 읽었다면 모임에 참석하지 못했더라도 남길 수 있어요.
          </p>
          <ReviewForm
            meetingId={meeting.id}
            initial={
              myReview
                ? {
                    rating: myReview.rating,
                    comment: myReview.comment,
                    readBook: myReview.readBook,
                    attended: myReview.attended,
                    snsConsent: myReview.snsConsent,
                  }
                : undefined
            }
          />
        </div>
      </Card>
    </div>
  );
}
