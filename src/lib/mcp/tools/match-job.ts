import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { parseResume } from "@/lib/nlp/resumeParser";
import { parseJobDescription } from "@/lib/nlp/jobParser";
import { matchResumeToJob } from "@/lib/nlp/matcher";

export default defineTool({
  name: "match_resume_to_job",
  title: "Match a resume to a job description",
  description:
    "Score one of the user's stored resumes against a pasted job description, save the analysis, and return the match score, matching skills, missing skills, strengths and suggestions.",
  inputSchema: {
    resumeId: z.string().uuid().describe("Resume id from list_resumes."),
    jobDescription: z.string().min(40).max(60_000).describe("Full job description text."),
    title: z.string().max(160).optional().describe("Job title, if known."),
    company: z.string().max(160).optional().describe("Company name, if known."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ resumeId, jobDescription, title, company }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated." }], isError: true };
    }
    const userId = ctx.getUserId();
    if (!userId) {
      return { content: [{ type: "text", text: "Could not determine the signed-in user." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);

    const { data: resume, error: resumeError } = await supabase
      .from("resumes")
      .select("id, file_name, extracted_text")
      .eq("id", resumeId)
      .maybeSingle();
    if (resumeError) return { content: [{ type: "text", text: resumeError.message }], isError: true };
    if (!resume) return { content: [{ type: "text", text: "That resume was not found." }], isError: true };

    const parsedResume = parseResume(resume.extracted_text as string);
    const parsedJob = parseJobDescription(jobDescription, title);
    const resolvedTitle = (title?.trim() || parsedJob.title || "Untitled role").slice(0, 160);
    const result = matchResumeToJob(parsedResume, parsedJob);

    const { data: job, error: jobError } = await supabase
      .from("job_descriptions")
      .insert({
        user_id: userId,
        title: resolvedTitle,
        company: company?.trim() || null,
        description: jobDescription,
      })
      .select("id")
      .single();
    if (jobError || !job) {
      return {
        content: [{ type: "text", text: jobError?.message ?? "Could not save the job description." }],
        isError: true,
      };
    }

    if (parsedJob.skills.length > 0) {
      await supabase.from("job_skills").insert(
        parsedJob.skills.map((skill) => ({
          user_id: userId,
          job_id: job.id,
          skill_name: skill.name,
          skill_category: skill.category,
          importance: skill.importance,
        })),
      );
    }

    const { data: analysis, error: analysisError } = await supabase
      .from("analyses")
      .insert({
        user_id: userId,
        resume_id: resume.id,
        job_id: job.id,
        match_score: result.matchScore,
        matching_skills: result.matchingSkills as never,
        missing_skills: result.missingSkills as never,
        extra_skills: result.extraSkills as never,
        strengths: result.strengths,
        suggestions: result.suggestions,
        score_breakdown: result.breakdown as never,
        suggestion_source: "rules",
      })
      .select("id")
      .single();
    if (analysisError || !analysis) {
      return {
        content: [{ type: "text", text: analysisError?.message ?? "Could not save the analysis." }],
        isError: true,
      };
    }

    const payload = {
      analysisId: analysis.id,
      resumeFile: resume.file_name,
      jobTitle: resolvedTitle,
      matchScore: result.matchScore,
      matchingSkills: result.matchingSkills.map((s) => s.name),
      missingSkills: result.missingSkills.map((s) => s.name),
      strengths: result.strengths,
      suggestions: result.suggestions,
      breakdown: result.breakdown,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
