/**
 * 영상 생성 어댑터 — 2026-08-15 신설.
 *
 * ── 왜 어댑터인가 ─────────────────────────────────────────────────────
 * sora-2 가 6개월 만에 죽는다(2026-09-24 API 삭제). Runway Gen-4.5 는 작년
 * 말 1위였다가 리더보드에서 아예 빠졌다. **툴은 12개월이면 이름이 다 바뀐다.**
 *
 * 그러니 규격을 툴에 묶으면 안 된다. `lib/adfilm.ts` 는 sora API 를 직접
 * 부르고 있어서 툴을 바꾸려면 그 파일을 다시 써야 했다. 그 구조를 여기서 끊는다.
 * 위층(기획안·조립·검사)은 이 파일의 함수 모양만 알면 되고, 아래가 무엇이든 모른다.
 *
 * ── 왜 Seedance 인가 ──────────────────────────────────────────────────
 * 우리가 원하는 건 "기획안대로 나오는 것"이고, 그걸 만드는 메커니즘은
 * **레퍼런스 제어** 하나다. Seedance 2.0 은 한 호출에 이미지 9 · 비디오 3 ·
 * 오디오 3 을 받아 프롬프트에서 지목하게 해 준다. 다른 모델은 여기가 얇다.
 * (Artificial Analysis Image-to-Video 1위 · 국내 현장에서도 가장 많이 쓰인다.)
 *
 * ⚠️ 2026-08-15 확인 — **fal 에 올라온 최신은 2.0 이다. 2.5 는 없다.**
 * 국내 후기에 나온 "Seedance 2.5"(레퍼런스 30장·Extend)는 소비자 앱(Dreamina)
 * 쪽 이야기로 보인다. API 로 쓸 수 있는 건 2.0 이므로 그 스펙으로 짠다.
 */

import "server-only";

/* ── 엔드포인트 ────────────────────────────────────────────────────────
 * 2026-08-15 fal 공식 문서에서 확인한 그대로다. 추측한 값이 없다. */
const FAL_QUEUE = "https://queue.fal.run";

export type Tier = "standard" | "fast";

const ENDPOINT = {
  text: (t: Tier) =>
    t === "fast"
      ? "bytedance/seedance-2.0/fast/text-to-video"
      : "bytedance/seedance-2.0/text-to-video",
  image: (t: Tier) =>
    t === "fast"
      ? "bytedance/seedance-2.0/fast/image-to-video"
      : "bytedance/seedance-2.0/image-to-video",
  reference: (t: Tier) =>
    t === "fast"
      ? "bytedance/seedance-2.0/fast/reference-to-video"
      : "bytedance/seedance-2.0/reference-to-video",
} as const;

/**
 * 공시 단가(USD/초). 2026-08-15 fal 문서 실측.
 * 비디오 레퍼런스를 넣으면 0.6 배가 적용된다 — 우리 워크플로우는 제품 실물
 * 영상을 넣으므로 대개 이 구간에 들어간다.
 */
const PRICE: Record<Tier, number> = { standard: 0.3034, fast: 0.2419 };
const VIDEO_REF_MULTIPLIER = 0.6;

/**
 * 레퍼런스 지목 표기.
 *
 * ⚠️ 출처가 엇갈린다 — fal 모델 문서와 fal.ai/learn 은 `[Image1]`, 공식
 * 저장소 README 는 `@Image1` 예제를 쓴다. 둘 중 하나는 오래된 문서다.
 * 첫 생성에서 레퍼런스가 안 먹으면 이 상수만 바꿔 다시 돌린다.
 */
export const REF_MARKER: "bracket" | "at" = "bracket";

export function refMark(kind: "Image" | "Video" | "Audio", n: number): string {
  return REF_MARKER === "bracket" ? `[${kind}${n}]` : `@${kind}${n}`;
}

/* ── 과금 ──────────────────────────────────────────────────────────────
 * 부르기 전에 막는다. 펠리웨이 때 상한이 없어서 하루에 $10.8 이 나갔고
 * 같은 계정을 쓰는 블로그가 다음 날 못 돌 뻔했다. */
export const GEN_COST = {
  /** 한 편 상한. Seedance 단가가 sora 의 3배라 예전 $12 로는 못 돈다 */
  maxPerFilmUsd: 25,
  maxPerMonthUsd: 120,
} as const;

export function shotCost(input: {
  seconds: number;
  tier: Tier;
  hasVideoRef: boolean;
}): number {
  const base = PRICE[input.tier] * input.seconds;
  return Number(
    (input.hasVideoRef ? base * VIDEO_REF_MULTIPLIER : base).toFixed(4),
  );
}

export function assertWithinBudget(input: {
  spentThisMonth: number;
  spentOnThisFilm: number;
  aboutToSpend: number;
}): void {
  const film = input.spentOnThisFilm + input.aboutToSpend;
  if (film > GEN_COST.maxPerFilmUsd) {
    throw new Error(
      `한 편 상한 $${GEN_COST.maxPerFilmUsd} 초과 — 이미 $${input.spentOnThisFilm.toFixed(2)} 썼고 $${input.aboutToSpend.toFixed(2)} 를 더 쓰려 합니다`,
    );
  }
  const month = input.spentThisMonth + input.aboutToSpend;
  if (month > GEN_COST.maxPerMonthUsd) {
    throw new Error(
      `이번 달 상한 $${GEN_COST.maxPerMonthUsd} 초과 — 이번 달 $${input.spentThisMonth.toFixed(2)} 를 썼습니다`,
    );
  }
}

function key(): string {
  const k = process.env.FAL_KEY;
  if (!k) throw new Error("FAL_KEY 가 설정되지 않았습니다");
  return k;
}

async function call(path: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(path, {
    ...init,
    headers: {
      Authorization: `Key ${key()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`fal ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
}

export type ShotRequest = {
  prompt: string;
  /** 4~15. Seedance 는 초를 문자열로 받는다 */
  seconds: number;
  imageUrls?: string[];
  videoUrls?: string[];
  audioUrls?: string[];
  tier?: Tier;
  /**
   * 재현성의 핵심. **같은 seed + 같은 프롬프트 = 같은 결과**여야
   * "편차 없는 균일한 퀄리티"를 계약서에 쓸 수 있다.
   * 편차 측정 테스트에서는 이 값을 바꿔 가며 3회 돌린다.
   */
  seed?: number;
  /**
   * ⚠️ 기본 **꺼짐**. (2026-08-18 뒤집음)
   *
   * 그전까지 기본이 켬이었고, 그래서 **중국 모델이 한국어를 발음했다.**
   * 사장님이 말씀하신 "중국어처럼 어눌하고 끊긴다" 의 정체가 이것이다.
   * 한국어 음성은 전량 한국어 특화 TTS 로 후합성한다 — 명세서 §6-1-2.
   *
   * 켤 수 있게는 남긴다. 환경음·효과음만 필요한 무발화 컷에는 쓸모가 있다.
   * 다만 **대사가 있는 컷에서는 절대 켜지 않는다.**
   */
  generateAudio?: boolean;

  /**
   * 첫 프레임으로 못 박을 스틸. **이걸 주면 image-to-video 로 간다.**
   *
   * ── 왜 생겼나 (2026-08-18 A/B 실측) ─────────────────────────────────
   * 그전까지 스틸을 `imageUrls` 로 넘겼고, 그러면 reference-to-video 로 갔다.
   * 거기서 이미지는 **참고**다 — 모델이 인물을 매번 다시 그린다.
   * 같은 스틸·같은 프롬프트로 두 경로를 재 봤다(SSIM, 1.0=동일):
   *
   *   reference-to-video   0.642   ← 얼굴·머리·배경·구도까지 다시 그림
   *   image-to-video       0.922   ← 압축 손실 빼면 사실상 그 프레임 그대로
   *
   * "이미지를 먼저 만들었는데도 인물이 달라 보인다" 의 원인이 이것이었다.
   * 스틸을 애써 고정해 놓고 "참고해 줘" 로 넘기고 있었다.
   */
  firstFrameUrl?: string;

  /**
   * 마지막 프레임. 샷 N 의 끝을 샷 N+1 의 첫 프레임과 같게 물리면
   * **컷 간 연결이 구조적으로 이어진다.** 모델의 자유도가 중간 모션으로만
   * 제한되므로 "컷 간 연결이 어색하다" 도 같이 사라진다.
   */
  lastFrameUrl?: string;
};

export type ShotJob = {
  requestId: string;
  statusUrl: string;
  responseUrl: string;
  endpoint: string;
  estimatedCost: number;
};

/**
 * 샷 하나를 큐에 넣는다. **기다리지 않는다** — 한 컷이 수 분 걸리는데
 * 서버리스 함수가 그걸 붙들고 있으면 300초에서 끊긴다.
 */
export async function submitShot(req: ShotRequest): Promise<ShotJob> {
  const tier = req.tier ?? "standard";
  const hasRefs =
    (req.imageUrls?.length ?? 0) > 0 ||
    (req.videoUrls?.length ?? 0) > 0 ||
    (req.audioUrls?.length ?? 0) > 0;

  /**
   * 경로 선택 — 스틸이 있으면 **무조건 image-to-video** 다. (2026-08-18)
   *
   * 우선순위가 뒤집혔다. 예전엔 "레퍼런스가 있으면 reference-to-video" 였는데,
   * 그 경로에서 이미지는 참고일 뿐이라 인물이 매번 새로 그려졌다(위 A/B 실측).
   * 확정한 스틸이 있다는 것은 **그 프레임에서 시작하라는 뜻**이지 참고하라는
   * 뜻이 아니다.
   *
   *   firstFrame 있음        → image-to-video   (프레임 고정)
   *   레퍼런스만 있음         → reference-to-video (스타일·개체 참고)
   *   둘 다 없음             → text-to-video     (명세서가 금지. 아래에서 막는다)
   */
  const endpoint = req.firstFrameUrl
    ? ENDPOINT.image(tier)
    : hasRefs
      ? ENDPOINT.reference(tier)
      : ENDPOINT.text(tier);

  /**
   * T2V 원샷 금지 — 명세서 §6-1-3.
   *
   * 스틸도 레퍼런스도 없이 글로만 뽑으면 매 컷이 다른 세계가 된다. 그게
   * v16 까지의 편차 원인이었다. 실수로 이 경로를 타지 않게 여기서 끊는다.
   */
  if (endpoint === ENDPOINT.text(tier) && process.env.ADFILM_ALLOW_T2V !== "1") {
    throw new Error(
      "스틸(firstFrameUrl) 없이 영상을 만들 수 없습니다 — 확정 스틸에서 시작해야 합니다",
    );
  }

  if (req.seconds < 4 || req.seconds > 15) {
    throw new Error(`길이 ${req.seconds}초 — Seedance 는 4~15초만 받습니다`);
  }
  if ((req.imageUrls?.length ?? 0) > 9) throw new Error("레퍼런스 이미지는 9장까지입니다");
  if ((req.videoUrls?.length ?? 0) > 3) throw new Error("레퍼런스 비디오는 3개까지입니다");
  if ((req.audioUrls?.length ?? 0) > 3) throw new Error("레퍼런스 오디오는 3개까지입니다");

  const body: Record<string, unknown> = {
    prompt: req.prompt,
    resolution: "720p", // fal 은 480p·720p 만 준다. 우리 규격이 720x1280 이라 충분
    duration: String(req.seconds),
    // 기본 꺼짐. 대사가 있는 컷에서 켜면 모델이 한국어를 발음한다
    generate_audio: req.generateAudio ?? false,
  };
  if (req.seed != null) body.seed = req.seed;

  if (req.firstFrameUrl) {
    // i2v 는 단수 image_url 이다. 비율은 스틸이 정하므로 aspect_ratio 를 안 보낸다
    body.image_url = req.firstFrameUrl;
    if (req.lastFrameUrl) body.end_image_url = req.lastFrameUrl;
  } else {
    body.aspect_ratio = "9:16";
    if (req.imageUrls?.length) body.image_urls = req.imageUrls;
    if (req.videoUrls?.length) body.video_urls = req.videoUrls;
    if (req.audioUrls?.length) body.audio_urls = req.audioUrls;
  }

  const data = (await call(`${FAL_QUEUE}/${endpoint}`, {
    method: "POST",
    body: JSON.stringify(body),
  })) as {
    request_id?: string;
    status_url?: string;
    response_url?: string;
  };

  if (!data.request_id) throw new Error("fal 응답에 request_id 가 없습니다");

  return {
    requestId: data.request_id,
    statusUrl: data.status_url ?? `${FAL_QUEUE}/${endpoint}/requests/${data.request_id}/status`,
    responseUrl: data.response_url ?? `${FAL_QUEUE}/${endpoint}/requests/${data.request_id}`,
    endpoint,
    estimatedCost: shotCost({
      seconds: req.seconds,
      tier,
      hasVideoRef: (req.videoUrls?.length ?? 0) > 0,
    }),
  };
}

export type ShotStatus = {
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  queuePosition: number | null;
};

export async function shotStatus(job: ShotJob): Promise<ShotStatus> {
  const d = (await call(job.statusUrl)) as {
    status?: string;
    queue_position?: number;
  };
  return {
    status: (d.status as ShotStatus["status"]) ?? "IN_QUEUE",
    queuePosition: d.queue_position ?? null,
  };
}

export type ShotResult = {
  videoUrl: string;
  seed: number | null;
  /** 이 컷을 재현하려면 필요한 전부 — 규격서에 그대로 실린다 */
  reproduce: { endpoint: string; prompt: string; seed: number | null };
};

export async function shotResult(job: ShotJob, prompt: string): Promise<ShotResult> {
  const d = (await call(job.responseUrl)) as {
    video?: { url?: string };
    seed?: number;
  };
  if (!d.video?.url) throw new Error("fal 응답에 영상 URL 이 없습니다");
  return {
    videoUrl: d.video.url,
    seed: d.seed ?? null,
    reproduce: { endpoint: job.endpoint, prompt, seed: d.seed ?? null },
  };
}

/** 완성본 내려받기 — 조립 전 원본 */
export async function downloadShot(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`영상 내려받기 실패 (${res.status})`);
  return res.arrayBuffer();
}
