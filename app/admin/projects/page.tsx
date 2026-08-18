import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { stageLabel, SEEDING_NONE } from "@/lib/stages";

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });

export default async function AdminProjectsPage() {
  const admin = createAdminClient();
  const { data: projects } = await admin
    .from("projects")
    .select(
      "id, type, stage_a, stage_b, started_at, created_at, plans(label, composition), profiles(company_name, contact_name, email)",
    )
    .order("created_at", { ascending: false });

  const rows = projects ?? [];

  return (
    <>
      <h1 className="text-2xl font-bold">프로젝트 {rows.length}건</h1>

      {rows.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-line bg-paper-alt p-10 text-center text-sm text-muted">
          아직 시작된 프로젝트가 없습니다. 신청 목록에서 [적용 시작]을 누르면
          열립니다.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {rows.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/projects/${p.id}`}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-paper px-5 py-4 transition-colors hover:border-ink/40"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-bold">
                    {p.profiles?.company_name} · {p.plans?.label}
                  </span>
                  <span className="mt-1 block text-xs text-muted">
                    {p.profiles?.contact_name} · {p.profiles?.email} ·{" "}
                    {fmt(p.started_at ?? p.created_at)} 시작
                  </span>
                </span>
                <span className="flex shrink-0 flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-paper-alt px-3 py-1.5">
                    시딩 {p.stage_a ? stageLabel(p.stage_a) : SEEDING_NONE}
                  </span>
                  <span className="rounded-full bg-paper-alt px-3 py-1.5">
                    숏폼 {stageLabel(p.stage_b)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
