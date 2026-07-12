/**
 * KickLingo icon mark (speech bubble + "K" + accent lines + soccer ball).
 * Single source of truth reused by the favicon, header/footer logo,
 * Apple touch icon, and Open Graph image.
 */
export const KICKLINGO_MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="100%" height="100%" fill="none"><g stroke="#16A34A" stroke-width="3" stroke-linecap="round"><path d="M16 11 L13 5"/><path d="M23 8 L22 2"/><path d="M30 10 L32 4"/></g><path d="M15 43 L9 54 L25 46 Z" fill="#16A34A"/><circle cx="29" cy="30" r="19" fill="#16A34A"/><circle cx="29" cy="30" r="14.3" fill="#FFFFFF"/><g stroke="#16A34A" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M25 21 V40"/><path d="M25 30.5 L35 21"/><path d="M25 30.5 L35 40"/></g><circle cx="49" cy="15" r="9" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.8"/><path d="M49 10 L53.3 13.1 L51.7 18.2 L46.3 18.2 L44.7 13.1 Z" fill="#0F172A"/><g stroke="#0F172A" stroke-width="1.4" stroke-linecap="round"><path d="M49 10 V6.2"/><path d="M53.3 13.1 L56.8 11.6"/><path d="M51.7 18.2 L53.8 21.6"/><path d="M46.3 18.2 L44.2 21.6"/><path d="M44.7 13.1 L41.2 11.6"/></g></svg>`;

export const KICKLINGO_MARK_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(
  KICKLINGO_MARK_SVG
)}`;
