import { readDiagnosis, type DiagAnswers } from "@/lib/diagnosis";
import {
  INQUIRY_SOURCE_LABEL,
  describeSelection,
} from "@/lib/inquiry-plans";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { ActionForm } from "@/components/admin/action-form";
import {
  TRACKING_SINCE,
  leadSources,
  postLabel,
  type LeadSource,
} from "@/lib/lead-source";
import { sendBrochure, startProject } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  new: "접수",
  sent: "안내 발송",
  contacted: "회신 완료",
  applied: "플랜 적용",
  closed: "종료",
};

/**
 * 선택지 라벨은 `lib/inquiry-plans.ts` 한 곳에서만 정의한다. (2026-08-18)
 * 어드민이 자기 목록을 따로 들고 있으면 폼에 하나 늘릴 때 여기가 빈칸이 된다.
 */

/**
 * 블로그유입 — 이 신청을 데려온 회차. (2026-08-19)
 *
 * 세 가지를 **다른 말로** 적는다. 셋을 뭉치면 판단이 뒤집힌다.
 *
 *   데려온 글    첫 착지가 그 글이었다 — 콘텐츠가 만든 전환이다
 *   읽고 옴      다른 데로 들어왔지만 그 글도 읽었다 (어시스트)
 *   기록 이전    08-19 전 접수. 블로그를 안 거친 게 **아니라** 안 재고 있었다
 */
function BlogEntry({ source }: { source?: LeadSource }) {
  const body = (() => {
    if (!source || !source.recorded) {
      return (
        <span className="text-amber-700">
          기록 이전 ({TRACKING_SINCE}부터 수집)
        </span>
      );
    }
    if (source.entry) {
      return (
        <a
          href={source.entry.url}
          target="_blank"
          rel="noreferrer"
          className="font-bold text-accent-deep underline underline-offset-2"
        >
          {postLabel(source.entry)} {source.entry.title}
        </a>
      );
    }
    if (source.assists.length) {
      return (
        <span>
          {source.assists.map((p, i) => (
            <span key={p.id}>
              {i > 0 && " · "}
              <a
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                {postLabel(p)}
              </a>
            </span>
          ))}
          <span className="ml-1 text-muted">읽고 옴 (첫 착지는 아님)</span>
        </span>
      );
    }
    return <span className="text-muted">블로그 경유 아님</span>;
  })();

  return (
    <>
      <div className="flex gap-3 text-xs">
        <dt className="w-16 shrink-0 text-muted">블로그유입</dt>
        <dd className="min-w-0 font-medium">{body}</dd>
      </div>
      {source?.recorded && (
        <div className="flex gap-3 text-xs">
          <dt className="w-16 shrink-0 text-muted">첫 유입</dt>
          <dd className="min-w-0 font-medium break-all">
            {source.from}
            {source.firstPath && (
              <span className="text-muted"> → {source.firstPath}</span>
            )}
            {source.utm && (
              <span className="text-muted">
                {" "}
                · {Object.entries(source.utm).map(([k, v]) => `${k}=${v}`).join(" ")}
              </span>
            )}
          </dd>
        </div>
      )}
    </>
  );
}

/** 진행 중 목록용 한 줄판. 카드가 아니라 줄이라 라벨 없이 짧게 */
function BlogEntryLine({ source }: { source?: LeadSource }) {
  if (!source?.recorded) return null;
  const p = source.entry ?? source.assists[0] ?? null;
  return (
    <p className="mt-1 text-xs text-muted">
      블로그유입{" "}
      {p ? (
        <a
          href={p.url}
          target="_blank"
          rel="noreferrer"
          className="font-bold text-accent-deep underline underline-offset-2"
        >
          {postLabel(p)}
        </a>
      ) : (
        "없음"
      )}
      {source.from && ` · 첫 유입 ${source.from}`}
    </p>
  );
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * 신청 리스트 — 어드민의 첫 화면.
 *
 * 여기서 하는 일은 둘뿐이다. **소개서 보내기**와 **적용 시작**.
 * 적용 시작 버튼은 각 신청 줄의 오른쪽에 붙는다 — 목록에서 바로 눌러야 한다.
 */
export default async function AdminInquiriesPage(props: PageProps<"/admin">) {
  const sp = await props.searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim();

  const admin = createAdminClient();

  const [
    { data: inquiries },
    { data: plans },
    { data: workers },
    { data: mails },
  ] = await Promise.all([
    admin
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("plans")
      .select("id, code, tier, label, composition, beta_price, sort_order")
      .eq("active", true)
      .order("code")
      .order("sort_order"),
    // 배정할 사람 목록 — 플랜을 넣는 그 자리에서 같이 고른다
    admin
      .from("profiles")
      .select("id, contact_name")
      .eq("role", "worker")
      .order("contact_name"),
    admin
      .from("email_log")
      .select("id, kind, to_email, status, error, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  /**
   * 검색 — 브랜드가 늘면 플랜 넣을 곳을 눈으로 못 찾는다. (2026-08-14)
   *
   * 사장님 지적: *"브랜드가 여러 곳이 가입을 하면 내가 플랜 넣어줄 곳을 어떻게
   * 찾아."* 회사명·담당자·이메일 셋 다 걸리게 둔다 — 기억나는 게 셋 중 뭐일지
   * 모르기 때문이다.
   */
  const all = inquiries ?? [];
  const norm = (v: string | null) => (v ?? "").toLowerCase();
  const rows = q
    ? all.filter(
        (r) =>
          norm(r.company_name).includes(q.toLowerCase()) ||
          norm(r.contact_name).includes(q.toLowerCase()) ||
          norm(r.email).includes(q.toLowerCase()),
      )
    : all;

  /**
   * 처리할 것과 이미 굴러가는 것을 갈라 놓는다.
   * 적용된 건이 목록에 섞여 있으면 "오늘 내가 손댈 게 몇 건인지" 가 안 보인다.
   * 사라지지는 않는다 — 아래 [진행 중인 브랜드] 로 내려간다.
   */
  const waiting = rows.filter((r) => !r.project_id && r.status !== "closed");
  const running = rows.filter((r) => r.project_id);

  /**
   * 블로그유입 — 이 신청이 **어느 회차를 밟고 왔는지**. (2026-08-19)
   *
   * 사장님 질문: *"프로젝트신청 한 건이 블로그 어떤 경로로 처음 유입됐는지
   * 알 수 있어?"* 그동안은 알 수 없었다. 이제 첫 접점을 쿠키로 잡아
   * `inquiries.entry_post_id` 에 적는다. 목록 전체를 한 번에 조회한다.
   */
  const sources = await leadSources(rows as never[]);

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold">신청 {all.length}건</h1>
        <p className="text-sm text-muted">
          처리 대기 {waiting.length}건 · 진행 중 {running.length}건
        </p>
      </div>

      {/* 검색 — 서버 컴포넌트라 GET 폼 하나면 된다 */}
      <form method="get" className="mt-5 flex flex-wrap gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="브랜드명 · 담당자 · 이메일로 찾기"
          className="min-w-0 flex-1 rounded-lg border border-line bg-paper px-4 py-2.5 text-sm placeholder:text-muted/60 focus:border-ink focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-ink px-4 py-2.5 text-sm font-bold text-paper"
        >
          찾기
        </button>
        {q && (
          <Link
            href="/admin"
            className="rounded-lg border border-line px-4 py-2.5 text-sm text-muted hover:border-ink hover:text-ink"
          >
            전체
          </Link>
        )}
      </form>

      <h2 className="mt-9 text-sm font-bold">
        처리 대기 <span className="text-muted">{waiting.length}건</span>
      </h2>

      {waiting.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-line bg-paper-alt p-10 text-center text-sm text-muted">
          {q ? "검색 결과가 없습니다." : "처리할 신청이 없습니다."}
        </p>
      ) : (
        <ul className="mt-3 space-y-4">
          {waiting.map((row) => {
            /**
             * 유입 경로마다 채워지는 값이 다르다. (2026-08-18)
             *
             * 랜딩(/)에서 진단을 마치고 신청하면 `answers` 5문항과 추천 플랜이
             * 통째로 실려 온다. 반면 `/sns-brand` 채널 문의 폼에는 **플랜 선택
             * 자체가 없어** 서버로 `unsure`·`unknown` 을 하드코딩해 보낸다
             * (`components/sns/s-contact.tsx`). 그걸 그대로 "관심 추천 요청 ·
             * 편수 미정" 으로 찍으면 **고객이 고른 것처럼 읽힌다.** 실제로는
             * 물어본 적이 없다. 안 물어본 것은 안 물어봤다고 적는다.
             */
            const diagnosis = row.diagnosis as {
              plan?: { label?: string; composition?: string; tier?: string };
              answers?: DiagAnswers;
              source?: string;
              page?: string;
            } | null;

            const log = readDiagnosis(diagnosis?.answers);
            const from =
              INQUIRY_SOURCE_LABEL[diagnosis?.source ?? ""] ??
              "숏폼 랜딩 (/shortform)";
            const picked = describeSelection({
              interest: row.interest,
              volume: row.volume,
              source: diagnosis?.source,
            });

            return (
              <li
                key={row.id}
                className="rounded-2xl border border-line bg-paper p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold">
                        {row.company_name}
                      </span>
                      <span className="text-sm text-muted">
                        {row.contact_name}
                      </span>
                      <span className="rounded-full bg-paper-alt px-2.5 py-0.5 text-[0.6875rem] font-bold">
                        {STATUS_LABEL[row.status] ?? row.status}
                      </span>
                    </p>
                    <p className="mt-1.5 text-xs break-all text-muted">
                      {row.email}
                      {row.phone && ` · ${row.phone}`}
                      {` · ${fmt(row.created_at)}`}
                    </p>
                    {/**
                      * 로그가 둘이다 — 갈라서 보여 준다. (2026-08-18)
                      *
                      * 사장님 지적: *"현황 체크 로그 없음이어도 문의 시 신청내역
                      * 이라고 해서 로그 파악 가능하지 않아?"* 맞다. 폼은 처음부터
                      * 플랜·편수를 받고 있었다. 그걸 현황 체크 결과와 한 줄에
                      * 뭉쳐 놓으니 "체크 로그 없음" 이 곧 "아무 기록 없음" 처럼
                      * 읽혔다. 둘은 다른 기록이다 —
                      *
                      *   신청 내역  제출 버튼을 누른 순간 무조건 남는다
                      *   현황 체크  5문항을 풀고 온 사람만 남는다
                      */}
                    <dl className="mt-3 rounded-xl bg-paper-alt px-4 py-3">
                      <p className="text-[0.6875rem] font-bold text-muted">
                        문의 시 신청내역
                      </p>
                      <div className="mt-2 grid gap-1.5">
                        {[
                          ["선택 플랜", picked.plan],
                          ["예상 편수", picked.count],
                          // 이건 "어디서 왔나" 가 아니라 **폼이 놓인 자리**다.
                          // 라벨을 유입 경로라고 적어 둔 탓에 08-18 까지
                          // 그 값을 유입 경로로 읽고 있었다 (2026-08-19 정정)
                          ["신청 폼", from],
                          ["접수 시각", fmt(row.created_at)],
                          [
                            "광고 수신",
                            row.marketing_agreed ? "동의" : "미동의",
                          ],
                        ].map(([k, v]) => (
                          <div key={k} className="flex gap-3 text-xs">
                            <dt className="w-16 shrink-0 text-muted">{k}</dt>
                            <dd
                              className={
                                // 고른 적 없는 값은 사실대로, 눈에 띄게
                                !picked.chosen &&
                                (k === "선택 플랜" || k === "예상 편수")
                                  ? "font-medium text-amber-700"
                                  : "font-medium"
                              }
                            >
                              {v}
                            </dd>
                          </div>
                        ))}
                        {diagnosis?.plan?.label && (
                          <div className="flex gap-3 text-xs">
                            <dt className="w-16 shrink-0 text-muted">추천 구성</dt>
                            <dd className="font-medium">
                              {diagnosis.plan.label}
                              {diagnosis.plan.composition
                                ? ` (${diagnosis.plan.composition})`
                                : ""}
                            </dd>
                          </div>
                        )}
                        <BlogEntry source={sources.get(row.id)} />
                      </div>
                    </dl>

                    {/* 현황 체크는 별개다. 없으면 없다고 적는다 — 빈칸으로 두면
                        "안 뜬 건지 안 한 건지" 를 구분할 수 없다 */}
                    {log.length === 0 && (
                      <p className="mt-2 text-xs text-muted">
                        현황 체크{" "}
                        <span className="font-medium text-amber-700">
                          체크 로그 없음
                        </span>
                      </p>
                    )}

                    {/* 진단을 마치고 신청한 사람은 무엇을 골랐는지 그대로 남긴다 —
                        통화 첫 마디가 달라진다 */}
                    {log.length > 0 && (
                      <details className="mt-2 rounded-xl bg-paper-alt px-4 py-3">
                        <summary className="cursor-pointer text-xs font-bold">
                          현황 체크 {log.length}문항
                        </summary>
                        <dl className="mt-3 space-y-2.5">
                          {log.map((r) => (
                            <div key={r.question}>
                              <dt className="text-[0.6875rem] leading-[1.6] text-muted">
                                {r.question}
                              </dt>
                              <dd className="mt-0.5 text-xs leading-[1.7] font-medium">
                                {r.answer}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </details>
                    )}
                    {row.brand_url && (
                      <a
                        href={row.brand_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1.5 block text-xs break-all text-accent-deep underline underline-offset-2"
                      >
                        {row.brand_url}
                      </a>
                    )}
                    {row.message && (
                      <p className="mt-3 rounded-xl bg-paper-alt px-4 py-3 text-xs leading-[1.8] whitespace-pre-wrap text-muted">
                        {row.message}
                      </p>
                    )}
                  </div>

                  {/* 오른쪽 = 이 줄에서 바로 하는 두 가지 */}
                  <div className="flex shrink-0 flex-col items-end gap-2.5">
                    {/* 플랜과 작업자를 **한 폼에서** 고른다. 두 화면으로 나누면
                        한쪽이 빠진다 — 실제로 배정 없이 방치된 프로젝트가 있었다 */}
                    <ActionForm
                      action={startProject}
                      label="적용 시작"
                      className="flex flex-col items-end gap-2"
                    >
                      <input type="hidden" name="inquiry_id" value={row.id} />
                      <select
                        name="plan_id"
                        required
                        defaultValue=""
                        className="w-52 rounded-lg border border-line bg-paper px-3 py-2 text-xs"
                      >
                        <option value="" disabled>
                          플랜 선택
                        </option>
                        {(plans ?? []).map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label} · {p.composition}
                          </option>
                        ))}
                      </select>
                      <select
                        name="assignee_id"
                        defaultValue=""
                        className="w-52 rounded-lg border border-line bg-paper px-3 py-2 text-xs"
                      >
                        <option value="">작업자 (나중에 배정)</option>
                        {(workers ?? []).map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.contact_name}
                          </option>
                        ))}
                      </select>
                      {/**
                       * 작업자에게 보일 이름. (2026-08-14)
                       *
                       * 사장님 지시: *"브랜드가 가입할 때 제대로 입력 안 해 놓으면
                       * 작업자가 헷갈리니까 내가 브랜드명을 서브 명칭으로 넣던가
                       * 하게. 작업자가 알아보기 좋게 주석 같은 이름이 붙는다고
                       * 보면 돼."*
                       *
                       * 가입 때 회사명을 "테스트" 처럼 적어 두는 경우가 실제로
                       * 있고, 그러면 작업자 화면·업로드 파일명·드라이브 폴더가
                       * 전부 "테스트" 가 된다. 이 칸이 그 자리를 덮어쓴다.
                       */}
                      <input
                        type="text"
                        name="work_alias"
                        maxLength={40}
                        placeholder={`작업자에게 보일 이름 (기본: ${row.company_name})`}
                        className="w-52 rounded-lg border border-line bg-paper px-3 py-2 text-xs placeholder:text-muted/60"
                      />
                      <span className="w-52 text-right text-[0.6875rem] leading-[1.6] text-muted">
                        마감일은 편당 7일(주 2편)로 자동
                      </span>
                    </ActionForm>

                    {/* 어디로 가는지 안 적으면 누를 때마다 확인해야 한다 */}
                    <div className="flex flex-col items-end gap-1">
                      <ActionForm
                        action={sendBrochure}
                        label={
                          row.brochure_sent_at ? "소개서 재발송" : "소개서 발송"
                        }
                        variant="outline"
                        inline
                      >
                        <input type="hidden" name="inquiry_id" value={row.id} />
                      </ActionForm>
                      <span className="max-w-52 text-right text-[0.6875rem] break-all text-muted">
                        → {row.email}
                        {row.brochure_sent_at &&
                          ` · ${fmt(row.brochure_sent_at)} 발송함`}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/**
       * 진행 중인 브랜드 — 플랜을 넣은 건은 **사라지지 않는다.**
       *
       * 사장님 지적: *"배정이 끝나면 사라지는 게 아니라 브랜드 내역으로
       * 넘어가든가 해서 보이고 있어야지."* 위 [처리 대기]에서 빠지되 여기
       * 남아서, 어느 브랜드가 굴러가고 있는지 한 화면에서 보인다.
       */}
      {running.length > 0 && (
        <section className="mt-12">
          <h2 className="text-sm font-bold">
            진행 중인 브랜드{" "}
            <span className="text-muted">{running.length}곳</span>
          </h2>
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-paper">
            {running.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">{row.company_name}</span>
                    <span className="text-xs text-muted">
                      {row.contact_name}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[0.6875rem] font-bold text-emerald-700">
                      진행 중
                    </span>
                  </p>
                  <p className="mt-1 text-xs break-all text-muted">
                    {row.email}
                    {row.applied_at && ` · ${fmt(row.applied_at)} 적용`}
                  </p>
                  {/* 이미 굴러가는 브랜드도 **무엇이 데려왔는지**는 남아야 한다.
                      그게 다음 편을 무엇으로 쓸지의 근거가 된다 */}
                  <BlogEntryLine source={sources.get(row.id)} />
                </div>
                <Link
                  href={`/admin/projects/${row.project_id}`}
                  className="shrink-0 rounded-lg bg-ink px-3.5 py-2 text-xs font-bold text-paper"
                >
                  프로젝트 열기
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 발송 이력 — 메일이 실제로 나갔는지 여기서 확인한다 */}
      <section className="mt-14">
        <h2 className="text-sm font-bold">최근 메일 발송</h2>
        {!mails || mails.length === 0 ? (
          <p className="mt-3 text-xs text-muted">발송 이력이 없습니다.</p>
        ) : (
          <ul className="mt-3 space-y-1.5 text-xs">
            {mails.map((m) => (
              <li key={m.id} className="flex flex-wrap gap-x-3 text-muted">
                <span className="font-mono">{fmt(m.created_at)}</span>
                <span
                  className={
                    m.status === "sent"
                      ? "font-bold text-accent-deep"
                      : "font-bold text-red-600"
                  }
                >
                  {m.status}
                </span>
                <span>{m.kind}</span>
                <span className="break-all">{m.to_email}</span>
                {m.error && (
                  <span className="w-full text-red-600">{m.error}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
