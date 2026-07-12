"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

const easeOut = [0.25, 0.1, 0.25, 1] as const;

type FadeInProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  y?: number;
};

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.45,
  y = 14,
}: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: easeOut }}
      className={className}
    >
      {children}
    </motion.div>
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
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: easeOut }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

type FloatProps = {
  children: ReactNode;
  className?: string;
};

export function Float({ children, className }: FloatProps) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -5, 0] }}
      transition={{
        duration: 4.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}

type HoverLiftProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
};

export function HoverLift({ children, className, ...props }: HoverLiftProps) {
  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.2, ease: easeOut } }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type MotionButtonWrapperProps = {
  children: ReactNode;
  className?: string;
};

export function MotionButtonWrapper({
  children,
  className,
}: MotionButtonWrapperProps) {
  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.2, ease: easeOut } }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
