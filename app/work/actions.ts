"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { requireWorker } from "@/lib/supabase/auth";
import { notifyPreviewReady } from "@/lib/work-mail";
import {
  driveConfigured,
  driveViewLink,
  folderIdFromLink,
  startResumableUpload,
} from "@/lib/google-drive";
import {
  NEEDS_WORK_URL,
  WORKER_TRANSITIONS,
  buildFileName,
  isAllowedWorkUrl,
  type WorkStatus,
} from "@/lib/work";

export type WorkActionState = { ok: boolean; message: string | null };

const done = (message: string): WorkActionState => ({ ok: true, message });
const fail = (message: string): WorkActionState => ({ ok: false, message });

/** 요청 헤더에서 페이지 origin 을 뽑는다. Origin 이 없으면 host 로 조립한다 */
function origin(h: Headers) {
  const direct = h.get("origin");
  if (direct) return direct;
  const host = h.get("host");
  return host ? `https://${host}` : "";
}

/**
 * 이 편이 정말 이 작업자에게 배정된 것인지 확인한다.
 * id 는 폼에서 오므로 신뢰하지 않는다 — /app 의 ownProject 와 같은 원칙이다.
 */
async function assignedTo(deliverableId: string, workerId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("deliverables")
    .select("id, seq, project_id, work_status, work_url, plan_note")
    .eq("id", deliverableId)
    .eq("assignee_id", workerId)
    .maybeSingle();
  return data;
}

/** 작업자 로그인. 계정은 우리가 만들어서 전달한다 — 가입 경로가 없다 */
export async function signInWorker(
  _prev: WorkActionState,
  formData: FormData,
): Promise<WorkActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return fail("이메일과 비밀번호를 입력해 주세요.");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) return fail("이메일 또는 비밀번호를 확인해 주세요.");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profile?.role !== "worker") {
    await supabase.auth.signOut();
    return fail("이메일 또는 비밀번호를 확인해 주세요.");
  }

  redirect("/work");
}

export async function signOutWorker() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/work/login");
}

/** 작업 메모 저장 — 단계는 그대로. 적어도 되고 안 적어도 되는 칸이다 */
export async function saveWorkDraft(
  _prev: WorkActionState,
  formData: FormData,
): Promise<WorkActionState> {
  const worker = await requireWorker();
  const id = String(formData.get("deliverable_id") ?? "");
  const target = await assignedTo(id, worker.id);
  if (!target) return fail("작업을 찾지 못했습니다.");

  const planNote = String(formData.get("plan_note") ?? "").trim();
  const workUrl = String(formData.get("work_url") ?? "").trim();
  if (workUrl && !isAllowedWorkUrl(workUrl)) {
    return fail("결과물 링크는 드라이브·유튜브·비메오 등 https 링크만 등록됩니다.");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("deliverables")
    .update({
      plan_note: planNote || null,
      work_url: workUrl || null,
      worker_updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return fail("저장하지 못했습니다.");
  revalidatePath(`/work/${id}`);
  return done("저장했습니다.");
}

export async function saveWorkDraftPlain(formData: FormData): Promise<void> {
  await saveWorkDraft({ ok: false, message: null }, formData);
}

/**
 * 다음 단계로 — **작업자가 직접 민다. 우리 승인을 기다리지 않는다.**
 *
 * 어디로 갈지는 현재 단계가 정한다. 폼이 목적지를 보내지 않는 이유가 이거다 —
 * 목적지를 받으면 producing 에서 done 으로 건너뛰는 요청을 매번 막아야 하는데
 * 그런 검사는 언젠가 빠뜨린다.
 *
 * review 에 도착하면 클라이언트 화면에 바로 공개된다(status='preview').
 * 여기서 앞으로 가는 길은 클라이언트만 열 수 있다 — 확인 완료 또는 수정 요청.
 */
export async function advanceWork(
  _prev: WorkActionState,
  formData: FormData,
): Promise<WorkActionState> {
  const worker = await requireWorker();
  const id = String(formData.get("deliverable_id") ?? "");
  const target = await assignedTo(id, worker.id);
  if (!target) return fail("작업을 찾지 못했습니다.");

  const current = target.work_status as WorkStatus;
  const next = WORKER_TRANSITIONS[current];
  if (!next) return fail("지금은 넘길 수 있는 단계가 아닙니다.");

  const planNote =
    String(formData.get("plan_note") ?? "").trim() || target.plan_note;
  const workUrl = String(formData.get("work_url") ?? "").trim() || target.work_url;

  if (NEEDS_WORK_URL.includes(current)) {
    if (!workUrl) return fail("결과물 링크를 넣어 주세요.");
    if (!isAllowedWorkUrl(workUrl)) {
      return fail("결과물 링크는 드라이브·유튜브·비메오 등 https 링크만 등록됩니다.");
    }
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("deliverables")
    .update({
      work_status: next,
      plan_note: planNote,
      work_url: workUrl,
      worker_updated_at: new Date().toISOString(),
      // review 로 들어가는 순간이 클라이언트 화면과 만나는 지점이다
      ...(next === "review"
        ? { status: "preview", preview_url: workUrl }
        : {}),
    })
    .eq("id", id);

  if (error) return fail("제출하지 못했습니다.");

  // 클라이언트 화면에 공개되는 순간 = 확인 요청 메일이 나가는 순간
  if (next === "review") {
    await notifyPreviewReady(target.project_id, target.seq, current === "revising");
  }

  revalidatePath("/work");
  revalidatePath(`/work/${id}`);
  revalidatePath("/admin/review");
  revalidatePath("/app");
  return done(
    next === "review"
      ? "제출했습니다. 클라이언트 확인 결과가 이 화면에 표시됩니다."
      : "제작 단계로 넘어갔습니다.",
  );
}

/**
 * 드래그해 놓은 파일의 업로드 세션을 연다.
 *
 * 파일 자체는 서버를 지나지 않는다 — 브라우저가 여기서 받은 주소로 구글에 직접 올린다.
 * 우리가 정하는 건 **어느 폴더에 어떤 이름으로** 들어가느냐 둘뿐이고, 그래서 작업자가
 * 파일명을 직접 붙일 필요가 없다.
 */
export async function createUploadSession(input: {
  deliverableId: string;
  title: string;
  ext: string;
  mimeType: string;
}): Promise<
  { ok: true; uploadUrl: string; fileName: string } | { ok: false; message: string }
> {
  const worker = await requireWorker();
  const target = await assignedTo(input.deliverableId, worker.id);
  if (!target) return { ok: false, message: "작업을 찾지 못했습니다." };
  if (!driveConfigured()) {
    return {
      ok: false,
      message: "드라이브 업로드가 아직 연결되지 않았습니다. 아래 링크 입력을 이용해 주세요.",
    };
  }

  const admin = createAdminClient();
  const [{ data: project }, { data: grant }] = await Promise.all([
    admin
      .from("projects")
      .select("work_code, work_alias, profiles(company_name)")
      .eq("id", target.project_id)
      .maybeSingle(),
    admin
      .from("drive_grants")
      .select("drive_link, drive_folder_id")
      .eq("project_id", target.project_id)
      .eq("kind", "final")
      .maybeSingle(),
  ]);

  const folderId =
    folderIdFromLink(grant?.drive_link) ?? folderIdFromLink(grant?.drive_folder_id);
  if (!folderId) {
    return { ok: false, message: "완성본 폴더가 아직 지정되지 않았습니다. 담당자에게 문의해 주세요." };
  }

  const fileName = buildFileName({
    // 앞자리는 **브랜드명**이다. 별칭을 따로 적어 두었으면 그걸 우선한다.
    // (2026-08-14 오후: 작업번호로 바꿨다가 사장님 지시로 되돌림 —
    //  파일을 받아 보는 쪽도 브랜드로 찾는 게 자연스럽다)
    // 작업명은 **브랜드명**이다. 사장님 지시(2026-08-14): 작업번호(W-0001)
    // 같은 내부 코드는 어느 화면에도 나오지 않는다
    brand: project?.work_alias || project?.profiles?.company_name || "브랜드",
    seq: target.seq,
    title: input.title,
    // 수정 반영본이 곧 최종본이다
    final: target.work_status === "revising",
    ext: input.ext,
  });

  try {
    const uploadUrl = await startResumableUpload({
      folderId,
      fileName,
      mimeType: input.mimeType || "application/octet-stream",
      // 구글이 CORS 헤더를 붙이려면 실제 페이지 origin 이 필요하다.
      // 서버 액션 요청에 Origin 이 안 붙는 경우가 있어 host 로 조립하는 폴백을 둔다 —
      // 여기가 비면 브라우저가 PUT 을 막아 버리고, 원인을 찾기 아주 어렵다
      origin: origin(await headers()),
    });
    return { ok: true, uploadUrl, fileName };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "업로드를 시작하지 못했습니다.",
    };
  }
}

/** 업로드가 끝나면 링크를 편에 붙인다. 단계는 작업자가 따로 넘긴다 */
export async function finishUpload(input: {
  deliverableId: string;
  fileId: string;
  fileName: string;
}): Promise<WorkActionState> {
  const worker = await requireWorker();
  const target = await assignedTo(input.deliverableId, worker.id);
  if (!target) return fail("작업을 찾지 못했습니다.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("deliverables")
    .update({
      drive_file_id: input.fileId,
      work_file_name: input.fileName,
      work_url: driveViewLink(input.fileId),
      worker_updated_at: new Date().toISOString(),
    })
    .eq("id", input.deliverableId);

  if (error) return fail("업로드는 됐지만 기록에 실패했습니다.");
  revalidatePath(`/work/${input.deliverableId}`);
  return done(`${input.fileName} 업로드 완료`);
}

/** 작업 메모 — 우리와 주고받는 유일한 통로 */
export async function addWorkNote(
  _prev: WorkActionState,
  formData: FormData,
): Promise<WorkActionState> {
  const worker = await requireWorker();
  const id = String(formData.get("deliverable_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return fail("내용을 적어 주세요.");

  const target = await assignedTo(id, worker.id);
  if (!target) return fail("작업을 찾지 못했습니다.");

  const admin = createAdminClient();
  const { error } = await admin.from("work_notes").insert({
    deliverable_id: id,
    author_id: worker.id,
    author_role: "worker",
    body,
  });

  if (error) return fail("남기지 못했습니다.");
  revalidatePath(`/work/${id}`);
  return done("메모를 남겼습니다.");
}
