/**
 * 기획안 규격 — 2026-08-15 신설. 이번 개편의 심장이다.
 *
 * ── 사장님 요구 ───────────────────────────────────────────────────────
 *   *"난 어떤 기획안이 필요한지, 그리고 기획안에 따라 완벽하게 의도한 대로
 *    영상이 나오길 원해."*
 *
 * ── 지금까지 왜 안 그랬나 ─────────────────────────────────────────────
 * `adfilm-spec.ts` 에 `REQUIRED_BRIEF` 8항목이 있다. 그런데 `blankStoryboard()`
 * 는 컷 5개를 **`prompt: ""` 로 반환한다.** 사람이 그 빈칸을 손으로 채운다.
 *
 * 즉 **기획안에서 프롬프트로 가는 길이 아예 없었다.** 사장님이 주신 정보는
 * 기획안 칸에 적히고, 프롬프트는 그와 무관하게 손으로 쓰였다. 그래서
 * *"내가 정보를 다 준 것들, 요청한 것들이 제대로 반영 안 된다"* 가 나왔다.
 * 프롬프트 문장력의 문제가 아니라 **배관이 없었던 것**이다.
 *
 * ── 그래서 이 파일이 하는 일 ──────────────────────────────────────────
 * 기획안을 채우면 **프롬프트가 생성된다.** 사람이 프롬프트를 따로 쓰지 않는다.
 * 그리고 칸이 비면 `validateBrief()` 가 생성을 막는다 — 만들고 나서
 * "이게 빠졌네" 를 발견하면 그때는 영상값을 이미 다 쓴 뒤다.
 *
 * ── 왜 레퍼런스 태그인가 ──────────────────────────────────────────────
 * Seedance 2.5 는 프롬프트 안에서 `[Image1]`·`[Video1]`·`[Audio1]` 로 레퍼런스를
 * 지목한다(이미지 30 / 비디오 10 / 오디오 10). **"의도한 대로"를 만드는 유일한
 * 메커니즘이 이것**이라 파일 순서를 여기서 결정론적으로 고정한다. 순서가 흔들리면
 * 같은 기획안이 다른 영상을 낸다.
 */

import { adFormat, disclosureText, type AdFormat } from "./adfilm-formats";

/** 기획안에 붙는 자산 한 건 */
export type BriefAsset = {
  /** 레퍼런스 슬롯 key (adfilm-formats 의 RefSlot.key) */
  slot: string;
  /** 작업 폴더 기준 파일명 */
  file: string;
};

/** 샷 하나에 기획자가 적는 것 */
export type BriefShot = {
  no: number;
  /** 카메라 — 어떻게 잡는가 */
  camera: string;
  /** 인물·사물이 무엇을 하는가 */
  action: string;
  /**
   * **화면에 반드시 보여야 하는 것.** 이 줄이 "의도한 대로"의 전부다.
   * 비면 검증에서 막는다 — 모델은 안 적힌 걸 알아서 넣어 주지 않는다.
   */
  must: string;
  /** 이 샷에서 인물이 하는 말. 없으면 빈 문자열 */
  line: string;
};

/**
 * 제품 팩트 한 줄 — 기획안 칸 1.
 *
 * `mustSay: true` 면 **이 팩트가 대사 어딘가에 나와야 한다.** 안 나오면
 * `validateBrief()` 가 생성을 막는다.
 *
 * ── 왜 이 장치가 생겼나 (2026-08-16) ──────────────────────────────────
 * 사장님 지적: *"왜 자꾸 제품을 먹이는 거 아니다 안정제 아니다 라고 하고
 * 제품에 대한 설명은 안 해?"*
 *
 * 원인은 기획안 칸 1(제품 팩트)이 대사로 내려가는 길이 없었던 것이다.
 * 펠리웨이 패키지에 기능이 넷(긁기·소변마킹·숨기·환경변화) 인쇄돼 있는데
 * 원고에 하나도 안 들어가고 부정형("~아니다")만 두 번 반복됐다.
 * 사람이 기억해서 넣는 구조면 또 빠진다. 그래서 센다.
 */
export type ProductFact = {
  label: string;
  value: string;
  /** 근거 — 패키지·공식·임상 중 어디서 왔는가. 비면 검증에서 경고 */
  source: string;
  /** 대사에 반드시 등장해야 하는가 */
  mustSay: boolean;
  /** 대사에 등장했는지 판정할 낱말들. 하나라도 걸리면 통과 */
  keywords: string[];
};

/**
 * 타겟 한 명 — 2026-08-16 신설.
 *
 * ── 왜 여러 명인가 ────────────────────────────────────────────────────
 * `audience` 는 문자열 한 칸이었다. 그래서 "문제행동으로 힘든 집사"처럼
 * 뭉뚱그린 한 줄이 들어갔고, 그 한 줄로 광고 하나를 만들었다.
 *
 * 실제로는 **같은 제품도 사는 이유가 다르다.** 펠리웨이만 해도 상세페이지가
 * 추천 대상을 8가지로 나눠 놓았다(오줌 스프레이·스크래칭·숨기·이동 불안·
 * 새 공간 두려움·진료 안정·다묘 다툼·동물병원). 이 사람들은 겪는 장면도,
 * 검색어도, 설득 각도도 다르다. 하나로 묶으면 아무에게도 안 맞는다.
 *
 * 그래서 타겟을 여러 개 세우고 **한 편이 한 타겟을 정조준**한다.
 * 소재를 여러 편 뽑을 때 각 편이 다른 타겟을 맡으면 그 자체로 A/B 가 된다.
 */
export type AdTarget = {
  /** 화면에 뜨는 이름. 예: "이사 앞둔 집사" */
  label: string;
  /** 이 사람이 지금 겪고 있는 장면 한 문단. 광고의 훅이 여기서 나온다 */
  situation: string;
  /** 왜 이 사람인가 — 판단 근거. 지어내지 않고 상세페이지·리뷰에서 가져온다 */
  reason: string;
  /** 이 편이 정조준하는 타겟인가. 정확히 하나만 true */
  primary: boolean;
};

/**
 * 소구점 — 타겟을 설득하는 논리 하나.
 *
 * **핵심 하나 + 보조 여럿** 구조다. 핵심을 중심으로 광고가 짜이고,
 * 보조는 반론을 지우거나 신뢰를 보태는 자리에만 들어간다.
 * 다 핵심이면 아무것도 핵심이 아니다.
 */
export type SellingPoint = {
  label: string;
  /** 무엇을 말하는가 */
  body: string;
  /** 근거 — 상세페이지·임상·패키지 중 어디서 왔는가 */
  source: string;
  rank: "core" | "support" | "off";
};

export type AdBrief = {
  /** 영상 유형 key */
  format: string;
  /** 칸 3 — 타겟 후보들. 정확히 하나가 primary */
  targets: AdTarget[];
  /** 칸 4 — 소구점. 정확히 하나가 core */
  points: SellingPoint[];
  /** 브랜드·제품명 (프롬프트에는 안 들어간다 — 상표를 그리게 하지 않는다) */
  product: string;
  /** 칸 1 — 제품 팩트. mustSay 인 것은 대사에 나와야 한다 */
  facts: ProductFact[];
  /** 칸 2 — 근거(임상·수치). 지어내지 않는다 */
  evidence: string;
  /** 칸 4 — 이 영상이 파는 단 하나 */
  usp: string;
  /** 칸 3 — 누가 보는가 */
  audience: string;
  /** 언제·어디서·어떤 상황 */
  tpo: string;
  /**
   * 칸 5 — 비주얼 클라이맥스. **비포와 애프터를 한 쌍으로 적는다.**
   * 사장님 지시(2026-08-16): *"비포애프터 명확히."*
   */
  climax: { before: string; after: string };
  /** 화자 설정. 얼굴이 나오는 유형에서만 쓴다 */
  talent?: { age: string; gender: string; tone: string };
  assets: BriefAsset[];
  shots: BriefShot[];
  /** 마지막에 화면에 박히는 행동 문구 */
  cta: string;
};

/* ── 촬영 톤 ──────────────────────────────────────────────────────────
 * 유형별로 갈린다. 예전엔 `FILM_TONE` 한 줄로 전부 실사 UGC 였다. */
const TONE: Record<string, string> = {
  ugc: "세로 9:16. 한국 실내 일상 공간, 자연광. 손에 든 스마트폰으로 찍은 듯한 미세한 흔들림. 브이로그 톤. 과도한 색보정·시네마틱 조명·슬로우모션 금지.",
  product:
    "세로 9:16. 제품이 화면을 채운다. 부드러운 자연광과 얕은 심도. 손 외에 인물이 등장하지 않는다.",
  demo: "세로 9:16. 한국 실내. 고정된 카메라, 같은 각도를 유지한다. 손 외에 인물이 등장하지 않는다.",
  ingredient:
    "세로 9:16. 사진 같지 않은 3D 렌더 룩. 어두운 배경에 떠 있는 입체 오브젝트. 실사를 흉내내지 않는다.",
  infographic:
    "세로 9:16. 평면적인 그래픽 룩. 단색 배경과 단순한 도형. 실사를 흉내내지 않는다.",
  story:
    "세로 9:16. 한국 실내·실외. 자연광 중심의 차분한 톤. 컷 사이 인물과 의상이 유지된다.",
};

/**
 * 어느 프롬프트에도 공통으로 깔린다.
 * 글자·상표를 모델에게 맡기지 않는 게 핵심이다 — 한글은 자모가 깨지고
 * 상표는 매번 달라진다. 둘 다 편집에서 실물로 얹는다.
 */
const COMMON_RULES = [
  "화면에 글자·자막·로고를 넣지 않는다.",
  "제품의 상표·라벨을 그리지 않는다. 라벨은 편집에서 실물 이미지로 합성한다.",
  "실존 브랜드명·실존 인물을 등장시키지 않는다.",
  "의학적 효능을 단정하는 장면을 만들지 않는다.",
].join(" ");

/**
 * 레퍼런스 매니페스트 — 자산을 `[Image1]` 번호에 결정론적으로 배정한다.
 *
 * 정렬 기준을 **유형의 슬롯 순서 → 파일명** 으로 고정한다. 기획자가 파일을
 * 추가한 순서에 의존하면 같은 기획안이 다른 번호를 받고, 그러면 같은 기획안이
 * 다른 영상을 낸다. 재현성이 상품성이라 여기서부터 못을 박는다.
 */
export type RefTag = { tag: string; file: string; slot: string; label: string };

export function referenceManifest(brief: AdBrief): RefTag[] {
  const f = adFormat(brief.format);
  const order = new Map(f.refs.map((r, i) => [r.key, i]));

  const sorted = [...brief.assets].sort((a, b) => {
    const oa = order.get(a.slot) ?? 999;
    const ob = order.get(b.slot) ?? 999;
    return oa !== ob ? oa - ob : a.file.localeCompare(b.file);
  });

  const counters: Record<string, number> = { image: 0, video: 0, audio: 0 };
  return sorted.map((asset) => {
    const slot = f.refs.find((r) => r.key === asset.slot);
    const kind = slot?.kind ?? "image";
    counters[kind] += 1;
    const name = kind === "image" ? "Image" : kind === "video" ? "Video" : "Audio";
    return {
      tag: `[${name}${counters[kind]}]`,
      file: asset.file,
      slot: asset.slot,
      label: slot?.label ?? asset.slot,
    };
  });
}

/**
 * 샷 하나의 프롬프트. **기획안 칸이 그대로 문장이 된다.**
 *
 * 레퍼런스 태그를 문장 앞에 세우는 이유: 모델은 앞쪽 토큰을 강하게 따른다.
 * 제품과 인물을 먼저 못 박고 그 다음에 행동을 지시해야 형태가 안 흔들린다.
 */
export function buildShotPrompt(brief: AdBrief, shotNo: number): string {
  const f = adFormat(brief.format);
  const shot = brief.shots.find((s) => s.no === shotNo);
  if (!shot) throw new Error(`샷 ${shotNo} 이 기획안에 없습니다`);

  const refs = referenceManifest(brief);
  const productTags = refs
    .filter((r) => r.slot.startsWith("product"))
    .map((r) => r.tag)
    .join("");
  const talentTags = refs
    .filter((r) => r.slot === "talent_face")
    .map((r) => r.tag)
    .join("");
  const spaceTags = refs
    .filter((r) => r.slot === "space")
    .map((r) => r.tag)
    .join("");

  const lines: string[] = [];

  if (productTags) lines.push(`제품은 ${productTags} 와 동일한 형태를 유지한다.`);
  if (talentTags) {
    const t = brief.talent;
    lines.push(
      `등장인물은 ${talentTags} 와 동일 인물이다.` +
        (t ? ` ${t.age} ${t.gender}, ${t.tone}.` : ""),
    );
  }
  if (spaceTags) lines.push(`장소는 ${spaceTags} 와 같은 공간이다.`);

  lines.push(TONE[f.key] ?? TONE.ugc);
  lines.push(`상황: ${brief.tpo}`);
  lines.push(`카메라: ${shot.camera}`);
  lines.push(`동작: ${shot.action}`);
  lines.push(`이 컷에 반드시 담긴다: ${shot.must}`);

  if (shot.line && f.audio === "onscreen") {
    // 대사는 따옴표로 감싸 모델이 지문과 구분하게 한다.
    // Seedance 는 언어 태그와 문장 자체로 입모양을 만든다
    lines.push(`인물이 한국어로 말한다(자연스러운 구어, 또박또박): "${shot.line}"`);
  }

  lines.push(COMMON_RULES);
  return lines.join("\n");
}

/* ── 검증 ─────────────────────────────────────────────────────────────
 * 만들기 전에 막는다. 생성은 초당 과금이라 만들고 나서 발견하면 늦다. */

/**
 * 한국어 대사 길이. Seedance 실측 보고에 *"Japanese and Korean work but
 * occasionally drift on longer phrases"* 가 있고 권장이 한 줄 5~10단어다.
 * 그리고 한국어는 중립 어미가 없어서 **격식체를 쓰면 어미가 음절을 잡아먹는다.**
 * 그래서 해요체를 쓰고 어절 수로 자른다.
 */
const LINE_MAX_WORDS = 10;
const LINE_MIN_WORDS = 3;

/**
 * 한국어 TTS 가 1초에 읽는 글자 수 — **실측값이다.** (2026-08-18)
 *
 * ── 왜 이 상수가 생겼나 ────────────────────────────────────────────────
 * 사장님: *"영상을 30초대로 뽑으라고 하면 말도 안 되게 다 줄여 생략해서 아예
 * 못 쓰게 만들고, 그 제한을 없애면 그냥 2분 가까운 영상을 뽑는다."*
 *
 * 원인은 길이를 **대본에** 요구한 것이다. 대본은 늘였다 줄였다 되는 것이라
 * AI 가 내용을 버려서 맞춘다. 길이는 **샷 슬롯이 정해야 하고**, 대본은 그 안에
 * 들어가야 한다. 그러려면 "이 샷에 몇 글자까지 들어가는가" 를 알아야 한다.
 *
 * ── 어떻게 쟀나 ────────────────────────────────────────────────────────
 * 같은 문장 셋을 속도 1.0~1.6 으로 뽑아 whisper 로 되받아썼다.
 *   1.0 → 4.6자/초 (일치율 93.9%)   1.6 → 6.4자/초 (95.6%)
 * 속도와 정확도에 상관이 없었고 1.6 이 최고 타이였다. 그래서 1.6 을 쓴다.
 *
 * ⚠️ **TTS 벤더를 바꾸면 이 값을 다시 재야 한다.** 벤더마다 같은 속도에서
 * 읽는 양이 다르다. 그래서 환경변수로 열어 뒀다.
 */
const CHARS_PER_SECOND = Number(process.env.ADFILM_TTS_CPS ?? 6.4);

/**
 * 대사 길이 상한. 여유를 조금 둔다 — 딱 맞추면 문장 끝이 잘린다.
 * 5초 샷이면 6.4 × 5 × 0.92 ≈ 29자.
 */
const LINE_FIT = 0.92;

export type BriefIssue = { level: "block" | "warn"; message: string };

export function validateBrief(brief: AdBrief): BriefIssue[] {
  const issues: BriefIssue[] = [];
  let f: AdFormat;
  try {
    f = adFormat(brief.format);
  } catch (e) {
    return [{ level: "block", message: (e as Error).message }];
  }

  // ── 필수 서술
  const required: [keyof AdBrief, string][] = [
    ["product", "제품명"],
    ["usp", "핵심 USP"],
    ["audience", "독자·타겟"],
    ["tpo", "T.P.O(언제·어디서·어떤 상황)"],
    ["cta", "행동 문구"],
  ];
  for (const [key, label] of required) {
    if (!String(brief[key] ?? "").trim()) {
      issues.push({ level: "block", message: `${label} 이(가) 비어 있습니다` });
    }
  }

  // ── 레퍼런스 슬롯. 이게 "의도한 대로" 의 재료다
  for (const slot of f.refs) {
    const n = brief.assets.filter((a) => a.slot === slot.key).length;
    if (n < slot.min) {
      issues.push({
        level: "block",
        message: `${slot.label} ${n}/${slot.min}장 — ${slot.why}`,
      });
    } else if (n > slot.max) {
      issues.push({
        level: "warn",
        message: `${slot.label} ${n}장 (권장 ${slot.max}장 이하)`,
      });
    }
  }

  // ── 샷. 유형이 정한 개수와 역할이 그대로 있어야 한다
  if (brief.shots.length !== f.shots.length) {
    issues.push({
      level: "block",
      message: `샷 ${brief.shots.length}개 (${f.label} 은 ${f.shots.length}개)`,
    });
  }
  for (const slot of f.shots) {
    const shot = brief.shots.find((s) => s.no === slot.no);
    if (!shot) {
      issues.push({ level: "block", message: `샷 ${slot.no}(${slot.role}) 이 없습니다` });
      continue;
    }
    if (!shot.must?.trim()) {
      issues.push({
        level: "block",
        message: `샷 ${slot.no}: '화면에 반드시 담길 것' 이 비었습니다 — 참고: ${slot.must}`,
      });
    }
    if (!shot.camera?.trim() || !shot.action?.trim()) {
      issues.push({ level: "block", message: `샷 ${slot.no}: 카메라·동작을 채우세요` });
    }
    /**
     * 대사가 샷 길이에 들어가는가 — **유형을 안 가린다.** (2026-08-18)
     *
     * 예전엔 립싱크 유형(`onscreen`)만 검사했는데, 안 맞으면 곤란한 건
     * voiceover 도 같다. 말이 컷보다 길면 다음 컷으로 넘쳐 "컷이 안 맞게
     * 들어간다" 가 되고, 짧으면 화면이 빈다.
     *
     * 여기서 막으면 생성 전에 알게 된다. 영상을 뽑고 나서 알면 그 컷 값을
     * 통째로 버린다 — 스틸의 8배, 재생성까지 치면 그 이상이다.
     */
    const line = shot.line?.trim() ?? "";
    if (line) {
      const chars = line.replace(/\s/g, "").length;
      const fits = Math.floor(slot.seconds * CHARS_PER_SECOND * LINE_FIT);
      if (chars > fits) {
        issues.push({
          level: "block",
          message:
            `샷 ${slot.no}: 대사 ${chars}자 — ${slot.seconds}초에는 ${fits}자까지 들어갑니다. ` +
            `줄이거나 샷을 나누세요 (실측 ${CHARS_PER_SECOND}자/초)`,
        });
      }
    }

    if (f.audio === "onscreen") {
      const words = shot.line.trim().split(/\s+/).filter(Boolean).length;
      if (!words) {
        issues.push({ level: "block", message: `샷 ${slot.no}: 대사가 비었습니다` });
      } else if (words > LINE_MAX_WORDS) {
        issues.push({
          level: "block",
          message: `샷 ${slot.no}: 대사 ${words}어절 (${LINE_MAX_WORDS}어절 이하). 길면 립싱크가 어긋납니다`,
        });
      } else if (words < LINE_MIN_WORDS) {
        issues.push({
          level: "warn",
          message: `샷 ${slot.no}: 대사 ${words}어절 — 너무 짧으면 컷이 빕니다`,
        });
      }
      if (/[다까요]습니다$|습니다[.!?]?$/.test(shot.line.trim())) {
        issues.push({
          level: "warn",
          message: `샷 ${slot.no}: 격식체입니다. 한국어는 어미가 음절을 잡아먹으니 해요체로 줄이세요`,
        });
      }
    }
  }

  // ── 파일이 슬롯에 안 맞게 붙었는가
  const known = new Set(f.refs.map((r) => r.key));
  for (const a of brief.assets) {
    if (!known.has(a.slot)) {
      issues.push({
        level: "warn",
        message: `'${a.slot}' 은 ${f.label} 이 쓰지 않는 슬롯입니다 (${a.file})`,
      });
    }
  }

  /**
   * ── 제품 팩트가 대사에 실렸는가 (2026-08-16 신설) ─────────────────
   *
   * 이 검사가 없어서 원고가 부정형("진정제 아니다·먹이는 것 아니다")만
   * 반복하고 **제품이 무엇을 해 주는지는 한 줄도 없이** 나갔다.
   * 기획안 칸 1 을 채워 놓고 대사에 안 옮기면 그건 채운 게 아니다.
   */
  const script = brief.shots.map((s) => s.line ?? "").join(" ");
  const mustSay = brief.facts.filter((x) => x.mustSay);
  const missed = mustSay.filter(
    (x) => !x.keywords.some((k) => k.trim() && script.includes(k.trim())),
  );
  if (missed.length) {
    issues.push({
      level: "block",
      message:
        `대사에 안 실린 제품 팩트 ${missed.length}개: ` +
        missed.map((x) => `${x.label}(${x.value})`).join(" · ") +
        " — 부정형 표현만 남기지 말고 제품이 무엇을 해 주는지 말하세요",
    });
  }
  if (mustSay.length < 3) {
    issues.push({
      level: "warn",
      message: `대사에 넣기로 한 팩트가 ${mustSay.length}개입니다 — 제품 기능은 3~4개 이상 말해야 합니다`,
    });
  }
  for (const x of brief.facts) {
    if (!x.source?.trim()) {
      issues.push({
        level: "warn",
        message: `팩트 '${x.label}' 에 근거가 없습니다 — 패키지·공식·임상 중 어디서 왔는지 적으세요`,
      });
    }
  }

  /**
   * ── 타겟과 소구점 (2026-08-16 신설) ─────────────────────────────────
   *
   * 한 편은 **한 타겟을 정조준**한다. 여러 타겟에 두루 맞는 광고는
   * 아무에게도 안 맞는다. 소구점도 마찬가지 — 핵심이 여럿이면 없는 것과 같다.
   */
  const primaries = brief.targets?.filter((t) => t.primary) ?? [];
  if (!brief.targets?.length) {
    issues.push({ level: "block", message: "타겟이 없습니다 — 최소 1명을 세우세요" });
  } else if (primaries.length !== 1) {
    issues.push({
      level: "block",
      message: `정조준 타겟이 ${primaries.length}명입니다 — 한 편은 한 명만 겨냥합니다`,
    });
  }
  for (const t of brief.targets ?? []) {
    if (!t.situation?.trim()) {
      issues.push({
        level: "block",
        message: `타겟 '${t.label || "(이름 없음)"}' 에 상황이 없습니다 — 훅이 여기서 나옵니다`,
      });
    }
    if (!t.reason?.trim()) {
      issues.push({
        level: "warn",
        message: `타겟 '${t.label}' 에 선정 근거가 없습니다`,
      });
    }
  }

  const cores = brief.points?.filter((x) => x.rank === "core") ?? [];
  const supports = brief.points?.filter((x) => x.rank === "support") ?? [];
  if (!brief.points?.length) {
    issues.push({ level: "block", message: "소구점이 없습니다" });
  } else if (cores.length !== 1) {
    issues.push({
      level: "block",
      message: `핵심 소구점이 ${cores.length}개입니다 — 정확히 1개여야 광고가 한 방향으로 섭니다`,
    });
  }
  if (supports.length > 3) {
    issues.push({
      level: "warn",
      message: `보조 소구점 ${supports.length}개 — 3개를 넘기면 메시지가 흩어집니다`,
    });
  }

  // ── 비포/애프터가 한 쌍으로 서 있는가 (칸 5)
  if (!brief.climax?.before?.trim() || !brief.climax?.after?.trim()) {
    issues.push({
      level: "block",
      message:
        "비주얼 클라이맥스의 비포·애프터를 둘 다 적으세요 — 한쪽만 있으면 대비가 성립하지 않습니다",
    });
  }

  return issues;
}

export function briefBlocked(issues: BriefIssue[]): boolean {
  return issues.some((i) => i.level === "block");
}

/** 유형에 맞는 빈 기획안 한 벌. 기획자는 이 위에 채우기만 한다 */
export function blankBrief(formatKey: string): AdBrief {
  const f = adFormat(formatKey);
  return {
    format: f.key,
    targets: [],
    points: [],
    product: "",
    facts: [],
    evidence: "",
    usp: "",
    audience: "",
    tpo: "",
    climax: { before: "", after: "" },
    ...(f.refs.some((r) => r.key === "talent_face")
      ? { talent: { age: "", gender: "", tone: "" } }
      : {}),
    assets: [],
    shots: f.shots.map((s) => ({
      no: s.no,
      camera: "",
      action: "",
      must: "", // 유형의 s.must 가 참고 문구로 화면에 보인다
      line: "",
    })),
    cta: "",
  };
}

/**
 * 기획안 한 벌 → 샷별 프롬프트 전체. 생성기에 그대로 넘긴다.
 * 고지 문구는 편집에서 얹으므로 여기서 같이 내보낸다.
 */
export function compileBrief(brief: AdBrief): {
  format: AdFormat;
  refs: RefTag[];
  prompts: { no: number; seconds: number; prompt: string; line: string }[];
  disclosure: string;
} {
  const f = adFormat(brief.format);
  return {
    format: f,
    refs: referenceManifest(brief),
    prompts: f.shots.map((slot) => ({
      no: slot.no,
      seconds: slot.seconds,
      prompt: buildShotPrompt(brief, slot.no),
      line: brief.shots.find((s) => s.no === slot.no)?.line ?? "",
    })),
    disclosure: disclosureText(f),
  };
}
