import type { MetadataRoute } from "next";
import { SERVICE } from "@/lib/constants";
import { POSTS } from "@/lib/blog";

/**
 * 공개 페이지만 싣는다. 로그인 뒤 화면은 색인 대상이 아니다.
 * 블로그 글은 자체 발행일을 lastmod 로 싣는다.
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
  { path: "/blog", priority: 0.8, changeFrequency: "weekly" },
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
    // 글은 자체 발행일을 lastmod 로 쓴다 — 매 빌드마다 갱신된 것처럼 보이면 신뢰를 잃는다
    ...POSTS.map((post) => ({
      url: `${SERVICE.url}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
