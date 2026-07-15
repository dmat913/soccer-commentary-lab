/**
 * sessionStorage flag set when the learner finishes a quiz and taps
 * "単語帳へ戻る". The Vocabulary page reads it once to show a one-time
 * success banner, then clears it. Session-only: never persisted.
 */
export const QUIZ_RETURN_BANNER_KEY = "kicklingo:quiz-return";
