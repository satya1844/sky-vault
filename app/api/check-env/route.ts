import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
  // Ensure only authorized users can check env vars
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const key = req.nextUrl.searchParams.get('key');
  
  if (!key) {
    return NextResponse.json({ error: 'Key parameter required' }, { status: 400 });
  }
  
  // Only allow checking specific keys (for security)
  const allowedKeys = ['OCR_SPACE_API_KEY'];
  
  if (!allowedKeys.includes(key)) {
    return NextResponse.json({ error: 'Key not allowed' }, { status: 403 });
  }
  
  const value = process.env[key];
  
  return NextResponse.json({
    key,
    status: value ? 'configured' : 'missing',
    // Never return the actual value for security
    hasValue: !!value,
    valueLength: value ? value.length : 0
  });
}
