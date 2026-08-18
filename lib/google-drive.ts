import "server-only";
import { createSign } from "node:crypto";

/**
 * 구글 드라이브 업로드 — 서비스 계정.
 *
 * **파일이 우리 서버를 지나가지 않는다.** 여기서 하는 일은 구글에서 재개 가능 업로드
 * 세션 URI 를 받아 브라우저에 넘겨 주는 것뿐이고, 실제 바이트는 브라우저 → 구글로 직접 간다.
 * 영상 한 편이 수백 MB 라 서버를 거치게 하면 Vercel 요청 본문 제한(100MB)에 먼저 걸린다.
 *
 * ⚠️ 서비스 계정은 **개인 드라이브에 파일을 소유할 수 없다**(저장용량이 0이다).
 * 반드시 **공유 드라이브(Shared Drive)** 안의 폴더를 대상으로 해야 한다. 그래서 모든 호출에
 * supportsAllDrives=true 를 붙인다. 일반 내 드라이브 폴더를 주면 구글이 저장용량 오류를 낸다.
 *
 * googleapis 패키지를 쓰지 않는다 — 토큰 하나 받자고 의존성을 늘릴 이유가 없다.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/drive";

export function driveConfigured() {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY,
  );
}

const b64url = (input: Buffer | string) =>
  Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

/** 서비스 계정 JWT → 액세스 토큰 교환 */
async function accessToken(): Promise<string> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  // 환경변수로 넣으면 줄바꿈이 \n 문자열로 들어온다. 되돌리지 않으면 서명이 깨진다
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) throw new Error("구글 서비스 계정이 설정되지 않았습니다.");

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: email,
      // 도메인 전체 위임 — 이 값이 있으면 서비스 계정이 **이 사람인 척** 행동한다.
      // 드라이브에 찍히는 "업로드한 사람"이 로봇 계정이 아니라 우리 회사 계정이 된다.
      // 없으면 서비스 계정 본인으로 올라간다(그 경우 공유 드라이브가 반드시 필요하다).
      ...(process.env.GOOGLE_IMPERSONATE_EMAIL
        ? { sub: process.env.GOOGLE_IMPERSONATE_EMAIL }
        : {}),
      scope: SCOPE,
      aud: TOKEN_URL,
      exp: now + 3600,
      iat: now,
    }),
  );

  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const signature = b64url(signer.sign(key));

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claims}.${signature}`,
    }),
  });

  if (!res.ok) {
    throw new Error(`구글 인증에 실패했습니다 (${res.status}).`);
  }
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("구글 액세스 토큰을 받지 못했습니다.");
  return json.access_token;
}

/** 드라이브 링크에서 폴더 ID 를 뽑는다. ID 를 그대로 붙여넣어도 통과시킨다 */
export function folderIdFromLink(raw: string | null | undefined) {
  if (!raw) return null;
  const trimmed = raw.trim();
  const m =
    trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/) ??
    trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  return /^[a-zA-Z0-9_-]{20,}$/.test(trimmed) ? trimmed : null;
}

/**
 * 재개 가능 업로드 세션 시작.
 *
 * origin 을 넘겨야 구글이 CORS 헤더를 붙여 준다 — 안 넘기면 브라우저가 PUT 을 막는다.
 * 여기서 걸리면 원인을 찾기 어려우니 호출부에서 반드시 실제 페이지 origin 을 준다.
 */
export async function startResumableUpload(input: {
  folderId: string;
  fileName: string;
  mimeType: string;
  origin: string;
}): Promise<string> {
  const token = await accessToken();

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": input.mimeType,
        Origin: input.origin,
      },
      body: JSON.stringify({
        name: input.fileName,
        parents: [input.folderId],
      }),
    },
  );

  if (!res.ok) {
    const detail = await res.text();
    // 가장 흔한 두 가지를 사람 말로 바꿔 준다
    if (detail.includes("storageQuotaExceeded")) {
      throw new Error(
        "서비스 계정은 개인 드라이브에 파일을 만들 수 없습니다. 폴더를 공유 드라이브 안에 두고 서비스 계정을 멤버로 추가해 주세요.",
      );
    }
    if (res.status === 404 || detail.includes("notFound")) {
      throw new Error(
        "폴더를 찾지 못했습니다. 서비스 계정에게 그 폴더의 편집 권한이 있는지 확인해 주세요.",
      );
    }
    throw new Error(`업로드를 시작하지 못했습니다 (${res.status}).`);
  }

  const location = res.headers.get("location");
  if (!location) throw new Error("업로드 주소를 받지 못했습니다.");
  return location;
}

/** 업로드된 파일을 폴더 권한자 누구나 열 수 있는 보기 링크로 */
export const driveViewLink = (fileId: string) =>
  `https://drive.google.com/file/d/${fileId}/view`;

export const driveFolderLink = (folderId: string) =>
  `https://drive.google.com/drive/folders/${folderId}`;

const DRIVE_ID = () => process.env.GOOGLE_SHARED_DRIVE_ID ?? "";

export const sharedDriveConfigured = () => Boolean(DRIVE_ID());

const api = async (url: string, token: string, init?: RequestInit) => {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (json as { error?: { message?: string } }).error?.message ??
        `드라이브 요청 실패 (${res.status})`,
    );
  }
  return json;
};

/** 같은 이름의 폴더가 있으면 그걸 쓰고, 없으면 만든다 (두 번 눌러도 안 늘어난다) */
async function ensureFolder(name: string, parentId: string, token: string) {
  const q = encodeURIComponent(
    `name='${name.replace(/'/g, "\\'")}' and '${parentId}' in parents ` +
      `and mimeType='application/vnd.google-apps.folder' and trashed=false`,
  );
  const found = (await api(
    `https://www.googleapis.com/drive/v3/files?q=${q}&supportsAllDrives=true` +
      `&includeItemsFromAllDrives=true&corpora=drive&driveId=${DRIVE_ID()}&fields=files(id)`,
    token,
  )) as { files?: { id: string }[] };
  if (found.files?.length) return found.files[0].id;

  const created = (await api(
    "https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&fields=id",
    token,
    {
      method: "POST",
      body: JSON.stringify({
        name,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentId],
      }),
    },
  )) as { id: string };
  return created.id;
}

/**
 * 프로젝트 폴더 한 벌을 만든다 — `{공유 드라이브}/{브랜드명_플랜}/{소스, 완성본}`.
 *
 * **프로젝트마다 폴더를 따로 두는 게 격리의 핵심이다.** 한 폴더를 여러 프로젝트가 같이 쓰면
 * 브랜드가 섞이고, 작업자가 남의 브랜드 소스를 그대로 보게 된다.
 * 공유 드라이브 **멤버로는 아무도 추가하지 않는다** — 멤버가 되면 드라이브 전체가 보인다.
 */
export async function ensureProjectFolders(folderName: string) {
  if (!DRIVE_ID()) throw new Error("공유 드라이브가 설정되지 않았습니다.");
  const token = await accessToken();
  const root = await ensureFolder(folderName, DRIVE_ID(), token);
  const [source, final] = await Promise.all([
    ensureFolder("소스", root, token),
    ensureFolder("완성본", root, token),
  ]);
  return { root, source, final };
}

/**
 * 폴더 하나에만 편집 권한을 준다.
 *
 * `sendNotificationEmail=false` — 초대 메일을 보내지 않는다. 작업자도 클라이언트도
 * 대시보드에서 폴더 링크를 눌러 들어오므로 메일이 필요 없고, 메일을 안 보내면
 * "그 메일이 누구 이름으로 나가는가" 문제 자체가 없어진다.
 */
export async function grantFolderAccess(
  folderId: string,
  email: string,
  role: "writer" | "reader" = "writer",
) {
  const token = await accessToken();
  await api(
    `https://www.googleapis.com/drive/v3/files/${folderId}/permissions` +
      `?supportsAllDrives=true&sendNotificationEmail=false&fields=id`,
    token,
    {
      method: "POST",
      body: JSON.stringify({ type: "user", role, emailAddress: email }),
    },
  );
}
