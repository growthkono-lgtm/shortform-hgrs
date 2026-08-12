import type { NextConfig } from "next";

/** 마케팅 노하우 연재 — 자체 블로그 대신 여기로 보낸다 */
const BRUNCH_URL = "https://brunch.co.kr/brunchbook/bmaha2";

/**
 * 프레이머 시절 hgrs.io 경로를 살려 준다 (2026-08-11 도메인 이전).
 *
 * 이 URL 들은 명함·제안서·검색결과·외부 링크에 이미 박혀 있다. 그냥 404 로
 * 떨어뜨리면 그동안 쌓인 유입과 검색 신호가 통째로 사라진다.
 * 영구 이동(308)이라 검색엔진이 새 주소로 신호를 옮겨 준다.
 */
const nextConfig: NextConfig = {
  async redirects() {
    return [
      /**
       * ⚠️ www → apex 308 을 걸었다가 뺐다 (2026-08-11).
       *
       * apex 인증서가 발급되기 전 Vercel 이 apex → www 로 308 을 내보냈고,
       * 그게 브라우저에 **영구 캐시**된 상태에서 반대 방향 308 을 얹으니
       * ERR_TOO_MANY_REDIRECTS 로 물렸다. 308 은 브라우저가 지우지 않는다.
       *
       * 그래서 www 도 그냥 200 으로 서빙한다. 중복 색인은 canonical 이 막는다
       * (모든 페이지 canonical 은 https://hgrs.io/... 로 고정).
       */
      // 서브도메인 → 루트 도메인 하위 경로 (2026-08-11 도메인 이전).
      // shortform.hgrs.io 에 쌓인 검색 신호를 hgrs.io 로 넘긴다. 링크는 죽지 않는다.
      {
        source: "/:path*",
        has: [{ type: "host", value: "shortform.hgrs.io" }],
        destination: "https://hgrs.io/:path*",
        permanent: true,
      },
      // 서브도메인 루트로 들어온 사람은 숏폼 랜딩으로
      {
        source: "/",
        has: [{ type: "host", value: "shortform.hgrs.io" }],
        destination: "https://hgrs.io/shortform",
        permanent: true,
      },
      // 브랜드 단위 프로젝트를 찾던 사람 → 브랜드 SNS 채널
      { source: "/partnership", destination: "/sns-brand", permanent: true },
      { source: "/coaching", destination: "/sns-brand", permanent: true },
      // 개별 사례 상세는 통합 사례 페이지로
      {
        source: "/portfolio/:slug",
        destination: "/portfolio",
        permanent: true,
      },
      // 문의 → 문의 폼
      {
        source: "/contact",
        destination: "/sns-brand#contact",
        permanent: true,
      },
      /**
       * 블로그는 브런치북으로 보낸다.
       *
       * 2026-08-12: 자체 /blog 를 접었다. 글·이미지·구성 품질이 발행할 수준이
       * 아니었고, 제대로 하려면 기획-제작-발행 자동화를 따로 설계해야 한다.
       * 그때까지 이 경로들은 전부 이미 쌓여 있는 브런치북으로 넘긴다 —
       * 빈 페이지를 남기거나 404 를 내는 것보다 낫다.
       *
       * permanent: false (307/308 아님) — 자체 블로그를 다시 열 때
       * 브라우저·검색엔진에 영구 이전으로 굳어 있으면 되돌리기 어렵다.
       */
      { source: "/article", destination: BRUNCH_URL, permanent: false },
      { source: "/blog", destination: BRUNCH_URL, permanent: false },
      { source: "/blog/:path*", destination: BRUNCH_URL, permanent: false },
    ];
  },
};

export default nextConfig;
