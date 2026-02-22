'use client';

import React from 'react';
import { Button } from "@heroui/button";
import Link from "next/link";
import Image from "next/image";
import { UploadCloud, Lock, Bot } from 'lucide-react';
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { BackgroundLines } from "../components/ui/background-lines";
import { Pacifico, Josefin_Sans } from 'next/font/google';

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

const josefinSans = Josefin_Sans({
  weight: ['300', '400', '600'],
  subsets: ['latin'],
  display: 'swap',
});


export default function GetStartedPage() {
  const features = [
    {
      title: "Upload & Organize Any File",
      description: "Easily upload images, videos, documents, or design files and organize them into custom folders. Everything stays neat, accessible, and just where you need it.",
      illustration: "/getStarted/organise.png"
    },
    {
      title: "Secure Access & User Authentication",
      description: "Your files are safe with us. Sky Vault ensures secure sign-in and access control, so only the right people see the right content.",
      illustration: "/getStarted/security.png"
    },
    {
      title: "Chatbot Assistant",
      description: "Ask questions and get quick help with your files through the built-in chatbot.",
      illustration: "/getStarted/chatbot.png"
    }
  ];

  const [loading, setLoading] = React.useState('');

  return (
    <div className="min-h-screen w-full relative overflow-y-auto">
      <BackgroundLines className="fixed inset-0 w-full h-full pointer-events-none">
        <div />
      </BackgroundLines>
      <div className="flex flex-col items-center justify-center text-white text-center relative z-10">
        <div className="container mx-auto px-6 py-16 text-center">
        <h1 className={`${pacifico.className} text-6xl md:text-7xl font-bold mt-10 mb-6 leading-tight pb-4`}
          style={{
            background: 'linear-gradient(90deg, #1d4ed8, #2563eb, #3b82f6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            display: 'inline-block',
          }}>
           Welcome to SkyVault!
        </h1>
        <p className={`${josefinSans.className} text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto mb-16 font-light leading-relaxed`}>
          Sky Vault is your all-in-one cloud workspace designed to make file management faster and simpler. Whether you're uploading a single document or managing entire project folders, Sky Vault has you covered with powerful features and a beautifully simple interface.
        </p>
      </div>

      <div className="container mx-auto px-6 relative py-12">
        <h2 className={`${pacifico.className} text-4xl md:text-5xl font-bold text-center mb-20 text-white`}> What You Can Do Here:</h2>
        {features.map((feature, index) => (
          <div key={index} className={`flex flex-col md:flex-row items-center justify-center my-16 gap-12 ${index % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
            <div className="md:w-1/2 p-8 flex justify-center">
              <Image
                src={feature.illustration}
                alt={feature.title}
                width={256}
                height={256}
                className="object-contain"
                priority
              />
            </div>
            <div className="md:w-1/2 p-8 flex flex-col justify-center items-center md:items-start">
              <h3 className="text-3xl md:text-4xl font-bold mb-4 pb-2"
                style={{
                  background: 'linear-gradient(90deg, #1e3a8a, #1e40af, #1d4ed8, #2563eb, #3b82f6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  display: 'inline-block',
                }}>{feature.title}</h3>
              <p className={`${josefinSans.className} text-lg text-gray-200 leading-relaxed`}>
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="container mx-auto px-6 py-24 text-center">
        <p className={`${josefinSans.className} text-xl text-gray-200 max-w-3xl mx-auto mb-8 leading-relaxed font-light`}>
          With Sky Vault, you're not just storing files — you're building a smarter, faster, and more connected creative flow.
        </p>
        <h2 className={`${pacifico.className} text-5xl md:text-6xl font-bold my-12 pb-4`}
          style={{
            background: 'linear-gradient(90deg, #1e3a8a, #1e40af, #1d4ed8, #2563eb, #3b82f6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            display: 'inline-block',
          }}>
           Ready to unlock the vault? Let’s go.
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <SignedOut>
            <Button className="relative overflow-hidden font-quicksand bg-transparent text-black hover:text-white border border-white transition-colors duration-500 px-8 py-3 rounded-full text-lg tracking-wide hover:shadow-lg before:content-[''] before:absolute before:inset-0 before:bg-white before:pointer-events-none before:transition-transform before:duration-700 before:ease-[cubic-bezier(0.22,1,0.36,1)] hover:before:translate-y-full">
              <Link href="/sign-up" className="relative z-10">{loading === 'sign-up' ? 'lets go!...' : 'Sign Up'}</Link>
            </Button>

          </SignedOut>
          <SignedIn>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="relative overflow-hidden font-quicksand bg-white text-black hover:bg-transparent hover:text-white border border-white transition-colors duration-500 px-8 py-3 rounded-full text-lg tracking-wide hover:shadow-lg before:content-[''] before:absolute before:inset-0 before:bg-white before:pointer-events-none before:transition-transform before:duration-700 before:ease-[cubic-bezier(0.22,1,0.36,1)] hover:before:translate-y-full">
                <Link href="/dashboard" className="relative z-10">Go to Dashboard</Link>
              </Button>
              <Button className="relative overflow-hidden font-quicksand bg-transparent text-black hover:text-white border border-white transition-colors duration-500 px-8 py-3 rounded-full text-lg tracking-wide hover:shadow-lg before:content-[''] before:absolute before:inset-0 before:bg-white before:pointer-events-none before:transition-transform before:duration-700 before:ease-[cubic-bezier(0.22,1,0.36,1)] hover:before:translate-y-full">
                <Link href="/dashboard/chatbot" className="relative z-10">Open Chatbot</Link>
              </Button>
            </div>
          </SignedIn>
        </div>
      </div>
      </div>
    </div>
  );
}