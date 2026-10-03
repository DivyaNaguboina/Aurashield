#!/usr/bin/env python3
"""
build_ingredient_index.py — Build ingredient_index.json from master_ingredient_dataset.csv

Usage:
    python build_ingredient_index.py --input ../../data/master_ingredient_dataset.csv
                                     --output ../../public/data/ingredient_index.json
"""

import argparse
import json
import os
import pandas as pd


def build_index(input_csv: str, output_json: str) -> None:
    print(f"Reading {input_csv}…")
    df = pd.read_csv(input_csv)
    print(f"  {len(df):,} rows, {len(df.columns)} columns")

    index = {}
    skipped = 0

    for _, row in df.iterrows():
        name = str(row.get('inci_name', '')).upper().strip()
        if not name or name == 'NAN':
            skipped += 1
            continue

        def iv(col):
            val = row.get(col, 0)
            return int(val) if not pd.isna(val) else 0

        def sv(col, maxlen=200):
            val = row.get(col, '')
            return str(val)[:maxlen] if not pd.isna(val) else ''

        index[name] = {
            "id":         sv('ingredient_id', 20),
            "risk":       sv('risk_level', 10),
            "safe":       iv('is_safe'),
            "beneficial": iv('is_beneficial'),
            "goodie":     iv('is_goodie'),
            "superstar":  iv('is_superstar'),
            "icky":       iv('is_icky'),
            "allergen":   iv('is_allergen'),
            "irritant":   iv('is_irritant'),
            "comedogenic":iv('is_comedogenic'),
            "svhc":       iv('is_svhc'),
            "svhc_ed":    iv('is_svhc_ed'),
            "natural":    iv('is_natural'),
            "synthetic":  iv('is_synthetic'),
            "function":   sv('function', 100),
            "desc":       sv('description', 200),
        }

    os.makedirs(os.path.dirname(os.path.abspath(output_json)), exist_ok=True)
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(index, f, separators=(',', ':'), ensure_ascii=False)

    size_kb = os.path.getsize(output_json) / 1024
    print(f"✓ Written {len(index):,} entries to {output_json} ({size_kb:.0f} KB)")
    if skipped:
        print(f"  Skipped {skipped} rows with missing inci_name")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--input',  default='../../data/master_ingredient_dataset.csv')
    parser.add_argument('--output', default='../../public/data/ingredient_index.json')
    args = parser.parse_args()
    build_index(args.input, args.output)
