import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  PLAYABLE_CLASSES,
  PlannerData,
  PresetBuild,
  buildFileName,
  buildFromPreset,
  itemTooltip,
  parseBuildFile,
  toBuildFile,
} from "@/lib/planner";

const pub = (...p: string[]) => join(__dirname, "../../public", ...p);
const data = JSON.parse(readFileSync(pub("planner/planner.json"), "utf8")) as PlannerData;
const presetText = readFileSync(pub("planner/builds/barbarian-waste-ww-rend.json"), "utf8");
const preset = JSON.parse(presetText) as PresetBuild;
const parse = (text: string) => parseBuildFile(data, text, PLAYABLE_CLASSES);

describe("build files (export / import JSON)", () => {
  it("round-trips an exported build", () => {
    const build = buildFromPreset(data, preset);
    const res = parse(JSON.stringify(toBuildFile(build, "My WW")));
    expect("error" in res).toBe(false);
    if ("error" in res) return;
    expect(res.name).toBe("My WW");
    expect(res.skipped).toBe(0);
    expect(res.build).toEqual(build);
  });

  it("imports a reference build file from /public/planner/builds", () => {
    const res = parse(presetText);
    if ("error" in res) throw new Error(res.error);
    expect(res.build.klass).toBe("barbarian");
    expect(res.build.kanai).toEqual(preset.kanai);
    expect(Object.keys(res.build.equipped).length).toBe(Object.keys(preset.equipped).length);
  });

  it("drops gear whose item no longer exists", () => {
    const build = buildFromPreset(data, preset);
    build.equipped.head = { ...build.equipped.head!, itemId: "does_not_exist" };
    const res = parse(JSON.stringify(toBuildFile(build, "x")));
    if ("error" in res) throw new Error(res.error);
    expect(res.skipped).toBe(1);
    expect(res.build.equipped.head).toBeUndefined();
  });

  it("rejects bad input", () => {
    expect(parse("{not json")).toEqual({ error: "invalid-json" });
    expect(parse(JSON.stringify({ hello: 1 }))).toEqual({ error: "not-a-build" });
    expect(parse(JSON.stringify({ klass: "paladin", equipped: {} }))).toEqual({ error: "unknown-class" });
  });

  it("names the download after class + build name", () => {
    expect(buildFileName(buildFromPreset(data, preset), "Waste WW / Rend!")).toBe("ruinwatch-barbarian-waste-ww-rend.json");
  });
});

describe("ethereal choices", () => {
  const eth = JSON.parse(readFileSync(pub("planner/builds/barbarian-savage-frenzy.json"), "utf8")) as PresetBuild;

  it("loads the Ethereal's extra power and passive from a preset", () => {
    const b = buildFromPreset(data, eth);
    expect(b.equipped.mainhand?.etherealPower).toBe("P68_Unique_Mighty_2H_004"); // Bastion's Revered
    expect(b.equipped.mainhand?.etherealPassive).toBe("brawler");
  });

  it("shows them in the item tooltip", () => {
    const b = buildFromPreset(data, eth);
    const item = data.items.find((i) => i.id === b.equipped.mainhand!.itemId)!;
    const tip = itemTooltip(data, item, b.equipped.mainhand, "mainhand", "barbarian");
    expect(tip.ethereal?.power?.name).toBe("Bastion's Revered");
    expect(tip.ethereal?.power?.text).toMatch(/^Frenzy now stacks up to 10 times/);
    expect(tip.ethereal?.passive).toBe("Brawler");
    expect(tip.primary.some((l) => /passive/i.test(l))).toBe(false); // moved to the Ethereal block
  });

  it("keeps them through an export/import round trip", () => {
    const b = buildFromPreset(data, eth);
    const res = parse(JSON.stringify(toBuildFile(b, "eth")));
    if ("error" in res) throw new Error(res.error);
    expect(res.build.equipped.mainhand?.etherealPower).toBe("P68_Unique_Mighty_2H_004");
  });
});
