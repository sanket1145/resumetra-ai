import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, GitCompare, Layers, ScanSearch, Sparkles, Target, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Resume Analyzer & Job Matcher" },
      {
        name: "description",
        content:
          "Analyze your resume, compare it with job descriptions, identify skill gaps, and get actionable improvement insights.",
      },
      { property: "og:title", content: "AI Resume Analyzer & Job Matcher" },
      {
        property: "og:description",
        content:
          "Upload a PDF or DOCX resume, paste a job description, and get a transparent match score with matching skills, skill gaps and improvement suggestions.",
      },
    ],
  }),
  component: Index,
});

const FEATURES = [
  {
    icon: ScanSearch,
    title: "Resume Analysis",
    body: "Extract skills, education, experience, projects and certifications from your resume.",
  },
  {
    icon: GitCompare,
    title: "Job Matching",
    body: "Compare your resume against a target job description.",
  },
  {
    icon: Target,
    title: "Skill Gap Analysis",
    body: "Identify matching and missing skills and understand where your resume can improve.",
  },
];

const STEPS = [
  { icon: Upload, title: "Upload Resume", body: "PDF or DOCX. Text is extracted in your browser." },
  { icon: FileText, title: "Add Job Description", body: "Paste the role you are targeting." },
  { icon: Layers, title: "Analyze", body: "Skills are extracted and compared side by side." },
  { icon: Sparkles, title: "Review Results", body: "Score, gaps, strengths and suggestions." },
];

function Index() {
  return (
    <div>
      <section className="bg-gradient-hero">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" /> Transparent, explainable matching
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
            AI Resume Analyzer &amp; Job Matcher
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Analyze your resume, compare it with job descriptions, identify skill gaps, and get actionable
            improvement insights.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/analyzer">Analyze My Resume</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/matcher">Try Job Matcher</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="panel p-6">
              <span className="grid size-11 place-items-center rounded-lg bg-accent text-accent-foreground">
                <feature.icon className="size-5" />
              </span>
              <h2 className="mt-4 text-lg font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <p className="mt-2 text-muted-foreground">
            Four steps from an uploaded document to an exportable report.
          </p>
          <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="panel p-5">
                <div className="flex items-center gap-3">
                  <span className="grid size-8 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <step.icon className="size-4 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
