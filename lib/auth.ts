import crypto from "crypto";

/** Auth shared types + helpers. No "use server" here so we can export sync utils. */

/** Player's primary training goal — a profile-level value set once at signup. */
export type PlayerGoal =
  | "consistency"
  | "lower_handicap"
  | "distance"
  | "general";

/** Goal options for the registration UI (label + short description). */
export const GOAL_OPTIONS: {
  value: PlayerGoal;
  label: string;
  description: string;
}[] = [
  {
    value: "consistency",
    label: "Consistency",
    description: "Stable, repeatable strikes with every club.",
  },
  {
    value: "lower_handicap",
    label: "Lower Handicap",
    description: "Train to drop your number.",
  },
  {
    value: "distance",
    label: "Distance",
    description: "More power on mid and long clubs.",
  },
  {
    value: "general",
    label: "General Practice",
    description: "Stay sharp across the bag.",
  },
];

export type AuthUser = {
  id: string; // friendly id, e.g. GG-48291
  email: string;
  goal?: PlayerGoal | null;
  targetHandicap?: number | null;
};

export const SESSION_COOKIE = "gg_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 365; // 1 year (auto sign-in)
export const OTP_TTL_MS = 10 * 60 * 1000; // codes valid for 10 minutes

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return s;
}

function hmac(value: string): string {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

/** Sign a session token as `userId.signature` (tamper-proof, stateless). */
export function signSession(userId: string): string {
  return `${userId}.${hmac(userId)}`;
}

/** Verify a session token and return the userId, or null if invalid. */
export function verifySession(token: string | undefined | null): string | null {
  if (!token) return null;
  const idx = token.lastIndexOf(".");
  if (idx <= 0) return null;
  const userId = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = hmac(userId);
  // Constant-time compare.
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return userId;
}

/** Hash an OTP code before storing it (never store raw codes). */
export function hashCode(email: string, code: string): string {
  return hmac(`${email.toLowerCase()}:${code}`);
}

/** Generate a 6-digit numeric OTP. */
export function generateOtp(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Generate a friendly user id like GG-48291. */
export function generateUserId(): string {
  return `GG-${crypto.randomInt(10000, 100000)}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}
