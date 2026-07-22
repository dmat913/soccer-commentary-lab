"use client";

import { ArrowLeft, BookMarked, Flame, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { QuizProgress } from "@/components/quiz/quiz-progress";
import { QuizQuestionCard } from "@/components/quiz/quiz-question-card";
import { QuizResult } from "@/components/quiz/quiz-result";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/fade-in";
import { useDailyChallenge } from "@/hooks/use-daily-challenge";
import { useVocabulary } from "@/hooks/use-vocabulary";
import {
  emptyStateIconClassName,
  pageShellClassName,
} from "@/lib/design/surfaces";
import { getJstDayKey } from "@/lib/daily/day-key";
import {
  QUIZ_MIN_ITEMS,
  createQuizQuestions,
} from "@/lib/quiz/create-quiz-questions";
import type { QuizQuestion, QuizSessionResult } from "@/types/quiz";
import type { VocabularyItem } from "@/types/vocabulary";

/** Daily Challenge is intentionally shorter than the practice Quiz. */
const DAILY_MAX_QUESTIONS = 1;

/** Fisher–Yates shuffle returning a new array (does not mutate the input). */
function shuffle<T>(input: readonly T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Picks up to DAILY_MAX_QUESTIONS random vocabulary items. The narrowed array
 * is passed to the unchanged createQuizQuestions(), so the practice Quiz's
 * generation rules and behavior stay identical.
 */
function pickDailyItems(items: VocabularyItem[]): VocabularyItem[] {
  return shuffle(items).slice(0, DAILY_MAX_QUESTIONS);
}

/**
 * Resolves each question back to its source Vocabulary id (by english text,
 * which createQuizQuestions treats as unique). Null when it cannot be resolved,
 * so the record still works if the vocabulary later changes.
 */
function mapQuestionVocabularyIds(
  questions: QuizQuestion[],
  items: VocabularyItem[]
): (string | null)[] {
  const idByText = new Map<string, string>();
  for (const item of items) {
    const text = item.englishText.trim();
    if (text && !idByText.has(text)) {
      idByText.set(text, item.id);
    }
  }
  return questions.map(
    (question) => idByText.get(question.correctText.trim()) ?? null
  );
}

const backToVocabulary = (
  <Button
    variant="ghost"
    size="sm"
    nativeButton={false}
    render={<Link href="/vocabulary" />}
    className="h-8 gap-1.5 self-start rounded-full px-2.5 text-muted-foreground hover:text-foreground"
  >
    <ArrowLeft className="size-3.5" aria-hidden="true" />
    単語帳へ戻る
  </Button>
);

const mainClassName =
  "mx-auto flex w-full min-w-0 max-w-xl flex-col gap-3 px-4 py-6 pb-8 sm:gap-3.5 sm:px-6 sm:py-8";

function Shell({
  children,
  showBack = true,
}: {
  children: React.ReactNode;
  showBack?: boolean;
}) {
  return (
    <div className={pageShellClassName}>
      <main className={mainClassName}>
        {showBack ? backToVocabulary : null}
        {children}
      </main>
    </div>
  );
}

function DailyLoadingSkeleton({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="space-y-3"
    >
      <span className="sr-only">{message}</span>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="h-4 w-28 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          <div className="h-4 w-10 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        </div>
        <div className="h-1.5 w-full animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
      </div>
      <div className="space-y-2 rounded-xl border border-border/70 bg-card px-3.5 py-3 shadow-xs">
        <div className="h-2.5 w-24 animate-pulse rounded bg-muted motion-reduce:animate-none" />
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

export default function DailyChallengePage() {
  const router = useRouter();
  const { vocabularyItems, isLoading: isVocabularyLoading } = useVocabulary();
  const {
    dailyChallenge: dailyRecord,
    isHydrated,
    startChallenge,
    answerQuestion,
    advanceChallenge,
  } = useDailyChallenge();

  // A challenge that is in progress but was not started via the button in this
  // page session is a genuine resume (returning to the tab or reloading). Only
  // then do we show the subtle "resumed" note.
  const [startedThisSession, setStartedThisSession] = useState(false);
  const isResumedSession =
    dailyRecord?.status === "in_progress" && !startedThisSession;

  // Keyboard shortcuts: 1-4 select an answer while the current question is
  // still unanswered.
  useEffect(() => {
    if (!dailyRecord || dailyRecord.status !== "in_progress") {
      return;
    }
    const question = dailyRecord.questions[dailyRecord.currentQuestionIndex];
    if (!question) {
      return;
    }
    const answered = dailyRecord.answers.some(
      (answer) => answer.questionId === question.id
    );
    if (answered) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      const optionIndex = Number(event.key) - 1;
      if (!Number.isInteger(optionIndex) || optionIndex < 0) {
        return;
      }
      const option = question.options[optionIndex];
      if (option) {
        answerQuestion(option.id);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dailyRecord, answerQuestion]);

  function handleStart() {
    const questions = createQuizQuestions(pickDailyItems(vocabularyItems));
    if (questions.length === 0) {
      return;
    }
    setStartedThisSession(true);
    startChallenge({
      challengeDate: getJstDayKey(),
      questions,
      questionVocabularyIds: mapQuestionVocabularyIds(
        questions,
        vocabularyItems
      ),
    });
  }

  // 1) Loading: wait for hydration before deciding what to render.
  if (!isHydrated) {
    return (
      <Shell>
        <DailyLoadingSkeleton message="今日のChallengeを準備しています…" />
      </Shell>
    );
  }

  // 2) An existing record for today always takes priority, even if the current
  // vocabulary has since dropped below the minimum.
  if (dailyRecord) {
    if (dailyRecord.status === "completed") {
      const result: QuizSessionResult = {
        total: dailyRecord.questions.length,
        correct: dailyRecord.correctCount,
        incorrect: dailyRecord.incorrectCount,
        longestStreak: dailyRecord.longestStreak,
        answers: [],
        missedQuestions: dailyRecord.questions.filter((question) =>
          dailyRecord.answers.some(
            (answer) => answer.questionId === question.id && !answer.isCorrect
          )
        ),
      };

      return (
        <Shell>
          <FadeIn>
            <div className="space-y-4 sm:space-y-5">
              <div className="space-y-1 text-center">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/[0.1] text-primary">
                  <Flame className="size-5" aria-hidden="true" />
                </span>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">
                  今日のChallenge完了！
                </h1>
                <p className="text-sm font-medium text-foreground/80">
                  1問Challengeをクリアしました
                </p>
                <p className="text-sm text-muted-foreground">
                  また明日挑戦しましょう。
                </p>
              </div>
              <QuizResult
                result={result}
                retryLabel="Practice Quizに挑戦"
                onRetry={() => router.push("/quiz")}
              />
            </div>
          </FadeIn>
        </Shell>
      );
    }

    // In progress (fresh start or resumed).
    const index = dailyRecord.currentQuestionIndex;
    const question = dailyRecord.questions[index];
    const currentAnswer = dailyRecord.answers.find(
      (answer) => answer.questionId === question.id
    );
    const answeredCount = dailyRecord.correctCount + dailyRecord.incorrectCount;

    return (
      <Shell showBack={false}>
        {isResumedSession ? (
          <p
            role="status"
            className="text-center text-[11px] text-muted-foreground"
          >
            今日のChallengeを再開しました
          </p>
        ) : null}
        <QuizProgress
          label="今日のChallenge"
          current={index + 1}
          total={dailyRecord.questions.length}
          answered={answeredCount}
          streak={dailyRecord.currentStreak}
        />
        <QuizQuestionCard
          key={question.id}
          question={question}
          selectedOptionId={currentAnswer?.selectedOptionId ?? null}
          isLast={index + 1 >= dailyRecord.questions.length}
          streak={dailyRecord.currentStreak}
          onSelect={(optionId) => answerQuestion(optionId)}
          onNext={() => advanceChallenge()}
        />
        <div className="pt-1">
          {backToVocabulary}
        </div>
      </Shell>
    );
  }

  // 3) No record for today. Wait only while remote vocabulary is still loading.
  if (isVocabularyLoading) {
    return (
      <Shell>
        <DailyLoadingSkeleton message="今日のChallengeを準備しています…" />
      </Shell>
    );
  }

  // 4) Not enough vocabulary to start a new Challenge.
  if (vocabularyItems.length < QUIZ_MIN_ITEMS) {
    const remaining = Math.max(0, QUIZ_MIN_ITEMS - vocabularyItems.length);

    return (
      <Shell>
        <FadeIn>
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-8 text-center sm:py-10">
            <div className={emptyStateIconClassName}>
              <BookMarked className="size-5" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h1 className="text-lg font-semibold tracking-tight text-foreground">
                今日のChallenge
              </h1>
              <p className="text-sm text-muted-foreground">1問だけ挑戦</p>
              <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
                開始には単語帳が{QUIZ_MIN_ITEMS}件以上必要です。現在{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {vocabularyItems.length}
                </span>
                件 · あと{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {remaining}
                </span>
                件保存すると挑戦できます。
              </p>
            </div>
            <div className="flex w-full max-w-xs flex-col gap-2">
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href="/vocabulary" />}
                className="h-auto min-h-11 w-full gap-2 rounded-full px-4 py-2.5 leading-snug"
              >
                <BookMarked className="size-4 shrink-0" aria-hidden="true" />
                単語帳へ戻る
              </Button>
            </div>
          </div>
        </FadeIn>
      </Shell>
    );
  }

  // 5) Ready to start. The challenge begins only when the learner taps the
  // button; no record is created before then.
  return (
    <Shell>
      <FadeIn>
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border/70 bg-card px-4 py-8 text-center shadow-xs sm:py-10">
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/[0.1] text-primary">
            <Flame className="size-5" aria-hidden="true" />
          </span>
          <div className="space-y-3">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              今日のChallenge
            </h1>
            <ul
              className="flex flex-col items-center gap-1.5 sm:flex-row sm:justify-center"
              aria-label="今日のChallengeの概要"
            >
              <li className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/40 px-2.5 py-1.5 text-sm font-medium text-foreground">
                <Zap
                  className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400"
                  aria-hidden="true"
                />
                今日の1問
              </li>
              <li className="rounded-lg border border-border/70 bg-muted/40 px-2.5 py-1.5 text-sm font-medium text-muted-foreground">
                約30秒
              </li>
            </ul>
          </div>
          <Button
            type="button"
            size="lg"
            onClick={handleStart}
            className="h-auto min-h-11 w-full max-w-xs gap-2 rounded-full px-5 py-2.5 leading-snug"
          >
            開始する
          </Button>
        </div>
      </FadeIn>
    </Shell>
  );
}
