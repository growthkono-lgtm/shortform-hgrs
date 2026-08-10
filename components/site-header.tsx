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

        {/* 모바일에서도 "신청하기"는 남긴다. 숨겼더니 우상단이 로그인·가입만 남아
            사이트가 뭘 파는지 모르는 화면이 됐다.

            2026-08-10: "파트너십"을 헤더에서 뺐다. 첫 화면 우상단에 밖으로 나가는
            링크를 두면, 이 랜딩이 뭘 파는지 읽고 고민하기도 전에 본사로 이탈한다.
            같은 링크는 제작팀(Crew) 섹션과 푸터가 이미 받고 있다 —
            아래까지 읽고도 종합 대행이 필요한 사람은 거기서 넘어가면 된다. */}
        <nav className="flex items-center gap-4 text-sm sm:gap-5">
          <Link
            href="#crew"
            className="hidden shrink-0 text-white/60 hover:text-white lg:block"
          >
            제작팀
          </Link>
          <Link
            href="#apply"
            className="shrink-0 text-xs text-white/60 hover:text-white sm:text-sm"
          >
            신청하기
          </Link>
          <HeaderAuth />
        </nav>
      </div>
    </header>
  );
}
