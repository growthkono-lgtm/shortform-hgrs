import type { Metadata } from "next";
import Link from "next/link";

import { NoticeSignup } from "@/components/blog/notice-signup";
import { JsonLd, breadcrumb } from "@/components/seo/structured-data";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { listPosts, type PostMeta } from "@/lib/blog-posts";
import { pillar } from "@/lib/blog-spec";

/**
 * /blog — 자체 인사이트 목록.
 *
 * 2026-08-13 개편. 앞선 판은 제목만 세로로 쌓는 목록이었는데, 사장님이 참고로
 * 주신 지면처럼 **썸네일 카드 + 카테고리 라벨 + 날짜**로 바꿨다. 목록에서
 * 고를 재료가 제목 한 줄뿐이면 아래로 내려갈수록 안 읽힌다.
 *
 * 두 종류를 한 줄에 세우지 않는다 —
 *  · 인사이트는 번호가 붙는 연재물이다(#1, #2 …). 편성표에서 나온다.
 *  · 고객 이야기는 우리가 한 프로젝트의 기록이다. 늘 거기 있는 자료라 번호가 없다.
 * 섞으면 최신 글이 옛날 사례에 밀린다.
 *
 * 브런치북은 없애지 않는다. 이미 쌓인 글과 거기서 들어오는 독자가 있다.
 */
export const metadata: Metadata = {
  title: { absolute: "인사이트 | 해그로시" },
  description:
    "브랜드 대표·이사급을 위한 숏폼·브랜드 SNS 인사이트. 플랫폼 공식 발표와 공개 통계, 실제 집행 사례를 출처와 함께 정리합니다.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "인사이트 | 해그로시",
    description:
      "숏폼·브랜드 SNS 인사이트. 출처와 실물 사례를 붙여 정리합니다.",
    url: "/blog",
  },
};

const BRUNCH_URL = "https://brunch.co.kr/brunchbook/bmaha2";

function dateLabel(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * 카드 한 장. 썸네일은 글마다 자동 생성되는 OG 이미지를 그대로 쓴다 —
 * 목록·검색·공유가 같은 그림을 보게 되고, 새 글이 올라와도 손이 안 간다.
 */
function PostCard({ post }: { post: PostMeta }) {
  return (
    <li>
      <Link href={`/blog/${post.slug}`} className="group block">
        <div className="relative aspect-[1200/630] overflow-hidden rounded-xl border border-ink/10 bg-ink/[0.03]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/blog/thumbnail/${post.slug}`}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
        <p className="mt-3.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink/45">
          {post.seq !== null && (
            <span className="font-bold text-ink/70 tabular-nums">
              #{post.seq}
            </span>
          )}
          <span className="rounded bg-ink/[0.06] px-1.5 py-0.5 font-medium text-ink/70">
            {post.client ? post.client.industry : pillar(post.pillar).label}
          </span>
          <span>{post.client?.period ?? `약 ${post.readMinutes}분`}</span>
        </p>
        <h3 className="mt-2 text-[0.9375rem] leading-[1.5] font-bold text-balance group-hover:underline sm:text-base">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-[0.8125rem] leading-[1.75] text-ink/55">
          {post.lead}
        </p>
        <p className="mt-2 text-xs text-ink/35">
          {dateLabel(post.publishedAt)}
        </p>
      </Link>
    </li>
  );
}

export default async function BlogIndexPage() {
  const posts = await listPosts();
  const insights = posts.filter((p) => p.kind === "insight");
  const stories = posts.filter((p) => p.kind === "story");

  return (
    <>
      <JsonLd
        data={breadcrumb([
          { name: "홈", path: "" },
          { name: "인사이트", path: "/blog" },
        ])}
      />
      <SiteHeader />

      <main className="mx-auto w-full max-w-5xl px-5 py-16 sm:px-8 md:py-24">
        <p className="eyebrow">Insight</p>
        <h1 className="mt-5 text-[1.75rem] leading-[1.3] font-bold text-balance sm:text-[2.25rem] lg:text-[2.75rem]">
          숏폼과 브랜드 채널을
          <br />
          매출로 잇는 판단 기준
        </h1>
        <p className="mt-6 max-w-xl text-[0.9375rem] leading-[1.85] text-ink/60 sm:text-base">
          플랫폼 공식 발표와 공개 통계, 실제 집행 사례를 근거로 정리합니다.
          본문에 쓰인 수치에는 출처·연도·기준을 함께 적고, 확인하지 못한 것은
          쓰지 않습니다.
        </p>

        {/* ── 인사이트 ── */}
        <section className="mt-16">
          <div className="flex items-baseline justify-between border-b border-ink/10 pb-3">
            <h2 className="text-sm font-bold">인사이트</h2>
            <span className="text-xs text-ink/40 tabular-nums">
              {insights.length}편
            </span>
          </div>
          {insights.length === 0 ? (
            <p className="mt-8 text-sm text-ink/50">준비 중입니다.</p>
          ) : (
            <ul className="mt-8 grid gap-x-6 gap-y-11 sm:grid-cols-2 lg:grid-cols-3">
              {insights.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </ul>
          )}
        </section>

        {/* ── 고객 이야기 ── */}
        {stories.length > 0 && (
          <section className="mt-20">
            <div className="flex items-baseline justify-between border-b border-ink/10 pb-3">
              <h2 className="text-sm font-bold">고객 이야기</h2>
              <span className="text-xs text-ink/40 tabular-nums">
                {stories.length}편
              </span>
            </div>
            <p className="mt-3 max-w-xl text-[0.8125rem] leading-[1.8] text-ink/50">
              해그로시가 직접 맡았던 프로젝트의 기록입니다. 적힌 수치는 당시
              집행 결과 그대로이며, 계약상 밝힐 수 없는 부분은 비워 두었습니다.
            </p>
            <ul className="mt-8 grid gap-x-6 gap-y-11 sm:grid-cols-2 lg:grid-cols-3">
              {stories.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </ul>
          </section>
        )}

        {/* ── 신규 콘텐츠 알림 ── */}
        <div className="mt-20">
          <NoticeSignup source="blog-index" />
        </div>

        {/* 브런치북 — 접은 게 아니라 계속 둔다. 여기서 온 독자가 있다 */}
        <div className="mt-8 rounded-2xl border border-ink/10 bg-ink/[0.02] p-6">
          <h2 className="text-sm font-bold">해그로시 브런치북</h2>
          <p className="mt-2 text-sm leading-[1.8] text-ink/60">
            그동안 브런치에 쌓아 온 글도 그대로 보실 수 있습니다.
          </p>
          <a
            className="mt-3 inline-block text-sm font-medium underline underline-offset-4"
            href={BRUNCH_URL}
            target="_blank"
            rel="noopener"
          >
            브런치북에서 읽기 ↗
          </a>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
