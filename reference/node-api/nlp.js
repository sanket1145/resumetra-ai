const BASE = process.env.NLP_SERVICE_URL ?? "http://localhost:8000";

async function post(path, body) {
  const response = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`NLP service ${path} failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

export const parseResume = (text) => post("/parse-resume", { text });
export const parseJob = (text) => post("/parse-job", { text });
export const runMatch = (resumeText, jobText) =>
  post("/match", { resume_text: resumeText, job_text: jobText });

export async function extractText(buffer, fileName, mimeType) {
  const form = new FormData();
  form.append("file", new Blob([buffer], { type: mimeType }), fileName);
  const response = await fetch(`${BASE}/extract`, { method: "POST", body: form });
  if (!response.ok) {
    throw new Error(`NLP service /extract failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

/** Optional LLM pass for natural-language improvement suggestions. */
export async function llmSuggestions({ analysis, resume, job }) {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) return null;
  const response = await fetch(process.env.LLM_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.LLM_MODEL ?? "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a resume coach. Reply as JSON: {\"summary\": string, \"suggestions\": string[]}. Be specific and only use the supplied data.",
        },
        {
          role: "user",
          content: JSON.stringify({
            score: analysis.score,
            matching: analysis.matching_skills.map((s) => s.name),
            missing: analysis.missing_skills.map((s) => s.name),
            resumeSkills: resume.skills.map((s) => s.name),
            jobKeywords: job.keywords,
          }),
        },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!response.ok) return null;
  const payload = await response.json();
  try {
    return JSON.parse(payload.choices?.[0]?.message?.content ?? "null");
  } catch {
    return null;
  }
}
