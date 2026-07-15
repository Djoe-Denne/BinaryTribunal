"""
Evidence collection and JSON serialization.

An Evidence object accumulates structured data produced during hypothesis
execution: memory snapshots, breakpoint hit records, register dumps,
stacktraces, assertion results, structured hit traces, samples, and
a chronological raw log.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


@dataclass
class Evidence:
    """Accumulated evidence from a single hypothesis execution."""

    test_id: str
    title: str
    timestamp: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat())
    duration_ms: float = 0.0

    # Collected data
    snapshots: dict[str, Any] = field(default_factory=dict)
    breakpoint_hits: dict[str, bool] = field(default_factory=dict)
    breakpoint_hit_counts: dict[str, int] = field(default_factory=dict)
    last_breakpoint_hit: str | None = None
    register_dumps: dict[str, dict[str, Any]] = field(default_factory=dict)
    stacktraces: dict[str, list[dict[str, Any]]] = field(default_factory=dict)
    hit_trace: list[dict[str, Any]] = field(default_factory=list)
    samples: dict[str, list[dict[str, Any]]] = field(default_factory=dict)

    # Assertion results
    assertions: list[dict[str, Any]] = field(default_factory=list)

    # Chronological execution log
    raw_log: list[str] = field(default_factory=list)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def log(self, msg: str) -> None:
        """Append a timestamped entry to the raw log."""
        ts = datetime.now(timezone.utc).strftime("%H:%M:%S.%f")[:-3]
        self.raw_log.append(f"[{ts}] {msg}")

    @property
    def deterministic_result(self) -> str:
        """PASS if all assertions passed, FAIL otherwise."""
        if not self.assertions:
            return "NO_ASSERTIONS"
        return "PASS" if all(a.get("passed") for a in self.assertions) else "FAIL"

    def add_assertion(self, check: str, passed: bool, detail: str = "") -> None:
        self.assertions.append({
            "check": check,
            "passed": passed,
            "detail": detail,
        })

    def add_hit_event(
        self,
        *,
        label: str,
        event_type: str,
        eip: int | None = None,
        source_addr: int | None = None,
        captures: dict[str, Any] | None = None,
        detail: str = "",
        t_ms: int = 0,
    ) -> dict[str, Any]:
        """Append a structured breakpoint/watchpoint hit event."""
        entry = {
            "seq": len(self.hit_trace) + 1,
            "label": label,
            "event_type": event_type,
            "eip": eip,
            "source_addr": source_addr,
            "t_ms": t_ms,
            "captures": captures or {},
            "detail": detail,
        }
        self.hit_trace.append(entry)
        return entry

    def add_sample(self, label: str, sample: dict[str, Any]) -> None:
        """Append one sample to a named time series."""
        self.samples.setdefault(label, []).append(sample)

    # ------------------------------------------------------------------
    # Serialization
    # ------------------------------------------------------------------

    def to_dict(self) -> dict[str, Any]:
        """Produce a JSON-serializable dictionary."""
        return {
            "test_id": self.test_id,
            "title": self.title,
            "timestamp": self.timestamp,
            "duration_ms": self.duration_ms,
            "deterministic_result": self.deterministic_result,
            "snapshots": self.snapshots,
            "breakpoint_hits": self.breakpoint_hits,
            "breakpoint_hit_counts": self.breakpoint_hit_counts,
            "last_breakpoint_hit": self.last_breakpoint_hit,
            "register_dumps": _hex_registers(self.register_dumps),
            "stacktraces": self.stacktraces,
            "hit_trace": _hexify_hit_trace(self.hit_trace),
            "samples": self.samples,
            "assertions": self.assertions,
            "raw_log": self.raw_log,
        }

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent, default=str)

    def write_json(self, directory: str | Path) -> Path:
        """Write evidence JSON to *directory*, return the file path."""
        directory = Path(directory)
        directory.mkdir(parents=True, exist_ok=True)
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%S")
        filename = f"{ts}_{self.test_id}.json"
        path = directory / filename
        path.write_text(self.to_json(), encoding="utf-8")
        return path


# ------------------------------------------------------------------
# Internal helpers
# ------------------------------------------------------------------

def _hex_registers(dumps: dict[str, dict[str, Any]]) -> dict[str, dict[str, str]]:
    """Convert integer register values to hex strings for readability."""
    result: dict[str, dict[str, str]] = {}
    for label, regs in dumps.items():
        result[label] = {}
        for name, val in regs.items():
            if isinstance(val, int):
                result[label][name] = hex(val)
            else:
                result[label][name] = str(val)
    return result


def _hexify_hit_trace(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Convert selected address-like fields in hit traces to hex strings."""
    result: list[dict[str, Any]] = []
    for item in items:
        converted = dict(item)
        for key in ("eip", "source_addr"):
            value = converted.get(key)
            if isinstance(value, int):
                converted[key] = hex(value)
        result.append(converted)
    return result
