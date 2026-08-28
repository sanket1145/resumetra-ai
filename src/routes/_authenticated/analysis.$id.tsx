import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Download, Lightbulb, Loader2, Printer, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoreGauge } from "@/components/ScoreGauge";
import { SkillTagList } from "@/components/SkillTag";
import { getAnalysis } from "@/lib/analyzer.functions";
import type { MatchedSkill, ScoreBreakdown } from "@/lib/nlp/matcher";

export const Route = createFileRoute("/_authenticated/analysis/$id")({
  head: () => ({
    meta: [
      { title: "Analysis Report — AI Resume Analyzer & Job Matcher" },
      {
        name: "description",
        content:
          "Full resume-to-job analysis: match score, matching and missing skills, strengths, and improvement suggestions.",
      },
      { property: "og:title", content: "Analysis Report — AI Resume Analyzer & Job Matcher" },
      {
        property: "og:description",
        content: "A transparent breakdown of how a resume compares with a target job description.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AnalysisDetail;
});

function AnalysisDetail() {
  const { id } = Route.useParams();
  const fetchAnalysis = useServerFn(getAnalysis);
  const { data, isPending, error } = useQuery({
    queryKey: ["analysis", id],
    queryFn: () => fetchAnalysis({ data: { id } }),
  });

  if (isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Analysis unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "That analysis could not be loaded."}
        </p>
        <Button className="mt-6" asChild>
          <Link to="/history">Back to history</Link>
        </Button>
      </div>
    );
  }

  const score = Number(data.match_score);
  const matching = (data.matching_skills ?? []) as MatchedSkill[];
  const missing = (data.missing_skills ?? []) as MatchedSkill[];
  const extra = (data.extra_skills ?? []) as Array<{ name: string; category: string }>;
  const strengths = (data.strengths ?? []) as string[];
  const suggestions = (data.suggestions ?? []) as string[];
  const breakdown = data.score_breakdown as ScoreBreakdown | null;
  const jobTitle = data.job_descriptions?.title ?? "Untitled role";
  const company = data.job_descriptions?.company ?? null;

  function downloadReport() {
    const lines = [
      "AI Resume Analyzer & Job Matcher — Analysis Report",
      "".padEnd(52, "="),
      "",
      `Role: ${jobTitle}${company ? ` at ${company}` : ""}`,
      `Resume: ${data.resumes?.file_name ?? "Resume"}`,
      `Candidate: ${data.resumes?.candidate_name ?? "Not detected"}`,
      `Email: ${data.resumes?.candidate_email ?? "Not detected"}`,
      `Phone: ${data.resumes?.candidate_phone ?? "Not detected"}`,
      `Generated: ${new Date(data.created_at).toLocaleString()}`,
      "",
      `Match score: ${score}%`,
      breakdown
        ? `Calculation: ${breakdown.earnedPoints} of ${breakdown.possiblePoints} weighted points (${breakdown.requiredMatched}/${breakdown.requiredTotal} required, ${breakdown.preferredMatched}/${breakdown.preferredTotal} preferred)`
        : "",
      "",
      `Matching skills (${matching.length}):`,
      ...matching.map((skill) => `  - ${skill.name} (${skill.importance})`),
      "",
      `Skills to add or highlight (${missing.length}):`,
      ...missing.map((skill) => `  - ${skill.name} (${skill.importance})`),
      "",
      `Additional resume skills (${extra.length}):`,
      ...extra.map((skill) => `  - ${skill.name}`),
      "",
      "Resume strengths:",
      ...strengths.map((item) => `  - ${item}`),
      "",
      `Areas for improvement (${data.suggestion_source === "llm" ? "AI generated" : "rule based"}):`,
      ...suggestions.map((item) => `  - ${item}`),
      "",
      data.llm_summary ? `Summary: ${data.llm_summary}` : "",
    ].filter((line) => line !== "");

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analysis-report-${id.slice(0, 8)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-label">Analysis report</p>
          <h1 className="mt-1 text-2xl font-semibold">{jobTitle}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {company ? `${company} · ` : ""}
            {data.resumes?.file_name ?? "Resume"} · {new Date(data.created_at).toLocaleString()}
          </p>
        </div>
        <div className="no-print flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" />
            Print
          </Button>
          <Button onClick={downloadReport}>
            <Download className="size-4" />
            Download report
          </Button>
        </div>
      </div>

      <section className="panel mt-8 flex flex-col items-center gap-8 p-6 sm:flex-row sm:items-center">
        <ScoreGauge score={score} />
        <div className="flex-1">
          <h2 className="text-lg font-semibold">How this score was calculated</h2>
          {breakdown ? (
            <>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {breakdown.requiredMatched} of {breakdown.requiredTotal} required skills matched (weight{" "}
                {breakdown.requiredWeight}) and {breakdown.preferredMatched} of {breakdown.preferredTotal}{" "}
                preferred skills matched (weight {breakdown.preferredWeight}).
              </p>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-4 font-mono text-xs">
                {breakdown.formula}
              </pre>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No breakdown was stored for this analysis.</p>
          )}
        </div>
      </section>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <section className="panel p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <CheckCircle2 className="size-4 text-success" />
            Matching skills ({matching.length})
          </h2>
          <div className="mt-4">
            <SkillTagList
              skills={matching.map((skill) => skill.name)}
              tone="matched"
              empty="No overlapping skills were detected."
            />
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <TriangleAlert className="size-4 text-warning" />
            Missing skills ({missing.length})
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Requested in the job description but not detected in the resume.
          </p>
          <div className="mt-4">
            <SkillTagList
              skills={missing.map((skill) => skill.name)}
              tone="missing"
              empty="Every job skill was found in the resume."
            />
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="text-lg font-semibold">Additional resume skills ({extra.length})</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Detected in the resume but not requested by this role.
          </p>
          <div className="mt-4">
            <SkillTagList
              skills={extra.map((skill) => skill.name)}
              tone="neutral"
              empty="No additional skills detected."
            />
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="text-lg font-semibold">Resume strengths</h2>
          {strengths.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No strengths were recorded.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm leading-relaxed">
              {strengths.map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="panel mt-6 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Lightbulb className="size-4 text-primary" />
          Areas for improvement
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.suggestion_source === "llm"
            ? "Generated by the language model from your extracted resume data."
            : "Generated from the rule-based analysis engine."}
        </p>
        {data.llm_summary ? (
          <p className="mt-4 rounded-lg bg-surface p-4 text-sm leading-relaxed">{data.llm_summary}</p>
        ) : null}
        <ol className="mt-4 space-y-3 text-sm leading-relaxed">
          {suggestions.map((item, index) => (
            <li key={`${index}-${item.slice(0, 12)}`} className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                {index + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="no-print mt-8 flex gap-2">
        <Button variant="outline" asChild>
          <Link to="/history">Back to history</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/matcher">Run another match</Link>
        </Button>
      </div>
    </div>
  );
}
