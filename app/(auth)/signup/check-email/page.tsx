import Link from "next/link";

export default async function CheckEmailPage({
  searchParams,
}: PageProps<"/signup/check-email">) {
  const { email } = await searchParams;

  return (
    <>
      <p className="eyebrow">Almost There</p>
      <h1 className="mt-4 text-3xl font-bold">메일함을 확인해 주세요</h1>
      <p className="mt-4 text-sm leading-[1.8] text-muted">
        {typeof email === "string" && email ? (
          <>
            <span className="font-bold text-ink">{email}</span> 으로 인증 메일을
            보냈습니다.
          </>
        ) : (
          "입력하신 주소로 인증 메일을 보냈습니다."
        )}{" "}
        메일의 링크를 누르면 가입이 완료됩니다.
      </p>

      <p className="mt-6 rounded-xl border border-line bg-paper-alt px-4 py-3 text-xs leading-[1.7] text-muted">
        메일이 보이지 않으면 스팸함을 확인해 주세요. 몇 분 뒤에도 오지 않으면
        가입을 다시 시도하시거나 채널톡으로 문의해 주세요.
      </p>

      <p className="mt-8 text-center text-sm text-muted">
        <Link href="/login" className="font-bold text-ink underline underline-offset-2">
          로그인으로 돌아가기
        </Link>
      </p>
    </>
  );
}
