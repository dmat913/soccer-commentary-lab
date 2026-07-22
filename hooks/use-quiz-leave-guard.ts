"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  isExternalQuizLeaveHref,
  resolveQuizLeaveHref,
  type QuizLeaveTarget,
} from "@/lib/quiz/leave-guard";

export type UseQuizLeaveGuardResult = {
  enabled: boolean;
  requestNavigation: (href: string) => void;
  confirmLeave: () => void;
  cancelLeave: () => void;
  isDialogOpen: boolean;
  pendingTarget: QuizLeaveTarget | null;
};

const HISTORY_MARKER = { quizLeaveGuard: true as const };

export function useQuizLeaveGuard(enabled: boolean): UseQuizLeaveGuardResult {
  const router = useRouter();
  const [pendingTarget, setPendingTarget] = useState<QuizLeaveTarget | null>(
    null
  );
  const allowLeaveRef = useRef(false);
  const historyPushedRef = useRef(false);
  const isNavigatingRef = useRef(false);

  const isDialogOpen = pendingTarget !== null;

  const executeNavigation = useCallback(
    (target: QuizLeaveTarget) => {
      if (isNavigatingRef.current) {
        return;
      }
      isNavigatingRef.current = true;
      allowLeaveRef.current = true;

      if (target.type === "back") {
        window.history.go(-2);
        return;
      }

      const href = target.href;
      if (isExternalQuizLeaveHref(href)) {
        window.location.assign(href);
        return;
      }

      router.push(resolveQuizLeaveHref(href));
    },
    [router]
  );

  const requestNavigation = useCallback(
    (href: string) => {
      if (!enabled) {
        executeNavigation({ type: "href", href });
        return;
      }
      setPendingTarget({ type: "href", href });
    },
    [enabled, executeNavigation]
  );

  const confirmLeave = useCallback(() => {
    const target = pendingTarget;
    if (!target) {
      return;
    }
    setPendingTarget(null);
    executeNavigation(target);
  }, [pendingTarget, executeNavigation]);

  const cancelLeave = useCallback(() => {
    setPendingTarget(null);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    allowLeaveRef.current = false;
    window.history.pushState(HISTORY_MARKER, "");
    historyPushedRef.current = true;

    function handlePopState() {
      if (allowLeaveRef.current) {
        return;
      }
      window.history.pushState(HISTORY_MARKER, "");
      setPendingTarget({ type: "back" });
    }

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (historyPushedRef.current && !allowLeaveRef.current) {
        if (
          window.history.state &&
          typeof window.history.state === "object" &&
          "quizLeaveGuard" in window.history.state
        ) {
          allowLeaveRef.current = true;
          window.history.back();
        }
      }
      historyPushedRef.current = false;
    };
  }, [enabled]);

  return {
    enabled,
    requestNavigation,
    confirmLeave,
    cancelLeave,
    isDialogOpen,
    pendingTarget,
  };
}
