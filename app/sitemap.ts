import type { MetadataRoute } from "next";
import { SERVICE } from "@/lib/constants";

/**
 * 공개 페이지만 싣는다. 로그인 뒤 화면은 색인 대상이 아니다.
 *
 * /blog 는 뺐다 (2026-08-12) — 자체 블로그를 접고 브런치북으로 리다이렉트한다.
 * 리다이렉트되는 주소를 사이트맵에 실으면 검색엔진에 잘못된 신호를 준다.
 */
const PAGES: {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/shortform", priority: 1, changeFrequency: "weekly" },
  { path: "/sns-brand", priority: 1, changeFrequency: "weekly" },
  { path: "/portfolio", priority: 0.9, changeFrequency: "weekly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/refund-policy", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    ...PAGES.map((page) => ({
      url: `${SERVICE.url}${page.path}`,
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
  ];
}
