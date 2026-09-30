import { describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { PList, PMap } from "./store";

describe("persistence", () => {
  it("map and list survive a reload from the same database", () => {
    const sql = new Database(":memory:");
    sql.exec(`CREATE TABLE records (coll TEXT, id TEXT, data TEXT, PRIMARY KEY (coll, id));
              CREATE TABLE logs (seq INTEGER PRIMARY KEY AUTOINCREMENT, coll TEXT, data TEXT);`);
    const m = new PMap<{ n: number }>(sql, "things");
    m.set("a", { n: 1 });
    const rec = m.get("a")!;
    rec.n = 2;
    m.save("a");
    const l = PList.load<{ v: string }>(sql, "log");
    l.push({ v: "x" }, { v: "y" });

    const m2 = new PMap<{ n: number }>(sql, "things");
    expect(m2.get("a")).toEqual({ n: 2 });
    const l2 = PList.load<{ v: string }>(sql, "log");
    expect(l2.map((e) => e.v)).toEqual(["x", "y"]);
    expect(Array.isArray(l2.filter(() => true))).toBe(true);
  });
});
