import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { AltarNode, PlannerData } from "@/lib/planner";
import { MINOR_SEAL_COSTS, POTION_SEAL_COSTS, altarTotals, sealCosts } from "@/lib/altar";

const data = JSON.parse(readFileSync(join(__dirname, "../../public/planner/planner.json"), "utf8")) as PlannerData;
const nodes = Object.entries(data.altar ?? {}) as Array<[string, AltarNode]>;

describe("altar sacrifices", () => {
  it("has a cost for every minor and potion seal", () => {
    expect(MINOR_SEAL_COSTS).toHaveLength(nodes.filter(([, n]) => !n.major && !n.final).length);
    expect(POTION_SEAL_COSTS).toHaveLength(nodes.filter(([, n]) => n.major && !n.final).length);
  });

  it("charges by the order seals are opened, not by which seal", () => {
    const costs = sealCosts(nodes, ["minor8", "minor1"]);
    expect(costs.get("minor8")).toMatchObject({ kind: "minor", step: 1, cost: MINOR_SEAL_COSTS[0] });
    expect(costs.get("minor1")).toMatchObject({ step: 2, cost: MINOR_SEAL_COSTS[1] });
    // an unopened seal shows what the NEXT sacrifice costs
    expect(costs.get("minor2")).toMatchObject({ step: 3, cost: MINOR_SEAL_COSTS[2] });
  });

  it("counts potions on their own and leaves the final seal free", () => {
    const costs = sealCosts(nodes, ["major3", "major4"]);
    expect(costs.get("major3")).toMatchObject({ kind: "potion", step: 1, cost: POTION_SEAL_COSTS[0] });
    expect(costs.get("major1")).toMatchObject({ kind: "potion", step: 2 });
    expect(costs.get("major4")).toMatchObject({ kind: "final", cost: null });
  });

  it("sums the active seals, expanding bounty materials per act", () => {
    const active = ["minor1", "minor2", "minor3", "minor4", "minor5"]; // steps 1–5
    const totals = Object.fromEntries(altarTotals(sealCosts(nodes, active), active).map((x) => [x.item, x.qty]));
    expect(totals.parts).toBe(30); // 10 + 20
    expect(totals.breath).toBe(20);
    expect(totals.soul).toBe(20);
    expect(totals.khanduran).toBe(10);
    expect(totals.water).toBe(10);
  });

  it("the full altar asks for the known material totals", () => {
    const all = nodes.map(([id]) => id);
    const totals = Object.fromEntries(altarTotals(sealCosts(nodes, all), all).map((x) => [x.item, x.qty]));
    expect(totals.shard).toBe(1100 + 1300 + 1400 + 1500 + 1600);
    expect(totals.ashes).toBe(55 + 110 + 165);
    expect(totals.khanduran).toBe(10 + 30 + 50);
  });
});
