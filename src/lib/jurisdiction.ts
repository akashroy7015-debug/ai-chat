/**
 * Country rules. Explicit content is legal for adults in some countries and a criminal offence to
 * publish/transmit in others. The strictest applicable rule wins. Have counsel review this table.
 */

/**
 * Countries where explicit mode is never offered.
 * IN: IT Act 2000 s.67/67A criminalise publishing or transmitting sexually explicit material
 * electronically; BNS s.294 (obscenity). Default list is deliberately conservative.
 */
const DEFAULT_EXPLICIT_BLOCKED = ["IN", "PK", "BD", "CN", "AE", "SA", "QA", "KW", "BH", "OM", "IR", "ID", "MY", "TR", "EG"];

export function explicitBlockedCountries(): Set<string> {
  const extra = (process.env.EXPLICIT_BLOCKED_COUNTRIES ?? "").split(",").map((c) => c.trim().toUpperCase()).filter(Boolean);
  return new Set([...DEFAULT_EXPLICIT_BLOCKED, ...extra]);
}

/**
 * A user may get explicit content only if BOTH their request country and the country on their verified
 * ID are known and allowed. Unknown country fails closed.
 */
export function explicitAllowedIn(requestCountry: string | undefined, idCountry: string | undefined): boolean {
  if (!requestCountry || !idCountry) return false;
  const blocked = explicitBlockedCountries();
  return !blocked.has(requestCountry.toUpperCase()) && !blocked.has(idCountry.toUpperCase());
}

/** Country from the CDN/proxy header in front of the app (Cloudflare or Vercel). */
export function countryFromHeaders(h: Headers): string | undefined {
  const c = h.get("cf-ipcountry") ?? h.get("x-vercel-ip-country") ?? undefined;
  return c && /^[A-Z]{2}$/i.test(c) && c !== "XX" && c !== "T1" ? c.toUpperCase() : undefined;
}

/** Grievance Officer contact required for intermediaries under India's IT Rules 2021. */
export const GRIEVANCE_OFFICER = {
  name: process.env.GRIEVANCE_OFFICER_NAME ?? "Support Team",
  email: process.env.GRIEVANCE_OFFICER_EMAIL ?? "rizzlabsupport@gmail.com",
  /** IT Rules 2021: acknowledge in 24h, resolve in 15 days; non-consensual intimate imagery removed within 24h. */
  ackHours: 24,
  resolveDays: 15,
  nciiRemovalHours: 24,
};
