import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { ActionForm } from "@/components/admin/action-form";
import { addAdminNote, setWorkStage } from "../work-actions";
import { WORK_STAGES, workerLabel, workStageActor } from "@/lib/work";

export const metadata = { title: "진행 현황" };

const input =
  "w-full rounded-lg border border-line bg-paper px-3 py-2 text-xs placeholder:text-muted/60 focus:border-ink focus:outline-none";

const fmt = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

/**
 * 진행 현황 — 전 프로젝트의 편이 한 줄씩.
 *
 * 검수 큐가 아니다. **단계는 작업자가 밀고, 컨펌은 클라이언트가 한다.**
 * 여기는 지금 공이 누구에게 있는지 보고, 막힌 것만 손으로 뚫는 자리다.
 * 완료된 편은 기본으로 감춘다 — 매일 볼 목록에 끝난 일이 쌓이면 안 된다.
 */
export default async function AdminReviewPage() {
  const admin = createAdminClient();

  const { data: rows } = await admin
    .from("deliverables")
    .select(
      "id, seq, title, work_status, work_url, worker_updated_at, revision_round, project_id, projects(work_code, type, stage_a, profiles(company_name)), profiles!deliverables_assignee_id_fkey(contact_name)",
    )
    .neq("work_status", "done")
    .order("worker_updated_at", { ascending: true, nullsFirst: false });

  const items = rows ?? [];
  const waitingClient = items.filter((d) => d.work_status === "review");
  const unassigned = items.filter((d) => !d.profiles);

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold">진행중 {items.length}편</h1>
        <p className="text-sm text-muted">
          클라이언트 컨펌 대기 {waitingClient.length}편 · 미배정{" "}
          {unassigned.length}편
        </p>
      </div>

      <p className="mt-3 text-xs leading-[1.7] text-muted">
        단계는 작업자가 직접 넘기고, 1차 완성본 컨펌은 클라이언트가 합니다. 아래
        단계 변경은 <strong>막혔을 때만</strong> 쓰세요.
      </p>

      {items.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-line bg-paper-alt p-10 text-center text-sm text-muted">
          진행중인 편이 없습니다.
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {items.map((d) => {
            const actor = workStageActor(d.work_status);

            return (
              <li
                key={d.id}
                className="rounded-2xl border border-line bg-paper p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/projects/${d.project_id}`}
                        className="text-xs font-bold text-muted underline underline-offset-2"
                      >
                        {d.projects?.profiles?.company_name}
                      </Link>
                      <span className="text-base font-bold">
                        {d.seq}편{d.title ? ` · ${d.title}` : ""}
                      </span>
                      <span className="rounded-full bg-paper-alt px-2.5 py-0.5 text-[0.6875rem] font-bold">
                        {workerLabel(d.work_status)}
                      </span>
                      <span
                        className={
                          actor === "client"
                            ? "rounded-full bg-accent px-2.5 py-0.5 text-[0.6875rem] font-bold text-white"
                            : "rounded-full border border-line px-2.5 py-0.5 text-[0.6875rem] text-muted"
                        }
                      >
                        {actor === "client" ? "클라이언트 차례" : "작업자 차례"}
                      </span>
                      {d.revision_round > 0 && (
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-[0.6875rem] font-bold text-amber-800">
                          수정 {d.revision_round}차
                        </span>
                      )}
                    </p>
                    <p className="mt-1.5 text-xs text-muted">
                      {d.profiles?.contact_name ?? "미배정"} · 최근 활동{" "}
                      {fmt(d.worker_updated_at)}
                    </p>
                  </div>

                  {d.work_url && (
                    <a
                      href={d.work_url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 rounded-lg border border-ink/20 px-3.5 py-2 text-xs font-bold hover:border-ink"
                    >
                      결과물 열기
                    </a>
                  )}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <ActionForm
                    action={setWorkStage}
                    label="다음 단계로"
                    variant="outline"
                  >
                    <input type="hidden" name="deliverable_id" value={d.id} />
                    <select
                      name="work_status"
                      defaultValue={d.work_status}
                      className={input}
                    >
                      {WORK_STAGES.filter(
                        (s) =>
                          WORK_STAGES.findIndex((x) => x.key === s.key) >
                          WORK_STAGES.findIndex((x) => x.key === d.work_status),
                      ).map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.worker}
                        </option>
                      ))}
                    </select>
                    <input
                      name="note"
                      placeholder="사유 (선택 — 작업자 메모로 남습니다)"
                      className={input}
                    />
                  </ActionForm>

                  <ActionForm
                    action={addAdminNote}
                    label="메모 남기기"
                    variant="outline"
                  >
                    <input type="hidden" name="deliverable_id" value={d.id} />
                    <input
                      name="body"
                      placeholder="작업자에게 남길 메모"
                      className={input}
                    />
                  </ActionForm>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
