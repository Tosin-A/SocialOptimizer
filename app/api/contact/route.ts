import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import nodemailer from "nodemailer";

const CONTACT_EMAIL = "cloutai.support@gmail.com";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email address").max(320),
  category: z.enum(["general", "billing", "technical", "partnership", "other"]),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000),
});

export type ContactPayload = z.infer<typeof contactSchema>;

const CATEGORY_LABELS: Record<ContactPayload["category"], string> = {
  general: "General Enquiry",
  billing: "Billing & Plans",
  technical: "Technical / Bug Report",
  partnership: "Partnership / Business",
  other: "Other",
};

let _transporter: nodemailer.Transporter | null = null;
function getTransporter(): nodemailer.Transporter {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return _transporter;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json(
        { data: null, error: firstError },
        { status: 400 }
      );
    }

    const { name, email, category, message } = parsed.data;
    const categoryLabel = CATEGORY_LABELS[category];
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeCategory = escapeHtml(categoryLabel);
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:32px 16px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:#000;padding:28px 32px;">
      <div style="font-size:18px;font-weight:700;color:#fff;">CLOUT</div>
      <div style="color:#c7d2fe;font-size:13px;margin-top:4px;">New contact form submission</div>
    </div>
    <div style="padding:28px 32px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#334155;">
        <tr>
          <td style="padding:8px 0;font-weight:600;color:#64748b;width:100px;">From</td>
          <td style="padding:8px 0;">${safeName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-weight:600;color:#64748b;">Email</td>
          <td style="padding:8px 0;"><a href="mailto:${safeEmail}" style="color:#4f46e5;text-decoration:none;">${safeEmail}</a></td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-weight:600;color:#64748b;">Category</td>
          <td style="padding:8px 0;">${safeCategory}</td>
        </tr>
      </table>
      <div style="margin-top:20px;padding:16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;margin-bottom:8px;font-weight:600;">Message</div>
        <div style="font-size:14px;color:#1e293b;line-height:1.6;">${safeMessage}</div>
      </div>
    </div>
    <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
      <p style="font-size:11px;color:#94a3b8;margin:0;">
        Reply directly to this email to respond to the sender.
      </p>
    </div>
  </div>
</body>
</html>`;

    const from = process.env.EMAIL_FROM
      ? process.env.EMAIL_FROM.includes("<")
        ? process.env.EMAIL_FROM
        : `CLOUT <${process.env.EMAIL_FROM}>`
      : `CLOUT <${process.env.GMAIL_USER}>`;

    await getTransporter().sendMail({
      from,
      to: CONTACT_EMAIL,
      replyTo: email,
      subject: `[CLOUT Contact] ${categoryLabel} — ${name}`,
      html,
    });

    return NextResponse.json(
      { data: { sent: true }, error: null },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { data: null, error: "Failed to send message. Try again later." },
      { status: 500 }
    );
  }
}
