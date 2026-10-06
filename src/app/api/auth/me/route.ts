import { authed, json } from "@/lib/http";
import { explicitAllowed } from "@/lib/age/verification";
import { explicitAllowedIn, GRIEVANCE_OFFICER } from "@/lib/jurisdiction";
import { balance } from "@/lib/tokens/ledger";
import { getUser } from "@/lib/store";
import { applyMonthlyGrant, isPremium } from "@/lib/premium";
import { isAdmin } from "@/lib/admin";
import { referralCode } from "@/lib/referral";

/** Everything the UI needs about the current user in one call. */
export const GET = authed(async (_req, userId) => {
  applyMonthlyGrant(userId);
  const u = getUser(userId);
  return json({
    id: u.id,
    email: u.email,
    ageStatus: u.ageStatus,
    balance: balance(userId),
    explicitOptIn: u.explicitOptIn,
    explicitActive: explicitAllowed(u),
    explicitAvailable: process.env.ALLOW_EXPLICIT === "true" && explicitAllowedIn(u.lastCountry, u.idCountry),
    grievanceOfficer: GRIEVANCE_OFFICER,
    premium: isPremium(u),
    lang: u.lang ?? "auto",
    premiumUntil: u.premiumUntil,
    admin: isAdmin(userId),
    referralCode: referralCode(userId),
  });
});
