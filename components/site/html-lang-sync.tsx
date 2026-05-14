"use client";

import { useEffect } from "react";
import type { Locale } from "@/lib/i18n";

/**
 * Sets <html lang> on mount for sub-locale routes (e.g. /ko).
 * Root layout ships lang="en"; this updates it before paint on the client.
 * Used in app/ko/layout.tsx.
 */
export function HtmlLangSync({ locale }: { locale: Locale }) {
  useEffect(() => {
    const prev = document.documentElement.lang;
    document.documentElement.lang = locale;
    return () => {
      document.documentElement.lang = prev;
    };
  }, [locale]);
  return null;
}
