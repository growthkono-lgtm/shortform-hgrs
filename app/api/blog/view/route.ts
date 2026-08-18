import { NextResponse } from "next/server";

import { kstParts } from "@/lib/blog-schedule";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/blog/view — 조회 1 올린다. (2026-08-14)
 *
 * 리포트 메일에 조회수를 실으려면 숫자가 있어야 하는데, Search Console 은
 * 아직 연결 전이고 **추정치를 적는 것은 금지**다. [[feedback_no_fabricated_metrics]]
 * 그래서 제일 확실한 것부터 센다 — 우리 페이지가 실제로 열린 횟수.
 *
 * 왜 서버 컴포넌트에서 안 세는가: 발행면은 정적으로 굽고 CDN 이 그대로
 * 내주기 때문에, 페이지 코드는 방문자 수만큼 돌지 않는다. 브라우저가
 * 한 번 두드려 줘야 실측이 된다.
 *
 * 봇은 세지 않는다. 완벽할 수는 없지만(헤드리스는 UA 를 속인다) 크롤러가
 * 만드는 대부분의 뻥튀기는 여기서 걸린다. 남는 오차는 실제보다 **적게**
 * 세는 쪽이라 리포트 숫자를 부풀리지 않는다.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOT = /bot|crawler|spider|crawling|slurp|facebookexternalhit|preview|monitor|curl|wget|python|headless/i;

export async function POST(request: Request) {
  const ua = request.headers.get("user-agent") ?? "";
  if (BOT.test(ua)) return NextResponse.json({ counted: false });

  let slug = "";
  try {
    slug = String(((await request.json()) as { slug?: string }).slug ?? "");
  } catch {
    return NextResponse.json({ counted: false }, { status: 400 });
  }

  // 슬러그는 우리가 만든 값이라 형태가 정해져 있다. 그 밖의 값은 받지 않는다 —
  // 아무 문자열이나 받으면 표가 남의 쓰레기로 찬다
  if (!/^[a-z0-9-]{3,120}$/.test(slug)) {
    return NextResponse.json({ counted: false }, { status: 400 });
  }

  const { year, month, day } = kstParts(new Date());
  const kstDay = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  await createAdminClient().rpc("blog_view_bump", { p_slug: slug, p_day: kstDay });

  return NextResponse.json({ counted: true });
}
