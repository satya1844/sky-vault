"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSignUp } from "@clerk/nextjs";
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
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { signUpSchema } from "@/schemas/signUpSchema";

export default function SignUpForm() {
  const router = useRouter();
  const { signUp, isLoaded, setActive } = useSignUp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
        router.push("/dashboard");
      } else {
        setAuthError("An unexpected error occurred during sign-up.");
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 bg-background relative overflow-hidden">
      {/* Sky Vault Logo */}
      <div className="mb-6 text-center">
        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
        <h2 className="text-4xl font-bold text-white">sky vault</h2>
      </div>
      
      <Card className="w-full max-w-md border-none rounded-2xl bg-white shadow-xl z-10">
        <CardHeader className="flex flex-col gap-1 items-center pb-2">
          <h1 className="text-2xl font-bold text-black">Create Your Account</h1>
        </CardHeader>


        <Divider className="bg-border" />

        <CardBody className="py-3">
          {authError && (
            <div className=",nc-red-900 text-red-200 p-4 rounded-lg mb-6 flex items-center gap-2">
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
            <Button
              type="submit"

              className="w-full rounded-2xl bg-black text-center cursor-pointer hover:bg-black text-white"
              isLoading={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Create Account"}
            </Button>
          </form>
        </CardBody>
        
        <CardFooter className="flex justify-center py-4">
          <p className="text-sm text-secondary-foreground">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-primary text-black py-2 px-4 rounded-2xl m-5 bg-[#3B82F6] hover:translate-y-1 font-medium">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
      
      {/* Blue curved background at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-primary rounded-t-[50%] -z-10"></div>
    </div>
  );
}