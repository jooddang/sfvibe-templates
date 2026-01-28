import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface WelcomeEmailProps {
  name: string;
  actionUrl?: string;
}

export function WelcomeEmail({ name, actionUrl = 'https://example.com' }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to our platform!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome, {name}!</Heading>
          <Text style={text}>
            We're excited to have you on board. Get started by exploring our features.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={actionUrl}>
              Get Started
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            If you have any questions, reply to this email or contact us at{' '}
            <Link href="mailto:support@example.com">support@example.com</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: '#f6f9fc', padding: '40px 0' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '40px', borderRadius: '8px', maxWidth: '580px' };
const h1 = { color: '#1f2937', fontSize: '24px', fontWeight: '600', margin: '0 0 20px' };
const text = { color: '#4b5563', fontSize: '16px', lineHeight: '26px', margin: '0 0 20px' };
const buttonContainer = { textAlign: 'center' as const, margin: '30px 0' };
const button = { backgroundColor: '#4f46e5', borderRadius: '6px', color: '#fff', fontSize: '16px', padding: '12px 24px', textDecoration: 'none' };
const hr = { borderColor: '#e5e7eb', margin: '30px 0' };
const footer = { color: '#9ca3af', fontSize: '14px' };

export default WelcomeEmail;
