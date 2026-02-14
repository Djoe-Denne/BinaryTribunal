"""FF8-specific assertion handlers for hypothesis checks."""

from __future__ import annotations

from typing import Any

from binaryTribunal.evidence import Evidence
from binaryTribunal.hypothesis import Step
from binaryTribunal.runner import HypothesisRunner

from .status_effects import decode_status_effects


def _to_int(val: Any, default: int = 0) -> int:
    if isinstance(val, bool):
        return int(val)
    if isinstance(val, int):
        return val
    if isinstance(val, str):
        s = val.strip()
        try:
            return int(s, 16) if s.lower().startswith("0x") else int(s)
        except ValueError:
            return default
    return default


def _slot_status_set(snapshot: Any) -> set[str]:
    if not isinstance(snapshot, dict):
        return set()
    # FF8 snapshot schema: status2 is low 32 bits, low-16(status1) is upper 16 bits.
    statuses1 = _to_int(snapshot.get("status2"), 0)
    statuses0 = _to_int(snapshot.get("status1"), 0) & 0xFFFF
    return set(decode_status_effects(statuses1=statuses1, statuses0=statuses0))


def register_ff8_assertions(runner: HypothesisRunner) -> None:
    """Register FF8-only assertion checks on a runner instance."""

    def slot_field_equals(step: Step, evidence: Evidence) -> bool:
        snap = evidence.snapshots.get(step.label, {})
        field_name = step.fields.get("field", "")
        expected = step.fields.get("expected")
        actual = snap.get(field_name) if isinstance(snap, dict) else None
        passed = actual == expected
        evidence.add_assertion(
            f"slot_field_equals:{step.label}.{field_name}",
            passed,
            f"actual={actual}, expected={expected}",
        )
        evidence.log(
            f"    ASSERT slot_field_equals({step.label}.{field_name}): "
            f"{'PASS' if passed else 'FAIL'} "
            f"(actual={actual}, expected={expected})"
        )
        return True

    def slot_status_any_added(step: Step, evidence: Evidence) -> bool:
        before = evidence.snapshots.get(step.before)
        after = evidence.snapshots.get(step.after)
        before_statuses = _slot_status_set(before)
        after_statuses = _slot_status_set(after)
        added = after_statuses - before_statuses
        expected = step.fields.get("statuses", [])
        if isinstance(expected, str):
            expected_list = [expected]
        elif isinstance(expected, list):
            expected_list = [str(x) for x in expected]
        else:
            expected_list = []
        passed = any(name in added for name in expected_list)
        evidence.add_assertion(
            f"slot_status_any_added:{step.before}->{step.after}",
            passed,
            f"expected_any={expected_list}, added={sorted(added)}",
        )
        evidence.log(
            f"    ASSERT slot_status_any_added({step.before}->{step.after}): "
            f"{'PASS' if passed else 'FAIL'} "
            f"(expected_any={expected_list}, added={sorted(added)})"
        )
        return True

    def slot_killed_if_alive(step: Step, evidence: Evidence) -> bool:
        before = evidence.snapshots.get(step.before)
        after = evidence.snapshots.get(step.after)
        before_hp = _to_int((before or {}).get("current_hp"), 0) if isinstance(before, dict) else 0
        before_statuses = _slot_status_set(before)
        after_hp = _to_int((after or {}).get("current_hp"), 0) if isinstance(after, dict) else 0
        after_statuses = _slot_status_set(after)
        was_alive = before_hp > 0 and "Death" not in before_statuses
        if not was_alive:
            passed = True
            detail = (
                f"slot not alive before (hp={before_hp}, statuses={sorted(before_statuses)}), "
                "check treated as pass"
            )
        else:
            is_dead_after = after_hp == 0 or "Death" in after_statuses
            passed = is_dead_after
            detail = (
                f"before_hp={before_hp}, after_hp={after_hp}, "
                f"after_statuses={sorted(after_statuses)}, is_dead_after={is_dead_after}"
            )
        evidence.add_assertion(
            f"slot_killed_if_alive:{step.before}->{step.after}",
            passed,
            detail,
        )
        evidence.log(
            f"    ASSERT slot_killed_if_alive({step.before}->{step.after}): "
            f"{'PASS' if passed else 'FAIL'} ({detail})"
        )
        return True

    def slot_hp_decreased_if_alive(step: Step, evidence: Evidence) -> bool:
        before = evidence.snapshots.get(step.before)
        after = evidence.snapshots.get(step.after)
        before_hp = _to_int((before or {}).get("current_hp"), 0) if isinstance(before, dict) else 0
        before_statuses = _slot_status_set(before)
        after_hp = _to_int((after or {}).get("current_hp"), 0) if isinstance(after, dict) else 0
        was_alive = before_hp > 0 and "Death" not in before_statuses
        if not was_alive:
            passed = True
            detail = (
                f"slot not alive before (hp={before_hp}, statuses={sorted(before_statuses)}), "
                "check treated as pass"
            )
        else:
            passed = after_hp < before_hp
            detail = f"before_hp={before_hp}, after_hp={after_hp}"
        evidence.add_assertion(
            f"slot_hp_decreased_if_alive:{step.before}->{step.after}",
            passed,
            detail,
        )
        evidence.log(
            f"    ASSERT slot_hp_decreased_if_alive({step.before}->{step.after}): "
            f"{'PASS' if passed else 'FAIL'} ({detail})"
        )
        return True

    runner.register_assertion("slot_field_equals", slot_field_equals)
    runner.register_assertion("slot_status_any_added", slot_status_any_added)
    runner.register_assertion("slot_killed_if_alive", slot_killed_if_alive)
    runner.register_assertion("slot_hp_decreased_if_alive", slot_hp_decreased_if_alive)
