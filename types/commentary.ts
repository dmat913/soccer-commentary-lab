export type CommentaryLearningPoint = {
  text: string;
  meaning: string;
};

export type CommentaryTranslationItem = {
  text: string;
  meaning: string;
  explanation: string;
  learningPoint: CommentaryLearningPoint;
};

export type CommentaryTranslation = {
  translations: CommentaryTranslationItem[];
};

export type TranslateCommentarySuccess = {
  success: true;
  data: CommentaryTranslation;
};

export type TranslateCommentaryFailure = {
  success: false;
  error: {
    code: TranslateErrorCode;
    message: string;
  };
};

export type TranslateCommentaryResult =
  | TranslateCommentarySuccess
  | TranslateCommentaryFailure;

export type TranslateErrorCode =
  | "VALIDATION_ERROR"
  | "CONFIG_ERROR"
  | "OPENAI_API_ERROR"
  | "PARSE_ERROR"
  | "UNKNOWN_ERROR";
