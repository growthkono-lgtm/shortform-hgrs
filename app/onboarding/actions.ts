"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";
import type { BrandProfile } from "@/lib/growth-ai";

export type SaveResult = { ok: true; id: string } | { ok: false; error: string };

/** 검수·수정을 마친 브랜드 프로필을 확정 저장한다 (E1 3단계) */
export async function saveBrandProfile(input: {
  sourceUrl: string | null;
  profile: BrandProfile;
  raw: unknown;
}): Promise<SaveResult> {
  const account = await requireProfile();

  const brandName = input.profile.brand_name?.trim();
  if (!brandName) return { ok: false, error: "브랜드명을 입력해 주세요." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("brand_profiles")
    .insert({
      user_id: account.id,
      brand_name: brandName,
      source_url: input.sourceUrl,
      profile: input.profile as never,
      profile_raw: (input.raw ?? null) as never,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: "저장에 실패했습니다. 잠시 후 다시 시도해 주세요." };
  }

  revalidatePath("/app");
  return { ok: true, id: data.id };
}

export async function finishOnboarding() {
  redirect("/app");
}
