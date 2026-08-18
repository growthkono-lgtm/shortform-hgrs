"use client";

import { useRef, useState } from "react";
import { createUploadSession, finishUpload } from "@/app/work/actions";
import { FILE_NAME_GUIDE } from "@/lib/work";

/**
 * 결과물 업로드 — 끌어다 놓으면 지정된 드라이브 폴더로 바로 올라간다.
 *
 * **파일은 우리 서버를 거치지 않는다.** 서버는 구글에서 업로드 주소만 받아다 주고,
 * 바이트는 이 브라우저에서 구글로 직접 간다(XHR PUT). 영상 한 편이 수백 MB 라
 * 서버를 통하게 하면 요청 크기 제한에 먼저 걸린다.
 *
 * 파일명은 작업자가 짓지 않는다 — 제목과 형식만 고르면 규칙대로 조립된다.
 * 이름을 손으로 붙이게 하면 폴더가 반드시 엉망이 된다.
 */
export function Uploader({
  deliverableId,
  finalRound,
  onDone,
}: {
  deliverableId: string;
  /** 수정 반영본이면 파일명 뒤에 _fin 이 붙는다 */
  finalRound: boolean;
  onDone?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    if (!title.trim()) {
      setMessage({ ok: false, text: "컨텐츠명을 먼저 적어 주세요. 파일명에 들어갑니다." });
      return;
    }
    setMessage(null);
    setProgress(0);

    const ext = file.name.includes(".") ? file.name.split(".").pop()! : "mp4";
    const session = await createUploadSession({
      deliverableId,
      title,
      ext,
      mimeType: file.type,
    });

    if (!session.ok) {
      setProgress(null);
      setMessage({ ok: false, text: session.message });
      return;
    }

    // 진행률을 보여 주려면 fetch 가 아니라 XHR 이어야 한다 (upload.onprogress)
    const fileId = await new Promise<string | null>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", session.uploadUrl, true);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        try {
          resolve((JSON.parse(xhr.responseText) as { id?: string }).id ?? null);
        } catch {
          resolve(null);
        }
      };
      xhr.onerror = () => resolve(null);
      xhr.send(file);
    });

    if (!fileId) {
      setProgress(null);
      setMessage({ ok: false, text: "업로드에 실패했습니다. 다시 시도해 주세요." });
      return;
    }

    const result = await finishUpload({
      deliverableId,
      fileId,
      fileName: session.fileName,
    });
    setProgress(null);
    setMessage({ ok: result.ok, text: result.message ?? "" });
    if (result.ok) onDone?.();
  }

  const busy = progress !== null;

  return (
    <div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="컨텐츠명 (예: 수의사인터뷰)"
        className="w-full rounded-lg border border-line bg-paper px-4 py-3 text-sm placeholder:text-muted/70 focus:border-ink focus:outline-none"
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file && !busy) void upload(file);
        }}
        onClick={() => !busy && inputRef.current?.click()}
        className={[
          "mt-3 cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging ? "border-accent bg-accent/[0.06]" : "border-line bg-paper-alt",
          busy && "cursor-wait opacity-70",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {busy ? (
          <>
            <p className="text-sm font-bold">{progress}% 올리는 중…</p>
            <div className="mx-auto mt-3 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-line">
              <div
                className="h-full bg-accent transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-muted">
              창을 닫지 마세요. 파일은 이 브라우저에서 드라이브로 바로 전송됩니다.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-bold">여기에 파일을 끌어다 놓으세요</p>
            <p className="mt-1.5 text-xs text-muted">클릭해서 고르셔도 됩니다</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = "";
          }}
        />
      </div>

      <p className="mt-2 text-[0.6875rem] leading-[1.7] text-muted">
        파일명은 <strong>자동으로 붙습니다</strong> — {FILE_NAME_GUIDE}
        {finalRound && (
          <>
            <br />
지금은 수정 반영 단계라 끝에 <strong>_fin</strong> 이 붙습니다 (1차는 <strong>_v1</strong>).
          </>
        )}
      </p>

      {message && (
        <p
          className={`mt-2 text-xs leading-[1.7] ${
            message.ok ? "text-accent-deep" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
