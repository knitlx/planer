import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { RateLimiterMemory } from "rate-limiter-flexible";

// Rate limiters for different endpoints
const loginLimiter = new RateLimiterMemory({
  keyPrefix: "login_fail",
  points: 5, // 5 attempts
  duration: 60 * 15, // per 15 minutes
});

const apiLimiter = new RateLimiterMemory({
  keyPrefix: "api_general",
  points: 100, // 100 requests
  duration: 60, // per minute
});

const strictLimiter = new RateLimiterMemory({
  keyPrefix: "api_strict",
  points: 20, // 20 requests
  duration: 60, // per minute
});

// Paths that need strict rate limiting
const STRICT_PATHS = [
  "/api/ai/agent",
  "/api/ai/transcribe",
  "/api/telegram/webhook",
];

// Paths with auth rate limiting
const AUTH_PATHS = ["/api/auth/login"];

export async function rateLimitMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
    || request.headers.get("x-real-ip") 
    || "anonymous";
  
  try {
    // Strict limit for AI endpoints
    if (STRICT_PATHS.some((path) => pathname.startsWith(path))) {
      await strictLimiter.consume(ip);
    }
    
    // Login rate limiting
    if (AUTH_PATHS.some((path) => pathname === path)) {
      await loginLimiter.consume(ip);
    }
    
    // General API rate limiting
    if (pathname.startsWith("/api/")) {
      await apiLimiter.consume(ip);
    }
    
    return null; // Continue to next middleware/handler
  } catch {
    return NextResponse.json(
      { error: "Too many requests", code: "RATE_LIMITED" },
      { status: 429 }
    );
  }
}
