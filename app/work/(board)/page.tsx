import Link from "next/link";
import { requireWorker } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { WORKER_TURN, daysLeft, workStageActor, workerLabel } from "@/lib/work";
import { sourcesDelivered } from "@/lib/process";

export const metadata = { title: "내 작업" };

/**
 * 내 작업 목록.
 *
 * 브랜드명은 보여 준다 — 작업자는 소스를 받아 작업하므로 어차피 알게 된다.
 * ⚠️ 다만 **plans / orders / inquiries 는 조인하지 않는다.** 플랜명·금액이 붙는 순간
 * 작업자가 우리가 얼마를 남기는지 역산할 수 있다. 그게 가리는 유일한 대상이다.
 */
export default async function WorkBoardPage() {
  const worker = await requireWorker();
  const admin = createAdminClient();

  const { data: rows } = await admin
    .from("deliverables")
    .select(
      /**
       * 브랜드명을 그대로 보여 준다. (2026-08-14 오후 사장님 지시)
       *
       * 오전에 작업번호(W-0001)로 가렸다가 되돌렸다. 사장님 판단:
       * "작업자한테는 **플랜 가격**이 노출되지 않으면 되는 것이고,
       *  작업자와 클라이언트는 서로 대화할 채널이 없다."
       * 브랜드를 가리면 작업자가 무엇을 만드는지 알 수 없어 작업 품질이 떨어진다.
       *
       * ⚠️ 가리는 것은 **돈**이다 — plans(price)·주문 금액·결제 정보는
       * 이 화면 어디에도 실리면 안 된다. label(플랜 이름)까지만 안전하다
       */
      "id, seq, title, work_status, due_date, revision_round, worker_updated_at, projects(work_code, work_alias, stage_a, profiles(company_name))",
    )
    .eq("assignee_id", worker.id)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("seq");

  const items = rows ?? [];
  // 내 차례인 것을 위로. 같은 조건이면 마감이 급한 순 (쿼리 정렬을 그대로 탄다)
  const sorted = [...items].sort((a, b) => {
    const mine = (s: string) => (WORKER_TURN.includes(s as never) ? 0 : 1);
    return mine(a.work_status) - mine(b.work_status);
  });

  const myTurn = items.filter((d) => WORKER_TURN.includes(d.work_status as never));

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold">내 작업 {items.length}건</h1>
        <p className="text-sm text-muted">
          지금 진행할 것 <strong className="text-ink">{myTurn.length}건</strong>
        </p>
      </div>

      {sorted.length === 0 ? (
        <p className="mt-10 rounded-xl border border-line bg-white p-10 text-center text-sm text-muted">
          배정된 작업이 없습니다. 배정되면 이 목록에 표시됩니다.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {sorted.map((d) => {
            const left = daysLeft(d.due_date);
            const delivered = sourcesDelivered(d.projects?.stage_a);
            const turn = delivered ? workStageActor(d.work_status) : "none";
            const label = delivered
              ? workerLabel(d.work_status)
              : "인플루언서 시딩 · 소스 확보중";

            return (
              <li key={d.id}>
                <Link
                  href={`/work/${d.id}`}
                  className="block rounded-2xl border border-line bg-paper p-5 transition-colors hover:border-accent/50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-gold/15 px-2 py-0.5 text-xs font-bold text-gold-deep">
                          {d.projects?.work_alias || d.projects?.profiles?.company_name}
                        </span>
                        <span className="text-base font-bold">
                          {d.seq}편{d.title ? ` · ${d.title}` : ""}
                        </span>
                        {d.revision_round > 0 && (
                          <span className="rounded bg-amber-100 px-2 py-0.5 text-[0.6875rem] font-bold text-amber-800">
                            수정 {d.revision_round}차
                          </span>
                        )}
                      </p>
                      <p className="mt-2 text-sm text-muted">
                        {label}
                        {turn === "worker" && (
                          <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[0.6875rem] font-bold text-white">
                            내 차례
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      {left !== null && (
                        <p
                          className={
                            left < 0
                              ? "text-sm font-bold text-red-600"
                              : left <= 2
                                ? "text-sm font-bold text-amber-700"
                                : "text-sm text-muted"
                          }
                        >
                          {left < 0 ? `D+${-left}` : `D-${left}`}
                        </p>
                      )}

                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
