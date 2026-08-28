import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { SkillTagList } from "@/components/SkillTag";
import { analyzeJobDescription, listResumes, matchResume } from "@/lib/analyzer.functions";
import { parseJobDescription, type ParsedJob } from "@/lib/nlp/jobParser";
import { SAMPLE_JOB_DESCRIPTION, SAMPLE_JOB_TITLE } from "@/lib/sampleData";

export const Route = createFileRoute("/_authenticated/matcher")({
  validateSearch: z.object({ resumeId: z.string().uuid().optional() }),
  head: () => ({
    meta: [
      { title: "Job Matcher — AI Resume Analyzer & Job Matcher" },
      {
        name: "description",
        content:
          "Paste a job description to compare it against your resume and get a transparent match score with matching and missing skills.",
      },
      { property: "og:title", content: "Job Matcher — AI Resume Analyzer & Job Matcher" },
      {
        property: "og:description",
        content: "Compare your resume with any job description and see exactly where the gaps are.",
      },
    ],
  }),
  component: Matcher,
});

function Matcher() {
  const { resumeId: initialResumeId } = Route.useSearch();
  const navigate = useNavigate();
  const fetchResumes = useServerFn(listResumes);
  const saveJob = useServerFn(analyzeJobDescription);
  const runMatch = useServerFn(matchResume);

  const [resumeId, setResumeId] = useState(initialResumeId ?? "");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [useLlm, setUseLlm] = useState(true);
  const [preview, setPreview] = useState<ParsedJob | null>(null);
  const [busy, setBusy] = useState(false);

  const resumes = useQuery({ queryKey: ["resumes"], queryFn: () => fetchResumes({}) });

  useEffect(() => {
    if (!resumeId && resumes.data && resumes.data.length > 0) {
      setResumeId(resumes.data[0]!.id);
    }
  }, [resumes.data, resumeId]);

  useEffect(() => {
    if (description.trim().length < 40) {
      setPreview(null);
      return;
    }
    setPreview(parseJobDescription(description, title));
  }, [description, title]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!resumeId) {
      toast.error("Please choose a resume first.");
      return;
    }
    setBusy(true);
    try {
      const job = await saveJob({
        data: {
          description,
          ...(title.trim() ? { title: title.trim() } : {}),
          ...(company.trim() ? { company: company.trim() } : {}),
        },
      });
      const analysis = await runMatch({ data: { resumeId, jobId: job.jobId, useLlm } });
      toast.success("Match complete.");
      void navigate({ to: "/analysis/$id", params: { id: analysis.analysisId } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We could not run this match.");
    } finally {
      setBusy(false);
    }
  }

  const noResumes = resumes.data && resumes.data.length === 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Job Matcher</h1>
      <p className="mt-1 text-muted-foreground">
        Paste a job description and compare it with one of your analyzed resumes.
      </p>

      {noResumes ? (
        <div className="panel mt-6 p-6">
          <p className="text-sm text-muted-foreground">
            You have not analyzed a resume yet. Upload one first so it can be compared.
          </p>
          <Button className="mt-4" asChild>
            <Link to="/analyzer">Go to Resume Analyzer</Link>
          </Button>
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[3fr_2fr]">
        <form onSubmit={submit} className="panel space-y-5 p-6">
          <div className="space-y-2">
            <Label htmlFor="resume">Resume</Label>
            <select
              id="resume"
              value={resumeId}
              onChange={(event) => setResumeId(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select a resume</option>
              {(resumes.data ?? []).map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.candidate_name ? `${resume.candidate_name} — ` : ""}
                  {resume.file_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Job title</Label>
              <Input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Data Analyst"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company (optional)</Label>
              <Input
                id="company"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                placeholder="e.g. Northwind Labs"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Job description</Label>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                onClick={() => {
                  setDescription(SAMPLE_JOB_DESCRIPTION);
                  setTitle(SAMPLE_JOB_TITLE);
                }}
              >
                <Sparkles className="size-3.5" />
                Use sample
              </button>
            </div>
            <Textarea
              id="description"
              required
              rows={16}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Paste the full job description, including requirements and preferred qualifications."
            />
            <p className="text-xs text-muted-foreground">
              {description.trim().length} characters — at least 40 required.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-4">
            <div>
              <p className="text-sm font-medium">AI improvement suggestions</p>
              <p className="text-xs text-muted-foreground">
                When off, rule-based suggestions are used instead.
              </p>
            </div>
            <Switch checked={useLlm} onCheckedChange={setUseLlm} aria-label="Use AI suggestions" />
          </div>

          <Button type="submit" className="w-full" disabled={busy || !resumeId}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Run match
          </Button>
        </form>

        <aside className="panel h-fit p-6">
          <h2 className="text-lg font-semibold">Extracted job skills</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Updated live as you paste. Required skills are weighted twice as much as preferred ones.
          </p>
          {!preview ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Paste a job description to preview the detected keywords.
            </p>
          ) : (
            <div className="mt-5 space-y-5">
              <div>
                <h3 className="section-label">Required ({preview.requiredSkills.length})</h3>
                <div className="mt-2">
                  <SkillTagList skills={preview.requiredSkills.map((s) => s.name)} tone="neutral" />
                </div>
              </div>
              <div>
                <h3 className="section-label">Preferred ({preview.preferredSkills.length})</h3>
                <div className="mt-2">
                  <SkillTagList skills={preview.preferredSkills.map((s) => s.name)} tone="preferred" />
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
