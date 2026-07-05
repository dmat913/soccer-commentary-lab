"use server";

import { translateCommentary } from "@/lib/commentary/translate";
import type { TranslateCommentaryResult } from "@/types/commentary";

export async function translateCommentaryAction(
  japaneseText: string
): Promise<TranslateCommentaryResult> {
  return translateCommentary(japaneseText);
}
