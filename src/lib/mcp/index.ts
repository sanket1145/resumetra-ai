import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listResumesTool from "./tools/list-resumes";
import listAnalysesTool from "./tools/list-analyses";
import getAnalysisTool from "./tools/get-analysis";
import matchJobTool from "./tools/match-job";
import addResumeTool from "./tools/add-resume";

// The OAuth issuer must be the direct Supabase host; the project ref is the only
// value that survives publish unchanged and Vite inlines it at build time.
const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "resume-matcher-pro",
  title: "Resume Matcher Pro",
  version: "0.1.0",
  instructions:
    "Tools for AI Resume Analyzer & Job Matcher. Use `list_resumes` to find a stored resume, `add_resume_text` to store a new one from plain text, `match_resume_to_job` to score a resume against a job description, and `list_analyses` / `get_analysis` to read saved reports. All tools act as the signed-in user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listResumesTool, addResumeTool, matchJobTool, listAnalysesTool, getAnalysisTool],
});
