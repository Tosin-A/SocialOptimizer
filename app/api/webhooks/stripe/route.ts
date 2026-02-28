// POST /api/webhooks/stripe — Handle Stripe webhook events
// Raw body is required for signature verification — do NOT use NextResponse.json() before reading body
import { NextRequest, NextResponse } from "next/server";
import { getStripe, planFromPriceId, analysesLimitForPlan } from "@/lib/stripe";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import type { PlanType } from "@/types";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook verification failed";
    console.error("Stripe webhook error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.user_id;
      const plan = session.metadata?.plan as PlanType | undefined;

      if (!userId || !plan) break;

      await supabase
        .from("users")
        .update({
          plan,
          analyses_limit: analysesLimitForPlan(plan),
          analyses_used: 0, // reset usage on upgrade
          stripe_customer_id: session.customer as string,
        })
        .eq("id", userId);

      await supabase.from("usage_events").insert({
        user_id: userId,
        event_type: "plan_upgraded",
        metadata: { plan, session_id: session.id },
      });

      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object;
      const userId = subscription.metadata?.user_id;
      if (!userId) break;

      const priceId = subscription.items.data[0]?.price?.id;
      const plan = priceId ? planFromPriceId(priceId) : null;
      if (!plan) break;

      // Only update if the subscription is active
      if (subscription.status === "active") {
        await supabase
          .from("users")
          .update({
            plan,
            analyses_limit: analysesLimitForPlan(plan),
          })
          .eq("id", userId);
      }

      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const userId = subscription.metadata?.user_id;
      if (!userId) break;

      // Downgrade to free
      await supabase
        .from("users")
        .update({
          plan: "free",
          analyses_limit: 3,
          analyses_used: 0,
        })
        .eq("id", userId);

      await supabase.from("usage_events").insert({
        user_id: userId,
        event_type: "plan_cancelled",
        metadata: { subscription_id: subscription.id },
      });

      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const customerId = invoice.customer as string;

      // Find the user and log the failure — email notification can be added here
      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (user) {
        await supabase.from("usage_events").insert({
          user_id: user.id,
          event_type: "payment_failed",
          metadata: { invoice_id: invoice.id, amount: invoice.amount_due },
        });
      }

      break;
    }

    default:
      // Unhandled event types — safe to ignore
      break;
  }

  return NextResponse.json({ received: true });
}
