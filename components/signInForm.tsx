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
import "@/styles/globals.css";

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
        console.error("Sign-in incomplete:", result);
        setAuthError("Sign-in could not be completed. Please try again.");
      }
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "errors" in error &&
        Array.isArray((error as { errors?: unknown[] }).errors)
      ) {
        setAuthError(
          (error as { errors?: { message?: string }[] }).errors?.[0]?.message ||
            "An error occurred during sign-in. Please try again."
        );
      } else {
        setAuthError("An error occurred during sign-in. Please try again.");
      }
      console.error("Sign-in error:", error);
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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-background">
      <Card className="relative z-10 w-full max-w-md border border-border bg-card shadow-xl">
        <CardHeader className="flex flex-col gap-1 items-center pb-2">
          <h1 className="text-2xl font-bold text-foreground font-gothic">
            Welcome Back
          </h1>
          <p className="text-secondary-foreground text-center">
            Sign in to access your secure cloud storage
          </p>
        </CardHeader>

        <Divider className="bg-border" />

        <CardBody className="py-6">
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
            <div className="space-y-2">
              <label
                htmlFor="identifier"
                className="text-sm font-medium text-foreground"
              >
                Email
              </label>
              <Input
                id="identifier"
                type="email"
                placeholder="your.email@example.com"
                startContent={<Mail className="h-4 w-4 text-primary" />}
                isInvalid={!!errors.identifier}
                errorMessage={errors.identifier?.message}
                {...register("identifier")}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const email = getValues("identifier");
                    if (email) {
                      handleForgotPassword(email);
                    } else {
                      setAuthError("Please enter your email address first");
                    }
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                startContent={<Lock className="h-4 w-4 text-primary" />}
                endContent={
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    type="button"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-primary" />
                    ) : (
                      <Eye className="h-4 w-4 text-primary" />
                    )}
                  </Button>
                }
                isInvalid={!!errors.password}
                errorMessage={errors.password?.message}
                {...register("password")}
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-6 py-2 rounded-full font-medium tracking-wide"
              isLoading={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardBody>

        <Divider className="bg-border" />

        <CardFooter className="flex justify-center py-4">
          <p className="text-sm text-secondary-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
