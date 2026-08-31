// This wraps TanStack Start + React + Tailwind + tsconfig path aliases + a
// Nitro build target into one preconfigured plugin set. Don't add those
// plugins manually — it'll duplicate them and break the build.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
