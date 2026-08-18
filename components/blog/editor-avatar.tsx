/**
 * 에디터 캐릭터 — 웹툰풍 인물 일러스트 3종. (2026-08-13)
 *
 * 회색 사람 실루엣은 "아무개"라는 뜻이라 사람이 쓴 글이라는 인상을 못 준다.
 * 실사진은 못 쓴다 — 없는 사람의 사진을 올리면 그 순간 거짓이 된다.
 * 그래서 **명백히 캐릭터인 그림**으로 간다. 독자도 캐릭터로 읽고,
 * 우리도 지어낸 사실을 싣지 않는다.
 *
 * 사장님 지시: 에디터 3명, 성별이 다르고, 예쁘고 잘생기게.
 * 외부 이미지 없이 인라인 SVG 로 그린다 — 요청이 늘지 않고 어느 크기에서도 안 깨진다.
 */

type Props = { editorKey: string; size?: number };

/** H — 남성. 진취적. 각진 턱선, 짧은 투블럭, 살짝 올라간 입꼬리 */
function FaceH({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 72 72" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="bgH" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#dfe3fb" />
          <stop offset="1" stopColor="#c7cdf7" />
        </linearGradient>
      </defs>
      <circle cx="36" cy="36" r="36" fill="url(#bgH)" />
      {/* 어깨 */}
      <path d="M13 72c0-12 10-19 23-19s23 7 23 19Z" fill="#3d4bbf" />
      <path d="M31 52h10v6c0 3-10 3-10 0Z" fill="#F2CDAF" />
      {/* 목·얼굴 */}
      <path d="M24 33c0-8 5-14 12-14s12 6 12 14c0 9-5 16-12 16s-12-7-12-16Z" fill="#F2CDAF" />
      {/* 머리 — 투블럭 */}
      <path d="M23 32c-1-11 5-17 13-17s14 6 13 17c-1-4-2-6-3-7-3 2-9 3-14 2-3-1-5-1-6 2-1 1-2 2-3 3Z" fill="#26262E" />
      <path d="M48 30c2 1 3 4 2 7-1-3-1-5-2-7Z" fill="#26262E" />
      {/* 눈썹 */}
      <path d="M28.5 31.5c1.6-1 3.4-1 4.8 0M38.7 31.5c1.4-1 3.2-1 4.8 0" stroke="#26262E" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* 눈 */}
      <ellipse cx="31" cy="35.5" rx="1.7" ry="2.2" fill="#1B1B22" />
      <ellipse cx="41" cy="35.5" rx="1.7" ry="2.2" fill="#1B1B22" />
      <circle cx="31.6" cy="34.9" r="0.6" fill="#fff" />
      <circle cx="41.6" cy="34.9" r="0.6" fill="#fff" />
      {/* 코·입 */}
      <path d="M36 37.5v2.5" stroke="#D7A883" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M32.8 43c1.9 1.8 4.5 1.8 6.4 0" stroke="#C0705E" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** S — 여성. 차분함. 단발, 부드러운 눈매, 옅은 미소 */
function FaceS({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 72 72" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="bgS" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d5efe9" />
          <stop offset="1" stopColor="#b9e3d9" />
        </linearGradient>
      </defs>
      <circle cx="36" cy="36" r="36" fill="url(#bgS)" />
      <path d="M13 72c0-12 10-19 23-19s23 7 23 19Z" fill="#0d7a6e" />
      <path d="M31 52h10v6c0 3-10 3-10 0Z" fill="#F7DAC2" />
      {/* 뒷머리 — 단발 */}
      <path d="M21 38c0-14 6-22 15-22s15 8 15 22c0 8-2 13-4 15 1-8 0-16-1-20-4 3-16 3-20 0-1 4-2 12-1 20-2-2-4-7-4-15Z" fill="#3A2A24" />
      <path d="M24 34c0-8 5-14 12-14s12 6 12 14c0 9-5 16-12 16s-12-7-12-16Z" fill="#F7DAC2" />
      {/* 앞머리 */}
      <path d="M23.5 32c0-11 6-16 12.5-16S48.5 21 48.5 32c-2-5-4-8-6-8-4 2-11 2-15 1-2 0-3 3-4 7Z" fill="#3A2A24" />
      <path d="M28.8 31.6c1.6-.9 3.3-.9 4.7.1M38.5 31.7c1.4-1 3.1-1 4.7-.1" stroke="#3A2A24" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      {/* 눈 — 속눈썹 */}
      <ellipse cx="31" cy="35.6" rx="1.8" ry="2.3" fill="#1B1B22" />
      <ellipse cx="41" cy="35.6" rx="1.8" ry="2.3" fill="#1B1B22" />
      <circle cx="31.7" cy="34.9" r="0.6" fill="#fff" />
      <circle cx="41.7" cy="34.9" r="0.6" fill="#fff" />
      <path d="M28.6 33.4l.9-.9M43.4 33.4l-.9-.9" stroke="#1B1B22" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M36 37.8v2.3" stroke="#DFAF8E" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M33.4 43.2c1.6 1.5 3.6 1.5 5.2 0" stroke="#C4675C" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** J — 남성. 친화력. 웨이브 머리, 크게 웃는 입, 안경 */
function FaceJ({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 72 72" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="bgJ" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fae3c8" />
          <stop offset="1" stopColor="#f3cda2" />
        </linearGradient>
      </defs>
      <circle cx="36" cy="36" r="36" fill="url(#bgJ)" />
      <path d="M13 72c0-12 10-19 23-19s23 7 23 19Z" fill="#a8560c" />
      <path d="M31 52h10v6c0 3-10 3-10 0Z" fill="#EFC9A4" />
      <path d="M24 33c0-8 5-14 12-14s12 6 12 14c0 9-5 16-12 16s-12-7-12-16Z" fill="#EFC9A4" />
      {/* 웨이브 머리 */}
      <path d="M23 33c-1-12 6-18 13-18s14 6 13 18c-1-3-2-5-3-6-2 2-4 1-5-1-2 2-5 2-7 0-2 2-5 2-7 0-1 2-2 4-4 7Z" fill="#4A3226" />
      <path d="M28.5 31.4c1.6-.9 3.4-.9 4.8.2M38.7 31.6c1.4-1.1 3.2-1.1 4.8-.2" stroke="#4A3226" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      {/* 안경 */}
      <g stroke="#33302B" strokeWidth="1.5" fill="none">
        <circle cx="31" cy="35.6" r="4.6" />
        <circle cx="41" cy="35.6" r="4.6" />
        <path d="M35.6 35.6h0.8" />
      </g>
      <circle cx="31" cy="35.6" r="1.6" fill="#1B1B22" />
      <circle cx="41" cy="35.6" r="1.6" fill="#1B1B22" />
      <circle cx="31.6" cy="35" r="0.5" fill="#fff" />
      <circle cx="41.6" cy="35" r="0.5" fill="#fff" />
      {/* 웃는 입 */}
      <path d="M31.6 42.6c2.6 2.8 6.2 2.8 8.8 0" stroke="#B65B4C" strokeWidth="1.7" strokeLinecap="round" fill="none" />
      <path d="M32.6 43.4c2.1 1.2 4.7 1.2 6.8 0" fill="#fff" opacity="0.9" />
    </svg>
  );
}

export function EditorAvatar({ editorKey, size = 44 }: Props) {
  if (editorKey === "S") return <FaceS size={size} />;
  if (editorKey === "J") return <FaceJ size={size} />;
  return <FaceH size={size} />;
}
