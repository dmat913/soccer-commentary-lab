import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

type FadeInProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  y?: number;
};

/**
 * Entrance fade via CSS (opacity + transform). No Framer Motion —
 * keeps marketing / shell pages off the motion bundle.
 */
export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.35,
  y = 10,
}: FadeInProps) {
  const style = {
    "--kicklingo-fade-delay": `${delay}s`,
    "--kicklingo-fade-duration": `${duration}s`,
    "--kicklingo-fade-y": `${y}px`,
  } as CSSProperties;

  return (
    <div className={cn("kicklingo-fade-in", className)} style={style}>
      {children}
    </div>
  );
}

type SlideUpFadeInProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

/** Softer entrance for result cards after conversion. */
export function SlideUpFadeIn({
  children,
  className,
  delay = 0,
}: SlideUpFadeInProps) {
  return (
    <FadeIn className={className} delay={delay} duration={0.4} y={14}>
      {children}
    </FadeIn>
  );
}

type MotionButtonWrapperProps = {
  children: ReactNode;
  className?: string;
};

/** Light press/hover affordance without Framer Motion. */
export function MotionButtonWrapper({
  children,
  className,
}: MotionButtonWrapperProps) {
  return (
    <div
      className={cn(
        "transition-transform duration-200 ease-out hover:-translate-y-px active:scale-[0.98] motion-reduce:transform-none",
        className
      )}
    >
      {children}
    </div>
  );
}
