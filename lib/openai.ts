import OpenAI from "openai";
import type { Analysis, AnswerEvaluation, AnswerRecord, InterviewLevel, InterviewQuestion, PerformanceReport } from "@/types";
import { demoAnalysis, demoAnswerEvaluation, demoQuestion, demoEvaluation } from "@/lib/demo";

function client() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

async function json<T>(system: string, user: string): Promise<T> {
  const c = client();
  if (!c) throw new Error("NO_API_KEY");
  const response = await c.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    temperature: 0.35,
    response_format: { type: "json_object" },
    messages: [{ role: "system", content: system }, { role: "user", content: user }],
  });
  return JSON.parse(response.choices[0]?.message?.content || "{}");
}

export async function analyze(jd: string, resume: string): Promise<Analysis> {
  if (!client()) return demoAnalysis(jd, resume);
  const result = await json<Omit<Analysis, "mode">>(
    "You are an expert recruiting analyst. Extract only evidence supported by the JD and resume. Return valid JSON with keys role and candidate. Keep lists concise and actionable. Job fit is a transparent 0-100 preparation estimate based on overlap between explicit requirements and explicit evidence, not a hiring recommendation.",
    JSON.stringify({ jd, resume, requiredRoleShape: ["roleTitle", "keyResponsibilities", "requiredSkills", "preferredSkills", "technicalCompetencies", "behaviouralCompetencies", "experienceExpectations", "importantKeywords", "importantConcepts", "keyQualifications"], candidateShape: ["candidateName", "keySkills", "relevantExperience", "relevantProjects", "relevantAchievements", "strengthsAgainstJD", "missingSkills", "weakAreas", "claimsToProbe", "preparationAreas", "jobFit", "jobFitLabel"] }),
  );
  return { ...result, mode: "ai" };
}

export async function evaluateAnswer(analysis: Analysis, question: InterviewQuestion, answer: string, level: InterviewLevel): Promise<AnswerEvaluation> {
  if (!client()) return demoAnswerEvaluation(question.text, answer, analysis, level);
  return json<AnswerEvaluation>(
    "You are an adaptive interview evaluator. Score the candidate's answer only from the supplied role, candidate evidence, question, and answer. Return one JSON object with score 0-100, assessment, strengths array, improvement array, and followUpIntent. Be specific and actionable. Do not infer facial emotion.",
    JSON.stringify({ analysis, question, answer, level }),
  );
}

export async function nextQuestion(analysis: Analysis, level: InterviewLevel, history: AnswerRecord[]): Promise<InterviewQuestion> {
  if (!client()) return demoQuestion(analysis, level, history);
  return json<InterviewQuestion>(
    "You are an adaptive interview interviewer. Ask exactly one personalized interview question. Use the role analysis, candidate evidence, previous answers, and per-answer evaluations. Never repeat a question. Level 1 focuses on screening/resume/motivation/role fit. Level 2 increases technical and behavioural challenge. Level 3 challenges vague claims, tests technical depth, reasoning, scenarios, and counter-questions. If the last answer is weak, ask a targeted clarification; if it is strong, increase difficulty. Return JSON only with id, level, text, focus, difficulty.",
    JSON.stringify({ analysis, level, history: history.slice(-6) }),
  );
}

export async function evaluate(analysis: Analysis, answers: AnswerRecord[]): Promise<PerformanceReport> {
  if (!client()) return demoEvaluation(analysis, answers);
  return json<PerformanceReport>(
    "You are an interview coach. Evaluate only the supplied interview evidence. Give actionable feedback, concrete preparation gaps, and a readiness label. Competency scores must be 0-100. Include questionFeedback for every important question with question, candidateAnswer, assessment, whatWasGood, whatCouldBeBetter, idealDirection, and score. Do not use facial/emotion inference. Return JSON with overallScore, competencyScores, strengths, weaknesses, preparationGaps (priority,topic,review array), readiness, questionFeedback, mode='ai'.",
    JSON.stringify({ analysis, answers }),
  );
}
