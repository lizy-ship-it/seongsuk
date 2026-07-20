import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  getSessionUserId,
  accessRequired,
  hasAccess,
} from "@/lib/session";
import { getCurrentMeeting } from "@/lib/meeting";
import { enter, submitAccessCode } from "@/lib/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; userId?: string; codeerr?: string }>;
}) {
  if (await getSessionUserId()) redirect("/");
  const { error, userId, codeerr } = await searchParams;

  // Shared access-code gate (group-only).
  const gated = accessRequired() && !(await hasAccess());

  const members = gated
    ? []
    : await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  const meeting = gated ? null : await getCurrentMeeting();
  const selected = userId ? members.find((m) => m.id === userId) : undefined;

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Image
            src="/logo.png"
            alt="독서모임"
            width={200}
            height={150}
            className="mx-auto mb-4 w-44 h-auto object-contain dark:invert"
            priority
          />
          <h1 className="font-display text-2xl font-bold">독서모임 성숙</h1>
          <p className="text-muted text-sm mt-2">함께 읽고, 기록하는 우리의 서재</p>
        </div>

        {gated ? (
          <AccessGate codeerr={codeerr === "1"} />
        ) : !selected ? (
          <IdentityStep members={members} error={error} />
        ) : (
          <RoleStep
            selected={selected}
            month={meeting?.month ?? new Date().getMonth() + 1}
            hostId={meeting?.hostId ?? null}
            hostName={meeting?.host?.name ?? null}
          />
        )}

        <p className="text-center text-xs text-muted mt-6">
          초대된 멤버만 입장할 수 있어요
        </p>
      </div>
    </main>
  );
}

function AccessGate({ codeerr }: { codeerr: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <p className="text-sm font-medium mb-1">입장 코드</p>
      <p className="text-xs text-muted mb-4">
        카톡방에 공유된 코드를 입력해주세요.
      </p>
      {codeerr && (
        <p className="text-danger text-xs mb-3">코드가 맞지 않아요.</p>
      )}
      <form action={submitAccessCode} className="flex gap-2">
        <input
          name="code"
          type="password"
          autoComplete="off"
          placeholder="입장 코드"
          required
          className="flex-1 rounded-lg border border-line bg-paper px-3 py-2.5 text-sm"
        />
        <button className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white whitespace-nowrap">
          입장
        </button>
      </form>
    </div>
  );
}

function IdentityStep({
  members,
  error,
}: {
  members: { id: string; name: string; nickname: string }[];
  error?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <p className="text-sm font-medium mb-4">누구로 입장하시나요?</p>
      {error === "notfound" && (
        <p className="text-danger text-xs mb-3">
          멤버를 찾을 수 없어요. 다시 선택해주세요.
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        {members.map((m) => (
          <Link
            key={m.id}
            href={`/login?userId=${m.id}`}
            className="rounded-xl border border-line px-3 py-3 hover:border-accent hover:bg-accent-soft transition-colors"
          >
            <span className="block text-sm font-medium">{m.name}</span>
            <span className="block text-xs text-muted">@{m.nickname}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function RoleStep({
  selected,
  month,
  hostId,
  hostName,
}: {
  selected: { id: string; name: string };
  month: number;
  hostId: string | null;
  hostName: string | null;
}) {
  const iAmHost = hostId === selected.id;
  const hostTaken = hostId != null;

  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium">
          {selected.name}님, 어떻게 입장하세요?
        </p>
        <Link href="/login" className="text-xs text-muted hover:text-ink">
          ← 다시
        </Link>
      </div>

      {iAmHost ? (
        <>
          <p className="text-xs text-muted mb-3">
            당신이 {month}월 책장이에요.
          </p>
          <EnterButton userId={selected.id} role="host" label="책장으로 입장" />
        </>
      ) : hostTaken ? (
        <>
          <p className="text-xs text-muted mb-3">
            {month}월 책장: {hostName}. 입장 후 홈에서 책장 변경을 요청할 수
            있어요.
          </p>
          <EnterButton
            userId={selected.id}
            role="member"
            label="참여자로 입장"
          />
        </>
      ) : (
        <div className="space-y-2.5">
          <EnterButton
            userId={selected.id}
            role="host"
            label={`이번 달(${month}월) 책장으로 입장`}
            hint="모임 운영을 맡아요 · 먼저 맡는 사람이 책장"
            primary
          />
          <EnterButton
            userId={selected.id}
            role="member"
            label="참여자로 입장"
            hint="모임에 참여해요"
          />
        </div>
      )}
    </div>
  );
}

function EnterButton({
  userId,
  role,
  label,
  hint,
  primary = false,
}: {
  userId: string;
  role: "host" | "member";
  label: string;
  hint?: string;
  primary?: boolean;
}) {
  return (
    <form action={enter}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="role" value={role} />
      <button
        type="submit"
        className={`w-full flex items-center justify-between rounded-xl px-4 py-4 transition-colors ${
          primary
            ? "bg-ink text-surface hover:opacity-90"
            : "border border-line hover:bg-accent-soft"
        }`}
      >
        <span className="text-left">
          <span className="block text-sm font-semibold">{label}</span>
          {hint && (
            <span
              className={`block text-xs ${
                primary ? "text-surface/70" : "text-muted"
              }`}
            >
              {hint}
            </span>
          )}
        </span>
        <span aria-hidden>→</span>
      </button>
    </form>
  );
}
