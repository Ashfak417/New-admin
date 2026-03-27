// src\lib\auth.ts
/**
 * Client-side cookie utilities for authentication in Next.js App Router
 * 
 * IMPORTANT:
 *   - These functions only work on the CLIENT side (use "use client")
 *   - Returns null / empty values when called on server components
 *   - Uses plain document.cookie (no external libraries needed)
 */

export function getCookie(name: string): string | null {
  // Prevent execution during SSR / server components
  if (typeof window === 'undefined') {
    return null;
  }

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }

  return null;
}

/**
 * Get the authentication JWT token
 */
export function getAuthToken(): string | null {
  return getCookie('adminToken');
}

/**
 * Get the user's role (superadmin / admin / guest)
 */
export function getAuthRole(): string {
  return getCookie('adminRole') || 'guest';
}

/**
 * Get the display name of the logged-in admin
 */
export function getAuthName(): string {
  return getCookie('adminName') || 'Admin';
}

/**
 * Get the phone number (if stored during login)
 */
export function getAuthPhone(): string {
  return getCookie('adminPhone') || '';
}

/**
 * Get the user ID (if your backend includes it in JWT / login response)
 */
export function getAuthUserId(): string {
  return getCookie('adminUserId') || '';
}

/**
 * Check if user is authenticated (quick helper)
 * Useful in protected client components / layouts
 */
export function isAuthenticated(): boolean {
  const token = getAuthToken();
  const role = getAuthRole();
  return !!token && role !== 'guest';
}

/**
 * Clear all authentication cookies and redirect to login
 * 
 * Call this function when user logs out or session is invalid
 */
export function logout(redirect: boolean = true): void {
  if (typeof window === 'undefined') return;

  const expired = 'Thu, 01 Jan 1970 00:00:01 GMT';

  document.cookie = `adminToken=; Path=/; Expires=${expired}; SameSite=Strict`;
  document.cookie = `adminRole=; Path=/; Expires=${expired}; SameSite=Strict`;
  document.cookie = `adminName=; Path=/; Expires=${expired}; SameSite=Strict`;
  document.cookie = `adminPhone=; Path=/; Expires=${expired}; SameSite=Strict`;
  document.cookie = `adminUserId=; Path=/; Expires=${expired}; SameSite=Strict`;

  // Optional: clear any other auth-related cookies you might have
  // document.cookie = `other_cookie=; Path=/; Expires=${expired}; SameSite=Strict`;

  if (redirect) {
    window.location.href = '/admin/login';
  }
}

/**
 * Optional: Helper to set a cookie manually
 * (you usually don't need this – login sets them)
 */
export function setCookie(
  name: string,
  value: string,
  days: number = 7,
  secure: boolean = process.env.NODE_ENV === 'production'
): void {
  if (typeof window === 'undefined') return;

  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = `; Expires=${date.toUTCString()}`;
  }

  const secureFlag = secure ? '; Secure' : '';
  document.cookie = `${name}=${value}${expires}; Path=/; SameSite=Strict${secureFlag}`;
}