import { extractSkills, type ExtractedSkill } from "./skillExtractor";
import { normalizeWhitespace, toLines, wordCount } from "./textProcessor";

export interface ResumeSections {
  education: string[];
  experience: string[];
  projects: string[];
  certifications: string[];
  summary: string[];
}

export interface ParsedResume {
  name: string | null;
  email: string | null;
  phone: string | null;
  links: string[];
  skills: ExtractedSkill[];
  sections: ResumeSections;
  wordCount: number;
}

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const PHONE_RE = /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3,5}\)?[\s-]?)\d{3}[\s-]?\d{3,4}/;
const LINK_RE = /(?:https?:\/\/)?(?:www\.)?(?:github|linkedin|gitlab|kaggle)\.com\/[A-Za-z0-9._/-]+/gi;

const SECTION_HEADINGS: Array<{ key: keyof ResumeSections; patterns: string[] }> = [
  { key: "summary", patterns: ["summary", "objective", "profile", "about me"] },
  { key: "education", patterns: ["education", "academic", "qualification"] },
  {
    key: "experience",
    patterns: ["experience", "employment", "work history", "internship", "internships"],
  },
  { key: "projects", patterns: ["projects", "project work", "academic projects"] },
  {
    key: "certifications",
    patterns: ["certification", "certifications", "courses", "licenses", "achievements"],
  },
];

const ALL_HEADING_WORDS = SECTION_HEADINGS.flatMap((section) => section.patterns).concat([
  "skills",
  "technical skills",
  "languages",
  "interests",
  "hobbies",
  "declaration",
  "references",
  "contact",
]);

function headingKeyFor(line: string): keyof ResumeSections | "other" | null {
  const cleaned = line
    .replace(/[^A-Za-z& ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  if (!cleaned || cleaned.length > 40) return null;

  for (const section of SECTION_HEADINGS) {
    if (section.patterns.some((pattern) => cleaned === pattern || cleaned.startsWith(pattern))) {
      return section.key;
    }
  }
  if (ALL_HEADING_WORDS.some((word) => cleaned === word || cleaned.startsWith(word))) {
    return "other";
  }
  return null;
}

/** Splits the resume into recognised sections using heading detection. */
export function extractSections(text: string): ResumeSections {
  const sections: ResumeSections = {
    education: [],
    experience: [],
    projects: [],
    certifications: [],
    summary: [],
  };

  let current: keyof ResumeSections | "other" | null = null;
  for (const line of toLines(text)) {
    const heading = headingKeyFor(line);
    if (heading) {
      current = heading;
      continue;
    }
    if (current && current !== "other") {
      sections[current].push(line);
    }
  }
  return sections;
}

function guessName(text: string, email: string | null): string | null {
  const lines = toLines(text).slice(0, 8);
  for (const line of lines) {
    if (EMAIL_RE.test(line) || /\d/.test(line)) continue;
    const words = line.split(/\s+/);
    if (words.length < 2 || words.length > 5) continue;
    const looksLikeName = words.every((word) => /^[A-Z][a-zA-Z.'-]*$/.test(word) || /^[A-Z.]+$/.test(word));
    if (looksLikeName) return words.join(" ");
  }
  // Fall back to the local part of the email address, e.g. "priya.sharma".
  if (email) {
    const local = email.split("@")[0]?.replace(/\d+/g, "") ?? "";
    const parts = local.split(/[._-]+/).filter((part) => part.length > 1);
    if (parts.length >= 2) {
      return parts.map((part) => part[0]!.toUpperCase() + part.slice(1)).join(" ");
    }
  }
  return null;
}

export function parseResume(rawText: string): ParsedResume {
  const text = normalizeWhitespace(rawText);
  const email = text.match(EMAIL_RE)?.[0] ?? null;

  // Strip links first so profile URLs containing digits aren't read as phones.
  const withoutLinks = text.replace(LINK_RE, " ");
  const phoneMatch = withoutLinks.match(PHONE_RE)?.[0] ?? null;
  const phone = phoneMatch && phoneMatch.replace(/\D/g, "").length >= 10 ? phoneMatch.trim() : null;

  return {
    name: guessName(text, email),
    email,
    phone,
    links: Array.from(new Set(text.match(LINK_RE) ?? [])),
    skills: extractSkills(text),
    sections: extractSections(text),
    wordCount: wordCount(text),
  };
}
