import { createBrowserClient } from "@supabase/ssr";

// Singleton pattern — reuse one client instance in the browser.
// Generic omitted intentionally — add <Database> after running `npm run db:generate`.
let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
