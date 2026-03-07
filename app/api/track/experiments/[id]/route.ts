import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ApiResponse, Experiment } from "@/types";

const UpdateSchema = z.object({
  status: z.enum(["draft", "running", "completed", "cancelled"]).optional(),
  outcome: z.string().max(1000).optional(),
  result_metrics: z.record(z.number()).optional(),
  tagged_post_ids: z.array(z.string()).optional(),
  end_date: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Experiment>>> {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });

  const { data: userData } = await supabase.from("users").select("id").eq("auth_id", user.id).single();
  if (!userData) return NextResponse.json({ data: null, error: "User not found" }, { status: 404 });

  const { data } = await supabase
    .from("experiments")
    .select("*")
    .eq("id", id)
    .eq("user_id", userData.id)
    .single();

  if (!data) return NextResponse.json({ data: null, error: "Experiment not found" }, { status: 404 });
  return NextResponse.json({ data, error: null });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Experiment>>> {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ data: null, error: "Invalid input" }, { status: 400 });

  const { data: userData } = await supabase.from("users").select("id").eq("auth_id", user.id).single();
  if (!userData) return NextResponse.json({ data: null, error: "User not found" }, { status: 404 });

  const updates: Record<string, unknown> = {};
  if (parsed.data.status) updates.status = parsed.data.status;
  if (parsed.data.outcome) updates.outcome = parsed.data.outcome;
  if (parsed.data.result_metrics) updates.result_metrics = parsed.data.result_metrics;
  if (parsed.data.tagged_post_ids) updates.tagged_post_ids = parsed.data.tagged_post_ids;
  if (parsed.data.end_date) updates.end_date = parsed.data.end_date;

  const { data, error } = await supabase
    .from("experiments")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userData.id)
    .select()
    .single();

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 });

  // Create annotation if completed
  if (parsed.data.status === "completed") {
    await supabase.from("score_annotations").insert({
      user_id: userData.id,
      report_id: null,
      experiment_id: id,
      annotation_type: "experiment_end",
      label: `Completed: ${data.name}`,
      date: new Date().toISOString(),
    });
  }

  return NextResponse.json({ data, error: null });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });

  const { data: userData } = await supabase.from("users").select("id").eq("auth_id", user.id).single();
  if (!userData) return NextResponse.json({ data: null, error: "User not found" }, { status: 404 });

  const { error } = await supabase
    .from("experiments")
    .delete()
    .eq("id", id)
    .eq("user_id", userData.id);

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  return NextResponse.json({ data: null, error: null });
}
