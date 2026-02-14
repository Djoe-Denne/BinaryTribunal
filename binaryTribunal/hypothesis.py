"""
Hypothesis definition schema and YAML loader.

A hypothesis is a self-contained, declarative test case that describes:
  - Constants (addresses, offsets)
  - Setup steps (snapshots, breakpoints)
  - Act steps (memory writes, continue execution)
  - Observe steps (check breakpoints, read registers)
  - Assert checks (deterministic pass/fail)
  - Cleanup steps (remove breakpoints, restore memory)
  - Optional verdict prompt for AI semantic analysis
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


# ======================================================================
# Address expression evaluator
# ======================================================================

_EXPR_TOKEN_RE = re.compile(r"[A-Za-z_]\w*|0x[0-9A-Fa-f]+|\d+|[+\-*/()&|^~]")


def resolve_address(expr: str, constants: dict[str, int]) -> int:
    """Evaluate a simple arithmetic expression over named constants.

    Supports: ``+``, ``-``, ``*``, hex literals, decimal literals,
    named constants, parentheses.

    Examples::

        resolve_address("STRUCT_BASE + 4 * ENTRY_STRIDE + FIELD_OFFSET",
                        {"STRUCT_BASE": 0x1D27B10,
                         "ENTRY_STRIDE": 0xD0,
                         "FIELD_OFFSET": 0x18})
        # => 0x1D27B10 + 4*0xD0 + 0x18
    """
    if isinstance(expr, int):
        return expr

    # Tokenize and substitute constants
    tokens = _EXPR_TOKEN_RE.findall(expr)
    parts: list[str] = []
    for tok in tokens:
        if tok in constants:
            parts.append(str(constants[tok]))
        elif re.match(r"^0x[0-9A-Fa-f]+$", tok):
            parts.append(str(int(tok, 16)))
        elif re.match(r"^\d+$", tok):
            parts.append(tok)
        elif tok in "+-*/()&|^~":
            parts.append(tok)
        else:
            raise ValueError(
                f"Unknown token '{tok}' in address expression '{expr}'. "
                f"Available constants: {sorted(constants)}")

    safe_expr = " ".join(parts)
    # Only allow digits, operators, parentheses, whitespace
    if not re.match(r"^[\d+\-*/()&|^~ ]+$", safe_expr):
        raise ValueError(f"Unsafe expression: {safe_expr!r}")
    return int(eval(safe_expr))  # noqa: S307  — inputs are sanitized above


# ======================================================================
# Step dataclasses
# ======================================================================

@dataclass
class Step:
    """A single action in any phase of a hypothesis."""
    action: str
    label: str = ""
    address: str | int = 0
    size: int = 0
    type: str = ""            # u8, u16, u32, bytes
    expect: str = ""          # "hit" / "not_hit" for breakpoint checks

    # Fields for domain-specific actions (e.g. slot index, struct fields)
    slot: int = 0
    fields: dict[str, Any] = field(default_factory=dict)

    # Fields for continue_execution
    timeout_ms: int = 5000
    wait_until: list[str] = field(default_factory=list)

    # Assert-specific
    check: str = ""           # assertion type name
    before: str = ""          # label reference
    after: str = ""           # label reference
    min_val: int | None = None
    max_val: int | None = None
    checks: list["Step"] = field(default_factory=list)  # nested checks (compound assertions)

    def resolved_address(self, constants: dict[str, int]) -> int:
        """Resolve the address field against the hypothesis constants."""
        if isinstance(self.address, int) and self.address != 0:
            return self.address
        if isinstance(self.address, str) and self.address:
            return resolve_address(self.address, constants)
        return 0


# ======================================================================
# Hypothesis definition
# ======================================================================

@dataclass
class HypothesisDefinition:
    """Complete hypothesis test case."""
    id: str
    title: str
    domain: str = ""
    confidence_target: str = ""
    references: list[str] = field(default_factory=list)
    constants: dict[str, int] = field(default_factory=dict)
    setup: list[Step] = field(default_factory=list)
    act: list[Step] = field(default_factory=list)
    observe: list[Step] = field(default_factory=list)
    asserts: list[Step] = field(default_factory=list)
    cleanup: list[Step] = field(default_factory=list)
    verdict_prompt: str = ""


@dataclass
class HypothesisSuiteDefinition:
    """Ordered list of hypotheses plus inter-hypothesis hook steps."""
    id: str
    title: str = ""
    hypotheses: list[str] = field(default_factory=list)
    before_each: list[Step] = field(default_factory=list)
    constants: dict[str, int] = field(default_factory=dict)


# ======================================================================
# YAML loader
# ======================================================================

def _parse_step(raw: dict[str, Any]) -> Step:
    """Parse a single step dict from YAML into a Step dataclass."""
    # Merge 'check' into 'action' for assert steps
    action = raw.get("action", raw.get("check", ""))
    return Step(
        action=action,
        label=raw.get("label", ""),
        address=raw.get("address", 0),
        size=raw.get("size", 0),
        type=raw.get("type", ""),
        expect=raw.get("expect", ""),
        slot=raw.get("slot", 0),
        fields=raw.get("fields", {}),
        timeout_ms=raw.get("timeout_ms", 5000),
        wait_until=raw.get("wait_until", raw.get("stop_on", [])),
        check=raw.get("check", ""),
        before=raw.get("before", ""),
        after=raw.get("after", ""),
        min_val=raw.get("min_val"),
        max_val=raw.get("max_val"),
        checks=[_parse_step(c) for c in raw.get("checks", [])],
    )


def _parse_constants(raw: dict[str, Any]) -> dict[str, int]:
    """Parse the constants section, converting hex strings to ints."""
    result: dict[str, int] = {}
    for key, val in raw.items():
        if isinstance(val, int):
            result[key] = val
        elif isinstance(val, str):
            val = val.strip()
            if val.startswith("0x") or val.startswith("0X"):
                result[key] = int(val, 16)
            elif val.isdigit():
                result[key] = int(val)
            else:
                # Skip unresolved placeholders like "..."
                pass
        # else skip
    return result


def load_hypothesis(path: str | Path) -> HypothesisDefinition:
    """Load a hypothesis definition from a YAML file."""
    import yaml  # deferred import to keep module importable without PyYAML

    path = Path(path)
    with open(path, "r", encoding="utf-8") as f:
        raw = yaml.safe_load(f)
    if isinstance(raw, dict) and "hypotheses" in raw:
        raise ValueError(
            f"{path} looks like a suite file. "
            "Use load_hypothesis_suite() instead."
        )

    constants = _parse_constants(raw.get("constants", {}))

    return HypothesisDefinition(
        id=raw.get("id", path.stem),
        title=raw.get("title", ""),
        domain=raw.get("domain", ""),
        confidence_target=raw.get("confidence_target", ""),
        references=raw.get("references", []),
        constants=constants,
        setup=[_parse_step(s) for s in raw.get("setup", [])],
        act=[_parse_step(s) for s in raw.get("act", [])],
        observe=[_parse_step(s) for s in raw.get("observe", [])],
        asserts=[_parse_step(s) for s in raw.get("assert", [])],
        cleanup=[_parse_step(s) for s in raw.get("cleanup", [])],
        verdict_prompt=raw.get("verdict_prompt", ""),
    )


def is_suite_file(path: str | Path) -> bool:
    """Return True if *path* points to a suite YAML file."""
    p = Path(path)
    name = p.name.lower()
    if name.endswith(".suite.yaml") or name.endswith(".suite.yml"):
        return True
    try:
        import yaml  # deferred import
        with open(p, "r", encoding="utf-8") as f:
            raw = yaml.safe_load(f)
        return isinstance(raw, dict) and "hypotheses" in raw
    except Exception:
        return False


def load_hypothesis_suite(path: str | Path) -> HypothesisSuiteDefinition:
    """Load a suite file containing hypothesis paths and before-each steps."""
    import yaml  # deferred import to keep module importable without PyYAML

    path = Path(path)
    with open(path, "r", encoding="utf-8") as f:
        raw = yaml.safe_load(f) or {}

    hypotheses = raw.get("hypotheses", [])
    if not isinstance(hypotheses, list) or not hypotheses:
        raise ValueError(f"{path}: suite must define a non-empty 'hypotheses' list")

    before_each_raw = raw.get("before_each")
    # Backward compatibility for older suite files.
    if before_each_raw is None:
        before_each_raw = raw.get("between_each", [])

    return HypothesisSuiteDefinition(
        id=raw.get("id", path.stem),
        title=raw.get("title", ""),
        hypotheses=[str(x) for x in hypotheses],
        before_each=[_parse_step(s) for s in before_each_raw],
        constants=_parse_constants(raw.get("constants", {})),
    )


def load_hypotheses_from_dir(directory: str | Path) -> list[HypothesisDefinition]:
    """Load all .yaml/.yml hypothesis files from a directory (recursive)."""
    directory = Path(directory)
    results = []
    for pattern in ("**/*.yaml", "**/*.yml"):
        for p in sorted(directory.glob(pattern)):
            lower = p.name.lower()
            if lower.endswith(".suite.yaml") or lower.endswith(".suite.yml"):
                continue
            results.append(load_hypothesis(p))
    return results
