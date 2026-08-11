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
      // 프레이머 시절 블로그 경로 → 새 블로그 자리
      { source: "/article", destination: "/blog", permanent: true },
    ];
  },
};

export default nextConfig;
