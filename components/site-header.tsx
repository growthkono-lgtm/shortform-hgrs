import Image from "next/image";
import Link from "next/link";
import { SERVICE } from "@/lib/constants";
import { HeaderAuth } from "@/components/auth/header-auth";

/**
 * 사이트 헤더 — 2026-08-11 루트 도메인 이전에 맞춰 다시 짰다.
 *
 * 프레이머 홈의 구성을 그대로 가져왔다: 좌측 로고 · 가운데 고정 카테고리 ·
 * 우측 문의 CTA. 카테고리는 새 경로 체계로 바꿨다 — 프레이머 시절 메뉴가 아니라
 * 지금 실제로 있는 페이지들이다.
 *
 * 다크/페이퍼 두 톤 — 히어로가 다크인 페이지 위에 밝은 바가 올라가면 띠처럼 잘려 보인다.
 */
const NAV = [
  { href: "/shortform", label: "숏폼 스튜디오" },
  { href: "/sns-brand", label: "브랜드 SNS 채널" },
  { href: "/portfolio", label: "성과 사례" },
  { href: "/blog", label: "블로그" },
] as const;

export function SiteHeader({
  nav = NAV,
  tone = "dark",
  cta,
}: {
  nav?: readonly { href: string; label: string }[];
  /** 히어로가 다크가 아닌 페이지에서는 지면 위에 띠가 얹히면 안 된다 */
  tone?: "dark" | "paper";
  /** 우측 CTA — 없으면 로그인/내 프로젝트(숏폼 결제 흐름)를 보여준다 */
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
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
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
            className={`ml-2.5 text-[0.9375rem] font-bold whitespace-nowrap sm:text-base ${
              paper ? "text-ink" : "text-white"
            }`}
          >
            {SERVICE.name}
          </span>
        </Link>

        {/* 고정 카테고리 — 좁은 화면에서는 접고 CTA 만 남긴다 */}
        <nav className="hidden flex-1 items-center justify-center gap-7 text-sm lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                paper
                  ? "whitespace-nowrap text-muted transition-colors hover:text-ink"
                  : "whitespace-nowrap text-white/65 transition-colors hover:text-white"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <nav className="flex shrink-0 items-center gap-2.5 text-sm sm:gap-4">
          {cta ? (
            <Link
              href={cta.href}
              className={
                paper
                  ? "rounded-full bg-ink px-4 py-2 text-xs font-bold whitespace-nowrap text-paper transition-colors hover:bg-ink-soft sm:px-5 sm:py-2.5 sm:text-sm"
                  : "rounded-full bg-paper px-4 py-2 text-xs font-bold whitespace-nowrap text-ink transition-colors hover:bg-paper/85 sm:px-5 sm:py-2.5 sm:text-sm"
              }
            >
              {cta.label}
            </Link>
          ) : (
            <HeaderAuth paper={paper} />
          )}
        </nav>
      </div>
    </header>
  );
}
