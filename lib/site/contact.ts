/**
 * Public contact address for KickLingo.
 * Leave empty until a publishable address is decided; Contact UI shows a
 * placeholder when unset. Do not invent an address here.
 */
export const CONTACT_EMAIL = "soccer.82.d.y@gmail.com";

export function getContactMailtoHref(
  subject?: string,
  body?: string
): string | null {
  const email = CONTACT_EMAIL.trim();
  if (!email) {
    return null;
  }

  const parts: string[] = [];
  if (subject) {
    parts.push(`subject=${encodeURIComponent(subject)}`);
  }
  if (body) {
    parts.push(`body=${encodeURIComponent(body)}`);
  }

  if (parts.length === 0) {
    return `mailto:${email}`;
  }

  return `mailto:${email}?${parts.join("&")}`;
}
