# ✦ AuraShield — AI Cosmetic Ingredient Scanner

> Scan a skincare or haircare label, and get a **personalised safety and compatibility score** based on your skin/hair type, concerns, allergies, and sensitivity.

AuraShield reads the ingredient list from a product photo (or pasted text), matches every ingredient against a local knowledge base of **30,000+ INCI ingredients**, scores the product for *your* profile, and uses an AI model to explain ingredients the database has never seen.

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Tech Stack](#tech-stack)
5. [ML / OCR Details](#ml--ocr-details)
6. [Installation](#installation)
7. [Usage](#usage)
8. [Results & Performance](#results--performance)
9. [Screenshots](#screenshots)
10. [Project Structure](#project-structure)
11. [Privacy & Security Notes](#privacy--security-notes)
12. [Known Limitations](#known-limitations)
13. [Disclaimer](#disclaimer)

---

## Problem Statement

Cosmetic labels list ingredients in dense, jargon-heavy INCI notation (`SODIUM C14-16 OLEFIN SULFONATE`, `PEG-40 HYDROGENATED CASTOR OIL`, …). Most people cannot tell whether a formula is right for them, and generic "clean beauty" ratings ignore who is actually using the product:

- A comedogenic oil that is harmless on dry skin can trigger breakouts on acne-prone skin.
- A fragrance allergen matters far more to someone with a diagnosed fragrance allergy.
- Some actives (e.g. retinol, salicylic acid) are flagged during pregnancy.
- Photographing a curved, glossy label produces noisy text full of OCR typos (`AQU4`, `GLYCERYL` → `GICENYL`).

**AuraShield** closes this gap by combining label reading, fuzzy ingredient matching, a curated compatibility dataset, and a profile-aware scoring engine into a single guided flow.

---

## Features

- 📷 **Label scanning** — upload a photo of the ingredient list, or paste ingredients manually (comma-separated or one per line).
- 🧴 **Skin *and* hair products** — separate scoring logic, metrics, and routines for each.
- 👤 **Personalised profile** — skin/hair type, specific concerns, known allergies, age group, climate, and skin/scalp sensitivity level (plus a pregnancy flag for skin products).
- 🔎 **OCR-tolerant matching** — a 4-stage matcher recovers ingredients from misspelled or mis-spaced text.
- 🧠 **AI analysis of unknown ingredients** — anything not in the local database gets a per-ingredient AI assessment for your profile.
- ⚠️ **Hazard flags** — endocrine disruptors / SVHC (EU REACH), allergens, irritants, and comedogenic ingredients are called out individually, with safer alternatives suggested.
- 🔗 **Interaction analysis** — flags problematic ingredient combinations within one formula.
- 📅 **Routine guidance** — skin AM/PM or hair wash-day/treatment suggestions based on the result.
- 🩹 **Personal reaction history** — mark an ingredient as having caused a reaction; it is penalised in all future scans (stored locally in your browser).
- 🖨️ **Printable report** — one-click export of the results page.
- 🌗 Light / dark theme and an offline-friendly service worker for the data indexes.

---

## Architecture

```text
 ┌────────────────────────── BROWSER (React + Vite SPA) ──────────────────────────┐
 │                                                                                 │
 │  Landing → Product type → Skin/Hair type → Profile → Scan → Analysing → Results │
 │                                                          │                      │
 │                                  ┌───────────────────────┴───────────┐          │
 │                          Photo upload                          Manual text      │
 │                                  │                                  │           │
 │                                  ▼                                  │           │
 │                   ┌──────────────────────────┐                      │           │
 │                   │ Vision OCR (OpenRouter)  │  ← image is sent to  │           │
 │                   │ model fallback chain     │    a remote API      │           │
 │                   └────────────┬─────────────┘                      │           │
 │                                └──────────────┬─────────────────────┘           │
 │                                               ▼                                 │
 │                              Ingredient parser / extractor                      │
 │                                               ▼                                 │
 │              4-stage matcher: exact → normalised → OCR-aware edit-distance      │
 │                                         → Fuse.js fuzzy                         │
 │                          ┌────────────────────┴───────────────┐                 │
 │                          ▼                                    ▼                 │
 │                  MATCHED (local DB)                     UNMATCHED               │
 │                          │                                    │                 │
 │       Profile-aware scoring engine                 AI analysis per ingredient   │
 │   (compat data + hazards + profile rules)          (OpenRouter text models)     │
 │                          └────────────────────┬───────────────┘                 │
 │                                               ▼                                 │
 │                    Results: score · verdict · metrics · hazards ·               │
 │                    interactions · routine · AI notes · printable report         │
 │                                                                                 │
 │   Local knowledge base (static JSON, loaded once at boot, cached by SW):        │
 │     ingredient_index.json  ·  skin_compat_index.json  ·  hair_compat_index.json │
 └─────────────────────────────────────────────────────────────────────────────────┘
```

**Screen flow:** `Landing → Product Type → Skin/Hair Type → Profile Questionnaire → Scan → Analysing → Results`

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 18, plain CSS (custom design tokens, light/dark theme) |
| Build tooling | Vite 5, `@vitejs/plugin-react` |
| Fuzzy matching | Fuse.js 7 + custom OCR-aware edit-distance matcher |
| OCR / vision | Vision-language models via the [OpenRouter](https://openrouter.ai) API |
| Unknown-ingredient analysis | Free text LLMs via OpenRouter |
| Knowledge base | Pre-built JSON indexes generated from curated CSV datasets |
| Data pipeline | Python 3, pandas |
| Offline/caching | Service worker (network-first for data indexes) |
| Experimental (not wired in) | `microsoft/trocr-small-printed` exported to ONNX INT8 |

---

## ML / OCR Details

### Label reading (OCR)

The current build reads labels with a **vision-language model through OpenRouter**, not a local OCR engine. The image is base64-encoded and sent with a prompt that instructs the model to:

1. locate the `Ingredients` / `INCI` / `Composition` section,
2. return **every** ingredient in uppercase INCI form,
3. repair OCR-style typos (e.g. `AQU4 → AQUA`),
4. preserve PEG numbers, CI numbers and botanical names exactly,
5. ignore directions, warnings, weights and batch codes,
6. return strict JSON: `{"found": true, "ingredients": [...], "confidence": "high", "notes": ""}`.

Models are tried in order until one succeeds: `openrouter/free` → `google/gemma-4-31b-it:free` → `google/gemma-4-26b-a4b-it:free` → `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`.

### Ingredient matching

| Stage | Method | Purpose |
|---|---|---|
| 1 | Exact lookup (hash map, O(1)) | Clean input |
| 2 | Normalised match (strip spaces / hyphens / slashes) | `CAPRYLIC CAPRIC` vs `CAPRYLIC/CAPRIC` |
| 3 | Prefix-indexed, OCR-aware edit distance | 1-char substitutions, swaps, prefix errors |
| 4 | Fuse.js (threshold 0.55) | Long multi-word names |

### Knowledge base

| File | Contents |
|---|---|
| `ingredient_index.json` | 30,079 ingredients with risk level and flags (safe, beneficial, "superstar", allergen, irritant, comedogenic, SVHC, SVHC-ED, natural/synthetic, function, description) |
| `skin_compat_index.json` | 2,221 ingredients × 6 skin types (score, label, reason) |
| `hair_compat_index.json` | 2,221 ingredients × 8 hair types (score, label, reason) |

**Skin types:** Normal · Dry · Oily · Combination · Sensitive · Acne-Prone
**Hair types:** Normal · Dry · Oily Scalp · Curly · Straight · Hair Fall · Dandruff-Prone · Chemically Treated

The indexes are built from the CSVs in [`data/`](data/) by the scripts in [`src/data-pipeline/`](src/data-pipeline/).

### Scoring engine (`src/engine/compatibilityEngine.js`)

For each matched ingredient:

```text
base  = 0.85 × primary_compat + 0.15 × secondary_compat
        (primary = skin data for skin products, hair data for hair products)

base += profile adjustments           (concerns, allergies, sensitivity; clamped to −25…+10)
base −= 30                            if the user previously logged a reaction to it
base −= 25                            if pregnant and ingredient is retinol / retinyl /
                                      salicylic acid / hydroquinone (skin products)
base += hazard penalties:  SVHC-ED −25 · SVHC −20 · allergen −12 · irritant −8 · comedogenic −6
                           (comedogenic penalty × 1.5 for oily / acne-prone skin)

ingredient_score = clamp(base, −35, +25)
weight           = 2.5 if ingredient_score < 0 else 1.0      # bad ingredients count more
```

```text
product_score = clamp( ((weighted_mean + 30) / 55) × 100, 0, 100 )
```

| Score | Verdict |
|---|---|
| 75 – 100 | ✅ Safe to Use |
| 45 – 74 | 🟡 Patch Test First |
| 0 – 44 | 🔴 Not Recommended |

A separate **confidence score** is derived from how each ingredient was matched (exact = 100, normalised = 90, fuzzy = match similarity).

### Experimental: on-device TrOCR (not currently used)

`src/data-pipeline/export_trocr_onnx.py` and `quantize.py` export and INT8-quantise `microsoft/trocr-small-printed` to ONNX for in-browser OCR. The runtime integration was replaced by the vision-API approach above, and the model files are git-ignored. See [`public/models/trocr_onnx/MODELS_README.txt`](public/models/trocr_onnx/MODELS_README.txt) if you want to experiment.

---

## Installation

### Prerequisites

- **Node.js 18+** and npm
- A free **OpenRouter API key** → <https://openrouter.ai/keys> (needed for photo scanning and AI analysis of unknown ingredients; manual entry matching works against the local database regardless)
- *(Optional)* **Python 3.9+** with `pandas` — only if you want to rebuild the JSON indexes

### Steps

```bash
# 1. Clone
git clone https://github.com/<your-username>/AuraShield.git
cd AuraShield

# 2. Install dependencies
npm install

# 3. Configure your API key
cp .env.example .env
#    then edit .env and set VITE_OPENROUTER_API_KEY=<your key>
#    (or skip this: if no key is configured, the app shows a setup screen
#     where you can paste one for the current session)

# 4. Start the dev server
npm run dev
```

Open <http://localhost:5173>.

### Rebuild the data indexes (optional)

The pre-built indexes are already in `public/data/`. To regenerate them from the CSVs:

```bash
pip install pandas
cd src/data-pipeline
python build_ingredient_index.py --input ../../data/master_ingredient_dataset.csv --output ../../public/data/ingredient_index.json
python build_compat_indexes.py \
    --skin ../../data/ingredient_skin_compatibility_v2.csv \
    --hair ../../data/ingredient_hair_compatibility_v2.csv \
    --outdir ../../public/data/
python validate_indexes.py
```

### Production build

```bash
npm run build      # outputs to dist/
npm run preview
```

> ⚠️ **Do not deploy a build compiled with a real key in `.env`.** Vite inlines `VITE_*` variables into the public JavaScript bundle. See [Privacy & Security Notes](#privacy--security-notes).

---

## Usage

1. **Start** on the landing page.
2. **Choose a product type** — Skin or Hair.
3. **Pick your skin or hair type.**
4. **Fill in your profile** — concerns, allergies, sensitivity, age group, climate.
5. **Scan the label** — upload a clear photo of the ingredient list (JPG / PNG / WEBP), *or* paste the ingredients as text.
6. **Wait for analysis** — the app reads the label, matches ingredients, scores them, and asks the AI about any unknown ones.
7. **Read your results** — overall score and verdict, per-ingredient breakdown, hazard flags, interactions, routine suggestions and AI notes. Click **Export** to print, or log an adverse reaction on any ingredient to improve future scans.

**Tips:** make sure the *whole* ingredient list is in frame and well lit. If the free AI tier is rate-limited, wait about a minute and retry.

### Benchmarks

```bash
node benchmarks/run_all.js
```

See the note on this script under [Results & Performance](#results--performance).

---

## Results & Performance

Measured on the bundled datasets (Node 22, single run, this repo as shipped).

**Knowledge-base coverage** — raw ingredient strings from `product_ingredient_mapping_enriched.csv` (21,068 rows · 897 products · 386 brands), checked against the 30,079-entry index:

| Metric | Result |
|---|---|
| Exact match (case-insensitive) | **87.5 %** |
| Match after normalisation (spaces / hyphens / slashes) | **89.4 %** |
| Rows with a dataset-provided canonical match | 95.2 % |

**Speed** (`benchmarks/run_all.js`, plain Node, simplified scoring loop):

| Operation | Result |
|---|---|
| Index lookups | ~3,000 lookups in < 1 ms |
| Scoring a 20-ingredient product | ~0.002 ms |
| Naïve Levenshtein scan over the full index (benchmark baseline only) | ~17 lookups/s — the shipped matcher uses prefix indexing instead |

> **Honest caveats**
> - OCR accuracy has **not** been measured yet. The numbers above describe database coverage, not label-reading accuracy.
> - The "matching accuracy" block in `benchmarks/run_all.js` reports ~36 %, but that figure is **not reliable**: the script splits the CSV on commas without handling quoted fields and uses a different (naïve) matcher than the app. The coverage numbers above were computed with a proper CSV parse.
> - Scoring weights are heuristic and have not been clinically validated.

---

## Screenshots

> Add your screenshots to [`docs/screenshots/`](docs/screenshots/) and update the paths below.

| Landing | Profile questionnaire |
|:---:|:---:|
| ![Landing](docs/screenshots/landing.png) | ![Profile](docs/screenshots/profile.png) |

| Scan screen | Analysing |
|:---:|:---:|
| ![Scan](docs/screenshots/scan.png) | ![Analysing](docs/screenshots/analysing.png) |

| Results & score | Ingredient breakdown |
|:---:|:---:|
| ![Results](docs/screenshots/results.png) | ![Breakdown](docs/screenshots/breakdown.png) |

---

## Project Structure

```text
AuraShield/
├── index.html
├── package.json
├── vite.config.js
├── .env.example                  # template — copy to .env (never commit .env)
├── benchmarks/
│   └── run_all.js                # Node benchmark runner
├── data/                         # source CSV datasets
│   ├── master_ingredient_dataset.csv
│   ├── ingredient_skin_compatibility_v2.csv
│   ├── ingredient_hair_compatibility_v2.csv
│   └── product_ingredient_mapping_enriched.csv
├── public/
│   ├── data/                     # pre-built JSON indexes served to the app
│   ├── models/trocr_onnx/        # (git-ignored) optional ONNX model files
│   ├── onnxruntime-web/          # (git-ignored) optional WASM runtime files
│   ├── sw.js                     # service worker
│   └── favicon.svg
├── quantize.py                   # experimental: INT8-quantise TrOCR ONNX
├── docs/screenshots/             # put README screenshots here
└── src/
    ├── main.jsx · App.jsx        # app shell & screen flow
    ├── index.css
    ├── components/               # Landing, selectors, ProfileQuestionnaire,
    │                             # ScanScreen, AnalysingScreen, ResultsScreen, ApiKeySetup
    ├── engine/
    │   ├── geminiOCR.js          # vision OCR via OpenRouter (name is historical)
    │   ├── geminiAnalysis.js     # AI analysis for unknown ingredients
    │   ├── extractor.js          # text → ingredient list
    │   ├── matcher.js            # 4-stage ingredient matcher
    │   ├── compatibilityEngine.js# scoring, hazards, metrics, routine
    │   ├── knowledgeBase.js      # JSON index loader / cache
    │   ├── reportGenerator.js    # recommendation text
    │   └── ocr.js                # deprecated stub
    └── data-pipeline/            # Python scripts to build/validate indexes
```

---

## Privacy & Security Notes

- **What leaves your device:** when you scan a photo, the *image* is sent to OpenRouter (and the underlying model provider). Names of unmatched ingredients plus your profile summary (skin/hair type, concerns, allergies, etc.) are sent for AI analysis. Ingredient matching and scoring against the knowledge base happen entirely in the browser.
- **What stays local:** your theme choice and your adverse-reaction history are stored in the browser's `localStorage`.
- **API keys:** keep your key in `.env` (git-ignored). Only `.env.example` with a placeholder is tracked. Because Vite embeds `VITE_*` values in the compiled JavaScript, a key in `.env` is **visible to anyone who can load a build made with it**. For any public deployment, route requests through a backend/serverless proxy that holds the key, and set usage limits on it.
- If a key is ever committed or shared by accident, **revoke it and create a new one** — removing it from the files is not enough.

---

## Known Limitations

- Photo scanning and unknown-ingredient analysis depend on free-tier OpenRouter models, which can be rate-limited or change availability.
- The compatibility index covers 2,221 ingredients with skin/hair-type-specific data; the other ~28,000 indexed ingredients rely on their general flags (allergen, irritant, SVHC, …).
- Source-file names such as `geminiOCR.js` / `geminiAnalysis.js` are historical — they no longer call Gemini.
- Some localStorage keys still use the earlier `auroshield_*` spelling to avoid wiping existing users' saved data.
- No automated test suite yet.

---

## Disclaimer

AuraShield is an informational tool. It is **not** medical advice and does not replace a dermatologist, allergist, or doctor. Always patch-test new products and consult a professional if you have a skin condition, are pregnant or nursing, or have known allergies.

---

## License

No license has been specified yet. Add a `LICENSE` file (e.g. MIT) before publishing if you want others to be able to use the code.
