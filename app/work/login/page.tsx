import { WorkForm } from "@/components/work/work-form";
import { signInWorker } from "@/app/work/actions";
import { WORK_APP } from "@/lib/work";

export const metadata = { title: "로그인" };

const field =
  "w-full rounded-lg border border-line bg-paper px-4 py-3 text-sm placeholder:text-muted/70 focus:border-ink focus:outline-none";

/**
 * 작업자 로그인.
 *
 * 가입 링크도, 비밀번호 찾기도 없다 — 계정은 우리가 만들어서 직접 전달한다.
 * 셀프 가입 경로를 열면 이 주소를 아는 누구나 계정을 만들 수 있고,
 * 인증 메일을 보내는 순간 발신 도메인으로 회사가 드러난다.
 */
export default function WorkLoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-bold">{WORK_APP.name}</h1>
        <p className="mt-2 text-sm text-muted">
          전달받은 계정으로 로그인해 주세요.
        </p>

        <WorkForm action={signInWorker} label="로그인" className="mt-8">
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            placeholder="이메일"
            className={field}
          />
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="비밀번호"
            className={field}
          />
        </WorkForm>

        <p className="mt-6 text-xs leading-[1.7] text-muted/70">
          계정이 없거나 비밀번호를 잊으셨다면 담당자에게 문의해 주세요.
        </p>
      </div>
    </main>
  );
}
