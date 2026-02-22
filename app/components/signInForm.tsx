"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSignIn, useClerk } from "@clerk/nextjs";
import { OAuthStrategy } from "@clerk/types";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";

import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody, CardHeader, CardFooter } from "@heroui/card";
import { Divider } from "@heroui/divider";
import {Github, Chrome} from "lucide-react";

import {
  Mail,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";
import { signInSchema } from "@/schemas/signInSchema";

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, isLoaded, setActive } = useSignIn();
  const { client } = useClerk();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const [oAuthLoading, setOAuthLoading] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof signInSchema>) => {
    if (!isLoaded) return;

    setIsSubmitting(true);
    setAuthError(null);

    try {
      const result = await signIn.create({
        identifier: data.identifier,
        password: data.password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        const redirectUrl = searchParams.get('redirect_url') || '/dashboard';
        await router.push(redirectUrl);
      } else {
        setAuthError("Sign-in could not be completed. Please try again.");
      }
    } catch (error: any) {
      setAuthError(
        error.errors?.[0]?.message ||
          "An error occurred during sign-in. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (email: string) => {
    try {
      setIsSubmitting(true);
      setAuthError(null);

      await client.signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });

      setResetEmailSent(true);
    } catch (error) {
      console.error("Password reset error:", error);
      setAuthError("Failed to send reset email. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleOAuthSignIn = async (strategy: OAuthStrategy) => {
    try{
      setOAuthLoading(strategy);
      setIsSubmitting(true);
      setAuthError(null);
    const redirectUrl = searchParams.get('redirect_url') || '/dashboard';

    await signIn?.authenticateWithRedirect({
      strategy: strategy,
      redirectUrl: redirectUrl,
      redirectUrlComplete: redirectUrl,
    });
    router.push(redirectUrl);
    }catch (error: any) {
    console.error("OAuth error:", error);
    setAuthError(
      error.errors?.[0]?.message ||
        "An error occurred during OAuth sign-up. Please try again."
    );
  } finally {
    setOAuthLoading(null);
  }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 bg-transparent relative overflow-hidden text-white">
      {/* Sky Vault Logo */}
       <div className="mb-6 text-center">
        <div className="w-16 h-16 rounded-full mx-auto mb-4"></div>
        <h2 className="text-4xl font-bold text-white">sky vault</h2>
      </div>

      <Card className="w-full max-w-md border-none rounded-2xl bg-transparent shadow-xl z-10 text-white">
  <CardHeader className="flex flex-col gap-1 items-center">
    <h1 className="text-2xl font-bold text-white">Welcome Back!</h1>
  </CardHeader>

  <Divider className="bg-border" />

  <CardBody>
    {authError && (
      <div className="bg-red-900 text-red-200 p-4 rounded-lg mb-6 flex items-center gap-2">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <p>{authError}</p>
      </div>
    )}
    {resetEmailSent && (
      <div className="bg-green-900 text-green-200 p-4 rounded-lg mb-6 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <p>Reset code has been sent to your email.</p>
        </div>
        <Button
          type="button"
          onClick={() => router.push("/reset-password")}
          className="text-sm text-green-400 hover:text-green-300 font-medium"
        >
          Click here to enter your reset code
        </Button>
      </div>
    )}

    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        {/* Email Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-500" />
          </div>
          <input
            id="identifier"
            type="email"
            placeholder="Email"
            {...register("identifier")}
            className={`w-full bg-[#D9D9D9] text-black rounded-lg py-3 pl-10 pr-4 border-none focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-gray-400 ${
              errors.identifier ? "ring-2 ring-red-500" : ""
            }`}
            autoComplete="email"
          />
          {errors.identifier && (
            <p className="text-red-500 text-sm mt-1">{errors.identifier.message}</p>
          )}
        </div>

        {/* Password Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-500" />
          </div>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            {...register("password")}
            className={`w-full bg-[#A9A9A9] text-black rounded-lg py-3 pl-10 pr-10 border-none focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-gray-700 ${
              errors.password ? "ring-2 ring-red-500" : ""
            }`}
            autoComplete="current-password"
          />
          <div className="absolute inset-y-0 right-3 flex items-center">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-500 focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>
      </div>

      <div className="text-right">
        <button
          type="button"
          onClick={() => {
            const email = getValues("identifier");
            if (email) {
              handleForgotPassword(email);
            } else {
              setAuthError("Please enter your email address first.");
            }
          }}
          className="text-sm text-white hover:underline "style={{
            background: 'linear-gradient(90deg, #1d4ed8, #2563eb, #3b82f6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            display: 'inline-block',
          }}
        >
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        className="relative overflow-hidden font-quicksand bg-transparent text-black hover:text-white border border-white transition-all duration-500 px-8 py-3 rounded-full text-lg tracking-wide hover:shadow-lg before:content-[''] before:absolute before:inset-0 before:bg-white before:pointer-events-none before:transition-transform before:duration-700 before:ease-[cubic-bezier(0.22,1,0.36,1)] hover:before:translate-y-full before:-z-10"
        disabled={isSubmitting}
      >
        <span className="relative z-10">{isSubmitting ? "Signing in..." : "Sign In"}</span>
      </button>


{/* OAuth Sign In Buttons */}

<div className="mt-3">
              <div className="flex items-center gap-4 mb-3">
                <div className="flex-1 h-px bg-gray-500"></div>
                <span className="text-sm text-gray-400">Or continue with</span>
                <div className="flex-1 h-px bg-gray-500"></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn("oauth_google")}
                  disabled={oAuthLoading !== null}
                  className=" cursor-pointer relative overflow-hidden font-quicksand bg-transparent text-black hover:text-white border border-white transition-all duration-500 px-8 py-3 rounded-full text-lg tracking-wide hover:shadow-lg before:content-[''] before:absolute before:inset-0 before:bg-white before:pointer-events-none before:transition-transform before:duration-700 before:ease-[cubic-bezier(0.22,1,0.36,1)] hover:before:translate-y-full before:-z-10"
                >
                  <span className="relative z-10 text-black align-middle justify-center flex hover:text-white">
                    {oAuthLoading === "oauth_google" ? "Signing up..." : <Chrome/>}
                  </span>
                  
                  
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn("oauth_github")}
                  disabled={oAuthLoading !== null}
                  className=" cursor-pointer relative overflow-hidden font-quicksand bg-transparent text-black hover:text-white border border-white transition-all duration-500 px-8 py-3 rounded-full text-lg tracking-wide hover:shadow-lg before:content-[''] before:absolute before:inset-0 before:bg-white before:pointer-events-none before:transition-transform before:duration-700 before:ease-[cubic-bezier(0.22,1,0.36,1)] hover:before:translate-y-full before:-z-10"
                >
                  <span className="relative z-10 text-black align-middle justify-center flex hover:text-white">
                    {oAuthLoading === "oauth_github" ? "Signing up..." : <Github/>}
                  </span>
                  
                </button>
              </div>
            </div>

    </form>
  </CardBody>


  <CardFooter className="flex justify-center py-6">
    new to Sky Vault?{"   "}
    <Link
      href="/sign-up"
      className="relative overflow-hidden font-quicksand bg-transparent text-white hover:text-black border border-white transition-all duration-500  mx-2.5 px-4 py-2 rounded-full tracking-wide hover:shadow-lg before:content-[''] before:absolute before:inset-0 before:bg-white before:pointer-events-none before:transition-transform before:duration-700 before:ease-[cubic-bezier(0.22,1,0.36,1)] before:translate-y-full hover:before:translate-y-0 before:-z-10"
    >
      <span className="relative z-10">Sign up</span>
    </Link>
  </CardFooter>
</Card>
    </div>
  );
}