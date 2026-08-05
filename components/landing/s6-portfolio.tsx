"use client";

import { useState } from "react";
import { Section, SectionHeading } from "@/components/ui/section";
import { AssetSlot } from "@/components/ui/slot";
import { cn } from "@/lib/cn";
import { PORTFOLIO_CATEGORIES } from "@/lib/landing-data";

/** S6. 레퍼런스 포트폴리오 — Portfolio (portfolio.json 로드 전 스켈레톤) */
export function Portfolio() {
  const [active, setActive] = useState<string>("전체");

  return (
    <Section eyebrow="Portfolio" alt>
      <SectionHeading>
        말이 아니라 <strong className="font-bold">결과물</strong>로 보여드립니다
      </SectionHeading>

      <div className="mt-8 flex flex-wrap gap-2">
        {PORTFOLIO_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActive(category)}
            aria-pressed={active === category}
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition-colors duration-200",
              active === category
                ? "border-ink bg-ink text-paper"
                : "border-line text-muted hover:border-ink/40 hover:text-ink",
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* 1행 — 9:16 영상 캐러셀 */}
      <div className="mt-10 -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
        <ul className="flex gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="w-40 shrink-0 sm:w-48">
              <AssetSlot name={`reel_${i + 1}`} ratio="9/16" />
            </li>
          ))}
        </ul>
      </div>

      {/* 2행 — 유튜브 임베드 */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <AssetSlot
            key={i}
            name={`youtube_links[${i}]`}
            ratio="16/9"
            hint="유튜브 임베드"
          />
        ))}
      </div>

      {/* 3행 — 배너 갤러리 */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <AssetSlot key={i} name={`banner_${i + 1}`} ratio="4/3" />
        ))}
      </div>

      <p className="mt-8 text-xs text-muted">
        자산은 <code className="font-mono">portfolio.json</code>에서 로드됩니다 —
        전달 후 카테고리 필터가 실제로 동작합니다.
      </p>
    </Section>
  );
}
