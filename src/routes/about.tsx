import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — AI Resume Analyzer & Job Matcher" },
      {
        name: "description",
        content:
          "How the resume analyzer works: NLP-based text processing, dictionary skill extraction, transparent matching logic and optional LLM suggestions.",
      },
      { property: "og:title", content: "About — AI Resume Analyzer & Job Matcher" },
      {
        property: "og:description",
        content:
          "A full-stack resume analysis and job matching platform built on text processing, skill extraction and explainable scoring.",
      },
    ],
  }),
  component: About,
});

const STACK = ["React.js", "Node.js", "Python", "NLP", "LLM", "MySQL"];

const MODULES = [
  {
    title: "Resume Parsing",
    body: "PDF and DOCX documents are converted to plain text, then split into summary, education, experience, projects and certification sections using heading detection.",
  },
  {
    title: "Skill Extraction",
    body: "A configurable skill dictionary with aliases is matched case-insensitively against the text using whole-term boundaries, so C++, Node.js and Power BI are detected correctly.",
  },
  {
    title: "Job Description Analysis",
    body: "The job text is scanned line by line. Skills found under required-style headings are labelled required; skills under preferred / nice-to-have blocks are labelled preferred.",
  },
  {
    title: "Resume Matching",
    body: "Job skills are intersected with resume skills. Required matches are weighted 1.0 and preferred matches 0.5, and the full calculation is shown in the results view.",
  },
  {
    title: "Skill Gap Analysis",
    body: "Skills present in the job description but not detected in the resume are reported as gaps, with wording that never assumes the candidate lacks the skill.",
  },
  {
    title: "AI Suggestions",
    body: "An optional language-model layer turns the extracted data into written recommendations. When no key is configured or the request fails, rule-based suggestions are used instead.",
  },
];

function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <h1 className="text-3xl font-semibold">About this project</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
        A full-stack AI-assisted resume analysis and job matching platform that combines NLP-based text
        processing, skill extraction, transparent matching logic and optional LLM-generated suggestions.
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Technology stack</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {STACK.map((item) => (
            <span
              key={item}
              className="rounded-full border border-border bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground"
            >
              {item}
            </span>
          ))}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          The hosted version of this application runs the same parsing, extraction and scoring pipeline in
          TypeScript so it can be demonstrated without any local setup. The repository also ships the
          Node.js/Express API, the Python NLP service and the MySQL schema so the full three-tier
          architecture can be run locally.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Main modules</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {MODULES.map((module) => (
            <article key={module.title} className="panel p-5">
              <h3 className="font-semibold">{module.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{module.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10 panel p-6">
        <h2 className="text-xl font-semibold">Matching formula</h2>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-4 font-mono text-sm">
          {`score = (matched_required x 1.0 + matched_preferred x 0.5)
        / (total_required x 1.0 + total_preferred x 0.5) x 100`}
        </pre>
        <p className="mt-3 text-sm text-muted-foreground">
          No score is hard-coded or estimated. Every result view lists the exact counts used in the
          calculation.
        </p>
      </section>
    </div>
  );
}
