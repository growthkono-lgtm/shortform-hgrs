"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { BROCHURE, brochureMail, brochureUrl, projectStartMail, sendMail } from "@/lib/mail";
import { READ_SCOPE_NOTE, refreshDeliveries } from "@/lib/mail-delivery";
import { FIRST_SEEDING_STAGE, FIRST_SHORTS_STAGE } from "@/lib/stages";
import { parseChannelUrl } from "@/lib/channel-url";
import { computeCpv, fetchChannelMetrics } from "@/lib/channel-metrics";
import { guessCategory } from "@/lib/influencer";
import { mirrorCandidateMedia } from "@/lib/media";

export type ActionState = { ok: boolean; message: string | null };

const done = (message: string): ActionState => ({ ok: true, message });
const fail = (message: string): ActionState => ({ ok: false, message });

/** 신청 건에 소개서(플랜 안내)를 보낸다 */
export async function sendBrochure(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("inquiry_id") ?? "");
  if (!id) return fail("신청 정보를 찾지 못했습니다.");

  const admin = createAdminClient();
  const { data: inquiry } = await admin
    .from("inquiries")
    .select("id, email, contact_name, company_name, diagnosis")
    .eq("id", id)
    .maybeSingle();
  if (!inquiry) return fail("신청 정보를 찾지 못했습니다.");

  const mail = brochureMail(inquiry);
  const res = await sendMail({
    kind: "brochure",
    to: inquiry.email,
    subject: mail.subject,
    html: mail.html,
    inquiryId: inquiry.id,
    // 소개서는 첨부와 링크를 함께 보낸다 — 첨부를 막아 둔 메일 환경이 적지 않다
    attachments: [{ filename: BROCHURE.filename, path: brochureUrl }],
  });

  if (res.ok) {
    await admin
      .from("inquiries")
      .update({ status: "sent", brochure_sent_at: new Date().toISOString() })
      .eq("id", id);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/mail");

  /**
   * **안 나간 걸 나갔다고 하지 않는다.** (2026-08-21)
   *
   * 2분 중복차단에 걸린 건은 예전에도 화면에 "발송했습니다" 로 떴다.
   * 사장님이 [소개서 재발송]을 누르고 그 문구를 봐도 실제로는 아무것도
   * 나가지 않은 경우가 있었다는 뜻이다. 이제 그 경우를 따로 적는다.
   */
  if (res.duplicate) {
    return done(
      "2분 안에 같은 메일이 이미 나가 이번에는 보내지 않았습니다. 2분 뒤 다시 누르시거나, 아래 [메일] 화면에서 실제 발송본을 확인해 주세요.",
    );
  }
  return res.ok
    ? done("소개서를 발송했습니다. [메일] 화면에서 도달 여부를 확인하실 수 있습니다.")
    : fail(
        res.skipped
          ? "발송 키(RESEND_API_KEY)가 없어 건너뛰었습니다. 이력에 skipped로 남았습니다."
          : `발송 실패: ${res.error}`,
      );
}

/**
 * **나에게 시험 발송** — 고객에게 가기 전에 내 메일함에서 눈으로 본다. (2026-08-21)
 *
 * 08-20 밤에 이걸 확인하려고 제목 뒤에 시각을 붙여 보냈다
 * (`… 전달 드립니다. (재발송 PM 11:27:20)`). 2분 중복차단을 피하려면
 * 제목을 달리 해야 했기 때문인데, **그 제목이 그대로 메일에 남는다.**
 * 시험용 제목이 고객에게 갈 뻔한 자리다. 그래서 제목은 손대지 않고
 * `allowDuplicate` 로 차단만 푸는 버튼을 따로 둔다.
 *
 * 받는 곳은 **로그인한 어드민 본인**이다. 주소를 입력받지 않는다 —
 * 오타 한 번이면 시험 메일이 남의 메일함으로 간다.
 */
export async function sendBrochureTest(
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const me = await requireAdmin();
  const to = me.email;
  if (!to)
    return fail(
      "로그인 계정에 메일 주소가 없습니다 (profiles.email 이 비어 있습니다).",
    );

  const mail = brochureMail({ contact_name: "테스트", company_name: null });
  const res = await sendMail({
    kind: "brochure",
    to,
    subject: mail.subject,
    html: mail.html,
    attachments: [{ filename: BROCHURE.filename, path: brochureUrl }],
    // 시험은 연달아 눌러야 할 때가 있다. 제목을 바꾸는 대신 여기서 푼다
    allowDuplicate: true,
  });

  revalidatePath("/admin/mail");
  return res.ok
    ? done(`${to} 로 실제와 똑같은 소개서 메일을 보냈습니다.`)
    : fail(`발송 실패: ${res.error}`);
}

/** 도달 상태 갱신 — Resend 에 "그 메일들 어떻게 됐냐" 고 물어 캐시를 새로 쓴다 */
export async function refreshMailDelivery(
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const { updated, scope } = await refreshDeliveries(30);
  revalidatePath("/admin/mail");
  revalidatePath("/admin");
  // 못 한 걸 "0건 확인함" 으로 적지 않는다 — 왜 못 했는지가 답이다
  if (scope !== "ok") return fail(READ_SCOPE_NOTE[scope]);
  return done(`${updated}건의 도달 상태를 다시 확인했습니다.`);
}

/**
 * **적용 시작** — 이 버튼 하나가 프로젝트를 연다.
 *
 * 1) 신청 건 + 선택한 플랜으로 projects 생성 (결제 경유 아님 → order_id null)
 * 2) 신청 상태를 applied 로
 * 3) 클라이언트에게 시작 안내 메일
 *
 * 신청자가 아직 가입 전이면 프로젝트를 붙일 계정이 없다 —
 * 같은 이메일의 profiles 를 찾고, 없으면 여기서 막는다(가입 안내가 먼저다).
 */
export async function startProject(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const inquiryId = String(formData.get("inquiry_id") ?? "");
  const planId = String(formData.get("plan_id") ?? "");
  if (!inquiryId || !planId) return fail("신청과 플랜을 모두 선택해 주세요.");

  const admin = createAdminClient();

  const { data: inquiry } = await admin
    .from("inquiries")
    .select("id, email, contact_name, company_name, project_id")
    .eq("id", inquiryId)
    .maybeSingle();
  if (!inquiry) return fail("신청 정보를 찾지 못했습니다.");
  if (inquiry.project_id) return fail("이미 적용된 신청입니다.");

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", inquiry.email)
    .eq("signup_completed", true)
    .maybeSingle();
  if (!profile) {
    return fail(
      "이 이메일로 가입된 계정이 없습니다. 신청자가 가입을 마쳐야 프로젝트를 열 수 있습니다.",
    );
  }

  const { data: plan } = await admin
    .from("plans")
    .select("id, code, label, shorts_count")
    .eq("id", planId)
    .maybeSingle();
  if (!plan) return fail("플랜을 찾지 못했습니다.");

  /**
   * 작업자에게 보일 이름. 비우면 가입 때 적은 회사명을 그대로 쓴다.
   * 이 값이 작업자 목록·상세·업로드 파일명·드라이브 폴더 이름을 전부 덮는다.
   */
  const workAlias = String(formData.get("work_alias") ?? "").trim() || null;

  const { data: project, error } = await admin
    .from("projects")
    .insert({
      user_id: profile.id,
      plan_id: plan.id,
      inquiry_id: inquiry.id,
      work_alias: workAlias,
      type: plan.code,
      stage_a: plan.code === "full" ? FIRST_SEEDING_STAGE : null,
      stage_b: FIRST_SHORTS_STAGE,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !project) return fail("프로젝트를 만들지 못했습니다.");

  // 가이드라인 입력 자리를 미리 열어 둔다 — 클라이언트가 바로 채울 수 있게
  await admin.from("project_guidelines").insert({ project_id: project.id });

  // 편 행도 지금 만든다. 행이 있어야 작업자를 배정할 수 있고,
  // 나중에 만들면 "아직 저장 안 한 편"이라는 유령 상태가 생긴다
  const shortsCount = plan.shorts_count ?? 0;

  /**
   * 작업자 배정을 **여기서 같이** 한다. (2026-08-14)
   *
   * 사장님 지시: *"플랜을 현금결제한 클라 브랜드한테 넣어주면, 그와 동시에
   * 작업자도 내가 거기서 배정하고."*
   *
   * 08-14 오전까지는 플랜만 넣고 작업자는 프로젝트 상세로 따로 들어가야 했다.
   * 화면을 두 번 옮겨야 하는 순간 한쪽은 반드시 빠진다 — 실제로 배정 없이
   * 며칠 방치된 프로젝트가 있었다.
   *
   * 마감일은 편성 규칙(주 2편 · 편당 7일) 그대로 1·2편 D+7, 3·4편 D+14 …
   * 로 깐다. 배정하지 않으면 편 행만 만들어지고 담당자는 비어 있다.
   */
  const assigneeId = String(formData.get("assignee_id") ?? "").trim() || null;

  if (shortsCount > 0) {
    const today = new Date();
    await admin.from("deliverables").insert(
      Array.from({ length: shortsCount }, (_, i) => {
        const seq = i + 1;
        const due = new Date(today);
        due.setDate(due.getDate() + Math.ceil(seq / 2) * 7);
        return {
          project_id: project.id,
          seq,
          ...(assigneeId
            ? { assignee_id: assigneeId, due_date: due.toISOString().slice(0, 10) }
            : {}),
        };
      }),
    );
  }

  await admin
    .from("inquiries")
    .update({
      status: "applied",
      project_id: project.id,
      applied_at: new Date().toISOString(),
    })
    .eq("id", inquiry.id);

  const mail = projectStartMail(inquiry.contact_name, plan.label);
  const res = await sendMail({
    kind: "project_start",
    to: inquiry.email,
    subject: mail.subject,
    html: mail.html,
    inquiryId: inquiry.id,
    projectId: project.id,
  });

  revalidatePath("/admin");
  revalidatePath("/app");
  revalidatePath("/work");

  const assigned = assigneeId ? ` 작업자 ${shortsCount}편 배정 완료.` : "";
  return done(
    (res.ok
      ? "프로젝트를 시작하고 안내 메일을 보냈습니다."
      : "프로젝트를 시작했습니다. (메일은 발송되지 않았습니다 — 발송 이력 확인)") +
      assigned,
  );
}

/** 단계 전이 — 시딩/숏폼 트랙 각각 */
export async function setStage(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const projectId = String(formData.get("project_id") ?? "");
  const track = String(formData.get("track") ?? "");
  const stage = String(formData.get("stage") ?? "");
  if (!projectId || !stage) return fail("단계 정보를 확인해 주세요.");

  const admin = createAdminClient();
  // 동적 키로 넘기면 타입이 never 로 좁혀진다 — 컬럼별로 갈라 쓴다
  const patch =
    track === "seeding" ? { stage_a: stage } : { stage_b: stage };
  const { error } = await admin.from("projects").update(patch).eq("id", projectId);

  if (error) return fail("단계를 바꾸지 못했습니다.");
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/app");
  return done("단계를 변경했습니다.");
}

/**
 * 인플루언서 후보 등록 — **채널 링크 한 줄이면 된다.**
 *
 * 플랫폼·채널명은 URL에서 뽑고, 팔로워·조회수 등 지표는 Apify 로 바로 수집한다.
 * 수집이 실패해도 후보는 저장한다 — 링크는 남기고 사유를 적어 둔 뒤 다시 시도하면 된다.
 * 실패를 이유로 저장을 막으면 벤더가 흔들릴 때마다 작업이 통째로 멈춘다.
 */
export async function addCandidate(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const projectId = String(formData.get("project_id") ?? "");
  const rawUrl = String(formData.get("channel_url") ?? "").trim();
  if (!projectId || !rawUrl) return fail("채널 링크를 입력해 주세요.");

  const parsed = parseChannelUrl(rawUrl);
  if (!parsed) return fail("채널 링크 형식을 확인해 주세요.");

  const rewardRaw = String(formData.get("reward") ?? "").replace(/[^\d]/g, "");
  const reward = rewardRaw ? Number(rewardRaw) : null;

  const result = await fetchChannelMetrics(parsed.url);
  const m = result.ok ? result.metrics : null;

  const admin = createAdminClient();
  // 먼저 행을 만들어 id 를 받고, 그 id 로 이미지 경로를 잡는다
  const { data: created, error } = await admin
    .from("influencer_candidates")
    .insert({
    project_id: projectId,
    channel_url: parsed.url,
    channel_name: m?.displayName || parsed.handle || parsed.url,
    platform: parsed.platform,
    thumbnail_url: m?.thumbnailUrl ?? null,
    follower_count: m?.followerCount ?? null,
    content_count: m?.contentCount ?? null,
    avg_views: m?.avgViews ?? null,
    avg_likes: m?.avgLikes ?? null,
    avg_comments: m?.avgComments ?? null,
    avg_cpv: computeCpv(reward, m?.avgViews ?? null),
    reward,
    bio: m?.bio ?? null,
    // 소개글로 카테고리를 짐작해 둔다. 틀리면 어드민에서 고른다
    category: m?.businessCategory ?? guessCategory(m?.keywords) ?? null,
    latest_posts: m?.latestPosts ?? [],
    // 1차 심사가 없어졌다 — 등록하는 순간 확정 명단이다
    confirmed: true,
    note: String(formData.get("note") ?? "").trim() || null,
    fetch_error: result.ok ? null : result.error,
    fetched_at: result.ok ? new Date().toISOString() : null,
    snapshot_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !created) return fail("후보를 저장하지 못했습니다.");

  // 인스타 CDN 주소는 만료된다. 받는 즉시 우리 스토리지로 옮겨 둔다
  if (m) {
    const mirrored = await mirrorCandidateMedia(created.id, {
      thumbnailUrl: m.thumbnailUrl,
      posts: m.latestPosts,
    });
    await admin
      .from("influencer_candidates")
      .update({
        thumbnail_url: mirrored.thumbnailUrl,
        latest_posts: mirrored.posts,
      })
      .eq("id", created.id);
  }
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/app");
  return result.ok
    ? done("후보를 추가하고 지표를 수집했습니다.")
    : fail(`후보는 저장했습니다. 지표 수집은 실패 — ${result.error}`);
}

/** 지표 다시 수집 — 벤더가 흔들렸거나 시간이 지나 값이 낡았을 때 */
export async function refreshCandidate(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("candidate_id") ?? "");
  const projectId = String(formData.get("project_id") ?? "");
  if (!id) return fail("후보를 찾지 못했습니다.");

  const admin = createAdminClient();
  const { data: candidate } = await admin
    .from("influencer_candidates")
    .select("channel_url, reward")
    .eq("id", id)
    .maybeSingle();
  if (!candidate) return fail("후보를 찾지 못했습니다.");

  const result = await fetchChannelMetrics(candidate.channel_url);
  if (!result.ok) {
    await admin
      .from("influencer_candidates")
      .update({ fetch_error: result.error })
      .eq("id", id);
    revalidatePath(`/admin/projects/${projectId}`);
    return fail(`수집 실패 — ${result.error}`);
  }

  const m = result.metrics;
  const mirrored = await mirrorCandidateMedia(id, {
    thumbnailUrl: m.thumbnailUrl,
    posts: m.latestPosts,
  });
  await admin
    .from("influencer_candidates")
    .update({
      channel_name: m.displayName ?? undefined,
      thumbnail_url: mirrored.thumbnailUrl,
      follower_count: m.followerCount,
      content_count: m.contentCount,
      avg_views: m.avgViews,
      avg_likes: m.avgLikes,
      avg_comments: m.avgComments,
      avg_cpv: computeCpv(candidate.reward, m.avgViews),
      bio: m.bio,
      category: m.businessCategory ?? guessCategory(m.keywords),
      latest_posts: mirrored.posts,
      fetch_error: null,
      fetched_at: new Date().toISOString(),
      snapshot_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/app");
  return done("지표를 새로 수집했습니다.");
}

/** 제안 단가 입력 — CPV 는 여기서 다시 계산된다 */
export async function setCandidateReward(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("candidate_id") ?? "");
  const projectId = String(formData.get("project_id") ?? "");
  const raw = String(formData.get("reward") ?? "").replace(/[^\d]/g, "");
  const reward = raw ? Number(raw) : null;

  const admin = createAdminClient();
  const { data: candidate } = await admin
    .from("influencer_candidates")
    .select("avg_views")
    .eq("id", id)
    .maybeSingle();
  if (!candidate) return fail("후보를 찾지 못했습니다.");

  const { error } = await admin
    .from("influencer_candidates")
    .update({ reward, avg_cpv: computeCpv(reward, candidate.avg_views) })
    .eq("id", id);

  if (error) return fail("단가를 저장하지 못했습니다.");
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/app");
  return done("단가를 저장했습니다.");
}

export async function removeCandidate(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("candidate_id") ?? "");
  const projectId = String(formData.get("project_id") ?? "");
  const admin = createAdminClient();
  await admin.from("influencer_candidates").delete().eq("id", id);
  revalidatePath(`/admin/projects/${projectId}`);
  return done("후보를 삭제했습니다.");
}

/** 숏폼 산출물 — 1차 미리보기 임베드 / 최종 드라이브 링크 */
export async function upsertDeliverable(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const projectId = String(formData.get("project_id") ?? "");
  const seq = Number(String(formData.get("seq") ?? "0"));
  if (!projectId || !seq) return fail("편 번호를 확인해 주세요.");

  const admin = createAdminClient();
  const status = String(formData.get("status") ?? "producing");

  /**
   * 어드민이 상태를 바꾸면 **작업자 트랙도 같이 민다.** (2026-08-14 QA)
   *
   * 여기서 `status` 만 쓰고 있었다. 그래서 어드민이 어떤 편을 "수정 반영중"
   * 으로 바꿔도 작업자 화면은 계속 "컨텐츠 기획제작중" 이었다. 클라이언트는
   * "수정 반영중" 을 보고 기다리는데 작업자는 수정 요청이 온 줄도 모르는,
   * 두 화면이 서로 다른 말을 하는 상태가 된다. 실제로 그 상태로 남아 있는
   * 편이 하나 있었다(1편, 08-10).
   *
   * `producing` 만 예외다 — 작업자 쪽 `study`(브랜드 숙지)와 `producing`
   * (기획제작)이 클라이언트에게는 한 칸으로 보이므로, 여기서 밀면 작업자가
   * 이미 밟은 칸을 되돌리게 된다. 단계는 되돌리지 않는다는 원칙이 우선이다.
   */
  const WORK_STATUS_OF: Record<string, string> = {
    preview: "review",
    revision: "revising",
    approved: "done",
  };
  const workStatus = WORK_STATUS_OF[status];

  const { error } = await admin.from("deliverables").upsert(
    {
      project_id: projectId,
      seq,
      title: String(formData.get("title") ?? "").trim() || null,
      preview_url: String(formData.get("preview_url") ?? "").trim() || null,
      status,
      ...(workStatus ? { work_status: workStatus } : {}),
    },
    { onConflict: "project_id,seq" },
  );

  if (error) return fail("산출물을 저장하지 못했습니다.");
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/app");
  // 작업자 화면도 같이 갱신한다 — 상태를 밀어 놓고 화면이 안 바뀌면
  // 작업자는 여전히 옛 단계를 본다
  revalidatePath("/work");
  return done("산출물을 저장했습니다.");
}

/** 구글 드라이브 링크 — 시딩 결과물 / 최종 납품본 */
export async function setDriveLink(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const projectId = String(formData.get("project_id") ?? "");
  const kind = String(formData.get("kind") ?? "final");
  const link = String(formData.get("drive_link") ?? "").trim();
  if (!projectId || !link) return fail("드라이브 링크를 입력해 주세요.");

  const admin = createAdminClient();
  // 같은 종류는 하나만 유지한다 — 링크가 여러 개면 어느 게 최신인지 클라이언트가 모른다
  await admin.from("drive_grants").delete().eq("project_id", projectId).eq("kind", kind);
  const { error } = await admin.from("drive_grants").insert({
    project_id: projectId,
    kind,
    drive_folder_id: link.split("/").pop() ?? link,
    drive_link: link,
  });

  if (error) return fail("링크를 저장하지 못했습니다.");
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/app");
  return done("드라이브 링크를 저장했습니다.");
}
