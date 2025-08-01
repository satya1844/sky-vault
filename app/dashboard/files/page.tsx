import React from 'react'
import FileList from '@/components/FileList'
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

async function FilesPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">My Files</h1>
      <FileList userId={userId} />
    </div>
  )
}

export default FilesPage