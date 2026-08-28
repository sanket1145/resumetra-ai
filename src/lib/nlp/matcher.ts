import type { ParsedJob } from "./jobParser";
import type { ParsedResume } from "./resumeParser";
import type { SkillImportance } from "./jobParser";

/** Weights used by the transparent scoring formula. */
export const REQUIRED_WEIGHT = 1;
export const PREFERRED_WEIGHT = 0.5;

export interface MatchedSkill {
  name: string;
  category: string;
  importance: SkillImportance;
}

export interface ScoreBreakdown {
  requiredTotal: number;
  requiredMatched: number;
  preferredTotal: number;
  preferredMatched: number;
  requiredWeight: number;
  preferredWeight: number;
  earnedPoints: number;
  possiblePoints: number;
  formula: string;
}

export interface MatchResult {
  matchScore: number;
  matchingSkills: MatchedSkill[];
  missingSkills: MatchedSkill[];
  /** Resume skills that the job description did not ask for. */
  extraSkills: Array<{ name: string; category: string }>;
  strengths: string[];
  suggestions: string[];
  breakdown: ScoreBreakdown;
}

export function matchResumeToJob(resume: ParsedResume, job: ParsedJob): MatchResult {
  const resumeSkillNames = new Set(resume.skills.map((skill) => skill.name));
  const jobSkillNames = new Set(job.skills.map((skill) => skill.name));

  const matchingSkills: MatchedSkill[] = [];
  const missingSkills: MatchedSkill[] = [];

  for (const skill of job.skills) {
    const entry: MatchedSkill = {
      name: skill.name,
      category: skill.category,
      importance: skill.importance,
    };
    if (resumeSkillNames.has(skill.name)) matchingSkills.push(entry);
    else missingSkills.push(entry);
  }

  const requiredTotal = job.skills.filter((s) => s.importance === "required").length;
  const preferredTotal = job.skills.filter((s) => s.importance === "preferred").length;
  const requiredMatched = matchingSkills.filter((s) => s.importance === "required").length;
  const preferredMatched = matchingSkills.filter((s) => s.importance === "preferred").length;

  const earnedPoints = requiredMatched * REQUIRED_WEIGHT + preferredMatched * PREFERRED_WEIGHT;
  const possiblePoints = requiredTotal * REQUIRED_WEIGHT + preferredTotal * PREFERRED_WEIGHT;
  const matchScore = possiblePoints === 0 ? 0 : Math.round((earnedPoints / possiblePoints) * 1000) / 10;

  const breakdown: ScoreBreakdown = {
    requiredTotal,
    requiredMatched,
    preferredTotal,
    preferredMatched,
    requiredWeight: REQUIRED_WEIGHT,
    preferredWeight: PREFERRED_WEIGHT,
    earnedPoints,
    possiblePoints,
    formula:
      "(matched required x 1 + matched preferred x 0.5) / (total required x 1 + total preferred x 0.5) x 100",
  };

  return {
    matchScore,
    matchingSkills,
    missingSkills,
    extraSkills: resume.skills
      .filter((skill) => !jobSkillNames.has(skill.name))
      .map((skill) => ({ name: skill.name, category: skill.category })),
    strengths: buildStrengths(resume, matchingSkills, requiredTotal),
    suggestions: buildSuggestions(resume, missingSkills, matchScore),
    breakdown,
  };
}

/** Rule-based strengths — every item is backed by resume content. */
export function buildStrengths(
  resume: ParsedResume,
  matchingSkills: MatchedSkill[],
  requiredTotal: number,
): string[] {
  const strengths: string[] = [];
  const { sections, skills } = resume;
  const categories = new Set(skills.map((skill) => skill.category));

  if (skills.length >= 10) {
    strengths.push(`Broad technical skill coverage: ${skills.length} recognised skills detected.`);
  } else if (skills.length >= 5) {
    strengths.push(`Solid technical base: ${skills.length} recognised skills detected.`);
  }
  if (categories.has("Programming")) {
    strengths.push("Programming languages are clearly listed in the resume.");
  }
  if (categories.has("Data") || categories.has("Analytics")) {
    strengths.push("Data and analytics tooling is represented in the resume.");
  }
  if (categories.has("Machine Learning") || categories.has("Computer Vision")) {
    strengths.push("Machine learning / computer vision experience is mentioned.");
  }
  if (sections.projects.length >= 2) {
    strengths.push(`Project section is well developed (${sections.projects.length} lines of detail).`);
  }
  if (sections.experience.length > 0) {
    strengths.push("Work or internship experience is documented.");
  }
  if (sections.certifications.length > 0) {
    strengths.push("Certifications or courses are included.");
  }
  if (sections.education.length > 0) {
    strengths.push("Education details are present and easy to locate.");
  }
  if (resume.email && resume.phone) {
    strengths.push("Contact details (email and phone) are machine-readable.");
  }
  if (resume.links.length > 0) {
    strengths.push("Professional profile links (e.g. GitHub / LinkedIn) are included.");
  }
  if (requiredTotal > 0 && matchingSkills.length >= Math.ceil(requiredTotal * 0.6)) {
    strengths.push("Resume already covers most of the skills named in the job description.");
  }
  return strengths;
}

/** Rule-based improvement suggestions. Nothing here invents experience. */
export function buildSuggestions(
  resume: ParsedResume,
  missingSkills: MatchedSkill[],
  matchScore: number,
): string[] {
  const suggestions: string[] = [];
  const { sections } = resume;

  const missingRequired = missingSkills.filter((skill) => skill.importance === "required");
  if (missingRequired.length > 0) {
    suggestions.push(
      `The job description mentions ${missingRequired
        .map((skill) => skill.name)
        .join(", ")}, which were not detected in your resume. If you have genuinely used them, name them explicitly in your skills or project descriptions.`,
    );
  }
  const missingPreferred = missingSkills.filter((skill) => skill.importance === "preferred");
  if (missingPreferred.length > 0) {
    suggestions.push(
      `Preferred skills not detected: ${missingPreferred
        .map((skill) => skill.name)
        .join(", ")}. These are optional, so only add them if you can back them up with real work.`,
    );
  }
  if (sections.projects.length === 0) {
    suggestions.push(
      "No projects section was detected. Add a clearly titled Projects section so parsers and recruiters can find it.",
    );
  } else if (sections.projects.length < 4) {
    suggestions.push(
      "Expand project descriptions with the technologies used and a measurable outcome (accuracy, runtime, users, records processed).",
    );
  }
  if (sections.experience.length === 0) {
    suggestions.push(
      "No experience or internship section was detected. If you have internship, freelance or volunteer work, add it under a clear heading.",
    );
  }
  if (sections.certifications.length === 0) {
    suggestions.push(
      "No certifications or courses were detected. Listing relevant completed courses can strengthen an early-career resume.",
    );
  }
  if (!resume.phone || !resume.email) {
    suggestions.push("Make sure a plain-text email address and phone number appear near the top of the resume.");
  }
  if (resume.links.length === 0) {
    suggestions.push("Add a GitHub or LinkedIn link so reviewers can verify your project work.");
  }
  if (resume.wordCount < 200) {
    suggestions.push(
      "The extracted resume text is quite short. Check that the document is text-based and that key sections are not stored as images.",
    );
  }
  if (matchScore >= 80) {
    suggestions.push(
      "Alignment with this job description is already strong. Focus on reordering content so the most relevant skills appear first.",
    );
  }
  return suggestions;
}
