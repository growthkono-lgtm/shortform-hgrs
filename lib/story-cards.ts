/**
 * 고객 이야기 카드 — 제목 문구의 단일 출처. (2026-08-20)
 *
 * 사장님: *"너가 내 포트폴리오 성장사례 정리해줄때 문구랑 정리해줬잖아
 * (썸네일 노출되는 곳 제목 문구 잘 했잖아) 그거 그대로 동일하게 쓰고."*
 *
 * 원래 이 제목들은 `scripts/seed-stories.mjs` · `seed-stories-2.mjs` 가
 * blog_post 로 시드한 값이라 **코드 어디서도 못 읽는 상태**였다(DB 안에만 있음).
 * 소개서가 같은 문구를 쓰려면 파일로 있어야 해서 여기로 옮긴다.
 *
 * ⚠️ 제목을 고칠 일이 생기면 **DB(blog_post.title)와 여기를 같이** 고친다.
 * 형식은 `성과 한 줄 — 브랜드 기간`. 숫자는 전부 프레이머 원문에 있던 값이다.
 *
 * 링크는 `hgrs.io/blog/{slug}` — 소개서 카드에서 누르면 글로 넘어간다.
 */

export type StoryCard = {
  /** blog_post.slug — 링크 주소가 된다 */
  slug: string;
  /** 프레이머 포트폴리오 슬러그 — 대표 이미지를 여기서 가져온다 */
  framer: string;
  /** 썸네일에 노출되는 제목 문구 (그대로 쓴다) */
  title: string;
};

export const STORY_CARDS: StoryCard[] = [
  {
    slug: "story-krafton-pubg-esports",
    framer: "크래프톤",
    title: "죽어 있던 공식 유튜브를 다시 켜는 일 — 크래프톤 배틀그라운드 이스포츠 12개월",
  },
  {
    slug: "story-lotte-greencar",
    framer: "롯데렌탈-그린카",
    title: "가입 CPA를 45% 낮추고 광고 매출을 5배로 — 롯데렌탈 그린카",
  },
  {
    slug: "story-realclass-scaleup",
    framer: "리얼클래스",
    title: "월 5천만 원에서 4억까지 — 리얼클래스 광고 스케일업 13개월",
  },
  {
    slug: "story-lovedy-growth-funnel",
    framer: "럽디",
    title: "광고를 늘리지 않고 상담 DB를 6배로 — 럽디 콘텐츠 그로스 12개월",
  },
  {
    slug: "story-dmand-gochodaejol",
    framer: "디맨드",
    title: "광고 예산을 10배 늘리면서 CPA를 30원대로 — 고초대졸닷컴 12개월",
  },
  {
    slug: "story-trusty-food-imc",
    framer: "트러스티푸드",
    title: "블라인드 시식대회와 댕터뷰 — 트러스티푸드 SNS 브랜딩과 퍼포먼스 12개월",
  },
  {
    slug: "story-moev-launch-roas",
    framer: "모에브",
    title: "런칭 4개월에 ROAS 3배·예산 4배 — 모에브 뷰티 커머스",
  },
  {
    slug: "story-parkron-zeroblock",
    framer: "파크론-제로블럭",
    title: "매트리스 구독 CPA를 9만 원 낮춘 3개월 — 파크론 제로블럭",
  },
  {
    slug: "story-yeolda-o2o-youtube",
    framer: "열다",
    title: "예산이 없는 스타트업이 유튜브로 CPA를 17% 낮춘 방법 — 열다 4개월",
  },
  {
    slug: "story-walla-b2b-seo",
    framer: "왈라",
    title: "B2B SaaS가 SEO로 KT까지 닿는 과정 — 왈라 6개월",
  },
  /* ── 아래 8건은 소개서 "주요 사례" 10칸에는 안 들어가지만,
        IMC 28건 목록에서 링크로 이어진다. 목록을 여기 다 두는 이유는
        슬러그가 한 곳에만 있어야 링크가 깨지지 않기 때문이다. ── */
  { slug: "story-fitflex", framer: "핏플렉스", title: "7만 원짜리 그립을 비싸게 팔 준비 — 핏플렉스 6개월" },
  {
    slug: "story-juwangsan-garden",
    framer: "주왕산가든",
    title: "고객 1,000명이 마케터가 되는 구조 — 주왕산가든 커뮤니티 커머스",
  },
  {
    slug: "story-cyberdigm-seo",
    framer: "사이버다임",
    title: "B2B SaaS의 블로그를 세일즈 퍼널로 — 사이버다임 SEO 컨설팅",
  },
  {
    slug: "story-herwell-irvinelab",
    framer: "허웰",
    title: "광고비 경쟁에서 빠져나오는 리브랜딩 — 어바인랩 3개월",
  },
  { slug: "story-banaco", framer: "바나코", title: "이미 잘하는 브랜드에 무엇을 더할 것인가 — 바나코 코칭" },
  {
    slug: "story-sambunui-il",
    framer: "삼분의일",
    title: "100만 원대 브랜드가 500만 원대 제품을 내놓을 때 — 삼분의일 GTM",
  },
  {
    slug: "story-mudit-crm",
    framer: "뮤디트",
    title: "단일 상품 쇼핑몰의 구매전환율을 2%p 올린 CRM — 뮤디트",
  },
  {
    slug: "story-naechinso",
    framer: "내친소",
    title: "CPI를 17% 낮추면서 브랜드 각인을 지키는 법 — 내친소",
  },
];

/** 소개서 "주요 사례" 장에 싣는 10건 — 브랜드 인지도와 숫자 성과가 센 순서 */
export const FEATURED_STORIES = STORY_CARDS.slice(0, 10);

/** 프레이머 슬러그로 이야기 찾기 — IMC 카드에 링크를 달 때 쓴다 */
export const storyByFramer = (framer: string): StoryCard | undefined =>
  STORY_CARDS.find((s) => s.framer === framer);
