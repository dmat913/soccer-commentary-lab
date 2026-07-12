"use client";

import { GoogleAnalytics } from "@next/third-parties/google";

import { getGaMeasurementId } from "@/lib/analytics/get-ga-measurement-id";

const gaMeasurementId = getGaMeasurementId();

export function AppGoogleAnalytics() {
  if (!gaMeasurementId) {
    return null;
  }

  return <GoogleAnalytics gaId={gaMeasurementId} />;
}
