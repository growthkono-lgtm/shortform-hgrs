import { createAdminClient } from "@/lib/supabase/server";
import { ActionForm } from "@/components/admin/action-form";
import { createWorker, suspendWorker } from "../work-actions";

export const metadata = { title: "작업자" };

const input =
  "w-full rounded-lg border border-line bg-paper px-3 py-2 text-xs placeholder:text-muted/60 focus:border-ink focus:outline-none";

/**
 * 작업자 계정.
 *
 * 셀프 가입이 없으므로 여기가 유일한 발급 창구다.
 * 만든 계정 정보는 **화면에 다시 뜨지 않는다** — 비밀번호를 저장하지 않기 때문이다.
 * 만들 때 정한 값을 그 자리에서 전달할 것.
 */
export default async function AdminWorkersPage() {
  const admin = createAdminClient();

  const { data: workers } = await admin
    .from("profiles")
    .select("id, contact_name, email, created_at")
    .eq("role", "worker")
    .order("created_at", { ascending: false });

  const { data: load } = await admin
    .from("deliverables")
    .select("assignee_id, work_status")
    .not("assignee_id", "is", null)
    .neq("work_status", "done");

  const openCount = new Map<string, number>();
  for (const row of load ?? []) {
    if (!row.assignee_id) continue;
    openCount.set(row.assignee_id, (openCount.get(row.assignee_id) ?? 0) + 1);
  }

  return (
    <>
      <h1 className="text-2xl font-bold">작업자 {workers?.length ?? 0}명</h1>
      <p className="mt-2 text-sm text-muted">
        작업자는 <strong>작업자 대시보드</strong>만 볼 수 있습니다. 회사·서비스·금액은
        노출되지 않습니다.
      </p>

      <section className="mt-8 rounded-2xl border border-line bg-paper p-5 sm:p-6">
        <h2 className="text-sm font-bold">계정 발급</h2>
        <p className="mt-2 text-xs leading-[1.7] text-muted">
          <strong>메일이 나가지 않습니다.</strong> 초대 메일을 보내면 발신 도메인으로
          우리가 누구인지 드러납니다. 아래에서 정한 임시 비밀번호를 직접 전달해 주세요.
        </p>

        <ActionForm action={createWorker} label="계정 만들기" className="mt-4">
          <div className="grid gap-2 sm:grid-cols-3">
            <input name="contact_name" required placeholder="이름" className={input} />
            <input
              name="email"
              type="email"
              required
              placeholder="이메일 (로그인 아이디)"
              className={input}
            />
            <input
              name="password"
              required
              minLength={10}
              placeholder="임시 비밀번호 (10자 이상)"
              className={input}
            />
          </div>
        </ActionForm>
      </section>

      {workers && workers.length > 0 && (
        <ul className="mt-8 space-y-2">
          {workers.map((w) => (
            <li
              key={w.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-paper p-4 text-xs"
            >
              <span className="min-w-0">
                <strong className="text-sm">{w.contact_name}</strong>
                <span className="ml-2 break-all text-muted">{w.email}</span>
                <span className="mt-1 block text-muted">
                  진행중 {openCount.get(w.id) ?? 0}건
                </span>
              </span>
              <ActionForm action={suspendWorker} label="정지" variant="ghost" inline>
                <input type="hidden" name="worker_id" value={w.id} />
              </ActionForm>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
