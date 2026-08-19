/**
 * CSV 한 장 만들기. (2026-08-19)
 *
 * 사장님 지시: *"컨텐츠 발행표 전체든 키워드 전체든 csv로 받을 수 있게 해줘야
 * 내가 필터 걸어서 추려서 너한테 피드백 줄 것 같아."*
 *
 * 어드민 표는 화면에 맞춰 잘려 있다(쪽당 50개·열 13개). 판단은 전체를 놓고
 * 정렬·필터해 봐야 나오는데 그건 브라우저 표가 아니라 엑셀이 할 일이다.
 *
 * ── 엑셀에서 한글이 깨지는 문제 ────────────────────────────────────────
 * 맥 엑셀은 CSV 를 열 때 인코딩을 묻지 않고 시스템 기본으로 읽는다. UTF-8 로
 * 저장해도 한글이 깨져 나온다. **BOM(﻿)** 을 맨 앞에 붙이면 엑셀이
 * UTF-8 로 인식한다. 이 한 글자가 없으면 표가 통째로 못 쓰게 된다.
 */

/** CSV 한 칸 — 쉼표·따옴표·줄바꿈이 들어와도 안 깨지게 감싼다 */
function cell(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) v = v.join(" | ");
  if (typeof v === "object") v = JSON.stringify(v);
  const s = String(v);
  /**
   * `=` `+` `-` `@` 로 시작하는 값은 엑셀이 **수식으로 해석한다**(CSV 인젝션).
   * 키워드에 그런 글자가 앞에 붙는 경우가 실제로 있어서 앞에 작은따옴표를 둔다.
   */
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(cell).join(","), ...rows.map((r) => r.map(cell).join(","))];
  // \r\n 이어야 엑셀·구글시트 양쪽에서 줄이 안 밀린다
  return `﻿${lines.join("\r\n")}\r\n`;
}

/**
 * 파일로 내려보내는 응답. 파일명에 날짜를 박아 어느 시점 값인지 남긴다.
 *
 * ⚠️ **파일명에 한글을 그대로 넣으면 응답 자체가 터진다.** (2026-08-19 수정)
 *
 * HTTP 헤더 값은 ByteString(0~255)이라 한글이 들어가면
 * `Cannot convert argument to a ByteString` 로 던진다 — 실제로 첫 판이
 * `filename="키워드_2026-08-19.csv"` 여서 로그인한 어드민이 눌렀을 때
 * 500 이 났다. 비로그인 404 만 확인하고 통과로 판단한 것이 잘못이었다.
 *
 * RFC 5987 이 이 경우를 위해 있다 — ASCII 대체 이름을 `filename` 에 두고,
 * 진짜 이름은 `filename*=UTF-8''` 뒤에 퍼센트 인코딩으로 붙인다.
 * 요즘 브라우저는 전부 뒤쪽을 우선한다.
 */
export function csvResponse(name: string, body: string): Response {
  const ascii = name.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "");
  const encoded = encodeURIComponent(name);

  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`,
      // 받은 파일이 캐시된 옛 값이면 판단이 틀어진다
      "cache-control": "no-store",
    },
  });
}
