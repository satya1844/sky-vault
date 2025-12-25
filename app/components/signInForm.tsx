"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSignIn, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody, CardHeader, CardFooter } from "@heroui/card";
import { Divider } from "@heroui/divider";
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
  const { signIn, isLoaded, setActive } = useSignIn();
  const { client } = useClerk();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

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
        router.push("/dashboard");
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 bg-background relative overflow-hidden">
      {/* Sky Vault Logo */}
       <div className="mb-6 text-center">
        <div className="w-16 h-16 rounded-full mx-auto mb-4"></div>
        <h2 className="text-4xl font-bold text-white">sky vault</h2>
      </div>

      <Card className="w-full max-w-md border-none rounded-2xl bg-white shadow-xl z-10">
  <CardHeader className="flex flex-col gap-1 items-center">
    <h1 className="text-2xl font-bold text-black">Welcome Back!</h1>
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
      <div className="bg-blue-900 text-blue-200 p-4 rounded-lg mb-6 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <p>Reset code has been sent to your email.</p>
        </div>
        <Button
          type="button"
          onClick={() => router.push("/reset-password")}
          className="text-sm text-blue-400 hover:text-blue-300 font-medium"
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
          className="text-sm text-black hover:underline"
        >
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        className="w-full rounded-full bg-black text-white py-3 font-medium hover:bg-black/90 disabled:opacity-70"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Signing in..." : "Sign In"}
      </button>
    </form>
  </CardBody>

  <CardFooter className="flex justify-center py-6">
    <Link
      href="/sign-up"
      className="text-white py-2 px-8 rounded-full bg-[#3B82F6] hover:bg-[#2563EB] font-medium transition-all"
    >
      Sign up
    </Link>
  </CardFooter>
</Card>

      {/* Blue curved background at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-[#3B82F6] rounded-t-[50%] -z-10"></div>
    </div>
  );
}