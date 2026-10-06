import type { Metadata } from "next";
import AuthCard from "../components/AuthCard";
import ResetPasswordForm from "../components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "비밀번호 재설정",
  description: "새 비밀번호를 설정하세요.",
  robots: { index: false },
};

export default function ResetPasswordPage() {
  return (
    <AuthCard>
      <ResetPasswordForm />
    </AuthCard>
  );
}
