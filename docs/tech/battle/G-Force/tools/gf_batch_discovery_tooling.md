# GF Batch Discovery Tooling

## Entry Points

- Primary: `tools/gf_batch_discovery.py`
- Local wrapper: `tech/battle/G-Force/tools/gf_batch_discovery.py`

## Common Commands

- Dry-run discovery:
  - `python tools/gf_batch_discovery.py --dry-run`
- Generate docs/inventory:
  - `python tools/gf_batch_discovery.py --generate-docs`
- Apply high-confidence annotation + generate docs:
  - `python tools/gf_batch_discovery.py --annotate-high-confidence --generate-docs`

## Output Location

Generated outputs are written to:

- `tech/battle/G-Force/`
- `tech/battle/G-Force/test/`
