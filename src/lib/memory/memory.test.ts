import { describe, expect, it } from "vitest";
import { recall, remember } from "./index";

describe("memory", () => {
  it("stores and recalls facts per user+character", () => {
    remember("m1", "c1", "Hey! I love surfing. Also my dog is called Bo.");
    expect(recall("m1", "c1")).toEqual(expect.arrayContaining(["I love surfing"]));
    expect(recall("m1", "c2")).toEqual([]);
    expect(recall("m2", "c1")).toEqual([]);
  });
  it("dedupes", () => {
    remember("m3", "c1", "I love tea");
    remember("m3", "c1", "I love tea");
    expect(recall("m3", "c1")).toHaveLength(1);
  });
});
