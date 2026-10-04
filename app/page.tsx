"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { Analysis, AnswerEvaluation, AnswerRecord, InterviewLevel, InterviewQuestion, PerformanceReport } from "@/types";
import { demoAnalysis, demoAnswerEvaluation, demoQuestion, demoEvaluation } from "@/lib/demo";

type SpeechRecognitionType = any;

const DEMO_JD = `Job Title: AI Product Engineer Intern\n\nWe are building AI-powered products for students and job candidates.\n\nRequired: Python, machine learning fundamentals, LLMs, RAG, APIs, software development, problem solving, communication.\nPreferred: React, Next.js, FastAPI, cloud, Docker, SQL.\n\nResponsibilities:\n- Build and iterate on AI product features.\n- Integrate APIs and data pipelines.\n- Evaluate model outputs and debug quality issues.\n- Work with the product team and explain technical decisions.\n\nExperience: hands-on projects, internships, or equivalent practical work.`;
const DEMO_RESUME = `Alex Candidate\nAI / Software Engineering Student\n\nSkills: Python, Machine Learning, LLMs, RAG, APIs, React, Git, SQL, TypeScript.\n\nProjects\n- Built a RAG-based chatbot using embeddings and a vector database; evaluated retrieval quality.\n- Developed a React + FastAPI application for interview practice.\n\nExperience\n- Software Engineering Intern: implemented API integrations and debugging workflows.\n\nAchievements\n- Improved response relevance by 18% through retrieval changes and evaluation.`;

function say(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.98;
  window.speechSynthesis.speak(utterance);
}

function AppHeader({ mode, onReset }: { mode?: "ai" | "demo"; onReset?: () => void }) {
  return <header className="topbar"><div className="brand">Interview Accelerator <span>/ AI Coach</span></div><div style={{ display: "flex", alignItems: "center", gap: 14 }}><span className="topmeta">{mode === "ai" ? "AI mode" : mode === "demo" ? "Demo mode" : "Voice-first prototype"}</span>{onReset && <button className="btn ghost" onClick={onReset}>Start over</button>}</div></header>;
}

function TagList({ items }: { items: string[] }) { return <div className="pillrow">{items.map((x, i) => <span className="pill" key={`${x}-${i}`}>{x}</span>)}</div>; }

export default function Home() {
  const [jd, setJd] = useState("");
  const [resume, setResume] = useState("");
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [level, setLevel] = useState<InterviewLevel>(1);
  const [question, setQuestion] = useState<InterviewQuestion | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [lastEvaluation, setLastEvaluation] = useState<AnswerEvaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [videoOn, setVideoOn] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionType>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const screen = useMemo(() => report ? "report" : question ? "interview" : analysis ? "analysis" : "input", [report, question, analysis]);
  const progress = Math.min(100, Math.round((answers.length / 9) * 100));

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.();
      mediaStreamRef.current?.getTracks().forEach((track: MediaStreamTrack) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && mediaStreamRef.current) videoRef.current.srcObject = mediaStreamRef.current;
  }, [videoOn]);

  async function readJsonResponse(res: Response, fallback: string) {
    const contentType = res.headers.get("content-type") || "";
    const raw = await res.text();
    if (!contentType.includes("application/json")) {
      throw new Error(`${fallback} The server returned an HTML/text response (${res.status}). Make sure you started this project from its root folder with \`npm run dev\`.`);
    }
    try {
      const data = JSON.parse(raw);
      if (!res.ok) throw new Error(data.error || fallback);
      return data;
    } catch (e: any) {
      if (e?.message && e.message !== "Unexpected end of JSON input") throw e;
      throw new Error(fallback);
    }
  }

  async function analyzeDocuments() {
    setError(""); setLoading(true);
    try {
      if (demoMode) {
        const result = demoAnalysis(jd, resume);
        setAnalysis(result); setReport(null); setQuestion(null); setAnswers([]); setLastEvaluation(null);
        return;
      }
      const fd = new FormData();
      if (jd.trim()) fd.append("jdText", jd);
      if (resume.trim()) fd.append("resumeText", resume);
      if (jdFile) fd.append("jdFile", jdFile);
      if (resumeFile) fd.append("resumeFile", resumeFile);
      const res = await fetch("/api/analyze", { method: "POST", body: fd });
      const data = await readJsonResponse(res, "Analysis failed.");
      setAnalysis(data.analysis); setReport(null); setQuestion(null); setAnswers([]); setLastEvaluation(null);
    } catch (e: any) { setError(e.message || "Analysis failed"); } finally { setLoading(false); }
  }

  async function getQuestion(nextLevel = level, history = answers) {
    if (!analysis) return;
    setError(""); setLoading(true);
    try {
      let nextQ: InterviewQuestion;
      if (demoMode || analysis.mode === "demo") {
        nextQ = demoQuestion(analysis, nextLevel, history);
      } else {
        const res = await fetch("/api/next-question", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ analysis, level: nextLevel, history }) });
        const data = await readJsonResponse(res, "Question generation failed.");
        nextQ = data.question;
      }
      setQuestion(nextQ); setLevel(nextLevel); setTranscript(""); setStartedAt(Date.now());
      say(nextQ.text);
    } catch (e: any) { setError(e.message || "Question generation failed"); } finally { setLoading(false); }
  }

  async function toggleVideo() {
    if (videoOn) {
      mediaStreamRef.current?.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      mediaStreamRef.current = null;
      setVideoOn(false);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access is not available in this browser. Voice interview is still fully supported.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      mediaStreamRef.current = stream;
      setVideoOn(true);
      if (videoRef.current) videoRef.current.srcObject = stream;
      setError("");
    } catch {
      setError("Camera permission was denied or unavailable. Voice interview can continue without video.");
    }
  }

  function toggleListening() {
    if (listening) { recognitionRef.current?.stop?.(); setListening(false); return; }
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) { setError("Speech recognition is not supported in this browser. Use Chrome or Edge for the voice experience."); return; }
    const recognition = new Recognition();
    recognition.lang = "en-US"; recognition.interimResults = true; recognition.continuous = false;
    let finalText = "";
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += `${t} `; else interim += t;
      }
      setTranscript((finalText + interim).trim());
    };
    recognition.onerror = () => { setListening(false); setError("Microphone / speech recognition error. You can type the answer and submit it."); };
    recognition.onend = () => { setListening(false); };
    recognitionRef.current = recognition; setListening(true); setError(""); recognition.start();
  }

  async function evaluateCurrentAnswer(answer: string): Promise<AnswerEvaluation> {
    if (!question || !analysis) throw new Error("Interview context is missing.");
    if (demoMode || analysis.mode === "demo") {
      return demoAnswerEvaluation(question.text, answer, analysis, question.level);
    }
    const res = await fetch("/api/evaluate-answer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ analysis, question, answer, level: question.level }) });
    const data = await readJsonResponse(res, "Answer evaluation failed.");
    return data.evaluation as AnswerEvaluation;
  }

  async function submitAnswer() {
    if (!question || !transcript.trim() || !analysis) return;
    setError(""); setLoading(true);
    try {
      const answerText = transcript.trim();
      const filler = (answerText.match(/\b(um|uh|like|you know|so)\b/gi) || []).length;
      const evaluation = await evaluateCurrentAnswer(answerText);
      const record: AnswerRecord = {
        questionId: question.id,
        question: question.text,
        answer: answerText,
        level: question.level,
        durationSeconds: startedAt ? Math.max(1, Math.round((Date.now() - startedAt) / 1000)) : 1,
        fillerWords: filler,
        evaluation,
      };
      const nextHistory = [...answers, record];
      setAnswers(nextHistory); setLastEvaluation(evaluation); setTranscript("");
      const shouldAdvance = (question.level === 1 && nextHistory.filter(a => a.level === 1).length >= 3) || (question.level === 2 && nextHistory.filter(a => a.level === 2).length >= 3);
      if (nextHistory.length >= 9) {
        if (demoMode || analysis.mode === "demo") {
          setReport(demoEvaluation(analysis, nextHistory));
        } else {
          const r = await fetch("/api/evaluate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ analysis, answers: nextHistory }) });
          const d = await readJsonResponse(r, "Evaluation failed.");
          setReport(d.report);
        }
        setQuestion(null); recognitionRef.current?.stop?.();
        return;
      }
      const next = shouldAdvance ? ((question.level + 1) as InterviewLevel) : question.level;
      await getQuestion(next, nextHistory);
    } catch (e: any) {
      setError(e.message || "Could not process the answer");
    } finally { setLoading(false); }
  }

  function reset() {
    recognitionRef.current?.stop?.();
    mediaStreamRef.current?.getTracks().forEach((track: MediaStreamTrack) => track.stop());
    mediaStreamRef.current = null;
    setVideoOn(false); setAnalysis(null); setQuestion(null); setReport(null); setAnswers([]); setLastEvaluation(null); setTranscript(""); setLevel(1); setError(""); setJd(""); setResume(""); setJdFile(null); setResumeFile(null); setDemoMode(false);
  }

  function loadDemo() { setJd(DEMO_JD); setResume(DEMO_RESUME); setJdFile(null); setResumeFile(null); setDemoMode(true); setError(""); }

  return <div className="app"><AppHeader mode={analysis?.mode} onReset={screen !== "input" ? reset : undefined}/><main className="main">
    {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}
    {screen === "input" && <InputScreen jd={jd} resume={resume} setJd={(v) => { setDemoMode(false); setJd(v); }} setResume={(v) => { setDemoMode(false); setResume(v); }} jdFile={jdFile} resumeFile={resumeFile} setJdFile={(v) => { setDemoMode(false); setJdFile(v); }} setResumeFile={(v) => { setDemoMode(false); setResumeFile(v); }} onAnalyze={analyzeDocuments} loading={loading} onDemo={loadDemo}/>} 
    {screen === "analysis" && analysis && <AnalysisScreen analysis={analysis} onStart={() => getQuestion(1, [])} loading={loading}/>} 
    {screen === "interview" && analysis && question && <InterviewScreen analysis={analysis} question={question} level={level} progress={progress} transcript={transcript} setTranscript={setTranscript} listening={listening} toggleListening={toggleListening} submitAnswer={submitAnswer} loading={loading} answers={answers} lastEvaluation={lastEvaluation} videoOn={videoOn} videoRef={videoRef} toggleVideo={toggleVideo}/>} 
    {screen === "report" && analysis && report && <ReportScreen report={report} onRestart={() => { setQuestion(null); setReport(null); setAnswers([]); setLastEvaluation(null); setLevel(1); }} />}
  </main></div>;
}

function InputScreen({ jd, resume, setJd, setResume, jdFile, resumeFile, setJdFile, setResumeFile, onAnalyze, loading, onDemo }: { jd: string; resume: string; setJd: (v: string) => void; setResume: (v: string) => void; jdFile: File | null; resumeFile: File | null; setJdFile: (v: File | null) => void; setResumeFile: (v: File | null) => void; onAnalyze: () => void; loading: boolean; onDemo: () => void }) {
  return <div className="hero"><section className="heroCard"><span className="eyebrow">AI Product Engineer Intern - Assignment 3</span><div className="h1">Know the role.<br/>Prove your readiness.</div><p className="sub">Paste or upload a job description and resume. The accelerator turns them into a role analysis, job-fit map, adaptive three-level interview, voice experience, and actionable preparation report.</p><div style={{ display: "flex", gap: 10, marginTop: 22 }}><button className="btn secondary" onClick={onDemo}>Load demo data</button><span className="hint" style={{ alignSelf: "center" }}>No API key needed for the deterministic demo mode.</span></div></section>
    <section className="panel stack"><div className="field"><div className="label">Job Description</div><textarea className="textarea" placeholder="Paste the JD here..." value={jd} onChange={e => setJd(e.target.value)} /><input className="file" type="file" accept=".pdf,.docx,.txt,.md" onChange={e => setJdFile(e.target.files?.[0] || null)}/>{jdFile && <div className="hint">Attached: {jdFile.name}</div>}</div><div className="field"><div className="label">Resume</div><textarea className="textarea" placeholder="Paste the resume here..." value={resume} onChange={e => setResume(e.target.value)} /><input className="file" type="file" accept=".pdf,.docx,.txt,.md" onChange={e => setResumeFile(e.target.files?.[0] || null)}/>{resumeFile && <div className="hint">Attached: {resumeFile.name}</div>}</div><button className="btn primary" onClick={onAnalyze} disabled={loading || (!jd.trim() && !jdFile) || (!resume.trim() && !resumeFile)}>{loading ? "Analysing..." : "Analyse role & candidate"}</button></section></div>;
}

function AnalysisScreen({ analysis, onStart, loading }: { analysis: Analysis; onStart: () => void; loading: boolean }) {
  const r = analysis.role, c = analysis.candidate;
  return <div className="stack"><div className="topActions"><button className="btn primary" disabled={loading} onClick={onStart}>{loading ? "Preparing..." : "Start AI Interview"}</button></div><section className="panel"><div className="sectionTitle">Role Analysis</div><p className="sectionDesc">What the employer is asking for, distilled into interview-relevant signals.</p><div className="grid"><div className="metric"><h4>Role</h4><strong style={{ fontSize: 20 }}>{r.roleTitle}</strong></div><div className="metric"><h4>Required Skills</h4><TagList items={r.requiredSkills}/></div><div className="metric"><h4>Preferred Skills</h4><TagList items={r.preferredSkills}/></div></div><div className="two" style={{ marginTop: 16 }}><div className="metric"><h4>Responsibilities</h4><ul className="list">{r.keyResponsibilities.map(x => <li key={x}>{x}</li>)}</ul></div><div className="metric"><h4>Technical Competencies</h4><TagList items={r.technicalCompetencies}/></div><div className="metric"><h4>Behavioural Competencies</h4><TagList items={r.behaviouralCompetencies}/></div><div className="metric"><h4>Experience Expectations</h4><ul className="list">{r.experienceExpectations.map(x => <li key={x}>{x}</li>)}</ul></div><div className="metric"><h4>Keywords / Concepts</h4><TagList items={[...r.importantKeywords, ...r.importantConcepts].slice(0, 20)}/></div><div className="metric"><h4>Key Qualifications</h4><ul className="list">{r.keyQualifications.map(x => <li key={x}>{x}</li>)}</ul></div></div></section><section className="panel"><div className="sectionTitle">Candidate Analysis</div><p className="sectionDesc">Evidence from the resume mapped back to the role requirements.</p><div className="scoreWrap"><div className="scoreBig" style={{ ["--score" as any]: c.jobFit }}><div><strong>{c.jobFit}%</strong><span className="muted">{c.jobFitLabel}</span></div></div><div className="grid"><div className="metric"><h4>Key Skills</h4><TagList items={c.keySkills}/></div><div className="metric"><h4>Strengths</h4><ul className="list">{c.strengthsAgainstJD.map(x => <li key={x}>{x}</li>)}</ul></div><div className="metric"><h4>Missing / Weak</h4><TagList items={c.missingSkills.length ? c.missingSkills : c.weakAreas}/></div><div className="metric"><h4>Relevant Experience</h4><ul className="list">{c.relevantExperience.map(x => <li key={x}>{x}</li>)}</ul></div><div className="metric"><h4>Relevant Projects</h4><ul className="list">{c.relevantProjects.map(x => <li key={x}>{x}</li>)}</ul></div><div className="metric"><h4>Achievements</h4><ul className="list">{c.relevantAchievements.map(x => <li key={x}>{x}</li>)}</ul></div></div></div><div className="two" style={{ marginTop: 16 }}><div className="metric"><h4>Claims to Probe</h4><ul className="list">{c.claimsToProbe.map(x => <li key={x}>{x}</li>)}</ul></div><div className="metric"><h4>Preparation Areas</h4><TagList items={c.preparationAreas}/></div></div></section></div>;
}

function InterviewScreen({ analysis, question, level, progress, transcript, setTranscript, listening, toggleListening, submitAnswer, loading, answers, lastEvaluation, videoOn, videoRef, toggleVideo }: { analysis: Analysis; question: InterviewQuestion; level: InterviewLevel; progress: number; transcript: string; setTranscript: (v: string) => void; listening: boolean; toggleListening: () => void; submitAnswer: () => void; loading: boolean; answers: AnswerRecord[]; lastEvaluation: AnswerEvaluation | null; videoOn: boolean; videoRef: RefObject<HTMLVideoElement | null>; toggleVideo: () => void }) {
  const levelName = level === 1 ? "Screening" : level === 2 ? "Competency" : "Deep-Dive";
  return <div className="stack"><div className="stepper"><span className={`step ${level === 1 ? "active" : ""}`}>Level 1 - Screening</span><span className={`step ${level === 2 ? "active" : ""}`}>Level 2 - Competency</span><span className={`step ${level === 3 ? "active" : ""}`}>Level 3 - Deep-Dive</span></div><div className="interviewLayout"><section className="questionCard"><div><div className="metaRow"><span>{levelName} Interview</span><span>{answers.length + 1} / 9</span></div><div className="question">{question.text}</div><div className="callout"><strong>Adaptive cue:</strong> This next question uses your JD, resume, prior answers, and per-answer evaluation. Weak answers trigger clarification; strong answers can trigger a harder follow-up.</div></div><div className="center"><button className={`mic ${listening ? "listening" : ""}`} onClick={toggleListening} aria-label="Toggle microphone">{listening ? "■" : "🎙"}</button><div style={{ marginTop: 10, fontWeight: 700 }}>{listening ? "Listening..." : "Speak your answer"}</div><div className="hint">Your answer is transcribed in-browser. Text fallback is available below.</div><div style={{ marginTop: 14 }}><button className="btn ghost" onClick={toggleVideo}>{videoOn ? "Turn camera off" : "Turn camera on"}</button></div>{videoOn && <div className="videoBox"><video ref={videoRef} autoPlay playsInline muted /></div>}</div><div><textarea className="transcript" aria-label="Answer transcript" placeholder="Your spoken transcript will appear here. You can also type your answer." value={transcript} onChange={e => setTranscript(e.target.value)} /><div className="topActions" style={{ marginTop: 12 }}><button className="btn ghost" onClick={() => say(question.text)}>Replay question</button><button className="btn primary" disabled={!transcript.trim() || loading} onClick={submitAnswer}>{loading ? "Evaluating..." : "Submit answer"}</button></div></div></section><aside className="side"><div className="mini"><h4>Candidate context</h4><div className="hint">Role</div><strong>{analysis.role.roleTitle}</strong><div className="hint" style={{ marginTop: 10 }}>Job fit</div><strong>{analysis.candidate.jobFit}%</strong></div><div className="mini"><h4>Interview progress</h4><div className="progress"><div style={{ width: `${progress}%` }}/></div><div className="hint" style={{ marginTop: 8 }}>{progress}% complete</div></div>{lastEvaluation && <div className="mini"><h4>Last answer evaluation</h4><div className="scoreInline">{lastEvaluation.score}/100</div><p className="hint">{lastEvaluation.assessment}</p></div>}<div className="mini"><h4>What is being tested</h4><TagList items={[question.focus, levelName, level === 3 ? "Technical depth" : "Role fit"]}/></div></aside></div></div>;
}

function ReportScreen({ report, onRestart }: { report: PerformanceReport; onRestart: () => void }) {
  const cs = report.competencyScores;
  return <div className="stack"><section className="panel"><div className="sectionTitle">Interview Performance Report</div><p className="sectionDesc">Your role-aligned performance, question-level evidence, and preparation plan.</p><div className="scoreWrap"><div className="scoreBig" style={{ ["--score" as any]: report.overallScore }}><div><strong>{report.overallScore}</strong><span className="muted">/ 100</span></div></div><div><h2 style={{ marginTop: 0 }}>{report.readiness}</h2><p className="sub">Readiness combines interview performance, competency scores, and JD alignment. This is preparation feedback, not a hiring decision.</p><div className="bars"><Bar name="Role Fit" value={cs.roleFit}/><Bar name="Technical Knowledge" value={cs.technicalKnowledge}/><Bar name="Problem Solving" value={cs.problemSolving}/><Bar name="Communication" value={cs.communication}/><Bar name="Confidence" value={cs.confidence}/><Bar name="Depth of Understanding" value={cs.depthOfUnderstanding}/><Bar name="Behavioural Fit" value={cs.behaviouralFit}/></div></div></div></section><div className="two"><section className="panel"><div className="sectionTitle">Strengths</div><ul className="list">{report.strengths.map(x => <li key={x}>{x}</li>)}</ul></section><section className="panel"><div className="sectionTitle">Weaknesses</div><ul className="list">{report.weaknesses.map(x => <li key={x}>{x}</li>)}</ul></section></div><section className="panel"><div className="sectionTitle">Preparation Gaps</div><div className="grid">{report.preparationGaps.map(g => <div className="metric" key={g.priority}><h4>Priority {g.priority}</h4><strong style={{ fontSize: 18 }}>{g.topic}</strong><ul className="list" style={{ marginTop: 10 }}>{g.review.map(x => <li key={x}>{x}</li>)}</ul></div>)}</div></section><section className="panel"><div className="sectionTitle">Question-Level Feedback</div><div className="feedback">{report.questionFeedback.map((f, i) => <div className="feedbackItem" key={i}><div className="metaRow"><span>Question {i + 1}</span><span>{f.score}/100</span></div><h3>{f.question}</h3><div className="quote">{f.candidateAnswer}</div><p><strong>Assessment:</strong> {f.assessment}</p><div className="two"><div><strong>What was good</strong><ul className="list">{f.whatWasGood.map(x => <li key={x}>{x}</li>)}</ul></div><div><strong>What could be better</strong><ul className="list">{f.whatCouldBeBetter.map(x => <li key={x}>{x}</li>)}</ul></div></div><p><strong>Ideal direction:</strong> {f.idealDirection}</p></div>)}</div></section><div className="topActions"><button className="btn secondary" onClick={onRestart}>Practice another interview</button></div><div className="footerNote">Core evaluation focuses on answer quality, relevance, clarity, depth, and evidence rather than facial-expression or emotion inference.</div></div>;
}

function Bar({ name, value }: { name: string; value: number }) { return <div className="barRow"><span>{name}</span><div className="progress"><div style={{ width: `${value}%` }}/></div><strong>{value}</strong></div>; }
