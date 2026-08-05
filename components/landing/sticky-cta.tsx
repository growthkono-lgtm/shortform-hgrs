"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatKRW } from "@/lib/constants";
import { usePlanSelection } from "./plan-selection";

/**
 * 모바일 하단 고정 CTA (PART B).
 * · 히어로를 지나면 등장
 * · 가격 섹션에 진입하면 선택 플랜 금액으로 라벨 변경
 * · 채널톡 런처와 겹치지 않도록 런처는 좌하단으로 설정 (F11)
 */
export function StickyCta() {
  const { selected } = usePlanSelection();
  const [visible, setVisible] = useState(false);
  const [inPricing, setInPricing] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const pricing = document.getElementById("pricing");
    if (!pricing) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInPricing(entry.isIntersecting),
      { rootMargin: "-20% 0px -20% 0px" },
    );
    observer.observe(pricing);
    return () => observer.disconnect();
  }, []);

  const label = inPricing
    ? `${formatKRW(selected.betaPrice)} 결제하기`
    : "베타가로 시작하기";
  const href = inPricing ? `/checkout/${selected.code}-${selected.tier}` : "#pricing";

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 px-4 pb-4 transition-opacity duration-300 sm:hidden ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <Link
        href={href}
        className="flex w-full items-center justify-center rounded-full bg-ink px-6 py-4 text-sm font-bold text-paper shadow-[0_12px_30px_-8px_rgba(3,3,3,0.5)]"
      >
        {label}
      </Link>
    </div>
  );
}
