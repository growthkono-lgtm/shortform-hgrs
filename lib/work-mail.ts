import { createAdminClient } from "@/lib/supabase/server";
import { sendMail } from "@/lib/mail";

/**
 * 공정 알림 — **전부 우리가 보낸다.**
 *
 * 클라이언트도 작업자도 서로에게 직접 메일을 보내지 않는다. 사이에 우리가 있고,
 * 그래서 누가 무엇을 언제 받았는지가 email_log 한 곳에 남는다.
 *
 * 메일 본문에 **금액·플랜명을 절대 쓰지 않는다.** 작업자에게 나가는 메일이 섞여 있고,
 * 거기 단가가 한 줄만 들어가도 마진이 역산된다.
 */

const wrap = (title: string, body: string, cta?: { href: string; label: string }) => `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo',sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#030303">
  <h1 style="font-size:18px;font-weight:700;margin:0 0 16px">${title}</h1>
  <div style="font-size:14px;line-height:1.8;color:#404040">${body}</div>
  ${
    cta
      ? `<a href="${cta.href}" style="display:inline-block;margin-top:24px;padding:12px 24px;background:#4d5fe8;color:#fff;text-decoration:none;border-radius:999px;font-size:13px;font-weight:700">${cta.label}</a>`
      : ""
  }
</div>`;

const WORK_URL = process.env.WORK_APP_URL ?? "https://shortdashboard.vercel.app";
const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hgrs.io";

/** 소스컷 전달 → 배정된 작업자 전원에게 "시작하세요" */
export async function notifySourcesReady(projectId: string, folderLink: string) {
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("deliverables")
    .select("seq, due_date, profiles!deliverables_assignee_id_fkey(email, contact_name)")
    .eq("project_id", projectId)
    .not("assignee_id", "is", null);

  // 한 사람이 여러 편을 맡았으면 메일은 한 통이다
  const byEmail = new Map<string, { name: string; seqs: number[]; due: string | null }>();
  for (const r of rows ?? []) {
    const email = r.profiles?.email;
    if (!email) continue;
    const cur = byEmail.get(email) ?? {
      name: r.profiles?.contact_name ?? "",
      seqs: [],
      due: null,
    };
    cur.seqs.push(r.seq);
    if (!cur.due || (r.due_date && r.due_date < cur.due)) cur.due = r.due_date;
    byEmail.set(email, cur);
  }

  for (const [email, v] of byEmail) {
    await sendMail({
      kind: "source_ready",
      to: email,
      projectId,
      subject: "소스컷이 전달되었습니다 — 작업을 시작해 주세요",
      html: wrap(
        "소스컷이 준비됐습니다",
        `${v.name}님, 배정된 <strong>${v.seqs.length}편</strong>의 소스컷이 소스 폴더에 올라왔습니다.<br/>
         대시보드에서 브랜드 정보를 확인하고 제작을 시작해 주세요.<br/><br/>
         가장 이른 마감은 <strong>${v.due ?? "대시보드 참조"}</strong>입니다.
         작업 기한은 <strong>주 2편 기준 편당 7일</strong>입니다.<br/><br/>
         <a href="${folderLink}">소스 폴더 열기</a>`,
        { href: `${WORK_URL}/work`, label: "내 작업 열기" },
      ),
    });
  }
  return byEmail.size;
}

/** 1차/최종 완성본 업로드 → 클라이언트에게 "확인해 주세요" */
export async function notifyPreviewReady(
  projectId: string,
  seq: number,
  isFinal: boolean,
) {
  const admin = createAdminClient();
  const { data: project } = await admin
    .from("projects")
    .select("profiles(email, contact_name)")
    .eq("id", projectId)
    .maybeSingle();
  const email = project?.profiles?.email;
  if (!email) return false;

  const what = isFinal ? "최종 수정본" : "1차 완성본";
  const res = await sendMail({
    kind: isFinal ? "final_ready" : "preview_ready",
    to: email,
    projectId,
    subject: `${seq}편 ${what}이 올라왔습니다 — 확인 부탁드립니다`,
    html: wrap(
      `${seq}편 ${what} 확인 요청`,
      `${project?.profiles?.contact_name ?? ""}님, <strong>${seq}편 ${what}</strong>이 업로드됐습니다.<br/>
       내 프로젝트에서 확인하시고 <strong>수정 요청</strong> 또는 <strong>확인 완료</strong>를 눌러 주세요.`,
      { href: `${APP_URL}/app`, label: "내 프로젝트 열기" },
    ),
  });
  return res.ok;
}

/** 최종본 다운로드(확인 완료) → 양쪽에 완료 통지 */
export async function notifyProjectDone(projectId: string, seq: number) {
  const admin = createAdminClient();
  const [{ data: project }, { data: rows }] = await Promise.all([
    admin
      .from("projects")
      .select("profiles(email, contact_name)")
      .eq("id", projectId)
      .maybeSingle(),
    admin
      .from("deliverables")
      .select("profiles!deliverables_assignee_id_fkey(email)")
      .eq("project_id", projectId)
      .eq("seq", seq)
      .maybeSingle(),
  ]);

  const body = `<strong>${seq}편</strong> 작업이 마무리됐습니다. 최종본 확인이 완료되었습니다.`;
  const targets = [project?.profiles?.email, rows?.profiles?.email].filter(
    Boolean,
  ) as string[];

  for (const to of targets) {
    await sendMail({
      kind: "project_done",
      to,
      projectId,
      subject: `${seq}편 작업이 완료되었습니다`,
      html: wrap(`${seq}편 완료`, body),
    });
  }
  return targets.length;
}

/** 클라이언트가 처리할 게 밀려 있을 때 (배송 미완 / 소스 미업로드) */
export async function notifyClientTodo(
  projectId: string,
  reason: "shipping" | "sources",
) {
  const admin = createAdminClient();
  const { data: project } = await admin
    .from("projects")
    .select("profiles(email, contact_name)")
    .eq("id", projectId)
    .maybeSingle();
  const email = project?.profiles?.email;
  if (!email) return false;

  const body =
    reason === "shipping"
      ? "인플루언서에게 보낼 제품 배송이 아직 완료되지 않았습니다.<br/>발송을 마치신 뒤 내 프로젝트에서 <strong>발송완료</strong>를 눌러 주세요."
      : "제작에 쓸 소스컷이 아직 업로드되지 않았습니다.<br/>소스 폴더에 올려 주시면 바로 제작을 시작합니다.";

  const res = await sendMail({
    kind: "client_todo",
    to: email,
    projectId,
    subject:
      reason === "shipping"
        ? "제품 발송 확인이 필요합니다"
        : "소스컷 업로드가 필요합니다",
    html: wrap("확인이 필요합니다", body, {
      href: `${APP_URL}/app`,
      label: "내 프로젝트 열기",
    }),
  });
  return res.ok;
}

/** 작업자 리마인드 — 진행 확인(48시간) / 마감 임박(24시간 전) */
export async function notifyWorker(
  input: {
    email: string;
    name: string | null;
    seq: number;
    due: string | null;
    projectId: string;
  },
  kind: "work_remind" | "work_deadline",
) {
  const isDeadline = kind === "work_deadline";
  const res = await sendMail({
    kind,
    to: input.email,
    projectId: input.projectId,
    subject: isDeadline
      ? `${input.seq}편 마감까지 24시간 남았습니다`
      : `${input.seq}편 진행 상황을 알려주세요`,
    html: wrap(
      isDeadline ? `${input.seq}편 마감 임박` : `${input.seq}편 진행 확인`,
      isDeadline
        ? `${input.name ?? ""}님, <strong>${input.seq}편</strong> 마감이 <strong>24시간</strong> 남았습니다 (${input.due}).<br/>완성본을 업로드하고 제출해 주세요.`
        : `${input.name ?? ""}님, 기획은 마치고 제작 들어가셨죠?<br/><strong>${input.seq}편</strong> 기한 내 마무리 잘 부탁드립니다. (마감 ${input.due})`,
      { href: `${WORK_URL}/work`, label: "내 작업 열기" },
    ),
  });
  return res.ok;
}
