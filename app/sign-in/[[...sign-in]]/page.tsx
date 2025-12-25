"use client";

import SignInForm from "../../components/signInForm";
import "@/styles/globals.css";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { BackgroundBeams } from "../../components/ui/background-beams"; 

export default function SignInPage() {
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";

  return (

    <div className="min-h-screen relative  overflow-hidden">
      {resetSuccess && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-50 text-green-700 px-4 py-2 rounded-lg z-20">
          Password reset successful! Please sign in with your new password.
        </div>
      )}
      
      {/* Logo */}
      
      {/* Main content */}
      <main className="min-h-screen flex items-center justify-center">
        <SignInForm />
      </main>
      
      {/* Blue background image */}
      <div className="absolute bottom-0 left-0 right-0 w-full z-0">
        <Image 
          src="/blue-bg.png" 
          alt="Blue wave background"
          width={1920}
          height={1080}
          className="w-full"
          priority
        />
      </div>
      <BackgroundBeams />
    </div>
  );
}