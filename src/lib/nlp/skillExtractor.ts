import { SKILL_DICTIONARY, type SkillDefinition } from "./skills";
import { containsTerm } from "./textProcessor";

export interface ExtractedSkill {
  name: string;
  category: string;
}

/**
 * Dictionary-based skill extraction. Matching is case-insensitive, uses
 * whole-term boundaries and never returns duplicates.
 */
export function extractSkills(text: string): ExtractedSkill[] {
  const lower = text.toLowerCase();
  const found: ExtractedSkill[] = [];

  for (const skill of SKILL_DICTIONARY) {
    if (matchesSkill(lower, skill)) {
      found.push({ name: skill.name, category: skill.category });
    }
  }

  return found;
}

export function matchesSkill(loweredText: string, skill: SkillDefinition): boolean {
  const terms = [skill.name, ...(skill.aliases ?? [])];
  return terms.some((term) => containsTerm(loweredText, term));
}

export function groupByCategory(skills: ExtractedSkill[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  for (const skill of skills) {
    (grouped[skill.category] ??= []).push(skill.name);
  }
  return grouped;
}
