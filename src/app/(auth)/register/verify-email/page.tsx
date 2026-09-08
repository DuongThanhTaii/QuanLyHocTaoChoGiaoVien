import { VerifyEmailOtpForm } from "./VerifyEmailOtpForm";

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ email?: string; next?: string }> }) {
  const { email, next } = await searchParams;
  return <VerifyEmailOtpForm email={email ?? ""} next={next ?? ''} />;
}
