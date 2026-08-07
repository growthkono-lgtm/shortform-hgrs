import Link from "next/link";
import { PARTNERSHIP_URL, SERVICE } from "@/lib/constants";
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

        {/* 모바일에서도 "플랜 보기"는 남긴다. 숨겼더니 우상단이 로그인·가입만 남아
            사이트가 뭘 파는지 모르는 화면이 됐다.

            "파트너십"은 상단에 둔다 — 이 랜딩은 숏폼 편수를 파는 화면이라
            브랜드 종합 대행·장기 파트너십을 보러 온 방문자는 아래로 내려가 봐야
            답이 없다. 나가는 링크라 색은 주지 않고 테두리만 준다 (CTA는 가입 하나로 유지).
            폭이 좁은 화면에선 CTA와 붙어 버리므로 sm 이상에서만 띄우고,
            모바일은 팀 섹션·푸터의 같은 링크가 받는다. */}
        <nav className="flex items-center gap-4 text-sm sm:gap-5">
          <Link
            href="#crew"
            className="hidden shrink-0 text-white/60 hover:text-white lg:block"
          >
            제작팀
          </Link>
          <Link
            href="#pricing"
            className="shrink-0 text-xs text-white/60 hover:text-white sm:text-sm"
          >
            플랜 보기
          </Link>
          <a
            href={PARTNERSHIP_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden shrink-0 rounded-full border border-white/25 px-3.5 py-1.5 text-xs font-bold whitespace-nowrap text-white/85 transition-colors hover:border-white hover:text-white sm:block"
          >
            파트너십
          </a>
          <HeaderAuth />
        </nav>
      </div>
    </header>
  );
}
