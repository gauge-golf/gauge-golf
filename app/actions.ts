"use server";

import { headers } from "next/headers";
import { sql } from "@/lib/db";

export type ReserveState = { ok: boolean; message: string };

const required = (v: FormDataEntryValue | null) =>
  typeof v === "string" && v.trim().length > 0 ? v.trim() : "";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function reserve(_prev: ReserveState, fd: FormData): Promise<ReserveState> {
  const name = required(fd.get("name"));
  const email = required(fd.get("email")).toLowerCase();
  const country = required(fd.get("country"));
  const social = required(fd.get("social")) || null;
  const handicap = required(fd.get("handicap")) || null;
  const volume = required(fd.get("volume")) || null;
  const message = required(fd.get("message")) || null;

  if (!name || !email || !country) {
    return { ok: false, message: "Please fill in name, email and country." };
  }
  if (!emailRe.test(email)) {
    return { ok: false, message: "That email doesn't look right." };
  }
  if (name.length > 120 || email.length > 200 || (message?.length ?? 0) > 2000) {
    return { ok: false, message: "Some fields are too long." };
  }

  const h = await headers();
  const userAgent = h.get("user-agent") ?? null;
  const referer = h.get("referer") ?? null;

  try {
    await sql`
      insert into leads (name, email, country, social, handicap, volume, message, user_agent, referer)
      values (${name}, ${email}, ${country}, ${social}, ${handicap}, ${volume}, ${message}, ${userAgent}, ${referer})
      on conflict (lower(email)) do update set
        name = excluded.name,
        country = excluded.country,
        social = excluded.social,
        handicap = excluded.handicap,
        volume = excluded.volume,
        message = excluded.message
    `;
    return { ok: true, message: "You're on the list. Konstantin will reply personally." };
  } catch (err) {
    console.error("reserve() failed:", err);
    return { ok: false, message: "Something broke on our side. Try again in a moment." };
  }
}
