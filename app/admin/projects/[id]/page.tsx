import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { ActionForm } from "@/components/admin/action-form";
import {
  DUE_RULE,
  PREP_STAGES,
  prepState,
  prepSteps,
  sourcesDelivered,
} from "@/lib/process";
import {
  addCandidate,
  refreshCandidate,
  removeCandidate,
  setCandidateReward,
  upsertDeliverable,
} from "../../actions";
import {
  assignDeliverable,
  assignProject,
  addContent,
  addShipment,
  deliverSources,
  removeContent,
  removeShipment,
  notifyClient,
  saveBrandInfo,
  setPrepStage,
  setupProjectFolders,
} from "../../work-actions";
import { projectFolderName, workerLabel } from "@/lib/work";
import { CLIENT_NOTICE_PRESETS } from "@/lib/mail";

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
      "id, type, stage_a, stage_b, started_at, created_at, work_code, work_alias, source_delivered_at, plans(label, composition, shorts_count, influencer_count), profiles(company_name, contact_name, email)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!project) notFound();

  const [
    { data: candidates },
    { data: deliverables },
    { data: grants },
    { data: guideline },
    { data: brief },
    { data: workers },
    { data: shipments },
    { data: contents },
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
    admin.from("work_briefs").select("*").eq("project_id", id).maybeSingle(),
    admin
      .from("profiles")
      .select("id, contact_name")
      .eq("role", "worker")
      .order("contact_name"),
    admin
      .from("seeding_shipments")
      .select("*")
      .eq("project_id", id)
      .order("sort_order"),
    admin
      .from("influencer_contents")
      .select("*")
      .eq("project_id", id)
      .order("posted_at", { ascending: false, nullsFirst: false }),
  ]);

  const shortsCount = project.plans?.shorts_count ?? 0;
  const assignedCount = (deliverables ?? []).filter(
    (d) => d.assignee_id,
  ).length;
  const hasSeeding = project.type === "full";
  // 준비 트랙은 한 칸씩 앞으로만 간다 — 지금 단계의 바로 다음 칸만 누를 수 있다
  const prepList = prepSteps(hasSeeding);
  const nextPrep = sourcesDelivered(project.stage_a)
    ? undefined
    : prepList[prepList.findIndex((x) => x.key === project.stage_a) + 1];
  // 드라이브에 실제로 생기는 폴더 이름 — 화면 설명이 실물과 달라지면 안 된다.
  // 규칙은 `setupFolders` 와 한 벌이어야 한다
  const folderName = projectFolderName(
    project.work_alias || project.profiles?.company_name || "",
    project.plans?.label ?? "",
  );
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

      {/* ── 작업자 배정 ── 프로젝트를 열면 제일 먼저 하는 일이라 맨 위에 둔다.
          통으로 한 번 뿌리고, 리소스가 갈리면 아래 표에서 몇 편만 손본다 */}
      <section className="mt-8 rounded-2xl border border-line bg-paper p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-sm font-bold">작업자 배정</h2>
          <p className="text-xs text-muted">
            배정 {assignedCount}/{deliverables?.length ?? 0}편
          </p>
        </div>

        {(workers?.length ?? 0) === 0 ? (
          <p className="mt-4 rounded-xl bg-paper-alt px-4 py-3 text-xs text-muted">
            등록된 작업자가 없습니다.{" "}
            <Link
              href="/admin/workers"
              className="underline underline-offset-2"
            >
              작업자 계정 발급
            </Link>
            부터 해 주세요.
          </p>
        ) : (
          <>
            {/* 1) 통으로 */}
            <div className="mt-4 rounded-xl bg-paper-alt p-4">
              <h3 className="text-xs font-bold">전체 일괄</h3>
              <ActionForm
                action={assignProject}
                label="일괄 적용"
                className="mt-3"
              >
                <input type="hidden" name="project_id" value={project.id} />
                <div className="grid gap-2 sm:grid-cols-3">
                  <select name="assignee_id" defaultValue="" className={input}>
                    <option value="">담당자 (변경 안 함)</option>
                    {(workers ?? []).map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.contact_name}
                      </option>
                    ))}
                  </select>
                  <input type="date" name="due_date" className={input} />
                  <select
                    name="scope"
                    defaultValue="unassigned"
                    className={input}
                  >
                    <option value="unassigned">미배정 편만</option>
                    <option value="all">전체 편 (덮어쓰기)</option>
                  </select>
                </div>
                <p className="text-[0.6875rem] leading-[1.7] text-muted">
                  비워 둔 칸은 바뀌지 않습니다(담당자만·마감일만 일괄 변경
                  가능). <strong>완료된 편은 제외</strong>됩니다.
                </p>
              </ActionForm>
            </div>

            {/* 2) 편별로 — 나눠 줄 때 여기서 몇 편만 손본다 */}
            <div className="mt-5 space-y-2">
              {(deliverables ?? []).map((d) => (
                <ActionForm
                  key={d.id}
                  action={assignDeliverable}
                  label="저장"
                  variant="outline"
                  inline
                  className="rounded-xl border border-line px-4 py-3"
                >
                  <input type="hidden" name="deliverable_id" value={d.id} />
                  <input type="hidden" name="project_id" value={project.id} />
                  <span className="w-24 shrink-0 text-xs font-bold">
                    {d.seq}편
                    <span className="ml-1.5 font-normal text-muted">
                      {d.assignee_id ? "" : "미배정"}
                    </span>
                  </span>
                  <span className="w-28 shrink-0 text-[0.6875rem] text-muted">
                    {workerLabel(d.work_status)}
                  </span>
                  <select
                    name="assignee_id"
                    defaultValue={d.assignee_id ?? ""}
                    className={input}
                  >
                    <option value="">미배정</option>
                    {(workers ?? []).map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.contact_name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    name="due_date"
                    defaultValue={d.due_date ?? ""}
                    className={input}
                  />
                  {d.work_url && (
                    <a
                      href={d.work_url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-[0.6875rem] underline underline-offset-2"
                    >
                      제출물
                    </a>
                  )}
                </ActionForm>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ── 준비 트랙 ── 여기까지가 내 몫이다. 마지막 [전달하기]가 작업 시계를 켠다 */}
      <section className="mt-10 rounded-2xl border border-line bg-paper p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-sm font-bold">
            준비 트랙
            <span className="ml-2 font-normal text-muted">
              현재 ·{" "}
              {PREP_STAGES.find((x) => x.key === project.stage_a)?.client ??
                "—"}
            </span>
          </h2>
          <p className="text-xs text-muted">{DUE_RULE}</p>
        </div>

        {/* 한 칸씩 앞으로만. 되돌리기도 건너뛰기도 없다 */}
        <ol className="mt-4 flex flex-wrap gap-1.5">
          {prepSteps(hasSeeding).map((st) => {
            const state = prepState(st.key, project.stage_a);
            return (
              <li
                key={st.key}
                className={[
                  "rounded-lg px-3 py-2 text-xs",
                  state === "done" && "bg-accent/10 text-accent-deep",
                  state === "active" && "bg-accent font-bold text-white",
                  state === "todo" && "border border-line text-muted/70",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {st.label}
              </li>
            );
          })}
        </ol>

        {nextPrep && (
          <ActionForm
            action={setPrepStage}
            label={`다음 단계로 · ${nextPrep.label}`}
            className="mt-3"
            inline
          >
            <input type="hidden" name="project_id" value={project.id} />
            <input type="hidden" name="stage_a" value={nextPrep.key} />
          </ActionForm>
        )}

        <div className="mt-5 rounded-xl bg-paper-alt p-4">
          {sourcesDelivered(project.stage_a) ? (
            <p className="text-xs leading-[1.7] text-muted">
              <strong>소스 전달 완료</strong>
              {project.source_delivered_at &&
                ` · ${new Date(project.source_delivered_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}`}
              . 편별 마감이 걸렸고 작업자에게 시작 안내가 나갔습니다.
            </p>
          ) : (
            <>
              <p className="text-xs leading-[1.7] text-muted">
                소스컷이 소스 폴더에 준비되면 누르세요.{" "}
                <strong>이 버튼이 작업 시계를 켭니다</strong> — 편마다 마감일이
                걸리고 (주 2편 기준 편당 7일), 배정된 작업자에게 시작 안내
                메일이 나갑니다.
              </p>
              <ActionForm
                action={deliverSources}
                label="작업자에게 전달하기"
                className="mt-3"
                inline
              >
                <input type="hidden" name="project_id" value={project.id} />
              </ActionForm>
            </>
          )}
        </div>
      </section>

      {/* ── 배송 리스트 ── 내가 채우고 브랜드가 행마다 발송완료를 누른다 */}
      {hasSeeding && (
        <section className="mt-10 rounded-2xl border border-line bg-paper p-5 sm:p-6">
          <h2 className="text-sm font-bold">
            제품 · 서비스 배송 {shipments?.length ?? 0}건
            <span className="ml-2 font-normal text-muted">
              발송완료 {(shipments ?? []).filter((x) => x.shipped_at).length}건
            </span>
          </h2>
          <p className="mt-2 text-xs leading-[1.7] text-muted">
            여기에 채워 두면 클라이언트 화면에 그대로 뜨고, 브랜드가 행마다{" "}
            <strong>발송완료</strong>를 누릅니다. 며칠 방치되면 리마인드 메일이
            자동으로 나갑니다.
          </p>

          {shipments && shipments.length > 0 && (
            <ul className="mt-4 space-y-2">
              {shipments.map((sh) => (
                <li
                  key={sh.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-3 text-xs"
                >
                  <span className="min-w-0">
                    <strong className="text-sm">{sh.influencer_name}</strong>
                    <span className="ml-2 text-muted">
                      {[sh.product, sh.quantity, sh.option]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                    <span className="mt-1 block break-all text-muted">
                      {[sh.address, sh.phone, sh.note]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span
                      className={
                        sh.shipped_at
                          ? "rounded-full bg-accent px-2.5 py-0.5 text-[0.6875rem] font-bold text-white"
                          : "rounded-full border border-line px-2.5 py-0.5 text-[0.6875rem] text-muted"
                      }
                    >
                      {sh.shipped_at ? "발송완료" : "발송 대기"}
                    </span>
                    <ActionForm
                      action={removeShipment}
                      label="삭제"
                      variant="ghost"
                      inline
                    >
                      <input type="hidden" name="shipment_id" value={sh.id} />
                      <input
                        type="hidden"
                        name="project_id"
                        value={project.id}
                      />
                    </ActionForm>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <ActionForm
            action={addShipment}
            label="배송 대상 추가"
            className="mt-5"
          >
            <input type="hidden" name="project_id" value={project.id} />
            <div className="grid gap-2 sm:grid-cols-4">
              <input
                name="influencer_name"
                required
                placeholder="인플루언서명"
                className={input}
              />
              <input name="product" placeholder="선정 제품" className={input} />
              <input name="quantity" placeholder="수량" className={input} />
              <input name="option" placeholder="옵션" className={input} />
            </div>
            <div className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr]">
              <input
                name="address"
                placeholder="수령 주소지"
                className={input}
              />
              <input name="phone" placeholder="연락처" className={input} />
              <input
                name="note"
                placeholder="기타 (송장번호 등)"
                className={input}
              />
            </div>
          </ActionForm>
        </section>
      )}

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

      {/**
       * ── 브랜드에게 알리기 ──────────────────────────────────────────
       *
       * 사장님 지시(2026-08-14): *"브랜드에 진행사항을 메일로 전달해 주는 것도
       * 있으면 좋겠어. (…) 그런 건 분명 개인 연락 전화 카톡 이런 거 하려고 할
       * 거야. 난 그 리소스도 개선하고 싶어."*
       *
       * 먼저 알리면 물어볼 일이 줄고, 남은 질문은 카카오톡 상담으로 온다.
       * 개인 연락처로 새는 대화를 줄이는 가장 싼 방법이 이것이다.
       */}
      <section className="mt-10 rounded-2xl border border-line bg-paper p-5 sm:p-6">
        <h2 className="text-sm font-bold">브랜드에게 알리기</h2>
        <p className="mt-2 text-xs leading-[1.7] text-muted">
          {project.profiles?.contact_name} 님(
          <span className="break-all">{project.profiles?.email}</span>)에게 메일이
          갑니다. <strong>먼저 알려 두면 전화·카톡으로 새지 않습니다.</strong>{" "}
          받는 분이 회신하면 그대로 우리에게 옵니다.
        </p>

        <ActionForm action={notifyClient} label="메일 보내기" className="mt-4">
          <input type="hidden" name="project_id" value={project.id} />
          <div className="grid gap-2 sm:grid-cols-2">
            <select name="preset" defaultValue="schedule" className={input}>
              {Object.entries(CLIENT_NOTICE_PRESETS).map(([key, p]) => (
                <option key={key} value={key}>
                  {p.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              name="subject"
              placeholder="제목 (비우면 상황별 기본 제목)"
              className={input}
            />
          </div>
          <textarea
            name="body"
            rows={4}
            required
            placeholder="브랜드에게 전할 내용을 적어 주세요. 상황을 고르면 앞머리 문장은 자동으로 붙습니다."
            className={input}
          />
        </ActionForm>
      </section>

      {/* ── 브랜드 · 제품 정보 ── 작업자에게 나가는 유일한 문서. 내가 직접 쓴다 */}
      <section className="mt-10 rounded-2xl border border-line bg-paper p-5 sm:p-6">
        <h2 className="text-sm font-bold">작업자에게 덧붙일 메모 (선택)</h2>
        <p className="mt-2 text-xs leading-[1.7] text-muted">
          제품 정보는 <strong>클라이언트가 채운 그대로</strong> 작업자에게 이미
          나가 있습니다(아래 [컨텐츠 가이드라인]). 여기는 우리가 따로 일러 둘 게
          있을 때만 씁니다. 플랜 가격·결제 금액만 적지 마세요 — 작업자에게
          가리는 것은 돈뿐입니다.
        </p>

        {/**
         * 비어 있는데 작업자는 이미 붙어 있는 상태를 잡는다. (2026-08-14 QA)
         *
         * 실제로 그런 프로젝트가 있었다 — 클라이언트가 08-10 에 가이드라인을
         * 넣었고 10편이 전부 배정돼 있는데, 이 칸이 나흘째 비어 있었다.
         * 작업자 화면에는 "아직 등록되지 않았습니다" 만 떠 있다. 이 칸은
         * 작업자에게 나가는 **유일한** 문서라, 비면 작업이 아예 시작되지 않는다.
         * 아무도 안 알려 주면 아무도 모른다.
         */}
        {!guideline?.submitted_at && assignedCount > 0 && (
          <p className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-[1.7] text-amber-900">
            <strong>클라이언트가 아직 제품 정보를 안 넣었습니다.</strong> 작업자{" "}
            {assignedCount}편이 배정돼 있는데 판매 링크·가격·프로모션이 비어
            있어, 작업자 화면에는 “아직 등록되지 않았습니다” 만 보입니다.
            클라이언트에게 요청해 주세요.
          </p>
        )}

        {/* 폴더는 프로젝트마다 따로 만든다 — 한 폴더를 공유하면 브랜드가 섞인다 */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-paper-alt p-4">
          <p className="text-xs leading-[1.7] text-muted">
            <strong>폴더 만들기</strong> — 공유 드라이브에{" "}
            <code>{folderName}/소스</code>, <code>{folderName}/완성본</code> 을
            만들고 클라이언트·작업자 전원에게 편집 권한을 겁니다. 초대 메일은
            나가지 않습니다.
            <br />
            <strong>평소엔 누를 일이 없습니다</strong> — 작업자를 배정하면
            자동으로 실행됩니다. 폴더를 실수로 지웠을 때 복구용입니다.
          </p>
          <ActionForm
            action={setupProjectFolders}
            label="폴더 만들고 권한 걸기"
            inline
          >
            <input type="hidden" name="project_id" value={project.id} />
          </ActionForm>
        </div>

        <ActionForm action={saveBrandInfo} label="저장" className="mt-4">
          <input type="hidden" name="project_id" value={project.id} />

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="text-[0.6875rem] font-bold text-muted">
                소스 폴더 링크 (클라이언트·우리가 올림)
              </span>
              <input
                name="seeding_link"
                defaultValue={seedingLink?.drive_link ?? ""}
                placeholder="https://drive.google.com/drive/folders/..."
                className={`mt-1 ${input}`}
              />
            </label>
            <label className="block">
              <span className="text-[0.6875rem] font-bold text-muted">
                완성본 폴더 링크 (작업자가 올림)
              </span>
              <input
                name="final_link"
                defaultValue={finalLink?.drive_link ?? ""}
                placeholder="https://drive.google.com/drive/folders/..."
                className={`mt-1 ${input}`}
              />
            </label>
          </div>

          <label className="block">
            <span className="text-[0.6875rem] font-bold text-muted">
              작업자에게 보일 이름 (비우면 {project.profiles?.company_name})
            </span>
            <input
              name="work_alias"
              defaultValue={project.work_alias ?? ""}
              placeholder={project.profiles?.company_name ?? ""}
              className={`mt-1 ${input}`}
            />
            <span className="mt-1 block text-[0.6875rem] leading-[1.7] text-muted">
              작업자 화면·업로드 파일명·드라이브 폴더에 이 이름이 쓰입니다.
              업로드 파일명이 <code>{"{앞자리}_편번호_제목_형식_날짜"}</code> 로
              자동 조립됩니다. 비워 두시면 브랜드명이 앞자리로 들어갑니다.
            </span>
          </label>

          <textarea
            name="manual_note"
            rows={10}
            defaultValue={brief?.manual_note ?? ""}
            placeholder={
              "제품: 반려견 영양처방식 (관절)\n가격대: 3만원대 / 정기구독 시 2.4만원\n판매 링크: https://...\n현재 상황: 신규 유입은 나오는데 첫구매 전환이 약함\n요청사항: 수의사 멘트 필수 포함, 경쟁사 직접 비교 금지"
            }
            className={`${input} min-h-48 leading-[1.8]`}
          />
        </ActionForm>

        {brief?.client_note && (
          <div className="mt-5 rounded-xl bg-paper-alt p-4">
            <h3 className="text-xs font-bold">클라이언트 코멘트</h3>
            <p className="mt-2 text-xs leading-[1.8] whitespace-pre-wrap text-muted">
              {brief.client_note}
            </p>
          </div>
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
              링크를 넣으면 채널명·프로필 사진·소개글·
              <strong>최근 게시물 3장</strong>· 팔로워·평균 조회/좋아요/댓글을{" "}
              <strong>자동으로 수집</strong>합니다. 카테고리는 소개글로 짐작해
              넣습니다. CPV는 제안 단가 ÷ 평균 조회수로 계산됩니다. 수집이
              실패해도 후보는 저장되고, 사유가 목록에 표시됩니다.
            </p>
          </ActionForm>
        </section>
      )}

      {/* ── 인플루언서 콘텐츠 ── 등록하면 클라이언트가 검수하고 모아본다 */}
      {hasSeeding && (
        <section className="mt-10 rounded-2xl border border-line bg-paper p-5 sm:p-6">
          <h2 className="text-sm font-bold">
            인플루언서 콘텐츠 {contents?.length ?? 0}건
            <span className="ml-2 font-normal text-muted">
              검수 완료{" "}
              {
                (contents ?? []).filter((c) => c.review_status === "approved")
                  .length
              }
              건{" · "}수정 요청{" "}
              {
                (contents ?? []).filter((c) => c.review_status === "revision")
                  .length
              }
              건
            </span>
          </h2>
          <p className="mt-2 text-xs leading-[1.7] text-muted">
            인플루언서가 올린 게시물 링크를 넣으면 조회·좋아요·댓글을 수집해서
            클라이언트의 <strong>콘텐츠 검수</strong>와{" "}
            <strong>모아보기</strong>에 그대로 뜹니다.
          </p>

          {contents && contents.length > 0 && (
            <ul className="mt-4 space-y-2">
              {contents.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3 text-xs"
                >
                  {c.thumbnail_url && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={c.thumbnail_url}
                      alt=""
                      loading="lazy"
                      className="size-10 rounded object-cover"
                    />
                  )}
                  <span className="min-w-0 flex-1">
                    <a
                      href={c.permalink}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold underline underline-offset-2"
                    >
                      @{c.handle}
                    </a>
                    <span className="mt-0.5 block text-muted">
                      조회 {num(c.view_count)} · 좋아요 {num(c.like_count)} ·
                      댓글 {num(c.comment_count)}
                    </span>
                    {c.revision_note && (
                      <span className="mt-0.5 block text-amber-700">
                        수정 요청 · {c.revision_note}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 rounded-full bg-paper-alt px-2.5 py-0.5 text-[0.6875rem] font-bold">
                    {c.review_status === "approved"
                      ? "검수 완료"
                      : c.review_status === "revision"
                        ? "수정 요청"
                        : "확인 대기"}
                  </span>
                  <ActionForm
                    action={removeContent}
                    label="삭제"
                    variant="ghost"
                    inline
                  >
                    <input type="hidden" name="content_id" value={c.id} />
                    <input type="hidden" name="project_id" value={project.id} />
                  </ActionForm>
                </li>
              ))}
            </ul>
          )}

          <ActionForm action={addContent} label="게시물 등록" className="mt-5">
            <input type="hidden" name="project_id" value={project.id} />
            <div className="grid gap-2 sm:grid-cols-[1fr_200px]">
              <input
                name="permalink"
                required
                placeholder="게시물 링크 — https://www.instagram.com/p/..."
                className={input}
              />
              <select name="candidate_id" defaultValue="" className={input}>
                <option value="">인플루언서 선택 (선택)</option>
                {(candidates ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.channel_name}
                  </option>
                ))}
              </select>
            </div>
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
              <div key={seq} className="rounded-xl border border-line p-4">
                <ActionForm
                  action={upsertDeliverable}
                  label={`${seq}편 저장`}
                  variant="outline"
                >
                  <input type="hidden" name="project_id" value={project.id} />
                  <input type="hidden" name="seq" value={seq} />
                  <div className="grid gap-2 sm:grid-cols-[80px_1fr_1fr_140px]">
                    <span className="self-center text-xs font-bold">
                      {seq}편
                    </span>
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
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
