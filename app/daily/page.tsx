"use client";

import { ArrowLeft, BookMarked, CalendarCheck, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { QuizProgress } from "@/components/quiz/quiz-progress";
import { QuizQuestionCard } from "@/components/quiz/quiz-question-card";
import { QuizResult } from "@/components/quiz/quiz-result";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { useDailyChallenge } from "@/hooks/use-daily-challenge";
import { useVocabulary } from "@/hooks/use-vocabulary";
import { getJstDayKey } from "@/lib/daily/day-key";
import {
  QUIZ_MIN_ITEMS,
  createQuizQuestions,
} from "@/lib/quiz/create-quiz-questions";
import type { QuizQuestion, QuizSessionResult } from "@/types/quiz";
import type { VocabularyItem } from "@/types/vocabulary";

/** Daily Challenge is intentionally shorter than the practice Quiz. */
const DAILY_MAX_QUESTIONS = 5;

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
    className="h-9 gap-1.5 self-start rounded-full px-3 text-muted-foreground hover:text-foreground"
  >
    <ArrowLeft className="size-4" aria-hidden="true" />
    単語帳へ戻る
  </Button>
);

const shellClassName =
  "min-h-full bg-gradient-to-b from-emerald-50/70 via-background to-background dark:from-emerald-950/30";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className={shellClassName}>
      <main className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-5 px-4 py-8 sm:px-6 sm:py-12">
        {backToVocabulary}
        {children}
      </main>
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
        <p
          role="status"
          aria-live="polite"
          className="py-10 text-center text-sm text-muted-foreground"
        >
          今日のChallengeを準備しています…
        </p>
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
            <div className="space-y-1 text-center">
              <p className="text-lg font-semibold tracking-tight text-emerald-700 dark:text-emerald-300">
                今日のChallenge完了！
              </p>
              <p className="text-sm text-muted-foreground">
                また明日挑戦しましょう。
              </p>
            </div>
          </FadeIn>
          <FadeIn>
            <QuizResult
              result={result}
              retryLabel="通常Quizへ挑戦"
              onRetry={() => router.push("/quiz")}
            />
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
      <Shell>
        {isResumedSession ? (
          <p
            role="status"
            className="text-center text-xs text-muted-foreground"
          >
            今日のChallengeを再開しました
          </p>
        ) : null}
        <QuizProgress
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
      </Shell>
    );
  }

  // 3) No record for today. Wait only while remote vocabulary is still loading.
  if (isVocabularyLoading) {
    return (
      <Shell>
        <p
          role="status"
          aria-live="polite"
          className="py-10 text-center text-sm text-muted-foreground"
        >
          今日のChallengeを準備しています…
        </p>
      </Shell>
    );
  }

  // 4) Not enough vocabulary to start a new Challenge.
  if (vocabularyItems.length < QUIZ_MIN_ITEMS) {
    const remaining = Math.max(0, QUIZ_MIN_ITEMS - vocabularyItems.length);

    return (
      <Shell>
        <FadeIn>
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-border/60 bg-card/60 px-5 py-10 text-center sm:py-14">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <BookMarked className="size-6" aria-hidden="true" />
            </span>
            <div className="space-y-1.5">
              <h1 className="text-lg font-semibold tracking-tight text-foreground">
                今日のChallengeには単語帳が{QUIZ_MIN_ITEMS}件以上必要です
              </h1>
              <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
                現在{vocabularyItems.length}件保存されています。あと{remaining}
                件保存すると挑戦できます。
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
      </Shell>
    );
  }

  // 5) Ready to start. The challenge begins only when the learner taps the
  // button; no record is created before then.
  const dailyQuestionCount = Math.min(
    vocabularyItems.length,
    DAILY_MAX_QUESTIONS
  );

  return (
    <Shell>
      <FadeIn>
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-emerald-100/80 bg-white/95 px-5 py-12 text-center shadow-sm shadow-emerald-100/40 sm:py-16 dark:border-emerald-900/50 dark:bg-emerald-950/35">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <CalendarCheck className="size-6" aria-hidden="true" />
          </span>
          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              今日のChallenge
            </h1>
            <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
              今日の{dailyQuestionCount}問で英語実況を復習しましょう。
            </p>
          </div>
          <Button
            type="button"
            size="lg"
            onClick={handleStart}
            className="h-11 rounded-full bg-emerald-600 px-6 text-white hover:bg-emerald-700"
          >
            Challenge開始
          </Button>
        </div>
      </FadeIn>
    </Shell>
  );
}
