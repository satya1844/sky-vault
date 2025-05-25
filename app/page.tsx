import { Button } from "@heroui/button";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { Card, CardBody } from "@heroui/card";
import {
  CloudUpload,
  Shield,
  Folder,
  Image as ImageIcon,
  ArrowRight,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { FaRegImage } from "react-icons/fa";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gray-900 font-sans">
      <nav className="flex items-center justify-between px-6 py-4 bg-gray-800 shadow-md">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🖼️</span>
          <span className="text-xl font-semibold text-white">Droply</span>
        </div>
        <div className="flex items-center space-x-4">
          <SignedOut>
            <Button
              asChild
              className="text-gray-300 hover:text-white transition-colors"
              variant="ghost"
            >
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button
              asChild
              className="bg-gray-600 text-white hover:bg-gray-700 transition-colors px-6 py-2 rounded-full"
            >
              <Link href="/sign-up">Sign Up</Link>
            </Button>
          </SignedOut>
          <SignedIn>
            <Button
              asChild
              className="bg-gray-600 text-white hover:bg-gray-700 transition-colors px-6 py-2 rounded-full"
            >
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </SignedIn>
        </div>
      </nav>
      <section className="flex flex-col items-center justify-center max-w-7xl mx-auto px-6 py-16 text-center">
        <div className="max-w-lg">
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Store your <span className="text-white">images</span> with ease
          </h1>
          <p className="mt-4 text-lg text-red-300">
            Simple. Secure. Fast. Upload and manage your images effortlessly with Droply.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              className="bg-gray-600 text-white hover:bg-gray-700 transition-colors px-8 py-3 rounded-full text-lg font-medium"
            >
              <Link href="/get-started">Get Started</Link>
            </Button>
            <Button
              asChild
              className="border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors px-8 py-3 rounded-full text-lg font-medium"
            >
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>
        </div>
        <div className="mt-12">
          <div className="relative">
            <FaRegImage size={120} className="text-gray-600 opacity-50" />
            <div className="absolute inset-0 flex items-center justify-center">
              <FaRegImage size={80} className="text-white" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}