---
title: Binary Tribunal Hypothesis Definition Schema
category: references
tags: [reverse-engineering, testing, reference]
aliases: [Binary Tribunal YAML schema, hypothesis.yaml schema]
sources: [binaryTribunal/hypothesis.py]
summary: Reference for Binary Tribunal hypothesis YAML: constants, steps, suites, address expressions, and supported assertion fields.
provenance:
  extracted: 0.92
  inferred: 0.06
  ambiguous: 0.02
created: 2026-06-02T17:10:00+02:00
updated: 2026-06-02T17:10:00+02:00
---

# Binary Tribunal Hypothesis Definition Schema

`binaryTribunal/hypothesis.py` defines the loaded in-memory schema for hypotheses and suites.

## Hypothesis Fields

A hypothesis definition contains:

- `id` - stable test identifier, defaulting to the YAML stem if absent.
- `title` - human-readable title.
- `domain` - optional target domain label.
- `confidence_target` - optional intended confidence tier or verification target.
- `references` - source references attached to the hypothesis.
- `constants` - named integer constants used by address expressions.
- `setup`, `act`, `observe`, `assert`, `cleanup` - ordered lists of steps.
- `verdict_prompt` - optional semantic analysis prompt carried with the definition.

## Step Fields

Each step can carry generic fields such as `action`, `check`, `label`, `address`, `size`, `type`, `expect`, `timeout_ms`, `wait_until`, `before`, `after`, `min_val`, `max_val`, and nested `checks`.

The loader also preserves `slot` and `fields` for domain-specific actions. That lets plugin actions define additional parameters without changing the generic schema.

## Address Expressions

Address expressions support named constants, decimal literals, hex literals, parentheses, and arithmetic/bitwise operators:

```text
STRUCT_BASE + 4 * ENTRY_STRIDE + FIELD_OFFSET
```

Unknown symbols raise an error. Constants parse hex strings such as `0x401000`, decimal strings, and integer values.

## Suite Files

A suite file is recognized when the filename ends with `.suite.yaml` or `.suite.yml`, or when the loaded YAML contains a top-level `hypotheses` key.

Suite definitions contain:

- `id`
- `title`
- `hypotheses`
- `before_each`
- `constants`

Older suite files may use `between_each`; the loader treats it as a backward-compatible alias for `before_each`.

## Related

- [[projects/binary-tribunal/concepts/hypothesis-runner-architecture]]
- [[projects/binary-tribunal/references/evidence-json-model]]
- [[projects/binary-tribunal/skills/running-binary-tribunal-hypotheses]]
