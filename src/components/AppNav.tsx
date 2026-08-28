import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { FileSearch, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/analyzer", label: "Resume Analyzer" },
  { to: "/matcher", label: "Job Matcher" },
  { to: "/history", label: "Analysis History" },
  { to: "/about", label: "About" },
] as const;

export function AppNav() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    void navigate({ to: "/" });
  }

  return (
    <header className="no-print sticky top-0 z-40 border-b border-border bg-card/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-gradient-accent text-primary-foreground">
            <FileSearch className="size-5" />
          </span>
          <span className="font-display text-base font-semibold">AI Resume Analyzer</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {!loading && user ? (
            <>
              <span className="hidden max-w-[160px] truncate text-sm text-muted-foreground lg:block">
                {user.email}
              </span>
              <Button variant="outline" size="sm" onClick={() => void signOut()}>
                <LogOut className="size-4" />
                Sign out
              </Button>
            </>
          ) : null}
          {!loading && !user ? (
            <Button size="sm" asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Toggle navigation"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {open ? (
        <nav className="border-t border-border bg-card px-4 pb-3 md:hidden">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
