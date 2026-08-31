import { Link } from "@tanstack/react-router";
import { Leaf } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
            <Leaf className="size-5" />
          </span>
          <span className="font-display text-lg font-semibold">Review Guardian</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <a href="/#services" className="transition-colors hover:text-primary-deep">
            Services
          </a>
          <a href="/#how" className="transition-colors hover:text-primary-deep">
            How it works
          </a>
          <a href="/#search" className="font-medium text-primary-deep">
            Analyze a product
          </a>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-secondary/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Review Guardian — review intelligence for Amazon shoppers.</p>
        <p>Not affiliated with Amazon.</p>
      </div>
    </footer>
  );
}
