import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    // Check auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check environment variables (without exposing actual values)
    const diagnostics = {
      authentication: {
        userId: userId,
        authenticated: true
      },
      imagekit: {
        publicKey: !!process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
        privateKey: !!process.env.IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: !!process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
        configured: !!(
          process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY &&
          process.env.IMAGEKIT_PRIVATE_KEY &&
          process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
        ),
        canInitialize: undefined as boolean | undefined,
        error: undefined as string | undefined
      },
      database: {
        hasUrl: !!process.env.DATABASE_URL,
        urlLength: process.env.DATABASE_URL?.length || 0,
        connection: undefined as string | undefined,
        error: undefined as string | undefined
      },
      clerk: {
        hasPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        hasSecretKey: !!process.env.CLERK_SECRET_KEY
      },
      vercel: {
        env: process.env.VERCEL_ENV || 'local',
        url: process.env.VERCEL_URL || 'localhost',
        region: process.env.VERCEL_REGION || 'local'
      },
      timestamp: new Date().toISOString()
    };

    // Test database connection
    try {
      const { db } = await import('@/lib/db');
      const testQuery = await db().execute('SELECT 1 as test');
      diagnostics.database.connection = 'success';
    } catch (dbError) {
      diagnostics.database.connection = 'failed';
      diagnostics.database.error = dbError instanceof Error ? dbError.message : 'Unknown error';
    }

    // Test ImageKit
    try {
      const { isImageKitConfigured } = await import('@/lib/imagekit');
      diagnostics.imagekit.canInitialize = isImageKitConfigured();
    } catch (ikError) {
      diagnostics.imagekit.error = ikError instanceof Error ? ikError.message : 'Unknown error';
    }

    return NextResponse.json(diagnostics);
  } catch (error) {
    console.error('Diagnostics error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to run diagnostics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
