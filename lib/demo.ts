import type {
  Analysis,
  AnswerEvaluation,
  AnswerRecord,
  InterviewLevel,
  InterviewQuestion,
  PerformanceReport,
  RoleAnalysis,
  CandidateAnalysis,
} from "@/types";

const TECH = ["Python", "JavaScript", "TypeScript", "Machine Learning", "LLMs", "RAG", "APIs", "SQL", "Cloud", "Docker", "Git", "React", "Next.js", "FastAPI", "Vector databases", "Evaluation"];
const BEHAVIOURAL = ["Problem Solving", "Communication", "Learning Ability", "Decision Making", "Ownership", "Collaboration", "Adaptability"];

function unique(items: string[]) {
  return [...new Set(items.filter(Boolean).map((x) => x.trim()).filter((x) => x.length > 1))];
}

function extractSkills(text: string) {
  const lower = text.toLowerCase();
  return TECH.filter((skill) => lower.includes(skill.toLowerCase()));
}

function roleFromJD(jd: string): RoleAnalysis {
  const titleMatch = jd.match(/(?:job title|role|position)\s*[:\-]\s*([^\n]+)/i);
  const roleTitle = titleMatch?.[1]?.trim() || "AI / Software Engineering Role";
  const skills = extractSkills(jd);
  const responsibilities = [
    "Build and maintain software or AI features aligned to the role",
    "Collaborate with stakeholders and communicate technical decisions",
    "Debug, evaluate, and improve solutions using evidence",
  ];
  const experience = jd.match(/(?:experience|years?)\s*[:\-]?\s*([^\n]+)/i)?.[1]?.trim();
  const keywords = unique((jd.match(/\b[A-Za-z][A-Za-z+.#/-]{2,}\b/g) || []).filter((x) => x.length > 3)).slice(0, 24);
  const concepts = unique([
    ...skills.map((s) => `${s} fundamentals`),
    jd.toLowerCase().includes("rag") ? "retrieval pipeline" : "system architecture",
    jd.toLowerCase().includes("api") ? "API integration" : "production integration",
    "measurement and trade-offs",
  ]).slice(0, 12);
  return {
    roleTitle,
    keyResponsibilities: responsibilities,
    requiredSkills: skills.slice(0, 8).length ? skills.slice(0, 8) : ["Problem solving", "Communication", "Software fundamentals"],
    preferredSkills: skills.slice(8, 14),
    technicalCompetencies: skills.length ? skills : ["Software fundamentals", "Debugging", "APIs"],
    behaviouralCompetencies: BEHAVIOURAL.slice(0, 5),
    experienceExpectations: experience ? [experience] : ["Demonstrate relevant projects or hands-on experience"],
    importantKeywords: keywords,
    importantConcepts: concepts,
    keyQualifications: ["Evidence of relevant skills", "Clear explanation of projects and decisions", "Ability to learn and reason through unfamiliar problems"],
  };
}

function candidateFromResume(jd: string, resume: string): CandidateAnalysis {
  const jdSkills = extractSkills(jd);
  const resumeSkills = extractSkills(resume);
  const match = jdSkills.filter((s) => resumeSkills.includes(s));
  const missing = jdSkills.filter((s) => !resumeSkills.includes(s));
  const projectLines = resume.split(/\n+/).filter((l) => /project|built|developed|implemented|created|deployed/i.test(l));
  const achievementLines = resume.split(/\n+/).filter((l) => /\b\d+%|increased|reduced|improved|won|award|rank/i.test(l));
  const experienceLines = resume.split(/\n+/).filter((l) => /intern|engineer|developer|experience|worked|contributor/i.test(l));
  const fit = Math.max(35, Math.min(96, Math.round(50 + match.length * 8 - missing.length * 2)));
  return {
    candidateName: (resume.match(/^([A-Z][A-Za-z .'-]{2,40})$/m)?.[1] || "Candidate").trim(),
    keySkills: unique(resumeSkills).slice(0, 12),
    relevantExperience: (experienceLines.length ? experienceLines : ["Relevant hands-on experience should be clarified during the interview."]).slice(0, 6),
    relevantProjects: (projectLines.length ? projectLines : ["No clearly labelled projects detected; be ready to explain your strongest work sample."]).slice(0, 6),
    relevantAchievements: (achievementLines.length ? achievementLines : ["No quantified achievements detected in the demo parser."]).slice(0, 6),
    strengthsAgainstJD: match.length ? match.map((s) => `${s}: visible evidence in resume`) : ["Transferable experience and learning ability"],
    missingSkills: missing.length ? missing : ["System design", "Production trade-offs"],
    weakAreas: missing.slice(0, 4).length ? missing.slice(0, 4) : ["Need more quantified evidence of impact"],
    claimsToProbe: achievementLines.length ? achievementLines.slice(0, 4) : ["Any claims of impact, scale, or performance improvement"],
    preparationAreas: unique([...missing, "Explain project decisions, metrics, trade-offs, and deployment considerations"]).slice(0, 7),
    jobFit: fit,
    jobFitLabel: fit >= 75 ? "Strong Match" : fit >= 58 ? "Partial Match" : "Needs Preparation",
  };
}

export function demoAnalysis(jd: string, resume: string): Analysis {
  return { role: roleFromJD(jd), candidate: candidateFromResume(jd, resume), mode: "demo" };
}

function wordCount(s: string) {
  return s.trim() ? s.trim().split(/\s+/).length : 0;
}

function detectTech(answer: string, analysis: Analysis) {
  return analysis.role.technicalCompetencies.find((item) => answer.toLowerCase().includes(item.toLowerCase())) || analysis.candidate.keySkills[0] || "the approach";
}

export function demoAnswerEvaluation(question: string, answer: string, analysis: Analysis, level: InterviewLevel): AnswerEvaluation {
  const words = wordCount(answer);
  const hasEvidence = /\b\d+(?:\.\d+)?%?|\b(?:ms|seconds?|minutes?|users?|requests?|records?)\b/i.test(answer);
  const hasReasoning = /\b(because|therefore|trade[- ]?off|alternative|reason|measure|metric|constraint|assumption)\b/i.test(answer);
  const hasExample = /\b(for example|for instance|project|internship|when i|we built|i implemented|i worked)\b/i.test(answer);
  const score = Math.min(95, Math.round(42 + Math.min(words, 90) * 0.35 + (hasExample ? 8 : 0) + (hasReasoning ? 10 : 0) + (hasEvidence ? 8 : 0) + (level === 3 && hasReasoning ? 7 : 0)));
  const detected = detectTech(answer, analysis);
  return {
    score,
    assessment:
      words >= 45
        ? `The response gave enough detail to evaluate. It referenced ${detected}, but stronger evidence and explicit decision criteria would make the answer more convincing.`
        : "The response was brief. A stronger interview answer should add context, your specific action, evidence, and the result.",
    strengths: [
      words >= 25 ? "Provided a substantive response" : "Answered the prompt directly",
      ...(hasExample ? ["Used a concrete experience or project"] : []),
      ...(hasReasoning ? ["Explained at least one reasoning or trade-off"] : []),
    ].slice(0, 3),
    improvement: [
      ...(words < 45 ? ["Add a concrete example and measurable outcome"] : ["Make assumptions and decision criteria explicit"]),
      ...(hasEvidence ? [] : ["Quantify impact, scale, quality, or evaluation where possible"]),
      ...(level === 3 ? ["Defend the claim with metrics, constraints, or a counterexample"] : []),
    ].slice(0, 3),
    followUpIntent: level === 3 ? `Probe the reasoning behind ${detected}, then test an edge case or alternative.` : `Ask for more evidence about ${detected} and the candidate's individual contribution.`,
  };
}

function makeQuestion(level: InterviewLevel, text: string, focus: string, history: AnswerRecord[]): InterviewQuestion {
  return {
    id: `${level}-${history.length + 1}-${Date.now()}`,
    level,
    text,
    focus,
    difficulty: Math.min(5, level + Math.floor(history.length / 3)),
  };
}

export function demoQuestion(analysis: Analysis, level: InterviewLevel, history: AnswerRecord[]): InterviewQuestion {
  const last = history[history.length - 1];
  const lastEval = last?.evaluation;
  const lastAnswer = last?.answer || "";
  const lastTopic = detectTech(lastAnswer, analysis);
  const used = new Set(history.map((h) => h.question));

  if (last && lastEval && lastEval.score < 58) {
    const clarification =
      level === 1
        ? `Let's make that concrete. In your previous answer, what was your exact contribution to ${lastTopic}, and what result did you personally achieve?`
        : level === 2
          ? `Your last answer was a little high-level. Pick one technical decision involving ${lastTopic}. What constraint drove the decision, and what would you change in a second iteration?`
          : `Your previous answer left a reasoning gap. Walk me through the evidence you would collect first to validate your approach to ${lastTopic}, and explain why.`;
    if (!used.has(clarification)) return makeQuestion(level, clarification, "Adaptive clarification", history);
  }

  if (last && lastEval && lastEval.score >= 82) {
    const escalation =
      level === 1
        ? `You handled the previous question well. Now connect that experience to a stakeholder decision: how would you explain a technical trade-off in ${analysis.role.roleTitle} to a non-technical teammate?`
        : level === 2
          ? `You were specific about ${lastTopic}. Now assume the workload grows 10x. Which assumption breaks first, and how would you redesign the solution without over-engineering it?`
          : `You justified your approach to ${lastTopic}. Now challenge it yourself: what is the strongest alternative, what would make you choose it, and what signal would prove your original choice was wrong?`;
    if (!used.has(escalation)) return makeQuestion(level, escalation, "Adaptive escalation", history);
  }

  if (level === 1) {
    const q = history.length === 0
      ? `I noticed your background includes ${analysis.candidate.keySkills.slice(0, 2).join(" and ") || "relevant technical work"}. Which project best demonstrates your fit for ${analysis.role.roleTitle}, and what exactly did you own?`
      : history.length === 1
        ? `What specifically attracts you to this ${analysis.role.roleTitle} role, and which responsibility in the job description would you be most excited to work on?`
        : `Which requirement in this role would take you the most preparation to perform confidently, and what is your plan to close that gap?`;
    return makeQuestion(level, q, history.length === 0 ? "Resume" : history.length === 1 ? "Motivation" : "Role Fit", history);
  }

  if (level === 2) {
    const q = history.length <= 3
      ? `Walk me through a technical decision from one of your projects involving ${analysis.role.technicalCompetencies[0] || "your main technical stack"}. What alternatives did you consider, and why did you choose your approach?`
      : history.length === 4
        ? `Suppose your solution works on a small dataset but degrades at 10x scale. How would you diagnose the bottleneck before changing the architecture?`
        : `Tell me about a time you changed your approach after new evidence showed your first decision was wrong. What changed your mind, and what did you learn?`;
    return makeQuestion(level, q, history.length <= 3 ? "Technical decision" : history.length === 4 ? "Problem Solving" : "Behavioural", history);
  }

  const q = history.length === 6
    ? `You mentioned ${analysis.candidate.claimsToProbe[0] || "an impact claim"}. What baseline did you compare against, what metric did you use, and how did you rule out other causes for the improvement?`
    : history.length === 7
      ? `Imagine the system is producing confident but incorrect answers. How would you distinguish a retrieval problem from a generation or evaluation problem?`
      : `If your chosen metric looked strong but users reported poor results, what would you investigate first, and what evidence would change your mind?`;
  return makeQuestion(level, q, history.length === 6 ? "Claim verification" : history.length === 7 ? "Scenario" : "Counter-question", history);
}

export function demoEvaluation(analysis: Analysis, answers: AnswerRecord[]): PerformanceReport {
  if (!answers.length) {
    return {
      overallScore: 0,
      competencyScores: { roleFit: 0, technicalKnowledge: 0, problemSolving: 0, communication: 0, confidence: 0, depthOfUnderstanding: 0, behaviouralFit: 0 },
      strengths: [],
      weaknesses: [],
      preparationGaps: [],
      readiness: "Not Ready",
      questionFeedback: [],
      mode: "demo",
    };
  }

  const avgAnswer = Math.round(answers.reduce((sum, item) => sum + (item.evaluation?.score || 55), 0) / answers.length);
  const technical = Math.min(95, Math.round(avgAnswer * 0.72 + 16 + answers.filter((a) => a.level >= 2 && (a.evaluation?.score || 0) >= 70).length * 2));
  const communication = Math.min(95, Math.round(avgAnswer * 0.75 + 15 + answers.filter((a) => wordCount(a.answer) >= 45).length * 2));
  const roleFit = analysis.candidate.jobFit;
  const problemSolving = Math.min(95, Math.round(avgAnswer * 0.76 + 13 + answers.filter((a) => /why|how|diagnose|trade-?off|alternative/i.test(a.question)).filter((a) => (a.evaluation?.score || 0) >= 70).length * 2));
  const confidence = Math.min(95, Math.round(avgAnswer * 0.7 + 18 + answers.filter((a) => a.durationSeconds >= 15).length * 2 - Math.min(6, answers.reduce((n, a) => n + a.fillerWords, 0))));
  const depth = Math.min(95, Math.round(avgAnswer * 0.72 + 13 + answers.filter((a) => a.level === 3 && (a.evaluation?.score || 0) >= 70).length * 4));
  const behavioural = Math.min(95, Math.round(avgAnswer * 0.74 + 14 + answers.filter((a) => /time|learn|decision|changed/i.test(a.question)).length * 2));
  const overall = Math.round((roleFit + technical + problemSolving + communication + confidence + depth + behavioural) / 7);
  const readiness = overall >= 82 ? "Strong Candidate" : overall >= 70 ? "Interview Ready" : overall >= 55 ? "Needs Preparation" : "Not Ready";

  const feedback = answers.map((a) => ({
    question: a.question,
    candidateAnswer: a.answer,
    assessment: a.evaluation?.assessment || "Answer quality could not be scored in the local evaluator.",
    whatWasGood: a.evaluation?.strengths || [],
    whatCouldBeBetter: a.evaluation?.improvement || [],
    idealDirection: a.level === 1
      ? "Use a concise STAR-style structure and connect your experience directly to the role requirement."
      : a.level === 2
        ? "State the constraint, options, chosen approach, technical reasoning, and measurable result."
        : "State the claim, evidence, assumptions, counterexample, and what would change your conclusion.",
    score: a.evaluation?.score || 55,
  }));

  const gaps = analysis.candidate.preparationAreas.slice(0, 3).map((topic, i) => ({
    priority: i + 1,
    topic,
    review: ["Define the concept clearly", "Practice one role-specific example", "Be ready to explain trade-offs and evaluation"],
  }));

  return {
    overallScore: overall,
    competencyScores: { roleFit, technicalKnowledge: technical, problemSolving, communication, confidence, depthOfUnderstanding: depth, behaviouralFit: behavioural },
    strengths: [
      avgAnswer >= 70 ? "Answers contained enough evidence to support follow-up questions" : "Responded to the interview prompts without avoiding them",
      answers.some((a) => (a.evaluation?.strengths || []).some((x) => /example|experience/i.test(x))) ? "Used concrete project or experience examples" : "Showed willingness to explain personal contributions",
      roleFit >= 70 ? "Good alignment with core role requirements" : "Shows transferable experience that can be strengthened with preparation",
    ],
    weaknesses: [
      "Quantify impact and evaluation more consistently",
      depth < 70 ? "Deep technical reasoning needs more practice" : "Make trade-offs and edge cases explicit",
      communication < 70 ? "Use a more structured response format" : "Tighten longer answers around evidence",
    ],
    preparationGaps: gaps,
    readiness,
    questionFeedback: feedback,
    mode: "demo",
  };
}
