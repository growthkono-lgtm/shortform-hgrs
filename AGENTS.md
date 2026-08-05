<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# HGRS 숏폼 부스팅 (shortform.hgrs.io)

## 유일한 스펙 문서

`docs/MASTER-SPEC-v3.md` — 랜딩 카피·제품 UX·개발 스펙 전부. 코드를 쓰기 전에 해당 PART를 읽을 것.
스펙과 코드가 어긋나면 스펙이 정답이다. 스펙을 바꿔야 한다고 판단되면 코드를 먼저 고치지 말고 문서를 먼저 고친다.

스택: Next.js 16 / React 19 / Tailwind v4 / Supabase.

## 불변 원칙

- **웹 전용.** 네이티브 앱 아님. 모바일 반응형은 필수.
- **디자인은 hgrs.io 톤 계승.** 라이트/뉴트럴 에디토리얼, 다크 테마 아님. 모션 절제. (PART B)
- **카피는 A1 3기둥에서 파생.** 과장·호객 금지, 절제된 확신.
- **정책은 충돌하는 그 화면에 노출.** 약관 페이지는 법적 백업일 뿐. (PART E4)
- **결제 금액은 서버에서 `plans` 기준 재검증.** 클라이언트 금액 불신.
- **워터마크는 ffmpeg 번인만 인정.** CSS 오버레이 금지.
- **원본 영상은 Storage 공개 경로 금지.** Google Drive로만 전달.
- RLS 필수. 상태 전이·쓰기는 전부 server route 경유.

## 미확정 값

PART G([DATA] 교체 목록)와 PART I(오픈 이슈)는 아직 확정 전이다.
해당 값은 하드코딩하지 말고 `lib/constants.ts` 상수 또는 DB(`plans` 등)에서 읽어 한 곳만 고치면 전 화면에 반영되게 한다.
