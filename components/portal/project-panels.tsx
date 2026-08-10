"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";
import {
  requestRevision,
  saveGuideline,
  toggleCandidate,
  type ClientActionState,
} from "@/app/app/actions";

const INITIAL: ClientActionState = { ok: false, message: null };

const field =
  "mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm placeholder:text-muted/60 focus:border-ink focus:outline-none";

function Submit({ children, small }: { children: React.ReactNode; small?: boolean }) {
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
  tone: string | null;
  forbidden: string | null;
  reference_urls: string | null;
  extra: string | null;
  submitted_at: string | null;
} | null;

const GUIDE_FIELDS = [
  ["brand_intro", "브랜드 소개", "무엇을 파는 브랜드인지 두세 줄로 적어 주세요."],
  ["target", "핵심 타겟", "연령·성별·상황. 예) 30대 초반, 첫 자취를 시작한 직장인"],
  ["usp", "USP", "경쟁 제품과 갈리는 지점 한 가지만 꼽는다면?"],
  ["price_range", "가격대 · 객단가", "예) 3만원대 / 평균 객단가 5.2만원"],
  ["tone", "톤앤매너", "예) 담백하게, 과장 없이. 자막은 최소로"],
  ["forbidden", "금지 표현", "쓰면 안 되는 문구·비교 대상·규제 문구가 있다면"],
  ["reference_urls", "레퍼런스", "참고할 소재 링크를 줄바꿈으로 적어 주세요."],
  ["extra", "그 외", "일정, 이벤트, 꼭 들어가야 할 정보 등"],
] as const;

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
          <span className="text-base font-bold">컨텐츠 가이드라인</span>
          <span className="mt-1 block text-xs leading-[1.7] text-muted">
            기획 방향을 맞추는 자료입니다. 먼저 채워 주시면 그대로 기획에 들어갑니다.
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
  follower_count: number | null;
  content_count: number | null;
  avg_views: number | null;
  avg_comments: number | null;
  avg_likes: number | null;
  avg_cpv: number | null;
  selected: boolean;
  snapshot_at: string;
};

const num = (v: number | null) => (v == null ? "—" : v.toLocaleString("ko-KR"));

/** 1차 선정 심사 — 후보 채널 지표를 보고 고른다 */
export function CandidatePanel({
  projectId,
  candidates,
}: {
  projectId: string;
  candidates: Candidate[];
}) {
  const [state, formAction] = useActionState(toggleCandidate, INITIAL);
  const picked = candidates.filter((c) => c.selected).length;
  const snapshot = candidates[0]?.snapshot_at;

  return (
    <div className="rounded-2xl border border-line bg-paper p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-bold">
          1차 선정 심사 <span className="text-muted">{candidates.length}명</span>
        </h3>
        <p className="text-xs text-muted">
          선택 {picked}명
          {snapshot &&
            ` · ${new Date(snapshot).toLocaleDateString("ko-KR", {
              month: "2-digit",
              day: "2-digit",
            })} 기준`}
        </p>
      </div>
      <p className="mt-2 text-xs leading-[1.7] text-muted">
        함께 진행하고 싶은 채널을 골라 주세요. 고르신 채널을 기준으로 섭외를
        확정합니다.
      </p>

      <ul className="mt-5 space-y-2.5">
        {candidates.map((c) => (
          <li
            key={c.id}
            className={cn(
              "rounded-xl border p-4 transition-colors",
              c.selected ? "border-ink bg-accent/[0.05]" : "border-line",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <a
                  href={c.channel_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-bold underline underline-offset-2"
                >
                  {c.channel_name}
                </a>
                <span className="ml-2 rounded bg-paper-alt px-1.5 py-0.5 text-[0.625rem] text-muted">
                  {c.platform}
                </span>
              </div>
              <form action={formAction}>
                <input type="hidden" name="project_id" value={projectId} />
                <input type="hidden" name="candidate_id" value={c.id} />
                <Submit small>{c.selected ? "선택 해제" : "선택"}</Submit>
              </form>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs sm:grid-cols-3 lg:grid-cols-6">
              {(
                [
                  ["팔로워", c.follower_count],
                  ["컨텐츠수", c.content_count],
                  ["평균 조회", c.avg_views],
                  ["평균 좋아요", c.avg_likes],
                  ["평균 댓글", c.avg_comments],
                  ["평균 CPV", c.avg_cpv],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-muted">{label}</dt>
                  <dd className="stat-figure mt-0.5 text-sm">
                    {num(value)}
                    {label === "평균 CPV" && value != null && "원"}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <Result state={state} />
      </div>
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

const STATUS_LABEL: Record<string, string> = {
  producing: "제작중",
  preview: "확인 요청",
  revision: "수정 반영중",
  approved: "완료",
};

/** 숏폼 산출물 — 1차 미리보기 확인 → 수정 요청 → 최종 다운로드 */
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

            {d.revised && (
              <p className="mt-3 text-xs text-muted">
                수정 요청이 접수되었습니다. 반영 후 다시 올려드립니다.
              </p>
            )}
          </li>
        ))}
      </ul>
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

      <div className="mt-4">
        <Result state={state} />
      </div>
    </div>
  );
}
