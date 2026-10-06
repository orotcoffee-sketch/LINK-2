import type { Metadata } from "next";
import AuthCard from "../components/AuthCard";
import SignupForm from "../components/SignupForm";

export const metadata: Metadata = {
  title: "회원가입",
  description: "링크 계정을 만들고 북마크를 관리하세요.",
  robots: { index: false },
};

export default function SignupPage() {
  return (
    <AuthCard>
      <SignupForm />
    </AuthCard>
  );
}
