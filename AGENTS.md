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

## 홈페이지를 "그대로" 옮길 때 (소개서·제안서 작업)

소개서(`scripts/build-deck.ts`)는 **홈페이지가 원본이다.** 사장님이 *"그대로"·
"동일하게"·"따라 해"* 라고 하시면 픽셀·문구 단위로 옮긴다는 뜻이다.
단어의 세 단계 정의는 전역 규칙(`~/.claude/CLAUDE.md`)에 있다.

**작업 전에 대조표를 드리고 승인을 받는다.** 순서:

1. 원본 컴포넌트·데이터 파일을 연다 (`components/landing/*`, `components/sns/*`,
   `lib/sns-brand.ts`, `lib/cases.ts`, `lib/home.ts`, `app/globals.css`)
2. `항목 | 홈페이지 값 | 소개서 값 | 출처 파일:줄` 표를 만든다
3. **매체 차이로 못 옮기는 것을 그 표에 적는다** — PDF에는 영상 재생·호버·마퀴·
   카운트업이 없다. 애니메이션은 **완성 상태**로 고정해 옮긴다
4. **원본 데이터에 있는데 안 쓸 필드는 이유를 적는다.**
   실제로 놓친 적 있음: `FEATURES[].figures`(기획안·퍼널맵 도판),
   `FEATURES[].channels`(채널 타일·구독자 수), `FEATURES[].videos`
5. 승인 후 코드에 넣고, `npm run deck && npm run deck:doctor` 로 넘침 0건 확인
6. 캡처로 나란히 보여 드린다

환산 기준: 홈 본문 폭 1152px ↔ 소개서 안전영역 306.67mm →
**웹 1px = 0.2662mm = 0.755pt.** (16px → 12.1pt, 14px → 10.6pt)

조판 규격은 `docs/deck/LAYOUT.md`.
