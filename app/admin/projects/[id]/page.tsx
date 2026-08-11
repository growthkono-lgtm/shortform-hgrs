import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { ActionForm } from "@/components/admin/action-form";
import { SEEDING_STAGES, SHORTS_STAGES, TRACK_LABEL } from "@/lib/stages";
import {
  addCandidate,
  refreshCandidate,
  removeCandidate,
  setCandidateReward,
  setDriveLink,
  setStage,
  upsertDeliverable,
} from "../../actions";

const input =
  "w-full rounded-lg border border-line bg-paper px-3 py-2 text-xs placeholder:text-muted/60 focus:border-ink focus:outline-none";

const num = (v: number | null) => (v == null ? "—" : v.toLocaleString("ko-KR"));

export default async function AdminProjectPage({
  params,
}: PageProps<"/admin/projects/[id]">) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: project } = await admin
    .from("projects")
    .select(
      "id, type, stage_a, stage_b, started_at, created_at, plans(label, composition, shorts_count, influencer_count), profiles(company_name, contact_name, email)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!project) notFound();

  const [
    { data: candidates },
    { data: deliverables },
    { data: grants },
    { data: guideline },
  ] = await Promise.all([
    admin
      .from("influencer_candidates")
      .select("*")
      .eq("project_id", id)
      .order("sort_order")
      .order("created_at"),
    admin.from("deliverables").select("*").eq("project_id", id).order("seq"),
    admin.from("drive_grants").select("*").eq("project_id", id),
    admin
      .from("project_guidelines")
      .select("*")
      .eq("project_id", id)
      .maybeSingle(),
  ]);

  const shortsCount = project.plans?.shorts_count ?? 0;
  const seedingLink = grants?.find((g) => g.kind === "seeding");
  const finalLink = grants?.find((g) => g.kind === "final");

  return (
    <>
      <Link
        href="/admin/projects"
        className="text-sm text-muted hover:text-ink"
      >
        ← 프로젝트 목록
      </Link>

      <h1 className="mt-6 text-2xl font-bold">
        {project.profiles?.company_name} · {project.plans?.label}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {project.profiles?.contact_name} · {project.profiles?.email} ·{" "}
        {project.plans?.composition}
      </p>

      {/* ── 드라이브 링크 ── */}
      {/* 드라이브는 프로젝트당 하나씩만 둔다 — 여러 개면 어느 게 최신인지 클라이언트가 모른다 */}
      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-paper p-5">
          <h2 className="text-sm font-bold">인플루언서 결과물 드라이브</h2>
          <ActionForm action={setDriveLink} label="저장" className="mt-4">
            <input type="hidden" name="project_id" value={project.id} />
            <input type="hidden" name="kind" value="seeding" />
            <input
              name="drive_link"
              defaultValue={seedingLink?.drive_link ?? ""}
              placeholder="https://drive.google.com/..."
              className={input}
            />
          </ActionForm>
        </div>

        <div className="rounded-2xl border border-line bg-paper p-5">
          <h2 className="text-sm font-bold">최종 납품 드라이브</h2>
          <ActionForm action={setDriveLink} label="저장" className="mt-4">
            <input type="hidden" name="project_id" value={project.id} />
            <input type="hidden" name="kind" value="final" />
            <input
              name="drive_link"
              defaultValue={finalLink?.drive_link ?? ""}
              placeholder="https://drive.google.com/..."
              className={input}
            />
          </ActionForm>
        </div>
      </section>

      {/* ── 단계 전이 ── */}
      <section className="mt-10 grid gap-4 md:grid-cols-2">
        {project.type === "full" && (
          <div className="rounded-2xl border border-line bg-paper p-5">
            <h2 className="text-sm font-bold">{TRACK_LABEL.seeding}</h2>
            <div className="mt-4 space-y-2">
              {SEEDING_STAGES.map((s) => (
                <ActionForm
                  key={s.key}
                  action={setStage}
                  label={project.stage_a === s.key ? "현재 단계" : "이 단계로"}
                  variant={project.stage_a === s.key ? "solid" : "outline"}
                  inline
                  className="justify-between"
                >
                  <input type="hidden" name="project_id" value={project.id} />
                  <input type="hidden" name="track" value="seeding" />
                  <input type="hidden" name="stage" value={s.key} />
                  <span className="text-xs">{s.label}</span>
                </ActionForm>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-line bg-paper p-5">
          <h2 className="text-sm font-bold">{TRACK_LABEL.shorts}</h2>
          <div className="mt-4 space-y-2">
            {SHORTS_STAGES.map((s) => (
              <ActionForm
                key={s.key}
                action={setStage}
                label={project.stage_b === s.key ? "현재 단계" : "이 단계로"}
                variant={project.stage_b === s.key ? "solid" : "outline"}
                inline
                className="justify-between"
              >
                <input type="hidden" name="project_id" value={project.id} />
                <input type="hidden" name="track" value="shorts" />
                <input type="hidden" name="stage" value={s.key} />
                <span className="text-xs">{s.label}</span>
              </ActionForm>
            ))}
          </div>
        </div>
      </section>

      {/* ── 컨텐츠 가이드라인 (클라이언트 입력분 열람) ── */}
      <section className="mt-10 rounded-2xl border border-line bg-paper p-5 sm:p-6">
        <h2 className="text-sm font-bold">컨텐츠 가이드라인</h2>
        {!guideline?.submitted_at ? (
          <p className="mt-3 text-xs text-muted">
            아직 제출되지 않았습니다. 클라이언트가 내 프로젝트에서 작성합니다.
          </p>
        ) : (
          <dl className="mt-4 grid gap-4 text-xs sm:grid-cols-2">
            {(
              [
                ["브랜드 소개", guideline.brand_intro],
                ["타겟", guideline.target],
                ["USP", guideline.usp],
                ["가격대·객단가", guideline.price_range],
                ["톤앤매너", guideline.tone],
                ["금지 표현", guideline.forbidden],
                ["레퍼런스", guideline.reference_urls],
                ["기타", guideline.extra],
              ] as const
            )
              .filter(([, v]) => v)
              .map(([label, value]) => (
                <div key={label}>
                  <dt className="font-bold">{label}</dt>
                  <dd className="mt-1 leading-[1.8] whitespace-pre-wrap text-muted">
                    {value}
                  </dd>
                </div>
              ))}
          </dl>
        )}
      </section>

      {/* ── 인플루언서 후보 ── */}
      {project.type === "full" && (
        <section className="mt-10 rounded-2xl border border-line bg-paper p-5 sm:p-6">
          <h2 className="text-sm font-bold">
            인플루언서 후보 {candidates?.length ?? 0}명
            <span className="ml-2 font-normal text-muted">
              선택 {candidates?.filter((c) => c.selected).length ?? 0}명
            </span>
          </h2>

          {candidates && candidates.length > 0 && (
            <ul className="mt-4 space-y-2">
              {candidates.map((c) => (
                <li
                  key={c.id}
                  className="rounded-xl border border-line p-4 text-xs"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <span className="min-w-0">
                      <a
                        href={c.channel_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold underline underline-offset-2"
                      >
                        {c.channel_name}
                      </a>
                      <span className="ml-2 rounded bg-paper-alt px-1.5 py-0.5 text-[0.625rem] text-muted">
                        {c.platform}
                      </span>
                      {c.selected && (
                        <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[0.625rem] text-white">
                          클라이언트 선택
                        </span>
                      )}
                      <span className="mt-1.5 block text-muted">
                        팔로워 {num(c.follower_count)} · 게시물{" "}
                        {num(c.content_count)} · 평균 조회 {num(c.avg_views)} ·
                        좋아요 {num(c.avg_likes)} · 댓글 {num(c.avg_comments)} ·
                        CPV {num(c.avg_cpv)}
                      </span>
                      {c.fetch_error && (
                        <span className="mt-1.5 block text-red-600">
                          수집 실패 — {c.fetch_error}
                        </span>
                      )}
                    </span>

                    <span className="flex shrink-0 items-center gap-2">
                      <ActionForm
                        action={refreshCandidate}
                        label="지표 새로고침"
                        variant="outline"
                        inline
                      >
                        <input type="hidden" name="candidate_id" value={c.id} />
                        <input
                          type="hidden"
                          name="project_id"
                          value={project.id}
                        />
                      </ActionForm>
                      <ActionForm
                        action={removeCandidate}
                        label="삭제"
                        variant="ghost"
                        inline
                      >
                        <input type="hidden" name="candidate_id" value={c.id} />
                        <input
                          type="hidden"
                          name="project_id"
                          value={project.id}
                        />
                      </ActionForm>
                    </span>
                  </div>

                  {/* 단가는 벤더가 주지 않는다 — 협상값을 넣으면 CPV가 계산된다 */}
                  <ActionForm
                    action={setCandidateReward}
                    label="단가 저장"
                    variant="outline"
                    inline
                    className="mt-3"
                  >
                    <input type="hidden" name="candidate_id" value={c.id} />
                    <input type="hidden" name="project_id" value={project.id} />
                    <input
                      name="reward"
                      defaultValue={c.reward ?? ""}
                      placeholder="제안 단가(원)"
                      className="w-36 rounded-lg border border-line bg-paper px-3 py-2 text-xs"
                    />
                  </ActionForm>
                </li>
              ))}
            </ul>
          )}

          <ActionForm action={addCandidate} label="후보 추가" className="mt-5">
            <input type="hidden" name="project_id" value={project.id} />
            <div className="grid gap-2 sm:grid-cols-[1fr_180px]">
              <input
                name="channel_url"
                required
                placeholder="채널 링크만 붙여넣으세요 — https://instagram.com/aamoonlog"
                className={input}
              />
              <input
                name="reward"
                placeholder="제안 단가(원, 선택)"
                className={input}
              />
            </div>
            <input name="note" placeholder="메모 (선택)" className={input} />
            <p className="text-[0.6875rem] leading-[1.7] text-muted">
              링크를 넣으면 채널명·팔로워·게시물수·평균 조회/좋아요/댓글을{" "}
              <strong>자동으로 수집</strong>합니다. CPV는 제안 단가 ÷ 평균
              조회수로 계산됩니다. 수집이 실패해도 후보는 저장되고, 사유가
              목록에 표시됩니다.
            </p>
          </ActionForm>
        </section>
      )}

      {/* ── 숏폼 산출물 ── */}
      <section className="mt-10 rounded-2xl border border-line bg-paper p-5 sm:p-6">
        <h2 className="text-sm font-bold">숏폼 산출물 {shortsCount}편</h2>
        <p className="mt-2 text-xs text-muted">
          미리보기 URL을 넣으면 클라이언트 화면에 임베드로 뜹니다.{" "}
          <strong>
            최종 결과물은 위의 &ldquo;최종 납품 드라이브&rdquo; 링크 하나로
          </strong>{" "}
          전달됩니다.
        </p>

        <div className="mt-5 space-y-4">
          {Array.from(
            { length: Math.max(shortsCount, 1) },
            (_, i) => i + 1,
          ).map((seq) => {
            const d = deliverables?.find((x) => x.seq === seq);
            return (
              <ActionForm
                key={seq}
                action={upsertDeliverable}
                label={`${seq}편 저장`}
                variant="outline"
                className="rounded-xl border border-line p-4"
              >
                <input type="hidden" name="project_id" value={project.id} />
                <input type="hidden" name="seq" value={seq} />
                <div className="grid gap-2 sm:grid-cols-[80px_1fr_1fr_140px]">
                  <span className="self-center text-xs font-bold">{seq}편</span>
                  <input
                    name="title"
                    defaultValue={d?.title ?? ""}
                    placeholder="제목 (선택)"
                    className={input}
                  />
                  <input
                    name="preview_url"
                    defaultValue={d?.preview_url ?? ""}
                    placeholder="1차 미리보기 임베드 URL"
                    className={input}
                  />
                  <select
                    name="status"
                    defaultValue={d?.status ?? "producing"}
                    className={input}
                  >
                    <option value="producing">제작중</option>
                    <option value="preview">미리보기 공개</option>
                    <option value="revision">수정 반영중</option>
                    <option value="approved">최종 승인</option>
                  </select>
                </div>
              </ActionForm>
            );
          })}
        </div>
      </section>
    </>
  );
}
