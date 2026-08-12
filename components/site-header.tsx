import Image from "next/image";
import Link from "next/link";
import { SERVICE } from "@/lib/constants";
import { SiteNav } from "@/components/site-nav";

/**
 * 사이트 헤더 — 2026-08-11 루트 도메인 이전에 맞춰 다시 짰다.
 *
 * 프레이머 홈의 구성을 그대로 가져왔다: 좌측 로고 · 가운데 고정 카테고리 ·
 * 우측 로그인/내 프로젝트 + 문의 CTA. 카테고리는 새 경로 체계로 바꿨다 —
 * 프레이머 시절 메뉴가 아니라 지금 실제로 있는 페이지들이다.
 *
 * 2026-08-12: 모바일에 카테고리가 아예 없어서 사이트 구조가 보이지 않았고,
 * CTA 가 있는 페이지에서는 로그인·내 프로젝트가 통째로 사라졌다.
 * 우측 인증 버튼은 상시 노출로 고정하고, 카테고리는 햄버거로 뺐다 →
 * 상호작용이 필요해 {@link SiteNav} (클라이언트)로 분리했다.
 *
 * 다크/페이퍼 두 톤 — 히어로가 다크인 페이지 위에 밝은 바가 올라가면 띠처럼 잘려 보인다.
 */
export function SiteHeader({
  tone = "dark",
  cta,
}: {
  /** 히어로가 다크가 아닌 페이지에서는 지면 위에 띠가 얹히면 안 된다 */
  tone?: "dark" | "paper";
  /** 페이지별 우측 CTA — 데스크톱 바와 모바일 햄버거 하단에 함께 실린다 */
  cta?: { href: string; label: string };
} = {}) {
  const paper = tone === "paper";

  return (
    <header
      className={
        paper
          ? "fixed inset-x-0 top-0 z-40 border-b border-line bg-paper/85 text-ink backdrop-blur-md"
          : "fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-night/70 text-white backdrop-blur-md"
      }
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-5 sm:gap-4 sm:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center"
          aria-label={SERVICE.name}
        >
          {/* 심볼만 쓰고 이름은 텍스트로 — 워드마크 파일은 다른 브랜드 것이었다 */}
          <Image
            src={paper ? "/logo/navi-symbol.png" : "/logo/white-symbol.png"}
            alt=""
            width={98}
            height={98}
            priority
            className="h-[1.375rem] w-auto sm:h-6"
          />
          <span
            className={`ml-2 text-[0.8125rem] font-bold whitespace-nowrap sm:ml-2.5 sm:text-base ${
              paper ? "text-ink" : "text-white"
            }`}
          >
            {SERVICE.name}
          </span>
        </Link>

        <SiteNav paper={paper} cta={cta} />
      </div>
    </header>
  );
}
