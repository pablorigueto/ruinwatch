"""
Bundle the canonical Kadala drop tables from serverruinwatch/data/kadala/
into one compact JSON for the React app to fetch at runtime.

Run:
    python scripts/build-kadala.py

Output:
    public/kadala/kadala.json
"""
from __future__ import annotations

import csv
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
PROJECT_ROOT = HERE.parent
SOURCE_DIR = PROJECT_ROOT.parent / "serverruinwatch" / "data" / "kadala"
OUT_PATH = PROJECT_ROOT / "public" / "kadala" / "kadala.json"

CLASSES = ["barbarian", "crusader", "demonhunter", "monk",
           "necromancer", "witchdoctor", "wizard"]


def read_class(name: str) -> list[dict]:
    path = SOURCE_DIR / f"{name}.csv"
    if not path.exists():
        raise SystemExit(f"missing {path}")
    rows: list[dict] = []
    with path.open(encoding="utf-8") as f:
        for r in csv.DictReader(f):
            rows.append({
                "slot": r["slot"],
                "itemType": r["item_type"],
                "name": r["item_name"],
                "quality": r["quality"],
                "id": r["d3planner_id"],
                "itemLevel": int(r["item_level"]),
                "unlocksAt": int(r["unlocks_at_kadala"]),
                "bucket": r["kadala_bucket"],
                "shardCost": int(r["shard_cost"]),
                "legChance": float(r["legendary_upgrade_chance"]),
                "weight": int(r["weight"]),
                "bucketTotalWeight": int(r["bucket_total_weight"]),
                "perGamble": float(r["item_chance_per_gamble"]),
                "avgShards": int(r["avg_shards"]),
                "shardsFor80": int(r["shards_for_80pct"]),
                "deathsBreath": int(r["deaths_breath"]),
                "belowKadalaMin": r["displayed_with_asterisk"] == "true",
            })
    return rows


def main() -> None:
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    out = {cls: read_class(cls) for cls in CLASSES}
    OUT_PATH.write_text(
        json.dumps(out, separators=(",", ":"), ensure_ascii=False),
        encoding="utf-8",
    )
    total = sum(len(v) for v in out.values())
    size_kb = OUT_PATH.stat().st_size // 1024
    print(f"wrote {OUT_PATH.relative_to(PROJECT_ROOT)} ({total} rows, {size_kb} KB)")
    for cls, rows in out.items():
        print(f"  {cls:14s} {len(rows):>3d} rows")


if __name__ == "__main__":
    main()
