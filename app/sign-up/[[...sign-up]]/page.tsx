import SignUpForm from "@/components/signUpForm";
import Image from "next/image";
import "@/styles/globals.css";

export default function SignUpPage() {
  return (
    <div className="min-h-screen relative bg-background overflow-hidden">
      <main className="relative z-10 flex-1 flex justify-center items-center p-6">
        <SignUpForm />
      </main>

      {/* Blue background image */}
      <div className="absolute bottom-0 left-0 right-0 w-full z-0">
              <Image 
                src="/blue-bg.png" 
                alt="Blue wave background"
                width={1920}
                height={1080}
                className="w-full"
                priority
              />
            </div>
    </div>
  );
}