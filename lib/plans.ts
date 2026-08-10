import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { SERVICE } from "@/lib/constants";

export type PlanRow = Database["public"]["Tables"]["plans"]["Row"];

/** URL 슬러그: `full-growth`, `shorts_only-20` — 첫 하이픈에서 나눈다 */
export function parsePlanSlug(slug: string): { code: string; tier: string } | null {
  const i = slug.indexOf("-");
  if (i < 1) return null;
  const code = slug.slice(0, i);
  const tier = slug.slice(i + 1);
  if (code !== "full" && code !== "shorts_only") return null;
  if (!tier) return null;
  return { code, tier };
}

export function planSlug(plan: Pick<PlanRow, "code" | "tier">) {
  return `${plan.code}-${plan.tier}`;
}

/**
 * 플랜을 DB에서 읽는다.
 * **결제 금액의 유일한 출처** — 클라이언트가 보낸 금액은 절대 신뢰하지 않는다 (PART F3).
 */
export async function getPlanBySlug(slug: string): Promise<PlanRow | null> {
  const parsed = parsePlanSlug(slug);
  if (!parsed) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("plans")
    .select("*")
    .eq("code", parsed.code)
    .eq("tier", parsed.tier)
    .eq("active", true)
    .maybeSingle();

  return data;
}

export async function getActivePlans(): Promise<PlanRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("plans")
    .select("*")
    .eq("active", true)
    .order("code")
    .order("sort_order");

  return data ?? [];
}

export const formatKRW = (won: number) => `₩${won.toLocaleString("ko-KR")}`;

export function planOrderName(plan: PlanRow) {
  const base = plan.code === "full" ? "패키지 플랜" : "싱글 플랜";
  // 결제창·영수증에 찍히는 상품명이다. 서비스명은 한 곳(SERVICE.name)에서만 읽는다
  return `${SERVICE.name} — ${base} ${plan.label}`;
}
