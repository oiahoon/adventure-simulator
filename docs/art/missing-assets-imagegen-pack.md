# Missing Assets Image Generation Pack

Date: 2026-04-20

This pack extends the existing image guidance into a single runnable batch for the currently missing MVP art assets listed in `docs/game-design/MVP_Asset_Backlog.md`.

Use it together with:

- `docs/art/sbti-lowpoly-style-guide.md`
- `docs/art/ending-imagegen-prompt-pack.md`
- `tmp/imagegen/missing-assets.jsonl`

## Scope

The current batch covers 19 missing assets:

- 7 portraits
- 4 gameplay backgrounds
- 8 ending backgrounds

### Portraits

- `public/assets/chinese-reigns/portraits/alchemist.png`
- `public/assets/chinese-reigns/portraits/empress-dowager.png`
- `public/assets/chinese-reigns/portraits/prince.png`
- `public/assets/chinese-reigns/portraits/regional-lord.png`
- `public/assets/chinese-reigns/portraits/envoy.png`
- `public/assets/chinese-reigns/portraits/merchant.png`
- `public/assets/chinese-reigns/portraits/bandit.png`

### Backgrounds

- `public/assets/chinese-reigns/backgrounds/alchemy-room.png`
- `public/assets/chinese-reigns/backgrounds/imperial-harem.png`
- `public/assets/chinese-reigns/backgrounds/market-tax-office.png`
- `public/assets/chinese-reigns/backgrounds/ancestral-temple.png`

### Endings

- `public/assets/chinese-reigns/endings/expectation-revolt.png`
- `public/assets/chinese-reigns/endings/corruption-flood.png`
- `public/assets/chinese-reigns/endings/frontier-collapse.png`
- `public/assets/chinese-reigns/endings/military-takeover.png`
- `public/assets/chinese-reigns/endings/bureaucratic-suffocation.png`
- `public/assets/chinese-reigns/endings/alchemy-death.png`
- `public/assets/chinese-reigns/endings/old-age-succession.png`
- `public/assets/chinese-reigns/endings/puppet-emperor.png`

## Batch File

Prepared batch input:

- `tmp/imagegen/missing-assets.jsonl`

The JSONL is already shaped for the local imagegen CLI:

- portraits at `1024x1024`
- backgrounds and endings at `1024x1536`
- `png` output
- `high` quality
- SBTI-lowpoly prompt constraints aligned with the locked style guide

## Run Command

After `OPENAI_API_KEY` is available in the shell environment:

```bash
python3 /Users/johuang/.codex/skills/imagegen/scripts/image_gen.py generate-batch \
  --input tmp/imagegen/missing-assets.jsonl \
  --out-dir tmp/imagegen/generated \
  --concurrency 3 \
  --force
```

The current CLI writes batch outputs by filename into `tmp/imagegen/generated/`.
After generation, move each file into its intended runtime path under `public/assets/chinese-reigns/`.

## Validation Status

Validated on 2026-04-20 with:

```bash
python3 /Users/johuang/.codex/skills/imagegen/scripts/image_gen.py generate-batch \
  --input tmp/imagegen/missing-assets.jsonl \
  --out-dir tmp/imagegen/generated \
  --concurrency 3 \
  --dry-run
```

Dry-run passed for all 19 jobs. No live images were produced because `OPENAI_API_KEY` was not present in either the sandboxed or escalated shell environment.

## After Generation

Once the real image batch succeeds:

1. Review every output against `docs/art/sbti-lowpoly-style-guide.md`.
2. Reject any image with text, watermark, painterly rendering, ornate costume drift, or weak low-poly faceting.
3. Move approved files into `public/assets/chinese-reigns/...`.
4. Update `docs/art/asset-quality-review.md`.
5. Update `docs/agentic-coding/progress-log.md`.
