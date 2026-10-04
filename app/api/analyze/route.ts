import { NextResponse } from "next/server";
import { analyze } from "@/lib/openai";
import { parseUpload } from "@/lib/uploads";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const jdText = String(form.get("jdText") || "").trim();
    const resumeText = String(form.get("resumeText") || "").trim();
    const jdFile = form.get("jdFile");
    const resumeFile = form.get("resumeFile");
    const [jdUpload, resumeUpload] = await Promise.all([
      jdFile instanceof File && jdFile.size ? parseUpload(jdFile) : "",
      resumeFile instanceof File && resumeFile.size ? parseUpload(resumeFile) : "",
    ]);
    const jd = [jdText, jdUpload].filter(Boolean).join("\n\n").trim();
    const resume = [resumeText, resumeUpload].filter(Boolean).join("\n\n").trim();
    if (!jd || !resume) return NextResponse.json({ error: "Please provide both a job description and a resume." }, { status: 400 });
    const result = await analyze(jd, resume);
    return NextResponse.json({ analysis: result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Analysis failed. Check the uploaded files and server logs." }, { status: 500 });
  }
}
