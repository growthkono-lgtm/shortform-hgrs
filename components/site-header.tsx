import Link from "next/link";
import { SERVICE } from "@/lib/constants";
import { HeaderAuth } from "@/components/auth/header-auth";

/**
 * 헤더는 다크다 — 히어로가 다크로 깔려 있어서 밝은 바가 올라가면 띠처럼 잘려 보인다.
 * hgrs.io도 히어로 위 헤더를 어둡게 붙여 하나의 화면으로 읽히게 한다.
 */
export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-night/70 text-white backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <div className="flex flex-col leading-none">
          <Link href="/" className="text-sm font-bold">
            {SERVICE.name}
          </Link>
          <a
            href={SERVICE.parentUrl}
            target="_blank"
            rel="noreferrer"
            className="font-display mt-1 w-fit text-[0.625rem] tracking-[0.02em] text-white/45 uppercase hover:text-white"
          >
            by {SERVICE.parentName}
          </a>
        </div>

        {/* 메뉴는 셋으로 고정한다 — 컨텐츠 진단 / 로그인 / 내 프로젝트.
            PC·모바일 동일. 랜딩의 전환 경로는 진단 → 신청 하나뿐이라
            그 입구(진단)만 헤더에 남기고 나머지 섹션 링크는 뺐다.
            "파트너십"처럼 밖으로 나가는 링크도 두지 않는다 — 읽기 전에 이탈한다. */}
        <nav className="flex items-center gap-3 text-sm sm:gap-5">
          <Link
            href="#diagnosis"
            className="shrink-0 text-xs whitespace-nowrap text-white/60 hover:text-white sm:text-sm"
          >
            컨텐츠 진단
          </Link>
          <HeaderAuth />
        </nav>
      </div>
    </header>
  );
}
