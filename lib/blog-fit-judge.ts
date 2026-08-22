import "server-only";

import { respond } from "@/lib/blog-ai";
import {
  FIT_AXES,
  FIT_PASS_SCORE,
  FIT_REQUIRED_AXES,
  fitBriefing,
  isFitPass,
  type FitAxis,
  type FitContext,
} from "@/lib/blog-fit";
import type { Source } from "@/lib/blog-sources";

/**
 * **적합성 2차 판정 — 제작·배포 단계.** (2026-08-22)
 *
 * 사장님: *"이중으로 기획수집단계에서 한번 제작배포단계에서 한번해서
 * 더블체크하고 배포해."*
 *
 * 1차는 프롬프트가 본다(`fitBriefing` 이 조사·기획에 들어간다). 그건 **지시**일
 * 뿐이고 지켜졌는지는 아무도 세지 않았다. 08-22 에 6축을 만들면서 프롬프트에만
 * 넣고 검사식에는 안 넣었다 — 이중이라고 보고했지만 실제로는 1차만 있었다.
 *
 * 여기가 2차다. **완성 원고에 실제로 인용된 자료**를 다시 6축에 대조한다.
 *
 * ── 왜 정규식이 아니라 모델인가 ───────────────────────────────────────
 * "에어컨 A/S 안내 영상이 블로그 운영 글에 맞나" 는 문자열로 못 잰다.
 * 개수·연도·해상도는 코드가 세고, **의미가 맞는지는 모델이 판정한다.**
 * 대신 판정 근거를 남겨서 왜 떨어졌는지 사람이 읽을 수 있게 한다.
 */

const VERDICT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["verdicts"],
  properties: {
    verdicts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["index", "axes", "reason"],
        properties: {
          index: { type: "integer", description: "자료 번호 (1부터)" },
          axes: {
            type: "object",
            additionalProperties: false,
            required: FIT_AXES.map((a) => a.key),
            properties: Object.fromEntries(
              FIT_AXES.map((a) => [a.key, { type: "boolean" }]),
            ),
          },
          reason: { type: "string", description: "떨어졌으면 왜인지 한 줄. 통과면 빈 문자열" },
        },
      },
    },
  },
} as const;

export type FitJudgement = {
  index: number;
  source: Source;
  axes: Partial<Record<FitAxis, boolean>>;
  pass: boolean;
  reason: string;
};

/**
 * 인용된 자료를 6축에 대조한다.
 *
 * **판정을 못 하면 통과시킨다.** 모델 호출이 실패했다고 멀쩡한 원고를 막으면
 * 그날 글이 통째로 안 나간다 — 자료 적합성은 중요하지만 발행을 멈출 만큼은
 * 아니다. 대신 그 사실을 `reason` 에 남긴다.
 */
export async function judgeSourceFit(input: {
  fit: FitContext;
  sources: Source[];
  /** 본문에서 실제로 인용된 번호만 넘긴다 */
  citedIndexes: number[];
}): Promise<FitJudgement[]> {
  const cited = input.citedIndexes
    .map((n) => ({ n, s: input.sources[n - 1] }))
    .filter((x): x is { n: number; s: Source } => Boolean(x.s));

  if (!cited.length) return [];

  const list = cited
    .map(
      ({ n, s }) =>
        `[${n}] (${s.kind}) ${s.author ?? "출처 미상"} — ${s.title}\n     기준: ${s.basis}`,
    )
    .join("\n");

  try {
    const { text } = await respond({
      model: "gpt-5-mini",
      maxOutputTokens: 6000,
      effort: "low",
      timeoutMs: 2 * 60 * 1000,
      label: "적합성 2차",
      schema: { name: "fit_verdicts", schema: VERDICT_SCHEMA },
      instructions: `너는 콘텐츠 편집자다. 글에 인용된 자료가 **그 글에 맞는지** 판정한다.

${fitBriefing(input.fit)}

각 자료마다 여섯 축을 true/false 로 답한다. 애매하면 **false** 로 둔다 —
안 맞는 자료가 나가는 것이 맞는 자료를 놓치는 것보다 나쁘다.
떨어진 자료는 **왜 안 맞는지 한 줄**로 적는다.`,
      message: `[인용된 자료]\n${list}`,
    });

    const parsed = JSON.parse(text) as {
      verdicts: { index: number; axes: Record<string, boolean>; reason: string }[];
    };

    return cited.map(({ n, s }) => {
      const v = parsed.verdicts.find((x) => x.index === n);
      const axes = (v?.axes ?? {}) as Partial<Record<FitAxis, boolean>>;
      return {
        index: n,
        source: s,
        axes,
        pass: v ? isFitPass(axes) : true,
        reason: v?.reason ?? "",
      };
    });
  } catch (e) {
    // 판정을 못 했다고 발행을 막지 않는다. 사실만 남긴다
    return cited.map(({ n, s }) => ({
      index: n,
      source: s,
      axes: {},
      pass: true,
      reason: `적합성 판정 실패 — ${e instanceof Error ? e.message : String(e)}`,
    }));
  }
}

/** 판정 결과를 검사식 문구로 */
export function fitFindings(judgements: FitJudgement[]): string[] {
  const failed = judgements.filter((j) => !j.pass);
  if (!failed.length) return [];
  return failed.map((j) => {
    const missed = FIT_AXES.filter((a) => !j.axes[a.key]).map((a) => a.label);
    const required = FIT_REQUIRED_AXES.filter((k) => !j.axes[k]);
    return (
      `자료 ${j.index} [${j.source.author}] ${j.source.title?.slice(0, 26)} — ` +
      `적합성 ${FIT_AXES.length - missed.length}/${FIT_AXES.length} (기준 ${FIT_PASS_SCORE})` +
      (required.length ? ` · 필수축 미달(${required.join("·")})` : "") +
      (j.reason ? ` — ${j.reason}` : "")
    );
  });
}
