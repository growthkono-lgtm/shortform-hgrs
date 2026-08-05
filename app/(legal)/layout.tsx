import { SiteFooter } from "@/components/site-footer";
import Link from "next/link";
import { SERVICE } from "@/lib/constants";

export default function LegalLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line px-5 py-5 sm:px-8">
        <div className="mx-auto w-full max-w-3xl">
          <Link href="/" className="text-sm font-bold">
            {SERVICE.name}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-14 sm:px-8">
        <article className="legal">{children}</article>
      </main>

      <SiteFooter />
    </div>
  );
}
