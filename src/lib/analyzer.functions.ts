import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { parseResume } from "./nlp/resumeParser";
import { parseJobDescription } from "./nlp/jobParser";
import { matchResumeToJob } from "./nlp/matcher";

const resumeInput = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().min(1).max(5 * 1024 * 1024),
  fileType: z.enum(["pdf", "docx"]),
  text: z.string().min(50, "The extracted resume text is too short to analyze.").max(200_000),
});

export const analyzeResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => resumeInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const parsed = parseResume(data.text);

    const { data: resume, error } = await supabase
      .from("resumes")
      .insert({
        user_id: userId,
        file_name: data.fileName.slice(0, 255),
        file_size: data.fileSize,
        file_type: data.fileType,
        extracted_text: data.text,
        candidate_name: parsed.name,
        candidate_email: parsed.email,
        candidate_phone: parsed.phone,
        sections: parsed.sections,
      })
      .select("id")
      .single();

    if (error || !resume) {
      console.error("Failed to store resume", error);
      throw new Error("We could not save this resume. Please try again.");
    }

    if (parsed.skills.length > 0) {
      const { error: skillsError } = await supabase.from("resume_skills").insert(
        parsed.skills.map((skill) => ({
          user_id: userId,
          resume_id: resume.id,
          skill_name: skill.name,
          skill_category: skill.category,
        })),
      );
      if (skillsError) console.error("Failed to store resume skills", skillsError);
    }

    return { resumeId: resume.id, parsed };
  });

const jobInput = z.object({
  title: z.string().max(160).optional(),
  company: z.string().max(160).optional(),
  description: z.string().min(40, "Please paste a longer job description.").max(60_000),
});

export const analyzeJobDescription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => jobInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const parsed = parseJobDescription(data.description, data.title);
    const title = (data.title?.trim() || parsed.title || "Untitled role").slice(0, 160);

    const { data: job, error } = await supabase
      .from("job_descriptions")
      .insert({
        user_id: userId,
        title,
        company: data.company?.trim() || null,
        description: data.description,
      })
      .select("id")
      .single();

    if (error || !job) {
      console.error("Failed to store job description", error);
      throw new Error("We could not save this job description. Please try again.");
    }

    if (parsed.skills.length > 0) {
      const { error: skillsError } = await supabase.from("job_skills").insert(
        parsed.skills.map((skill) => ({
          user_id: userId,
          job_id: job.id,
          skill_name: skill.name,
          skill_category: skill.category,
          importance: skill.importance,
        })),
      );
      if (skillsError) console.error("Failed to store job skills", skillsError);
    }

    return { jobId: job.id, parsed: { ...parsed, title } };
  });

const matchInput = z.object({
  resumeId: z.string().uuid(),
  jobId: z.string().uuid(),
  useLlm: z.boolean().default(true),
});

export const matchResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => matchInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const [{ data: resume }, { data: job }] = await Promise.all([
      supabase
        .from("resumes")
        .select("id, file_name, extracted_text, candidate_name")
        .eq("id", data.resumeId)
        .maybeSingle(),
      supabase
        .from("job_descriptions")
        .select("id, title, company, description")
        .eq("id", data.jobId)
        .maybeSingle(),
    ]);

    if (!resume) throw new Error("That resume could not be found.");
    if (!job) throw new Error("That job description could not be found.");

    const parsedResume = parseResume(resume.extracted_text);
    const parsedJob = parseJobDescription(job.description, job.title);
    const result = matchResumeToJob(parsedResume, parsedJob);

    let suggestions = result.suggestions;
    let suggestionSource: "rules" | "llm" = "rules";
    let llmSummary: string | null = null;

    if (data.useLlm) {
      const { generateLlmSuggestions } = await import("./llm.server");
      const llm = await generateLlmSuggestions({
        candidateName: parsedResume.name,
        jobTitle: job.title,
        matchScore: result.matchScore,
        matchingSkills: result.matchingSkills.map((skill) => skill.name),
        missingSkills: result.missingSkills.map((skill) => skill.name),
        strengths: result.strengths,
        resumeSections: {
          education: parsedResume.sections.education.length,
          experience: parsedResume.sections.experience.length,
          projects: parsedResume.sections.projects.length,
          certifications: parsedResume.sections.certifications.length,
        },
      });
      if (llm) {
        suggestions = llm.suggestions;
        suggestionSource = "llm";
        llmSummary = llm.summary;
      }
    }

    const { data: analysis, error } = await supabase
      .from("analyses")
      .insert({
        user_id: userId,
        resume_id: resume.id,
        job_id: job.id,
        match_score: result.matchScore,
        matching_skills: result.matchingSkills,
        missing_skills: result.missingSkills,
        extra_skills: result.extraSkills,
        strengths: result.strengths,
        suggestions,
        score_breakdown: result.breakdown,
        suggestion_source: suggestionSource,
        llm_summary: llmSummary,
      })
      .select("id")
      .single();

    if (error || !analysis) {
      console.error("Failed to store analysis", error);
      throw new Error("We could not save this analysis. Please try again.");
    }

    return { analysisId: analysis.id, suggestionSource };
  });

export const listResumes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("resumes")
      .select("id, file_name, file_size, file_type, candidate_name, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error("We could not load your resumes.");
    return data ?? [];
  });

export const listJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("job_descriptions")
      .select("id, title, company, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error("We could not load your job descriptions.");
    return data ?? [];
  });

export const listAnalyses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("analyses")
      .select(
        "id, match_score, created_at, suggestion_source, resumes(file_name), job_descriptions(title, company)",
      )
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      console.error(error);
      throw new Error("We could not load your analysis history.");
    }
    return data ?? [];
  });

export const getAnalysis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: analysis, error } = await context.supabase
      .from("analyses")
      .select(
        "*, resumes(file_name, candidate_name, candidate_email, candidate_phone, sections), job_descriptions(title, company, description)",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) {
      console.error(error);
      throw new Error("We could not load that analysis.");
    }
    if (!analysis) throw new Error("That analysis could not be found.");
    return analysis;
  });

export const deleteAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("analyses").delete().eq("id", data.id);
    if (error) throw new Error("We could not delete that analysis.");
    return { ok: true };
  });

export const deleteResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("resumes").delete().eq("id", data.id);
    if (error) throw new Error("We could not delete that resume.");
    return { ok: true };
  });

export const deleteJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("job_descriptions").delete().eq("id", data.id);
    if (error) throw new Error("We could not delete that job description.");
    return { ok: true };
  });

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [resumes, jobs, analyses] = await Promise.all([
      supabase.from("resumes").select("id", { count: "exact", head: true }),
      supabase.from("job_descriptions").select("id", { count: "exact", head: true }),
      supabase
        .from("analyses")
        .select("id, match_score, created_at, job_descriptions(title), resumes(file_name)")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const recent = analyses.data ?? [];
    const scores = recent.map((row) => Number(row.match_score));
    const averageScore =
      scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;

    return {
      resumeCount: resumes.count ?? 0,
      jobCount: jobs.count ?? 0,
      analysisCount: recent.length,
      averageScore,
      recent,
    };
  });
