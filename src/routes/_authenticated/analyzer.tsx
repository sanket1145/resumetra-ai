import { useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { FileUp, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkillTagList } from "@/components/SkillTag";
import { analyzeResume } from "@/lib/analyzer.functions";
import { extractResumeText, validateFile, type ResumeFileType } from "@/lib/extractText";
import { SAMPLE_RESUME_TEXT } from "@/lib/sampleData";
import { groupByCategory } from "@/lib/nlp/skillExtractor";
import type { ParsedResume } from "@/lib/nlp/resumeParser";

export const Route = createFileRoute("/_authenticated/analyzer")({
  head: () => ({
    meta: [
      { title: "Resume Analyzer — AI Resume Analyzer & Job Matcher" },
      {
        name: "description",
        content:
          "Upload a PDF or DOCX resume to extract contact details, technical skills, education, experience, projects and certifications.",
      },
      { property: "og:title", content: "Resume Analyzer — AI Resume Analyzer & Job Matcher" },
      {
        property: "og:description",
        content: "Extract structured information and skills from your resume in seconds.",
      },
    ],
  }),
  component: Analyzer,
});

type Result = { resumeId: string; parsed: ParsedResume };

function SectionList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="panel p-5">
      <h3 className="section-label">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No {title.toLowerCase()} section was detected in this resume.
        </p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm leading-relaxed">
          {items.slice(0, 12).map((item, index) => (
            <li key={`${title}-${index}`} className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Analyzer() {
  const navigate = useNavigate();
  const runAnalyze = useServerFn(analyzeResume);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function analyze(payload: {
    fileName: string;
    fileSize: number;
    fileType: ResumeFileType;
    text: string;
  }) {
    setBusy(true);
    setResult(null);
    try {
      const response = await runAnalyze({ data: payload });
      setResult(response as Result);
      toast.success("Resume analyzed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We could not analyze this resume.");
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(file: File) {
    const invalid = validateFile(file);
    if (invalid) {
      toast.error(invalid);
      return;
    }
    setFileLabel(file.name);
    setBusy(true);
    try {
      const { text, type } = await extractResumeText(file);
      await analyze({ fileName: file.name, fileSize: file.size, fileType: type, text });
    } catch (error) {
      setBusy(false);
      toast.error(error instanceof Error ? error.message : "We could not read this document.");
    }
  }

  function useSample() {
    setFileLabel("sample-resume.pdf");
    void analyze({
      fileName: "sample-resume.pdf",
      fileSize: SAMPLE_RESUME_TEXT.length,
      fileType: "pdf",
      text: SAMPLE_RESUME_TEXT,
    });
  }

  const grouped = result ? groupByCategory(result.parsed.skills) : {};

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Resume Analyzer</h1>
      <p className="mt-1 text-muted-foreground">
        Upload a PDF or DOCX resume. Text extraction happens in your browser, then the content is parsed
        into structured sections and skills.
      </p>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
        className={`panel mt-6 flex flex-col items-center justify-center gap-3 border-dashed p-10 text-center transition-colors ${
          dragging ? "border-primary bg-accent" : ""
        }`}
      >
        <span className="grid size-12 place-items-center rounded-full bg-accent text-accent-foreground">
          <FileUp className="size-5" />
        </span>
        <p className="font-medium">Drag and drop your resume here</p>
        <p className="text-sm text-muted-foreground">PDF or DOCX, up to 5 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
            event.target.value = "";
          }}
        />
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <Button onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Choose file
          </Button>
          <Button variant="outline" onClick={useSample} disabled={busy}>
            <Sparkles className="size-4" />
            Use sample resume
          </Button>
        </div>
        {fileLabel ? <p className="text-sm text-muted-foreground">{fileLabel}</p> : null}
      </div>

      {result ? (
        <div className="mt-10 space-y-6">
          <section className="panel p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">
                  {result.parsed.name ?? "Candidate details"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {result.parsed.email ?? "Email not detected"} ·{" "}
                  {result.parsed.phone ?? "Phone not detected"} · {result.parsed.wordCount} words
                </p>
                {result.parsed.links.length > 0 ? (
                  <p className="mt-1 break-all text-sm text-muted-foreground">
                    {result.parsed.links.join(" · ")}
                  </p>
                ) : null}
              </div>
              <Button
                onClick={() =>
                  void navigate({ to: "/matcher", search: { resumeId: result.resumeId } })
                }
              >
                Match against a job
              </Button>
            </div>
          </section>

          <section className="panel p-6">
            <h2 className="text-lg font-semibold">
              Technical skills detected ({result.parsed.skills.length})
            </h2>
            {result.parsed.skills.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No skills from the dictionary were detected. Consider adding a dedicated skills section.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {Object.entries(grouped).map(([category, names]) => (
                  <div key={category}>
                    <h3 className="section-label">{category}</h3>
                    <div className="mt-2">
                      <SkillTagList skills={names} tone="neutral" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="grid gap-5 md:grid-cols-2">
            <SectionList title="Summary" items={result.parsed.sections.summary} />
            <SectionList title="Education" items={result.parsed.sections.education} />
            <SectionList title="Experience" items={result.parsed.sections.experience} />
            <SectionList title="Projects" items={result.parsed.sections.projects} />
            <SectionList title="Certifications" items={result.parsed.sections.certifications} />
          </div>

          <p className="text-sm text-muted-foreground">
            This resume is saved to your account. See it any time in{" "}
            <Link to="/history" className="font-medium text-primary hover:underline">
              Analysis History
            </Link>
            .
          </p>
        </div>
      ) : null}
    </div>
  );
}
