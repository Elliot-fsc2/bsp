import nodemailer from "nodemailer";

type MailInput = { to: string; subject: string; html: string };

function configuredTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user, pass },
  });
}

export async function sendSystemEmail({ to, subject, html }: MailInput) {
  const transporter = configuredTransport();
  if (!transporter) {
    console.info(`[email skipped] SMTP not configured: ${subject} -> ${to}`);
    return { delivered: false, reason: "SMTP not configured" };
  }
  try {
    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM || "DeMolay Leadership Pathway <no-reply@localhost>",
      to,
      subject,
      html,
    });
    return { delivered: true, messageId: result.messageId };
  } catch (error) {
    console.error("Unable to send system email", error);
    return { delivered: false, reason: "SMTP delivery failed" };
  }
}

function template(title: string, body: string) {
  return `<div style="font-family:Arial,sans-serif;background:#f4f0e6;padding:28px;color:#112c46"><div style="max-width:620px;margin:auto;background:#fff;border-radius:18px;overflow:hidden"><div style="background:#123b6d;padding:24px;color:#fff"><p style="letter-spacing:2px;text-transform:uppercase;font-size:11px;color:#e3c772;margin:0">DeMolay Leadership Pathway</p><h1 style="margin:8px 0 0;font-size:28px">${title}</h1></div><div style="padding:28px;font-size:16px;line-height:1.65">${body}<p style="margin-top:28px;color:#667085;font-size:13px">This is an automated message from the DeMolay Leadership Pathway LMS.</p></div></div></div>`;
}

export async function sendRegistrationReceivedEmail(name: string, email: string) {
  return sendSystemEmail({
    to: email,
    subject: "Your DeMolay Leadership Pathway registration was received",
    html: template("Registration received", `<p>Dear ${name},</p><p>Your account has been created successfully. Please sign in with the email and password you selected, then submit your registration receipt and payment reference number.</p><p>After your payment is verified by the leadership council, you will receive another email and your Level 1 study window will open.</p>`),
  });
}

export async function sendPaymentVerifiedEmail(
  name: string,
  email: string,
  purpose: string = "registration",
) {
  const messages: Record<string, { subject: string; title: string; body: string }> = {
    registration: {
      subject: "Your DeMolay registration payment has been verified",
      title: "Payment verified",
      body: `<p>Dear ${name},</p><p>Your registration payment has been verified by the leadership council. Your DeMolay Leadership Pathway account is active and Level 1 is now available.</p><p>Sign in, complete the welcome guide if prompted, and begin your study plan.</p>`,
    },
    exam_retake: {
      subject: "Your exam retake payment has been verified",
      title: "Retake unlocked",
      body: `<p>Dear ${name},</p><p>Your exam retake payment has been verified. Your next exam attempt is now unlocked. Sign in when you are ready to sit the exam again.</p>`,
    },
    reinstatement: {
      subject: "Your platform access has been restored",
      title: "Access restored",
      body: `<p>Dear ${name},</p><p>Your payment has been verified and access to the DeMolay Leadership Pathway platform has been restored. You can continue from your current level.</p>`,
    },
  };
  const message = messages[purpose] ?? messages.registration;
  return sendSystemEmail({ to: email, subject: message.subject, html: template(message.title, message.body) });
}
