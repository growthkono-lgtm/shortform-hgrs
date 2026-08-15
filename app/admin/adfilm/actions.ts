"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/supabase/auth";
import { adfilmTable } from "@/lib/adfilm-db";
import { createAdminClient } from "@/lib/supabase/server";
import { adFormat, sourceSeconds } from "@/lib/adfilm-formats";
import { analyzeProductUrl } from "@/lib/adfilm-detail";
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
  shotResult,
  shotStatus,
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

/**
 * 링크 하나로 기획안 채우기. (2026-08-16 신설)
 *
 * ── 이 버튼이 이 제품의 전부다 ────────────────────────────────────────
 * 사장님 지시: *"상세페이지 링크 하나 주고 브랜드 정보 입력해서 주고
 * 영상 유형과 제작 목표 이렇게 칸에 각각 넣어주면 상세페이지 분석해서
 * 컨셉이니 USP니 특장점이니 해서 기획안 최종 잡고, 그거 정리해서
 * 스토리보드 혹은 콘티로 구성한 다음에 영상 제작으로 들어가라고."*
 *
 * 그 전에는 내가 상세페이지를 텍스트로만 긁어 보고 "이미지라 정보가 없다"며
 * 넘어갔다. 국내 상세페이지는 거의 전부 이미지라 그렇게 하면 아무것도 못 읽는다.
 * `lib/adfilm-detail.ts` 가 이미지를 받아 판독한다 —
 * 2026-08-16 실측에서 23장을 읽어 임상 수치(+41%)까지 뽑아냈다.
 *
 * **덮어쓰지 않는다.** 사람이 이미 적은 칸은 그대로 두고 빈 칸만 채운다.
 * 사장님 디렉션이 자동 분석에 지워지면 안 된다.
 */
export async function fillBriefFromUrl(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const url = String(formData.get("productUrl") ?? "").trim();
  const goal = String(formData.get("goal") ?? "").trim();
  if (!id) throw new Error("id 가 없습니다.");
  if (!/^https?:\/\//.test(url)) throw new Error("상세페이지 주소를 넣어 주세요.");

  const { data: film } = await adfilmTable()
    .select("id, brief, format")
    .eq("id", id)
    .maybeSingle();
  if (!film) throw new Error("편을 찾지 못했습니다.");

  const { analysis } = await analyzeProductUrl(url, { goal });
  const brief = film.brief as AdBrief;
  const f = adFormat(film.format);

  /** 사람이 적은 값이 있으면 손대지 않는다 */
  const keep = (mine: string | undefined, auto: string) =>
    mine && mine.trim() ? mine : auto;

  /**
   * 팩트를 대사 검사에 걸리는 형태로 옮긴다.
   * `mustSay` 를 켜 두는 것이 핵심이다 — 그래야 "제품 설명이 없다" 가 재발하지 않는다.
   * 판정 낱말은 값에서 뽑되, 사람이 화면에서 고칠 수 있다.
   */
  const autoFacts = [
    ...analysis.functions.slice(0, 2).map((v) => ({ label: "기능", value: v })),
    ...analysis.facts.slice(0, 6),
    ...analysis.trust.slice(0, 3).map((v) => ({ label: "신뢰", value: v })),
  ].map((x) => ({
    label: x.label,
    value: x.value,
    source: "상세페이지",
    mustSay: true,
    // 값에서 두 글자 이상 낱말을 추려 판정어로 쓴다
    keywords: (x.value.match(/[가-힣A-Za-z0-9]{2,}/g) ?? []).slice(0, 4),
  }));

  const filled: AdBrief = {
    ...brief,
    format: f.key,
    product: keep(brief.product, analysis.what.slice(0, 80)),
    usp: keep(brief.usp, analysis.headline),
    audience: keep(brief.audience, analysis.audience.join(" · ")),
    evidence: keep(brief.evidence, analysis.trust.join(" / ")),
    tpo: keep(brief.tpo, analysis.problems.slice(0, 4).join(" · ")),
    facts: brief.facts?.length ? brief.facts : autoFacts,
    climax: {
      before: keep(brief.climax?.before, analysis.problems[0] ?? ""),
      after: keep(brief.climax?.after, "안정감을 느끼는 모습"),
    },
  };

  await adfilmTable()
    .update({
      brief: filled as never,
      // 분석 원문을 남긴다 — 나중에 "이 문구 어디서 왔냐" 를 추적할 수 있어야 한다
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath(`/admin/adfilm/${id}`);
}

/**
 * 클라이언트가 적어 낸 것을 기획안으로 끌어온다. (2026-08-16 신설)
 *
 * ── 사장님이 그린 흐름 ────────────────────────────────────────────────
 * *"클라가 AI영상을 구매하면 브랜드정보 제품 등 입력해 넣을 거고, 그럼 너는
 * 기획안을 프롬프트화 할 수 있게끔 구성해야 하고 … 물론 클라가 입력하는 것
 * 외에 나도 디렉션 줄 거고."*
 *
 * 클라 입력은 이미 `project_guidelines` 표에 있다(브랜드 소개·타겟·USP·톤·
 * 금지사항·레퍼런스). 새 표를 만들 이유가 없다 — 그 값을 기획안 칸으로 옮긴다.
 *
 * **상세페이지 자동 분석과 순서가 중요하다.**
 *   ① 링크 분석  → 제품 팩트·기능·신뢰 (브랜드가 파는 것)
 *   ② 클라 입력  → 톤·금지사항·타겟 (브랜드가 원하는 것)
 * 클라가 직접 적은 값이 자동 분석보다 세다. 그래서 이 함수가 나중에 덮는다.
 */
export async function pullClientBrief(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const projectId = String(formData.get("projectId") ?? "").trim();
  if (!id) throw new Error("id 가 없습니다.");
  if (!projectId) throw new Error("프로젝트를 지정해 주세요.");

  const supabase = createAdminClient();
  const { data: g } = await supabase
    .from("project_guidelines")
    .select("brand_intro, target, usp, tone, forbidden, reference_urls, extra")
    .eq("project_id", projectId)
    .maybeSingle();
  if (!g) throw new Error("이 프로젝트에 클라이언트 입력이 아직 없습니다.");

  const { data: film } = await adfilmTable()
    .select("id, brief")
    .eq("id", id)
    .maybeSingle();
  if (!film) throw new Error("편을 찾지 못했습니다.");

  const brief = film.brief as AdBrief;
  const take = (v: string | null, fallback: string) =>
    v && v.trim() ? v.trim() : fallback;

  const merged: AdBrief = {
    ...brief,
    // 클라가 적은 값이 있으면 그걸 쓴다 — 자동 분석보다 세다
    audience: take(g.target, brief.audience),
    usp: take(g.usp, brief.usp),
    product: take(g.brand_intro, brief.product),
    talent: brief.talent,
  };

  /**
   * 금지사항은 팩트가 아니라 **제약**이다. 팩트 칸에 섞으면 대사에 들어가라는
   * 뜻이 되어 버린다. 톤·금지는 T.P.O 뒤에 붙여 프롬프트에 실린다.
   */
  const constraints = [
    g.tone ? `톤: ${g.tone}` : "",
    g.forbidden ? `금지: ${g.forbidden}` : "",
    g.extra ? `요청: ${g.extra}` : "",
  ]
    .filter(Boolean)
    .join(" / ");
  if (constraints) {
    merged.tpo = brief.tpo ? `${brief.tpo} · ${constraints}` : constraints;
  }

  await adfilmTable()
    .update({
      brief: merged as never,
      project_id: projectId,
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath(`/admin/adfilm/${id}`);
}

/**
 * 생성 상태를 확인하고 끝난 것을 거둬들인다. (2026-08-16 신설)
 *
 * `generateShots()` 는 큐에 넣기만 하고 기다리지 않는다(한 컷이 2~15분이라
 * 서버 액션이 붙들면 함수 제한에 걸린다). 그래서 **거두는 손이 따로 필요하다.**
 * 어드민에서 이 버튼을 누르면 각 요청의 상태를 물어보고, 완성된 것의 영상 주소와
 * seed 를 표에 적는다.
 *
 * seed 를 남기는 이유: **같은 컷을 다시 뽑을 수 있어야 상품이 된다.**
 * 클라이언트가 "저 컷만 다시" 라고 할 때 나머지를 안 건드리려면 이 값이 있어야 한다.
 */
export async function collectShots(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("id 가 없습니다.");

  const { data: film } = await adfilmTable()
    .select("id, shots")
    .eq("id", id)
    .maybeSingle();
  if (!film) throw new Error("편을 찾지 못했습니다.");

  const shots = (film.shots ?? []) as {
    no: number;
    requestId: string;
    statusUrl: string;
    responseUrl: string;
    endpoint: string;
    prompt: string;
    line?: string;
    videoUrl?: string;
    seed?: number | null;
    status?: string;
  }[];
  if (!shots.length) throw new Error("생성된 작업이 없습니다.");

  let done = 0;
  let failed = 0;
  for (const s of shots) {
    if (s.videoUrl) {
      done += 1;
      continue; // 이미 거둔 것은 다시 묻지 않는다
    }
    try {
      const st = await shotStatus({
        requestId: s.requestId,
        statusUrl: s.statusUrl,
        responseUrl: s.responseUrl,
        endpoint: s.endpoint,
        estimatedCost: 0,
      });
      s.status = st.status;
      if (st.status === "COMPLETED") {
        const r = await shotResult(
          {
            requestId: s.requestId,
            statusUrl: s.statusUrl,
            responseUrl: s.responseUrl,
            endpoint: s.endpoint,
            estimatedCost: 0,
          },
          s.prompt,
        );
        s.videoUrl = r.videoUrl;
        s.seed = r.seed;
        done += 1;
      } else if (st.status === "FAILED") {
        failed += 1;
      }
    } catch (e) {
      // 한 컷 조회 실패로 전체를 버리지 않는다. 다음 호출에서 다시 묻는다
      s.status = `조회 실패: ${(e as Error).message.slice(0, 80)}`;
    }
  }

  const all = done === shots.length;
  await adfilmTable()
    .update({
      shots: shots as never,
      stage: all ? "composing" : failed ? "failed" : "generating",
      last_error: failed ? `${failed}개 컷이 생성에 실패했습니다` : null,
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
