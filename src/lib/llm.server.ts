/**
 * Optional LLM layer.
 *
 * The analyzer works entirely without this module: if no API key is
 * configured, or the provider call fails, the caller falls back to the
 * rule-based suggestions produced by the matcher.
 */

export interface LlmInput {
  candidateName: string | null;
  jobTitle: string;
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  strengths: string[];
  resumeSections: {
    education: number;
    experience: number;
    projects: number;
    certifications: number;
  };
}

export interface LlmOutput {
  suggestions: string[];
  summary: string | null;
}

const SYSTEM_PROMPT = `You are a careful resume reviewer.
You will receive structured data extracted from a candidate's resume and from a target job description.

Hard rules:
- Use ONLY the data provided. Never invent skills, experience, projects, certifications, employers or achievements.
- Never advise the candidate to claim a skill they do not have. Phrase skill gaps as "not detected in the resume".
- Be specific and actionable. No generic filler.

Reply with JSON only, in this exact shape:
{"suggestions": ["...", "..."], "summary": "one short professional summary suggestion the candidate could adapt"}
Return between 4 and 6 suggestions.`;

function resolveProvider() {
  const customKey = process.env["LLM_API_KEY"];
  if (customKey) {
    return {
      key: customKey,
      url: process.env["LLM_BASE_URL"] ?? "https://ai.gateway.lovable.dev/v1/chat/completions",
      model: process.env["LLM_MODEL"] ?? "google/gemini-3.7-flash",
    };
  }
  const managedKey = process.env["LOVABLE_API_KEY"];
  if (managedKey) {
    return {
      key: managedKey,
      url: "https://ai.gateway.lovable.dev/v1/chat/completions",
      model: process.env["LLM_MODEL"] ?? "google/gemini-3.7-flash",
    };
  }
  return null;
}

export async function generateLlmSuggestions(input: LlmInput): Promise<LlmOutput | null> {
  const provider = resolveProvider();
  if (!provider) return null;

  try {
    const response = await fetch(provider.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.key}`,
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify(input) },
        ],
      }),
    });

    if (!response.ok) {
      console.error("LLM request failed", response.status);
      return null;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return null;

    const jsonText = content.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(jsonText) as { suggestions?: unknown; summary?: unknown };
    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions.filter((item): item is string => typeof item === "string" && item.length > 0)
      : [];
    if (suggestions.length === 0) return null;

    return {
      suggestions,
      summary: typeof parsed.summary === "string" ? parsed.summary : null,
    };
  } catch (error) {
    console.error("LLM suggestion generation failed", error);
    return null;
  }
}
