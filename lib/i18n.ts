import en from "@/messages/en.json";
import ko from "@/messages/ko.json";

export const LOCALES = ["en", "ko"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

const messages = { en, ko } as const;

// Both locales share the same JSON shape (ko is authored from en).
export type Messages = typeof en;

export function getMessages(locale: Locale): Messages {
  return messages[locale] as Messages;
}

/**
 * Build an absolute href that respects the current locale.
 * EN lives at "/" so paths pass through untouched.
 * KO lives under "/ko".
 */
export function localeHref(locale: Locale, path: string): string {
  // path is expected to start with "/" (e.g. "/#story", "/privacy")
  if (locale === "en") return path;
  if (path === "/") return "/ko";
  return `/ko${path}`;
}
