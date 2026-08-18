import { clipPoster } from "@/lib/clips";

/**
 * 3분할 카드의 미리보기 = **앞으로 만들 어드민 화면**의 예고편.
 * 소재 영상을 넣는 자리가 아니다 (와이어프레임에 어드민 캡처가 붙어 있던 자리).
 *
 * 폴더·프로젝트 제목은 실제 브랜드명을 노출하지 않는다.
 * `A브랜드_그로스플랜_7월1차` 처럼 **플랜명(스타터·그로스·스케일)이 들어간 규칙**으로 쓴다.
 */

export function GuidelinePreview() {
  const fields = [
    ["브랜드 · 제품 소개", "반려견 영양처방식 · 관절 케어 라인"],
    ["판매 링크", "brand.co.kr/product/..."],
    ["가격 · 옵션 · 수량", "3.9만원대 / 30정·60정 / 20개"],
    ["핵심 타겟", "3040 보호자 · 노령견 · 식이 민감"],
    ["USP", "수의사 처방 기준 · 저지방 배합"],
    ["금지 표현", "치료·완치 등 효능 단정"],
  ];

  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold">브랜드 · 제품 소개</span>
        <span className="rounded-full bg-paper-alt px-2 py-0.5 text-[0.5625rem] font-bold text-muted">
          작성 완료
        </span>
      </div>
      <p className="mt-1 text-[0.5rem] leading-[1.6] text-muted">
        판매 링크 · 가격 · 옵션 · 수량은 필수
      </p>
      <dl className="mt-2 divide-y divide-line overflow-hidden rounded-lg border border-line bg-paper">
        {fields.map(([label, value]) => (
          <div key={label} className="flex items-center gap-2 px-3 py-1.5">
            <dt className="w-[76px] shrink-0 text-[0.5rem] text-muted">{label}</dt>
            <dd className="truncate text-[0.5625rem] font-bold">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * 1 — 확정 인플루언서 카드.
 * **클라이언트가 실제로 보는 화면 그대로다** (components/portal/project-panels.tsx).
 * 고르는 화면이 아니다 — 선정은 우리가 끝내고 클라이언트는 확정 명단을 본다.
 * 임의로 예쁜 화면을 그리지 말 것 — 실제와 어긋나면 신청 후에 배신감이 된다.
 */
export function SeedingPreview() {
  const rows = [
    {
      handle: "@creator_a",
      category: "맛집·먹방",
      posts: ["seeding-garnish", "seeding-patty", "gaehogang-square"],
      m: ["2,540", "8,253", "153"],
    },
    {
      handle: "@creator_b",
      category: "라이프스타일",
      posts: ["riiid-parent-itv", "bone-w40s", "pet-treats-plea"],
      m: ["17,500", "24,100", "890"],
    },
  ];
  const labels = ["팔로워", "평균 조회", "평균 좋아요"];

  return (
    <div className="flex h-full flex-col p-4">
      <span className="text-xs font-bold">
        확정 인플루언서 <span className="text-muted">12명</span>
      </span>

      <div className="mt-2.5 space-y-1.5">
        {rows.map((r) => (
          <div key={r.handle} className="rounded-lg border border-line bg-paper p-2">
            <div className="flex items-center gap-1.5">
              <span className="size-4 shrink-0 rounded-full bg-accent/20" />
              <span className="rounded bg-gold/15 px-1 py-0.5 text-[0.5rem] font-bold text-gold-deep">
                {r.category}
              </span>
              <span className="truncate text-[0.5625rem] font-bold">{r.handle}</span>
            </div>
            <div className="mt-1.5 grid grid-cols-3 gap-0.5">
              {r.posts.map((slug) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={slug}
                  src={clipPoster(slug)}
                  alt=""
                  loading="lazy"
                  className="aspect-square w-full rounded-sm object-cover"
                />
              ))}
            </div>
            <dl className="mt-1.5 grid grid-cols-3 gap-1">
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
  const steps = [
    "숏폼 기획제작 진행중",
    "1차 완성본 컨펌 확인",
    "최종 수정요청 반영중",
    "최종본 다운로드",
  ];
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

/**
 * 5 — 소재 정기 수급. **별도 플랜으로 이어서 진행하는 자리다.**
 *
 * 성과 수치는 넣지 않는다 — 예시로 적은 숫자가 "이 정도는 나온다"로 읽히면
 * 그 순간 과장 광고가 된다. 보여 줄 것은 **판정과 다음 수**의 구조다.
 */
export function RestockPreview() {
  const last = [
    { name: "후기형 · 첫구매", verdict: "유지", tone: "keep" },
    { name: "전문가형 · 성분", verdict: "확대", tone: "up" },
    { name: "비교형 · 레시피", verdict: "교체", tone: "drop" },
  ];

  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold">
          8월 2차 <span className="text-muted">편성안</span>
        </span>
        <span className="rounded bg-gold/20 px-1.5 py-0.5 text-[0.5625rem] font-bold text-gold-deep">
          월 정기
        </span>
      </div>

      <span className="mt-2.5 text-[0.5rem] text-muted">지난 회차 판정</span>
      <ul className="mt-1 space-y-1">
        {last.map((r) => (
          <li
            key={r.name}
            className="flex items-center gap-2 rounded-lg border border-line bg-paper px-2.5 py-1.5"
          >
            <span className="truncate text-[0.5625rem] font-bold">{r.name}</span>
            <span
              className={`ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[0.5rem] font-bold ${
                r.tone === "up"
                  ? "bg-accent text-white"
                  : r.tone === "keep"
                    ? "bg-accent/10 text-accent-deep"
                    : "border border-line text-muted"
              }`}
            >
              {r.verdict}
            </span>
          </li>
        ))}
      </ul>

      <span className="mt-2.5 text-[0.5rem] text-muted">다음 회차 제안</span>
      <div className="mt-1 rounded-lg border border-accent/30 bg-accent/[0.05] px-2.5 py-2">
        <span className="block text-[0.5625rem] font-bold">
          전문가형 2편 추가 · 비교형 → 리얼리티 전환
        </span>
        <span className="mt-0.5 block text-[0.5rem] text-muted">
          잘 도는 각은 늘리고, 꺾인 각은 접습니다
        </span>
      </div>
    </div>
  );
}
