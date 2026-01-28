import { Resend } from 'resend';
import type { ReactElement } from 'react';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set');
}

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: ReactElement;
  from?: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, react, from, replyTo }: SendEmailOptions) {
  const { data, error } = await resend.emails.send({
    from: from || process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to: Array.isArray(to) ? to : [to],
    subject,
    react,
    replyTo,
  });

  if (error) {
    console.error('Email send error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}
