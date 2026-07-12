/**
 * GA4 Measurement ID from NEXT_PUBLIC_GA_MEASUREMENT_ID.
 *
 * Note: NEXT_PUBLIC_* values are inlined at build time. On Vercel, set the
 * variable before deploying and redeploy (clear build cache if needed).
 */
export function getGaMeasurementId(): string | undefined {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

  if (!id) {
    return undefined;
  }

  return id;
}
