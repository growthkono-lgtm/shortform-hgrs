/**
 * 여는 법과 닫는 법 — **훅 타입 · 클로징 타입.** (2026-08-16 신설)
 *
 * 사장님 지시:
 * *"대본 마지막에 결국 뭐가 필요해? 우리 제품과 서비스 쓰면 해소된다는 귀결점이 중요하지.
 *  해소점을 USP 강조형이 있을 거고 프로모션 시즌형이 있을 거고, 지금 같은 경우는
 *  하루 얼마 가격으로 리필형이라는 게 포인트 같지? 이런 것도 나중에 타입으로 분류해야겠네.
 *  마찬가지로 인트로도 훅이 중요하겠지 시작 때?"*
 *
 * ── 왜 축으로 빼는가 ───────────────────────────────────────────────────
 * 대본의 첫 3초와 마지막 3초는 나머지와 성질이 다르다. 첫 3초는 **보게 만드는 일**이고
 * 마지막 3초는 **사게 만드는 일**이다. 가운데(설득 사슬)는 제품마다 달라지지만
 * 이 두 끝은 **유형이 반복된다.** 그래서 매번 새로 짜지 말고 고르게 한다.
 *
 * 출연 구성(`adfilm-cast.ts`)과 같은 원칙이다 — **고정 프리셋이 아니라 선택지**이며,
 * 조합에서 규칙이 계산된다. 하나의 영상은 훅 1개 + 클로징 1개를 고른다.
 */

/* ── 훅 — 첫 3초 ──────────────────────────────────────────────────────
 * 실패는 하나뿐이다: **넘긴다.** 지루하거나 어려우면 그 자리에서 끝난다. */

export type HookType = {
  key: string;
  label: string;
  /** 무엇으로 붙잡는가 */
  device: string;
  /** 이 훅이 잘 맞는 상황 */
  fits: string;
  /** 첫 문장이 지켜야 할 것 */
  rule: string;
  /** 이 훅이 실패하는 지점 */
  risk: string;
};

export const HOOK_TYPES: HookType[] = [
  {
    key: "problem_scene",
    label: "문제 장면형",
    device: "말보다 화면이 먼저. 문제가 벌어지는 장면을 보여 준다",
    fits: "문제가 눈에 보이는 제품 — 긁힌 벽지, 얼룩, 엉킨 선",
    rule: "첫 컷에 제품이 없어야 한다. 광고임을 3초 안에 들키지 않는다",
    risk: "흔한 장면이면 그냥 넘긴다. **남의 집 문제**로 보이면 실패",
  },
  {
    key: "confession",
    label: "고백형",
    device: "화자가 자기 잘못·오해를 먼저 인정한다",
    fits: "타깃이 죄책감·자책을 갖고 있는 카테고리 — 반려동물·육아·건강",
    rule: "첫 문장에 '나'가 들어간다. 조언하지 않는다",
    risk: "고백이 약하면 그냥 후기처럼 들린다",
  },
  {
    key: "misbelief",
    label: "통념 반박형",
    device: "다들 아는 상식을 뒤집는다 — '~인 줄 알았죠'",
    fits: "타깃이 원인을 잘못 알고 있는 카테고리",
    rule: "반박할 통념을 **한 문장으로** 세우고 곧바로 뒤집는다",
    risk: "통념이 실제로 널리 안 믿기면 허수아비를 때리는 셈",
  },
  {
    key: "result_first",
    label: "결과 선행형",
    device: "변화된 결과를 먼저 보여 주고 되감는다",
    fits: "전후 대비가 강한 제품 — 청소·미용·수리",
    rule: "결과가 **설명 없이 보여야** 한다. 자막으로 때우면 실패",
    risk: "결과가 밋밋하면 뒤를 볼 이유가 없다",
  },
  {
    key: "question",
    label: "질문형",
    device: "타깃이 실제로 검색해 본 질문을 던진다",
    fits: "검색 의도가 뚜렷한 카테고리",
    rule: "질문은 타깃의 말로. 브랜드의 말로 물으면 광고가 된다",
    risk: "질문이 뻔하면 답도 뻔해 보인다",
  },
  {
    key: "number",
    label: "숫자형",
    device: "믿기 힘든 수치를 먼저 던진다",
    fits: "임상·실측 수치가 있는 제품",
    rule: "수치는 출처와 함께. 과장 표현이 붙으면 규제 대상",
    risk: "숫자만으로는 감정이 안 생긴다. 뒤가 약하면 이탈",
  },
];

/* ── 클로징 — 마지막 3~5초 ────────────────────────────────────────────
 * 반드시 있어야 하는 것: **우리 것을 쓰면 그 불편이 해소된다는 귀결.**
 * 이게 없으면 앞이 아무리 좋아도 '좋은 영상' 으로 끝나고 전환이 안 난다. */

export type CloseType = {
  key: string;
  label: string;
  device: string;
  fits: string;
  /** 이 유형이 반드시 화면에 담아야 하는 것 */
  must: string;
  risk: string;
};

export const CLOSE_TYPES: CloseType[] = [
  {
    key: "usp",
    label: "USP 강조형",
    device: "앞에서 깐 소구를 한 문장으로 다시 못 박는다",
    fits: "소구가 뚜렷하고 경쟁이 붙는 카테고리",
    must: "제품명 + 소구 한 줄이 같은 화면에",
    risk: "앞 내용의 반복이라 새로운 게 없다. 짧게 끝내야 한다",
  },
  {
    key: "price_value",
    label: "가격가치형",
    device: "총액이 아니라 **쪼갠 값**으로 말한다 — 하루 얼마, 한 잔 값",
    fits: "총액이 부담스러워 보이지만 기간으로 나누면 싼 제품 · 리필/구독 구조",
    must: "쪼갠 금액과 그 기준(며칠·몇 회)이 함께. 기준 없이 금액만 쓰면 과장이다",
    risk: "가격을 먼저 말하면 싸구려로 보인다. **반드시 가치를 세운 뒤에** 온다",
  },
  {
    key: "convenience",
    label: "간편함형",
    device: "쓰는 데 드는 노력이 거의 없다는 것으로 닫는다",
    fits: "행동을 바꿔야 하는 제품 — 귀찮음이 진짜 장벽인 경우",
    must: "동작 한 번이 화면에 보일 것. 말로만 '간편' 하다고 하지 않는다",
    risk: "간편함은 차별점이 아니라 기본값으로 여겨질 수 있다",
  },
  {
    key: "promotion",
    label: "프로모션·시즌형",
    device: "지금 사야 할 이유를 붙인다 — 기간·수량·시즌",
    fits: "실제로 혜택이 있을 때만",
    must: "혜택 조건과 기간이 화면에. 없는 혜택을 만들지 않는다",
    risk: "상시 할인처럼 보이면 신뢰가 깎인다",
  },
  {
    key: "trust",
    label: "신뢰 귀결형",
    device: "권위·규모로 닫는다 — 병원, 논문, 사용자 수",
    fits: "구매 위험이 큰 카테고리 — 의료·고가",
    must: "수치는 출처 그대로. 해석해서 부풀리지 않는다",
    risk: "감정 없이 끝나서 여운이 안 남는다",
  },
  {
    key: "identity",
    label: "공감 귀결형",
    device: "구매가 아니라 관계·정체성으로 닫는다",
    fits: "브랜딩·인지 목적, 또는 감정 서사가 강한 편",
    must: "앞의 감정선을 회수하는 한 문장",
    risk: "전환 소재로는 약하다. 살 이유가 안 남는다",
  },
];

export function hookType(key: string): HookType {
  const f = HOOK_TYPES.find((h) => h.key === key);
  if (!f) throw new Error(`알 수 없는 훅 유형: ${key}`);
  return f;
}

export function closeType(key: string): CloseType {
  const f = CLOSE_TYPES.find((c) => c.key === key);
  if (!f) throw new Error(`알 수 없는 클로징 유형: ${key}`);
  return f;
}

/**
 * 대본이 여닫이를 지켰는가.
 *
 * **귀결점 검사가 이 파일의 존재 이유다.** 앞이 아무리 좋아도 "그래서 이걸 쓰면
 * 그 불편이 해소된다" 가 없으면 전환이 안 난다. v13 대본이 딱 그 상태였다 —
 * 변화 장면으로 끝나고 살 이유가 남지 않았다.
 */
export function auditArc(input: {
  hook: string;
  close: string;
  /** 대본 문장 배열 (순서대로) */
  lines: string[];
  /** 제품명 — 클로징에 들어갔는지 본다 */
  product: string;
}): { ok: boolean; failures: string[] } {
  const failures: string[] = [];
  const first = input.lines[0] ?? "";
  const tail = input.lines.slice(-3).join(" ");

  hookType(input.hook);
  const close = closeType(input.close);

  if (first.length > 30) {
    failures.push(`첫 문장이 ${first.length}자입니다 — 훅은 한 호흡에 들어와야 합니다(30자 이내)`);
  }
  if (/펠리웨이|제품|브랜드/.test(first) || first.includes(input.product)) {
    failures.push("첫 문장에 제품명이 있습니다 — 3초 안에 광고임을 들킵니다");
  }
  if (!tail.includes(input.product)) {
    failures.push(`마지막 세 문장에 제품명이 없습니다 — 무엇을 사야 하는지가 안 남습니다`);
  }

  if (close.key === "price_value" && !/원|일|회|개월/.test(tail)) {
    failures.push("가격가치형인데 쪼갠 금액과 기준이 마지막에 없습니다");
  }
  if (close.key === "promotion" && !/까지|한정|기간|이벤트/.test(tail)) {
    failures.push("프로모션형인데 조건·기간이 없습니다");
  }

  return { ok: failures.length === 0, failures };
}
