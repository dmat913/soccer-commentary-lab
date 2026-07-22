/**
 * KickLingo Design System v1 — shared surface / layout class tokens.
 * Prefer these over one-off emerald utility strings so screens stay consistent.
 */

/** Soft page wash used by Favorites / History / Vocabulary / Discover. */
export const pageShellClassName =
  "min-h-full bg-gradient-to-b from-primary/[0.07] via-background to-background dark:from-primary/15";

/**
 * Space reserved for the fixed Mobile Bottom Nav + home-indicator.
 * Used once in AppChrome after Footer — do not also add page-level pb-24.
 */
export const mobileBottomNavClearanceClassName =
  "h-[calc(3.5rem+env(safe-area-inset-bottom))]";

/** Soft home atmosphere — center-bright wash that blends into white. */
export const homeShellClassName =
  "relative min-h-full overflow-hidden bg-gradient-to-b from-primary/[0.08] via-primary/[0.03] to-background dark:from-primary/18 dark:via-primary/[0.06] dark:to-background";

export const pageMainClassName =
  "relative mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-6 overflow-x-hidden px-4 py-6 sm:gap-7 sm:px-6 sm:py-10 md:py-12 lg:py-14";

export const pageMainWideClassName =
  "relative mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-6 overflow-x-hidden px-4 py-6 sm:gap-7 sm:px-6 sm:py-10 md:py-12 lg:py-14";

export const pageHeaderClassName = "space-y-1.5";

export const pageTitleClassName =
  "text-xl font-semibold tracking-tight text-foreground sm:text-2xl";

export const pageSubtitleClassName =
  "text-sm leading-relaxed text-muted-foreground";

export const sectionTitleClassName =
  "text-base font-semibold tracking-tight text-foreground sm:text-lg";

export const cardTitleClassName =
  "text-[15px] font-semibold leading-snug tracking-tight text-foreground sm:text-base";

export const bodyTextClassName = "text-sm leading-relaxed text-foreground";

export const captionTextClassName =
  "text-xs leading-snug text-muted-foreground";

export const microLabelClassName =
  "text-[10px] font-semibold tracking-wider text-muted-foreground uppercase";

/** Default interactive content card (Discover / History / Vocab list). */
export const surfaceCardClassName =
  "rounded-2xl border border-border/80 bg-card shadow-xs transition-[box-shadow,border-color,transform] duration-200 ease-out";

export const surfaceCardInteractiveClassName =
  "rounded-2xl border border-border/80 bg-card shadow-xs transition-[box-shadow,border-color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md";

/** Emphasized product card (translation / favorite surfaces). */
export const surfaceCardEmphasisClassName =
  "rounded-2xl border border-primary/15 bg-card shadow-sm transition-[box-shadow,border-color,transform] duration-200 ease-out hover:border-primary/30 hover:shadow-md";

export const surfacePanelClassName =
  "rounded-2xl border border-border/80 bg-card/90 p-4 shadow-xs sm:p-5";

export const pillBaseClassName =
  "inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

export const pillActiveClassName =
  "border-primary/40 bg-primary/[0.12] text-primary shadow-none";

export const pillIdleClassName =
  "border-border/80 bg-background text-muted-foreground hover:border-primary/35 hover:bg-primary/[0.04] hover:text-foreground";

export const searchInputClassName =
  "h-10 w-full rounded-full border border-border/80 bg-background pl-9 pr-3 text-sm transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none";

export const focusRingClassName =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1";

export const twoColumnLayoutClassName =
  "grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8";

export const emptyStateIconClassName =
  "flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary";
