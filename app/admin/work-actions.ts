"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { projectFolderName } from "@/lib/work";
import { handleFromUrl } from "@/lib/influencer";
import { mirrorImage } from "@/lib/media";
import { fetchPostMetrics } from "@/lib/channel-metrics";
import { WORK_STAGES, dueDateFor, prepSteps } from "@/lib/process";
import { notifySourcesReady } from "@/lib/work-mail";
import {
  CLIENT_NOTICE_PRESETS,
  clientNoticeMail,
  sendMail,
  type ClientNoticeKey,
} from "@/lib/mail";
import {
  driveFolderLink,
  ensureProjectFolders,
  folderIdFromLink,
  grantFolderAccess,
  sharedDriveConfigured,
} from "@/lib/google-drive";
import type { Database } from "@/lib/supabase/database.types";
import type { ActionState } from "./actions";

type DeliverablePatch = Database["public"]["Tables"]["deliverables"]["Update"];

const done = (message: string): ActionState => ({ ok: true, message });
const fail = (message: string): ActionState => ({ ok: false, message });

const text = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim() || null;

/**
 * 작업자 계정 발급.
 *
 * **메일을 보내지 않는다.** Supabase 초대 메일은 우리 Resend 발신 도메인(hgrs.io)으로
 * 나가서 그 한 통으로 회사가 드러난다. 여기서 만든 임시 비밀번호를 직접 전달한다.
 */
export async function createWorker(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("contact_name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !name) return fail("이메일과 이름을 입력해 주세요.");
  if (password.length < 10) return fail("임시 비밀번호는 10자 이상으로 정해 주세요.");

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    // 인증 메일을 보내지 않으려면 확인된 상태로 만들어야 한다
    email_confirm: true,
    user_metadata: { contact_name: name, company_name: "" },
  });

  if (error || !data.user) {
    return fail(
      error?.message?.includes("already")
        ? "이미 등록된 이메일입니다."
        : `계정을 만들지 못했습니다 — ${error?.message ?? "알 수 없는 오류"}`,
    );
  }

  // 트리거가 만든 profiles 행을 작업자로 승격한다
  const { error: profileError } = await admin
    .from("profiles")
    .update({ role: "worker", signup_completed: true, contact_name: name })
    .eq("id", data.user.id);

  if (profileError) return fail("계정은 생성했지만 권한 설정에 실패했습니다.");

  revalidatePath("/admin/workers");
  return done(`${name} 계정을 만들었습니다. 이메일과 임시 비밀번호를 직접 전달해 주세요.`);
}

/** 작업자 계정 정지 — 롤을 내려 로그인해도 아무것도 못 보게 한다 */
export async function suspendWorker(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("worker_id") ?? "");
  if (!id) return fail("작업자를 찾지 못했습니다.");

  const admin = createAdminClient();
  // 배정을 먼저 떼야 남은 작업이 유령이 되지 않는다
  await admin.from("deliverables").update({ assignee_id: null }).eq("assignee_id", id);
  const { error } = await admin.from("profiles").update({ role: "brand" }).eq("id", id);
  if (error) return fail("정지하지 못했습니다.");

  revalidatePath("/admin/workers");
  return done("계정을 정지하고 배정을 해제했습니다.");
}

/**
 * 프로젝트 폴더 한 벌 만들기 — `{공유 드라이브}/{작업코드}/{소스, 완성본}`.
 *
 * 프로젝트마다 폴더를 따로 둔다. 한 폴더를 여러 프로젝트가 같이 쓰면 브랜드가 섞이고
 * 작업자가 남의 브랜드 소스를 그대로 본다. 두 번 눌러도 폴더는 안 늘어난다.
 *
 * 권한은 **한 종류다 — 참여자 전원이 두 폴더 다 편집자.** 역할별로 읽기/쓰기를 쪼개 봤지만
 * 설명만 길어지고 실익이 없었다. 클라이언트도 완성본을 보면서 컨펌해야 하고,
 * 작업자도 소스를 받아 써야 한다. 실수로 지워도 공유 드라이브 휴지통에 30일 남는다.
 */
export async function setupProjectFolders(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const projectId = String(formData.get("project_id") ?? "");
  if (!projectId) return fail("프로젝트를 찾지 못했습니다.");
  if (!sharedDriveConfigured()) {
    return fail("공유 드라이브가 설정되지 않았습니다 (GOOGLE_SHARED_DRIVE_ID).");
  }
  try {
    const r = await setupFolders(projectId);
    revalidatePath(`/admin/projects/${projectId}`);
    revalidatePath("/work");
    revalidatePath("/app");
    return done(
      `"${r.folderName}" 폴더를 만들고 권한을 걸었습니다 (작업자 ${r.workers}명).` +
        (r.notes.length ? ` — ${r.notes.join(", ")}` : ""),
    );
  } catch (e) {
    return fail(e instanceof Error ? e.message : "폴더를 만들지 못했습니다.");
  }
}

/** 폴더 생성 + 참여자 전원 권한 부여. 배정 시에도 이걸 그대로 부른다 */
async function setupFolders(projectId: string) {
  const admin = createAdminClient();
  const { data: project } = await admin
    .from("projects")
    .select("work_code, work_alias, profiles(email, company_name), plans(label)")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) throw new Error("프로젝트를 찾지 못했습니다.");

  // 폴더 이름 = 브랜드명 + 플랜. 클라이언트와 작업자가 같은 폴더를 같은
  // 이름으로 본다. (2026-08-14 오후: 작업번호로 바꿨다가 지시로 되돌림)
  const folderName = projectFolderName(
    project.work_alias || project.profiles?.company_name || "",
    project.plans?.label ?? "",
  );

  const folders = await ensureProjectFolders(folderName);

  for (const [kind, id, label] of [
    ["seeding", folders.source, "소스 폴더"],
    ["final", folders.final, "완성본 폴더"],
  ] as const) {
    await admin.from("drive_grants").delete().eq("project_id", projectId).eq("kind", kind);
    await admin.from("drive_grants").insert({
      project_id: projectId,
      kind,
      label,
      drive_folder_id: id,
      drive_link: driveFolderLink(id),
    });
  }

  // **권한은 한 종류다 — 두 폴더 모두 편집자.**
  // 역할별로 읽기/쓰기를 쪼개 봤지만 설명만 길어지고 실익이 없었다.
  // 공유 드라이브는 삭제해도 휴지통에 30일 남고 원본은 클라이언트와 우리에게도 있다.
  const notes: string[] = [];
  if (project.profiles?.email) {
    try {
      await grantFolderAccess(folders.source, project.profiles.email);
      await grantFolderAccess(folders.final, project.profiles.email);
    } catch {
      notes.push("클라이언트 권한 부여 실패");
    }
  }
  const { data: workers } = await admin
    .from("deliverables")
    .select("profiles!deliverables_assignee_id_fkey(email)")
    .eq("project_id", projectId)
    .not("assignee_id", "is", null);
  const emails = [
    ...new Set((workers ?? []).map((w) => w.profiles?.email).filter(Boolean)),
  ] as string[];
  for (const email of emails) {
    try {
      await grantFolderAccess(folders.final, email);
      await grantFolderAccess(folders.source, email);
    } catch {
      notes.push(`${email} 권한 부여 실패`);
    }
  }

  return { folderName, workers: emails.length, notes };
}

/**
 * 배정된 작업자에게 폴더 권한을 건다 — **폴더가 없으면 여기서 만든다.**
 *
 * 버튼을 따로 누르게 하지 않는다. 배정이 곧 "이 사람이 이 프로젝트를 한다"는 선언이라
 * 그 시점에 폴더도 권한도 다 있어야 한다. 실패해도 배정 자체는 막지 않는다 —
 * 드라이브가 잠깐 흔들렸다고 배정이 안 되면 그게 더 큰 일이다.
 */
async function grantWorkerFolders(projectId: string, workerId: string) {
  const admin = createAdminClient();
  const { data: worker } = await admin
    .from("profiles")
    .select("email")
    .eq("id", workerId)
    .maybeSingle();
  if (!worker?.email || !sharedDriveConfigured()) return;

  let { data: grants } = await admin
    .from("drive_grants")
    .select("kind, drive_folder_id")
    .eq("project_id", projectId);

  // 폴더가 아직 없으면 지금 만든다
  if (!grants?.length) {
    try {
      await setupFolders(projectId);
    } catch {
      return;
    }
    ({ data: grants } = await admin
      .from("drive_grants")
      .select("kind, drive_folder_id")
      .eq("project_id", projectId));
  }

  for (const g of grants ?? []) {
    try {
      await grantFolderAccess(g.drive_folder_id, worker.email);
    } catch {
      // 폴더 재생성 버튼으로 언제든 복구된다
    }
  }
}

/** 편 배정 — 담당자와 마감일 */
export async function assignDeliverable(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("deliverable_id") ?? "");
  const projectId = String(formData.get("project_id") ?? "");
  const assignee = String(formData.get("assignee_id") ?? "");
  const due = text(formData, "due_date");
  if (!id) return fail("편을 찾지 못했습니다.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("deliverables")
    .update({ assignee_id: assignee || null, due_date: due })
    .eq("id", id);

  if (error) return fail("배정하지 못했습니다.");
  if (assignee) await grantWorkerFolders(projectId, assignee);

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/work");
  return done(assignee ? "배정하고 폴더 권한을 걸었습니다." : "배정을 해제했습니다.");
}

/**
 * 프로젝트 일괄 배정 — 편이 10편, 20편이면 하나씩 거는 게 일이다.
 *
 * 기본값은 **미배정 편만**이다. 전체 덮어쓰기를 기본으로 두면 이미 다른 사람이 붙어
 * 진행 중인 편까지 담당자가 갈려 버린다. 덮어쓰려면 범위를 명시적으로 골라야 한다.
 * 완료(done)된 편은 어느 범위에서도 건드리지 않는다 — 끝난 일의 담당자를 바꿀 이유가 없다.
 */
export async function assignProject(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const projectId = String(formData.get("project_id") ?? "");
  const assignee = String(formData.get("assignee_id") ?? "");
  const due = text(formData, "due_date");
  const scope = String(formData.get("scope") ?? "unassigned");
  if (!projectId) return fail("프로젝트를 찾지 못했습니다.");
  if (!assignee && !due) return fail("담당자나 마감일 중 하나는 정해 주세요.");

  const admin = createAdminClient();
  let query = admin
    .from("deliverables")
    .update({
      ...(assignee ? { assignee_id: assignee } : {}),
      ...(due ? { due_date: due } : {}),
    })
    .eq("project_id", projectId)
    .neq("work_status", "done");

  if (scope === "unassigned") query = query.is("assignee_id", null);

  const { data, error } = await query.select("id");
  if (error) return fail("일괄 배정에 실패했습니다.");

  const n = data?.length ?? 0;
  if (assignee && n > 0) await grantWorkerFolders(projectId, assignee);

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/work");
  return n === 0
    ? fail(
        scope === "unassigned"
          ? "미배정 편이 없습니다. 전체에 적용하려면 범위를 바꿔 주세요."
          : "적용할 편이 없습니다.",
      )
    : done(`${n}편에 적용했습니다.`);
}

/**
 * 브랜드 · 제품 정보 저장 — **AI 가 아니라 사람이 쓴다.**
 *
 * 작업자 배정과 동시에 여기에 제품 링크·가격·현재 상황·브랜드 요청사항을 직접 적는다.
 * 저장하면 바로 작업자 화면에 뜬다. 검수 토글을 두지 않은 이유는 내가 쓴 글이라서다 —
 * 확인할 사람이 따로 없는데 공개 버튼을 한 번 더 누르게 하면 그냥 일이 는다.
 */
export async function saveBrandInfo(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const projectId = String(formData.get("project_id") ?? "");
  if (!projectId) return fail("프로젝트를 찾지 못했습니다.");

  const admin = createAdminClient();
  const { error } = await admin.from("work_briefs").upsert(
    { project_id: projectId, manual_note: text(formData, "manual_note") },
    { onConflict: "project_id" },
  );
  if (error) return fail("저장하지 못했습니다.");

  // 파일명 앞자리. 비우면 브랜드명이 쓰인다
  await admin
    .from("projects")
    .update({ work_alias: text(formData, "work_alias") })
    .eq("id", projectId);

  // 폴더 두 개 — 소스(클라·우리가 올림) / 완성본(작업자만 올림)
  for (const kind of ["seeding", "final"] as const) {
    const link = text(formData, `${kind}_link`);
    await admin.from("drive_grants").delete().eq("project_id", projectId).eq("kind", kind);
    if (!link) continue;
    await admin.from("drive_grants").insert({
      project_id: projectId,
      kind,
      label: kind === "seeding" ? "소스 폴더" : "완성본 폴더",
      drive_folder_id: folderIdFromLink(link) ?? link,
      drive_link: link,
    });
  }

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/work");
  revalidatePath("/app");
  return done("저장했습니다. 작업자 화면에 바로 반영됩니다.");
}

/**
 * 단계 강제 이동 — 평소엔 쓸 일이 없다.
 *
 * 단계는 작업자가 밀고, review 이후는 클라이언트가 연다. 여기는 **막혔을 때 뚫는 손잡이**다.
 * 작업자가 연락이 끊겼거나 클라이언트가 확인을 안 하고 있을 때 내가 직접 옮긴다.
 * 어디로든 갈 수 있게 열어 두되, 클라이언트 화면과 만나는 값(status·preview_url)은
 * 여기서도 같이 맞춰 준다 — 한쪽만 옮기면 두 화면이 어긋난다.
 */
export async function setWorkStage(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireAdmin();
  const id = String(formData.get("deliverable_id") ?? "");
  const stage = String(formData.get("work_status") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!id || !stage) return fail("편과 단계를 확인해 주세요.");

  const admin = createAdminClient();
  const { data: item } = await admin
    .from("deliverables")
    .select("id, project_id, work_status, work_url, preview_url")
    .eq("id", id)
    .maybeSingle();
  if (!item) return fail("편을 찾지 못했습니다.");

  // 어드민도 되돌리지 못한다. 원칙은 한 줄이어야 사람이 기억한다
  const order = WORK_STAGES.map((x) => x.key) as string[];
  if (order.indexOf(stage) <= order.indexOf(item.work_status)) {
    return fail("이전 단계로는 되돌릴 수 없습니다.");
  }

  const patch: DeliverablePatch = { work_status: stage };
  if (stage === "review") {
    patch.status = "preview";
    patch.preview_url = item.work_url ?? item.preview_url;
  } else if (stage === "done") {
    patch.status = "approved";
  } else if (stage === "revising") {
    patch.status = "revision";
  } else {
    patch.status = "producing";
  }

  const { error } = await admin.from("deliverables").update(patch).eq("id", id);
  if (error) return fail("단계를 바꾸지 못했습니다.");

  if (note) {
    await admin.from("work_notes").insert({
      deliverable_id: id,
      author_id: profile.id,
      author_role: "admin",
      body: note,
    });
  }

  revalidatePath("/admin/review");
  revalidatePath(`/admin/projects/${item.project_id}`);
  revalidatePath("/work");
  revalidatePath(`/work/${id}`);
  revalidatePath("/app");
  return done("단계를 옮겼습니다.");
}

/** 작업자에게 메모 남기기 */
export async function addAdminNote(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireAdmin();
  const id = String(formData.get("deliverable_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!id || !body) return fail("내용을 적어 주세요.");

  const admin = createAdminClient();
  const { error } = await admin.from("work_notes").insert({
    deliverable_id: id,
    author_id: profile.id,
    author_role: "admin",
    body,
  });

  if (error) return fail("남기지 못했습니다.");
  revalidatePath("/admin/review");
  revalidatePath(`/work/${id}`);
  return done("메모를 남겼습니다.");
}

/**
 * 준비 트랙 한 칸 전진 — **바로 다음 칸으로만 간다.**
 *
 * 화면에서 다음 칸 버튼만 보여 주지만 서버에서도 막는다. 폼 값은 조작할 수 있고,
 * 건너뛰면 앞 단계의 전제(배송 완료, 소스 확보)가 깨진 채로 진행된다.
 * 되돌리기도 없다 — 이미 나간 알림과 화면이 어긋난다.
 */
export async function setPrepStage(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const projectId = String(formData.get("project_id") ?? "");
  const stage = String(formData.get("stage_a") ?? "");
  if (!projectId || !stage) return fail("단계를 확인해 주세요.");

  const admin = createAdminClient();
  const { data: current } = await admin
    .from("projects")
    .select("stage_a, type")
    .eq("id", projectId)
    .maybeSingle();
  if (!current) return fail("프로젝트를 찾지 못했습니다.");

  const list = prepSteps(current.type === "full");
  const now = list.findIndex((x) => x.key === current.stage_a);
  const to = list.findIndex((x) => x.key === stage);
  if (to !== now + 1) {
    return fail("단계는 한 칸씩만 앞으로 갈 수 있습니다. 되돌리기는 되지 않습니다.");
  }

  const { error } = await admin
    .from("projects")
    .update({ stage_a: stage })
    .eq("id", projectId);
  if (error) return fail("단계를 바꾸지 못했습니다.");

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/app");
  revalidatePath("/work");
  return done("단계를 옮겼습니다.");
}

/** 배송 리스트 한 줄 추가 — 내가 수기로 채우고 브랜드가 발송완료를 누른다 */
export async function addShipment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const projectId = String(formData.get("project_id") ?? "");
  const name = String(formData.get("influencer_name") ?? "").trim();
  if (!projectId || !name) return fail("인플루언서 이름을 입력해 주세요.");

  const admin = createAdminClient();
  const { count } = await admin
    .from("seeding_shipments")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  const { error } = await admin.from("seeding_shipments").insert({
    project_id: projectId,
    influencer_name: name,
    product: text(formData, "product"),
    quantity: text(formData, "quantity"),
    option: text(formData, "option"),
    address: text(formData, "address"),
    phone: text(formData, "phone"),
    note: text(formData, "note"),
    sort_order: count ?? 0,
  });

  if (error) return fail("추가하지 못했습니다.");
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/app");
  return done("배송 대상을 추가했습니다.");
}

export async function removeShipment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("shipment_id") ?? "");
  const projectId = String(formData.get("project_id") ?? "");
  const admin = createAdminClient();
  await admin.from("seeding_shipments").delete().eq("id", id);
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/app");
  return done("삭제했습니다.");
}

/**
 * 소스컷 전달 — **작업 시계가 여기서 0시로 시작한다.**
 *
 * 준비 트랙을 delivered 로 닫고, 편마다 마감일을 박고(주 2편 기준 7일),
 * 배정된 작업자에게 "소스 왔으니 시작하세요" 메일을 보낸다.
 * 이 버튼 하나가 준비 구간과 제작 구간을 가른다.
 */
export async function deliverSources(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const projectId = String(formData.get("project_id") ?? "");
  if (!projectId) return fail("프로젝트를 찾지 못했습니다.");

  const admin = createAdminClient();
  const { data: grant } = await admin
    .from("drive_grants")
    .select("drive_link")
    .eq("project_id", projectId)
    .eq("kind", "seeding")
    .maybeSingle();
  if (!grant?.drive_link) {
    return fail("소스 폴더가 아직 없습니다. 폴더부터 만들어 주세요.");
  }

  const now = new Date();
  await admin
    .from("projects")
    .update({ stage_a: "delivered", source_delivered_at: now.toISOString() })
    .eq("id", projectId);

  // 편별 마감 — 주 2편 기준으로 순차로 밀린다
  const { data: items } = await admin
    .from("deliverables")
    .select("id, seq")
    .eq("project_id", projectId)
    .order("seq");

  for (const d of items ?? []) {
    await admin
      .from("deliverables")
      .update({ due_date: dueDateFor(now, d.seq).toISOString().slice(0, 10) })
      .eq("id", d.id);
  }

  const sent = await notifySourcesReady(projectId, grant.drive_link);

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/app");
  revalidatePath("/work");
  return done(
    `소스를 전달했습니다. 편 ${items?.length ?? 0}개에 마감일을 걸었고 작업자 ${sent}명에게 메일을 보냈습니다.`,
  );
}

/**
 * 인플루언서 게시물 등록 — 링크만 넣으면 된다.
 *
 * 게시물 지표(조회·좋아요·댓글)는 Apify 로 바로 긁는다. 실패해도 링크는 저장한다 —
 * 벤더가 흔들렸다고 검수가 멈추면 안 된다. 지표는 나중에 다시 긁으면 채워진다.
 */
export async function addContent(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const projectId = String(formData.get("project_id") ?? "");
  const permalink = String(formData.get("permalink") ?? "").trim();
  const candidateId = String(formData.get("candidate_id") ?? "");
  if (!projectId || !permalink) return fail("게시물 링크를 입력해 주세요.");

  const admin = createAdminClient();
  const { data: candidate } = candidateId
    ? await admin
        .from("influencer_candidates")
        .select("channel_url, channel_name")
        .eq("id", candidateId)
        .maybeSingle()
    : { data: null };

  const post = await fetchPostMetrics(permalink);
  const handle =
    handleFromUrl(candidate?.channel_url) ??
    post?.handle ??
    candidate?.channel_name ??
    "unknown";

  const { error } = await admin.from("influencer_contents").insert({
    project_id: projectId,
    candidate_id: candidateId || null,
    handle,
    permalink,
    // 원본 주소는 만료된다. 받는 즉시 우리 것으로 만든다
    thumbnail_url:
      (await mirrorImage(
        post?.thumbnail,
        `content/${encodeURIComponent(permalink.split("/").filter(Boolean).pop() ?? handle)}`,
      )) ?? post?.thumbnail ?? null,
    caption: post?.caption ?? null,
    view_count: post?.views ?? null,
    like_count: post?.likes ?? null,
    comment_count: post?.comments ?? null,
    posted_at: post?.postedAt ?? null,
  });

  if (error) {
    return fail(
      error.code === "23505" ? "이미 등록된 게시물입니다." : "저장하지 못했습니다.",
    );
  }

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/app");
  return post
    ? done("게시물을 등록하고 지표를 수집했습니다.")
    : done("게시물을 등록했습니다. 지표는 수집하지 못했습니다 — 나중에 다시 시도하세요.");
}

export async function removeContent(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("content_id") ?? "");
  const projectId = String(formData.get("project_id") ?? "");
  const admin = createAdminClient();
  await admin.from("influencer_contents").delete().eq("id", id);
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/app");
  return done("삭제했습니다.");
}

/**
 * 브랜드에게 진행 안내 메일 한 통. (2026-08-14)
 *
 * 사장님이 프로젝트 화면에서 바로 보낸다. 상황을 고르면 머리말이 붙고,
 * 본문은 직접 쓴다 — 템플릿만으로는 실제 상황을 못 담고, 백지만 두면
 * 매번 처음부터 쓰게 된다.
 *
 * 발송 이력은 `email_log` 에 남아 어드민 첫 화면에서 확인된다.
 */
export async function notifyClient(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const projectId = String(formData.get("project_id") ?? "");
  const preset = String(formData.get("preset") ?? "free") as ClientNoticeKey;
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!projectId) return fail("프로젝트를 찾지 못했습니다.");
  if (!body) return fail("보낼 내용을 적어 주세요.");

  const admin = createAdminClient();
  const { data: project } = await admin
    .from("projects")
    .select("id, profiles(email, contact_name), plans(label)")
    .eq("id", projectId)
    .maybeSingle();

  const to = project?.profiles?.email;
  if (!to) return fail("브랜드 이메일을 찾지 못했습니다.");

  const mail = clientNoticeMail({
    contactName: project.profiles?.contact_name ?? "담당자",
    planLabel: project.plans?.label ?? "진행 건",
    preset: preset in CLIENT_NOTICE_PRESETS ? preset : "free",
    subject,
    body,
  });

  const res = await sendMail({
    kind: "client_todo",
    to,
    subject: mail.subject,
    html: mail.html,
    projectId,
  });

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin");

  return res.ok
    ? done(`${to} 로 보냈습니다.`)
    : fail(
        res.skipped
          ? "발송 키가 없어 건너뛰었습니다."
          : `발송 실패: ${res.error}`,
      );
}
