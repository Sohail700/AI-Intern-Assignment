import { NextResponse } from "next/server";
import { evaluateAnswer } from "@/lib/openai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { analysis, question, answer, level } = await req.json();
    if (!analysis || !question || !String(answer || "").trim()) {
      return NextResponse.json({ error: "Missing interview answer data." }, { status: 400 });
    }
    const evaluation = await evaluateAnswer(analysis, question, String(answer).trim(), level);
    return NextResponse.json({ evaluation });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not evaluate the answer." }, { status: 500 });
  }
}
