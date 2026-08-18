import Link from "next/link";
import { notFound } from "next/navigation";
import { requireWorker } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { WorkForm } from "@/components/work/work-form";
import { Uploader } from "@/components/work/uploader";
import {
  addWorkNote,
  advanceWork,
  saveWorkDraftPlain,
} from "@/app/work/actions";
import {
  NEEDS_WORK_URL,
  WORKER_ACTION_LABEL,
  WORKER_GUIDE,
  WORKER_TRANSITIONS,
  daysLeft,
  workerLabel,
} from "@/lib/work";
import { WORKER_STEPS, sourcesDelivered } from "@/lib/process";

const field =
  "w-full rounded-lg border border-line bg-paper px-4 py-3 text-sm placeholder:text-muted/70 focus:border-ink focus:outline-none";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * 공정이 한눈에 보여야 한다.
 *
 * **시딩 구간까지 같이 보여 준다** — 시딩이 포함된 플랜이면 작업자도 "아직 소스가 안 나왔구나,
 * 나는 대기구나"를 이 줄만 보고 알 수 있어야 한다. 클라이언트 화면과 같은 배열을 쓴다.
 */
function Stepper({ current }: { current: string }) {
  const now = WORKER_STEPS.findIndex((s) => s.key === current);
  return (
    <ol className="mt-5 grid grid-cols-2 gap-1 sm:grid-cols-6">
      {WORKER_STEPS.map((s, i) => (
        <li
          key={s.key}
          className={[
            "rounded-md px-2 py-2 text-center text-[0.6875rem] leading-tight",
            i < now && "bg-line text-muted",
            i === now && "bg-ink font-bold text-white",
            i > now && "border border-line text-muted/70",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <span className="block font-mono text-[0.625rem] opacity-60">
            {i + 1}
          </span>
          {s.label}
        </li>
      ))}
    </ol>
  );
}

/**
 * 작업 상세 — 한 편.
 *
 * 순서가 곧 공정이다. 위에서 아래로 읽으면 할 일이 끝난다:
 *   브랜드 정보(담당자) → 클라이언트 코멘트 → 소스 → 제작·제출
 *
 * ⚠️ 가리는 것은 **돈뿐**이다 (2026-08-14 오후 사장님 지시로 정리):
 *  1) 브랜드명·제품 정보는 보여 준다. **plans/orders 는 조인하지 않는다** —
 *     플랜 금액이 붙는 순간 작업자가 우리 마진을 역산한다. 그게 유일한 금지선이다
 *  2) 클라이언트가 채운 `project_guidelines` 를 **그대로** 읽는다.
 *     08-14 오전까지는 어드민이 `work_briefs.manual_note` 에 손으로 옮겨 적어야
 *     작업자에게 보였고, 실제로 그 칸이 나흘째 비어 있었다. 옮겨 적는 사람이
 *     한 명 끼면 그 사람이 병목이 된다
 *  3) 수정 요청은 message 만. 누가 요청했는지는 가져오지 않는다
 */
/**
 * 탭 제목을 페이지가 직접 정한다. (2026-08-14 QA)
 *
 * 안 정해 두면 루트 레이아웃의 title.template 이 붙어 탭에 **"| 해그로시"**
 * 가 찍힌다 — 라이브에서 실제로 그렇게 나왔다. 작업자 표면에 회사 이름이
 * 드러나는 자리는 본문만이 아니다.
 */
export const metadata = { title: "작업" };

/**
 * 작업자에게 보여 줄 칸과 순서. 클라이언트가 채운 순서와 같게 둔다 —
 * 두 화면이 다른 순서로 보이면 "그 칸 어디 있냐" 는 문답이 생긴다.
 *
 * ⚠️ 여기에 플랜·금액 관련 필드를 절대 추가하지 않는다.
 */
const GUIDE_ROWS = [
  ["brand_intro", "브랜드 · 제품 소개"],
  ["reference_urls", "판매 링크"],
  ["price_range", "가격 · 옵션 · 수량"],
  ["promotion", "진행 중인 프로모션"],
  ["target", "핵심 타겟"],
  ["usp", "USP"],
  ["tone", "톤앤매너"],
  ["forbidden", "금지 표현"],
  ["extra", "그 외 · 요청사항"],
] as const;

export default async function WorkDetailPage({
  params,
}: PageProps<"/work/[id]">) {
  const worker = await requireWorker();
  const { id } = await params;
  const admin = createAdminClient();

  const { data: item } = await admin
    .from("deliverables")
    .select(
      // 브랜드명은 보여 준다(2026-08-14 오후 지시). 가리는 것은 플랜 가격뿐이다
      "id, seq, title, work_status, plan_note, work_url, work_file_name, due_date, project_id, projects(work_code, work_alias, type, stage_a, profiles(company_name))",
    )
    .eq("id", id)
    .eq("assignee_id", worker.id)
    .maybeSingle();
  if (!item) notFound();

  const [
    { data: guide },
    { data: sources },
    { data: revisions },
    { data: notes },
    { data: brief },
  ] = await Promise.all([
    admin
      .from("project_guidelines")
      .select(
        "brand_intro, reference_urls, target, usp, price_range, promotion, tone, forbidden, extra, submitted_at",
      )
      .eq("project_id", item.project_id)
      .maybeSingle(),
    admin
      .from("drive_grants")
      .select("label, drive_link, kind")
      .eq("project_id", item.project_id),
    admin
      .from("revision_requests")
      .select("message, round, created_at")
      .eq("deliverable_id", id)
      .order("round"),
    admin
      .from("work_notes")
      .select("id, author_role, body, created_at")
      .eq("deliverable_id", id)
      .order("created_at"),
    // 담당자가 따로 일러 둘 게 있을 때만 채우는 칸. 제품 정보의 출처는
    // 위의 project_guidelines 이고, 이건 그 위에 얹는 메모다
    admin
      .from("work_briefs")
      .select("manual_note")
      .eq("project_id", item.project_id)
      .maybeSingle(),
  ]);

  const status = item.work_status;
  // 소스가 전달되기 전에는 작업자가 할 게 없다. 스텝퍼도 첫 칸(대기)에 머문다
  const delivered = sourcesDelivered(item.projects?.stage_a);
  const step = delivered ? status : "waiting";
  const next = delivered ? WORKER_TRANSITIONS[status] : undefined;
  const left = daysLeft(item.due_date);

  return (
    <>
      <Link href="/work" className="text-sm text-muted hover:text-ink">
        ← 내 작업
      </Link>

      <div className="mt-5 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold">
          <span className="mr-2 rounded-md bg-gold/15 px-2.5 py-1 align-middle text-sm font-bold text-gold-deep">
            {item.projects?.work_alias || item.projects?.profiles?.company_name}
          </span>
          {item.seq}편{item.title ? ` · ${item.title}` : ""}
        </h1>
        {left !== null && (
          <p
            className={
              left < 0 ? "text-sm font-bold text-red-600" : "text-sm text-muted"
            }
          >
            마감 {item.due_date} ({left < 0 ? `D+${-left}` : `D-${left}`})
          </p>
        )}
      </div>

      <Stepper current={step} />

      <p className="mt-4 rounded-xl border border-accent/25 bg-accent/[0.07] px-4 py-3.5 text-sm leading-[1.7] text-accent-deep">
        {WORKER_GUIDE[step]}
      </p>

      {/* ── 1. 브랜드가 직접 채운 제품 정보 ── 이게 작업의 출발점이다.
             클라이언트 화면의 [브랜드 · 제품 정보] 와 같은 표를 읽는다 */}
      <section className="mt-6 rounded-2xl border border-line bg-paper p-5 sm:p-6">
        <h2 className="text-sm font-bold">브랜드 · 제품 정보</h2>

        {guide?.submitted_at ? (
          <dl className="mt-4 space-y-4">
            {GUIDE_ROWS.map(([key, label]) => {
              const value = guide[key];
              if (!value) return null;
              return (
                <div key={key}>
                  <dt className="text-xs font-bold text-muted">{label}</dt>
                  <dd className="mt-1 text-sm leading-[1.9] whitespace-pre-wrap">
                    {value}
                  </dd>
                </div>
              );
            })}
          </dl>
        ) : (
          <p className="mt-3 text-sm text-muted">
            브랜드가 아직 제품 정보를 등록하지 않았습니다. 등록되면 이 자리에
            표시됩니다.
          </p>
        )}

        {brief?.manual_note && (
          <div className="mt-5 rounded-lg bg-paper-alt p-4">
            <h3 className="text-xs font-bold text-muted">담당자 메모</h3>
            <p className="mt-2 text-sm leading-[1.9] whitespace-pre-wrap">
              {brief.manual_note}
            </p>
          </div>
        )}
      </section>

      {/* ── 2. 소스 ── */}
      {sources && sources.length > 0 && (
        <section className="mt-6 rounded-2xl border border-line bg-paper p-5 sm:p-6">
          <h2 className="text-sm font-bold">소스 폴더</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {sources.map((s) => (
              <li key={s.drive_link}>
                <a
                  href={s.drive_link}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-ink underline underline-offset-2 hover:text-ink"
                >
                  {s.label ??
                    (s.kind === "seeding" ? "촬영 소스" : "작업 폴더")}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── 3. 수정 요청 ── */}
      {revisions && revisions.length > 0 && (
        <section className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-5 sm:p-6">
          <h2 className="text-sm font-bold text-amber-900">수정 요청</h2>
          <ul className="mt-3 space-y-3">
            {revisions.map((r) => (
              <li key={r.round} className="text-sm">
                <p className="text-xs font-bold text-amber-800">
                  {r.round}차 · {fmt(r.created_at)}
                </p>
                <p className="mt-1 leading-[1.8] whitespace-pre-wrap text-amber-950">
                  {r.message}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── 4. 제작 · 제출 ── */}
      <section className="mt-6 rounded-2xl border border-line bg-paper p-5 sm:p-6">
        <h2 className="text-sm font-bold">{workerLabel(status)}</h2>

        {/* 완성본 업로드 — 폴더가 지정돼 있으면 여기서 바로 올린다 */}
        {NEEDS_WORK_URL.includes(status as never) && (
          <div className="mt-4">
            <Uploader
              deliverableId={item.id}
              finalRound={status === "revising"}
            />
          </div>
        )}

        {next ? (
          <WorkForm
            action={advanceWork}
            label={WORKER_ACTION_LABEL[status] ?? "다음 단계로"}
            className="mt-4"
            secondary={{ action: saveWorkDraftPlain, label: "임시 저장" }}
          >
            <input type="hidden" name="deliverable_id" value={item.id} />

            {NEEDS_WORK_URL.includes(status as never) && (
              <div>
                <label
                  className="text-xs font-bold text-muted"
                  htmlFor="work_url"
                >
                  결과물 링크
                  <span className="ml-1 font-normal">
                    (위에서 업로드하면 자동으로 채워집니다)
                  </span>
                </label>
                <input
                  id="work_url"
                  name="work_url"
                  defaultValue={item.work_url ?? ""}
                  placeholder="https://drive.google.com/..."
                  className={`mt-2 ${field}`}
                />
                {item.work_file_name && (
                  <p className="mt-1.5 text-[0.6875rem] text-muted">
                    올린 파일 · {item.work_file_name}
                  </p>
                )}
              </div>
            )}

            <div>
              <label
                className="text-xs font-bold text-muted"
                htmlFor="plan_note"
              >
                작업 메모{" "}
                <span className="font-normal">(선택 — 안 적으셔도 됩니다)</span>
              </label>
              <textarea
                id="plan_note"
                name="plan_note"
                defaultValue={item.plan_note ?? ""}
                rows={4}
                placeholder="이 편을 어떻게 잡았는지 남겨 두면 수정 요청이 왔을 때 서로 빠릅니다."
                className={`mt-2 ${field}`}
              />
            </div>
          </WorkForm>
        ) : (
          <div className="mt-4 space-y-3 text-sm">
            {item.work_url && (
              <p>
                제출한 결과물:{" "}
                <a
                  href={item.work_url}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all underline underline-offset-2"
                >
                  {item.work_url}
                </a>
              </p>
            )}
            {item.plan_note && (
              <p className="rounded-lg bg-paper-alt p-4 leading-[1.9] whitespace-pre-wrap text-muted">
                {item.plan_note}
              </p>
            )}
          </div>
        )}
      </section>

      {/* ── 5. 메모 ── */}
      <section className="mt-6 rounded-2xl border border-line bg-paper p-5 sm:p-6">
        <h2 className="text-sm font-bold">메모</h2>
        {notes && notes.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {notes.map((n) => (
              <li
                key={n.id}
                className={
                  n.author_role === "worker"
                    ? "rounded-lg bg-paper-alt p-3 text-sm"
                    : "rounded-lg border border-line p-3 text-sm"
                }
              >
                <p className="text-[0.6875rem] font-bold text-muted/70">
                  {n.author_role === "worker" ? "나" : "담당자"} ·{" "}
                  {fmt(n.created_at)}
                </p>
                <p className="mt-1 leading-[1.8] whitespace-pre-wrap">
                  {n.body}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">아직 메모가 없습니다.</p>
        )}

        <WorkForm action={addWorkNote} label="남기기" className="mt-4">
          <input type="hidden" name="deliverable_id" value={item.id} />
          <textarea
            name="body"
            rows={3}
            placeholder="질문이나 공유할 내용을 적어 주세요."
            className={field}
          />
        </WorkForm>
      </section>
    </>
  );
}
