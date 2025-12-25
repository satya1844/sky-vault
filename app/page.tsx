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
import { Pacifico } from 'next/font/google';

// Initialize the Pacifico font
const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

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
        <div className="max-w-3xl mt-32">
          <h1 
            className={`${pacifico.className} text-4xl md:text-8xl font-bold tracking-wider leading-tight pb-6`}
            style={{
              background: 'linear-gradient(90deg, #1e3a8a, #1e40af, #1d4ed8, #2563eb, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'inline-block',
            }}
          >
            SkyVault
          </h1>
          <p className="font-sans mt-4 text-3xl text-gray-600 tracking-wide">
            Simple. Secure. Fast.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              
              className="relative overflow-hidden font-quicksand bg-transparent text-black border border-white transition-all duration-500 px-8 py-3 rounded-full text-lg tracking-wide hover:shadow-lg before:content-[''] before:absolute before:inset-0 before:bg-white before:pointer-events-none before:transition-transform before:duration-700 before:ease-[cubic-bezier(0.22,1,0.36,1)] hover:before:translate-y-full [&:hover_a]:bg-gradient-to-r [&:hover_a]:from-[#1e3a8a] [&:hover_a]:via-[#2563eb] [&:hover_a]:to-[#3b82f6] [&:hover_a]:bg-clip-text [&:hover_a]:text-transparent"
            >
              <Link href="/get-started" className="relative z-10 transition-all duration-500">Get Started</Link>
            </Button>
            <Button
              
              className="relative overflow-hidden font-quicksand bg-transparent text-black border border-white transition-all duration-500 px-8 py-3 rounded-full text-lg tracking-wide hover:shadow-lg before:content-[''] before:absolute before:inset-0 before:bg-white before:pointer-events-none before:transition-transform before:duration-700 before:ease-[cubic-bezier(0.22,1,0.36,1)] hover:before:translate-y-full [&:hover_a]:bg-gradient-to-r [&:hover_a]:from-[#1e3a8a] [&:hover_a]:via-[#2563eb] [&:hover_a]:to-[#3b82f6] [&:hover_a]:bg-clip-text [&:hover_a]:text-transparent"
            >
              <Link href="/sign-in" className="relative z-10 transition-all duration-500">Sign In</Link>
            </Button>
          </div>
        </div>
        
      </section>
    </main>
  );
}