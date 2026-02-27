// ════════════════════════════════════════════════════════════════════════════
// Email — Resend client + transactional email templates
// ════════════════════════════════════════════════════════════════════════════

import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}
const FROM = process.env.EMAIL_FROM ?? "SocialOptimizer <noreply@socialoptimizer.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://socialoptimizer.com";

// ─── Analysis complete ────────────────────────────────────────────────────────

interface AnalysisReadyOptions {
  to: string;
  username: string;
  platform: string;
  growthScore: number;
  niche: string;
  topInsight: string;        // single highest-impact weakness or opportunity
  reportId: string;
}

export async function sendAnalysisReady(opts: AnalysisReadyOptions) {
  const scoreColor = opts.growthScore >= 70 ? "#22c55e" : opts.growthScore >= 45 ? "#f59e0b" : "#ef4444";
  const reportUrl = `${APP_URL}/dashboard/analyze`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:32px 16px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">

    <div style="background:#1e1b4b;padding:28px 32px;">
      <div style="font-weight:800;font-size:20px;color:#818cf8;letter-spacing:-0.5px;">SocialOptimizer</div>
      <div style="color:#c7d2fe;font-size:13px;margin-top:4px;">Your analysis is ready</div>
    </div>

    <div style="padding:28px 32px;">
      <p style="font-size:15px;font-weight:600;color:#0f172a;margin:0 0 4px;">
        @${opts.username} on ${opts.platform.charAt(0).toUpperCase() + opts.platform.slice(1)}
      </p>
      <p style="font-size:13px;color:#64748b;margin:0 0 24px;">
        Niche detected: <strong>${opts.niche}</strong>
      </p>

      <div style="background:#f8fafc;border-radius:10px;padding:20px;text-align:center;margin-bottom:24px;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;margin-bottom:8px;">Growth Score</div>
        <div style="font-size:52px;font-weight:800;color:${scoreColor};line-height:1;">${opts.growthScore}</div>
        <div style="font-size:12px;color:#94a3b8;margin-top:4px;">out of 100</div>
      </div>

      <div style="background:#eff6ff;border-left:3px solid #4f46e5;border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:24px;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#4f46e5;font-weight:600;margin-bottom:4px;">Top opportunity</div>
        <div style="font-size:13px;color:#1e40af;">${opts.topInsight}</div>
      </div>

      <a href="${reportUrl}" style="display:block;background:#4f46e5;color:#fff;text-decoration:none;text-align:center;padding:13px 24px;border-radius:8px;font-weight:600;font-size:14px;">
        View full report →
      </a>
    </div>

    <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
      <p style="font-size:11px;color:#94a3b8;margin:0;">
        You're receiving this because you have analysis notifications enabled.
        <a href="${APP_URL}/dashboard/settings" style="color:#6366f1;">Manage preferences</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  return getResend().emails.send({
    from: FROM,
    to: opts.to,
    subject: `Your ${opts.platform} analysis is ready — Growth Score: ${opts.growthScore}/100`,
    html,
  });
}

// ─── Weekly digest ────────────────────────────────────────────────────────────

interface WeeklyDigestAccount {
  platform: string;
  username: string;
  growthScore: number;
  growthScoreDelta: number;
  avgEngagementRate: number;
  pendingActions: number;
}

interface WeeklyDigestOptions {
  to: string;
  accounts: WeeklyDigestAccount[];
}

export async function sendWeeklyDigest(opts: WeeklyDigestOptions) {
  if (opts.accounts.length === 0) return;

  const accountRows = opts.accounts
    .map((a) => {
      const deltaColor = a.growthScoreDelta >= 0 ? "#22c55e" : "#ef4444";
      const deltaStr = a.growthScoreDelta >= 0 ? `+${a.growthScoreDelta}` : `${a.growthScoreDelta}`;
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
            <span style="font-weight:600;">${a.platform.charAt(0).toUpperCase() + a.platform.slice(1)}</span>
            <span style="color:#94a3b8;"> @${a.username}</span>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:700;">${a.growthScore}</td>
          <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600;color:${deltaColor};">${deltaStr}</td>
          <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;color:#64748b;">${(a.avgEngagementRate * 100).toFixed(2)}%</td>
        </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:32px 16px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">

    <div style="background:#1e1b4b;padding:28px 32px;">
      <div style="font-weight:800;font-size:20px;color:#818cf8;">SocialOptimizer</div>
      <div style="color:#c7d2fe;font-size:13px;margin-top:4px;">Weekly performance digest</div>
    </div>

    <div style="padding:28px 32px;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;">
            <th style="text-align:left;padding-bottom:8px;">Account</th>
            <th style="text-align:right;padding-bottom:8px;">Score</th>
            <th style="text-align:right;padding-bottom:8px;">Δ</th>
            <th style="text-align:right;padding-bottom:8px;">Eng. Rate</th>
          </tr>
        </thead>
        <tbody>${accountRows}</tbody>
      </table>

      <a href="${APP_URL}/dashboard" style="display:block;background:#4f46e5;color:#fff;text-decoration:none;text-align:center;padding:13px 24px;border-radius:8px;font-weight:600;font-size:14px;margin-top:24px;">
        Open dashboard →
      </a>
    </div>

    <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
      <p style="font-size:11px;color:#94a3b8;margin:0;">
        Weekly digest every Monday.
        <a href="${APP_URL}/dashboard/settings" style="color:#6366f1;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  return getResend().emails.send({
    from: FROM,
    to: opts.to,
    subject: `Your weekly SocialOptimizer digest`,
    html,
  });
}
