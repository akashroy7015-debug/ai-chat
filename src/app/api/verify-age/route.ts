import type { NextRequest } from "next/server";
import { beginVerification, completeVerification } from "@/lib/age/verification";
import { getUser } from "@/lib/store";
import { grantTrialOnce } from "@/lib/tokens/ledger";
import { errorResponse, json, userIdFrom } from "@/lib/http";

export async function GET(req: NextRequest) {
  const id = userIdFrom(req);
  return json(id, { ageStatus: getUser(id.userId).ageStatus });
}

export async function POST(req: NextRequest) {
  const id = userIdFrom(req);
  try {
    const { action } = (await req.json().catch(() => ({}))) as { action?: string };
    if (action === "complete") {
      const status = await completeVerification(id.userId);
      if (status === "verified") grantTrialOnce(id.userId);
      return json(id, { ageStatus: status });
    }
    const { redirectUrl } = await beginVerification(id.userId);
    return json(id, { redirectUrl, ageStatus: "pending" });
  } catch (e) {
    return errorResponse(id, e);
  }
}
