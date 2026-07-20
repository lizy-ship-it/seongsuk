import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getCurrentMeeting } from "@/lib/meeting";
import { logout } from "@/lib/actions/auth";
import { BottomNav } from "@/components/Nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const meeting = await getCurrentMeeting();
  const isHost = meeting?.hostId === user.id;

  return (
    <div className="flex-1 flex flex-col mx-auto w-full max-w-[480px]">
      <header className="sticky top-0 z-20 bg-paper/85 backdrop-blur">
        <div className="px-5 h-14 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Image
              src="/logo-mark.png"
              alt="독서모임"
              width={36}
              height={36}
              className="size-9 object-contain dark:invert"
            />
            <span className="font-display text-lg font-bold tracking-tight">
              독서모임 성숙
            </span>
          </span>
          <div className="flex items-center gap-2.5">
            {isHost && (
              <span className="inline-flex items-center rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold tracking-wide text-surface">
                책장
              </span>
            )}
            <span className="text-xs text-muted">@{user.nickname}</span>
            <form action={logout}>
              <button
                type="submit"
                className="text-xs text-muted hover:text-danger transition-colors"
              >
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 pt-4 pb-28">{children}</main>

      <BottomNav />
    </div>
  );
}
