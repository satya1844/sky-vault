import React from 'react'
import Topbar from '@/components/dashboard/Topbar'
import FileList from '@/components/FileList'
import { auth } from "@clerk/nextjs/server";
async function files() {
  const { userId } = await auth();
  return (
    <div>
      <Topbar />
      <FileList userId={userId} />
    </div>
  )
}

export default files