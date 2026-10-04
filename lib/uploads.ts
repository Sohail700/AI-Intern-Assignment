import pdf from "pdf-parse";
import mammoth from "mammoth";

export async function parseUpload(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const data = await pdf(buffer);
    return data.text;
  }
  if (name.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const data = await mammoth.extractRawText({ buffer });
    return data.value;
  }
  if (name.endsWith(".txt") || name.endsWith(".md")) return buffer.toString("utf8");
  throw new Error("Supported files: PDF, DOCX, TXT, or MD.");
}
