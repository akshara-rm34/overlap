import { logger } from 'firebase-functions';
import { defineSecret, defineString } from 'firebase-functions/params';
import nodemailer from 'nodemailer';

// "resend" | "gmail" | "console". "console" only works in the emulator and logs the email instead.
export const EMAIL_PROVIDER = defineString('EMAIL_PROVIDER', { default: 'console' });
export const EMAIL_FROM = defineString('EMAIL_FROM', { default: 'Overlap <onboarding@resend.dev>' });
// Gmail address the app password belongs to (gmail provider only).
export const GMAIL_USER = defineString('GMAIL_USER', { default: '' });
// Resend API key or Gmail app password, depending on the provider.
export const EMAIL_SECRET = defineSecret('EMAIL_SECRET');

type Email = { to: string; subject: string; text: string };

// True when emails are only logged (local emulator testing).
export function isConsoleEmail(): boolean {
  return EMAIL_PROVIDER.value() === 'console' && process.env.FUNCTIONS_EMULATOR === 'true';
}

export async function sendEmail(email: Email): Promise<void> {
  const provider = EMAIL_PROVIDER.value();
  if (provider === 'resend') return sendWithResend(email);
  if (provider === 'gmail') return sendWithGmail(email);
  if (isConsoleEmail()) {
    logger.info(`[email] to=${email.to} subject="${email.subject}"\n${email.text}`);
    return;
  }
  throw new Error(`Email provider "${provider}" is not set up.`);
}

async function sendWithResend({ to, subject, text }: Email) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${EMAIL_SECRET.value()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: EMAIL_FROM.value(), to, subject, text }),
  });
  if (!res.ok) {
    throw new Error(`Resend failed: ${res.status} ${await res.text()}`);
  }
}

async function sendWithGmail({ to, subject, text }: Email) {
  const transport = nodemailer.createTransport({
    service: 'gmail',
    // Google shows app passwords with spaces; they're not part of the password.
    auth: { user: GMAIL_USER.value(), pass: EMAIL_SECRET.value().replace(/\s/g, '') },
  });
  await transport.sendMail({ from: EMAIL_FROM.value(), to, subject, text });
}
