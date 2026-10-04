export type RoleAnalysis = {
  roleTitle: string;
  keyResponsibilities: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  technicalCompetencies: string[];
  behaviouralCompetencies: string[];
  experienceExpectations: string[];
  importantKeywords: string[];
  importantConcepts: string[];
  keyQualifications: string[];
};

export type CandidateAnalysis = {
  candidateName: string;
  keySkills: string[];
  relevantExperience: string[];
  relevantProjects: string[];
  relevantAchievements: string[];
  strengthsAgainstJD: string[];
  missingSkills: string[];
  weakAreas: string[];
  claimsToProbe: string[];
  preparationAreas: string[];
  jobFit: number;
  jobFitLabel: string;
};

export type Analysis = {
  role: RoleAnalysis;
  candidate: CandidateAnalysis;
  mode: "ai" | "demo";
};

export type InterviewLevel = 1 | 2 | 3;

export type AnswerEvaluation = {
  score: number;
  assessment: string;
  strengths: string[];
  improvement: string[];
  followUpIntent: string;
};

export type InterviewQuestion = {
  id: string;
  level: InterviewLevel;
  text: string;
  focus: string;
  difficulty: number;
};

export type AnswerRecord = {
  questionId: string;
  question: string;
  answer: string;
  level: InterviewLevel;
  durationSeconds: number;
  fillerWords: number;
  evaluation?: AnswerEvaluation;
};

export type QuestionFeedback = {
  question: string;
  candidateAnswer: string;
  assessment: string;
  whatWasGood: string[];
  whatCouldBeBetter: string[];
  idealDirection: string;
  score: number;
};

export type PerformanceReport = {
  overallScore: number;
  competencyScores: {
    roleFit: number;
    technicalKnowledge: number;
    problemSolving: number;
    communication: number;
    confidence: number;
    depthOfUnderstanding: number;
    behaviouralFit: number;
  };
  strengths: string[];
  weaknesses: string[];
  preparationGaps: { priority: number; topic: string; review: string[] }[];
  readiness: "Not Ready" | "Needs Preparation" | "Interview Ready" | "Strong Candidate";
  questionFeedback: QuestionFeedback[];
  mode: "ai" | "demo";
};
