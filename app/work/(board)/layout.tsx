import Link from "next/link";
import { requireWorker } from "@/lib/supabase/auth";
import { signOutWorker } from "@/app/work/actions";
import { WORK_APP } from "@/lib/work";

export default async function WorkBoardLayout({
  children,
}: LayoutProps<"/work">) {
  const worker = await requireWorker();

  return (
    <>
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-5 sm:px-8">
          <Link href="/work" className="flex items-center gap-2 text-sm font-bold">
            <span className="size-2.5 rounded-full bg-accent" aria-hidden />
            {WORK_APP.name}
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted">{worker.contact_name}</span>
            <form action={signOutWorker}>
              <button type="submit" className="text-muted hover:text-ink">
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-8">
        {children}
      </main>
    </>
  );
}
