"use client";

import SignInForm from "@/components/signInForm";
import "@/styles/globals.css";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { BackgroundBeams } from "@/components/ui/background-beams"; 

export default function SignInPage() {
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";

  return (

    <div className="h-screen relative overflow-hidden">
      {resetSuccess && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-50 text-green-700 px-4 py-2 rounded-lg z-20">
          Password reset successful! Please sign in with your new password.
        </div>
      )}
      
      {/* Logo */}
      
      {/* Main content */}
      <main className="h-screen flex items-center justify-center">
        <div className="flex w-full h-full">
          {/* Image Section */}
          <div className="hidden lg:flex lg:w-1/2 items-center justify-center">
            <div className="relative w-full h-full">
              <Image
                src="/singin.png"
                alt="Sign in"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
          
          {/* Form Section */}
          <div className="w-full lg:w-1/2 flex items-center justify-center">
            <SignInForm />
          </div>
        </div>
      </main>
      
      <BackgroundBeams />
    </div>
  );
}