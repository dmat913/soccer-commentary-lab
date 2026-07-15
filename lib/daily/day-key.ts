/**
 * Returns the current calendar day in Asia/Tokyo (JST) as a "YYYY-MM-DD" key.
 *
 * The Daily Challenge uses this key for all day comparisons so the "1 day"
 * boundary is stable regardless of the device timezone. Pure and SSR-safe:
 * `Intl.DateTimeFormat` is available in both Node and the browser, and no
 * external dependency is used. Historical date handling (History page) is
 * intentionally left untouched.
 */
const JST_DAY_KEY_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** `date` defaults to now; the parameter keeps the function easy to test. */
export function getJstDayKey(date: Date = new Date()): string {
  // en-CA formats as "YYYY-MM-DD".
  return JST_DAY_KEY_FORMATTER.format(date);
}
