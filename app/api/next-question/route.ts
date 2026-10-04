import { NextResponse } from "next/server";
import { nextQuestion } from "@/lib/openai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { analysis, level, history } = await req.json();
    const q = await nextQuestion(analysis, level, history || []);
    return NextResponse.json({ question: q });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not generate the next question." }, { status: 500 });
  }
}
