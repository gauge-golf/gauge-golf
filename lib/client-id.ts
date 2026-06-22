// Anonymous per-device id (browser-only). Lets us track sessions and progress
// before a player registers — no login required.

const KEY = "gg_coach_client_id";

/** Get (or lazily create) the anonymous client id stored in localStorage. */
export function getClientId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `c_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}

/** Forget the current device id (used by the data-reset flow). */
export function clearClientId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
