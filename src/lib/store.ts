/**
 * Persistence. Records live in SQLite (one file, DB_PATH, default ./data/app.db) and are cached
 * in memory. Maps and lists write through on set/push. Code that mutates a record in place
 * must call `save*` afterwards.
 * Tests (and DB_PATH=":memory:") use an in-memory database.
 */
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type { Character } from "./characters/schema";

export type AgeStatus = "unverified" | "pending" | "verified" | "rejected";

export interface User {
  id: string;
  email?: string;
  passwordHash?: string;
  /** User ticked "I am 18+ and accept the Terms" at signup (in addition to ID verification). */
  acceptedTermsAt?: number;
  ageStatus: AgeStatus;
  ageVerificationRef?: string;
  /** How age was proven. Only "id_document" unlocks explicit mode. */
  ageMethod?: "id_document" | "self_declared";
  /** Date of birth given at signup (YYYY-MM-DD). */
  birthDate?: string;
  explicitOptIn: boolean;
  /** ISO country from the verified ID document. */
  idCountry?: string;
  /** ISO country of the user's most recent request (CDN geo header). Not persisted on every request. */
  lastCountry?: string;
  banned: boolean;
  strikes: number;
  /** Preferred chat language. */
  lang?: "auto" | "en" | "hi" | "hinglish";
  premiumUntil?: number;
  dailyStreak?: number;
  lastDailyClaim?: number;
  premiumPlan?: string;
  premiumLastGrant?: number;
  createdAt?: number;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: number;
}

export interface Order {
  id: string;
  userId: string;
  pkg: string;
  paid: boolean;
  createdAt?: number;
  paidAt?: number;
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
  /** A photo/video she "sends": her portrait or looping clip. */
  image?: "portrait" | "clip";
  at: number;
}

export interface AuditEntry {
  at: number;
  userId: string;
  kind: string;
  category?: string;
  detail: string;
}

function open(): Database.Database {
  const file = process.env.VITEST ? ":memory:" : (process.env.DB_PATH ?? path.join(process.cwd(), "data", "app.db"));
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  const sql = new Database(file);
  sql.pragma("journal_mode = WAL");
  sql.exec(`
    CREATE TABLE IF NOT EXISTS records (coll TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY (coll, id));
    CREATE TABLE IF NOT EXISTS logs (seq INTEGER PRIMARY KEY AUTOINCREMENT, coll TEXT NOT NULL, data TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS logs_coll ON logs (coll, seq);
  `);
  return sql;
}

const noDone = (_k: string, v: unknown) => (v instanceof Promise ? undefined : v);

/** Map that writes every set/delete to SQLite. */
export class PMap<V extends object> extends Map<string, V> {
  constructor(private sql: Database.Database, private coll: string) {
    super();
    for (const r of sql.prepare("SELECT id, data FROM records WHERE coll = ?").all(coll) as { id: string; data: string }[]) {
      super.set(r.id, JSON.parse(r.data));
    }
  }
  override set(id: string, v: V): this {
    // `super` isn't available until the constructor finishes loading; guard for Map's own constructor call.
    if (this.sql) this.sql.prepare("INSERT OR REPLACE INTO records (coll, id, data) VALUES (?, ?, ?)").run(this.coll, id, JSON.stringify(v, noDone));
    return super.set(id, v);
  }
  override delete(id: string): boolean {
    this.sql.prepare("DELETE FROM records WHERE coll = ? AND id = ?").run(this.coll, id);
    return super.delete(id);
  }
  /** Persist a record that was mutated in place. */
  save(id: string) {
    const v = super.get(id);
    if (v) this.set(id, v);
  }
}

/** Append-only list that writes every push to SQLite. */
export class PList<T> extends Array<T> {
  static override get [Symbol.species]() {
    return Array;
  }
  private sql!: Database.Database;
  private coll!: string;
  static load<T>(sql: Database.Database, coll: string): PList<T> {
    const l = new PList<T>();
    l.sql = sql;
    l.coll = coll;
    for (const r of sql.prepare("SELECT data FROM logs WHERE coll = ? ORDER BY seq").all(coll) as { data: string }[]) {
      Array.prototype.push.call(l, JSON.parse(r.data));
    }
    return l;
  }
  override push(...items: T[]): number {
    const ins = this.sql.prepare("INSERT INTO logs (coll, data) VALUES (?, ?)");
    for (const i of items) ins.run(this.coll, JSON.stringify(i));
    return super.push(...items);
  }
}

interface DB {
  sql: Database.Database;
  users: PMap<User>;
  sessions: PMap<Session>;
  characters: PMap<Character>;
  orders: PMap<Order>;
  ledger: PList<LedgerEntry>;
  messages: PList<Message>;
  facts: PMap<{ list: string[] }>;
  audit: PList<AuditEntry>;
}

const g = globalThis as unknown as { __db?: DB };

function init(): DB {
  const sql = open();
  return {
    sql,
    users: new PMap(sql, "users"),
    sessions: new PMap(sql, "sessions"),
    characters: new PMap(sql, "characters"),
    orders: new PMap(sql, "orders"),
    ledger: PList.load(sql, "ledger"),
    messages: PList.load(sql, "messages"),
    facts: new PMap(sql, "facts"),
    audit: PList.load(sql, "audit"),
  };
}

export const db: DB = (g.__db ??= init());

export function getUser(id: string): User {
  let u = db.users.get(id);
  if (!u) {
    u = { id, ageStatus: "unverified", banned: false, strikes: 0, explicitOptIn: false, createdAt: Date.now() };
    db.users.set(id, u);
  }
  return u;
}

export function saveUser(u: User) {
  const { lastCountry: _transient, ...rest } = u;
  db.users.set(u.id, { ...rest, lastCountry: undefined } as User);
  // Keep the same object identity in the cache so callers holding `u` stay in sync.
  Map.prototype.set.call(db.users, u.id, u);
}

export function audit(entry: Omit<AuditEntry, "at">) {
  db.audit.push({ at: Date.now(), ...entry });
}

export const newId = () => crypto.randomUUID();
