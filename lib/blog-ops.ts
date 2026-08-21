import "server-only";

import { NextResponse } from "next/server";

import { cronAuthorized } from "@/lib/cron-auth";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * cron 입구 공통 껍데기. (2026-08-14)
 *
 * ── 왜 만들었나 ────────────────────────────────────────────────────────
 * 08-14 새벽에 사장님께 **cron 오류 메일이 여러 통** 갔다. cron-job.org 는
 * 응답이 2xx 가 아니면 등록한 메일로 실패 통지를 보낸다. 라우트 안에서 예외가
 * 하나 터지면 Next 가 500 을 돌려주고, 그게 곧바로 메일이 된다.
 *
 * 그런데 이 자동화의 약속은 **"리포트 메일 한 통 말고는 아무것도 안 온다"** 다.
 * 그래서 뒤집었다 — cron 입구는 무슨 일이 있어도 200 을 돌려주고, 실패는
 * `blog_ops_log` 에 적는다. 저녁 리포트가 그 표를 읽어 한 줄로 알린다.
 *
 * 인증 실패(401)만 예외다. 그건 우리 시스템의 고장이 아니라 **남이 문을
 * 두드린 것**이라, 200 으로 덮으면 잘못된 헤더로 등록된 cron 을 영영 모른다.
 *
 * ── 캐시 ──────────────────────────────────────────────────────────────
 * 엣지가 이전 응답을 재사용해 "보낼 게 있는데 0건" 이 돌아온 적이 있다.
 * `force-dynamic` 만으로는 부족해 응답 헤더로 못 박는다.
 */
const NO_STORE = { "cache-control": "no-store, max-age=0" } as const;

export async function opsLog(route: string, ok: boolean, note: string) {
  try {
    await createAdminClient()
      .from("blog_ops_log")
      .insert({ route, ok, note: note.slice(0, 1000) });
  } catch {
    // 로그를 남기려다 라우트를 죽이면 본말전도다. 조용히 넘긴다
  }

  /**
   * `ok` 를 안 믿고 문구도 본다. (2026-08-18)
   *
   * 08-17·08-18 두 편이 크레딧 부족으로 죽었는데 긴급 메일이 한 통도 안 갔다.
   * `stepOnce` 가 실패를 예외로 안 던지고 정상 반환해서 여기 `ok=true` 로
   * 들어왔기 때문이다. 부르는 쪽은 이제 `ok` 를 제대로 넘기지만, 크레딧·인증은
   * **한 번 놓치면 매일 한 편씩 비는** 고장이라 판정을 한 곳에만 걸지 않는다.
   * 문구에 크레딧·인증 신호가 있으면 `ok` 가 뭐라 하든 알린다.
   */
  if (!ok || FATAL.test(note)) await alertIfFatal(note);
}

/**
 * 저녁 리포트를 기다리면 안 되는 고장. (2026-08-14)
 *
 * ── 두 번 겪었다 ──────────────────────────────────────────────────────
 * 08-14 새벽 앤트로픽 크레딧이 바닥나 원고 생성이 세 번 다 죽었다. 그날 저녁
 * OpenAI 크레딧도 같은 식으로 바닥났다. 둘 다 **조용히** 멈췄고, 사람이
 * 화면을 열어 보고 나서야 알았다.
 *
 * 나머지 실패(일시적 네트워크, 자료 부족)는 저녁 리포트 한 줄이면 충분하다.
 * 그런데 **크레딧과 인증은 다르다** — 우리가 손을 대기 전까지 100% 재발하고,
 * 그동안 매일 한 편씩 빈다. 이건 즉시 알려야 한다.
 *
 * 하루 한 통으로 막는다. 5분마다 도는 cron 이 같은 오류를 288번 보내면
 * 그건 알림이 아니라 소음이고, 소음은 결국 안 읽힌다.
 */
const FATAL = /credit|quota|insufficient|billing|invalid_api_key|unauthorized|401/i;

async function alertIfFatal(note: string) {
  if (!FATAL.test(note)) return;

  try {
    const admin = createAdminClient();
    // 제목 규칙은 `lib/blog-report.ts` 와 같다 — 앞 8자로 판단이 끝나야 한다
    const subject = "블로그 🚨 자동생성 멈춤";

    // 하루 한 통. 같은 제목이 24시간 안에 나갔으면 건너뛴다
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count } = await admin
      .from("email_log")
      .select("id", { count: "exact", head: true })
      .eq("subject", subject)
      .gte("created_at", since);
    if ((count ?? 0) > 0) return;

    const { mailShell, sendMail } = await import("@/lib/mail");
    await sendMail({
      kind: "other",
      to: process.env.ADMIN_EMAIL ?? "ceo@h-grs.com",
      subject,
      html: mailShell(`
        <p style="margin:0 0 8px;font-size:19px;font-weight:800">원고 생성이 멈췄습니다</p>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.8;color:#4b5563">
          API 가 거절했습니다. <b>손을 대기 전까지 계속 실패</b>하고, 그동안 매일 한 편씩 빕니다.
        </p>
        <div style="margin:0 0 22px;padding:16px 18px;background:#fef2f2;border-radius:12px;font-size:13px;line-height:1.8;color:#991b1b;white-space:pre-wrap">${note.slice(0, 500)}</div>
        <a href="https://platform.openai.com/settings/organization/billing/overview"
           style="display:inline-block;background:#0a0a0c;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:700">
          OpenAI 크레딧 충전하기
        </a>
        <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;line-height:1.7">
          충전하시면 다음 5분 안에 자동으로 다시 시작합니다. 따로 누르실 것은 없습니다.<br>
          이 메일은 하루 한 통만 갑니다.
        </p>
      `),
    });
  } catch {
    // 알림을 보내려다 라우트를 죽이지 않는다
  }
}

/**
 * cron 라우트 본문을 감싼다. 던져진 예외를 200 + 로그로 바꾼다.
 *
 * `skipped`(할 일 없음)는 로그에 남기지 않는다. 5분마다 도는 cron 이
 * 하루 288줄씩 "할 일 없음" 을 쌓으면 정작 봐야 할 실패가 묻힌다.
 */
export function cronRoute(
  route: string,
  work: (
    now: Date,
    request: Request,
  ) => Promise<{
    note?: string;
    /** 이 호출이 정상이었나. 안 주면 정상으로 본다 */
    ok?: boolean;
    body: Record<string, unknown>;
  }>,
) {
  return async function GET(request: Request) {
    if (!cronAuthorized(request)) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401, headers: NO_STORE },
      );
    }

    try {
      const result = await work(new Date(), request);
      if (result.note) await opsLog(route, result.ok ?? true, result.note);
      return NextResponse.json(result.body, { headers: NO_STORE });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await opsLog(route, false, message);
      // 200 이다. 실패했다는 사실은 body 와 로그에 남는다
      return NextResponse.json(
        { ok: false, error: message.slice(0, 300) },
        { headers: NO_STORE },
      );
    }
  };
}
