# Interview Accelerator — Assignment 3

A working AI-powered interview preparation prototype built for the **AI Product Engineer Intern — Assignment 3** brief.

The product takes a **Job Description (JD)** and a **Resume**, understands the role and candidate, estimates job fit, conducts a **three-level adaptive interview**, supports **voice interaction**, evaluates answers, and produces a detailed **interview performance report + preparation plan + readiness assessment**.

The assignment explicitly says this is a **product-building task**, not only a theoretical or documentation exercise, and the final submission must be a functional web prototype. The repository is therefore structured around a complete end-to-end flow rather than a set of disconnected AI demos.

> **Assignment source note:** The supplied brief says to visit `studentcredibility.com` before starting. The site could not be retrieved from the browser in this environment, so no unsupported claims about that external site are included here. The implementation and traceability below are based on the supplied 16-page assignment brief.

---

## 1. What the assignment requires

The brief asks for a system that solves a specific candidate problem: a person may have a resume and JD but still not know what the employer wants, how well they match the role, which questions they may face, how effectively they can answer them, what gaps they have, or whether they are ready for the interview.

The required product journey is:

```text
Upload / Paste JD
        ↓
Upload / Paste Resume
        ↓
AI Analyses Role
        ↓
AI Analyses Candidate
        ↓
Job Fit Score
        ↓
Start AI Interview
        ↓
Level 1 — Screening
        ↓
Level 2 — Competency
        ↓
Level 3 — Deep-Dive
        ↓
Voice / Video Interaction
        ↓
Per-answer AI Evaluation
        ↓
Final Interview Performance Report
        ↓
Personalised Preparation Plan
        ↓
Interview Readiness Assessment
```

The assignment's minimum acceptance criteria include JD input/upload, resume input/upload, role and resume analysis, job fit, personalised interview generation, all three levels, dynamic follow-ups, previous-answer context, voice interview, evaluation, overall and competency scores, question-level feedback, strengths, weaknesses, preparation gaps, readiness assessment, and a functional web interface.

---

## 2. Features implemented in this repository

### Core required features

- Job Description paste input.
- Job Description upload for **PDF, DOCX, TXT, MD**.
- Resume paste input.
- Resume upload for **PDF, DOCX, TXT, MD**.
- Server-side document text extraction.
- JD role analysis.
- Resume-to-JD candidate analysis.
- Transparent 0–100 Job Fit score.
- Strong / Partial / Needs Preparation job-fit label.
- Personalised three-level interview.
- Dynamic next-question generation.
- Per-answer evaluation before the next question.
- Weak-answer clarification logic.
- Strong-answer difficulty escalation.
- Context carried across the interview: JD, resume evidence, previous questions, previous answers, answer scores, strengths and gaps.
- Voice interviewer: browser Text-to-Speech.
- Voice candidate: browser SpeechRecognition / speech-to-text.
- Typed-answer fallback when browser speech recognition is unavailable.
- Optional local camera preview as a video bonus.
- Final overall interview score.
- Seven competency scores.
- Question-level feedback.
- Strengths.
- Weaknesses.
- Preparation gaps with priority and review actions.
- Final readiness label.
- Responsive modern UI.

### Bonus / polish features

- Demo mode that works without an API key.
- AI mode with OpenAI.
- Interview progress indicator.
- Interview level indicator.
- Replay-question button.
- Basic filler-word counting (`um`, `uh`, `like`, `you know`, `so`).
- Response-duration measurement.
- Camera toggle / live local preview.
- Explicit per-answer evaluation shown during the interview.

The assignment says video is highly preferred but can be treated as a bonus when the voice implementation is strong, so voice remains the primary interview interaction.

---

## 3. Technology stack

| Layer | Technology | Why it is used |
|---|---|---|
| Frontend | Next.js 15 + React 19 | Single full-stack web prototype with client UI and server routes |
| Language | TypeScript | Strong typing and maintainability |
| Styling | CSS in `app/globals.css` | Lightweight, no UI framework dependency |
| LLM | OpenAI API | Role analysis, candidate analysis, adaptive questions, answer evaluation, final report |
| Document parsing | `pdf-parse` | PDF text extraction |
| Document parsing | `mammoth` | DOCX text extraction |
| Voice STT | Browser Web Speech API | Candidate speech-to-text |
| Voice TTS | Browser SpeechSynthesis API | AI interviewer speaks questions |
| Video bonus | `getUserMedia()` | Optional local camera preview |
| State | React client state | Enough for a prototype; no database is required for the assignment flow |

The assignment explicitly allows React/Next.js, Node/Python, LLM APIs, speech-to-text, TTS, WebRTC, vector databases, RAG, and other relevant technologies.

---

## 4. Project structure

```text
interview-accelerator/
├── app/
│   ├── api/
│   │   ├── analyze/
│   │   │   └── route.ts
│   │   ├── evaluate-answer/
│   │   │   └── route.ts
│   │   ├── evaluate/
│   │   │   └── route.ts
│   │   └── next-question/
│   │       └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── demo.ts
│   ├── openai.ts
│   └── uploads.ts
├── types/
│   └── index.ts
├── .env.example
├── .gitignore
├── next.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

### What each file does

**`app/page.tsx`**

The main product UI and interview state machine. It handles:

- JD/resume inputs.
- Upload selection.
- Starting analysis.
- Starting the interview.
- Voice capture.
- Optional camera preview.
- Recording answer timing.
- Filler-word counting.
- Per-answer evaluation requests.
- Level progression.
- Final report display.

**`app/api/analyze/route.ts`**

Accepts pasted/uploaded JD and resume data, extracts file text, validates that both inputs exist, then calls the analysis layer.

**`app/api/next-question/route.ts`**

Generates exactly one next interview question from the role/candidate analysis, current interview level, previous answers, and prior answer evaluations.

**`app/api/evaluate-answer/route.ts`**

Scores the current answer before the next question is generated. This is what makes the prototype's adaptive logic explicit rather than only doing final evaluation at the end.

**`app/api/evaluate/route.ts`**

Produces the complete interview performance report after all interview questions have been answered.

**`lib/openai.ts`**

Provides the LLM implementation. It requests structured JSON for predictable application behavior.

**`lib/demo.ts`**

Provides a deterministic no-key implementation. It also contains local adaptive questioning and local answer evaluation so the full product can be demonstrated without an OpenAI credential.

**`lib/uploads.ts`**

Extracts text from PDF, DOCX, TXT, and MD uploads.

**`types/index.ts`**

Defines the shared TypeScript contracts for analysis, questions, answer evaluations, and reports.

---

## 5. AI / LLM approach

There are four AI stages.

### Stage A — Understand the Role

The JD is transformed into a structured role profile containing:

- Role / Job Title
- Key Responsibilities
- Required Skills
- Preferred Skills
- Technical Competencies
- Behavioural Competencies
- Experience Expectations
- Important Keywords
- Important Concepts
- Key Qualifications

### Stage B — Understand the Candidate

The resume is compared with the JD and the system extracts:

- Candidate's key skills
- Relevant experience
- Relevant projects
- Relevant achievements
- Strengths against the JD
- Missing skills
- Weak / insufficient areas
- Resume claims to probe
- Preparation areas
- Job Fit score and label

### Stage C — Adaptive interviewer

The interviewer receives the current role/candidate analysis plus recent answer history.

Every answer can carry an evaluation object containing:

```text
score
assessment
strengths[]
improvement[]
followUpIntent
```

The next-question generator can therefore react to what was actually said:

```text
Weak answer
   ↓
Targeted clarification
   ↓
Re-assess

Strong answer
   ↓
Higher difficulty
   ↓
Scenario / edge case / counter-question
```

### Stage D — Final evaluation

After the interview, the report evaluates:

- Role Fit
- Technical Knowledge
- Problem Solving
- Communication
- Confidence
- Depth of Understanding
- Behavioural Fit

It also produces strengths, weaknesses, preparation gaps, readiness, and question-level feedback.

The implementation deliberately does **not** use facial-expression or emotion inference as the primary evaluation mechanism. The report concentrates on answer quality, relevance, clarity, evidence, reasoning, and depth.

---

## 6. Dynamic questioning logic

This is one of the most important parts of the assignment.

A fixed list of questions would not satisfy the spirit of the requirement. The product therefore sends the prior interview context every time it requests the next question.

### Level 1 — Screening

Focus:

- Resume
- Motivation
- Basic understanding
- Role fit
- Communication
- Relevant experience
- Career goals

Typical behavior:

- Start from an actual resume project or skill.
- Ask about ownership and relevance to the role.
- Explore motivation for the specific role.
- Identify an important preparation gap.

### Level 2 — Competency

Focus:

- Job-specific competencies
- Technical understanding
- Problem solving
- Previous experience
- Projects
- Behavioural competencies
- Decision-making
- Practical application

Typical behavior:

- Ask about a technical decision.
- Introduce scale or implementation constraints.
- Probe alternatives and trade-offs.
- Ask for a concrete example of changing course after evidence.

### Level 3 — Deep-Dive

Focus:

- Resume claim verification
- Technical depth
- Reasoning
- Why/how explanations
- Realistic scenarios
- Counter-questions
- Inconsistencies
- Edge cases

Typical behavior:

- Challenge a quantified claim.
- Ask which metric was used and why.
- Test what happens when assumptions break.
- Ask what evidence would change the candidate's conclusion.

### Adaptive rules

The application evaluates every submitted response.

A weak response can produce a question such as:

```text
Your last answer was a little high-level. Pick one technical decision involving X.
What constraint drove the decision, and what would you change in a second iteration?
```

A strong response can produce an escalation such as:

```text
You were specific about X. Now assume the workload grows 10x.
Which assumption breaks first, and how would you redesign the solution without over-engineering it?
```

This makes the prototype demonstrably adaptive even in local demo mode.

---

## 7. Voice implementation

Voice is mandatory in the assignment, so it is treated as a first-class experience.

### Interviewer voice

The generated question is passed to:

```text
window.speechSynthesis
```

The browser reads the interviewer question aloud automatically.

### Candidate speech-to-text

The microphone button uses:

```text
window.SpeechRecognition
```

or the WebKit implementation where required by the browser.

The speech is transcribed and displayed live in the answer field.

### Typed fallback

The answer field remains editable. If speech recognition is unsupported or microphone access fails, the candidate can type the same answer manually.

### Browser recommendation

Use **Chrome or Edge** for the most reliable Web Speech API behavior.

Voice recognition generally requires a secure browser context for deployed environments. Local development on `localhost` is normally suitable for testing.

---

## 8. Video bonus implementation

The brief says video is bonus / highly preferred.

The prototype therefore provides an optional **Turn camera on** button. When enabled, the browser requests webcam access using `navigator.mediaDevices.getUserMedia({ video: true })` and shows a local preview.

Important:

- Video is only a usability bonus.
- The implementation does not use facial-expression or emotion detection.
- The primary evaluation remains the answer itself.

---

## 9. Job Fit methodology

The assignment says the scoring methodology is up to the builder.

### AI mode

The LLM receives the JD and resume and is instructed to produce a transparent 0–100 **preparation estimate** based on explicit requirements and explicit evidence.

### Demo mode

The local parser uses a lightweight overlap model:

```text
role skills found in resume
            ↓
matched skills
            ↓
missing / weak skills
            ↓
bounded 0–100 preparation estimate
```

The job-fit score is explicitly presented as preparation feedback rather than a hiring decision.

---

## 10. Interview evaluation methodology

The product uses two evaluation levels.

### Per-answer evaluation

Each answer is scored before the next question. The evaluator looks at:

- Relevance to the question.
- Specificity.
- Concrete evidence.
- Reasoning.
- Trade-offs and assumptions.
- Quantification where appropriate.
- Technical depth at the higher levels.

The output includes targeted improvements rather than generic advice.

### Final report

The final report combines the role alignment with interview performance and produces seven competency dimensions.

The report also includes answer-level evidence so the candidate can understand exactly why a response was considered strong or weak.

Example of the intended style:

```text
Your answer explained the implementation but did not quantify the impact.
Include the model's baseline performance, improvement achieved,
and how you measured it.
```

That is deliberately more actionable than a generic statement such as “improve your communication.”

---

## 11. Demo mode vs AI mode

The app supports two operating modes.

### Demo mode — no API key

Demo mode is designed for:

- local testing
- assignment demonstration
- UI walkthroughs
- environments where an OpenAI key is unavailable

It uses deterministic local logic for:

- role parsing
- resume/JD matching
- adaptive questions
- per-answer evaluation
- final report

Click **Load demo data** on the home screen.

### AI mode — OpenAI key configured

AI mode uses OpenAI for:

- role analysis
- candidate analysis
- adaptive question generation
- per-answer evaluation
- final report generation

The mode label appears in the top navigation.

---

## 12. Exact setup and run instructions

### Prerequisites

Install:

- Node.js 20+ recommended.
- npm.
- Chrome or Edge for best voice testing.
- Optional OpenAI API key for AI mode.

### Step 1 — Open the project

```bash
cd interview-accelerator
```

### Step 2 — Install dependencies

```bash
npm install
```

### Step 3 — Configure AI mode

Create a file named `.env.local` in the project root:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4.1-mini
```

The model variable is optional. The application defaults to `gpt-4.1-mini`.

Do **not** commit `.env.local` to GitHub.

### Step 4 — Run the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

### Step 5 — Verify TypeScript

```bash
npm run typecheck
```

### Step 6 — Verify a production build

```bash
npm run build
```

Then run the production server:

```bash
npm run start
```

Open the URL shown by Next.js, normally:

```text
http://localhost:3000
```

---

## 13. How to run the complete assignment demo

For the safest first run, use demo mode before AI mode.

### Demo flow

1. Start the app.
2. Click **Load demo data**.
3. Click **Analyse role & candidate**.
4. Review the Role Analysis dashboard.
5. Review Candidate Analysis and Job Fit.
6. Click **Start AI Interview**.
7. Listen to the spoken first question.
8. Click the microphone.
9. Answer aloud.
10. Confirm the transcript appears.
11. Submit the answer.
12. Observe the per-answer evaluation.
13. Continue through Level 1.
14. Continue through Level 2.
15. Continue through Level 3.
16. Watch the difficulty change depending on the quality of your previous answers.
17. After 9 completed answers, review the final report.
18. Review overall score, seven competencies, strengths, weaknesses, preparation gaps, readiness, and question-level feedback.

### Typed-answer demo

For a faster recording, type answers into the transcript box instead of using the microphone. The adaptive logic still works because it reacts to the submitted answer content.

### Video demo

During an interview question, click **Turn camera on** to show the optional camera experience.

---

## 14. Testing JD / Resume upload

Supported uploads:

- `.pdf`
- `.docx`
- `.txt`
- `.md`

You may use:

- pasted JD + pasted resume
- uploaded JD + uploaded resume
- pasted JD + uploaded resume
- uploaded JD + pasted resume

The server extracts text before analysis.

For an assignment demo, small text-based PDF/DOCX files are the safest test inputs.

---

## 15. API routes

### `POST /api/analyze`

Multipart form data:

```text
jdText
resumeText
jdFile
resumeFile
```

Returns:

```json
{
  "analysis": {
    "role": {},
    "candidate": {},
    "mode": "ai"
  }
}
```

### `POST /api/evaluate-answer`

JSON body:

```json
{
  "analysis": {},
  "question": {},
  "answer": "...",
  "level": 2
}
```

Returns a single structured answer evaluation.

### `POST /api/next-question`

JSON body:

```json
{
  "analysis": {},
  "level": 3,
  "history": []
}
```

Returns one next interview question.

### `POST /api/evaluate`

JSON body:

```json
{
  "analysis": {},
  "answers": []
}
```

Returns the final performance report.

---

## 16. Deployment to Vercel

The application is designed to deploy as a normal Next.js app.

### GitHub

From the project folder:

```bash
git init
git add .
git commit -m "Build Interview Accelerator assignment"
git branch -M main
git remote add origin <YOUR_GITHUB_REPOSITORY_URL>
git push -u origin main
```

### Vercel

1. Open Vercel.
2. Import the GitHub repository.
3. Keep the Next.js defaults.
4. Add environment variables:

```text
OPENAI_API_KEY
OPENAI_MODEL
```

5. Deploy.
6. Open the deployed HTTPS application.
7. Test the complete flow again from JD/resume input to the final report.
8. Test microphone permissions on the deployed site.
9. Test camera permission if you are showing the video bonus.

The assignment specifically requires a live deployed application, a GitHub repository, a README, a demo video, and a brief explanation of the technical approach.

---

## 17. What to record in the demo video

A strong submission video should show the entire user journey rather than only a static dashboard.

Recommended recording sequence:

```text
00:00 — Landing / JD + Resume input
00:30 — Load demo data or upload real sample files
01:00 — Role analysis
01:45 — Candidate analysis + Job Fit
02:20 — Start interview
02:30 — Level 1 question + voice answer
03:30 — Show per-answer evaluation
04:00 — Level 2 escalation
05:00 — Level 3 deep-dive / challenge
06:30 — Finish interview
07:00 — Performance report
08:00 — Preparation gaps + readiness
```

Make sure the recording shows:

- Actual input.
- Actual analysis.
- Actual voice interaction.
- At least one adaptive follow-up.
- Final report.

For the adaptive part, intentionally demonstrate two different answer qualities:

### Weak-answer demonstration

Give a short, vague response. The next question should ask for a clarification or a concrete example.

### Strong-answer demonstration

Give a detailed response containing reasoning and evidence. The next question should become more challenging.

This makes the adaptive behavior visible to the evaluator.

---

## 18. What the README must explain for the assignment

The brief asks the final submission to include a brief explanation of five things.

### Architecture

Explain:

```text
Next.js browser UI
        ↓
API routes
        ↓
Document extraction
        ↓
LLM / demo analysis
        ↓
Interview state + answer history
        ↓
Per-answer evaluation
        ↓
Adaptive next question
        ↓
Final evaluation
        ↓
Report
```

### AI / LLM approach

Explain:

- Structured JD extraction.
- Resume/JD comparison.
- Job-fit estimation.
- One-question-at-a-time adaptive generation.
- Per-answer evaluation.
- Final report generation.

### Voice implementation

Explain:

- Browser SpeechRecognition for candidate speech-to-text.
- Browser SpeechSynthesis for interviewer speech.
- Typed fallback.
- Chrome/Edge recommendation.

### Dynamic questioning logic

Explain:

- Current role context is retained.
- Candidate resume evidence is retained.
- Previous answers are sent to the next-question generator.
- Previous answer evaluations are included.
- Weak responses can trigger clarification.
- Strong responses can trigger harder questions.
- Level 3 explicitly probes claims, reasoning, edge cases and counter-questions.

### Evaluation methodology

Explain:

- Role alignment.
- Technical knowledge.
- Problem solving.
- Communication.
- Confidence proxy.
- Depth.
- Behavioural fit.
- Specific question-level feedback.
- Preparation gaps and priorities.

### Key technical decisions

Explain why the prototype uses:

- Next.js for one deployable full-stack app.
- Browser voice APIs to keep the voice loop simple and demonstrable.
- PDF/DOCX server-side extraction.
- Structured JSON responses from the LLM.
- Client-side interview state for this prototype.
- A deterministic fallback so the product remains demoable without an API key.

---

## 19. Assignment requirement traceability

The following maps the brief to the implementation.

| Assignment requirement | Implementation | Status |
|---|---|---|
| JD paste | Home screen textarea | Done |
| JD upload | PDF/DOCX/TXT/MD upload | Done |
| Resume paste | Home screen textarea | Done |
| Resume upload | PDF/DOCX/TXT/MD upload | Done |
| Role / Job Title | Role analysis | Done |
| Responsibilities | Role analysis | Done |
| Required skills | Role analysis | Done |
| Preferred skills | Role analysis | Done |
| Technical competencies | Role analysis | Done |
| Behavioural competencies | Role analysis | Done |
| Experience expectations | Role analysis | Done |
| Important keywords | Role analysis | Done |
| Important concepts | Role analysis | Done |
| Key qualifications | Role analysis | Done |
| Candidate skills | Candidate analysis | Done |
| Relevant experience | Candidate analysis | Done |
| Relevant projects | Candidate analysis | Done |
| Relevant achievements | Candidate analysis | Done |
| Strengths against JD | Candidate analysis | Done |
| Missing skills | Candidate analysis | Done |
| Weak areas | Candidate analysis | Done |
| Claims to probe | Candidate analysis | Done |
| Preparation areas | Candidate analysis | Done |
| Job Fit | Candidate analysis | Done |
| Level 1 Screening | Interview engine | Done |
| Level 2 Competency | Interview engine | Done |
| Level 3 Deep-Dive | Interview engine | Done |
| Dynamic follow-ups | Per-answer evaluation + next-question API | Done |
| Previous-answer context | Answer history sent on every question call | Done |
| Voice input | Browser SpeechRecognition | Done |
| AI interviewer voice | SpeechSynthesis | Done |
| Video bonus | Optional camera preview | Done |
| Overall score | Final report | Done |
| Role Fit score | Final report | Done |
| Technical Knowledge | Final report | Done |
| Problem Solving | Final report | Done |
| Communication | Final report | Done |
| Confidence | Final report | Done |
| Depth of Understanding | Final report | Done |
| Behavioural Fit | Final report | Done |
| Question-level feedback | Final report | Done |
| Strengths | Final report | Done |
| Weaknesses | Final report | Done |
| Preparation gaps | Final report | Done |
| Readiness assessment | Final report | Done |
| Functional web UI | Next.js application | Done |
| Live deployment | Deploy to Vercel | Submission step |
| GitHub repository | Push this repository | Submission step |
| README | This file | Done |
| Demo video | Record full journey | Submission step |

---

## 20. Minimum acceptance checklist before submission

Run this checklist yourself on the deployed application:

### Inputs

- [ ] JD can be pasted.
- [ ] JD can be uploaded.
- [ ] Resume can be pasted.
- [ ] Resume can be uploaded.

### Analysis

- [ ] Role analysis appears.
- [ ] Candidate analysis appears.
- [ ] Job Fit appears.

### Interview

- [ ] Level 1 appears.
- [ ] Level 2 appears.
- [ ] Level 3 appears.
- [ ] Questions reference the candidate/role.
- [ ] At least one follow-up clearly reacts to the previous answer.
- [ ] Voice question playback works.
- [ ] Candidate speech transcription works.
- [ ] Typed fallback works.

### Evaluation

- [ ] Per-answer evaluation appears during interview.
- [ ] Final overall score appears.
- [ ] All seven competency scores appear.
- [ ] Question-level feedback appears.
- [ ] Strengths appear.
- [ ] Weaknesses appear.
- [ ] Preparation gaps appear.
- [ ] Readiness assessment appears.

### Submission

- [ ] Live app URL works without assistance.
- [ ] GitHub repository is accessible.
- [ ] README is present.
- [ ] Demo video shows the complete user journey.
- [ ] Architecture explanation is included.
- [ ] AI/LLM approach is explained.
- [ ] Voice implementation is explained.
- [ ] Dynamic questioning logic is explained.
- [ ] Evaluation methodology is explained.
- [ ] Key technical decisions are explained.

---

## 21. Troubleshooting

### `npm install` hangs or fails

Check:

```bash
node --version
npm --version
```

Then retry:

```bash
npm install --no-audit --no-fund
```

If the issue is network-related, verify that npm can reach the package registry before assuming there is a project error.

### `OPENAI_API_KEY` errors

Confirm `.env.local` exists in the project root and contains:

```env
OPENAI_API_KEY=...
```

Restart the dev server after changing environment variables.

### Microphone does not work

- Use Chrome or Edge.
- Allow microphone permission.
- Make sure another application is not exclusively using the microphone.
- Use the typed transcript fallback if speech recognition is unavailable.

### Camera does not work

- Allow camera permission.
- Check browser privacy settings.
- The interview can continue with voice only.

### Uploaded PDF gives no text

The parser expects text-based PDF content. A scanned image-only PDF may need OCR support added for production use.

### LLM returns unexpected data

The project requests JSON from the model. If you change the model or prompt, keep the expected TypeScript shape consistent with `types/index.ts`.

---

## 22. Known prototype limitations

This is an interview-focused prototype, so several production concerns are intentionally simplified.

1. There is no persistent user account or database.
2. Interview history is maintained in the current browser session.
3. Browser speech recognition is used instead of a dedicated server-side STT service.
4. Browser speech synthesis is used instead of a dedicated TTS provider.
5. The bonus video feature is a local camera preview, not a recorded WebRTC interview room.
6. Demo mode uses deterministic local heuristics rather than an LLM.
7. Image-only scanned PDFs are not OCR'd.

These are deliberate scope decisions for a working assignment prototype; the core flow required by the brief is implemented without depending on them.

---

## 23. Suggested next-step production upgrades

For a production-quality evolution of this prototype, the next additions would be:

- Persistent interview history in PostgreSQL.
- User authentication.
- Server-side speech-to-text and text-to-speech for consistent cross-browser voice.
- Streaming transcription.
- Real-time interview events using WebSockets or WebRTC.
- Resume improvement suggestions.
- Job-specific study resources.
- Multiple job profiles.
- Cross-interview progress tracking.
- Shareable interview reports.
- More rigorous rubric calibration and evaluation datasets.
- OCR fallback for scanned PDFs.

These are enhancements beyond the minimum acceptance criteria.

---

## 24. Final submission package

Before sending the assignment, prepare these four deliverables:

```text
1. Live deployed application URL
2. GitHub repository URL
3. This README
4. Demo video URL / file
```

Also keep the source repository clean:

```text
DO NOT commit .env.local
DO NOT commit API keys
DO commit .env.example
DO commit the complete source code
DO commit README.md
```

---

## 25. One-command local start after setup

After dependencies and optional `.env.local` are configured:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

For a clean assignment demo, start with **Load demo data**, complete the three interview levels, and finish on the report screen.

## Troubleshooting: `Unexpected token '<'`, `"<!DOCTYPE" ... is not valid JSON`

If this appears after clicking **Load demo data** and then **Analyse role & candidate**, use the latest project version. The demo flow is designed to run fully in the browser and no longer depends on the `/api/analyze` route. This prevents a stale/misstarted Next.js server from returning an HTML 404 page where the browser expects JSON.

If you are using an older copy of the project, replace it with the latest ZIP, then run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and click **Load demo data** → **Analyse role & candidate**.

For AI mode, make sure the app is started from the project root. If an API endpoint is missing or the server returns HTML, the UI now shows a readable error instead of the raw JSON parse exception.
