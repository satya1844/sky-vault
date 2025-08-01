import React from 'react'
import FileList from '@/components/FileList'
import { auth } from "@clerk/nextjs/server";
async function files() {
  const { userId } = await auth();
  return (
    <div>
      <FileList userId={userId} />
    </div>
  )
}

export default files