"use client";

import { ArrowLeft, BookMarked, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useReducer } from "react";

import { QuizProgress } from "@/components/quiz/quiz-progress";
import { QuizQuestionCard } from "@/components/quiz/quiz-question-card";
import { QuizResult } from "@/components/quiz/quiz-result";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { useVocabulary } from "@/hooks/use-vocabulary";
import {
  QUIZ_MIN_ITEMS,
  createQuizQuestions,
} from "@/lib/quiz/create-quiz-questions";
import { getVocabularyUpdateForQuizAnswer } from "@/lib/quiz/vocabulary-learning";
import type { QuizQuestion, QuizSessionResult } from "@/types/quiz";

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

const backToVocabulary = (
  <Button
    variant="ghost"
    size="sm"
    nativeButton={false}
    render={<Link href="/vocabulary" />}
    className="h-9 gap-1.5 self-start rounded-full px-3 text-muted-foreground hover:text-foreground"
  >
    <ArrowLeft className="size-4" aria-hidden="true" />
    単語帳へ戻る
  </Button>
);

export default function QuizPage() {
  const {
    vocabularyItems,
    isLoading: isVocabularyLoading,
    applyVocabularyAnswer,
  } = useVocabulary();
  const [session, dispatch] = useReducer(sessionReducer, null);

  const eligibleCount = vocabularyItems.length;
  const canStart = eligibleCount >= QUIZ_MIN_ITEMS;

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

  // Start a session once the vocabulary is large enough. Guarded so a running
  // or finished session is never reset by vocabulary updates.
  useEffect(() => {
    if (session) {
      return;
    }
    if (!canStart) {
      return;
    }
    const questions = createQuizQuestions(vocabularyItems);
    if (questions.length > 0) {
      dispatch({ type: "start", questions });
    }
  }, [session, canStart, vocabularyItems]);

  // Keyboard shortcuts: 1-4 select an answer while a question is unanswered.
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

  const shellClassName =
    "min-h-full bg-gradient-to-b from-emerald-50/70 via-background to-background dark:from-emerald-950/30";

  // Result screen.
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
      <div className={shellClassName}>
        <main className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-5 px-4 py-8 sm:px-6 sm:py-12">
          {backToVocabulary}
          <FadeIn>
            <QuizResult result={result} onRetry={handleRetry} />
          </FadeIn>
        </main>
      </div>
    );
  }

  // Active quiz.
  if (session) {
    const question = session.questions[session.index];
    const answeredCount = session.correct + session.incorrect;

    return (
      <div className={shellClassName}>
        <main className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-5 px-4 py-8 sm:px-6 sm:py-12">
          {backToVocabulary}
          <QuizProgress
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
    );
  }

  // No session yet.
  if (isVocabularyLoading) {
    return (
      <div className={shellClassName}>
        <main className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-5 px-4 py-8 sm:px-6 sm:py-12">
          {backToVocabulary}
          <p
            role="status"
            aria-live="polite"
            className="py-10 text-center text-sm text-muted-foreground"
          >
            単語帳を読み込んでいます…
          </p>
        </main>
      </div>
    );
  }

  // Brief wait while the start effect creates the session from eligible items.
  if (canStart) {
    return (
      <div className={shellClassName}>
        <main className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-5 px-4 py-8 sm:px-6 sm:py-12">
          {backToVocabulary}
          <p
            role="status"
            aria-live="polite"
            className="py-10 text-center text-sm text-muted-foreground"
          >
            クイズを準備しています…
          </p>
        </main>
      </div>
    );
  }

  // Not enough items to start.
  const remaining = Math.max(0, QUIZ_MIN_ITEMS - eligibleCount);

  return (
    <div className={shellClassName}>
      <main className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-5 px-4 py-8 sm:px-6 sm:py-12">
        {backToVocabulary}
        <FadeIn>
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-border/60 bg-card/60 px-5 py-10 text-center sm:py-14">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <BookMarked className="size-6" aria-hidden="true" />
            </span>
            <div className="space-y-1.5">
              <h1 className="text-lg font-semibold tracking-tight text-foreground">
                Quizには単語帳が{QUIZ_MIN_ITEMS}件以上必要です
              </h1>
              <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
                現在の保存は {eligibleCount}件です。あと {remaining}件保存すると
                Quizに挑戦できます。
              </p>
            </div>
            <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href="/vocabulary" />}
                className="h-11 rounded-full px-5"
              >
                <BookMarked className="size-4" aria-hidden="true" />
                単語帳へ戻る
              </Button>
              <Button
                variant="outline"
                size="lg"
                nativeButton={false}
                render={<Link href="/" />}
                className="h-11 rounded-full px-5"
              >
                <Plus className="size-4" aria-hidden="true" />
                Homeで表現を追加する
              </Button>
            </div>
          </div>
        </FadeIn>
      </main>
    </div>
  );
}
