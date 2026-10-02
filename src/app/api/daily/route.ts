import { claimDaily, dailyStatus } from "@/lib/engagement";
import { requireVerifiedAdult } from "@/lib/age/verification";
import { authed, json } from "@/lib/http";

export const GET = authed(async (_req, userId) => json(dailyStatus(userId)));
export const POST = authed(async (_req, userId) => { requireVerifiedAdult(userId); return json(claimDaily(userId)); });
