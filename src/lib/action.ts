import type { FullMeeting } from "@/lib/meeting";
import { attendanceTally } from "@/lib/meeting";

export interface UserAction {
  title: string;
  desc?: string;
  href?: string;
  cta?: string;
  /** Informational only (no action for this user right now). */
  info?: boolean;
}

/**
 * Resolve the single most important thing THIS user should do right now,
 * given the meeting's lifecycle stage and the user's own responses (PRD §6).
 */
export function resolveUserAction(
  meeting: FullMeeting,
  userId: string,
): UserAction {
  const isHost = meeting.hostId === userId;
  const hasVoted = meeting.dateCandidates.some((c) =>
    c.votes.some((v) => v.userId === userId),
  );
  const myAttendance = meeting.attendances.find((a) => a.userId === userId);
  const hasReviewed = meeting.reviews.some((r) => r.userId === userId);
  const tally = attendanceTally(meeting.attendances);

  // No host claimed yet — the host banner above handles claiming.
  if (!meeting.hostId) {
    return {
      title: "이번 달 책장이 정해지지 않았어요.",
      desc: "위에서 책장을 맡거나, 정해질 때까지 기다려요.",
      info: true,
    };
  }

  switch (meeting.status) {
    case "BOOK_SELECTION":
      return isHost
        ? {
            title: "이달의 책을 선정해주세요.",
            desc: "책장으로서 이번 달 함께 읽을 책을 등록해주세요.",
            href: "/meeting",
            cta: "책 등록하기",
          }
        : {
            title: "이달의 책을 기다리고 있어요.",
            desc: "책장이 이번 달 책을 고르는 중이에요.",
            info: true,
          };

    case "DATE_VOTING":
      if (!hasVoted) {
        return {
          title: "모임 날짜를 선택해주세요.",
          desc: "가능한 날짜를 모두 골라주세요.",
          href: "/schedule",
          cta: "날짜 투표하기",
        };
      }
      return isHost
        ? {
            title: "날짜를 확정할 수 있어요.",
            desc: "투표 현황을 확인하고 모임 날짜를 확정해주세요.",
            href: "/schedule",
            cta: "투표 현황 보기",
          }
        : {
            title: "투표 완료! 날짜 확정을 기다려요.",
            desc: "책장이 최종 날짜를 확정할 예정이에요.",
            href: "/schedule",
            cta: "현황 보기",
            info: true,
          };

    case "DATE_CONFIRMED":
      return isHost
        ? {
            title: "참석 여부 확인을 시작하세요.",
            desc: "장소 예약을 위해 멤버들의 최종 참석 여부를 받아요.",
            href: "/meeting",
            cta: "참석 확인 열기",
          }
        : {
            title: "모임 날짜가 확정됐어요.",
            desc: "곧 최종 참석 여부를 여쭤볼게요.",
            href: "/meeting",
            cta: "모임 정보 보기",
            info: true,
          };

    case "ATTENDANCE_CHECK":
      if (!isHost && (!myAttendance || myAttendance.status === "NO_RESPONSE")) {
        return {
          title: "최종 참석 여부를 알려주세요.",
          desc: "장소 예약을 위해 참석 가능 여부를 확인하고 있어요.",
          href: "/meeting",
          cta: "참석 여부 응답하기",
        };
      }
      if (isHost) {
        return {
          title: "참석 인원을 확인하고 장소를 예약하세요.",
          desc: `참석 ${tally.attending} · 불참 ${tally.notAttending} · 미응답 ${tally.noResponse}`,
          href: "/meeting",
          cta: "장소 예약하기",
        };
      }
      return {
        title: "참석 응답 완료!",
        desc: "장소가 확정되면 알려드릴게요.",
        href: "/meeting",
        cta: "모임 정보 보기",
        info: true,
      };

    case "PLACE_CONFIRMED":
      return isHost
        ? {
            title: "토론 질문을 준비하고 모임을 마무리 세팅하세요.",
            desc: "질문을 등록하면 최종 안내가 완성돼요.",
            href: "/meeting",
            cta: "모임 준비하기",
          }
        : {
            title: "장소가 확정됐어요.",
            desc: "최종 모임 안내를 확인해보세요.",
            href: "/meeting",
            cta: "모임 정보 보기",
            info: true,
          };

    case "READY":
      return {
        title: "모임 준비 완료!",
        desc: "최종 모임 안내를 확인하고 만나요.",
        href: "/meeting",
        cta: "최종 안내 보기",
      };

    case "COMPLETE":
      if (!hasReviewed) {
        return {
          title: "이번 책은 어떠셨나요?",
          desc: "별점과 짧은 한줄평을 남겨주세요.",
          href: `/archive/${meeting.id}#review`,
          cta: "한줄평 남기기",
        };
      }
      return {
        title: "이번 모임 기록이 저장됐어요.",
        desc: "아카이브에서 우리의 독서를 다시 볼 수 있어요.",
        href: `/archive/${meeting.id}`,
        cta: "기록 보기",
        info: true,
      };

    default:
      return { title: "진행 중인 모임을 확인해보세요.", info: true };
  }
}
