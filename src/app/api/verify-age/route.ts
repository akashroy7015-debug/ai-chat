import { beginVerification, completeVerification, selfDeclareAge } from "@/lib/age/verification";
import { getUser } from "@/lib/store";
import { clientIp, grantTrialIfEligible } from "@/lib/trial";
import { authed, body, json } from "@/lib/http";

export const GET = authed(async (_req, userId) => json({ ageStatus: getUser(userId).ageStatus }));

export const POST = authed(async (req, userId) => {
  const { action, birthDate } = await body<{ action: string; birthDate: string }>(req);
  if (action === "self") {
    selfDeclareAge(userId, String(birthDate ?? ""));
    grantTrialIfEligible(userId, clientIp(req.headers));
    return json({ ageStatus: "verified" });
  }
  if (action === "complete") {
    const status = await completeVerification(userId);
    if (status === "verified") grantTrialIfEligible(userId, clientIp(req.headers));
    return json({ ageStatus: status });
  }
  const { redirectUrl } = await beginVerification(userId);
  return json({ redirectUrl, ageStatus: "pending" });
});
