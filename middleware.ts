import { authMiddleware } from "@clerk/nextjs";

export default async function middleware(req) {
  try {
    return await authMiddleware()(req);
  } catch (err) {
    console.error("Middleware error:", err);
    return new Response("Middleware failed", { status: 500 });
  }
}