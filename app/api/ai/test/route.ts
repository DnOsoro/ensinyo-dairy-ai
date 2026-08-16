import { NextResponse } from "next/server";
import { askGemini } from "@/lib/ai/gemini";

export async function GET() {
  try {
    const answer = await askGemini(
      `
You are a helpful AI assistant for Ensinyo Dairy Farm.

For this test, do not use farm data.
Simply answer the user's question clearly and briefly.
      `.trim(),

      "Say hello to Ensinyo Dairy Farm and confirm that you are working."
    );

    return NextResponse.json({
      success: true,
      answer,
    });
  } catch (error) {
    console.error("Gemini test error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Gemini error",
      },
      {
        status: 500,
      }
    );
  }
}