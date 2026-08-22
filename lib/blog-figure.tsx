import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

/**
 * **본문 도해 — PNG 로 그린다.** (2026-08-22)
 *
 * ── 왜 SVG 가 아니라 PNG 인가 ──────────────────────────────────────────
 * 사장님: *"우리가 만드는 이미지나 시각화자료에는 모두 해그로시 숏폼 스튜디오
 * hgrs.io 라던가 이런식으로 들어가야돼. 로고도 어딘가 작게 같이 들어가야하고.
 * 그래야 구글이나 네이버에서 검색 시 이미지 카테고리에서 바로 보이면서 더
 * 클릭하지."*
 *
 * 인라인 SVG 는 **이미지 검색에 잡히지 않는다.** 구글·네이버 이미지 탭에
 * 걸리려면 주소가 있는 실제 이미지 파일이어야 하고, 그 파일에 우리 표시가
 * 박혀 있어야 남이 퍼가도 출처가 따라간다.
 *
 * 썸네일(`lib/blog-thumbnail.tsx`)이 이미 같은 방식으로 돌고 있어 그 구조를
 * 그대로 쓴다. 폰트를 직접 싣는 이유도 같다 — satori 는 woff2 를 못 읽고
 * 기본 폰트에 한글이 없어서, 안 주면 글자가 통째로 두부(□□□)가 된다.
 *
 * ── 왜 네 종류인가 ────────────────────────────────────────────────────
 * 우리 글이 펴는 논지는 사실상 넷 중 하나다.
 *   funnel   단계를 따라 좁아진다 (AARRR·유입→전환)
 *   flow     A 다음 B 다음 C (프로세스·판단 순서)
 *   matrix   두 축으로 가른다 (살릴 것 / 끊을 것)
 *   cycle    돌아온다 (운영 루프·재구매)
 * 더 늘리기 전에 이 넷으로 덮이는지 먼저 본다. 종류가 많아지면 모델이
 * 아무거나 고르고, 그러면 도해가 장식이 된다.
 */

/**
 * **1.5배로 그린다.** (2026-08-22)
 *
 * 사장님: *"자체제작이미지는 화질 떨어진다."*
 *
 * 1200×675 로 그리고 있었는데 모자랐다. 레티나 화면은 픽셀을 2배로 쓰므로
 * 본문 폭 700px 자리에 1200px 을 넣으면 또렷하지 않다.
 * 썸네일이 1200×630 인 건 OG 규격이라 그런 것이고 **본문 도해는 그 규격에
 * 묶이지 않는다.** 글자 크기도 같은 비율로 키워야 하므로 SCALE 로 곱한다.
 */
const SCALE = 1.5;
export const FIGURE_SIZE = { width: 1800, height: 1013 };

/** 디자인 값을 1.5배로. 소수점은 반올림한다 */
const px = (n: number) => Math.round(n * SCALE);

export type FigureKind = "funnel" | "flow" | "matrix" | "cycle";

export type FigureSpec = {
  kind: FigureKind;
  title: string;
  /** funnel · flow · cycle 이 쓴다 */
  steps?: { k: string; v?: string }[];
  /** matrix 가 쓴다 */
  axes?: { x: string; y: string };
  /**
   * matrix 의 칸. 08-22 실측에서 모델이 `label/note` 대신 steps 와 같은
   * `k/v` 로 내놓았다. 프롬프트를 조여도 이런 흔들림은 남는다 —
   * **둘 다 받는다.** 사양이 조금 어긋났다고 그림을 통째로 버리면
   * 원고 한 편이 통째로 되감긴다.
   */
  cells?: {
    label?: string;
    k?: string;
    note?: string;
    v?: string;
    tone?: "good" | "bad" | "flat";
  }[];
  /** 도해 아래 한 줄 — 무엇을 읽어야 하는지 */
  caption?: string;
};

/* 브랜드 색 — 어드민·소개서와 같은 네이비를 쓴다 */
const NAVY = "#0C0A3D";
const INK = "#16142F";
const PAPER = "#FBFAF7";
const LINE = "#E3E0DA";
const MUTED = "#6C6982";
const GOOD = "#1B6E4A";
const BAD = "#A32741";

/**
 * 워터마크 — **모든 도해에 예외 없이 들어간다.**
 * 로고는 좌상단, 회사명·도메인은 우하단. (2026-08-22 사장님 지시)
 */
function Watermark({ logo }: { logo: string }) {
  return (
    <div
      style={{
        position: "absolute",
        right: px(44),
        bottom: px(36),
        display: "flex",
        alignItems: "center",
        gap: px(10),
        fontSize: px(22),
        color: MUTED,
      }}
    >
      <div style={{ display: "flex", fontWeight: 700, color: NAVY }}>
        해그로시 숏폼 스튜디오
      </div>
      <div style={{ display: "flex" }}>hgrs.io</div>
      <img src={logo} width={px(26)} height={px(26)} alt="" />
    </div>
  );
}

function Funnel({ steps }: { steps: NonNullable<FigureSpec["steps"]> }) {
  const n = Math.max(steps.length, 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: px(14), width: "100%" }}>
      {steps.map((s, i) => {
        // 단계마다 좁아진다 — 퍼널이라는 말이 눈에 보여야 한다
        const w = 100 - (i * 46) / n;
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              alignSelf: "center",
              width: `${w}%`,
              height: px(84),
              borderRadius: px(12),
              background: i === n - 1 ? NAVY : "#EDECF5",
              color: i === n - 1 ? "#fff" : INK,
              padding: `0 ${px(30)}px`,
              gap: px(18),
            }}
          >
            <div style={{ display: "flex", fontSize: px(34), fontWeight: 700 }}>{s.k}</div>
            {s.v ? (
              <div
                style={{
                  display: "flex",
                  fontSize: px(25),
                  color: i === n - 1 ? "rgba(255,255,255,.75)" : MUTED,
                }}
              >
                {s.v}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function Flow({ steps }: { steps: NonNullable<FigureSpec["steps"]> }) {
  return (
    <div style={{ display: "flex", alignItems: "stretch", gap: px(12), width: "100%" }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", flex: 1, gap: px(12) }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: px(10),
              flex: 1,
              minHeight: px(190),
              borderRadius: px(14),
              border: `${px(2)}px solid ${i === steps.length - 1 ? NAVY : LINE}`,
              background: i === steps.length - 1 ? NAVY : "#fff",
              color: i === steps.length - 1 ? "#fff" : INK,
              padding: px(24),
            }}
          >
            <div style={{ display: "flex", fontSize: px(20), color: i === steps.length - 1 ? "rgba(255,255,255,.6)" : MUTED }}>
              {String(i + 1).padStart(2, "0")}
            </div>
            <div style={{ display: "flex", fontSize: px(30), fontWeight: 700, lineHeight: 1.3 }}>
              {s.k}
            </div>
            {s.v ? (
              <div style={{ display: "flex", fontSize: px(22), lineHeight: 1.4, color: i === steps.length - 1 ? "rgba(255,255,255,.75)" : MUTED }}>
                {s.v}
              </div>
            ) : null}
          </div>
          {i < steps.length - 1 ? (
            <div style={{ display: "flex", fontSize: px(34), color: MUTED }}>→</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function Matrix({ axes, cells }: { axes?: FigureSpec["axes"]; cells: NonNullable<FigureSpec["cells"]> }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: px(16), width: "100%" }}>
      {axes ? (
        <div style={{ display: "flex", gap: px(12), fontSize: px(24), color: MUTED }}>
          <div style={{ display: "flex", flex: 1, fontWeight: 700, color: GOOD }}>{axes.x}</div>
          <div style={{ display: "flex", flex: 1, fontWeight: 700, color: BAD }}>{axes.y}</div>
        </div>
      ) : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: px(14) }}>
        {cells.map((c, i) => {
          const tone = c.tone ?? "flat";
          const bg = tone === "good" ? "#E8F2EC" : tone === "bad" ? "#F7E7EA" : "#F2F1F6";
          const fg = tone === "good" ? GOOD : tone === "bad" ? BAD : INK;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: px(8),
                width: "48%",
                minHeight: px(118),
                borderRadius: px(13),
                background: bg,
                padding: `${px(20)}px ${px(24)}px`,
                justifyContent: "center",
              }}
            >
              <div style={{ display: "flex", fontSize: px(29), fontWeight: 700, color: fg, lineHeight: 1.3 }}>
                {c.label ?? c.k ?? ""}
              </div>
              {c.note ?? c.v ? (
                <div style={{ display: "flex", fontSize: px(22), color: MUTED, lineHeight: 1.4 }}>
                  {c.note ?? c.v}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Cycle({ steps }: { steps: NonNullable<FigureSpec["steps"]> }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: px(14), width: "100%" }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: px(14) }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: px(8),
              width: px(210),
              height: px(210),
              borderRadius: px(999),
              background: i % 2 === 0 ? NAVY : "#EDECF5",
              color: i % 2 === 0 ? "#fff" : INK,
              padding: px(20),
              textAlign: "center",
            }}
          >
            <div style={{ display: "flex", fontSize: px(29), fontWeight: 700, lineHeight: 1.25 }}>{s.k}</div>
            {s.v ? (
              <div style={{ display: "flex", fontSize: px(20), lineHeight: 1.35, color: i % 2 === 0 ? "rgba(255,255,255,.75)" : MUTED }}>
                {s.v}
              </div>
            ) : null}
          </div>
          <div style={{ display: "flex", fontSize: px(32), color: MUTED }}>
            {i === steps.length - 1 ? "↺" : "→"}
          </div>
        </div>
      ))}
    </div>
  );
}

/** 도해 한 장을 PNG 로 그린다 */
export async function renderFigure(spec: FigureSpec) {
  const [bold, logoBuf] = await Promise.all([
    readFile(join(process.cwd(), "app/fonts/og-bold.ttf")),
    readFile(join(process.cwd(), "public/logo/navi-symbol.png")),
  ]);
  const logo = `data:image/png;base64,${logoBuf.toString("base64")}`;

  const steps = spec.steps ?? [];
  const body =
    spec.kind === "funnel" ? <Funnel steps={steps} />
    : spec.kind === "flow" ? <Flow steps={steps} />
    : spec.kind === "cycle" ? <Cycle steps={steps} />
    : <Matrix axes={spec.axes} cells={spec.cells ?? []} />;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: PAPER,
          padding: `${px(44)}px ${px(48)}px ${px(78)}px`,
          position: "relative",
          fontFamily: "Pyeojin",
        }}
      >
        {/* 로고는 좌상단 — 사장님 지시 (2026-08-22) */}
        <div style={{ display: "flex", alignItems: "center", gap: px(12), marginBottom: px(26) }}>
          <img src={logo} width={px(34)} height={px(34)} alt="" />
          <div style={{ display: "flex", fontSize: px(30), fontWeight: 700, color: INK, lineHeight: 1.3 }}>
            {spec.title}
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, alignItems: "center", width: "100%" }}>{body}</div>

        {spec.caption ? (
          <div style={{ display: "flex", fontSize: px(22), color: MUTED, marginTop: px(18), lineHeight: 1.4 }}>
            {spec.caption}
          </div>
        ) : null}

        <Watermark logo={logo} />
      </div>
    ),
    {
      ...FIGURE_SIZE,
      fonts: [{ name: "Pyeojin", data: bold, style: "normal", weight: 700 }],
    },
  );
}
