import SignUpForm from "@/components/signUpForm";
import Image from "next/image";
import "@/styles/globals.css";
import { BackgroundBeams } from "@/components/ui/background-beams";

export default function SignUpPage() {
  return (
    <div className="h-screen relative overflow-hidden">
      <main className="h-screen flex items-center justify-center">
        <div className="flex w-full h-full">
          {/* Image Section with White Background */}
          <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-white">
            <div className="relative w-full h-full">
              <Image
                src="/exoplanet.png"
                alt="Exoplanet"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
          
          {/* Form Section */}
          <div className="w-full lg:w-1/2 flex items-center justify-center">
            <SignUpForm />
          </div>
        </div>
      </main>

      <BackgroundBeams />
    </div>
  );
}