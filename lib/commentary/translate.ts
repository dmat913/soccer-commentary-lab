import "server-only";

import OpenAI from "openai";

import { getOpenAIClient } from "@/lib/openai/client";
import type {
  TranslateCommentaryResult,
  TranslateErrorCode,
} from "@/types/commentary";

const MODEL = "gpt-4o-mini";

const SYSTEM_PROMPT = `あなたはPremier Leagueで10年以上実況しているプロの実況アナウンサーです。

入力された日本語実況を、
実際の海外サッカー中継で自然に使われる英語実況へ変換してください。
実況表現を3つ返してください。
同じ意味の言い換えではなく、少しニュアンスの異なる実況表現を返してください。

ルール
- 直訳は禁止
- 実況として自然な英語を優先する
- 短く勢いのある実況を意識する
- 日常英語ではなく実況英語を使う
- Premier LeagueやChampions Leagueの実況で一般的に使われる表現を優先してください。
- 文章を長く説明するより、実況らしく短く勢いのある表現を優先してください。
- 「Just wide!」「What a save!」「Off the post!」のような定番表現を積極的に使用してください。
- 同じ意味なら、実際の実況で頻繁に使われる言い回しを選択してください。
- 3つとも異なる表現・異なる言い回しにしてください。
- できるだけ同じ単語を繰り返さないでください。
- 「shot」「finish」「strike」「effort」「chance」「header」など、実況で使われる様々な語彙を使い分けてください。
- 学習者が表現の違いを学べることを目的としてください。

日本語の言葉を翻訳するのではなく、その場面を実況するつもりで自然な英語を生成してください。
入力が曖昧な場合は、実際のサッカー実況で最も一般的な表現を選択してください。

出力形式
- 必ずJSON形式で返してください
- translations 配列のみ返してください
- 3件の実況表現を返してください
- 各要素には text（英語実況）、meaning（この英語実況を自然な日本語にするとどういう意味かを1文で説明）、explanation（表現の解説）、learningPoint（今回覚えたい表現）を含めてください

explanation のルール
- 2〜4文程度の日本語で書いてください
- なぜこの英語表現になるのかを説明してください
- 実況でよく使われる理由を説明してください
- 覚えておくと役立つポイントを含めてください

learningPoint のルール
- このサービスは英単語学習ではなく、サッカー実況で使われる英語表現の学習が目的です
- ball / pass / delivery のような基本名詞ではなく、実況で頻出する表現・構文・フレーズを選んでください
- 例: Great / Superb / What a / Back of the net / Through / Curl / Slots home
- 1語だけでなく、2語以上の定番フレーズでも構いません
- learningPoint.text には覚えるべき英語表現をそのまま入れてください
- learningPoint.meaning は日本語で、その表現が実況でどう使われるかを簡潔に説明してください

JSON形式:
{
  "translations": [
    {
      "text": "What a strike!",
      "meaning": "なんて強烈なシュートだ！",
      "explanation": "strikeは単なるシュートではなく、威力や正確さを強調する言葉です。実況ではゴールに近い強烈な一打を伝えるときによく使われます。What a ...! の形は驚きや称賛を短く表す定番パターンで、覚えておくと現場感のある実況に使えます。",
      "learningPoint": {
        "text": "What a",
        "meaning": "『なんという〜だ！』という感嘆表現。実況で非常によく使われる。"
      }
    }
  ]
}`;

const translationResponseJsonSchema = {
  type: "object",
  properties: {
    translations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          meaning: { type: "string" },
          explanation: { type: "string" },
          learningPoint: {
            type: "object",
            properties: {
              text: { type: "string" },
              meaning: { type: "string" },
            },
            required: ["text", "meaning"],
            additionalProperties: false,
          },
        },
        required: ["text", "meaning", "explanation", "learningPoint"],
        additionalProperties: false,
      },
      minItems: 3,
      maxItems: 3,
    },
  },
  required: ["translations"],
  additionalProperties: false,
} as const;

type OpenAILearningPoint = {
  text: string;
  meaning: string;
};

type OpenAITranslationItem = {
  text: string;
  meaning: string;
  explanation: string;
  learningPoint: OpenAILearningPoint;
};

type OpenAITranslationResponse = {
  translations: OpenAITranslationItem[];
};

function parseTranslationResponse(content: string): OpenAITranslationResponse | null {
  try {
    const parsed: unknown = JSON.parse(content);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("translations" in parsed) ||
      !Array.isArray(parsed.translations) ||
      parsed.translations.length !== 3
    ) {
      return null;
    }

    const translations: OpenAITranslationItem[] = [];

    for (const item of parsed.translations) {
      if (
        typeof item !== "object" ||
        item === null ||
        !("text" in item) ||
        !("meaning" in item) ||
        !("explanation" in item) ||
        !("learningPoint" in item) ||
        typeof item.text !== "string" ||
        typeof item.meaning !== "string" ||
        typeof item.explanation !== "string" ||
        typeof item.learningPoint !== "object" ||
        item.learningPoint === null ||
        !("text" in item.learningPoint) ||
        !("meaning" in item.learningPoint) ||
        typeof item.learningPoint.text !== "string" ||
        typeof item.learningPoint.meaning !== "string" ||
        item.text.trim().length === 0 ||
        item.meaning.trim().length === 0 ||
        item.explanation.trim().length === 0 ||
        item.learningPoint.text.trim().length === 0 ||
        item.learningPoint.meaning.trim().length === 0
      ) {
        return null;
      }

      translations.push({
        text: item.text.trim(),
        meaning: item.meaning.trim(),
        explanation: item.explanation.trim(),
        learningPoint: {
          text: item.learningPoint.text.trim(),
          meaning: item.learningPoint.meaning.trim(),
        },
      });
    }

    return { translations };
  } catch {
    return null;
  }
}

function failure(
  code: TranslateErrorCode,
  message: string,
  cause?: unknown
): TranslateCommentaryResult {
  console.error(`[translateCommentary] ${code}: ${message}`, cause ?? "");
  return {
    success: false,
    error: { code, message },
  };
}

export async function translateCommentary(
  japaneseText: string
): Promise<TranslateCommentaryResult> {
  const trimmedText = japaneseText.trim();

  if (!trimmedText) {
    return failure("VALIDATION_ERROR", "日本語実況を入力してください。");
  }

  let openai: OpenAI;

  try {
    openai = getOpenAIClient();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "OpenAI client initialization failed";
    return failure("CONFIG_ERROR", message, error);
  }

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "commentary_translations",
          strict: true,
          schema: translationResponseJsonSchema,
        },
      },
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: trimmedText,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim();

    if (!content) {
      return failure(
        "PARSE_ERROR",
        "OpenAI returned an empty response.",
        completion
      );
    }

    const parsed = parseTranslationResponse(content);

    if (!parsed) {
      return failure(
        "PARSE_ERROR",
        "Failed to parse the commentary translations from OpenAI.",
        content
      );
    }

    return {
      success: true,
      data: { translations: parsed.translations },
    };
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      return failure(
        "OPENAI_API_ERROR",
        `OpenAI API error (${error.status ?? "unknown"}): ${error.message}`,
        {
          status: error.status,
          code: error.code,
          type: error.type,
        }
      );
    }

    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return failure("UNKNOWN_ERROR", message, error);
  }
}
