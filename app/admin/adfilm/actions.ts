"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/supabase/auth";
import { adfilmTable } from "@/lib/adfilm-db";
import { adFormat, sourceSeconds } from "@/lib/adfilm-formats";
import {
  blankBrief,
  briefBlocked,
  compileBrief,
  validateBrief,
  type AdBrief,
} from "@/lib/adfilm-brief";
import {
  GEN_COST,
  assertWithinBudget,
  shotCost,
  submitShot,
  type Tier,
} from "@/lib/adfilm-gen";

/**
 * AI 광고영상 어드민 액션. (2026-08-16)
 *
 * ── 이 파일이 지키는 것 하나 ──────────────────────────────────────────
 * **기획안이 검사를 통과하기 전에는 생성을 부르지 않는다.**
 *
 * 2026-08-15~16 에 돈이 샌 경로가 정확히 이것이었다 — 대본을 확정하지 않고
 * 발화 컷을 뽑았고, 사장님이 대사를 고치자 그 컷들이 통째로 폐기됐다.
 * 대본은 공짜고 컷은 $1.5 다. 순서가 거꾸로였다.
 *
 * 그래서 `generateShots()` 는 맨 앞에서 `validateBrief()` 를 다시 돌린다.
 * 화면에서 버튼을 감추는 것으로는 부족하다 — 액션이 직접 불릴 수 있다.
 */


/** 새 편 — 유형만 고르면 그 유형의 빈 기획안이 앉는다 */
export async function createFilm(formData: FormData) {
  await requireAdmin();

  const format = String(formData.get("format") ?? "ugc");
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("이름을 적어 주세요.");

  const f = adFormat(format); // 알 수 없는 유형이면 여기서 멈춘다
  const { data, error } = await adfilmTable()
    .insert({
      title,
      format: f.key,
      brief: blankBrief(f.key) as never,
      stage: "draft",
    })
    .select("id")
    .single();

  if (error) throw new Error(`등록 실패: ${error.message}`);
  revalidatePath("/admin/adfilm");
  redirect(`/admin/adfilm/${data.id}`);
}

/**
 * 기획안 저장. **검사에 걸려도 저장은 된다** —
 * 초안을 못 적게 막으면 아무도 안 쓴다. 막는 건 생성이다.
 */
export async function saveBrief(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const raw = String(formData.get("brief") ?? "");
  if (!id) throw new Error("id 가 없습니다.");

  let brief: AdBrief;
  try {
    brief = JSON.parse(raw) as AdBrief;
  } catch {
    throw new Error("기획안 형식이 깨졌습니다 (JSON 파싱 실패).");
  }

  const { error } = await adfilmTable()
    .update({
      brief: brief as never,
      format: brief.format,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(`저장 실패: ${error.message}`);
  revalidatePath(`/admin/adfilm/${id}`);
}

/** 이번 달 이 표에서 쓴 총액 — 상한 판정에 쓴다. 추정하지 않는다 */
async function monthSpend(): Promise<number> {
  const from = new Date();
  from.setUTCDate(1);
  const { data } = await adfilmTable()
    .select("cost_usd")
    .gte("created_at", from.toISOString().slice(0, 10));
  return (data ?? []).reduce((s, r) => s + Number(r.cost_usd ?? 0), 0);
}

/**
 * 샷 생성 — 기획안이 검사를 통과할 때만 부른다.
 *
 * 생성은 큐에 넣기만 하고 기다리지 않는다. 컷 하나가 2~3분이라
 * 서버 액션이 붙들고 있으면 함수 제한에 걸린다.
 */
export async function generateShots(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const tier = (String(formData.get("tier") ?? "standard") as Tier) ?? "standard";
  if (!id) throw new Error("id 가 없습니다.");

  const { data: film } = await adfilmTable()
    .select("id, brief, cost_usd, shots")
    .eq("id", id)
    .maybeSingle();
  if (!film) throw new Error("편을 찾지 못했습니다.");

  const brief = film.brief as AdBrief;

  // ⚠️ 화면에서 버튼을 감춘 것만 믿지 않는다. 여기서 다시 센다
  const issues = validateBrief(brief);
  if (briefBlocked(issues)) {
    throw new Error(
      "기획안이 아직 규격 미달입니다 — " +
        issues
          .filter((x) => x.level === "block")
          .map((x) => x.message)
          .join(" / "),
    );
  }

  const compiled = compileBrief(brief);
  const f = compiled.format;

  // 레퍼런스는 URL 이어야 한다. 어드민에서 올린 것만 쓴다
  const imageUrls = compiled.refs
    .filter((r) => r.tag.startsWith("[Image"))
    .map((r) => r.file);
  if (imageUrls.some((u) => !/^https?:\/\//.test(u))) {
    throw new Error(
      "레퍼런스가 아직 업로드되지 않았습니다 — 자산 칸에서 파일을 올려 주세요.",
    );
  }

  // ── 돈. 부르기 전에 막는다
  const about = compiled.prompts.reduce(
    (s, p) => s + shotCost({ seconds: p.seconds, tier, hasVideoRef: false }),
    0,
  );
  assertWithinBudget({
    spentThisMonth: await monthSpend(),
    spentOnThisFilm: Number(film.cost_usd ?? 0),
    aboutToSpend: about,
  });

  const jobs: unknown[] = [];
  for (const p of compiled.prompts) {
    const job = await submitShot({
      prompt: p.prompt,
      seconds: p.seconds,
      imageUrls,
      tier,
      generateAudio: f.audio === "onscreen",
    });
    jobs.push({
      no: p.no,
      requestId: job.requestId,
      statusUrl: job.statusUrl,
      responseUrl: job.responseUrl,
      endpoint: job.endpoint,
      prompt: p.prompt,
      line: p.line,
      estimated: job.estimatedCost,
    });
  }

  await adfilmTable()
    .update({
      shots: jobs as never,
      stage: "generating",
      seconds: sourceSeconds(f),
      cost_usd: Number((Number(film.cost_usd ?? 0) + about).toFixed(4)),
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath(`/admin/adfilm/${id}`);
}

/** 한 편 지우기 — 실수로 만든 초안 정리용 */
export async function deleteFilm(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await adfilmTable().delete().eq("id", id);
  revalidatePath("/admin/adfilm");
  redirect("/admin/adfilm");
}

/** 예산 표시용 — 화면이 상한을 같이 보여 줘야 사람이 판단한다 */
export async function budgetSnapshot() {
  await requireAdmin();
  return { month: await monthSpend(), limits: GEN_COST };
}
