import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd, breadcrumb, faqSchema } from "@/components/seo/structured-data";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Rich } from "@/components/sns/rich";
import { POSTS, getPost } from "@/lib/blog";
import { ORG, SERVICE } from "@/lib/constants";

/**
 * /blog/[slug] — 본문.
 *
 * AEO 를 염두에 두고 짰다: 목차(h2)가 그대로 Article 의 구조가 되고, FAQ 는
 * 화면에도 실리고 FAQPage 스키마로도 나간다. 생성형 검색이 인용할 때
 * 화면에 없는 문장을 가져가는 일이 없도록 **둘을 같은 소스에서 렌더**한다.
 */
export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  return {
    title: { absolute: `${post.title} | 해그로시` },
    description: post.excerpt,
    keywords: [...post.keywords],
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url: `/blog/${post.slug}`,
      images: [post.cover.src],
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
    },
  };
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: [`${SERVICE.url}${post.cover.src}`],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    inLanguage: "ko-KR",
    keywords: post.keywords.join(", "),
    articleSection: post.category,
    mainEntityOfPage: `${SERVICE.url}/blog/${post.slug}`,
    author: { "@type": "Organization", name: ORG.name, url: SERVICE.url },
    publisher: { "@id": `${SERVICE.url}#organization` },
  };

  return (
    <>
      <JsonLd data={article} />
      <JsonLd data={faqSchema([...post.faq])} />
      <JsonLd
        data={breadcrumb([
          { name: "해그로시", path: "/" },
          { name: "블로그", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ])}
      />

      <SiteHeader tone="paper" cta={{ href: "/sns-brand#contact", label: "프로젝트 문의" }} />

      <main className="bg-paper px-5 pt-28 pb-20 sm:px-8 sm:pt-32 md:pb-28">
        <article className="mx-auto w-full max-w-3xl">
          <p className="eyebrow">{post.category}</p>
          <h1 className="mt-5 text-[1.75rem] leading-[1.35] font-bold sm:text-[2.375rem] sm:leading-[1.3]">
            {post.title}
          </h1>
          <p className="mt-5 text-xs text-muted">
            {post.publishedAt} · 읽는 데 {post.readingMinutes}분 · {ORG.name}
          </p>

          <figure className="mt-10">
            <div className="overflow-hidden rounded-2xl border border-line bg-paper-alt">
              <Image
                src={post.cover.src}
                alt={post.cover.alt}
                width={post.cover.width}
                height={post.cover.height}
                priority
                sizes="(min-width: 768px) 768px, 100vw"
                className="h-auto w-full"
              />
            </div>
          </figure>

          <div className="mt-10 space-y-5">
            {post.lead.map((para) => (
              <Rich
                key={para.slice(0, 14)}
                html={para}
                className="text-[1.0625rem] leading-[1.9] font-bold text-ink"
              />
            ))}
          </div>

          {/* 목차 — 스크롤이 긴 글에서 이탈을 줄이고, 검색엔진에 구조를 알린다 */}
          <nav
            aria-label="목차"
            className="mt-12 rounded-2xl border border-line bg-paper-alt p-6"
          >
            <p className="eyebrow">Contents</p>
            <ol className="mt-4 space-y-2.5">
              {post.sections.map((s, i) => (
                <li key={s.heading} className="flex gap-3 text-sm">
                  <span className="shrink-0 text-muted">{i + 1}</span>
                  <a
                    href={`#s${i + 1}`}
                    className="font-bold text-ink-soft hover:text-ink hover:underline hover:underline-offset-4"
                  >
                    {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {post.sections.map((section, i) => (
            <section key={section.heading} id={`s${i + 1}`} className="mt-16 scroll-mt-24">
              <h2 className="text-[1.375rem] leading-[1.4] font-bold sm:text-[1.625rem]">
                {section.heading}
              </h2>

              <div className="mt-6 space-y-5">
                {section.paragraphs.map((para) => (
                  <Rich
                    key={para.slice(0, 14)}
                    html={para}
                    className="text-[1rem] leading-[1.95] text-ink-soft"
                  />
                ))}
              </div>

              {section.figure && (
                <figure className="mt-8">
                  <div className="overflow-hidden rounded-xl border border-line bg-paper-alt">
                    <Image
                      src={section.figure.src}
                      alt={section.figure.caption}
                      width={section.figure.width}
                      height={section.figure.height}
                      sizes="(min-width: 768px) 768px, 100vw"
                      className="h-auto w-full"
                    />
                  </div>
                  <figcaption className="mt-3 text-xs leading-[1.7] text-muted">
                    {section.figure.caption}
                  </figcaption>
                </figure>
              )}

              {section.list && (
                <ol className="mt-8 space-y-4">
                  {section.list.map((item, k) => (
                    <li
                      key={item.title}
                      className="flex gap-4 rounded-xl border border-line bg-paper-alt p-5"
                    >
                      <span className="stat-figure grid size-7 shrink-0 place-items-center rounded-full bg-accent text-xs text-white">
                        {k + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[0.9375rem] font-bold text-ink">
                          {item.title}
                        </span>
                        <span className="mt-2 block text-sm leading-[1.85] text-muted">
                          {item.body}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          ))}

          {/* FAQ — 화면과 스키마가 같은 소스를 본다 */}
          <section className="mt-16">
            <h2 className="text-[1.375rem] leading-[1.4] font-bold sm:text-[1.625rem]">
              자주 묻는 질문
            </h2>
            <div className="mt-6 overflow-hidden rounded-2xl border border-line">
              {post.faq.map((f, i) => (
                <details key={f.q} className={i > 0 ? "border-t border-line" : undefined}>
                  <summary className="cursor-pointer list-none px-6 py-5 text-[0.9375rem] font-bold marker:hidden hover:bg-paper-alt">
                    {f.q}
                  </summary>
                  <p className="px-6 pb-6 text-sm leading-[1.85] text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <aside className="hero-night on-dark mt-16 rounded-2xl px-8 py-10 text-white sm:px-10">
            <p className="eyebrow">Contact</p>
            <p className="mt-4 text-[1.25rem] leading-[1.45] font-bold sm:text-2xl">
              {post.cta.title}
            </p>
            <p className="mt-4 text-sm leading-[1.85] text-white/65">{post.cta.body}</p>
            <Link
              href={post.cta.href}
              className="mt-7 inline-flex rounded-full bg-paper px-6 py-3.5 text-sm font-bold text-ink transition-colors hover:bg-paper/85"
            >
              {post.cta.label}
            </Link>
          </aside>

          <p className="mt-10 text-center text-sm">
            <Link href="/blog" className="text-muted hover:text-ink">
              ← 다른 글 보기
            </Link>
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
