"use client";

import { ArrowLeft, AlertCircle, BookMarked } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useReducer, type ReactNode } from "react";

import { QuizLeaveDialog } from "@/components/quiz/quiz-leave-dialog";
import { useQuizLeaveGuardRegistration } from "@/components/quiz/quiz-leave-guard-provider";
import { QuizProgress } from "@/components/quiz/quiz-progress";
import { QuizQuestionCard } from "@/components/quiz/quiz-question-card";
import { QuizResult } from "@/components/quiz/quiz-result";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/fade-in";
import { useQuizLeaveGuard } from "@/hooks/use-quiz-leave-guard";
import { useVocabulary } from "@/hooks/use-vocabulary";
import {
  emptyStateIconClassName,
  pageShellClassName,
} from "@/lib/design/surfaces";
import { shouldEnableQuizLeaveGuard } from "@/lib/quiz/leave-guard";
import {
  QUIZ_MAX_QUESTIONS,
  QUIZ_MIN_ITEMS,
  createQuizQuestions,
} from "@/lib/quiz/create-quiz-questions";
import { getVocabularyUpdateForQuizAnswer } from "@/lib/quiz/vocabulary-learning";
import type { QuizQuestion, QuizSessionResult } from "@/types/quiz";

const QUIZ_META_ITEMS = [
  `${QUIZ_MAX_QUESTIONS}問`,
  "約2分",
  "単語帳から出題",
] as const;

type SessionState = {
  questions: QuizQuestion[];
  index: number;
  selectedOptionId: string | null;
  correct: number;
  incorrect: number;
  currentStreak: number;
  longestStreak: number;
  missedQuestionIds: string[];
  phase: "active" | "result";
};

type SessionAction =
  | { type: "start"; questions: QuizQuestion[] }
  | { type: "answer"; optionId: string }
  | { type: "next" };

function createInitialSession(questions: QuizQuestion[]): SessionState {
  return {
    questions,
    index: 0,
    selectedOptionId: null,
    correct: 0,
    incorrect: 0,
    currentStreak: 0,
    longestStreak: 0,
    missedQuestionIds: [],
    phase: "active",
  };
}

function sessionReducer(
  state: SessionState | null,
  action: SessionAction
): SessionState | null {
  switch (action.type) {
    case "start":
      return createInitialSession(action.questions);

    case "answer": {
      if (!state || state.phase !== "active" || state.selectedOptionId !== null) {
        return state;
      }
      const question = state.questions[state.index];
      const option = question.options.find((o) => o.id === action.optionId);
      if (!option) {
        return state;
      }
      const isCorrect = option.isCorrect;
      const currentStreak = isCorrect ? state.currentStreak + 1 : 0;
      return {
        ...state,
        selectedOptionId: action.optionId,
        correct: state.correct + (isCorrect ? 1 : 0),
        incorrect: state.incorrect + (isCorrect ? 0 : 1),
        currentStreak,
        longestStreak: Math.max(state.longestStreak, currentStreak),
        missedQuestionIds: isCorrect
          ? state.missedQuestionIds
          : [...state.missedQuestionIds, question.id],
      };
    }

    case "next": {
      if (!state || state.phase !== "active" || state.selectedOptionId === null) {
        return state;
      }
      const nextIndex = state.index + 1;
      if (nextIndex >= state.questions.length) {
        return { ...state, phase: "result" };
      }
      return { ...state, index: nextIndex, selectedOptionId: null };
    }

    default:
      return state;
  }
}

const mainClassName =
  "mx-auto flex w-full min-w-0 max-w-xl flex-col gap-3 px-4 py-6 pb-8 sm:gap-3.5 sm:px-6 sm:py-8";

function QuizPageShell({
  leaveGuard,
  children,
}: {
  leaveGuard: {
    isDialogOpen: boolean;
    cancelLeave: () => void;
    confirmLeave: () => void;
  };
  children: ReactNode;
}) {
  return (
    <>
      <QuizLeaveDialog
        isOpen={leaveGuard.isDialogOpen}
        onContinue={leaveGuard.cancelLeave}
        onLeave={leaveGuard.confirmLeave}
      />
      {children}
    </>
  );
}

function createBackToVocabulary(onNavigate: (href: string) => void) {
  return (
    <Button
      variant="ghost"
      size="sm"
      type="button"
      onClick={() => onNavigate("/vocabulary")}
      className="h-8 gap-1.5 self-start rounded-full px-2.5 text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-3.5" aria-hidden="true" />
      単語帳へ戻る
    </Button>
  );
}

function QuizLoadingSkeleton({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="space-y-3"
    >
      <span className="sr-only">{message}</span>
      <div className="h-1.5 w-full animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
      <div className="space-y-2 rounded-xl border border-border/70 bg-card px-3.5 py-3 shadow-xs">
        <div className="h-2.5 w-20 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        <div className="h-5 w-4/5 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        <div className="h-3 w-2/5 animate-pulse rounded bg-muted motion-reduce:animate-none" />
      </div>
      <div className="space-y-2">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="h-12 animate-pulse rounded-xl border border-border/50 bg-muted/40 motion-reduce:animate-none"
          />
        ))}
      </div>
    </div>
  );
}

export default function QuizPage() {
  const {
    vocabularyItems,
    isLoading: isVocabularyLoading,
    applyVocabularyAnswer,
  } = useVocabulary();
  const [session, dispatch] = useReducer(sessionReducer, null);

  const leaveGuardEnabled = shouldEnableQuizLeaveGuard(
    session?.phase === "active" ? session : null
  );
  const leaveGuard = useQuizLeaveGuard(leaveGuardEnabled);
  useQuizLeaveGuardRegistration(leaveGuard);
  const backToVocabulary = createBackToVocabulary(leaveGuard.requestNavigation);

  const eligibleCount = vocabularyItems.length;
  const canStart = eligibleCount >= QUIZ_MIN_ITEMS;
  const preparedQuestions = useMemo(() => {
    if (session || isVocabularyLoading || !canStart) {
      return null;
    }
    return createQuizQuestions(vocabularyItems);
  }, [session, isVocabularyLoading, canStart, vocabularyItems]);
  const generationFailed =
    preparedQuestions !== null && preparedQuestions.length === 0;

  function handleAnswer(optionId: string) {
    const vocabularyUpdate = getVocabularyUpdateForQuizAnswer(session, optionId);
    dispatch({ type: "answer", optionId });
    if (!vocabularyUpdate) {
      return;
    }
    try {
      applyVocabularyAnswer(
        vocabularyUpdate.vocabularyId,
        vocabularyUpdate.isCorrect
      );
    } catch {
      // Learning updates must not interrupt Quiz answering.
    }
  }

  useEffect(() => {
    if (!session || session.phase !== "active" || session.selectedOptionId) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      const optionIndex = Number(event.key) - 1;
      if (!Number.isInteger(optionIndex) || optionIndex < 0) {
        return;
      }
      const current = session!.questions[session!.index];
      const option = current.options[optionIndex];
      if (!option) {
        return;
      }
      const vocabularyUpdate = getVocabularyUpdateForQuizAnswer(
        session,
        option.id
      );
      dispatch({ type: "answer", optionId: option.id });
      if (!vocabularyUpdate) {
        return;
      }
      try {
        applyVocabularyAnswer(
          vocabularyUpdate.vocabularyId,
          vocabularyUpdate.isCorrect
        );
      } catch {
        // Learning updates must not interrupt Quiz answering.
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [session, applyVocabularyAnswer]);

  function handleRetry() {
    const questions = createQuizQuestions(vocabularyItems);
    if (questions.length > 0) {
      dispatch({ type: "start", questions });
    }
  }

  if (session && session.phase === "result") {
    const result: QuizSessionResult = {
      total: session.questions.length,
      correct: session.correct,
      incorrect: session.incorrect,
      longestStreak: session.longestStreak,
      answers: [],
      missedQuestions: session.questions.filter((q) =>
        session.missedQuestionIds.includes(q.id)
      ),
    };

    return (
      <QuizPageShell leaveGuard={leaveGuard}>
        <div className={pageShellClassName}>
          <main className={mainClassName}>
            {backToVocabulary}
            <FadeIn>
              <QuizResult result={result} onRetry={handleRetry} />
            </FadeIn>
          </main>
        </div>
      </QuizPageShell>
    );
  }

  if (session) {
    const question = session.questions[session.index];
    const answeredCount = session.correct + session.incorrect;

    return (
      <QuizPageShell leaveGuard={leaveGuard}>
        <div className={pageShellClassName}>
          <main className={mainClassName}>
            {backToVocabulary}
            <QuizProgress
              label="Practice Quiz"
              current={session.index + 1}
              total={session.questions.length}
              answered={answeredCount}
              streak={session.currentStreak}
            />
            <QuizQuestionCard
              key={question.id}
              question={question}
              selectedOptionId={session.selectedOptionId}
              isLast={session.index + 1 >= session.questions.length}
              streak={session.currentStreak}
              onSelect={handleAnswer}
              onNext={() => dispatch({ type: "next" })}
            />
          </main>
        </div>
      </QuizPageShell>
    );
  }

  if (isVocabularyLoading) {
    return (
      <QuizPageShell leaveGuard={leaveGuard}>
        <div className={pageShellClassName}>
          <main className={mainClassName}>
            {backToVocabulary}
            <QuizLoadingSkeleton message="単語帳を読み込んでいます…" />
          </main>
        </div>
      </QuizPageShell>
    );
  }

  if (generationFailed) {
    return (
      <QuizPageShell leaveGuard={leaveGuard}>
        <div className={pageShellClassName}>
          <main className={mainClassName}>
            {backToVocabulary}
            <FadeIn>
              <div
                role="alert"
                className="flex flex-col items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/[0.04] px-4 py-8 text-center dark:border-destructive/30 dark:bg-destructive/10 sm:py-10"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-muted/70 text-muted-foreground">
                  <AlertCircle className="size-5" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-lg font-semibold tracking-tight text-foreground">
                    クイズを準備できませんでした
                  </h1>
                  <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
                    もう一度お試しください。問題が続く場合は単語帳からやり直してください。
                  </p>
                </div>
                <Button
                  size="lg"
                  nativeButton={false}
                  render={<Link href="/vocabulary" />}
                  className="h-11 rounded-full px-5"
                >
                  <BookMarked className="size-4" aria-hidden="true" />
                  単語帳へ戻る
                </Button>
              </div>
            </FadeIn>
          </main>
        </div>
      </QuizPageShell>
    );
  }

  if (canStart && preparedQuestions && preparedQuestions.length > 0) {
    return (
      <QuizPageShell leaveGuard={leaveGuard}>
        <div className={pageShellClassName}>
          <main className={mainClassName}>
            {backToVocabulary}
            <FadeIn>
              <div className="flex flex-col items-center gap-4 rounded-xl border border-border/60 bg-card/60 px-4 py-8 text-center sm:py-10">
                <div className={emptyStateIconClassName}>
                  <BookMarked className="size-5" aria-hidden="true" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-lg font-semibold tracking-tight text-foreground">
                    Practice Quiz
                  </h1>
                  <ul
                    className="flex flex-wrap items-center justify-center gap-1.5"
                    aria-label="クイズの概要"
                  >
                    {QUIZ_META_ITEMS.map((item) => (
                      <li
                        key={item}
                        className="rounded-md border border-border/70 bg-muted/40 px-2 py-1 text-[11px] font-medium text-muted-foreground"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button
                  type="button"
                  size="lg"
                  onClick={() =>
                    dispatch({ type: "start", questions: preparedQuestions })
                  }
                  className="h-11 rounded-full px-5"
                >
                  開始する
                </Button>
              </div>
            </FadeIn>
          </main>
        </div>
      </QuizPageShell>
    );
  }

  if (canStart) {
    return (
      <QuizPageShell leaveGuard={leaveGuard}>
        <div className={pageShellClassName}>
          <main className={mainClassName}>
            {backToVocabulary}
            <QuizLoadingSkeleton message="クイズを準備しています…" />
          </main>
        </div>
      </QuizPageShell>
    );
  }

  const remaining = Math.max(0, QUIZ_MIN_ITEMS - eligibleCount);

  return (
    <QuizPageShell leaveGuard={leaveGuard}>
      <div className={pageShellClassName}>
        <main className={mainClassName}>
          {backToVocabulary}
          <FadeIn>
            <div className="flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-8 text-center sm:py-10">
              <div className={emptyStateIconClassName}>
                <BookMarked className="size-5" aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <h1 className="text-lg font-semibold tracking-tight text-foreground">
                  Practice Quiz
                </h1>
                <ul
                  className="flex flex-wrap items-center justify-center gap-1.5"
                  aria-label="クイズの概要"
                >
                  {QUIZ_META_ITEMS.map((item) => (
                    <li
                      key={item}
                      className="rounded-md border border-border/70 bg-muted/40 px-2 py-1 text-[11px] font-medium text-muted-foreground"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Quizには単語帳が{QUIZ_MIN_ITEMS}件以上必要です。現在{" "}
                  <span className="font-semibold text-foreground tabular-nums">
                    {eligibleCount}
                  </span>
                  件 · あと{" "}
                  <span className="font-semibold text-foreground tabular-nums">
                    {remaining}
                  </span>
                  件で開始できます。
                </p>
              </div>
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href="/vocabulary" />}
                className="h-11 rounded-full px-5"
              >
                <BookMarked className="size-4" aria-hidden="true" />
                単語帳へ戻る
              </Button>
            </div>
          </FadeIn>
        </main>
      </div>
    </QuizPageShell>
  );
}
