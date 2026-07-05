import OpenAI from "openai";

const MODEL = "gpt-4o-mini";
const testInput = "素晴らしいスルーパス！";

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error("[test-openai] CONFIG_ERROR: OPENAI_API_KEY is not configured");
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey });

  console.log("Testing OpenAI connection...");
  console.log(`Model: ${MODEL}`);
  console.log(`Input: ${testInput}`);

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "Translate the following Japanese soccer commentary into English. Return only the English translation.",
        },
        {
          role: "user",
          content: testInput,
        },
      ],
    });

    const englishText = completion.choices[0]?.message?.content?.trim();

    if (!englishText) {
      console.error("[test-openai] PARSE_ERROR: OpenAI returned an empty response", completion);
      process.exit(1);
    }

    console.log("Connection OK");
    console.log(`Output: ${englishText}`);
    process.exit(0);
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      console.error(
        `[test-openai] OPENAI_API_ERROR (${error.status ?? "unknown"}): ${error.message}`,
        {
          status: error.status,
          code: error.code,
          type: error.type,
        }
      );
      process.exit(1);
    }

    console.error(
      "[test-openai] UNKNOWN_ERROR:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

main();
