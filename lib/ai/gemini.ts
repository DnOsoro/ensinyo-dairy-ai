const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/interactions";

type GeminiInteractionResponse = {
  id?: string;

  outputs?: Array<{
    type?: string;
    text?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;

  steps?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;

  error?: {
    message?: string;
  };
};

export async function askGemini(
  systemInstruction: string,
  userPrompt: string
): Promise<string> {
  const apiKey =
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured."
    );
  }

  const input = `
${systemInstruction}

USER QUESTION:
${userPrompt}
`.trim();

  let response: Response;

  /*
   * =========================================================
   * GEMINI API REQUEST
   * =========================================================
   */

  try {
    response = await fetch(
      GEMINI_API_URL,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },

        body: JSON.stringify({
          model: "gemini-3.5-flash-lite",
          input,
        }),
      }
    );
  } catch (error) {
    /*
     * IMPORTANT:
     * Do not hide the underlying fetch error.
     * This will tell us whether the problem is:
     *
     * - TLS / SSL
     * - DNS
     * - connection reset
     * - timeout
     * - endpoint
     * - Node networking
     */

    console.error(
      "===== GEMINI FETCH FAILED ====="
    );

    console.error(
      "Error:",
      error
    );

    console.error(
      "Message:",
      error instanceof Error
        ? error.message
        : String(error)
    );

    if (
      error &&
      typeof error === "object" &&
      "cause" in error
    ) {
      console.error(
        "Cause:",
        (error as { cause?: unknown }).cause
      );
    }

    console.error(
      "================================"
    );

    throw new Error(
      error instanceof Error
        ? `Gemini network request failed: ${error.message}`
        : "Gemini network request failed."
    );
  }

  /*
   * =========================================================
   * READ RESPONSE
   * =========================================================
   */

  const result =
    (await response.json()) as GeminiInteractionResponse;


  /*
   * =========================================================
   * API ERROR
   * =========================================================
   */

  if (!response.ok) {
    console.error(
      "===== GEMINI API ERROR ====="
    );

    console.error(
      "HTTP status:",
      response.status
    );

    console.error(
      "Response:",
      result
    );

    console.error(
      "============================"
    );

    throw new Error(
      result.error?.message ??
        `Gemini API request failed with status ${response.status}.`
    );
  }


  /*
   * =========================================================
   * INTERACTIONS API RESPONSE
   * =========================================================
   */

  const stepText =
    result.steps
      ?.flatMap(
        (step) =>
          step.content ?? []
      )
      .filter(
        (item) =>
          item.type === "text"
      )
      .map(
        (item) =>
          item.text ?? ""
      )
      .join("")
      .trim();

  if (stepText) {
    return stepText;
  }


  /*
   * =========================================================
   * OUTPUT-STYLE RESPONSE
   * =========================================================
   */

  const outputText =
    result.outputs
      ?.map(
        (output) => {
          if (output.text) {
            return output.text;
          }

          return (
            output.content
              ?.map(
                (item) =>
                  item.text ?? ""
              )
              .join("") ?? ""
          );
        }
      )
      .join("")
      .trim();

  if (outputText) {
    return outputText;
  }


  /*
   * =========================================================
   * EMPTY RESPONSE
   * =========================================================
   */

  console.error(
    "===== GEMINI EMPTY RESPONSE ====="
  );

  console.error(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  console.error(
    "================================="
  );

  throw new Error(
    "Gemini returned an empty response."
  );
}