import { redirect } from "next/navigation";
import { ARCHIVE } from "@/lib/sns-brand";

/**
 * /blog — 지금은 브런치북으로 보낸다.
 *
 * 자체 블로그를 이 경로에 그대로 세울 예정이라 **영구(308) 리다이렉트를 쓰지 않는다.**
 * 영구로 걸면 검색엔진이 이 주소를 브런치로 굳혀 버려서, 나중에 글을 올려도
 * 색인이 옮겨 오는 데 시간이 걸린다. 임시(307)로 둔다.
 */
export default function BlogPage() {
  redirect(ARCHIVE.href);
}
