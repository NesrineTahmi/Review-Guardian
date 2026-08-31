// Generic runtime error reporter for the React error boundary in __root.tsx.
// Wire this up to whatever error-tracking service you use (Sentry, etc.) —
// for now it just logs, which is all that's needed locally/in dev.

export function reportRuntimeError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  console.error("[error-boundary]", message, { stack, route: window.location.pathname, ...context });
}
