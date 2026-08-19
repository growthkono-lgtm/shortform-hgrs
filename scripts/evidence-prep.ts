// 실적증빙 이미지를 public/evidence/ 로 정리하는 스크립트.
// - 민감정보(개인정보) 2장은 지정된 영역만 모자이크+블러 처리 후 저장
// - 나머지는 파일명만 ASCII 슬러그로 바꿔 복사
// - public/evidence/index.json 에 산출물 목록 기록
//
// 재실행 가능: public/evidence/ 를 매번 새로 씀 (원본 폴더는 절대 건드리지 않음)
//
// 실행: npx tsx scripts/evidence-prep.ts

import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";

const SRC_DIR = path.resolve(__dirname, "../실적증빙 (브랜드매칭)");
const OUT_DIR = path.resolve(__dirname, "../public/evidence");

type Kind = "퍼포먼스" | "소재" | "그로스" | "편성" | "인플루언서";

interface MaskBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface EvidenceItem {
  srcFile: string;
  outFile: string;
  brand: string;
  kind: Kind;
  caption: string;
  masks?: MaskBox[];
}

// 브랜드 슬러그
const BRAND = {
  realAcademy: "리얼아카데미",
  trusty: "트러스티푸드",
  zeroblock: "제로블럭",
  krafton: "크래프톤",
  fitflex: "핏플렉스",
  sinseonhaeng: "신선행",
  lubdi: "럽디 리데이트",
} as const;

const ITEMS: EvidenceItem[] = [
  {
    srcFile: "리얼아카데미 소재 실적.png",
    outFile: "real-academy-creative.png",
    brand: BRAND.realAcademy,
    kind: "소재",
    caption:
      "리얼아카데미 광고 소재별(맘카페 리포트, MBTI 유형별 공부법 등) 지출·노출·클릭·Lead Complete·CPM·CTR·CPC·CPA 실적표.",
  },
  {
    srcFile: "리얼아카데미 컨텐츠 그로스마케팅.png",
    outFile: "real-academy-growth.png",
    brand: BRAND.realAcademy,
    kind: "그로스",
    caption:
      "리얼아카데미 콘텐츠 소재별 학년(고학년/저학년/미기입) 반응 비중과 고학년 비율을 정리한 그로스 분석표.",
  },
  {
    srcFile:
      "리얼아카데미 퍼포먼스실적.png",
    outFile: "real-academy-performance.png",
    brand: BRAND.realAcademy,
    kind: "퍼포먼스",
    caption:
      "리얼아카데미 월별 퍼포먼스 마케팅 실적(지출·노출·클릭·Lead Complete·CPM·CTR·CPC·CPA). 2월·3월의 지출·노출·클릭 값은 비공개 처리.",
    masks: [
      // 표: 월 | 지출 | 노출 | 클릭 | Lead Complete | CPM | CTR | CPC | CPA | CPA(원)
      // 1월 행은 그대로 두고 2월·3월 행의 지출~클릭 3개 열만 블러.
      // 좌표는 원본 픽셀에서 직접 측정(아래 "가공 근거" 참고).
      { left: 330, top: 90, width: 620, height: 96 },
    ],
  },
  {
    srcFile: "럽디 리데이트.png",
    outFile: "lubdi-redate-response-rate.png",
    // 2026-08-19 사장님 정정 — 리얼아카데미가 아니라 **럽디 리데이트** 자료이고,
    // 소개서 29번 장표(유튜브 인물 브랜딩 → 고객 DB)에 붙는다
    brand: BRAND.lubdi,
    kind: "그로스",
    caption:
      "럽디 리데이트 R진단지(고객 미응답률) 개선 추이. 9월 56%에서 6월4주 10%까지 미응답률이 낮아졌습니다.",
  },
  {
    srcFile: "신선행(기타) 퍼포먼스마케팅실적.png",
    outFile: "sinseonhaeng-performance.png",
    brand: BRAND.sinseonhaeng,
    kind: "퍼포먼스",
    caption:
      "신선행 캠페인별(새 잠재 고객 캠페인, 탈리 랜딩 테스트) 월별 지출·노출·도달·클릭·CPC·CTR·결과 수·결과당 비용 실적표.",
  },
  {
    srcFile: "제로블럭 소재실적.png",
    outFile: "zeroblock-creative.png",
    brand: BRAND.zeroblock,
    kind: "소재",
    caption:
      "제로블럭 광고 소재별 지출·노출·도달·클릭·링크 클릭·CPC·CTR·상담문의시도 실적표(20개 소재 행).",
  },
  {
    srcFile: "제로블럭 퍼포먼스마케팅실적.png",
    outFile: "zeroblock-performance.png",
    brand: BRAND.zeroblock,
    kind: "퍼포먼스",
    caption:
      "제로블럭 3~6월 월별 지출·노출·도달·클릭·CPC·CTR·상담문의시도·견적문의시도·문의 시도당 최종 단가 실적표.",
  },
  {
    srcFile: "크래프톤 배틀그라운드 편성표.png",
    outFile: "krafton-battlegrounds-schedule.png",
    brand: BRAND.krafton,
    kind: "편성",
    caption:
      "크래프톤 배틀그라운드(PNC 2024) 채널 콘텐츠 편성표. 일자별 Long/Shorts 업로드 스케줄과 촬영·인터뷰 일정(스태프 성함은 비공개 처리).",
    masks: [
      /**
       * 스태프 열에 실명이 적혀 있다(2행). 소개서는 외부에 나가는 문서라
       * 본인 동의 없이 실을 이름이 아니다. 열 전체를 덮는다 — 이 열에 값이
       * 있는 행이 그 두 줄뿐이라 가려도 편성 정보는 손실되지 않는다.
       * 좌표는 원본 2118×988 기준 열 경계에서 계산했다.
       */
      { left: 550, top: 375, width: 400, height: 100 },
    ],
  },
  {
    srcFile: "트러스티푸드 광고소재실적.png",
    outFile: "trusty-creative-1.png",
    brand: BRAND.trusty,
    kind: "소재",
    caption:
      "트러스티푸드 광고 소재(이미지·영상)별 지출·CTR·구매·결과당 비용·구매 전환값·ROAS 실적표.",
  },
  {
    srcFile: "트러스티푸드 광고소재실적2.png",
    outFile: "trusty-creative-2.png",
    brand: BRAND.trusty,
    kind: "소재",
    caption:
      "트러스티푸드 캠페인별 지출·노출·클릭·CTR·CPM·CPC·구매·결과당 비용·구매 전환값·ROAS 실적표.",
  },
  {
    srcFile: "트러스티푸드 퍼포먼스마케팅실적.png",
    outFile: "trusty-performance.png",
    brand: BRAND.trusty,
    kind: "퍼포먼스",
    caption:
      "트러스티푸드 4~7월 월별 지출금액·노출·클릭·CTR·CPC·구매 수·구매당 비용·전환 매출·ROAS 실적표.",
  },
  {
    srcFile:
      "핏플렉스 인플루언서 리스트.png",
    outFile: "fitflex-influencer-list.png",
    brand: BRAND.fitflex,
    kind: "인플루언서",
    caption:
      "핏플렉스 인플루언서 협업 리스트. 채널명·상품명·계약일·PPL 업로드일·상품 링크 등 진행 현황표(인플루언서 성함·컨택포인트는 비공개 처리).",
    masks: [
      // 표: RS | 채널명 | 성함 | 컨택포인트 | 상품명 | 상품번호 | ...
      // 채널명은 공개, 성함·컨택포인트(이메일) 열 전체(헤더 아래 데이터 전체)를 블러.
      { left: 553, top: 70, width: 547, height: 664 },
    ],
  },
];

/**
 * 지정 영역을 모자이크(강한 픽셀화) + 가우시안 블러로 가공해
 * 원본 위에 합성한다. 표 바깥 구조는 그대로 유지되어 증빙 신뢰도를 지킨다.
 */
// sharp 는 default export 라 `sharp.Sharp` 네임스페이스 타입이 안 잡힌다.
// 인스턴스 타입은 호출 결과에서 끌어온다 — 타입 선언을 따로 안 들여와도 된다.
type SharpImage = ReturnType<typeof sharp>;

async function maskRegion(
  image: SharpImage,
  box: MaskBox,
): Promise<SharpImage> {
  const inputBuffer = await image.clone().toBuffer();

  const region = sharp(inputBuffer).extract(box);

  // 글자를 절대 읽을 수 없도록 큰 블록으로 축소했다가 다시 키운다(모자이크).
  const tile = 12; // px 기준 블록 크기
  const smallW = Math.max(1, Math.round(box.width / tile));
  const smallH = Math.max(1, Math.round(box.height / tile));

  const pixelated = await region
    .resize(smallW, smallH, { kernel: sharp.kernel.nearest })
    .resize(box.width, box.height, { kernel: sharp.kernel.nearest })
    .toBuffer();

  // 모자이크 경계를 한 번 더 부드럽게 뭉개서 확대해도 안 읽히게 만든다.
  const finalMasked = await sharp(pixelated).blur(18).toBuffer();

  return sharp(inputBuffer).composite([
    { input: finalMasked, left: box.left, top: box.top },
  ]);
}

async function processItem(item: EvidenceItem) {
  const srcPath = path.join(SRC_DIR, item.srcFile);
  const outPath = path.join(OUT_DIR, item.outFile);

  let image = sharp(await fs.readFile(srcPath));

  if (item.masks && item.masks.length > 0) {
    for (const box of item.masks) {
      image = await maskRegion(image, box);
    }
  }

  const buffer = await image.png().toBuffer();
  await fs.writeFile(outPath, buffer);

  const metadata = await sharp(buffer).metadata();
  return {
    file: item.outFile,
    brand: item.brand,
    kind: item.kind,
    caption: item.caption,
    width: metadata.width ?? null,
    height: metadata.height ?? null,
    masked: Boolean(item.masks && item.masks.length > 0),
  };
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const index = [];
  for (const item of ITEMS) {
    const entry = await processItem(item);
    index.push(entry);
    console.log(`done: ${item.srcFile} -> ${item.outFile}`);
  }

  const indexPath = path.join(OUT_DIR, "index.json");
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2) + "\n");
  console.log(`wrote ${indexPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
