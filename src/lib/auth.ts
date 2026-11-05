import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { UserRole } from "@/models/User";

export const AUTH_COOKIE_NAME = "edunexus_token";
const TOKEN_EXPIRY = "7d";

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not configured");
  }
  return secret;
}

/**
 * Hash a plaintext password with bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Compare a plaintext password with a hashed password
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Generate a signed JWT
 */
export function signJwt(payload: TokenPayload): string {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, {
    expiresIn: TOKEN_EXPIRY,
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyJwt(token: string): TokenPayload | null {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Retrieve the token string from cookies or Authorization header
 */
export async function getTokenFromRequest(
  req?: NextRequest
): Promise<string | null> {
  if (req) {
    // 1. Check HTTP-only cookie in NextRequest
    const cookieToken = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (cookieToken) return cookieToken;

    // 2. Check Authorization Bearer header
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      return authHeader.substring(7);
    }
  }

  // 3. Fallback to Next.js next/headers cookies()
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    return token || null;
  } catch {
    return null;
  }
}

/**
 * Extract authenticated user payload from current request
 */
export async function getAuthenticatedUser(
  req?: NextRequest
): Promise<TokenPayload | null> {
  const token = await getTokenFromRequest(req);
  if (!token) {
    return null;
  }
  return verifyJwt(token);
}

/**
 * Check if the user has one of the required roles
 */
export function hasRole(
  user: TokenPayload | null,
  allowedRoles: UserRole[]
): boolean {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

