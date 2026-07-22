"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { UseQuizLeaveGuardResult } from "@/hooks/use-quiz-leave-guard";

type QuizLeaveGuardRegistration = Pick<
  UseQuizLeaveGuardResult,
  "enabled" | "requestNavigation"
>;

type QuizLeaveGuardContextValue = {
  tryInterceptNavigation: (href: string) => boolean;
  registerLeaveGuard: (registration: QuizLeaveGuardRegistration | null) => void;
};

const QuizLeaveGuardContext = createContext<QuizLeaveGuardContextValue | null>(
  null
);

export function QuizLeaveGuardProvider({ children }: { children: ReactNode }) {
  const [registration, setRegistration] =
    useState<QuizLeaveGuardRegistration | null>(null);

  const registerLeaveGuard = useCallback(
    (next: QuizLeaveGuardRegistration | null) => {
      setRegistration(next);
    },
    []
  );

  const tryInterceptNavigation = useCallback(
    (href: string) => {
      if (!registration?.enabled) {
        return false;
      }
      registration.requestNavigation(href);
      return true;
    },
    [registration]
  );

  const value = useMemo(
    () => ({
      tryInterceptNavigation,
      registerLeaveGuard,
    }),
    [tryInterceptNavigation, registerLeaveGuard]
  );

  return (
    <QuizLeaveGuardContext.Provider value={value}>
      {children}
    </QuizLeaveGuardContext.Provider>
  );
}

export function useRegisterQuizLeaveGuard() {
  const context = useContext(QuizLeaveGuardContext);
  if (!context) {
    throw new Error(
      "useRegisterQuizLeaveGuard must be used within QuizLeaveGuardProvider"
    );
  }
  return context.registerLeaveGuard;
}

export function useQuizLeaveGuardRegistration(
  guard: UseQuizLeaveGuardResult | null
) {
  const registerLeaveGuard = useRegisterQuizLeaveGuard();

  useEffect(() => {
    if (!guard?.enabled) {
      registerLeaveGuard(null);
      return;
    }

    registerLeaveGuard({
      enabled: guard.enabled,
      requestNavigation: guard.requestNavigation,
    });

    return () => {
      registerLeaveGuard(null);
    };
  }, [guard?.enabled, guard?.requestNavigation, registerLeaveGuard]);
}

export function useQuizLeaveGuardNavigation() {
  const context = useContext(QuizLeaveGuardContext);
  if (!context) {
    throw new Error(
      "useQuizLeaveGuardNavigation must be used within QuizLeaveGuardProvider"
    );
  }
  return context.tryInterceptNavigation;
}
