import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_analysis",
  title: "Get analysis report",
  description:
    "Fetch one full analysis report by id: match score, matching and missing skills, strengths, suggestions and the score breakdown.",
  inputSchema: { analysisId: z.string().uuid().describe("The analysis id from list_analyses.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ analysisId }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("analyses")
      .select("*, resumes(file_name, candidate_name), job_descriptions(title, company, description)")
      .eq("id", analysisId)
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "That analysis was not found." }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { analysis: data },
    };
  },
});
