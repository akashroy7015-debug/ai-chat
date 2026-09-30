import { balance } from "@/lib/tokens/ledger";
import { authed, json } from "@/lib/http";

export const GET = authed(async (_req, userId) => json({ balance: balance(userId) }));
