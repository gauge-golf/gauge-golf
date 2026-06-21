// Shared types for the Coach AI report (kept out of "use server" files,
// which may only export async functions).

export type CoachReportPayload = {
  plan: unknown; // session plan (clubs + ball counts)
  results: unknown; // logged shots
  stats: unknown; // computed per-club statistics
};

export type CoachReport = {
  strongestClub: string;
  weakestClub: string;
  missPattern: string;
  recommendations: string[]; // exactly 3
  nextSessionPlan: Record<string, number>; // club -> ball count
};

export type CoachReportState =
  | { ok: true; report: CoachReport }
  | { ok: false; message: string };
