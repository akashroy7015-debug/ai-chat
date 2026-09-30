import { audit, getUser, type User } from "../store";

/**
 * Age verification is delegated to a third-party ID + selfie provider
 * (Persona / Veriff / Yoti). We store only the outcome and a reference id,
 * never the ID document or selfie.
 */
export interface AgeProvider {
  start(userId: string): Promise<{ ref: string; redirectUrl: string }>;
  result(ref: string): Promise<"verified" | "rejected" | "pending">;
}

/** Dev mock: verification "passes" on the first result poll. Never use in production. */
export const mockProvider: AgeProvider = {
  async start(userId) {
    return { ref: `mock_${userId}`, redirectUrl: "/verify/mock" };
  },
  async result() {
    return "verified";
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
  audit({ userId, kind: "age_verification_started", detail: ref });
  return { redirectUrl };
}

export async function completeVerification(userId: string) {
  const user = getUser(userId);
  if (!user.ageVerificationRef) throw new Error("No verification in progress");
  const outcome = await getProvider().result(user.ageVerificationRef);
  if (outcome !== "pending") user.ageStatus = outcome;
  audit({ userId, kind: "age_verification_result", detail: outcome });
  return user.ageStatus;
}

export class AccessDenied extends Error {
  constructor(
    public code: "age_verification_required" | "banned",
    message: string,
    public status = 403,
  ) {
    super(message);
  }
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
