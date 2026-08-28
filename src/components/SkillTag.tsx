import { Check, Minus, Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "matched" | "missing" | "neutral" | "preferred";

const TONES: Record<Tone, string> = {
  matched: "bg-success-soft text-success border-success/25",
  missing: "bg-warning-soft text-warning border-warning/25",
  neutral: "bg-secondary text-secondary-foreground border-border",
  preferred: "bg-accent text-accent-foreground border-primary/20",
};

export function SkillTag({
  name,
  tone = "neutral",
  note,
}: {
  name: string;
  tone?: Tone;
  note?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium",
        TONES[tone],
      )}
      title={note}
    >
      {tone === "matched" ? <Check className="size-3.5" /> : null}
      {tone === "missing" ? <Minus className="size-3.5" /> : null}
      {tone === "preferred" ? <Star className="size-3.5" /> : null}
      {name}
      {note ? <span className="text-xs opacity-70">{note}</span> : null}
    </span>
  );
}

export function SkillTagList({
  skills,
  tone,
  empty = "None detected.",
}: {
  skills: Array<string | { name: string; importance?: string }>;
  tone?: Tone;
  empty?: string;
}) {
  if (skills.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => {
        const name = typeof skill === "string" ? skill : skill.name;
        const importance = typeof skill === "string" ? undefined : skill.importance;
        return (
          <SkillTag
            key={name}
            name={name}
            tone={tone ?? (importance === "preferred" ? "preferred" : "neutral")}
            {...(importance ? { note: importance } : {})}
          />
        );
      })}
    </div>
  );
}
