import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_resumes",
  title: "List resumes",
  description: "List the signed-in user's uploaded resumes with their ids, file names and candidate names.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).default(20).describe("Maximum number of resumes to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("resumes")
      .select("id, file_name, file_type, candidate_name, candidate_email, created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { resumes: data ?? [] },
    };
  },
});
