# Resend Transactional Email Template

Transactional email sending with Resend and React Email for Next.js applications. Includes email templates, sending utilities, and API routes.

## Features

- Type-safe email sending with Resend SDK
- Beautiful React Email templates
- API route for sending emails
- Support for multiple recipients
- Customizable sender and reply-to addresses

## Installation

```bash
pnpm add resend @react-email/components
```

## Configuration

1. Create an account at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Add environment variables to your `.env.local`:

```env
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=noreply@yourdomain.com
```

4. Verify your domain in the Resend dashboard for production use

## File Structure

```
src/
├── lib/
│   └── email.ts              # Email sending utility
├── emails/
│   └── welcome.tsx           # Welcome email template
└── app/
    └── api/
        └── email/
            └── send/
                └── route.ts  # Email sending API endpoint
```

## Usage

### Direct Email Sending

```typescript
import { sendEmail } from '@/lib/email';
import { WelcomeEmail } from '@/emails/welcome';

// Send a welcome email
await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome to Our Platform!',
  react: WelcomeEmail({ name: 'John' }),
});

// Send to multiple recipients
await sendEmail({
  to: ['user1@example.com', 'user2@example.com'],
  subject: 'Important Update',
  react: WelcomeEmail({ name: 'Team' }),
});

// With custom sender and reply-to
await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome!',
  react: WelcomeEmail({ name: 'John' }),
  from: 'hello@yourdomain.com',
  replyTo: 'support@yourdomain.com',
});
```

### Via API Route

```typescript
// POST /api/email/send
const response = await fetch('/api/email/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'user@example.com',
    name: 'John',
    type: 'welcome',
  }),
});

const result = await response.json();
// { success: true, id: 'email_id' }
```

## Creating New Email Templates

Create a new template in `src/emails/`:

```tsx
// src/emails/password-reset.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components';

interface PasswordResetEmailProps {
  resetUrl: string;
}

export function PasswordResetEmail({ resetUrl }: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your password</Preview>
      <Body style={{ backgroundColor: '#f6f9fc', padding: '40px 0' }}>
        <Container style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '8px' }}>
          <Heading>Reset Your Password</Heading>
          <Text>Click the button below to reset your password:</Text>
          <Button href={resetUrl} style={{ backgroundColor: '#4f46e5', color: '#fff', padding: '12px 24px' }}>
            Reset Password
          </Button>
        </Container>
      </Body>
    </Html>
  );
}

export default PasswordResetEmail;
```

## Preview Emails Locally

Install the React Email CLI for local development:

```bash
pnpm add -D react-email
```

Add a script to your `package.json`:

```json
{
  "scripts": {
    "email:dev": "email dev --dir src/emails"
  }
}
```

Run the preview server:

```bash
pnpm email:dev
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `RESEND_API_KEY` | Your Resend API key | Yes |
| `EMAIL_FROM` | Default sender email address | Yes |

## Dependencies

- `resend`: ^4.0.0
- `@react-email/components`: ^0.0.25

## Resources

- [Resend Documentation](https://resend.com/docs)
- [React Email Documentation](https://react.email/docs)
- [Resend Next.js Guide](https://resend.com/docs/send-with-nextjs)
