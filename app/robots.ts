import type { MetadataRoute } from "next";
import { SERVICE } from "@/lib/constants";

/**
 * 크롤러 규칙. 로그인·결제·어드민처럼 색인될 이유가 없는 경로는 막는다.
 * (막아도 접근 제어는 서버 레이아웃이 따로 한다 — robots 는 색인 힌트일 뿐이다)
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/app",
          "/checkout",
          "/login",
          "/signup",
          "/auth",
          "/onboarding",
          "/preview",
        ],
      },
    ],
    sitemap: `${SERVICE.url}/sitemap.xml`,
    host: SERVICE.url,
  };
}
