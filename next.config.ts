import type { NextConfig } from "next";

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
      // 브랜드 단위 프로젝트를 찾던 사람 → 브랜드 SNS 채널
      { source: "/partnership", destination: "/sns-brand", permanent: true },
      { source: "/coaching", destination: "/sns-brand", permanent: true },
      // 성과 사례 → 사례 섹션
      {
        source: "/portfolio",
        destination: "/sns-brand#cases",
        permanent: true,
      },
      {
        source: "/portfolio/:slug",
        destination: "/sns-brand#cases",
        permanent: true,
      },
      // 브런치 블로그
      {
        source: "/article",
        destination: "https://brunch.co.kr/brunchbook/bmaha2",
        permanent: true,
      },
      // 문의 → 문의 폼
      {
        source: "/contact",
        destination: "/sns-brand#contact",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
