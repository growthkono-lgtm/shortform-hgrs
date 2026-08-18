/**
 * 출연 구성 — **누가 나오고, 그중 누가 어떻게 말하는가.** (2026-08-16)
 *
 * ⚠️ `server-only` 를 붙이지 않는다. 값과 판정뿐이고 비밀키를 안 만진다.
 * 검사식을 CLI 에서도 돌릴 수 있어야 기획안을 생성 전에 걸러 낼 수 있다.
 *
 * ── 왜 만들었나 ────────────────────────────────────────────────────────
 * `adfilm-formats.ts` 의 유형 6종은 전부 **"어떻게 만드느냐"** 축이다. 그래서
 * 펠리웨이가 자동으로 "집사가 말하는 UGC" 가 됐다 — 주인공이어야 할 고양이가
 * 규격 어디에도 없었다. 사장님 지적: *"고양이와 제품의 상호작용이 시각적으로
 * 드러나는 게 훨씬 중요하다."*
 *
 * ── 두 번 고쳤다. 두 번째가 중요하다 ──────────────────────────────────
 * 1차: 피사체를 값 하나로 잡았다 → 여럿이 동시에 나오는 영상이 안 적혔다.
 *      (학부모가 말하고 아이·선생님·화면이 함께 나오는 구조)
 * 2차: 역할 목록으로 바꾸고 **구성 6종을 고정 프리셋으로** 뒀다 → 이것도 틀렸다.
 *      사장님 지적: *"몇 개의 타입을 각각 선택하면 그 조합에 맞게 나와야 하는 거야.
 *      서로 대화하는 영상일 수도 있고, 여러 인물이 한마디씩 하는 걸 수도 있고.
 *      여러 케이스를 다 하나의 독립적인 복합 케이스로 해 놓으면 리스트업이 끝이 없으니."*
 *
 * 그래서 **프리셋을 규격에서 내린다.** 규격은 아래 셋이고,
 *   ① 역할 사전(누가 나올 수 있는가)
 *   ② 각 역할의 선택값(등장·발화·증거)
 *   ③ 발화 구조(혼자 말하나 / 주고받나 / 돌아가며 하나)
 * 프리셋은 그 조합의 **저장된 시작값**일 뿐 고정 규격이 아니다. 어드민에서
 * 사장님이 값을 고르면 조합이 만들어지고, 규칙은 조합에서 **계산된다.**
 */

/** 화면에 나올 수 있는 주체 — 사전이다. 조합은 이 안에서 만들어진다 */
export type CastRole =
  /** 돈을 내는 사람 — 집사·학부모·자녀 */
  | "buyer"
  /** 실제로 제품을 쓰는 대상 — 고양이·아이·부모 */
  | "beneficiary"
  /** 전문성·서비스를 제공하는 사람 — 선생님·수의사·시술자 */
  | "provider"
  /** 제품 실물. AI 로 그리지 않는다 */
  | "product"
  /** 화면·콘텐츠·UI — 강의 화면, 앱, 교재 */
  | "screen"
  /** 장소 */
  | "space";

export const ROLE_LABEL: Record<CastRole, string> = {
  buyer: "구매자",
  beneficiary: "수혜자",
  provider: "제공자",
  product: "제품",
  screen: "화면·콘텐츠",
  space: "공간",
};

/** 이 역할이 소리를 내는 방식 */
export type SpeechMode =
  /** 화면 안에서 직접 말한다. 립싱크가 맞아야 한다 */
  | "onscreen"
  /** 목소리만. 입이 안 보이므로 시간축이 자유롭다 */
  | "voiceover"
  /** 말하지 않는다 */
  | "silent";

/**
 * 발화 구조 — **말하는 역할이 둘 이상일 때 어떻게 말하는가.**
 *
 * 1차 설계에 이게 없어서 "서로 대화하는 영상", "여러 인물이 한마디씩" 이
 * 표현되지 않았다. 화자 수가 아니라 **주고받는 방식**이 규격을 바꾼다 —
 * 대화는 컷을 못 자르고(리액션이 붙어야 한다), 릴레이는 컷마다 잘라도 된다.
 */
export type SpeechStructure =
  /** 한 명이 처음부터 끝까지 */
  | "solo"
  /** 두 역할이 주고받는다. 말하는 쪽과 듣는 쪽이 한 화면에 있어야 한다 */
  | "dialogue"
  /** 여러 역할이 한마디씩 이어받는다. 컷마다 화자가 바뀐다 */
  | "relay"
  /** 아무도 화면에서 말하지 않는다. 내레이션·자막·소리만 */
  | "none";

/** 조합의 한 칸 — 역할 하나에 대해 고르는 값 */
export type CastSlot = {
  role: CastRole;
  /** 화면에 나오는 이름 — 제품마다 달라진다("집사", "학부모") */
  label: string;
  speech: SpeechMode;
  /**
   * **증거를 만드는 역할인가.**
   *
   * 구매자가 "좋아졌어요" 라고 말하는 것은 주장이고, 수혜자가 실제로 달라지는
   * 장면이 증거다. 검사식은 증거 역할의 화면 점유 시간을 센다.
   */
  evidence: boolean;
  /** 레퍼런스 시트가 필요한가 — 컷마다 얼굴이 바뀌면 안 되는 역할 */
  needsSheet: boolean;
};

/** 한 편의 출연 구성 = 슬롯 목록 + 발화 구조 */
export type CastComposition = {
  slots: CastSlot[];
  structure: SpeechStructure;
  /** 값을 직접 정하고 싶을 때만. 비우면 규칙에서 계산한다 */
  minEvidenceRatio?: number;
};

/* ── 규칙 — 조합에서 계산된다. 케이스를 나열하지 않는다 ──────────────── */

/** 말하는 역할들 */
export function speakers(c: CastComposition): CastSlot[] {
  return c.slots.filter((s) => s.speech !== "silent");
}

/** 증거를 만드는 역할들 */
export function evidenceRoles(c: CastComposition): Set<CastRole> {
  return new Set(c.slots.filter((s) => s.evidence).map((s) => s.role));
}

/** 립싱크가 필요한가 — 화면 안에서 말하는 역할이 하나라도 있으면 */
export function needsLipSync(c: CastComposition): boolean {
  return c.slots.some((s) => s.speech === "onscreen");
}

/** 먼저 만들어야 하는 시트 목록. 3번 정거장의 작업 목록이 된다 */
export function sheetsNeeded(c: CastComposition): CastSlot[] {
  return c.slots.filter((s) => s.needsSheet);
}

/**
 * 증거 컷 하한을 **조합에서 계산한다.**
 *
 * 고정표를 두면 새 조합이 나올 때마다 표를 고쳐야 한다. 대신 근거를 규칙으로 적는다:
 *  · 말하는 역할과 증거 역할이 **다르면** 증거가 더 많이 필요하다.
 *    말이 주장이고 화면이 근거인 구조라서다(반려동물·교육·시니어).
 *  · 화면에서 아무도 말하지 않으면 화면이 전부다 → 더 높다.
 *  · 말하는 역할이 곧 증거면(본인 사용) 화면이 절반이면 된다.
 */
export function requiredEvidenceRatio(c: CastComposition): number {
  if (c.minEvidenceRatio != null) return c.minEvidenceRatio;

  if (c.structure === "none") return 0.7;

  const speaking = speakers(c);
  const evidence = evidenceRoles(c);
  const speakerIsEvidence = speaking.some((s) => evidence.has(s.role));

  if (!speakerIsEvidence) return 0.4; // 말과 증거가 분리된 구조
  return 0.5;
}

/** 이 조합이 성립하는가 — 값끼리 어긋나는 걸 먼저 잡는다 */
export function validateComposition(c: CastComposition): string[] {
  const problems: string[] = [];
  const speaking = speakers(c);

  if (c.structure === "solo" && speaking.length > 1) {
    problems.push(
      `발화 구조가 '혼자 말하기' 인데 말하는 역할이 ${speaking.length} 개입니다 — 대화나 릴레이로 바꾸세요`,
    );
  }
  if (c.structure === "dialogue" && speaking.length < 2) {
    problems.push("발화 구조가 '주고받기' 인데 말하는 역할이 하나뿐입니다");
  }
  if (c.structure === "relay" && speaking.length < 2) {
    problems.push("발화 구조가 '한마디씩' 인데 말하는 역할이 하나뿐입니다");
  }
  if (c.structure === "none" && speaking.some((s) => s.speech === "onscreen")) {
    problems.push("발화 구조가 '무발화' 인데 화면에서 말하는 역할이 있습니다");
  }
  if (!c.slots.some((s) => s.evidence)) {
    problems.push("증거를 만드는 역할이 하나도 없습니다 — 광고가 성립하지 않습니다");
  }
  if (!c.slots.some((s) => s.role === "product")) {
    problems.push("제품이 출연에 없습니다");
  }
  return problems;
}

/**
 * 컷 배분 검사 — 증거 역할이 화면을 충분히 차지하는가.
 *
 * 이 검사가 없으면 "보호자 얼굴 6컷 + 고양이 1컷" 같은 기획안이 통과한다.
 * v10 이 그 모양이었다.
 */
export function auditCast(input: {
  composition: CastComposition;
  shots: { seconds: number; cast: CastRole[] }[];
}): { ok: boolean; ratio: number; required: number; failures: string[] } {
  const failures = validateComposition(input.composition);
  const total = input.shots.reduce((s, x) => s + x.seconds, 0);
  const evidence = evidenceRoles(input.composition);
  const evidenceSeconds = input.shots
    .filter((s) => s.cast.some((r) => evidence.has(r)))
    .reduce((s, x) => s + x.seconds, 0);
  const ratio = total > 0 ? evidenceSeconds / total : 0;
  const required = requiredEvidenceRatio(input.composition);

  if (ratio < required) {
    failures.push(
      `증거 컷 ${Math.round(ratio * 100)}% (기준 ${Math.round(required * 100)}% 이상) — ` +
        `${[...evidence].map((r) => ROLE_LABEL[r]).join("·")} 가 화면을 이만큼 차지해야 합니다`,
    );
  }

  const appeared = new Set(input.shots.flatMap((s) => s.cast));
  for (const s of input.composition.slots) {
    if (!appeared.has(s.role)) {
      failures.push(`'${s.label}' 가 한 컷도 안 나옵니다 — 출연에 넣어 둔 역할입니다`);
    }
  }

  // 대화 구조는 컷 안에 말하는 쪽과 듣는 쪽이 함께 있어야 성립한다
  if (input.composition.structure === "dialogue") {
    const speakingRoles = speakers(input.composition).map((s) => s.role);
    const together = input.shots.some((s) => speakingRoles.every((r) => s.cast.includes(r)));
    if (!together) {
      failures.push(
        "주고받는 대화인데 두 화자가 같은 컷에 있는 장면이 없습니다 — 리액션이 없으면 대화로 안 보입니다",
      );
    }
  }

  return { ok: failures.length === 0, ratio, required, failures };
}

/* ── 시작값(프리셋) ────────────────────────────────────────────────────
 * **규격이 아니라 저장된 시작값이다.** 어드민에서 하나 고르면 슬롯이 채워지고,
 * 사장님이 거기서 역할을 더하거나 발화를 바꾸면 그게 그 편의 구성이 된다.
 * 여기에 없는 조합이라고 못 만드는 게 아니다 — 빈 조합에서 시작해도 된다. */
export type CastPreset = {
  key: string;
  label: string;
  premise: string;
  composition: CastComposition;
  examples: string[];
  watchFor: string[];
};

const slot = (
  role: CastRole,
  label: string,
  speech: SpeechMode,
  evidence: boolean,
  needsSheet: boolean,
): CastSlot => ({ role, label, speech, evidence, needsSheet });

export const CAST_PRESETS: CastPreset[] = [
  {
    key: "self",
    label: "본인 사용형",
    premise: "사는 사람과 쓰는 사람이 같다. 말하는 사람이 곧 증거다.",
    composition: {
      structure: "solo",
      slots: [
        slot("buyer", "사용자 본인", "onscreen", true, true),
        slot("product", "제품", "silent", true, false),
        slot("space", "생활 공간", "silent", false, true),
      ],
    },
    examples: ["화장품", "건강기능식품", "의류"],
    watchFor: ["얼굴과 입이 동시에 맞아야 한다", "한 컷 한 문장 — 한국어는 길어지면 입이 어긋난다"],
  },
  {
    key: "guardian",
    label: "보호자 시점형",
    premise: "말은 보호자가 하고, 증거는 수혜자가 만든다.",
    composition: {
      structure: "solo",
      slots: [
        slot("buyer", "보호자", "onscreen", false, true),
        slot("beneficiary", "수혜자", "silent", true, true),
        slot("product", "제품", "silent", true, false),
        slot("space", "생활 공간", "silent", false, true),
      ],
    },
    examples: ["반려동물 용품", "유아·교육", "시니어 케어"],
    watchFor: [
      "보호자 얼굴만 늘어나면 광고가 성립하지 않는다",
      "'변화' 자리는 반드시 수혜자 컷이다 — 말로 대신하지 않는다",
      "수혜자도 시트가 필요하다. 컷마다 다른 고양이·다른 아이면 그 순간 오류가 된다",
    ],
  },
  {
    key: "interview",
    label: "주고받기형",
    premise: "두 역할이 대화한다. 리액션이 있어야 대화로 보인다.",
    composition: {
      structure: "dialogue",
      slots: [
        slot("provider", "전문가", "onscreen", false, true),
        slot("buyer", "고객", "onscreen", true, true),
        slot("product", "제품", "silent", true, false),
        slot("space", "공간", "silent", false, true),
      ],
    },
    examples: ["상담 후기", "전문가 인터뷰", "before·after 대담"],
    watchFor: [
      "두 화자가 같은 컷에 있어야 한다 — 따로 찍으면 두 개의 독백이 된다",
      "말이 겹치면 립싱크가 무너진다. 한 번에 한 사람만",
    ],
  },
  {
    key: "relay",
    label: "한마디씩형",
    premise: "여러 역할이 한마디씩 이어받는다. 컷마다 화자가 바뀐다.",
    composition: {
      structure: "relay",
      slots: [
        slot("buyer", "구매자", "onscreen", false, true),
        slot("beneficiary", "수혜자", "onscreen", true, true),
        slot("provider", "제공자", "onscreen", false, true),
        slot("product", "제품", "silent", true, false),
      ],
    },
    examples: ["여러 후기 몰아보기", "가족 구성원별 한마디", "직원 릴레이"],
    watchFor: [
      "화자가 바뀔 때마다 시트가 필요하다 — 인물 수만큼 시트가 늘어난다",
      "한 사람당 한 문장. 길어지면 전부 무너진다",
    ],
  },
  {
    key: "witness",
    label: "관찰형",
    premise: "화면에서 아무도 말하지 않는다. 반응과 내레이션만.",
    composition: {
      structure: "none",
      slots: [
        slot("beneficiary", "수혜자", "silent", true, true),
        slot("product", "제품", "silent", true, false),
        slot("space", "공간", "silent", false, true),
      ],
    },
    examples: ["반려동물", "유아", "제품 물성"],
    watchFor: ["립싱크가 없어 가장 안전하고 싸다", "내레이션이 장면을 설명하면 지루해진다"],
  },
  {
    key: "expert",
    label: "전문가 화자형",
    premise: "설명이 상품이다. 전문가가 말하고 화면이 근거를 댄다.",
    composition: {
      structure: "solo",
      slots: [
        slot("provider", "전문가", "onscreen", false, true),
        slot("product", "제품", "silent", true, false),
        slot("screen", "자료·화면", "silent", true, true),
      ],
    },
    examples: ["의료·건기식", "B2B", "교육 커리큘럼"],
    watchFor: ["전문가를 AI 로 만들면 신뢰가 아니라 의심을 산다", "효능 표현은 규제 대상이다"],
  },
  {
    key: "anthropomorphic",
    label: "의인화형",
    premise: "수혜자가 말한다. 단 입은 건드리지 않는다.",
    composition: {
      structure: "solo",
      slots: [
        slot("beneficiary", "수혜자(화자)", "voiceover", true, true),
        slot("buyer", "보호자", "silent", false, true),
        slot("product", "제품", "silent", true, false),
      ],
    },
    examples: ["반려동물 브랜딩", "캐릭터 IP", "SNS 바이럴"],
    watchFor: ["입을 움직이면 조악해진다. 목소리만 얹는다", "전환보다 인지·바이럴에 맞는다"],
  },
];

export function castPreset(key: string): CastPreset {
  const found = CAST_PRESETS.find((c) => c.key === key);
  if (!found) {
    throw new Error(
      `알 수 없는 시작값: ${key} (${CAST_PRESETS.map((c) => c.key).join(", ")} 중 하나)`,
    );
  }
  return found;
}
