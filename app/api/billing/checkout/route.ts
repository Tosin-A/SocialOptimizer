// POST /api/billing/checkout — Create a Stripe Checkout session
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { getStripe, PLANS } from "@/lib/stripe";
import { z } from "zod";
import type { PlanType } from "@/types";

const CheckoutSchema = z.object({
  plan: z.enum(["starter", "pro", "agency"]),
});

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { plan } = parsed.data;
  const planConfig = PLANS[plan];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const serviceClient = getSupabaseServiceClient();
  const { data: dbUser } = await serviceClient
    .from("users")
    .select("id, stripe_customer_id, plan")
    .eq("auth_id", user.id)
    .single();

  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Don't let them buy the plan they're already on
  if (dbUser.plan === plan) {
    return NextResponse.json({ error: "Already on this plan" }, { status: 409 });
  }

  // Retrieve or create Stripe customer
  let customerId = dbUser.stripe_customer_id;
  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: user.email,
      metadata: { user_id: dbUser.id, auth_id: user.id },
    });
    customerId = customer.id;
    await serviceClient
      .from("users")
      .update({ stripe_customer_id: customerId })
      .eq("id", dbUser.id);
  }

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: planConfig.stripe_price_id, quantity: 1 }],
    success_url: `${appUrl}/dashboard/settings?upgraded=${plan}`,
    cancel_url: `${appUrl}/dashboard/settings?checkout=cancelled`,
    metadata: { user_id: dbUser.id, plan },
    subscription_data: {
      metadata: { user_id: dbUser.id, plan },
    },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
