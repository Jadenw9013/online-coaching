import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/privacy",
  "/terms",
  "/sms-policy",
  "/about",
  "/coaches",
  "/coaches/:slug",
  "/api/webhooks(.*)",
  "/api/cron(.*)",
  "/api/public(.*)",
  ...(process.env.NODE_ENV === "development" ? [
    "/api/dev/test-sms(.*)",
    "/api/dev/sms-smoke(.*)"
  ] : [])
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }
  await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
