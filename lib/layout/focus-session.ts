/**
 * Focus-session routes (Quiz / Daily) hide global chrome so learners stay
 * in the session. Matches `/quiz`, `/daily`, and any nested paths.
 */
export function isFocusSessionPath(pathname: string | null | undefined): boolean {
  if (!pathname) {
    return false;
  }

  return (
    pathname === "/quiz" ||
    pathname.startsWith("/quiz/") ||
    pathname === "/daily" ||
    pathname.startsWith("/daily/")
  );
}
