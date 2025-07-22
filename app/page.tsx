import { Button } from "@heroui/button";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { Card, CardBody } from "@heroui/card";
import "@/styles/globals.css";
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
    <main 
      className="min-h-screen bg-white relative overflow-hidden before:absolute before:inset-0 before:bg-white/30 before:backdrop-blur-xs before:z-0"
      style={{
        backgroundImage: `url('/cloud.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Content */}
      {/* <nav className="flex items-center justify-between px-6 py-4 bg-transparent relative z-10">
        <div className="flex items-center space-x-2">
          <span className="text-2xl"></span>
          <span className="font-gothic text-xl text-gray-900 uppercase tracking-wider">Sky Vault</span>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            className="font-orbitron border border-gray-200 text-gray-900 hover:bg-blue-500 transition-colors px-6 py-2 rounded-full uppercase tracking-wide"
          >
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Link
            href="/sign-up"
            className="font-orbitron border border-gray-200 text-gray-900 hover:bg-gray-50 transition-colors px-6 py-2 rounded-full uppercase tracking-wide inline-block text-center"
          >
            Sign Up
          </Link>
        </div>
      </nav> */}

      <section className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] max-w-5xl mx-auto px-6 text-center relative z-10">
        <div className="max-w-3xl">
          <h1 className="font-sans text-4xl md:text-8xl font-bold text-gray-900  tracking-wider leading-tight">
          SKYVAULT
          </h1>
          <p className="font-sans mt-4 text-3xl text-gray-600 tracking-wide">
            Simple. Secure. Fast.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              
              className="font-quicksand flex items-center space-x-2 border border-gray-200 text-gray-900 hover:bg-white transition-colors px-8 py-3 rounded-full text-lg uppercase tracking-wide"
            >
              <Link  href="/get-started">Get Started</Link>
            </Button>
            <Button
              
              className="font-quicksand flex items-center space-x-2 border border-gray-200 text-gray-900 hover:bg-blue-300 transition-colors px-8 py-3 rounded-full text-lg uppercase tracking-wide"
            >
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>
        </div>
        
      </section>
    </main>
  );
}