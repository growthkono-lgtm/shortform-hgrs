import type { MetadataRoute } from "next";
import { SERVICE } from "@/lib/constants";
import { listPosts } from "@/lib/blog-posts";
import { FRAMER_CASES } from "@/lib/framer-portfolio";

/**
 * 공개 페이지만 싣는다. 로그인 뒤 화면은 색인 대상이 아니다.
 *
 * /blog 를 2026-08-13 에 다시 넣었다. 글은 파일에서 읽으므로 새 글을 커밋하면
 * 사이트맵에도 자동으로 올라간다 — 목록을 손으로 관리하면 반드시 빠뜨린다.
 *
 * 2026-08-20: 프레이머 시절 /portfolio/{클라이언트명} 주소 28건을 넣는다.
 * 프레이머가 색인시켜 둔 주소라 그대로 살아 있어야 하고, 명함·메일에도 박혀
 * 있다. 여기 빠지면 새 도메인에서 그 주소가 새로 색인될 길이 없다.
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const posts = await listPosts();

  return [
    ...PAGES.map((page) => ({
      url: `${SERVICE.url}${page.path}`,
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...FRAMER_CASES.map((c) => ({
      url: `${SERVICE.url}/portfolio/${encodeURIComponent(c.slug)}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...posts.map((post) => ({
      url: `${SERVICE.url}/blog/${post.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
