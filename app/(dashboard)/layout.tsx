import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";

// Async auth check extracted so the outer layout can be synchronous.
// This lets Suspense render its fallback immediately instead of blocking
// on getUser() — eliminating the blank dark screen on hard navigations
// (e.g. email confirmation callback → /dashboard).
async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <DashboardShell user={user}>{children}</DashboardShell>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
        </div>
      }
    >
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </Suspense>
  );
}
