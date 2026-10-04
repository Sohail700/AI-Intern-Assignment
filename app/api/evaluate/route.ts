import { NextResponse } from "next/server";
import { evaluate } from "@/lib/openai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { analysis, answers } = await req.json();
    const report = await evaluate(analysis, answers || []);
    return NextResponse.json({ report });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not generate the interview report." }, { status: 500 });
  }
}
