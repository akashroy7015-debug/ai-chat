/**
 * Dev-only in-memory store. Production uses Postgres (db/schema.sql); the shapes
 * below mirror those tables so swapping in a real adapter is mechanical.
 */
import type { Character } from "./characters/schema";

export type AgeStatus = "unverified" | "pending" | "verified" | "rejected";

export interface User {
  id: string;
  ageStatus: AgeStatus;
  ageVerificationRef?: string;
  banned: boolean;
  strikes: number;
}

export interface LedgerEntry {
  id: string;
  userId: string;
  delta: number;
  reason: string;
  at: number;
}

export interface Message {
  id: string;
  userId: string;
  characterId: string;
  role: "user" | "assistant";
  content: string;
  at: number;
}

export interface AuditEntry {
  at: number;
  userId: string;
  kind: string;
  category?: string;
  detail: string;
}

interface DB {
  users: Map<string, User>;
  characters: Map<string, Character>;
  ledger: LedgerEntry[];
  messages: Message[];
  facts: Map<string, string[]>;
  audit: AuditEntry[];
}

const g = globalThis as unknown as { __db?: DB };

export const db: DB = (g.__db ??= {
  users: new Map(),
  characters: new Map(),
  ledger: [],
  messages: [],
  facts: new Map(),
  audit: [],
});

export function getUser(id: string): User {
  let u = db.users.get(id);
  if (!u) {
    u = { id, ageStatus: "unverified", banned: false, strikes: 0 };
    db.users.set(id, u);
  }
  return u;
}

export function audit(entry: Omit<AuditEntry, "at">) {
  db.audit.push({ at: Date.now(), ...entry });
}

export const newId = () => crypto.randomUUID();
