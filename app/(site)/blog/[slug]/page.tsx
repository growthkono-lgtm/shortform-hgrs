import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd, breadcrumb } from "@/components/seo/structured-data";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EditorAvatar } from "@/components/blog/editor-avatar";
import { EmbedScripts } from "@/components/blog/embed-scripts";
import { ViewBeacon } from "@/components/blog/view-beacon";
import { faqPairs, getPost, listPosts, renderBody } from "@/lib/blog-posts";
import { BLOG_SPEC, editorFor, pillar } from "@/lib/blog-spec";
import { ORG, SERVICE } from "@/lib/constants";

/**
 * /blog/[slug] — 발행면.
 *
 * 이 페이지의 두 가지 일:
 *  1. 검증된 실물 자료를 **본문 안에서 재생**시킨다(`:::source N` → iframe).
 *     08-11 에 /blog 를 접은 이유가 AI 도판이었고, 그 자리를 실물이 대신한다.
 *  2. AEO — 질문형 H2 + 직답 문단 구조를 그대로 두고, FAQPage·Article 구조화
 *     데이터를 붙여 생성형 검색이 문단 단위로 인용할 수 있게 한다.
 */
export async function generateStaticParams() {
  const posts = await listPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(
  props: PageProps<"/blog/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getPost(slug);
  if (!post) return {};

  return {
    title: { absolute: `${post.title} | 해그로시` },
    description: post.lead.slice(0, 155),
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.lead.slice(0, 155),
      url: `/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = await getPost(slug);
  if (!post) notFound();

  const html = renderBody(post.body, post.sources);
  const faq = faqPairs(post.body);
  const editor = editorFor(post.slug);

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${SERVICE.url}/blog/${post.slug}#article`,
    headline: post.title,
    description: post.lead,
    inLanguage: "ko-KR",
    author: { "@id": `${SERVICE.url}#organization` },
    publisher: { "@id": `${SERVICE.url}#organization` },
    mainEntityOfPage: `${SERVICE.url}/blog/${post.slug}`,
    // 구글 Article 리치 결과는 발행일과 대표 이미지가 없으면 아예 안 잡힌다.
    // 이미지는 목록·공유가 쓰는 그 썸네일과 같은 것을 가리킨다
    ...(post.publishedAt
      ? { datePublished: post.publishedAt, dateModified: post.publishedAt }
      : {}),
    image: [`${SERVICE.url}/api/blog/thumbnail/${post.slug}`],

    /**
     * AEO — 이 글이 **무엇에 관한 글인지**를 기계에 명시한다. (2026-08-14)
     *
     * 08-14 실측에서 `about` 과 `keywords` 가 둘 다 null 이었다. 본문에 질문형
     * H2 와 직답 블록을 아무리 잘 깔아도, 생성형 검색은 "이 문서의 주제 엔티티"
     * 를 따로 읽는다. 그게 비면 인용 후보에 들어가도 **무슨 주제로 인용할지**를
     * 못 정한다.
     *
     * 값은 기획안이 정한 주 검색어와 연관 검색어다 — 지어내지 않는다.
     */
    ...(post.headKeyword
      ? {
          about: { "@type": "Thing", name: post.headKeyword },
          keywords: [post.headKeyword, ...post.subKeywords].join(", "),
        }
      : {}),
    articleSection: pillar(post.pillar).label,
    ...(post.chars ? { wordCount: post.chars } : {}),

    /**
     * 음성·요약 엔진이 통째로 읽어 가는 단위. 우리 규격에서 그 단위는
     * **H2 바로 아래 직답 문단**이라, 그 자리를 CSS 선택자로 지목한다.
     */
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".blog-body h2", ".blog-body h2 + p"],
    },

    // 본문이 실제로 인용한 출처. 생성형 검색이 근거를 따라갈 수 있게 남긴다
    citation: post.sources.map((s) => ({
      "@type": "CreativeWork",
      name: s.title,
      url: s.url,
      ...(s.author
        ? { author: { "@type": "Organization", name: s.author } }
        : {}),
    })),
  };

  const faqSchema =
    faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((pair) => ({
            "@type": "Question",
            name: pair.q,
            acceptedAnswer: { "@type": "Answer", text: pair.a },
          })),
        }
      : null;

  return (
    <>
      <JsonLd data={article} />
      {faqSchema ? <JsonLd data={faqSchema} /> : null}
      <JsonLd
        data={breadcrumb([
          { name: "홈", path: "" },
          {
            name: post.kind === "story" ? "고객 이야기" : "인사이트",
            path: "/blog",
          },
          { name: post.title, path: `/blog/${post.slug}` },
        ])}
      />
      <SiteHeader />

      <main className="mx-auto w-full max-w-[44rem] px-5 py-14 sm:px-8 md:py-20">
        <Link
          href="/blog"
          className="text-xs text-ink/45 underline-offset-4 hover:underline"
        >
          ← 인사이트
        </Link>

        <p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink/45">
          {post.seq !== null && (
            <span className="font-bold text-ink/70 tabular-nums">
              #{post.seq}
            </span>
          )}
          <span className="rounded bg-ink/[0.06] px-1.5 py-0.5 font-medium text-ink/70">
            {post.kind === "story" ? "고객 이야기" : pillar(post.pillar).label}
          </span>
          {post.client && (
            <span>
              {post.client.name} · {post.client.industry} · {post.client.period}
            </span>
          )}
        </p>

        <h1 className="mt-3 text-[1.6rem] leading-[1.3] font-bold tracking-[-0.03em] text-balance sm:text-[2.1rem]">
          {post.title}
        </h1>

        {/* 작성자 · 읽는 시간 — 왼쪽 / 발행일 — 오른쪽.
            에디터가 실제로 있는 것처럼 보이되 이름은 지어내지 않는다.
            역할과 아이콘 색만 슬러그로 고정 배정한다(blog-spec 의 EDITORS). */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-ink/10 pb-5">
          <div className="flex items-center gap-2.5">
            <EditorAvatar editorKey={editor.key} size={44} />
            <span className="text-xs leading-tight">
              <span className="block font-bold">{editor.name}</span>
              <span className="block text-ink/45">
                {editor.role} · 약 {post.readMinutes}분
              </span>
            </span>
          </div>
          {post.publishedAt && (
            <time
              dateTime={post.publishedAt}
              className="text-xs text-ink/45 tabular-nums"
            >
              {new Date(post.publishedAt).toLocaleDateString("ko-KR", {
                timeZone: "Asia/Seoul",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          )}
        </div>

        <article
          className="blog-body mt-10"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* CTA — 문구는 blog-spec 에 고정돼 있다. 본문이 아니라 페이지가 붙인다 */}
        <div className="mt-14 flex flex-col gap-3 border-t border-ink/10 pt-8 sm:flex-row">
          {BLOG_SPEC.cta.map((cta) => (
            <Link
              key={cta.href + cta.label}
              href={cta.href}
              className="flex-1 rounded-xl border border-ink/12 px-5 py-4 text-center text-sm font-medium transition-colors hover:bg-ink/[0.03]"
            >
              {cta.label}
            </Link>
          ))}
        </div>

        <p className="mt-8 text-xs leading-[1.8] text-ink/40">
          {post.kind === "story"
            ? "이 글의 수치는 해그로시가 해당 프로젝트에서 직접 집행한 결과입니다. 계약상 밝힐 수 없는 부분은 비워 두었습니다."
            : "이 글의 수치는 본문에 표시한 출처·연도·기준에 따릅니다. 확인하지 못한 수치는 싣지 않았습니다."}{" "}
          — {ORG.name}
        </p>
      </main>

      <SiteFooter />
      {/* 틱톡·인스타 blockquote 가 본문에 있을 때만 플랫폼 스크립트를 붙인다.
          dangerouslySetInnerHTML 로 들어간 <script> 는 실행되지 않기 때문이다 */}
      <EmbedScripts />
      <ViewBeacon slug={post.slug} />
    </>
  );
}
