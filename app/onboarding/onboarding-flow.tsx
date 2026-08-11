"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BrandProfile } from "@/lib/growth-ai";
import { saveBrandProfile } from "./actions";
import { cn } from "@/lib/cn";

type Step = "input" | "analyzing" | "review" | "saving";
type Mode = "url" | "text";

export function OnboardingFlow() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("input");
  const [mode, setMode] = useState<Mode>("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<BrandProfile | null>(null);

  async function analyze() {
    setError(null);
    setStep("analyzing");

    try {
      const res = await fetch("/api/growth-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "url" ? { kind: "url", url } : { kind: "text", text },
        ),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "분석에 실패했습니다.");
        setStep("input");
        return;
      }

      setProfile(data.profile);
      setStep("review");
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setStep("input");
    }
  }

  async function save() {
    if (!profile) return;
    setError(null);
    setStep("saving");

    const result = await saveBrandProfile({
      sourceUrl: mode === "url" ? url : null,
      profile,
      raw: mode === "url" ? { url } : { text },
    });

    if (!result.ok) {
      setError(result.error);
      setStep("review");
      return;
    }

    router.push("/app");
  }

  if (step === "analyzing") return <Analyzing mode={mode} />;

  if (step === "review" || step === "saving") {
    return (
      <ReviewStep
        profile={profile!}
        onChange={setProfile}
        onSave={save}
        onBack={() => setStep("input")}
        saving={step === "saving"}
        error={error}
      />
    );
  }

  return (
    <>
      <p className="eyebrow">Brand Profile</p>
      <h1 className="mt-4 text-3xl font-bold">브랜드를 등록해 주세요</h1>
      <p className="mt-4 text-sm leading-[1.8] text-muted">
        한 번만 등록하면 이후 모든 주문에서 그대로 재사용됩니다. 담당자와
        제작자도 이 프로필을 보고 작업하기 때문에, 브랜드를 설명하는 데 드는
        시간이 크게 줄어듭니다.
      </p>

      <div
        role="tablist"
        aria-label="입력 방식"
        className="mt-10 inline-flex rounded-full border border-line p-1"
      >
        {(
          [
            { key: "url", label: "상세페이지 주소" },
            { key: "text", label: "직접 작성" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={mode === tab.key}
            onClick={() => setMode(tab.key)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-bold transition-colors duration-200",
              mode === tab.key
                ? "bg-ink text-paper"
                : "text-muted hover:text-ink",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {mode === "url" ? (
          <>
            <label htmlFor="url" className="block text-sm font-bold">
              상세페이지 또는 자사몰 주소
            </label>
            <input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://smartstore.naver.com/..."
              className="mt-2 w-full rounded-xl border border-line px-4 py-3 text-sm focus:border-ink focus:outline-none"
            />
            <p className="mt-2 text-xs leading-[1.7] text-muted">
              그로스 AI가 페이지를 읽고 브랜드 소개·핵심 USP·타겟·금지 표현을
              정리합니다. 스마트스토어·쿠팡처럼 자바스크립트로 그려지는 페이지는
              내용을 못 읽을 수 있는데, 그럴 땐 직접 작성으로 넘어가시면 됩니다.
            </p>
          </>
        ) : (
          <>
            <label htmlFor="text" className="block text-sm font-bold">
              브랜드·제품 설명
            </label>
            <textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              placeholder={
                "브랜드가 무엇을 파는지, 누구에게 파는지, 경쟁 제품과 무엇이 다른지 편하게 적어주세요.\n형식은 상관없습니다 — 정리는 AI가 합니다."
              }
              className="mt-2 w-full resize-y rounded-xl border border-line px-4 py-3 text-sm leading-[1.7] focus:border-ink focus:outline-none"
            />
            <p className="mt-2 text-xs text-muted">
              {text.length}자 (최소 50자)
            </p>
          </>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-accent/40 bg-accent/[0.07] px-4 py-3 text-sm leading-[1.7] text-accent-deep"
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={analyze}
        disabled={mode === "url" ? !url.trim() : text.trim().length < 50}
        className="mt-8 w-full rounded-full bg-ink px-6 py-4 text-sm font-bold text-paper transition-colors duration-200 hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-40"
      >
        제품 분석 시작
      </button>

      <p className="mt-6 rounded-xl border border-line bg-paper-alt px-4 py-3 text-xs leading-[1.7] text-muted">
        브랜드덱·제품 이미지 PDF 업로드로 분석하는 방식은 준비 중입니다. 지금은
        주소 입력이나 직접 작성을 이용해 주세요.
      </p>
    </>
  );
}

function Analyzing({ mode }: { mode: Mode }) {
  return (
    <div className="py-24 text-center">
      <p className="eyebrow">Analyzing</p>
      <h1 className="mt-5 text-2xl font-bold">브랜드를 읽고 있습니다</h1>
      <p className="mt-4 text-sm leading-[1.8] text-muted">
        {mode === "url"
          ? "페이지를 불러와 핵심 USP와 타겟을 정리하는 중입니다."
          : "작성해주신 내용에서 핵심 USP와 타겟을 정리하는 중입니다."}
        <br />
        보통 40초~1분 걸립니다. 창을 닫지 말고 기다려 주세요.
      </p>
      <div
        aria-hidden
        className="mx-auto mt-10 h-1 w-40 overflow-hidden rounded-full bg-line"
      >
        <div className="h-full w-1/3 animate-pulse rounded-full bg-accent" />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-bold">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="mt-2 w-full resize-y rounded-xl border border-line px-4 py-3 text-sm leading-[1.7] focus:border-ink focus:outline-none"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 w-full rounded-xl border border-line px-4 py-3 text-sm focus:border-ink focus:outline-none"
        />
      )}
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function ReviewStep({
  profile,
  onChange,
  onSave,
  onBack,
  saving,
  error,
}: {
  profile: BrandProfile;
  onChange: (p: BrandProfile) => void;
  onSave: () => void;
  onBack: () => void;
  saving: boolean;
  error: string | null;
}) {
  const set = <K extends keyof BrandProfile>(key: K, value: BrandProfile[K]) =>
    onChange({ ...profile, [key]: value });

  return (
    <>
      <p className="eyebrow">Review</p>
      <h1 className="mt-4 text-3xl font-bold">확인하고 고쳐주세요</h1>
      <p className="mt-4 text-sm leading-[1.8] text-muted">
        AI가 정리한 초안입니다. 사실과 다르거나 표현이 어색한 부분은 직접
        고치셔도 됩니다. 확정하시면 이후 모든 주문이 이 프로필로 시작됩니다.
      </p>

      <div className="mt-10 space-y-6">
        <Field
          label="브랜드명"
          value={profile.brand_name}
          onChange={(v) => set("brand_name", v)}
        />
        <Field
          label="브랜드 소개"
          value={profile.brand_intro}
          onChange={(v) => set("brand_intro", v)}
          multiline
        />
        <Field
          label="제품 요약"
          value={profile.product_summary}
          onChange={(v) => set("product_summary", v)}
          multiline
        />

        <div>
          <p className="text-sm font-bold">
            핵심 USP{" "}
            <span className="font-normal text-muted">
              — 구매 결정에 영향이 큰 순서
            </span>
          </p>
          <div className="mt-3 space-y-3">
            {profile.usps.map((usp, i) => (
              <div key={i} className="rounded-xl border border-line p-4">
                <div className="flex items-start gap-3">
                  <span className="font-display text-sm font-bold text-accent">
                    {i + 1}
                  </span>
                  <div className="flex-1 space-y-2">
                    <input
                      value={usp.headline}
                      onChange={(e) => {
                        const next = [...profile.usps];
                        next[i] = { ...usp, headline: e.target.value };
                        set("usps", next);
                      }}
                      className="w-full rounded-lg border border-line px-3 py-2 text-sm font-bold focus:border-ink focus:outline-none"
                    />
                    <textarea
                      value={usp.evidence}
                      onChange={(e) => {
                        const next = [...profile.usps];
                        next[i] = { ...usp, evidence: e.target.value };
                        set("usps", next);
                      }}
                      rows={2}
                      className="w-full resize-y rounded-lg border border-line px-3 py-2 text-sm text-muted focus:border-ink focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="연령대"
            value={profile.target.age_range}
            onChange={(v) => set("target", { ...profile.target, age_range: v })}
          />
          <Field
            label="상황"
            value={profile.target.situation}
            onChange={(v) => set("target", { ...profile.target, situation: v })}
          />
          <Field
            label="구매 트리거"
            value={profile.target.purchase_trigger}
            onChange={(v) =>
              set("target", { ...profile.target, purchase_trigger: v })
            }
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="가격대 · 객단가"
            value={profile.price_band}
            onChange={(v) => set("price_band", v)}
          />
          <Field
            label="톤앤매너"
            value={profile.tone_and_manner}
            onChange={(v) => set("tone_and_manner", v)}
          />
        </div>

        <Field
          label="경쟁 맥락"
          value={profile.competitive_context}
          onChange={(v) => set("competitive_context", v)}
          multiline
        />

        {profile.forbidden_expressions.length > 0 && (
          <div>
            <p className="text-sm font-bold">
              금지 표현{" "}
              <span className="font-normal text-muted">
                — 광고 심의 위반 소지가 있어 소재에서 제외합니다
              </span>
            </p>
            <ul className="mt-3 space-y-2">
              {profile.forbidden_expressions.map((item, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-accent/30 bg-accent/[0.05] p-4 text-sm"
                >
                  <p className="font-bold text-accent-deep">
                    &ldquo;{item.expression}&rdquo;
                  </p>
                  <p className="mt-1 text-xs leading-[1.7] text-muted">
                    {item.reason}
                  </p>
                  <p className="mt-2 text-xs leading-[1.7]">
                    <span className="font-bold">대체:</span> {item.alternative}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-8 rounded-xl border border-accent/40 bg-accent/[0.07] px-4 py-3 text-sm text-accent-deep"
        >
          {error}
        </p>
      )}

      <div className="mt-10 flex flex-col gap-3 sm:flex-row-reverse">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="flex-1 rounded-full bg-ink px-6 py-4 text-sm font-bold text-paper transition-colors duration-200 hover:bg-ink-soft disabled:opacity-40"
        >
          {saving ? "저장 중…" : "이 내용으로 확정"}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className="rounded-full border border-ink/20 px-6 py-4 text-sm font-bold hover:border-ink disabled:opacity-40"
        >
          다시 분석
        </button>
      </div>
    </>
  );
}
