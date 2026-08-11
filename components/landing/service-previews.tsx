import { clipPoster } from "@/lib/clips";

/**
 * 3분할 카드의 미리보기 = **앞으로 만들 어드민 화면**의 예고편.
 * 소재 영상을 넣는 자리가 아니다 (와이어프레임에 어드민 캡처가 붙어 있던 자리).
 *
 * 폴더·프로젝트 제목은 실제 브랜드명을 노출하지 않는다.
 * `A브랜드_그로스플랜_7월1차` 처럼 **플랜명(스타터·그로스·스케일)이 들어간 규칙**으로 쓴다.
 */

/** 0 — 브랜드 AI 기본 분석. 상세페이지 URL 한 줄이 구조화된 항목으로 떨어진다 */
export function BrandAiPreview() {
  const rows = [
    ["브랜드", "반려견 영양처방식 D2C"],
    ["핵심 타겟", "3040 보호자 · 노령견 · 식이 민감"],
    ["USP", "수의사 처방 기준 · 저지방 배합"],
    ["객단가", "3.9만원대 · 재구매 42%"],
    ["금지 표현", "치료·완치 등 효능 단정"],
  ];

  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2">
        <span className="size-3.5 shrink-0 rounded-sm bg-accent/25" />
        <span className="truncate text-[0.625rem] text-muted">
          https://brand.co.kr/product/…
        </span>
        <span className="ml-auto shrink-0 rounded bg-accent px-1.5 py-0.5 text-[0.5625rem] font-bold text-white">
          분석
        </span>
      </div>
      <dl className="mt-2.5 divide-y divide-line overflow-hidden rounded-lg border border-line bg-paper">
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="flex items-baseline gap-2 px-3 py-[0.4375rem]"
          >
            <dt className="w-14 shrink-0 text-[0.5625rem] text-muted">{k}</dt>
            <dd className="truncate text-[0.625rem] font-bold">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-[0.5625rem] text-muted">
        AI 초안 · 담당자 검수 후 확정
      </p>
    </div>
  );
}

/** 0-1 — 컨텐츠 가이드라인 세부 기획. 편별로 포맷·후킹이 갈린다 */
export function GuidelinePreview() {
  const rows = [
    {
      no: "01",
      format: "후기형",
      hook: '"밥 먹어~" 소리도 안 들려요',
      tag: "전환",
    },
    {
      no: "02",
      format: "전문가형",
      hook: "췌장염 저지방 식이 성분",
      tag: "신뢰",
    },
    {
      no: "03",
      format: "비교형",
      hook: "기존 레시피 그대로 괜찮을까",
      tag: "설득",
    },
    {
      no: "04",
      format: "리얼리티",
      hook: "보호자가 더 신나는 이유",
      tag: "도달",
    },
  ];

  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold">컨텐츠 가이드라인</span>
        <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[0.5625rem] font-bold text-accent-deep">
          10편 편성
        </span>
      </div>
      <ul className="mt-2.5 divide-y divide-line overflow-hidden rounded-lg border border-line bg-paper">
        {rows.map((r) => (
          <li key={r.no} className="flex items-center gap-2 px-3 py-2">
            <span className="stat-figure shrink-0 text-[0.5625rem] text-muted">
              {r.no}
            </span>
            <span className="shrink-0 rounded bg-paper-alt px-1.5 py-0.5 text-[0.5625rem] font-bold">
              {r.format}
            </span>
            <span className="truncate text-[0.625rem] text-muted">
              {r.hook}
            </span>
            <span className="ml-auto shrink-0 text-[0.5625rem] text-accent-deep">
              {r.tag}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * 1 — 1차 선정 심사 보드.
 * **클라이언트가 실제로 보는 화면 그대로다** (components/portal/project-panels.tsx).
 * 지표는 Apify로 수집한 실값이 들어가고, 클라이언트가 여기서 직접 고른다.
 * 임의로 예쁜 화면을 그리지 말 것 — 실제와 어긋나면 신청 후에 배신감이 된다.
 */
export function SeedingPreview() {
  const rows = [
    {
      name: "맛집투어l핫플공유",
      handle: "instagram",
      picked: true,
      m: ["2,541", "56", "8,249", "153", "23", "2원"],
    },
    {
      name: "guccim71",
      handle: "instagram",
      picked: false,
      m: ["17.5천", "302", "24,100", "890", "41", "3원"],
    },
  ];
  const labels = ["팔로워", "컨텐츠수", "평균 조회", "좋아요", "댓글", "CPV"];

  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-bold">
          1차 선정 심사 <span className="text-muted">12명</span>
        </span>
        <span className="text-[0.5625rem] text-muted">
          선택 4명 · 08/10 기준
        </span>
      </div>

      <div className="mt-2.5 space-y-1.5">
        {rows.map((r) => (
          <div
            key={r.name}
            className={`rounded-lg border px-3 py-2.5 ${
              r.picked ? "border-ink bg-accent/[0.05]" : "border-line bg-paper"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="size-4 shrink-0 rounded-full bg-accent/20" />
              <span className="truncate text-[0.625rem] font-bold">
                {r.name}
              </span>
              <span className="rounded bg-paper-alt px-1 py-0.5 text-[0.5rem] text-muted">
                {r.handle}
              </span>
              <span
                className={`ml-auto rounded-full px-2 py-0.5 text-[0.5rem] font-bold ${
                  r.picked ? "bg-ink text-paper" : "border border-ink/20"
                }`}
              >
                {r.picked ? "선택 해제" : "선택"}
              </span>
            </div>
            <dl className="mt-2 grid grid-cols-6 gap-1">
              {labels.map((l, k) => (
                <div key={l}>
                  <dt className="text-[0.4375rem] text-muted">{l}</dt>
                  <dd className="stat-figure text-[0.5625rem]">{r.m[k]}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 2 — 확보 소스 폴더 모음. 채널·타깃·차수·인원이 제목에 다 들어간다 */
export function SourcePreview() {
  const folders = [
    { name: "인스타그램_생활_인플_1차_10명", files: 42 },
    { name: "인스타그램_서비스_인플_2차_20명", files: 68 },
    { name: "인스타그램_뷰티_인플_1차_10명", files: 35 },
    { name: "유튜브_리뷰_인플_1차_5명", files: 18 },
    { name: "인스타그램_주부육아_인플_3차_15명", files: 51 },
  ];

  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold">소스 모음집</span>
        <span className="text-[0.625rem] text-accent">전체 다운로드</span>
      </div>
      <ul className="mt-2.5 divide-y divide-line overflow-hidden rounded-lg border border-line bg-paper">
        {folders.map((f) => (
          <li
            key={f.name}
            className="flex items-center gap-2 px-3 py-[0.4375rem] text-[0.625rem]"
          >
            <span className="size-3.5 shrink-0 rounded-sm bg-gold/40" />
            <span className="truncate">{f.name}</span>
            <span className="ml-auto shrink-0 text-muted">{f.files}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 3 — 납품 폴더 대시보드. 썸네일을 받아보고 그 자리에서 수정 요청/최종 확인을 누른다 */
export function ShortformPreview() {
  const thumbs = [
    "riiid-parent-empathy",
    "bone-w40s",
    "pet-portion",
    "seeding-patty",
    "moen-shampoo-ppl",
    "riiid-toefl-junior",
  ];

  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-center justify-between">
        <span className="truncate text-[0.6875rem] font-bold">
          A브랜드_그로스플랜_7월1차
        </span>
        <span className="shrink-0 rounded bg-accent/10 px-1.5 py-0.5 text-[0.5625rem] font-bold text-accent-deep">
          납품 완료
        </span>
      </div>

      <div className="mt-2.5 grid grid-cols-3 gap-1.5">
        {thumbs.map((t) => (
          <span
            key={t}
            className="relative block aspect-[9/16] overflow-hidden rounded bg-paper-alt"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={clipPoster(t)}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 size-full object-cover"
            />
            <span className="absolute right-1 bottom-1 grid size-3.5 place-items-center rounded-full bg-white/85">
              <svg viewBox="0 0 16 16" className="size-2 fill-ink" aria-hidden>
                <path d="M8 11L3 6h3V1h4v5h3z" />
                <path d="M2 13h12v2H2z" />
              </svg>
            </span>
          </span>
        ))}
      </div>

      <div className="mt-auto flex gap-1.5 pt-2.5">
        <span className="flex-1 rounded-md border border-line bg-paper py-1.5 text-center text-[0.625rem] font-bold">
          1차 수정 요청
        </span>
        <span className="flex-1 rounded-md bg-accent py-1.5 text-center text-[0.625rem] font-bold text-white">
          최종 확인
        </span>
      </div>
    </div>
  );
}

/**
 * 5 — 검수·납품. 클라이언트 보드의 **진행 단계 원형 스텝퍼**를 그대로 축소한 것이다.
 */
export function DeliveryPreview() {
  const steps = ["소스컷 확인", "기획", "제작완료", "수정 반영", "다운로드"];
  const current = 2;
  const rows = [
    { seq: "01편", state: "최종 승인", done: true },
    { seq: "02편", state: "수정 반영중", done: false },
    { seq: "03편", state: "확인 요청", done: false },
  ];

  return (
    <div className="flex h-full flex-col p-4">
      {/* 원형 스텝퍼 — 실제 화면과 같은 규칙(지난 칸 체크 / 현재 칸 채움) */}
      <ol className="flex items-start justify-between">
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className="flex flex-1 flex-col items-center gap-1">
              <span
                className={`grid size-6 place-items-center rounded-full border text-[0.5rem] font-bold ${
                  active
                    ? "border-accent bg-accent text-white"
                    : done
                      ? "border-accent/35 bg-accent/10 text-accent-deep"
                      : "border-line bg-paper text-muted/50"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={`text-center text-[0.4375rem] leading-tight ${
                  active ? "font-bold" : "text-muted/60"
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>

      <ul className="mt-3 divide-y divide-line overflow-hidden rounded-lg border border-line bg-paper">
        {rows.map((r) => (
          <li
            key={r.seq}
            className="flex items-center gap-2 px-3 py-2 text-[0.5625rem]"
          >
            <span className="font-bold">{r.seq}</span>
            <span
              className={
                r.done
                  ? "ml-auto rounded bg-accent/10 px-1.5 py-0.5 font-bold text-accent-deep"
                  : "ml-auto rounded bg-paper-alt px-1.5 py-0.5 text-muted"
              }
            >
              {r.state}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[0.5rem] text-muted">
        1회 무상 수정 후 최종본 전체 다운로드
      </p>
    </div>
  );
}
