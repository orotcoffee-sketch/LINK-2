import type { Metadata } from "next";
import AuthCard from "../components/AuthCard";
import LoginForm from "../components/LoginForm";

export const metadata: Metadata = {
  title: "로그인",
  description: "이메일 또는 카카오 계정으로 로그인하세요.",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <AuthCard>
      <LoginForm />
    </AuthCard>
  );
}
