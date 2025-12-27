"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Lock } from "lucide-react";
import "@/styles/globals.css"

export default function ResetPasswordForm() {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, isLoaded, setActive } = useSignIn();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (!isLoaded || !signIn) {
        setError("Auth is not ready. Please wait and try again.");
        return;
      }
      const activeSignIn = signIn;

      const result = await activeSignIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
        return;
      }

      // Handle non-complete statuses explicitly
      setError("Password reset not completed. Verify code and try again.");

    } catch (err: any) {
      const clerkError = err?.errors?.[0];

      if (clerkError?.code === "form_password_pwned") {
      setError("This password is unsafe. Choose a stronger password.");
    } else if (clerkError?.code === "form_code_incorrect") {
      setError("Invalid or expired reset code.");
    } else {
      setError(clerkError?.message || "Password reset failed.");
    }

    
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-card border border-border">
      <CardHeader>
        <h1 className="text-2xl font-bold text-center text-foreground">Reset Password</h1>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">
              Reset Code
            </label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter reset code from email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">
              New Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              required
              
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}