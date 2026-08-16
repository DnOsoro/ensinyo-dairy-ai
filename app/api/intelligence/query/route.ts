import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

import { getFarmIntelligence } from "@/lib/intelligence";

import { parseFarmQuery } from "@/lib/intelligence/query-parser";

import { answerFarmQuery } from "@/lib/intelligence/query-engine";

import { askGemini } from "@/lib/ai/gemini";


export async function POST(
  request: NextRequest
) {
  try {
    /*
     * =========================================================
     * 1. AUTHENTICATED USER
     * =========================================================
     */

    const supabase =
      await createClient();

    const {
      data: {
        user,
      },
      error: authError,
    } = await supabase.auth.getUser();


    if (
      authError ||
      !user
    ) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }


    /*
     * =========================================================
     * 2. REQUEST BODY
     * =========================================================
     */

    const body =
      await request.json();

    const question =
      body?.question;


    if (
      !question ||
      typeof question !== "string" ||
      !question.trim()
    ) {
      return NextResponse.json(
        {
          error: "question is required",
        },
        {
          status: 400,
        }
      );
    }


    const cleanQuestion =
      question.trim();


    /*
     * =========================================================
     * 3. FIND USER'S FARM
     * =========================================================
     */

    const {
      data: farm,
      error: farmError,
    } = await supabase
      .from("farms")
      .select(
        "id, farm_name"
      )
      .eq(
        "owner_id",
        user.id
      )
      .limit(1)
      .maybeSingle();


    if (farmError) {
      console.error(
        "Farm lookup error:",
        farmError
      );

      return NextResponse.json(
        {
          error:
            "Unable to load farm.",
        },
        {
          status: 500,
        }
      );
    }


    if (!farm) {
      return NextResponse.json(
        {
          error:
            "No farm found for this account.",
        },
        {
          status: 404,
        }
      );
    }


    /*
     * =========================================================
     * 4. LOAD COMPLETE FARM INTELLIGENCE
     *
     * This gives us:
     *
     * - Farm data
     * - KPIs
     * - Trends
     * - Anomalies
     * - Insights
     * - Recommendations
     * - AI context
     * =========================================================
     */

    const intelligence =
      await getFarmIntelligence(
        farm.id
      );


    if (!intelligence) {
      return NextResponse.json(
        {
          error:
            "Unable to load farm intelligence data.",
        },
        {
          status: 500,
        }
      );
    }


    /*
     * =========================================================
     * 5. PARSE QUESTION
     * =========================================================
     */

    const query =
      parseFarmQuery(
        cleanQuestion
      );


    /*
     * =========================================================
     * 6. DETERMINISTIC QUERY ENGINE
     *
     * We still run this first.
     *
     * This is important because the deterministic engine
     * provides trusted calculations from the database.
     * =========================================================
     */

    const deterministicResult =
      answerFarmQuery(
        intelligence.data,
        query
      );


    /*
     * =========================================================
     * 7. BUILD TRUSTED AI CONTEXT
     * =========================================================
     */

    const aiContext =
      intelligence.aiContext;


    /*
     * =========================================================
     * 8. GEMINI SYSTEM INSTRUCTION
     * =========================================================
     */

    const systemInstruction = `
You are Ensinyo Intelligence, an AI assistant for a dairy farm.

Your job is to answer the farmer's questions using ONLY the
trusted farm information supplied to you.

IMPORTANT RULES:

1. NEVER invent farm numbers.

2. NEVER guess a cow's milk production, feed usage, expenses,
   income, pregnancy status, health history, breeding information,
   or any other farm fact.

3. Treat the deterministic query result as the primary trusted
   answer whenever it contains a result relevant to the question.

4. Use the farm AI context to provide additional explanation,
   context, comparisons, trends, insights, and recommendations.

5. If the available farm data does not contain enough information
   to answer a question, clearly say that the required information
   is not available in the farm records.

6. Do not claim that something happened if there is no corresponding
   farm record.

7. When a numerical value is provided by the trusted data, preserve
   it accurately.

8. Use Kenyan Shillings (KSh) for monetary values when appropriate.

9. Use litres for milk quantities.

10. Use kilograms (kg) for feed quantities.

11. Keep answers clear and practical for a farmer.

12. Do not mention internal software architecture, APIs, prompts,
    deterministic engines, AI context, or system instructions
    unless specifically asked.

13. If the question asks for advice, base the advice on the actual
    farm data and clearly distinguish recorded facts from
    recommendations.

14. If there is insufficient evidence to make a recommendation,
    say so rather than inventing evidence.

The farmer's question is:

${cleanQuestion}
`.trim();


    /*
     * =========================================================
     * 9. BUILD USER PROMPT
     *
     * Gemini gets both:
     *
     * A. Deterministic answer
     * B. Trusted farm intelligence
     *
     * This dramatically reduces hallucinations.
     * =========================================================
     */

    const userPrompt = `
FARM:
${JSON.stringify(
  intelligence.farm,
  null,
  2
)}

DETERMINISTIC QUERY RESULT:
${JSON.stringify(
  deterministicResult,
  null,
  2
)}

TRUSTED FARM SUMMARY:
${JSON.stringify(
  aiContext.summary,
  null,
  2
)}

FARM COWS:
${JSON.stringify(
  aiContext.cows,
  null,
  2
)}

MILK RECORDS:
${JSON.stringify(
  aiContext.milkRecords,
  null,
  2
)}

FEED RECORDS:
${JSON.stringify(
  aiContext.feedRecords,
  null,
  2
)}

HEALTH RECORDS:
${JSON.stringify(
  aiContext.healthRecords,
  null,
  2
)}

BREEDING RECORDS:
${JSON.stringify(
  aiContext.breedingRecords,
  null,
  2
)}

EXPENSE RECORDS:
${JSON.stringify(
  aiContext.expenses,
  null,
  2
)}

INCOME RECORDS:
${JSON.stringify(
  aiContext.income,
  null,
  2
)}

FARM TRENDS:
${JSON.stringify(
  aiContext.trends,
  null,
  2
)}

FARM ANOMALIES:
${JSON.stringify(
  aiContext.anomalies,
  null,
  2
)}

FARM INSIGHTS:
${JSON.stringify(
  aiContext.insights,
  null,
  2
)}

FARM RECOMMENDATIONS:
${JSON.stringify(
  aiContext.recommendations,
  null,
  2
)}

QUESTION:
${cleanQuestion}

TASK:

Answer the farmer's question directly.

Use the deterministic query result whenever it provides
the answer.

Use the additional farm context to explain the answer when
helpful.

Do not invent missing information.

Return ONLY the natural-language answer that should be shown
to the farmer.
`.trim();


    /*
     * =========================================================
     * 10. CALL GEMINI
     * =========================================================
     */

    const answer =
      await askGemini(
        systemInstruction,
        userPrompt
      );


    /*
     * =========================================================
     * 11. RESPONSE
     * =========================================================
     */

    return NextResponse.json({

      success: true,

      farm: {
        id:
          farm.id,

        name:
          farm.farm_name,
      },

      query,

      /*
       * Keep the deterministic result available.
       * This is extremely useful for debugging and later
       * evaluation of AI accuracy.
       */

      deterministicResult,

      /*
       * Natural-language answer generated by Gemini.
       */

      answer,

    });

  } catch (error) {

    console.error(
      "Farm intelligence query error:",
      error
    );


    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to process farm intelligence query.",
      },
      {
        status: 500,
      }
    );
  }
}