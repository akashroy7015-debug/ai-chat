import type { NextRequest } from "next/server";
import { balance } from "@/lib/tokens/ledger";
import { json, userIdFrom } from "@/lib/http";

/** Top-ups are intentionally absent until a billing provider is wired up (see README). */
export async function GET(req: NextRequest) {
  const id = userIdFrom(req);
  return json(id, { balance: balance(id.userId) });
}
