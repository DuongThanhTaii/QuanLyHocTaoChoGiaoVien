import { VerifyEmailOtpForm } from "./VerifyEmailOtpForm";

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  return <VerifyEmailOtpForm email={email ?? ""} />;
}
