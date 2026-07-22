"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

/** Linear-like soft ease — Design System v1 motion. */
const easeOut = [0.25, 0.1, 0.25, 1] as const;

type FloatProps = {
  children: ReactNode;
  className?: string;
};

export function Float({ children, className }: FloatProps) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -4, 0] }}
      transition={{
        duration: 5,
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

/** Card hover lift — keep Framer for interactive translation cards. */
export function HoverLift({ children, className, ...props }: HoverLiftProps) {
  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.18, ease: easeOut } }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
