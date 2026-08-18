import Link from "next/link";
import { notFound } from "next/navigation";

import { EmbedScripts } from "@/components/blog/embed-scripts";
import { getPost } from "@/lib/blog-admin";
import { renderBody } from "@/lib/blog-posts";
import { auditPost } from "@/lib/blog-audit";
import { format, pillar } from "@/lib/blog-spec";
import { PUBLISH_HOUR } from "@/lib/blog-schedule";
import {
  approvePost,
  rejectPost,
  saveBody,
  unapprovePost,
  unpublishPost,
} from "../actions";

/**
 * /admin/blog/[id] — 검수.
 *
 * 사장님이 여기서 하는 일은 셋뿐이다: 읽고 · 고치고 · 승인하거나 반려한다.
 * 그래서 화면도 셋으로만 나눈다. 규격 검사 결과를 본문 바로 위에 두는 이유는,
 * 무엇이 걸렸는지 모른 채 승인 버튼을 누르는 상황을 만들지 않기 위해서다.
 */
export const metadata = { title: "원고 검수" };

const STATUS_LABEL: Record<string, string> = {
  planned: "기획됨",
  drafted: "초안",
  review: "검수 대기",
  published: "발행됨",
  archived: "보관",
};

export default async function AdminBlogPostPage(
  props: PageProps<"/admin/blog/[id]">,
) {
  const { id } = await props.params;
  const post = await getPost(id);
  if (!post) notFound();

  const result = post.body
    ? auditPost({
        body: post.body,
        formatKey: post.format,
        sources: post.sources,
        title: post.title,
        slug: post.slug,
      })
    : null;

  const embeds = post.sources.filter((s) => s.embedHtml).length;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <Link
          href="/admin/blog"
          className="text-xs text-muted underline-offset-4 hover:underline"
        >
          ← 블로그
        </Link>
        <h1 className="mt-3 text-xl font-bold text-balance">{post.title}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted">
          <span className="rounded bg-ink/[0.06] px-1.5 py-0.5 font-medium text-ink">
            {STATUS_LABEL[post.status] ?? post.status}
          </span>
          <span>{pillar(post.pillar).label}</span>
          <span aria-hidden="true">·</span>
          <span>{format(post.format).label}</span>
          <span aria-hidden="true">·</span>
          <span>/blog/{post.slug}</span>
          {post.scheduledFor && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                {new Date(post.scheduledFor).toLocaleDateString("ko-KR", {
                  timeZone: "Asia/Seoul",
                  month: "long",
                  day: "numeric",
                  weekday: "short",
                })}{" "}
                자 원고
              </span>
            </>
          )}
        </p>
        {post.rejectNote && (
          <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-[1.7] text-amber-900">
            <b>수정요청</b> — {post.rejectNote}
          </p>
        )}
      </header>

      {/* ── 규격 검사 ── */}
      <section className="rounded-xl border border-line bg-paper p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-bold">규격 검사</h2>
          {result && (
            <span
              className={`rounded px-2 py-0.5 text-xs font-bold ${
                result.ok
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {result.ok ? "통과" : `미달 ${result.failures.length}건`}
            </span>
          )}
        </div>

        {result ? (
          <>
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted tabular-nums">
              <span>{result.chars}자</span>
              <span>질문형 H2 {result.questionH2}</span>
              <span>표 {result.tables}</span>
              <span>FAQ {result.faqCount}</span>
              <span>내부링크 {result.internalLinks}</span>
              <span>
                자료 {post.sources.length}건 (재생 {embeds})
              </span>
            </p>
            {result.findings.length > 0 && (
              <ul className="mt-3 flex flex-col gap-1.5 text-xs leading-[1.6]">
                {result.findings.map((x, i) => (
                  <li
                    key={i}
                    className={
                      x.level === "fail" ? "text-rose-700" : "text-amber-700"
                    }
                  >
                    {x.level === "fail" ? "✗" : "!"} {x.message}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="mt-3 text-sm text-muted">본문이 아직 없습니다.</p>
        )}
      </section>

      {/* ── 완성본 미리보기 ──────────────────────────────────────────────
          사장님 지적(2026-08-14): "미리보기는 실제 포스팅 예정인 완성본 글이어야
          하잖아. 본문과 이미지 자료가 분리된 게 아니라 실제 사람이 보게 될
          완벽한 포스팅을 내가 봐야 아 얘가 잘하고 있구나 하고 넘어가잖아."

          그래서 발행면과 **같은 함수·같은 클래스**로 그린다 —
          `renderBody` 가 `:::source N` 을 실제 임베드·출처 카드로 바꾸고,
          `blog-body` 가 발행면의 타이포그래피를 그대로 입힌다.
          여기서 보이는 것이 곧 독자가 보는 것이다 */}
      {post.body && (
        <section>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-bold">완성본 미리보기</h2>
            <span className="text-xs text-muted">
              독자가 보게 될 화면 그대로입니다
              {post.publishedAt && (
                <>
                  {" · "}
                  <Link
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    className="text-accent-deep underline-offset-2 hover:underline"
                  >
                    실제 페이지 열기 →
                  </Link>
                </>
              )}
            </span>
          </div>

          <div className="mt-3 rounded-xl border border-line bg-paper px-6 py-8 sm:px-10">
            <p className="text-xs text-muted">
              {pillar(post.pillar).label} · {format(post.format).label}
            </p>
            <h1 className="mt-3 text-2xl leading-[1.35] font-bold sm:text-3xl">
              {post.title}
            </h1>
            <article
              className="blog-body mt-8"
              dangerouslySetInnerHTML={{
                __html: renderBody(post.body, post.sources),
              }}
            />
          </div>
          {/* 발행면과 같은 화면을 보려면 임베드 스크립트도 같이 붙어야 한다 */}
          <EmbedScripts />
        </section>
      )}

      {/* ── 자료 ── */}
      {post.sources.length > 0 && (
        <section>
          <h2 className="text-sm font-bold">
            검증된 자료 {post.sources.length}건
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {post.sources.map((s, i) => (
              <li
                key={s.url + i}
                className="rounded-lg border border-line bg-paper px-3 py-2.5 text-xs leading-[1.6]"
              >
                <span className="font-bold text-accent-deep">[{i + 1}]</span>{" "}
                <span className="rounded bg-ink/[0.05] px-1 text-[0.6875rem] text-muted">
                  {s.embedHtml ? "재생" : "링크"}
                </span>{" "}
                {s.author && <b>{s.author} · </b>}
                {s.title} <span className="text-muted">({s.year})</span>
                <span className="mt-0.5 block text-muted">{s.basis}</span>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener"
                  className="text-accent-deep underline-offset-2 hover:underline"
                >
                  {s.url}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── 본문 수정 ── */}
      <section>
        <h2 className="text-sm font-bold">본문</h2>
        <form action={saveBody} className="mt-3 flex flex-col gap-3">
          <input type="hidden" name="id" value={post.id} />
          <textarea
            name="body"
            defaultValue={post.body ?? ""}
            rows={28}
            spellCheck={false}
            className="w-full rounded-xl border border-line bg-paper p-4 font-mono text-xs leading-[1.75] focus:border-ink focus:outline-none"
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded-full border border-ink/20 px-5 py-2 text-sm font-bold hover:border-ink"
            >
              저장하고 다시 검사
            </button>
            <span className="text-xs text-muted">
              저장할 때마다 규격 검사가 다시 돕니다
            </span>
          </div>
        </form>
      </section>

      {/* ── 승인 · 반려 ── */}
      <section className="rounded-xl border border-line bg-paper-alt p-5">
        <h2 className="text-sm font-bold">발행</h2>

        {post.status === "published" ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted">
              발행됨
              {post.publishedAt &&
                ` · ${new Date(post.publishedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}`}
            </p>
            <Link
              href={`/blog/${post.slug}`}
              target="_blank"
              className="text-sm underline underline-offset-4"
            >
              발행면 보기 ↗
            </Link>
            <form action={unpublishPost}>
              <input type="hidden" name="id" value={post.id} />
              <button
                type="submit"
                className="rounded-full border border-ink/20 px-4 py-1.5 text-xs hover:border-ink"
              >
                내리기
              </button>
            </form>
          </div>
        ) : post.approvedAt ? (
          /* 승인은 끝났고 예약 시각을 기다리는 중 */
          <div className="mt-3 flex flex-col gap-3">
            <p className="text-sm leading-[1.7]">
              <b className="text-accent-deep">발행 대기</b> — 승인하셨습니다.
              {post.scheduledFor && (
                <>
                  {" "}
                  {new Date(post.scheduledFor).toLocaleDateString("ko-KR", {
                    timeZone: "Asia/Seoul",
                    month: "long",
                    day: "numeric",
                    weekday: "short",
                  })}{" "}
                  저녁 {PUBLISH_HOUR}시에 나갑니다.
                </>
              )}
            </p>
            <form action={unapprovePost}>
              <input type="hidden" name="id" value={post.id} />
              <button
                type="submit"
                className="rounded-full border border-ink/20 px-4 py-1.5 text-xs hover:border-ink"
              >
                승인 취소
              </button>
            </form>
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-4">
            <form action={approvePost}>
              <input type="hidden" name="id" value={post.id} />
              <button
                type="submit"
                disabled={!result?.ok}
                className="rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-paper disabled:cursor-not-allowed disabled:opacity-40"
              >
                발행하기
              </button>
              {!result?.ok && (
                <span className="ml-3 text-xs text-muted">
                  규격 미달 항목을 먼저 고쳐 주세요
                </span>
              )}
            </form>

            <form action={rejectPost} className="flex flex-wrap gap-2">
              <input type="hidden" name="id" value={post.id} />
              <input
                name="note"
                placeholder="수정요청 — 어디를 어떻게 고칠지 적어 주세요"
                className="min-w-0 flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-sm focus:border-ink focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-full border border-ink/20 px-4 py-2 text-sm hover:border-ink"
              >
                수정요청
              </button>
            </form>
          </div>
        )}

        <p className="mt-4 text-xs leading-[1.7] text-muted/70">
          검수 요청 메일이 발행일 당일 오후 3시에 ceo@h-grs.com 으로 갑니다.
          여기서 <b>발행하기</b>를 누르시면 승인만 되고, 실제 발행은{" "}
          <b>예약 발행일 저녁 {PUBLISH_HOUR}시</b>입니다. 자동 발행은 없습니다 —
          며칠이 지나도 발행하기를 누르시기 전에는 나가지 않습니다.
        </p>
      </section>
    </div>
  );
}
