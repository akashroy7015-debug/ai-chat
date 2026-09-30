import type { NextRequest } from "next/server";
import { explicitAllowed, requireVerifiedAdult } from "@/lib/age/verification";
import { audit, getUser } from "@/lib/store";
import { errorResponse, json, userIdFrom } from "@/lib/http";

export async function GET(req: NextRequest) {
  const id = userIdFrom(req);
  const u = getUser(id.userId);
  return json(id, {
    explicitOptIn: u.explicitOptIn,
    explicitActive: explicitAllowed(u),
    explicitAvailable: process.env.ALLOW_EXPLICIT === "true",
  });
}

/** Opt in/out of adult content. Requires ID-verified adult; opting in is audited. */
export async function POST(req: NextRequest) {
  const id = userIdFrom(req);
  try {
    const u = requireVerifiedAdult(id.userId);
    const { explicit } = (await req.json().catch(() => ({}))) as { explicit?: boolean };
    if (typeof explicit !== "boolean") return json(id, { error: "explicit must be boolean" }, 400);
    if (explicit && u.ageMethod !== "id_document") return json(id, { error: "ID verification required" }, 403);
    u.explicitOptIn = explicit;
    audit({ userId: u.id, kind: "explicit_opt_in", detail: String(explicit) });
    return json(id, { explicitOptIn: u.explicitOptIn, explicitActive: explicitAllowed(u) });
  } catch (e) {
    return errorResponse(id, e);
  }
}
