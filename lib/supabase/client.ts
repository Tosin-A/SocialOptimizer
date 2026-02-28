import { createBrowserClient } from "@supabase/ssr";

// Singleton pattern — reuse one client instance in the browser.
// Generic omitted intentionally — add <Database> after running `npm run db:generate`.
let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // During build-time prerendering, env vars may not be available.
    // Return a placeholder that will be replaced on the client.
    if (!url || !key) {
      if (typeof window === "undefined") {
        // SSR/build — return a stub that won't be used for real requests.
        // The client component will re-render in the browser with real env vars.
        return createBrowserClient("https://placeholder.supabase.co", "placeholder");
      }
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }

    client = createBrowserClient(url, key);
  }
  return client;
}
