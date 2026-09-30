import { beginVerification, completeVerification } from "@/lib/age/verification";
import { getUser } from "@/lib/store";
import { grantTrialOnce } from "@/lib/tokens/ledger";
import { authed, body, json } from "@/lib/http";

export const GET = authed(async (_req, userId) => json({ ageStatus: getUser(userId).ageStatus }));

export const POST = authed(async (req, userId) => {
  const { action } = await body<{ action: string }>(req);
  if (action === "complete") {
    const status = await completeVerification(userId);
    if (status === "verified") grantTrialOnce(userId);
    return json({ ageStatus: status });
  }
  const { redirectUrl } = await beginVerification(userId);
  return json({ redirectUrl, ageStatus: "pending" });
});
