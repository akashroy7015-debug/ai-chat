import { audit, getUser, saveUser, type User } from "../store";
import { explicitAllowedIn } from "../jurisdiction";

/**
 * Age verification is delegated to a third-party ID + selfie provider
 * (Persona / Veriff / Yoti). We store only the outcome and a reference id,
 * never the ID document or selfie.
 */
export interface AgeProvider {
  start(userId: string): Promise<{ ref: string; redirectUrl: string }>;
  /** Must only return "verified" after a government ID document + liveness selfie check with DOB >= 18. */
  result(ref: string): Promise<"verified" | "rejected" | "pending">;
  /** ISO country of the verified ID document. */
  idCountry?(ref: string): Promise<string | undefined>;
}

/** Dev mock: verification "passes" on the first result poll. Never use in production. */
export const mockProvider: AgeProvider = {
  async start(userId) {
    return { ref: `mock_${userId}`, redirectUrl: "/verify/mock" };
  },
  async result() {
    return "verified";
  },
  async idCountry() {
    return process.env.MOCK_ID_COUNTRY || undefined;
  },
};

export function getProvider(): AgeProvider {
  if (process.env.AGE_PROVIDER === "mock" || !process.env.AGE_PROVIDER) {
    if (process.env.NODE_ENV === "production" && !process.env.AGE_PROVIDER) {
      throw new Error("AGE_PROVIDER must be configured in production");
    }
    return mockProvider;
  }
  throw new Error(`Unknown AGE_PROVIDER: ${process.env.AGE_PROVIDER}`);
}

export async function beginVerification(userId: string) {
  const user = getUser(userId);
  const { ref, redirectUrl } = await getProvider().start(userId);
  user.ageStatus = "pending";
  user.ageVerificationRef = ref;
  saveUser(user);
  audit({ userId, kind: "age_verification_started", detail: ref });
  return { redirectUrl };
}

export async function completeVerification(userId: string) {
  const user = getUser(userId);
  if (!user.ageVerificationRef) throw new Error("No verification in progress");
  const outcome = await getProvider().result(user.ageVerificationRef);
  if (outcome !== "pending") user.ageStatus = outcome;
  if (outcome === "verified") {
    user.ageMethod = "id_document";
    user.idCountry = (await getProvider().idCountry?.(user.ageVerificationRef))?.toUpperCase();
  }
  saveUser(user);
  audit({ userId, kind: "age_verification_result", detail: outcome });
  return user.ageStatus;
}

/** Age in whole years on `now` for a YYYY-MM-DD birth date, or null if the date is invalid. */
export function ageFromBirthDate(birthDate: string, now = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d || dt > now) return null;
  let age = now.getUTCFullYear() - y;
  if (now.getUTCMonth() < mo - 1 || (now.getUTCMonth() === mo - 1 && now.getUTCDate() < d)) age--;
  return age;
}

/**
 * Age gate: the user states their date of birth and confirms they are 18+.
 * Under-18 dates are refused and recorded so the account cannot simply retry with another date.
 * Explicit mode still needs a real ID-document check (ageMethod "id_document").
 */
export function selfDeclareAge(userId: string, birthDate: string): User {
  const user = getUser(userId);
  if (user.ageStatus === "rejected") throw new AccessDenied("age_verification_required", "This account can't be used. FlirtIQ is for adults 18+ only.");
  const age = ageFromBirthDate(birthDate);
  if (age === null || age > 100) throw new AccessDenied("age_verification_required", "Enter a valid date of birth.", 400);
  if (age < 18) {
    user.ageStatus = "rejected";
    saveUser(user);
    audit({ userId, kind: "age_gate_underage", detail: "" });
    throw new AccessDenied("age_verification_required", "Sorry, FlirtIQ is only for adults 18 and over.");
  }
  user.birthDate = birthDate;
  if (user.ageStatus !== "verified") {
    user.ageStatus = "verified";
    user.ageMethod = "self_declared";
  }
  saveUser(user);
  audit({ userId, kind: "age_self_declared", detail: String(age) });
  return user;
}

export class AccessDenied extends Error {
  constructor(
    public code: "age_verification_required" | "banned" | "login_required" | "premium_required" | "payments_unavailable",
    message: string,
    public status = 403,
  ) {
    super(message);
  }
}

/** Explicit mode needs: global flag, ID-document verification, and the user's own opt-in. */
export function explicitAllowed(user: User): boolean {
  return (
    process.env.ALLOW_EXPLICIT === "true" &&
    !user.banned &&
    user.ageStatus === "verified" &&
    user.ageMethod === "id_document" &&
    user.explicitOptIn &&
    explicitAllowedIn(user.lastCountry, user.idCountry)
  );
}

/** Gate for every route that creates characters, chats, or spends tokens. */
export function requireVerifiedAdult(userId: string): User {
  const user = getUser(userId);
  if (user.banned) throw new AccessDenied("banned", "Account suspended.");
  if (user.ageStatus !== "verified") {
    throw new AccessDenied("age_verification_required", "Age verification required.");
  }
  return user;
}
