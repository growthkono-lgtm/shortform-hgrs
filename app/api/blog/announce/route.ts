import { cronRoute } from "@/lib/blog-ops";
import { QUIET_END_HOUR, QUIET_START_HOUR, inQuietHours } from "@/lib/blog-schedule";
import { mailShell, sendMail } from "@/lib/mail";
import { createAdminClient } from "@/lib/supabase/server";
import { SERVICE } from "@/lib/constants";

/**
 * GET /api/blog/announce — 발행된 글을 구독자에게 알린다. (2026-08-13)
 *
 * cron-job.org 가 주기적으로 부른다. 매번 "발행됐는데 아직 안 알린 글"을 찾는다.
 *
 * **밤에는 보내지 않는다.** 사장님 지시: 저녁 8시~다음 날 오전 10시는 피한다.
 * B2B 대상 메일이 밤 11시에 도착하면 그 자체가 브랜드 인상을 깎는다.
 * 그 시간대에 발행되면 보내지 않고 그냥 다음 차례를 기다린다 — 아침 10시가
 * 지나서 cron 이 다시 돌 때 그때 나간다.
 *
 * 중복 발송은 `blog_notice_log` 로 막는다. 조용한 시간을 기다리는 동안 cron 이
 * 여러 번 도는데, 이 표가 없으면 창이 열린 순간 여러 통이 동시에 나간다.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = cronRoute("announce", async (now) => {
  if (inQuietHours(now)) {
    return {
      body: {
        sent: 0,
        skipped: "quiet-hours",
        window: `${QUIET_START_HOUR}시~${QUIET_END_HOUR}시에는 보내지 않습니다`,
      },
    };
  }

  const supabase = createAdminClient();

  // 발행됐지만 알림 이력이 없는 글. 오래된 글까지 거슬러 올라가지 않는다 —
  // 이 기능을 붙이기 전에 발행된 글을 지금 와서 알리면 구독자가 놀란다
  const since = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();
  const { data: posts, error } = await supabase
    .from("blog_post")
    .select("id, title, slug, seq, kind, published_at, body")
    .eq("status", "published")
    .gte("published_at", since)
    .order("published_at", { ascending: true })
    .limit(5);

  if (error) throw new Error(`발행 글 조회 실패: ${error.message}`);

  const { data: logged } = await supabase
    .from("blog_notice_log")
    .select("post_id");
  const already = new Set((logged ?? []).map((r) => r.post_id));
  const fresh = (posts ?? []).filter((p) => !already.has(p.id));

  if (fresh.length === 0) return { body: { sent: 0 } };

  const { data: subs } = await supabase
    .from("blog_subscriber")
    .select("email")
    .is("unsubscribed_at", null);

  const recipients = (subs ?? []).map((s) => s.email);

  let sent = 0;
  for (const post of fresh) {
    // 구독자가 없어도 이력은 남긴다. 안 그러면 첫 구독자가 생긴 순간
    // 그동안 쌓인 글이 한꺼번에 나간다
    if (recipients.length > 0) {
      const lead =
        (post.body ?? "")
          .split(/\n\s*\n/)
          .map((b) => b.trim())
          .find((b) => b && !b.startsWith("#") && !b.startsWith(":::") && !b.startsWith("📖"))
          ?.replace(/\*\*/g, "")
          .slice(0, 140) ?? "";

      const label = post.kind === "story" ? "고객 이야기" : "새 인사이트";
      const num = post.seq ? `#${post.seq} ` : "";

      const html = mailShell(`
        <p style="margin:0 0 6px;font-size:12px;color:#6b7280;letter-spacing:0.04em">${label}</p>
        <p style="margin:0 0 14px;font-size:19px;font-weight:700;line-height:1.45">${num}${post.title}</p>
        <p style="margin:0 0 24px;font-size:14px;line-height:1.8;color:#4b5563">${lead}…</p>
        <a href="${SERVICE.url}/blog/${post.slug}"
           style="display:inline-block;background:#0a0a0c;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:700">
          읽으러 가기
        </a>
        <p style="margin:28px 0 0;font-size:12px;line-height:1.7;color:#9ca3af">
          해그로시 신규 컨텐츠 알림입니다. 새 글이 올라갈 때만 보내 드립니다.
          받지 않으시려면 이 메일에 회신해 주세요.
        </p>
      `);

      for (const to of recipients) {
        const result = await sendMail({
          kind: "other",
          to,
          subject: `${num}${post.title}`,
          html,
        });
        if (result.ok || result.skipped) sent += 1;
      }
    }

    await supabase
      .from("blog_notice_log")
      .insert({ post_id: post.id, recipients: recipients.length });
  }

  return {
    note: `구독 알림 ${fresh.length}편 × ${recipients.length}명 = ${sent}통`,
    body: { posts: fresh.length, sent },
  };
});
