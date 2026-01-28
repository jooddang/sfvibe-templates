import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { WelcomeEmail } from '@/emails/welcome';

export async function POST(request: NextRequest) {
  try {
    const { to, name, type = 'welcome' } = await request.json();

    if (!to) {
      return NextResponse.json({ error: 'Recipient required' }, { status: 400 });
    }

    let emailContent;
    let subject;

    switch (type) {
      case 'welcome':
        emailContent = WelcomeEmail({ name: name || 'there' });
        subject = 'Welcome to Our Platform!';
        break;
      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    const result = await sendEmail({ to, subject, react: emailContent });
    return NextResponse.json({ success: true, id: result?.id });
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
