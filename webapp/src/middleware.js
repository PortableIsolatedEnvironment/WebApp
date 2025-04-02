import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";
import { getLocale } from "next-intl/server";

// Create the internationalization middleware
const intlMiddleware = createIntlMiddleware(routing);

// Middleware function that handles both i18n and authentication
export default async function middleware(request) {
  // Check if the URL is for the login page (considering all locales)
  const isLoginPage = /\/[^/]+\/login(\/)?$/.test(request.nextUrl.pathname);

  // Get the user from cookies if available
  const currentUser = request.cookies.get("currentUser")?.value;

  // If user is not authenticated and not on login page, redirect to login
  if (!currentUser && !isLoginPage) {
    let locale;

    try {
      locale = await getLocale(request);
    } catch {
      locale = routing.defaultLocale;
    }

    const url = new URL(`/${locale}/login`, request.nextUrl.origin);
    return NextResponse.redirect(url);
  }

  // Process i18n middleware
  return intlMiddleware(request);
}

// Use a simple matcher pattern
export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\.(?:jpg|png|gif|ico|svg)$).*)"],
};
