import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { notifyClientTodo, notifyWorker } from "@/lib/work-mail";

/**
 * 시간이 지나야 알 수 있는 알림만 여기서 돈다. 하루 한 번이면 충분하다.
 *
 *  · 소스 전달 후 48시간 — 아직 제작 중인 편에 진행 확인
 *  · 마감 24시간 전 — 아직 제출 안 한 편에 마감 임박
 *  · 클라이언트가 배송/소스 업로드를 3일 넘게 방치하면 리마인드
 *
 * **같은 메일을 두 번 보내지 않는다.** 편에 발송 시각(remind_48h_at / remind_24h_at)을
 * 남기고, 그게 찍힌 편은 건너뛴다. 리마인드를 매일 받으면 아무도 안 읽는다.
 */
export const dynamic = "force-dynamic";

const DAY = 86_400_000;

export async function GET(request: Request) {
  /**
   * Vercel Cron 이 아니면 거절한다.
   *
   * 2026-08-16 수정: 전에는 `if (secret)` 이라 **CRON_SECRET 이 없으면 통과**였다.
   * 지금 프로덕션에는 값이 있지만, 새 환경·프리뷰·프로젝트 복제처럼 값이 빠지는
   * 순간 이 라우트는 아무나 부를 수 있게 되고, 그 즉시 클라이언트와 작업자에게
   * 진짜 메일이 나간다. 값이 없으면 도는 게 아니라 멈추는 쪽이 맞다.
   * 비교도 다른 cron 라우트와 같은 timing-safe 헬퍼로 통일한다.
   */
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(now + DAY).toISOString().slice(0, 10);
  const sent = { remind48: 0, deadline: 0, clientTodo: 0 };

  // ── 1) 진행 확인 (소스 전달 후 48시간) ──
  const { data: working } = await admin
    .from("deliverables")
    .select(
      "id, seq, due_date, work_status, project_id, projects(source_delivered_at), profiles!deliverables_assignee_id_fkey(email, contact_name)",
    )
    .in("work_status", ["study", "producing"])
    .is("remind_48h_at", null)
    .not("assignee_id", "is", null);

  for (const d of working ?? []) {
    const started = d.projects?.source_delivered_at;
    if (!started || now - new Date(started).getTime() < 2 * DAY) continue;
    const email = d.profiles?.email;
    if (!email) continue;

    await notifyWorker(
      {
        email,
        name: d.profiles?.contact_name ?? null,
        seq: d.seq,
        due: d.due_date,
        projectId: d.project_id,
      },
      "work_remind",
    );
    await admin
      .from("deliverables")
      .update({ remind_48h_at: new Date().toISOString() })
      .eq("id", d.id);
    sent.remind48 += 1;
  }

  // ── 2) 마감 24시간 전 ──
  const { data: due } = await admin
    .from("deliverables")
    .select(
      "id, seq, due_date, project_id, profiles!deliverables_assignee_id_fkey(email, contact_name)",
    )
    .in("work_status", ["study", "producing", "revising"])
    .is("remind_24h_at", null)
    .not("assignee_id", "is", null)
    .gte("due_date", today)
    .lte("due_date", tomorrow);

  for (const d of due ?? []) {
    const email = d.profiles?.email;
    if (!email) continue;
    await notifyWorker(
      {
        email,
        name: d.profiles?.contact_name ?? null,
        seq: d.seq,
        due: d.due_date,
        projectId: d.project_id,
      },
      "work_deadline",
    );
    await admin
      .from("deliverables")
      .update({ remind_24h_at: new Date().toISOString() })
      .eq("id", d.id);
    sent.deadline += 1;
  }

  // ── 3) 클라이언트가 방치한 것 ──
  const { data: projects } = await admin
    .from("projects")
    .select("id, stage_a, updated_at")
    .in("stage_a", ["shipping", "sources"]);

  for (const p of projects ?? []) {
    // 3일 넘게 그 단계에 머물러 있을 때만
    if (now - new Date(p.updated_at).getTime() < 3 * DAY) continue;

    // 오늘 이미 보냈으면 건너뛴다
    const { data: recent } = await admin
      .from("email_log")
      .select("created_at")
      .eq("kind", "client_todo")
      .eq("project_id", p.id)
      .gte("created_at", new Date(now - 3 * DAY).toISOString())
      .limit(1);
    if (recent?.length) continue;

    await notifyClientTodo(p.id, p.stage_a === "shipping" ? "shipping" : "sources");
    sent.clientTodo += 1;
  }

  return NextResponse.json({ ok: true, ...sent });
}
