"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SERVICE } from "@/lib/constants";
import { HeaderAuth } from "@/components/auth/header-auth";

/**
 * 헤더 — 로고 · 카테고리 · 로그인/내 프로젝트.
 *
 * 모바일에서는 카테고리가 통째로 사라져 사이트에 어떤 페이지가 있는지 알 수 없었다.
 * 햄버거를 열면 카테고리와 문의 CTA 가 같이 나온다.
 *
 * 우측은 어느 페이지에서든 **로그인 + 내 프로젝트**가 붙는다 — 결제한 브랜드가
 * 진행 현황을 보러 오는 입구라 페이지마다 달라지면 안 된다.
 */
export const NAV = [
  { href: "/shortform", label: "숏폼 스튜디오" },
  { href: "/sns-brand", label: "브랜드 SNS 채널" },
  { href: "/portfolio", label: "성과 사례" },
  { href: "/blog", label: "블로그" },
] as const;

export function SiteNav({
  paper,
  cta,
}: {
  paper: boolean;
  cta?: { href: string; label: string };
}) {
  const [open, setOpen] = useState(false);

  // 패널이 열린 동안 뒷배경이 스크롤되면 길을 잃는다
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const linkTone = paper
    ? "text-muted hover:text-ink"
    : "text-white/65 hover:text-white";

  return (
    <>
      <nav className="hidden flex-1 items-center justify-center gap-7 text-sm lg:flex">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap transition-colors ${linkTone}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex shrink-0 items-center gap-2.5 sm:gap-3.5">
        <HeaderAuth paper={paper} />

        {/* 페이지별 CTA 는 데스크톱만 — 모바일에서는 햄버거 패널 하단에 크게 들어간다 */}
        {cta && (
          <Link
            href={cta.href}
            className={`hidden shrink-0 rounded-full px-5 py-2.5 text-sm font-bold whitespace-nowrap transition-colors lg:inline-flex ${
              paper
                ? "bg-ink text-paper hover:bg-ink-soft"
                : "bg-paper text-ink hover:bg-paper/85"
            }`}
          >
            {cta.label}
          </Link>
        )}

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="메뉴 열기"
          aria-expanded={open}
          className={`grid size-9 place-items-center rounded-full border lg:hidden ${
            paper ? "border-line text-ink" : "border-white/20 text-white"
          }`}
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="메뉴 닫기"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="absolute inset-x-0 top-0 bg-paper px-5 pt-4 pb-8 text-ink shadow-xl">
            <div className="flex h-12 items-center justify-between">
              <Image
                src="/logo/navi-symbol.png"
                alt={SERVICE.name}
                width={98}
                height={98}
                className="h-6 w-auto"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="메뉴 닫기"
                className="grid size-9 place-items-center rounded-full border border-line"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <ul className="mt-4 divide-y divide-line border-y border-line">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between py-4 text-base font-bold"
                  >
                    {item.label}
                    <span aria-hidden className="text-muted">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <Link
              href={cta?.href ?? "/sns-brand#contact"}
              onClick={() => setOpen(false)}
              className="mt-6 flex items-center justify-center rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-paper"
            >
              {cta?.label ?? "프로젝트 문의"}
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
