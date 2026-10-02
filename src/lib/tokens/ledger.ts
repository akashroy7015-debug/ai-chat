import { db, newId } from "../store";

export const COSTS = { chat: 1, voice: 5, image: 20 } as const;
/** Free credits on signup: one credit per chat message. */
export const FREE_TRIAL_TOKENS = 10;

export class InsufficientTokens extends Error {
  status = 402;
  constructor(public balance: number, public needed: number) {
    super("Insufficient tokens");
  }
}

export function balance(userId: string): number {
  return db.ledger.reduce((sum, e) => (e.userId === userId ? sum + e.delta : sum), 0);
}

export function credit(userId: string, amount: number, reason: string) {
  if (!Number.isInteger(amount) || amount <= 0) throw new Error("credit must be a positive integer");
  db.ledger.push({ id: newId(), userId, delta: amount, reason, at: Date.now() });
}

/** Append-only ledger: spends are negative entries; balance is derived, never stored. */
export function spend(userId: string, amount: number, reason: string) {
  if (!Number.isInteger(amount) || amount <= 0) throw new Error("spend must be a positive integer");
  const bal = balance(userId);
  if (bal < amount) throw new InsufficientTokens(bal, amount);
  db.ledger.push({ id: newId(), userId, delta: -amount, reason, at: Date.now() });
}

/** Grant the free trial once per user. */
export function grantTrialOnce(userId: string) {
  if (!db.ledger.some((e) => e.userId === userId && e.reason === "free_trial")) {
    credit(userId, FREE_TRIAL_TOKENS, "free_trial");
  }
}
