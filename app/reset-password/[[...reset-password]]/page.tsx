"use client";

import ResetPasswordForm from "@/components/ResetPasswordForm";
import "@/styles/globals.css";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <main className="relative z-10 flex-1 flex justify-center items-center p-6">
        <ResetPasswordForm />
      </main>
    </div>
  );
}