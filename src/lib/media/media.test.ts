import { describe, expect, it } from "vitest";
import { listMedia, MEDIA_COSTS, reportMedia, requestMedia, type Deps } from "./jobs";
import { mockMedia } from "./provider";
import { judge, type SafetyScanner } from "./safety";
import { beginVerification, completeVerification } from "../age/verification";
import { balance, credit } from "../tokens/ledger";
import { getUser } from "../store";

const scanner = (r: Partial<Awaited<ReturnType<SafetyScanner["scan"]>>>): Deps["scanner"] => () => ({
  scan: async () => ({ csamMatch: false, minApparentAge: 30, realPersonSimilarity: 0, ...r }),
});
const deps = (s: Deps["scanner"]): Deps => ({ provider: () => mockMedia, scanner: s });

async function user(id: string, tokens = 200) {
  await beginVerification(id);
  await completeVerification(id);
  credit(id, tokens, "test");
}

describe("judge", () => {
  it("blocks csam, young-looking and real-person outputs", () => {
    expect(judge({ csamMatch: true, minApparentAge: 40, realPersonSimilarity: 0 }).ok).toBe(false);
    expect(judge({ csamMatch: false, minApparentAge: 19, realPersonSimilarity: 0 }).ok).toBe(false);
    expect(judge({ csamMatch: false, minApparentAge: 30, realPersonSimilarity: 0.9 }).ok).toBe(false);
    expect(judge({ csamMatch: false, minApparentAge: 30, realPersonSimilarity: 0.1 }).ok).toBe(true);
  });
});

describe("requestMedia", () => {
  it("refuses unverified users", async () => {
    await expect(requestMedia("mu", "featured-1", "image", "portrait")).rejects.toThrow("Age verification required");
  });

  it("generates, charges and exposes a ready image", async () => {
    await user("m1");
    const job = await requestMedia("m1", "featured-1", "image", "beach", deps(scanner({})));
    await job.done;
    expect(job.status).toBe("ready");
    expect(balance("m1")).toBe(200 - MEDIA_COSTS.image);
    expect(listMedia("m1")[0].url).toBeTruthy();
    expect(listMedia("m1")[0].aiGenerated).toBe(true);
  });

  it("blocks young-looking output, hides it and refunds", async () => {
    await user("m2");
    const job = await requestMedia("m2", "featured-1", "image", "portrait", deps(scanner({ minApparentAge: 16 })));
    await job.done;
    expect(job.status).toBe("blocked");
    expect(listMedia("m2")[0].url).toBeUndefined();
    expect(balance("m2")).toBe(200);
  });

  it("fails closed when the scanner errors", async () => {
    await user("m3");
    const broken: Deps["scanner"] = () => ({ scan: async () => { throw new Error("down"); } });
    const job = await requestMedia("m3", "featured-1", "video", "portrait", deps(broken));
    await job.done;
    expect(job.status).toBe("blocked");
    expect(balance("m3")).toBe(200);
  });

  it("bans on csam match", async () => {
    await user("m4");
    const job = await requestMedia("m4", "featured-1", "image", "portrait", deps(scanner({ csamMatch: true })));
    await job.done;
    expect(getUser("m4").banned).toBe(true);
  });

  it("report hides immediately", async () => {
    await user("m5");
    const job = await requestMedia("m5", "featured-1", "image", "portrait", deps(scanner({})));
    await job.done;
    reportMedia("m5", job.id, "not ok");
    expect(listMedia("m5")).toHaveLength(0);
  });

  it("rejects unknown scenes and insufficient tokens", async () => {
    await user("m6", 10);
    await expect(requestMedia("m6", "featured-1", "image", "nope" as never)).rejects.toThrow();
    await expect(requestMedia("m6", "featured-1", "image", "portrait")).rejects.toThrow("Insufficient tokens");
  });
});
