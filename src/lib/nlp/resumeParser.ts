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
  {
    key: "summary",
    patterns: [
      "summary",
      "professional summary",
      "career summary",
      "executive summary",
      "summary of qualifications",
      "objective",
      "career objective",
      "professional objective",
      "profile",
      "professional profile",
      "career profile",
      "about me",
      "about",
      "overview",
      "professional overview",
      "personal statement",
    ],
  },
  {
    key: "education",
    patterns: ["education", "educational background", "academic", "academics", "qualification", "qualifications"],
  },
  {
    key: "experience",
    patterns: [
      "experience",
      "professional experience",
      "work experience",
      "employment",
      "employment history",
      "work history",
      "internship",
      "internships",
      "internship experience",
    ],
  },
  { key: "projects", patterns: ["projects", "project work", "academic projects", "personal projects", "key projects"] },
  {
    key: "certifications",
    patterns: [
      "certification",
      "certifications",
      "courses",
      "coursework",
      "licenses",
      "achievements",
      "awards",
      "honors",
      "training",
    ],
  },
];

const OTHER_HEADING_WORDS = [
  "skills",
  "technical skills",
  "core competencies",
  "competencies",
  "languages",
  "tools",
  "technologies",
  "interests",
  "hobbies",
  "extracurricular",
  "activities",
  "declaration",
  "references",
  "publications",
  "contact",
  "contact details",
  "personal details",
  "volunteer experience",
];

/**
 * A line is treated as a heading only when it looks like one: short, not a
 * sentence, and either fully upper case, title case, or ending in a colon.
 */
function looksLikeHeading(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 45) return false;
  const words = trimmed.replace(/[:\-–—|]+$/g, "").trim().split(/\s+/);
  if (words.length > 5) return false;
  if (/[.,;]$/.test(trimmed)) return false;
  const letters = trimmed.replace(/[^A-Za-z]/g, "");
  if (letters.length < 3) return false;
  const isUpper = letters === letters.toUpperCase();
  const isTitleCase = words.every((word) => !/^[a-z]/.test(word));
  return isUpper || isTitleCase || /[:]$/.test(trimmed);
}

function matchesPattern(cleaned: string, pattern: string): boolean {
  if (cleaned === pattern) return true;
  // Boundary-aware containment so "professional summary" and
  // "career objective" both resolve to the summary section.
  return new RegExp(`(^|[^a-z])${pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`).test(cleaned);
}

function headingKeyFor(line: string): keyof ResumeSections | "other" | null {
  if (!looksLikeHeading(line)) return null;
  const cleaned = line
    .replace(/[^A-Za-z& ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  if (!cleaned || cleaned.length > 45) return null;

  // Longer, more specific patterns win (e.g. "work experience" over "work").
  let best: { key: keyof ResumeSections | "other"; length: number } | null = null;
  for (const section of SECTION_HEADINGS) {
    for (const pattern of section.patterns) {
      if (matchesPattern(cleaned, pattern) && (!best || pattern.length > best.length)) {
        best = { key: section.key, length: pattern.length };
      }
    }
  }
  for (const word of OTHER_HEADING_WORDS) {
    if (matchesPattern(cleaned, word) && (!best || word.length > best.length)) {
      best = { key: "other", length: word.length };
    }
  }
  return best ? best.key : null;
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

/** Finds the first plausible phone number (10-15 digits, common separators). */
function findPhone(text: string): string | null {
  const candidates = text.match(PHONE_RE) ?? [];
  for (const candidate of candidates) {
    const digits = candidate.replace(/\D/g, "");
    if (digits.length >= 10 && digits.length <= 15) return candidate.trim().replace(/^[-–—|:,\s]+/, "");
  }
  return null;
}



export function parseResume(rawText: string): ParsedResume {
  const text = normalizeWhitespace(rawText);
  const email = text.match(EMAIL_RE)?.[0] ?? null;

  // Strip links and email addresses first so digits inside them aren't read as
  // phone numbers, then look for any candidate run of 10-15 digits.
  const withoutLinks = text.replace(LINK_RE, " ").replace(/[\w.+-]+@[\w.-]+/g, " ");
  const phone = findPhone(withoutLinks);


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
