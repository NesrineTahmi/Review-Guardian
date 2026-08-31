import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isValidAsin } from "@/lib/api";
import { cn } from "@/lib/utils";

export function AsinSearch({
  className,
  size = "lg",
  sampleAsins = [],
}: {
  className?: string;
  size?: "lg" | "sm";
  /** Real ASINs from the database to offer as one-click suggestions. */
  sampleAsins?: string[];
}) {
  const navigate = useNavigate();
  const [asin, setAsin] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = asin.trim().toUpperCase();
    if (!isValidAsin(value)) {
      setError("An ASIN is 10 characters, letters and digits — e.g. B08N5WRWNW.");
      return;
    }
    setError(null);
    navigate({ to: "/product/$asin", params: { asin: value } });
  }

  return (
    <form onSubmit={submit} className={cn("w-full", className)} noValidate>
      <div
        className={cn(
          "flex flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-soft sm:flex-row sm:items-center",
          size === "sm" && "p-1.5",
        )}
      >
        <div className="flex flex-1 items-center gap-2 pl-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            value={asin}
            onChange={(e) => {
              setAsin(e.target.value);
              setError(null);
            }}
            placeholder="Paste an Amazon ASIN (e.g. B08N5WRWNW)"
            aria-label="Amazon ASIN"
            className={cn(
              "border-0 bg-transparent px-0 shadow-none focus-visible:ring-0",
              size === "lg" ? "h-12 text-base" : "h-10",
            )}
          />
        </div>
        <Button type="submit" size={size === "lg" ? "lg" : "default"} className="rounded-xl">
          Summarize reviews
        </Button>
      </div>
      {error ? (
        <p className="mt-2 pl-1 text-sm text-destructive">{error}</p>
      ) : sampleAsins.length > 0 ? (
        <p className="mt-2 pl-1 text-sm text-muted-foreground">
          Try a product already in the database:{" "}
          {sampleAsins.map((sample, i) => (
            <span key={sample}>
              <button
                type="button"
                onClick={() => setAsin(sample)}
                className="font-medium text-primary-deep underline-offset-4 hover:underline"
              >
                {sample}
              </button>
              {i < sampleAsins.length - 1 ? ", " : "."}
            </span>
          ))}
        </p>
      ) : (
        <p className="mt-2 pl-1 text-sm text-muted-foreground">
          Paste any 10-character ASIN present in the database.
        </p>
      )}
    </form>
  );
}
