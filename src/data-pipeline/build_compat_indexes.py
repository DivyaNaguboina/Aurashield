#!/usr/bin/env python3
"""
build_compat_indexes.py — Build skin_compat_index.json and hair_compat_index.json

Usage:
    python build_compat_indexes.py \
        --skin  ../../data/ingredient_skin_compatibility_v2.csv \
        --hair  ../../data/ingredient_hair_compatibility_v2.csv \
        --outdir ../../public/data/
"""

import argparse
import json
import os
import pandas as pd


def build_skin_index(csv_path: str, output_path: str) -> None:
    print(f"Reading skin compat CSV: {csv_path}…")
    df = pd.read_csv(csv_path)
    print(f"  {len(df):,} rows")

    index = {}
    for _, row in df.iterrows():
        key = str(row['inci_name']).upper().strip()
        if not key or key == 'NAN':
            continue
        if key not in index:
            index[key] = {}
        skin_type = str(row['skin_type'])
        index[key][skin_type] = {
            "s": int(row['compatibility_score']),
            "l": str(row['compatibility_label']),
            "r": str(row['reason'])[:150],
        }

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(index, f, separators=(',', ':'), ensure_ascii=False)

    size_kb = os.path.getsize(output_path) / 1024
    print(f"✓ skin_compat_index.json — {len(index):,} ingredients ({size_kb:.0f} KB)")
    if index:
        sample_key = next(iter(index))
        print(f"  Sample ({sample_key}): {list(index[sample_key].keys())}")


def build_hair_index(csv_path: str, output_path: str) -> None:
    print(f"Reading hair compat CSV: {csv_path}…")
    df = pd.read_csv(csv_path)
    print(f"  {len(df):,} rows")

    index = {}
    for _, row in df.iterrows():
        key = str(row['inci_name']).upper().strip()
        if not key or key == 'NAN':
            continue
        if key not in index:
            index[key] = {}
        hair_type = str(row['hair_type'])
        index[key][hair_type] = {
            "s": int(row['compatibility_score']),
            "l": str(row['compatibility_label']),
            "r": str(row['reason'])[:150],
        }

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(index, f, separators=(',', ':'), ensure_ascii=False)

    size_kb = os.path.getsize(output_path) / 1024
    print(f"✓ hair_compat_index.json — {len(index):,} ingredients ({size_kb:.0f} KB)")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--skin',   default='../../data/ingredient_skin_compatibility_v2.csv')
    parser.add_argument('--hair',   default='../../data/ingredient_hair_compatibility_v2.csv')
    parser.add_argument('--outdir', default='../../public/data/')
    args = parser.parse_args()

    build_skin_index(args.skin, os.path.join(args.outdir, 'skin_compat_index.json'))
    build_hair_index(args.hair, os.path.join(args.outdir, 'hair_compat_index.json'))
    print("\n✓ All compatibility indexes built.")
