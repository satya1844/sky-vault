"use client";

import SignInForm from "@/components/signInForm";
import "@/styles/globals.css";
import { useSearchParams } from "next/navigation";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";

  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      {resetSuccess && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-50 text-green-700 px-4 py-2 rounded-lg">
          Password reset successful! Please sign in with your new password.
        </div>
      )}
      <main className="relative z-10 flex-1 flex justify-center items-center p-6">
        <SignInForm />
      </main>
    </div>
  );
}