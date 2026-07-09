import { getSupabaseEnv } from "@/lib/supabase/env";

type SupabaseErrorDetails = {
  message: string;
  details: string | null;
  hint: string | null;
  code: string | null;
};

export function formatSupabaseError(error: unknown): SupabaseErrorDetails {
  if (error && typeof error === "object") {
    const err = error as {
      message?: string;
      details?: string | null;
      hint?: string | null;
      code?: string | null;
    };

    return {
      message: err.message ?? "Unknown Supabase error",
      details: err.details ?? null,
      hint: err.hint ?? null,
      code: err.code ?? null,
    };
  }

  return {
    message: String(error),
    details: null,
    hint: null,
    code: null,
  };
}

export function logSupabaseRepositoryError(
  context: string,
  error: unknown,
  extras?: Record<string, unknown>
): void {
  const env = getSupabaseEnv();

  console.error(context, {
    ...extras,
    ...formatSupabaseError(error),
    supabaseConfigured: env !== null,
    supabaseUrl: env?.url ?? null,
  });
}
