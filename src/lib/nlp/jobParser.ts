import { extractSkills, type ExtractedSkill } from "./skillExtractor";
import { normalizeWhitespace, toLines, wordCount } from "./textProcessor";

export type SkillImportance = "required" | "preferred";

export interface JobSkill extends ExtractedSkill {
  importance: SkillImportance;
}

export interface ParsedJob {
  title: string | null;
  skills: JobSkill[];
  keywords: string[];
  wordCount: number;
}

const REQUIRED_HINTS = [
  "required",
  "requirement",
  "must have",
  "must-have",
  "essential",
  "minimum qualification",
  "who you are",
  "what you need",
  "responsibilities",
  "skills",
  "qualifications",
];

const PREFERRED_HINTS = [
  "preferred",
  "nice to have",
  "nice-to-have",
  "good to have",
  "bonus",
  "plus",
  "desirable",
  "optional",
  "advantage",
];

const KEYWORD_HINTS = [
  "internship",
  "entry level",
  "fresher",
  "remote",
  "hybrid",
  "onsite",
  "full time",
  "part time",
  "bachelor",
  "master",
  "degree",
  "dashboard",
  "reporting",
  "pipeline",
  "automation",
  "stakeholder",
  "agile",
];

function isPreferredContext(line: string): boolean {
  const lower = line.toLowerCase();
  return PREFERRED_HINTS.some((hint) => lower.includes(hint));
}

function isRequiredContext(line: string): boolean {
  const lower = line.toLowerCase();
  return REQUIRED_HINTS.some((hint) => lower.includes(hint));
}

/**
 * Extracts skills from a job description and labels each one as required or
 * preferred based on the heading/bullet it appeared under. Anything found
 * outside a "preferred" block is treated as required.
 */
export function parseJobDescription(rawText: string, fallbackTitle?: string): ParsedJob {
  const text = normalizeWhitespace(rawText);
  const lines = toLines(text);

  const importanceBySkill = new Map<string, JobSkill>();
  let context: SkillImportance = "required";

  for (const line of lines) {
    if (isPreferredContext(line)) context = "preferred";
    else if (isRequiredContext(line)) context = "required";

    // A bullet that itself mentions "plus"/"preferred" overrides the block.
    const lineImportance: SkillImportance = isPreferredContext(line) ? "preferred" : context;

    for (const skill of extractSkills(line)) {
      const existing = importanceBySkill.get(skill.name);
      if (!existing) {
        importanceBySkill.set(skill.name, { ...skill, importance: lineImportance });
      } else if (existing.importance === "preferred" && lineImportance === "required") {
        // Required wins if the same skill appears in both contexts.
        importanceBySkill.set(skill.name, { ...skill, importance: "required" });
      }
    }
  }

  const lower = text.toLowerCase();
  const keywords = KEYWORD_HINTS.filter((keyword) => lower.includes(keyword));

  return {
    title: detectTitle(lines) ?? fallbackTitle ?? null,
    skills: Array.from(importanceBySkill.values()),
    keywords,
    wordCount: wordCount(text),
  };
}

function detectTitle(lines: string[]): string | null {
  const first = lines[0];
  if (!first) return null;
  const cleaned = first.replace(/^(job title|role|position)\s*[:\-]\s*/i, "").trim();
  if (cleaned.length >= 3 && cleaned.length <= 80) return cleaned;
  return null;
}
