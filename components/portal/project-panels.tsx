"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";
import { handleFromUrl, toPostThumbs } from "@/lib/influencer";
import {
  approveContent,
  confirmDeliverable,
  markShipped,
  requestRevision,
  saveClientNote,
  saveGuideline,
  type ClientActionState,
} from "@/app/app/actions";

const INITIAL: ClientActionState = { ok: false, message: null };

const field =
  "mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm placeholder:text-muted/60 focus:border-ink focus:outline-none";

function Submit({
  children,
  small,
}: {
  children: React.ReactNode;
  small?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "rounded-full bg-ink font-bold text-paper transition-colors hover:bg-ink-soft disabled:opacity-50",
        small ? "px-4 py-2 text-xs" : "px-6 py-3 text-sm",
      )}
    >
      {pending ? "처리 중…" : children}
    </button>
  );
}

function Result({ state }: { state: ClientActionState }) {
  if (!state.message) return null;
  return (
    <p
      className={cn(
        "text-xs leading-[1.7]",
        state.ok ? "text-accent-deep" : "text-red-600",
      )}
    >
      {state.message}
    </p>
  );
}

export type Guideline = {
  brand_intro: string | null;
  target: string | null;
  usp: string | null;
  price_range: string | null;
  promotion: string | null;
  tone: string | null;
  forbidden: string | null;
  reference_urls: string | null;
  extra: string | null;
  submitted_at: string | null;
} | null;

const GUIDE_FIELDS = [
  [
    "brand_intro",
    "브랜드 · 제품 소개",
    "무엇을 파는 브랜드인지, 이번에 밀 제품이 무엇인지 적어 주세요.",
  ],
  [
    "reference_urls",
    "판매 링크 (필수)",
    "제품 상세페이지 주소. 여러 개면 줄바꿈으로.",
  ],
  [
    "target",
    "핵심 타겟",
    "연령·성별·상황. 예) 30대 초반, 첫 자취를 시작한 직장인",
  ],
  ["usp", "USP", "경쟁 제품과 갈리는 지점 한 가지만 꼽는다면?"],
  [
    "price_range",
    "가격 · 옵션 · 수량 (필수)",
    "예) 3만원대 / 옵션: 30정·60정 / 이번 시딩 수량 20개",
  ],
  [
    "promotion",
    "진행 중인 프로모션 (필수)",
    "예) 8월 한정 1+1, 첫 구매 3천원 쿠폰, 무료배송 3만원 이상. 없으면 '없음'이라고 적어 주세요.",
  ],
  ["tone", "톤앤매너", "예) 담백하게, 과장 없이. 자막은 최소로"],
  ["forbidden", "금지 표현", "쓰면 안 되는 문구·비교 대상·규제 문구가 있다면"],
  ["extra", "그 외", "일정, 이벤트, 꼭 들어가야 할 정보 등"],
] as const;

/** 비면 제작이 시작될 수 없는 칸. 화면에도 "필수" 로 적혀 있다 */
const REQUIRED_FIELDS = ["reference_urls", "price_range", "promotion"] as const;

/** 컨텐츠 가이드라인 — 플랜 적용 직후 첫 할 일 */
export function GuidelinePanel({
  projectId,
  guideline,
}: {
  projectId: string;
  guideline: Guideline;
}) {
  const [state, formAction] = useActionState(saveGuideline, INITIAL);
  const submitted = Boolean(guideline?.submitted_at);

  return (
    <details
      open={!submitted}
      className="rounded-2xl border border-line bg-paper"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-6">
        <span>
          <span className="text-base font-bold">브랜드 · 제품 정보</span>
          <span className="mt-1 block text-xs leading-[1.7] text-muted">
            <strong>
              판매 링크 · 가격 · 옵션 · 프로모션은 반드시 넣어 주세요.
            </strong>{" "}
            저장하시면 <strong>담당 제작자 화면에 그대로 전달</strong>됩니다.
          </span>
        </span>
        <span
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold",
            submitted ? "bg-paper-alt text-muted" : "bg-accent text-white",
          )}
        >
          {submitted ? "작성 완료" : "작성 필요"}
        </span>
      </summary>

      <form action={formAction} className="space-y-5 border-t border-line p-6">
        <input type="hidden" name="project_id" value={projectId} />
        {GUIDE_FIELDS.map(([name, label, placeholder]) => (
          <div key={name}>
            <label htmlFor={name} className="block text-sm font-bold">
              {label}
            </label>
            <textarea
              id={name}
              name={name}
              rows={name === "brand_intro" || name === "extra" ? 3 : 2}
              defaultValue={guideline?.[name] ?? ""}
              placeholder={placeholder}
              className={field}
            />
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-4">
          <Submit>가이드라인 저장</Submit>
          <Result state={state} />
        </div>
      </form>
    </details>
  );
}

export type Candidate = {
  id: string;
  channel_name: string;
  channel_url: string;
  platform: string;
  thumbnail_url: string | null;
  follower_count: number | null;
  content_count: number | null;
  avg_views: number | null;
  avg_comments: number | null;
  avg_likes: number | null;
  bio: string | null;
  category: string | null;
  latest_posts: unknown;
  snapshot_at: string;
};

const num = (v: number | null) => (v == null ? "—" : v.toLocaleString("ko-KR"));

/**
 * 확정 인플루언서 — 카드 한 장에 프로필·최근 게시물·지표.
 *
 * 고르는 화면이 아니다. **선정은 우리가 끝내고**, 클라이언트는 누가 확정됐는지 본다.
 * 그래서 선택 버튼도 거절 카운트도 없다.
 *
 * ⚠️ 리워드·CPV 는 여기 넣지 않는다. 인플루언서 단가가 보이면 패키지 금액에서
 * 우리 마진이 그대로 역산된다. 그 둘은 어드민 화면에만 있다.
 */
export function CandidatePanel({ candidates }: { candidates: Candidate[] }) {
  const snapshot = candidates[0]?.snapshot_at;

  return (
    <div className="rounded-2xl border border-line bg-paper p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-bold">
          확정 인플루언서{" "}
          <span className="text-muted">{candidates.length}명</span>
        </h3>
        {snapshot && (
          <p className="text-xs text-muted">
            {new Date(snapshot).toLocaleDateString("ko-KR", {
              timeZone: "Asia/Seoul",
              month: "2-digit",
              day: "2-digit",
            })}{" "}
            기준
          </p>
        )}
      </div>

      <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {candidates.map((c) => {
          const posts = toPostThumbs(c.latest_posts);
          const handle = handleFromUrl(c.channel_url);

          return (
            <li
              key={c.id}
              className="flex flex-col overflow-hidden rounded-xl border border-line"
            >
              <div className="flex items-center gap-2.5 p-4">
                {c.thumbnail_url ? (
                  // 벤더가 준 이미지 — next/image 로 돌리면 외부 도메인 설정이 필요하다
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.thumbnail_url}
                    alt=""
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="size-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="size-10 shrink-0 rounded-full bg-paper-alt" />
                )}
                <span className="min-w-0">
                  {c.category && (
                    <span className="mb-1 inline-block rounded-md bg-gold/15 px-2 py-0.5 text-[0.625rem] font-bold text-gold-deep">
                      {c.category}
                    </span>
                  )}
                  <a
                    href={c.channel_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-sm font-bold underline underline-offset-2"
                  >
                    {handle ? `@${handle}` : c.channel_name}
                  </a>
                </span>
              </div>

              {posts.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-0.5 px-4">
                  {posts.map((p) => (
                    <a
                      key={p.url}
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.thumbnail}
                        alt=""
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="aspect-square w-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              )}

              <dl className="mt-3 space-y-1.5 border-t border-line p-4 text-xs">
                {(
                  [
                    ["팔로워 수", c.follower_count],
                    ["평균 조회 수", c.avg_views],
                    ["평균 좋아요 수", c.avg_likes],
                    ["평균 댓글 수", c.avg_comments],
                    ["게시물 수", c.content_count],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-2">
                    <dt className="text-muted">{label}</dt>
                    <dd className="font-bold">{num(value)}</dd>
                  </div>
                ))}
              </dl>

              {c.bio && (
                <p className="line-clamp-3 border-t border-line p-4 text-xs leading-[1.7] whitespace-pre-wrap text-muted">
                  {c.bio}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export type Deliverable = {
  id: string;
  seq: number;
  title: string | null;
  preview_url: string | null;
  status: string;
  revised: boolean;
};

/** 편 상태 라벨 — 클라이언트가 보는 말이다 (lib/work.ts 의 client 라벨과 짝을 이룬다) */
const STATUS_LABEL: Record<string, string> = {
  producing: "제작중",
  preview: "컨펌 확인",
  revision: "수정 반영중",
  approved: "완료",
};

/** 숏폼 산출물 — 1차 완성본 확인 → 수정 요청 또는 확인 완료 → 최종 다운로드 */
export function DeliverablePanel({
  projectId,
  deliverables,
  finalDriveLink,
}: {
  projectId: string;
  deliverables: Deliverable[];
  /** 최종본은 편마다 주지 않는다 — 프로젝트 폴더 하나로 통째로 넘긴다 */
  finalDriveLink: string | null;
}) {
  const [state, formAction] = useActionState(requestRevision, INITIAL);
  const [confirmState, confirmAction] = useActionState(
    confirmDeliverable,
    INITIAL,
  );

  return (
    <div className="rounded-2xl border border-line bg-paper p-6">
      <h3 className="text-base font-bold">숏폼 산출물</h3>
      <p className="mt-2 text-xs leading-[1.7] text-muted">
        1차 완성본이 올라오면 여기서 바로 보시고 수정 요청을 남기실 수 있습니다.
        무상 수정은 편당 1회입니다.
      </p>

      <ul className="mt-5 space-y-4">
        {deliverables.map((d) => (
          <li key={d.id} className="rounded-xl border border-line p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-bold">
                {d.seq}편{d.title && ` · ${d.title}`}
              </span>
              <span className="rounded-full bg-paper-alt px-3 py-1 text-xs font-bold">
                {STATUS_LABEL[d.status] ?? d.status}
              </span>
            </div>

            {d.preview_url && (
              <div className="mt-4 aspect-video w-full overflow-hidden rounded-lg bg-ink-soft">
                <iframe
                  src={d.preview_url}
                  title={`${d.seq}편 미리보기`}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  className="size-full"
                />
              </div>
            )}

            {d.preview_url && !d.revised && d.status !== "approved" && (
              <form action={formAction} className="mt-4 space-y-3">
                <input type="hidden" name="project_id" value={projectId} />
                <input type="hidden" name="deliverable_id" value={d.id} />
                <textarea
                  name="message"
                  rows={3}
                  required
                  placeholder="수정이 필요한 부분을 구체적으로 적어 주세요. (무상 1회)"
                  className={field}
                />
                <Submit small>수정 요청 보내기</Submit>
              </form>
            )}

            {/* 확인 완료 — 이 버튼이 마지막 단계를 연다.
                제작자는 여기까지만 밀 수 있고, 그 다음은 클라이언트가 연다 */}
            {d.preview_url && d.status !== "approved" && (
              <form action={confirmAction} className="mt-3">
                <input type="hidden" name="project_id" value={projectId} />
                <input type="hidden" name="deliverable_id" value={d.id} />
                <Submit small>이대로 확인 완료</Submit>
              </form>
            )}

            {d.revised && (
              <p className="mt-3 text-xs text-muted">
                수정 요청이 접수되었습니다. 반영 후 다시 올려드립니다.
              </p>
            )}
          </li>
        ))}
      </ul>
      {/* 최종본은 편마다가 아니라 프로젝트 폴더 하나로 넘긴다 */}
      {finalDriveLink && (
        <a
          href={finalDriveLink}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex rounded-full bg-ink px-6 py-3 text-sm font-bold text-paper transition-colors hover:bg-ink-soft"
        >
          최종본 전체 다운로드
        </a>
      )}

      <div className="mt-4 space-y-1">
        <Result state={state} />
        <Result state={confirmState} />
      </div>
    </div>
  );
}

/** 미팅 코멘트 — 담당 제작자에게 그대로 전달된다 */
export function ClientNotePanel({
  projectId,
  note,
}: {
  projectId: string;
  note: string | null;
}) {
  const [state, formAction] = useActionState(saveClientNote, INITIAL);

  return (
    <details className="rounded-2xl border border-line bg-paper" open={!note}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-6">
        <span>
          <span className="text-base font-bold">제작팀에 전달할 내용</span>
          <span className="mt-1 block text-xs leading-[1.7] text-muted">
            꼭 담겨야 할 메시지·피하고 싶은 표현·레퍼런스. 담당 제작자 화면에
            그대로 표시됩니다.
          </span>
        </span>
        <span
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold",
            note ? "bg-paper-alt text-muted" : "bg-accent text-white",
          )}
        >
          {note ? "전달됨" : "작성"}
        </span>
      </summary>
      <form action={formAction} className="space-y-3 border-t border-line p-6">
        <input type="hidden" name="project_id" value={projectId} />
        <textarea
          name="client_note"
          rows={5}
          defaultValue={note ?? ""}
          placeholder="예) 수의사 멘트는 꼭 넣어 주세요. 경쟁사 직접 비교는 피해 주세요."
          className={field}
        />
        <Submit small>전달하기</Submit>
        <Result state={state} />
      </form>
    </details>
  );
}

export type Shipment = {
  id: string;
  influencer_name: string;
  product: string | null;
  quantity: string | null;
  option: string | null;
  address: string | null;
  phone: string | null;
  note: string | null;
  shipped_at: string | null;
};

/**
 * 배송 리스트 — 해그로시가 채우고, 브랜드가 행마다 [발송완료]를 누른다.
 *
 * 누르지 않으면 며칠 뒤 리마인드 메일이 자동으로 나간다. 이 단계가 막히면
 * 소스컷이 안 나오고 제작이 통째로 밀리기 때문이다.
 */
export function ShipmentPanel({
  projectId,
  shipments,
}: {
  projectId: string;
  shipments: Shipment[];
}) {
  const [state, formAction] = useActionState(markShipped, INITIAL);
  const remaining = shipments.filter((s) => !s.shipped_at).length;

  return (
    <details
      className="rounded-2xl border border-line bg-paper"
      open={remaining > 0}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-6">
        <span>
          <span className="text-base font-bold">제품 · 서비스 배송</span>
          <span className="mt-1 block text-xs leading-[1.7] text-muted">
            발송하신 뒤 행마다 <strong>발송완료</strong>를 눌러 주세요.
          </span>
        </span>
        <span
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold",
            remaining > 0 ? "bg-accent text-white" : "bg-paper-alt text-muted",
          )}
        >
          {remaining > 0 ? `${remaining}건 대기` : "완료"}
        </span>
      </summary>

      <ul className="space-y-3 border-t border-line p-6">
        {shipments.map((s) => (
          <li key={s.id} className="rounded-xl border border-line p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 text-sm">
                <p className="font-bold">{s.influencer_name}</p>
                <p className="mt-1 text-xs text-muted">
                  {[s.product, s.quantity, s.option]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="mt-1 text-xs break-all text-muted">
                  {[s.address, s.phone].filter(Boolean).join(" · ")}
                </p>
                {s.note && <p className="mt-1 text-xs text-muted">{s.note}</p>}
              </div>

              {s.shipped_at ? (
                <span className="shrink-0 rounded-full bg-accent px-3 py-1 text-xs font-bold text-white">
                  발송완료
                </span>
              ) : (
                <form action={formAction} className="shrink-0">
                  <input type="hidden" name="project_id" value={projectId} />
                  <input type="hidden" name="shipment_id" value={s.id} />
                  <Submit small>발송완료</Submit>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="px-6 pb-6">
        <Result state={state} />
      </div>
    </details>
  );
}

export type InfluencerContent = {
  id: string;
  handle: string;
  permalink: string;
  thumbnail_url: string | null;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  posted_at: string | null;
  review_status: string;
  revision_note: string | null;
};

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })
    : "—";

const compact = (v: number | null) => {
  if (v == null) return "—";
  if (v >= 10000) return `${(v / 10000).toFixed(1).replace(/\.0$/, "")}만`;
  if (v >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, "")}천`;
  return String(v);
};

/**
 * 콘텐츠 검수 — 인플루언서가 올린 게시물을 확인하고, 고칠 게 있으면 적어 보낸다.
 *
 * 게시물 자체는 인스타에 있다. 우리 화면은 **무엇이 올라왔고 어디까지 확인했는지**만 들고 있고,
 * 실물은 클릭해서 인스타에서 본다 — 우리가 원본을 복제해 들고 있을 이유가 없다.
 */
export function ContentReviewPanel({
  projectId,
  contents,
}: {
  projectId: string;
  contents: InfluencerContent[];
}) {
  const [state, formAction] = useActionState(approveContent, INITIAL);
  const pending = contents.filter((c) => c.review_status === "pending").length;

  return (
    <details
      className="rounded-2xl border border-line bg-paper"
      open={pending > 0}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-6">
        <span>
          <span className="text-base font-bold">콘텐츠 검수</span>
          <span className="mt-1 block text-xs leading-[1.7] text-muted">
            올라온 게시물을 확인하시고, 고칠 곳이 있으면 적어 주세요.
          </span>
        </span>
        <span
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold",
            pending > 0 ? "bg-accent text-white" : "bg-paper-alt text-muted",
          )}
        >
          {pending > 0 ? `${pending}건 확인 대기` : "검수 완료"}
        </span>
      </summary>

      <ul className="divide-y divide-line border-t border-line">
        {contents.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-4 p-4">
            <a
              href={c.permalink}
              target="_blank"
              rel="noreferrer"
              className="shrink-0"
            >
              {c.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.thumbnail_url}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="size-14 rounded-lg object-cover"
                />
              ) : (
                <span className="block size-14 rounded-lg bg-paper-alt" />
              )}
            </a>

            <span className="min-w-0 flex-1 text-xs">
              <a
                href={c.permalink}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-bold underline underline-offset-2"
              >
                @{c.handle}
              </a>
              <span className="mt-1 block text-muted">
                조회 {compact(c.view_count)} · 좋아요 {compact(c.like_count)} ·
                댓글 {compact(c.comment_count)} · {fmtDate(c.posted_at)}
              </span>
              {c.revision_note && (
                <span className="mt-1 block text-amber-700">
                  수정 요청: {c.revision_note}
                </span>
              )}
            </span>

            {c.review_status === "approved" ? (
              <span className="shrink-0 rounded-full bg-paper-alt px-3 py-1 text-xs font-bold text-muted">
                검수 완료
              </span>
            ) : (
              <form
                action={formAction}
                className="flex shrink-0 items-center gap-2"
              >
                <input type="hidden" name="project_id" value={projectId} />
                <input type="hidden" name="content_id" value={c.id} />
                <input
                  name="revision_note"
                  placeholder="수정 요청 (선택)"
                  className="w-40 rounded-lg border border-line px-3 py-2 text-xs"
                />
                <Submit small>확인</Submit>
              </form>
            )}
          </li>
        ))}
      </ul>

      <div className="px-6 pb-6">
        <Result state={state} />
      </div>
    </details>
  );
}

/** 콘텐츠 모아보기 — 올라온 게시물 전부를 한 판에. 누르면 인스타로 간다 */
export function ContentGallery({
  contents,
}: {
  contents: InfluencerContent[];
}) {
  if (contents.length === 0) return null;

  return (
    <div className="rounded-2xl border border-line bg-paper p-6">
      <h3 className="text-base font-bold">
        콘텐츠 모아보기 <span className="text-muted">{contents.length}건</span>
      </h3>

      <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {contents.map((c) => (
          <li key={c.id}>
            <a
              href={c.permalink}
              target="_blank"
              rel="noreferrer"
              className="block"
            >
              {c.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.thumbnail_url}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="aspect-square w-full rounded-lg object-cover"
                />
              ) : (
                <span className="block aspect-square w-full rounded-lg bg-paper-alt" />
              )}
              <span className="mt-2 flex flex-wrap items-center gap-x-2 text-[0.6875rem] text-muted">
                <span>조회 {compact(c.view_count)}</span>
                <span>♡ {compact(c.like_count)}</span>
                <span>댓글 {compact(c.comment_count)}</span>
                <span className="ml-auto">{fmtDate(c.posted_at)}</span>
              </span>
              <span className="mt-1 block truncate text-xs font-bold">
                @{c.handle}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
