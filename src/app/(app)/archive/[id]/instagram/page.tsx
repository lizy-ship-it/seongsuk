import Link from "next/link";
import { notFound } from "next/navigation";
import { getMeetingById } from "@/lib/meeting";
import { monthFull } from "@/lib/format";
import { Card, Eyebrow } from "@/components/ui";
import { InstagramStudio } from "@/components/InstagramStudio";

export default async function InstagramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const meeting = await getMeetingById(id);
  if (!meeting) notFound();

  const consented = meeting.reviews
    .filter((r) => r.snsConsent)
    .map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      author: r.user.nickname,
    }));

  return (
    <div className="space-y-8">
      <Link
        href={`/archive/${id}`}
        className="text-sm text-muted hover:text-ink"
      >
        ← {meeting.book ? `『${meeting.book.title}』` : "모임 기록"}
      </Link>

      <header>
        <Eyebrow>Instagram Studio</Eyebrow>
        <h1 className="font-display text-3xl mt-2">리뷰 이미지 만들기</h1>
        <p className="text-muted text-sm mt-2">
          여러 명의 한줄평을 한 장에 담아 Instagram 캐러셀 이미지를 만들어요.
        </p>
      </header>

      {consented.length < 2 ? (
        <Card>
          <p className="text-sm text-muted">
            SNS 공개에 동의한 리뷰가 2개 이상 있어야 이미지를 만들 수 있어요.
            (현재 {consented.length}개)
          </p>
        </Card>
      ) : (
        <InstagramStudio
          monthLabel={`${monthFull(meeting.month)} Book Club`}
          bookTitle={meeting.book?.title ?? "우리의 책"}
          reviews={consented}
        />
      )}
    </div>
  );
}
