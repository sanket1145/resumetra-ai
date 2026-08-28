import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteAnalysis, listAnalyses } from "@/lib/analyzer.functions";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "Analysis History — AI Resume Analyzer & Job Matcher" },
      {
        name: "description",
        content: "Review every saved resume-to-job analysis with its match score and open the full report.",
      },
      { property: "og:title", content: "Analysis History — AI Resume Analyzer & Job Matcher" },
      {
        property: "og:description",
        content: "All of your past resume and job description comparisons in one place.",
      },
    ],
  }),
  component: History,
});

function scoreTone(score: number) {
  if (score >= 75) return "text-success";
  if (score >= 45) return "text-warning";
  return "text-destructive";
}

function History() {
  const fetchAnalyses = useServerFn(listAnalyses);
  const removeAnalysis = useServerFn(deleteAnalysis);
  const queryClient = useQueryClient();

  const { data, isPending, error } = useQuery({
    queryKey: ["analyses"],
    queryFn: () => fetchAnalyses({}),
  });

  const remove = useMutation({
    mutationFn: (id: string) => removeAnalysis({ data: { id } }),
    onSuccess: async () => {
      toast.success("Analysis deleted.");
      await queryClient.invalidateQueries({ queryKey: ["analyses"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : "Delete failed.");
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Analysis History</h1>
      <p className="mt-1 text-muted-foreground">Every saved comparison between a resume and a role.</p>

      {isPending ? (
        <div className="flex min-h-40 items-center justify-center">
          <Loader2 className="size-5 animate-spin text-primary" />
        </div>
      ) : null}

      {error ? (
        <p className="panel mt-6 p-6 text-sm text-destructive">
          {error instanceof Error ? error.message : "We could not load your history."}
        </p>
      ) : null}

      {data && data.length === 0 ? (
        <div className="panel mt-6 p-10 text-center">
          <p className="text-sm text-muted-foreground">No analyses saved yet.</p>
          <Button className="mt-4" asChild>
            <Link to="/matcher">Run your first match</Link>
          </Button>
        </div>
      ) : null}

      {data && data.length > 0 ? (
        <ul className="panel mt-6 divide-y divide-border">
          {data.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{row.job_descriptions?.title ?? "Untitled role"}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {row.job_descriptions?.company ? `${row.job_descriptions.company} · ` : ""}
                  {row.resumes?.file_name ?? "Resume"} · {new Date(row.created_at).toLocaleString()} ·{" "}
                  {row.suggestion_source === "llm" ? "AI suggestions" : "Rule-based suggestions"}
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
              <Button
                size="icon"
                variant="ghost"
                aria-label="Delete analysis"
                disabled={remove.isPending}
                onClick={() => remove.mutate(row.id)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
