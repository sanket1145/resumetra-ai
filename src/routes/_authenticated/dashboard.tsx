import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3, Briefcase, FileText, Gauge, Loader2 } from "lucide-react";
import { getDashboardStats } from "@/lib/analyzer.functions";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AI Resume Analyzer & Job Matcher" },
      {
        name: "description",
        content: "Overview of your uploaded resumes, saved job descriptions and recent match scores.",
      },
      { property: "og:title", content: "Dashboard — AI Resume Analyzer & Job Matcher" },
      {
        property: "og:description",
        content: "Track resumes analyzed, job descriptions saved and your average match score.",
      },
    ],
  }),
  component: Dashboard,
});

function scoreTone(score: number) {
  if (score >= 75) return "text-success";
  if (score >= 45) return "text-warning";
  return "text-destructive";
}

function Dashboard() {
  const fetchStats = useServerFn(getDashboardStats);
  const { data, isPending, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetchStats({}),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Your resume analysis activity and most recent job matches.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/analyzer">Analyze a resume</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/matcher">Match a job</Link>
          </Button>
        </div>
      </div>

      {isPending ? (
        <div className="flex min-h-40 items-center justify-center">
          <Loader2 className="size-5 animate-spin text-primary" />
        </div>
      ) : null}

      {error ? (
        <p className="panel mt-8 p-6 text-sm text-destructive">
          {error instanceof Error ? error.message : "We could not load your dashboard."}
        </p>
      ) : null}

      {data ? (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Resumes" value={data.resumeCount} icon={FileText} hint="Documents analyzed" />
            <StatCard label="Job descriptions" value={data.jobCount} icon={Briefcase} hint="Roles saved" />
            <StatCard label="Analyses" value={data.analysisCount} icon={BarChart3} hint="Recent matches" />
            <StatCard
              label="Average score"
              value={`${data.averageScore}%`}
              icon={Gauge}
              hint="Across recent analyses"
            />
          </div>

          <section className="panel mt-8 overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-semibold">Recent analyses</h2>
              <Link to="/history" className="text-sm font-medium text-primary hover:underline">
                View all
              </Link>
            </div>
            {data.recent.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  No analyses yet. Upload a resume to get started.
                </p>
                <Button className="mt-4" asChild>
                  <Link to="/analyzer">Analyze a resume</Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {data.recent.map((row) => (
                  <li key={row.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {row.job_descriptions?.title ?? "Untitled role"}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {row.resumes?.file_name ?? "Resume"} ·{" "}
                        {new Date(row.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`font-display text-lg font-semibold tabular-nums ${scoreTone(Number(row.match_score))}`}
                    >
                      {Number(row.match_score)}%
                    </span>
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/analysis/$id" params={{ id: row.id }}>
                        Open
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
