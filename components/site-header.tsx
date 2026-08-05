import Link from "next/link";
import { SERVICE } from "@/lib/constants";
import { HeaderAuth } from "@/components/auth/header-auth";

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <div className="flex flex-col leading-none">
          <Link href="/" className="text-sm font-bold">
            {SERVICE.name}
          </Link>
          <a
            href={SERVICE.parentUrl}
            target="_blank"
            rel="noreferrer"
            className="font-display mt-1 w-fit text-[0.625rem] tracking-[0.02em] text-muted uppercase hover:text-ink"
          >
            by {SERVICE.parentName}
          </a>
        </div>

        <nav className="flex items-center gap-6 text-sm">
          <Link href="#pricing" className="hidden text-muted hover:text-ink sm:block">
            가격
          </Link>
          <HeaderAuth />
        </nav>
      </div>
    </header>
  );
}
