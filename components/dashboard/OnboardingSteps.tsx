import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Step {
  label: string;
  description: string;
  done: boolean;
  href?: string;
  cta?: string;
}

interface Props {
  hasAccounts: boolean;
  hasReports: boolean;
}

export default function OnboardingSteps({ hasAccounts, hasReports }: Props) {
  const steps: Step[] = [
    {
      label: "Connect a platform",
      description: "Link your TikTok, Instagram, YouTube, or Facebook account",
      done: hasAccounts,
      href: hasAccounts ? undefined : "/dashboard",
      cta: hasAccounts ? undefined : "Connect now",
    },
    {
      label: "Run your first analysis",
      description: "Fetch your last 50 posts and generate a full growth report",
      done: hasReports,
      href: hasReports ? undefined : "/dashboard/analyze",
      cta: hasReports ? undefined : "Run analysis",
    },
    {
      label: "Review your growth score",
      description: "See your score breakdown, insights, and prioritized roadmap",
      done: hasReports,
      href: hasReports ? "/dashboard/analyze" : undefined,
      cta: hasReports ? "View report" : undefined,
    },
  ];

  const currentStep = steps.findIndex((s) => !s.done);
  if (currentStep === -1) return null; // All done — don't show

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-semibold">Get started</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {currentStep + 1} of {steps.length} steps completed
          </p>
        </div>
        <div className="flex gap-1">
          {steps.map((s, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 w-10 rounded-full transition-all",
                s.done ? "bg-brand-500" : i === currentStep ? "bg-brand-500/40" : "bg-white/10"
              )}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-4 rounded-xl p-4 transition-all",
              step.done
                ? "opacity-50"
                : i === currentStep
                ? "bg-brand-600/10 border border-brand-600/20"
                : "opacity-40"
            )}
          >
            <div className="flex-shrink-0">
              {step.done ? (
                <CheckCircle2 className="w-5 h-5 text-brand-400" />
              ) : (
                <Circle className={cn("w-5 h-5", i === currentStep ? "text-brand-400" : "text-white/20")} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium", step.done ? "line-through text-muted-foreground" : "")}>
                {step.label}
              </p>
              {!step.done && (
                <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
              )}
            </div>
            {step.href && step.cta && (
              <Link
                href={step.href}
                className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors"
              >
                {step.cta}
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
