// Weather snapshot for a session via Open-Meteo (free, no API key).
// Conditions affect ball flight (wind, air density), so we capture them at
// session start and feed them to the AI coach to explain distance swings.

export type SessionWeather = {
  tempC: number;
  apparentC: number;
  tempMaxC: number | null;
  tempMinC: number | null;
  windKmh: number;
  windDir: string; // compass, e.g. "SE"
  precipMm: number;
  humidityPct: number;
  pressureHpa: number;
  uvIndex: number;
  uvLabel: string;
};

const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

/** Wind bearing (degrees) -> 8-point compass label. */
export function windCompass(deg: number): string {
  return COMPASS[Math.round(deg / 45) % 8];
}

/** UV index -> human label (WHO bands). */
export function uvLabel(uv: number): string {
  if (uv < 3) return "Low";
  if (uv < 6) return "Moderate";
  if (uv < 8) return "High";
  if (uv < 11) return "Very High";
  return "Extreme";
}

/** Ask the browser for the current location. Resolves null if denied/unavailable. */
export function getCurrentPosition(
  timeoutMs = 8000
): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return resolve(null);
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      { timeout: timeoutMs, maximumAge: 10 * 60 * 1000 }
    );
  });
}

/** Fetch current conditions from Open-Meteo. Resolves null on any failure. */
export async function fetchWeather(
  lat: number,
  lon: number
): Promise<SessionWeather | null> {
  try {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      current:
        "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,surface_pressure,wind_speed_10m,wind_direction_10m,uv_index",
      daily: "temperature_2m_max,temperature_2m_min",
      wind_speed_unit: "kmh",
      timezone: "auto",
    });
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    const c = data.current ?? {};
    const d = data.daily ?? {};
    const uv = Number(c.uv_index ?? 0);
    const round = (v: unknown) => Math.round(Number(v ?? 0));
    return {
      tempC: round(c.temperature_2m),
      apparentC: round(c.apparent_temperature),
      tempMaxC: d.temperature_2m_max?.[0] != null ? round(d.temperature_2m_max[0]) : null,
      tempMinC: d.temperature_2m_min?.[0] != null ? round(d.temperature_2m_min[0]) : null,
      windKmh: round(c.wind_speed_10m),
      windDir: windCompass(Number(c.wind_direction_10m ?? 0)),
      precipMm: Number(c.precipitation ?? 0),
      humidityPct: round(c.relative_humidity_2m),
      pressureHpa: round(c.surface_pressure),
      uvIndex: round(uv),
      uvLabel: uvLabel(uv),
    };
  } catch {
    return null;
  }
}
