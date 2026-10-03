#!/usr/bin/env python3
"""
validate_indexes.py — Smoke-test the three JSON knowledge bases

Usage: python validate_indexes.py
"""

import json
import os
import sys

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'data')

REQUIRED_FILES = [
    'ingredient_index.json',
    'skin_compat_index.json',
    'hair_compat_index.json',
]

SKIN_TYPES = ['Dry Skin', 'Oily Skin', 'Combination Skin', 'Sensitive Skin', 'Acne-Prone Skin', 'Normal Skin']
HAIR_TYPES = ['Dry Hair', 'Oily Scalp', 'Curly Hair', 'Straight Hair', 'Hair Fall', 'Dandruff-Prone', 'Chemically Treated Hair', 'Normal Hair']

TEST_INGREDIENTS = ['GLYCERIN', 'NIACINAMIDE', 'AQUA', 'RETINOL', 'SALICYLIC ACID']

errors = []

def check(condition, msg):
    if not condition:
        errors.append(msg)
        print(f"  ✗ {msg}")
    else:
        print(f"  ✓ {msg}")

# ── Load all three indexes
indexes = {}
for fname in REQUIRED_FILES:
    path = os.path.join(DATA_DIR, fname)
    if not os.path.exists(path):
        print(f"✗ MISSING: {path}")
        sys.exit(1)
    with open(path) as f:
        indexes[fname] = json.load(f)
    size_kb = os.path.getsize(path) / 1024
    print(f"Loaded {fname}: {len(indexes[fname]):,} entries ({size_kb:.0f} KB)")

ing = indexes['ingredient_index.json']
skin = indexes['skin_compat_index.json']
hair = indexes['hair_compat_index.json']

print("\n── Structural checks ─────────────────────────────────")
check(len(ing) >= 25000, f"ingredient_index has {len(ing):,} entries (expected ≥25,000)")
check(len(skin) >= 2000, f"skin_compat_index has {len(skin):,} entries (expected ≥2,000)")
check(len(hair) >= 2000, f"hair_compat_index has {len(hair):,} entries (expected ≥2,000)")

print("\n── Required fields per entry ─────────────────────────")
sample_key = next(iter(ing))
sample = ing[sample_key]
for field in ['id', 'risk', 'safe', 'beneficial', 'allergen', 'irritant', 'svhc', 'svhc_ed', 'function']:
    check(field in sample, f"ingredient_index entry has field '{field}'")

print("\n── Test ingredient lookups ───────────────────────────")
for name in TEST_INGREDIENTS:
    check(name in ing, f"ingredient_index contains '{name}'")
    if name in skin:
        entry = skin[name]
        for st in SKIN_TYPES:
            check(st in entry, f"skin_compat_index['{name}'] has '{st}'")
        break
    if name in hair:
        entry = hair[name]
        for ht in HAIR_TYPES:
            check(ht in entry, f"hair_compat_index['{name}'] has '{ht}'")
        break

print("\n── Score range check ─────────────────────────────────")
skin_scores = []
for ing_data in list(skin.values())[:200]:
    for st_data in ing_data.values():
        skin_scores.append(st_data['s'])
check(min(skin_scores) >= -20, f"Min skin score {min(skin_scores)} (expected ≥ −20)")
check(max(skin_scores) <= 20,  f"Max skin score {max(skin_scores)} (expected ≤ 20)")

print("\n── Summary ───────────────────────────────────────────")
if errors:
    print(f"✗ {len(errors)} errors found:")
    for e in errors: print(f"    {e}")
    sys.exit(1)
else:
    print("✓ All checks passed — indexes are valid!")
