# FF8 Reverse Engineering — Battle System Documentation

## Structure

```
product/          Game design reference (what the game does)
  battle.md         Complete combat system breakdown

tech/             Reverse engineering documentation (how it works)
  README.md         Navigation hub — start here
  reference/        Single-source-of-truth data (addresses, structs, bit maps)
  systems/          System-level documentation (pipelines, mechanisms)
  gforce/           G-Force (summon) subsystem
  investigation/    Working notes and reconstruction reports
  test/             Verification test plans
```

## Design Principles

1. **No duplication**: Each fact lives in ONE place. Other documents link to it.
2. **Reference vs System**: Reference docs define _what_ (addresses, layouts, bits). System docs explain _how_ (pipelines, mechanisms, flow).
3. **GF consolidation**: One catalog table replaces 25+ per-GF micro-documents. Deep dives only for architecturally significant exemplars (Cerberus, Quezacotl).
4. **Test plans are actionable**: Each test plan specifies exact breakpoints, memory watches, scenarios, and expected observations.
