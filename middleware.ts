import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public (unauthenticated) routes
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/reset-password(.*)",
  "/get-started(.*)",
]);

// Middleware with defensive logging to help diagnose 500 errors in production.
export default clerkMiddleware(async (auth, request) => {
  const start = Date.now();
  const debugEnabled = process.env.MW_DEBUG === "1";
  let phase = "start";
  try {
  const authObj = await auth();
  const { userId } = authObj;
    const url = new URL(request.url);

    if (debugEnabled) {
      console.log("[middleware] incoming", {
        path: url.pathname,
        userId: userId ?? null,
        public: isPublicRoute(request),
        env: {
          clerkPub: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
          clerkSecret: !!process.env.CLERK_SECRET_KEY,
        },
      });
    }

    if (userId && isPublicRoute(request) && url.pathname !== "/") {
      phase = "redirect-dashboard";
      const res = NextResponse.redirect(new URL("/dashboard", request.url));
      res.headers.set("x-mw-state", phase);
      return res;
    }

    if (!isPublicRoute(request)) {
      phase = "protect";
  await auth.protect();
    }

    phase = "pass";
    const res = NextResponse.next();
    res.headers.set("x-mw-state", phase);
    res.headers.set("x-mw-dur", String(Date.now() - start));
    return res;
  } catch (err: any) {
    console.error("[middleware] error", { message: err?.message, stack: err?.stack });
    const res = NextResponse.next();
    res.headers.set("x-mw-error", "1");
    res.headers.set("x-mw-state", phase + "-error");
    return res;
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};