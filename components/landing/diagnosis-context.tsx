"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { diagnose, type DiagAnswers, type DiagResult } from "@/lib/diagnosis";

type Value = {
  answers: DiagAnswers;
  setAnswers: (next: DiagAnswers) => void;
  /** 다섯 문항을 다 채웠을 때만 결과가 있다 */
  result: DiagResult | null;
};

const Ctx = createContext<Value | null>(null);

/**
 * 진단 결과를 신청 폼까지 들고 간다.
 *
 * 진단과 신청은 화면상 떨어진 두 섹션이라 상태를 위로 올려야 한다.
 * 이 값이 폼의 hidden 필드로 실려 `inquiries.diagnosis` 에 그대로 저장된다 —
 * 소개서 문구를 가르는 건 결국 "본인이 어느 국면이라고 답했는가"다.
 */
export function DiagnosisProvider({ children }: { children: React.ReactNode }) {
  const [answers, setAnswers] = useState<DiagAnswers>({});

  const value = useMemo<Value>(() => {
    const complete =
      Boolean(answers.usp) &&
      Boolean(answers.purpose) &&
      Boolean(answers.source) &&
      Boolean(answers.stock) &&
      Boolean(answers.volume);
    return {
      answers,
      setAnswers,
      result: complete ? diagnose(answers) : null,
    };
  }, [answers]);

  return <Ctx value={value}>{children}</Ctx>;
}

export function useDiagnosis() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDiagnosis must be used within DiagnosisProvider");
  return ctx;
}
