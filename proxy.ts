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

const authFlowRoutes = ["/reset-password", "/sign-in", "/sign-up"];

// Minimal middleware: redirect signed-in users away from public pages
// and protect non-public routes. No debug logging or extra headers.
export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  const url = new URL(request.url);
  const isApiRoute = url.pathname.startsWith("/api") || url.pathname.startsWith("/trpc");

  // For API requests, return 401 JSON instead of redirecting to sign-in
  if (isApiRoute) {
    if (!userId) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }
    return NextResponse.next();
  }

  if (userId && isPublicRoute(request) && !authFlowRoutes.includes(url.pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!isPublicRoute(request)) {
    await auth.protect({
      unauthenticatedUrl: `${url.origin}/sign-in?redirect_url=${encodeURIComponent(url.pathname + url.search)}`,
    });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};