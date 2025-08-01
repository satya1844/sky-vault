import React from 'react'
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

function Settings() {
  const { userId } = auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      {/* Your settings content here */}
    </div>
  )
}

export default Settings