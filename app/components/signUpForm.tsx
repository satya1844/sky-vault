"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSignUp } from "@clerk/nextjs";
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
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { signUpSchema } from "@/schemas/signUpSchema";

export default function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp, isLoaded, setActive } = useSignUp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [oAuthLoading, setOAuthLoading] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      passwordConfirmation: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
    if (!isLoaded) return;
    setIsSubmitting(true);
    setAuthError(null);
    try {
      const result = await signUp.create({
        emailAddress: data.email,
        password: data.password,
      });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        const redirectUrl = searchParams.get('redirect_url') || '/dashboard';
        router.push(redirectUrl);
      } else {
        // Trigger email verification flow
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setVerifying(true);
      }
    } catch (error: any) {
      setAuthError(
        error.errors?.[0]?.message ||
          "An error occurred during sign-up. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerificationSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;

    setIsSubmitting(true);
    setVerificationError(null);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        const redirectUrl = searchParams.get('redirect_url') || '/dashboard';
        router.push(redirectUrl);
      } else {
        setVerificationError(
          "Verification could not be completed. Please try again."
        );
      }
    } catch (error: any) {
      setVerificationError(
        error.errors?.[0]?.message ||
          "An error occurred during verification. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };
const handleOAuthSignUp = async (
  strategy: "oauth_google" | "oauth_github"
) => {
  if (!isLoaded) return;
  try {
    setOAuthLoading(strategy);
    setAuthError(null);
    const redirectUrl = searchParams.get('redirect_url') || '/dashboard';
    await signUp?.authenticateWithRedirect({
      strategy,
      redirectUrl: redirectUrl,
      redirectUrlComplete: redirectUrl,
    });
    router.push(redirectUrl);
  } catch (error: any) {
    console.error("OAuth error:", error);
    setAuthError(
      error.errors?.[0]?.message ||
        "An error occurred during OAuth sign-up. Please try again."
    );
  } finally {
    setOAuthLoading(null);
  }
}
  if (verifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-5 bg-background relative overflow-hidden">
        <Card className="w-full max-w-md border-none rounded-2xl bg-transparent shadow-xl z-10">
          <CardHeader className="flex flex-col gap-1 items-center pb-2">
            <h1 className="text-2xl font-bold text-white">Verify Your Email</h1>
            <p className="text-default-500 text-center">
              We've sent a verification code to your email
            </p>
          </CardHeader>

          <Divider className="bg-border" />

          <CardBody className="py-6">
            {verificationError && (
              <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p>{verificationError}</p>
              </div>
            )}

            <form onSubmit={handleVerificationSubmit} className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="verificationCode"
                  className="text-sm font-medium text-white"
                >
                  Verification Code
                </label>
                <Input
                  id="verificationCode"
                  type="text"
                  placeholder="Enter the 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full bg-[#D9D9D9] text-white rounded-lg border-none focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-gray-400"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                color="primary"
                className="w-full"
                isLoading={isSubmitting}
              >
                {isSubmitting ? "Verifying..." : "Verify Email"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-default-500">
                Didn't receive a code?{" "}
                <button
                  onClick={async () => {
                    if (signUp) {
                      await signUp.prepareEmailAddressVerification({
                        strategy: "email_code",
                      });
                    }
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Resend code
                </button>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }



  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 relative overflow-hidden text-white">
      {/* Sky Vault Logo */}
      <div className="mb-6 text-center">
        <div className="w-16 h-16 rounded-full mx-auto mb-4"></div>
        <h2 className="text-4xl font-bold text-white">sky vault</h2>
      </div>
      
      <Card className="w-full max-w-md border-none rounded-2xl bg-transparent shadow-xl z-10 text-white">
        <CardHeader className="flex flex-col gap-1 items-center pb-2">
          <h1 className="text-2xl font-bold text-white">Create Your Account</h1>
        </CardHeader>


        <Divider className="bg-border" />

        <CardBody className="py-3">
          {authError && (
            <div className="bg-red-900 text-red-200 p-4 rounded-lg mb-6 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{authError}</p>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
  <Input
    id="email"
    type="email"
    placeholder="Email"
    startContent={<Mail className="h-4 w-4 text mr-3 text-black" />}
    isInvalid={!!errors.email}
    errorMessage={errors.email?.message}
    {...register("email")}
    autoComplete="email"
    className="w-full bg-[#D9D9D9] text-black rounded-lg  border-none focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-gray-400"
  />
</div>

            <div className="space-y-2">
              
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                startContent={<Lock className="h-4 w-4 mr-3 text-black" />}
                endContent={
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    type="button"
                    className="text-black"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                }
                isInvalid={!!errors.password}
                errorMessage={errors.password?.message}
                {...register("password")}
                className="w-full bg-[#D9D9D9] text-black rounded-lg  border-none focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-gray-400"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
             
              <Input
                id="passwordConfirmation"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                startContent={<Lock className="h-4 w-4 mr-3 text-black" />}
                endContent={
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    type="button"
                    className="text-black"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                }
                isInvalid={!!errors.passwordConfirmation}
                errorMessage={errors.passwordConfirmation?.message}
                {...register("passwordConfirmation")}
                className="w-full bg-[#D9D9D9] text-black rounded-lg  border-none focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-gray-400"
                autoComplete="new-password"
              />
            </div>
            <div id="clerk-captcha" data-clerk-captcha></div>
            <button
              type="submit"
              className="relative overflow-hidden font-quicksand bg-transparent text-black hover:text-white border border-white transition-all duration-500 px-8 py-3 rounded-full text-lg tracking-wide hover:shadow-lg before:content-[''] before:absolute before:inset-0 before:bg-white before:pointer-events-none before:transition-transform before:duration-700 before:ease-[cubic-bezier(0.22,1,0.36,1)] hover:before:translate-y-full before:-z-10"
              disabled={isSubmitting}
            >
              <span className="relative z-10">{isSubmitting ? "Creating account" : "Create Account"}</span>
            </button>

            {/* OAuth Section */}
            <div className="mt-3">
              <div className="flex items-center gap-4 mb-3">
                <div className="flex-1 h-px bg-gray-500"></div>
                <span className="text-sm text-gray-400">Or continue with</span>
                <div className="flex-1 h-px bg-gray-500"></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleOAuthSignUp("oauth_google")}
                  disabled={oAuthLoading !== null}
                  className=" cursor-pointer relative overflow-hidden font-quicksand bg-transparent text-black hover:text-white border border-white transition-all duration-500 px-8 py-3 rounded-full text-lg tracking-wide hover:shadow-lg before:content-[''] before:absolute before:inset-0 before:bg-white before:pointer-events-none before:transition-transform before:duration-700 before:ease-[cubic-bezier(0.22,1,0.36,1)] hover:before:translate-y-full before:-z-10"
                >
                  <span className="relative z-10 text-black align-middle justify-center flex hover:text-white">
                    {oAuthLoading === "oauth_google" ? "Signing up..." : <Chrome/>}
                  </span>
                  
                  
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuthSignUp("oauth_github")}
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
         Already have an account?{"   "} <Link
            href="/sign-in"
            className="relative overflow-hidden font-quicksand bg-transparent text-white hover:text-black border border-white transition-all duration-500 px-4 py-2 rounded-full tracking-wide hover:shadow-lg before:content-[''] before:absolute before:inset-0 before:bg-white before:pointer-events-none  mx-2.5 before:transition-transform before:duration-700 before:ease-[cubic-bezier(0.22,1,0.36,1)] before:translate-y-full hover:before:translate-y-0 before:-z-10"
          >
            <span className="relative z-10">Sign in</span>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}