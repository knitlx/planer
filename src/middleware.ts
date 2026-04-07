import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession, SessionOptions } from "iron-session";
import { SessionData } from "./lib/auth";
import { rateLimitMiddleware } from "./lib/rate-limit";

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "planer_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  },
};

// CORS headers for API routes
const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_APP_URL || "https://planer.nochaos.space",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/session",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

// Check if path is public
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle CORS preflight requests
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Apply rate limiting for API routes
  if (pathname.startsWith("/api/")) {
    const rateLimitResponse = await rateLimitMiddleware(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }

  // Allow public paths
  if (isPublicPath(pathname)) {
    const response = NextResponse.next();
    // Add CORS headers to public API responses
    if (pathname.startsWith("/api/")) {
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }
    return response;
  }

  // Check session using cookie header
  const cookieHeader = request.headers.get("cookie") || "";
  const sessionCookie = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith(`${sessionOptions.cookieName}=`));

  let isLoggedIn = false;
  if (sessionCookie) {
    try {
      // Create a minimal cookie store for middleware check
      const mockCookieStore = {
        get: (name: string) => {
          if (name === sessionOptions.cookieName) {
            const value = sessionCookie.split("=")[1];
            return value ? { name, value: decodeURIComponent(value) } : undefined;
          }
          return undefined;
        },
        set: () => {},
      };
      const session = await getIronSession<SessionData>(mockCookieStore as any, sessionOptions);
      isLoggedIn = session.isLoggedIn;
    } catch {
      isLoggedIn = false;
    }
  }

  if (!isLoggedIn) {
    // Redirect to login for page requests
    if (!pathname.startsWith("/api/")) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Return 401 for API requests
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Add CORS headers to authenticated API responses
  const response = NextResponse.next();
  if (pathname.startsWith("/api/")) {
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
