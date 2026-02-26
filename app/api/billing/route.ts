// POST /api/billing — Stripe checkout + billing portal, dispatched by action field
// { action: "checkout", plan: "pro" }  → creates Checkout session
// { action: "portal" }                 → creates billing portal session
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { stripe, PLANS } from "@/lib/stripe";
import { z } from "zod";

const BillingSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("checkout"), plan: z.enum(["starter", "pro", "agency"]) }),
  z.object({ action: z.literal("portal") }),
]);

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = BillingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const serviceClient = getSupabaseServiceClient();
  const { data: dbUser } = await serviceClient
    .from("users")
    .select("id, stripe_customer_id, plan")
    .eq("auth_id", user.id)
    .single();

  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // ── Portal ────────────────────────────────────────────────────────────────────
  if (parsed.data.action === "portal") {
    if (!dbUser.stripe_customer_id) {
      return NextResponse.json({ error: "No billing account found" }, { status: 404 });
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: dbUser.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
    });
    return NextResponse.json({ url: session.url });
  }

  // ── Checkout ──────────────────────────────────────────────────────────────────
  const { plan } = parsed.data;
  if (dbUser.plan === plan) {
    return NextResponse.json({ error: "Already on this plan" }, { status: 409 });
  }

  const planConfig = PLANS[plan];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  let customerId = dbUser.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: dbUser.id, auth_id: user.id },
    });
    customerId = customer.id;
    await serviceClient
      .from("users")
      .update({ stripe_customer_id: customerId })
      .eq("id", dbUser.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: planConfig.stripe_price_id, quantity: 1 }],
    success_url: `${appUrl}/dashboard/settings?upgraded=${plan}`,
    cancel_url: `${appUrl}/dashboard/settings?checkout=cancelled`,
    metadata: { user_id: dbUser.id, plan },
    subscription_data: { metadata: { user_id: dbUser.id, plan } },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
