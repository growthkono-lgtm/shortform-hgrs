import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/** 브라우저용. 공개 키만 사용 — service_role은 절대 여기 오면 안 된다 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
