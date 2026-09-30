import { explicitAllowed, requireVerifiedAdult } from "@/lib/age/verification";
import { audit, getUser, saveUser } from "@/lib/store";
import { explicitAllowedIn, GRIEVANCE_OFFICER } from "@/lib/jurisdiction";
import { authed, body, json } from "@/lib/http";

export const GET = authed(async (_req, userId) => {
  const u = getUser(userId);
  return json({
    explicitOptIn: u.explicitOptIn,
    explicitActive: explicitAllowed(u),
    explicitAvailable: process.env.ALLOW_EXPLICIT === "true" && explicitAllowedIn(u.lastCountry, u.idCountry),
    grievanceOfficer: GRIEVANCE_OFFICER,
  });
});

/** Opt in/out of adult content. Requires ID-verified adult in an allowed country; audited. */
export const POST = authed(async (req, userId) => {
  const u = requireVerifiedAdult(userId);
  const { explicit } = await body<{ explicit: boolean }>(req);
  if (typeof explicit !== "boolean") return json({ error: "explicit must be boolean" }, 400);
  if (explicit && u.ageMethod !== "id_document") return json({ error: "ID verification required" }, 403);
  if (explicit && !explicitAllowedIn(u.lastCountry, u.idCountry)) return json({ error: "Adult content is not available in your country." }, 451);
  u.explicitOptIn = explicit;
  saveUser(u);
  audit({ userId: u.id, kind: "explicit_opt_in", detail: String(explicit) });
  return json({ explicitOptIn: u.explicitOptIn, explicitActive: explicitAllowed(u) });
});
