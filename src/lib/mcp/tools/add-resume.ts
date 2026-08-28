import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { parseResume } from "@/lib/nlp/resumeParser";

export default defineTool({
  name: "add_resume_text",
  title: "Add a resume from text",
  description:
    "Store a resume from plain text for the signed-in user, parse contact details, sections and technical skills, and return the parsed result with the new resume id.",
  inputSchema: {
    fileName: z.string().min(1).max(255).describe("A label for this resume, e.g. 'my-resume.pdf'."),
    text: z.string().min(50).max(200_000).describe("The full plain-text resume content."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ fileName, text }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated." }], isError: true };
    }
    const userId = ctx.getUserId();
    if (!userId) {
      return { content: [{ type: "text", text: "Could not determine the signed-in user." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const parsed = parseResume(text);

    const { data: resume, error } = await supabase
      .from("resumes")
      .insert({
        user_id: userId,
        file_name: fileName.slice(0, 255),
        file_size: new TextEncoder().encode(text).length,
        file_type: fileName.toLowerCase().endsWith(".docx") ? "docx" : "pdf",
        extracted_text: text,
        candidate_name: parsed.name,
        candidate_email: parsed.email,
        candidate_phone: parsed.phone,
        sections: parsed.sections as never,
      })
      .select("id")
      .single();

    if (error || !resume) {
      return {
        content: [{ type: "text", text: error?.message ?? "Could not save this resume." }],
        isError: true,
      };
    }

    if (parsed.skills.length > 0) {
      await supabase.from("resume_skills").insert(
        parsed.skills.map((skill) => ({
          user_id: userId,
          resume_id: resume.id,
          skill_name: skill.name,
          skill_category: skill.category,
        })),
      );
    }

    const payload = {
      resumeId: resume.id,
      candidateName: parsed.name,
      candidateEmail: parsed.email,
      skills: parsed.skills.map((s) => s.name),
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
