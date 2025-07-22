import { Button } from "@heroui/button";
import Link from "next/link";
import { UploadCloud, Lock, Bot, Users, Link2, MessageSquare } from 'lucide-react';
import { SignedIn, SignedOut } from "@clerk/nextjs"; // Add this import


export default function GetStartedPage() {
  const features = [
    {
      title: "Upload & Organize Any File",
      description: "Easily upload images, videos, documents, or design files and organize them into custom folders. Everything stays neat, accessible, and just where you need it.",
      icon: <UploadCloud className="w-16 h-16 text-blue-500" />
    },
    {
      title: "Secure Access & User Authentication",
      description: "Your files are safe with us. Sky Vault ensures secure sign-in and access control, so only the right people see the right content.",
      icon: <Lock className="w-16 h-16 text-blue-500" />
    },
    {
      title: "AI-Powered Auto-Tagging (coming soon)",
      description: "Skip the manual sorting. Our smart AI scans your files and adds searchable tags automatically — so you find what you need, instantly.",
      icon: <Bot className="w-16 h-16 text-blue-500" />
    },
    {
      title: "Real-Time Collaboration (coming soon)",
      description: "Work with teammates in shared folders, leave comments, and stay in sync without endless email threads.",
      icon: <Users className="w-16 h-16 text-blue-500" />
    },
    {
      title: "Time-Limited Sharing Links",
      description: "Easily share any file or folder with a link that expires when you say so. Perfect for clients, colleagues, or quick feedback.",
      icon: <Link2 className="w-16 h-16 text-blue-500" />
    },
    {
      title: "File Annotations (coming soon)",
      description: "Mark up images, add notes to files, and keep the feedback loop right where the work happens.",
      icon: <MessageSquare className="w-16 h-16 text-blue-500" />
    }
  ];

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white text-center">
      <div className="container mx-auto px-6 py-16 text-center">
        <h1 className="text-5xl md:text-5xl font-bold font-quicksand mt-10 text-gray-900 mb-4">
           Welcome to SkyVault!
        </h1>
        <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-12">
          Sky Vault is your all-in-one cloud workspace designed to make file management smarter and collaboration smoother. Whether you're uploading a single document or managing entire project folders, Sky Vault has you covered with powerful features and a beautifully simple interface.
        </p>
      </div>

      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12"> What You Can Do Here:</h2>
        {features.map((feature, index) => (
          <div key={index} className={`flex flex-col md:flex-row items-center justify-center my-10 ${index % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
            <div className="md:w-1/2 p-4 flex justify-center">
              <div className="w-40 h-40 bg-gray-100 rounded-full flex items-center justify-center">
                {feature.icon}
              </div>
            </div>
            <div className="md:w-1/2 p-4 flex flex-col justify-center items-center md:items-start">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="container mx-auto px-6 py-16 text-center">
        <p className="text-lg text-gray-700 max-w-3xl mx-auto">
          With Sky Vault, you’re not just storing files — you’re building a smarter, faster, and more connected creative flow.
        </p>
        <h2 className="text-3xl font-bold text-gray-800 my-8">
           Ready to unlock the vault? Let’s go.
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <SignedOut>
            <Button className="font-quicksand bg-blue-600 text-white hover:bg-blue-700 transition-colors px-8 py-3 rounded-full text-lg uppercase tracking-wide">
            <Link href="/sign-up">signup</Link>
          </Button>
          </SignedOut>
          <SignedIn>
            <Button className="font-quicksand bg-blue-600 text-white hover:bg-blue-700 transition-colors px-8 py-3 rounded-full text-lg uppercase tracking-wide">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </SignedIn>
        </div>
      </div>
    </div>
  );
} 