"""
Hypothesis runner engine.

Deterministic orchestrator that executes hypothesis definitions through
five phases: setup -> act -> observe -> assert -> cleanup.

Collects structured evidence at each step and produces a final
Evidence object for serialization and analysis.

The runner ships with generic debugger actions (memory read/write,
breakpoints, registers, etc.).  Domain-specific actions are added
by plugins via :meth:`HypothesisRunner.register_action`.
"""

from __future__ import annotations

import struct
import time
from typing import Any, Callable

from .evidence import Evidence
from .hypothesis import HypothesisDefinition, Step, resolve_address
from .mcp_client import McpClient, McpToolError, McpTransportError

# Type alias for action handler functions.
# Signature: (step, constants, evidence) -> None
ActionHandler = Callable[[Step, "dict[str, int]", Evidence], None]
AssertHandler = Callable[[Step, Evidence], bool]


class HypothesisRunner:
    """Deterministic test executor for RE hypotheses.

    Built-in actions cover generic debugger operations.  Plugins
    extend the runner by calling :meth:`register_action` to add
    domain-specific action handlers (e.g. reading game-specific
    memory structures).
    """

    def __init__(
        self,
        mcp: McpClient,
        *,
        keep_breakpoints: bool = False,
    ) -> None:
        self.mcp = mcp
        self.keep_breakpoints = keep_breakpoints
        # label -> address mapping for active breakpoints
        self._bp_addrs: dict[str, int] = {}
        self._in_cleanup = False

        # Action registry — maps action name to handler callable
        self._actions: dict[str, ActionHandler] = {}
        # Assertion registry — maps check name to handler callable.
        # Handlers should record assertion results and return True if handled.
        self._assertions: dict[str, AssertHandler] = {}
        self._register_builtin_actions()

    # ==================================================================
    # Action registry
    # ==================================================================

    def register_action(self, name: str, handler: ActionHandler) -> None:
        """Register (or override) an action handler.

        *handler* will be called as ``handler(step, constants, evidence)``
        whenever a hypothesis step uses ``action: <name>``.
        """
        self._actions[name] = handler

    def register_assertion(self, name: str, handler: AssertHandler) -> None:
        """Register (or override) a custom assertion handler.

        The handler receives ``(step, evidence)``, should emit one assertion via
        ``evidence.add_assertion(...)`` and return True when it handled the
        check. This enables domain plugins (e.g., game-specific runners) to
        extend assertion semantics without modifying engine code.
        """
        self._assertions[name] = handler

    def _register_builtin_actions(self) -> None:
        """Register the generic debugger actions that ship with the engine."""
        self._actions["snapshot_memory"] = self._do_snapshot_memory
        self._actions["set_breakpoint"] = self._do_set_breakpoint
        self._actions["delete_breakpoint"] = self._do_delete_breakpoint
        self._actions["write_memory"] = self._do_write_memory
        self._actions["wait"] = self._do_wait
        self._actions["continue_execution"] = self._do_continue_execution
        self._actions["check_breakpoint_hit"] = self._do_check_breakpoint_hit
        self._actions["read_registers"] = self._do_read_registers
        self._actions["read_stacktrace"] = self._do_read_stacktrace
        self._actions["read_global"] = self._do_read_global
        self._actions["restore_snapshot"] = self._do_restore_snapshot

    # ==================================================================
    # Public API
    # ==================================================================

    def run(self, hypothesis: HypothesisDefinition) -> Evidence:
        """Execute *hypothesis* end-to-end, returning collected evidence."""
        evidence = Evidence(test_id=hypothesis.id, title=hypothesis.title)
        evidence.log(f"Starting hypothesis: {hypothesis.id} — {hypothesis.title}")
        t0 = time.perf_counter()

        try:
            # Phase 1: Setup
            evidence.log("=== Phase 1: Setup ===")
            for step in hypothesis.setup:
                self._exec_step(step, hypothesis.constants, evidence)

            # Phase 2: Act
            evidence.log("=== Phase 2: Act ===")
            for step in hypothesis.act:
                self._exec_step(step, hypothesis.constants, evidence)

            # Phase 3: Observe
            evidence.log("=== Phase 3: Observe ===")
            for step in hypothesis.observe:
                self._exec_step(step, hypothesis.constants, evidence)

            # Phase 4: Assert
            evidence.log("=== Phase 4: Assert ===")
            for step in hypothesis.asserts:
                self._eval_assert(step, evidence)

        except Exception as exc:
            evidence.log(f"EXCEPTION during execution: {type(exc).__name__}: {exc}")
            evidence.add_assertion("execution_completed", False,
                                   f"Exception: {exc}")
        finally:
            # Phase 5: Cleanup (always runs)
            evidence.log("=== Phase 5: Cleanup ===")
            self._in_cleanup = True
            try:
                for step in hypothesis.cleanup:
                    try:
                        self._exec_step(step, hypothesis.constants, evidence)
                    except Exception as exc:
                        evidence.log(f"Cleanup error: {exc}")
            finally:
                self._in_cleanup = False

        evidence.duration_ms = (time.perf_counter() - t0) * 1000
        evidence.log(
            f"Completed in {evidence.duration_ms:.1f}ms — "
            f"result: {evidence.deterministic_result}")
        return evidence

    def run_hook_steps(self, steps: list[Step], constants: dict[str, int],
                       evidence: Evidence, *, phase_name: str = "Hook") -> None:
        """Execute an arbitrary list of steps using normal action dispatch."""
        evidence.log(f"=== {phase_name} ===")
        for step in steps:
            self._exec_step(step, constants, evidence)

    # ==================================================================
    # Step dispatcher
    # ==================================================================

    def _exec_step(self, step: Step, constants: dict[str, int],
                   evidence: Evidence) -> None:
        """Dispatch a single step to the appropriate handler."""
        action = step.action or step.check
        evidence.log(f"  step: {action}"
                     + (f" [{step.label}]" if step.label else ""))

        handler = self._actions.get(action)
        if handler is not None:
            handler(step, constants, evidence)
        else:
            evidence.log(f"    WARNING: unknown action '{action}', skipping")

    # ==================================================================
    # Built-in action handlers
    # ==================================================================

    def _do_snapshot_memory(self, step: Step, constants: dict[str, int],
                            evidence: Evidence) -> None:
        addr = step.resolved_address(constants)
        size = step.size or 4
        raw = self.mcp.read_bytes(addr, size)
        value: Any
        match step.type:
            case "u8":
                value = struct.unpack_from("<B", raw)[0]
            case "u16":
                value = struct.unpack_from("<H", raw)[0]
            case "u32":
                value = struct.unpack_from("<I", raw)[0]
            case "i8":
                value = struct.unpack_from("<b", raw)[0]
            case "i16":
                value = struct.unpack_from("<h", raw)[0]
            case "i32":
                value = struct.unpack_from("<i", raw)[0]
            case _:
                value = raw.hex()
        evidence.snapshots[step.label] = value
        evidence.log(f"    {step.label} = {value} (@ {hex(addr)}, {size}B)")

    def _do_set_breakpoint(self, step: Step, constants: dict[str, int],
                           evidence: Evidence) -> None:
        addr = step.resolved_address(constants)
        self.mcp.add_breakpoint(addr)
        self._bp_addrs[step.label] = addr
        evidence.breakpoint_hits[step.label] = False
        evidence.log(f"    BP set: {step.label} @ {hex(addr)}")

    def _do_delete_breakpoint(self, step: Step, constants: dict[str, int],
                              evidence: Evidence) -> None:
        if self.keep_breakpoints and self._in_cleanup:
            evidence.log("    BP delete skipped during cleanup "
                         f"(keep_breakpoints=True): {step.label}")
            return
        label = step.label
        addr = self._bp_addrs.pop(label, None)
        if addr is None:
            addr = step.resolved_address(constants)
        if addr:
            self.mcp.delete_breakpoint(addr)
            evidence.log(f"    BP deleted: {label} @ {hex(addr)}")
        else:
            evidence.log(f"    BP delete: {label} — no address found")

    def _do_write_memory(self, step: Step, constants: dict[str, int],
                         evidence: Evidence) -> None:
        addr = step.resolved_address(constants)
        val = step.fields.get("value", 0)
        match step.type:
            case "u8":
                self.mcp.write_u8(addr, val)
            case "u16":
                self.mcp.write_u16(addr, val)
            case "u32":
                self.mcp.write_u32(addr, val)
            case _:
                if isinstance(val, str):
                    self.mcp.write_bytes(addr, bytes.fromhex(val))
                else:
                    self.mcp.write_u32(addr, val)
        evidence.log(f"    Wrote {step.type} @ {hex(addr)} = {val}")

    def _do_wait(self, step: Step, constants: dict[str, int],
                 evidence: Evidence) -> None:
        """Wait for ``timeout_ms`` milliseconds.

        If ``fields.resume_execution`` is true, repeatedly continue execution
        during the wait window so the target process can advance and settle.
        """
        ms = int(step.timeout_ms or 0)
        if ms <= 0:
            evidence.log(f"    WAIT skipped: invalid timeout_ms={ms}")
            return
        resume_execution = bool(step.fields.get("resume_execution", False))
        t0 = time.perf_counter()

        if not resume_execution:
            evidence.log(f"    Waiting {ms}ms...")
            time.sleep(ms / 1000.0)
            elapsed = int((time.perf_counter() - t0) * 1000)
            evidence.log(f"    Wait complete ({elapsed}ms)")
            return

        evidence.log(f"    Waiting {ms}ms with execution resumed...")
        deadline = t0 + (ms / 1000.0)
        slice_s = 0.5
        while True:
            remaining_s = deadline - time.perf_counter()
            if remaining_s <= 0:
                break
            try:
                self.mcp.continue_exec(timeout=min(slice_s, remaining_s))
            except (McpTransportError, McpToolError, TimeoutError) as exc:
                # Expected in some debugger states; continue until deadline.
                evidence.log(f"    wait/resume continue returned: {exc}")

        elapsed = int((time.perf_counter() - t0) * 1000)
        evidence.log(f"    Wait+resume complete ({elapsed}ms)")

    def _do_continue_execution(self, step: Step, constants: dict[str, int],
                               evidence: Evidence) -> None:
        wait_labels = step.wait_until or []
        if not wait_labels:
            raise ValueError(
                "continue_execution requires wait_until and timeout_ms "
                "(e.g. wait_until: [\"bp_name\"]).")

        deadline = time.perf_counter() + (step.timeout_ms / 1000.0)
        evidence.log(
            "    Continuing execution "
            f"(timeout={step.timeout_ms}ms, wait_until={wait_labels})")

        while True:
            remaining_s = deadline - time.perf_counter()
            if remaining_s <= 0:
                evidence.log(
                    f"    Timeout waiting for breakpoints {wait_labels}")
                return

            try:
                self.mcp.continue_exec(timeout=remaining_s)
            except (McpTransportError, McpToolError) as exc:
                evidence.log(f"    Continue returned with: {exc}")

            # After continue returns (process suspended), check which BP was hit.
            try:
                regs = self.mcp.get_gpregs()
                eip = self.extract_eip(regs)
                if not eip:
                    continue

                hit_label = self.match_breakpoint(eip, evidence)
                if hit_label and hit_label in wait_labels:
                    evidence.log(f"    wait_until satisfied by '{hit_label}'")
                    return

                # Stopped on something NOT in our wait_until list.
                if hit_label:
                    evidence.log(
                        f"    BP '{hit_label}' hit but not in wait_until "
                        f"{wait_labels}, resuming...")
            except Exception as exc:
                evidence.log(f"    Could not read registers after continue: {exc}")

    def _do_check_breakpoint_hit(self, step: Step, constants: dict[str, int],
                                 evidence: Evidence) -> None:
        label = step.label
        was_hit = evidence.breakpoint_hits.get(label, False)
        expected = step.expect.lower() if step.expect else "hit"
        if expected == "hit":
            evidence.log(f"    Check BP {label}: hit={was_hit} (expected=hit)")
        else:
            evidence.log(f"    Check BP {label}: hit={was_hit} (expected=not_hit)")

    def _do_read_registers(self, step: Step, constants: dict[str, int],
                           evidence: Evidence) -> None:
        regs = self.mcp.get_gpregs()
        evidence.register_dumps[step.label] = self.normalize_regs(regs)
        evidence.log(f"    Registers [{step.label}]: "
                     f"EIP={hex(self.extract_eip(regs) or 0)}")

    def _do_read_stacktrace(self, step: Step, constants: dict[str, int],
                            evidence: Evidence) -> None:
        st = self.mcp.stacktrace()
        evidence.stacktraces[step.label] = st
        evidence.log(f"    Stacktrace [{step.label}]: {len(st)} frames")

    def _do_read_global(self, step: Step, constants: dict[str, int],
                        evidence: Evidence) -> None:
        addr = step.resolved_address(constants)
        size = step.size or 1
        raw = self.mcp.read_bytes(addr, size)
        match step.type:
            case "u8":
                value = struct.unpack_from("<B", raw)[0]
            case "u16":
                value = struct.unpack_from("<H", raw)[0]
            case "u32":
                value = struct.unpack_from("<I", raw)[0]
            case _:
                value = raw.hex()
        evidence.snapshots[step.label] = value
        evidence.log(f"    Global [{step.label}] @ {hex(addr)} = {value}")

    def _do_restore_snapshot(self, step: Step, constants: dict[str, int],
                             evidence: Evidence) -> None:
        """Restore a previously-captured memory snapshot.

        Uses the ``label`` field to look up a hex-string snapshot from
        the evidence, and ``address`` for the write target.
        """
        source_label = step.fields.get("source", step.label)
        saved = evidence.snapshots.get(source_label)
        if saved is None:
            evidence.log(f"    Restore: no snapshot '{source_label}' found, skipping")
            return

        addr = step.resolved_address(constants)
        if isinstance(saved, str):
            data = bytes.fromhex(saved)
        elif isinstance(saved, bytes):
            data = saved
        else:
            evidence.log(f"    Restore: snapshot '{source_label}' is not bytes/hex "
                         f"(type={type(saved).__name__}), skipping")
            return

        self.mcp.write_bytes(addr, data)
        evidence.log(f"    Restored {len(data)} bytes to {hex(addr)} "
                     f"from snapshot '{source_label}'")

    # ==================================================================
    # Assertion evaluator
    # ==================================================================

    def _eval_assert(self, step: Step, evidence: Evidence) -> None:
        """Evaluate a deterministic assertion."""
        check = step.check or step.action
        custom = self._assertions.get(check)
        if custom is not None:
            handled = custom(step, evidence)
            if handled:
                return

        match check:
            case "breakpoint_was_hit":
                hit = evidence.breakpoint_hits.get(step.label, False)
                evidence.add_assertion(
                    f"breakpoint_was_hit:{step.label}", hit,
                    f"BP '{step.label}' hit={hit}")
                evidence.log(f"    ASSERT breakpoint_was_hit({step.label}): "
                             f"{'PASS' if hit else 'FAIL'}")

            case "breakpoint_not_hit":
                hit = evidence.breakpoint_hits.get(step.label, False)
                passed = not hit
                evidence.add_assertion(
                    f"breakpoint_not_hit:{step.label}", passed,
                    f"BP '{step.label}' hit={hit}")
                evidence.log(f"    ASSERT breakpoint_not_hit({step.label}): "
                             f"{'PASS' if passed else 'FAIL'}")

            case "value_equals":
                actual = evidence.snapshots.get(step.label)
                expected = step.fields.get("expected")
                passed = actual == expected
                evidence.add_assertion(
                    f"value_equals:{step.label}", passed,
                    f"actual={actual}, expected={expected}")
                evidence.log(f"    ASSERT value_equals({step.label}): "
                             f"actual={actual} expected={expected} "
                             f"{'PASS' if passed else 'FAIL'}")

            case "value_changed":
                before = evidence.snapshots.get(step.before)
                after = evidence.snapshots.get(step.after)
                passed = before != after
                evidence.add_assertion(
                    f"value_changed:{step.before}->{step.after}", passed,
                    f"before={before}, after={after}")
                evidence.log(f"    ASSERT value_changed({step.before} -> {step.after}): "
                             f"before={before} after={after} "
                             f"{'PASS' if passed else 'FAIL'}")

            case "value_in_range":
                actual = evidence.snapshots.get(step.label)
                lo = step.min_val if step.min_val is not None else 0
                hi = step.max_val if step.max_val is not None else 0xFFFFFFFF
                if isinstance(actual, int):
                    passed = lo <= actual <= hi
                else:
                    passed = False
                evidence.add_assertion(
                    f"value_in_range:{step.label}", passed,
                    f"actual={actual}, range=[{lo}, {hi}]")
                evidence.log(f"    ASSERT value_in_range({step.label}): "
                             f"actual={actual} range=[{lo},{hi}] "
                             f"{'PASS' if passed else 'FAIL'}")

            case "value_not_zero":
                actual = evidence.snapshots.get(step.label, 0)
                passed = actual != 0 and actual != "0" and actual != "00"
                evidence.add_assertion(
                    f"value_not_zero:{step.label}", passed,
                    f"actual={actual}")
                evidence.log(f"    ASSERT value_not_zero({step.label}): "
                             f"actual={actual} {'PASS' if passed else 'FAIL'}")

            case "any_of":
                if not step.checks:
                    evidence.add_assertion(
                        f"any_of:{step.label or 'unnamed'}", False,
                        "No sub-checks provided in 'checks'")
                    evidence.log(f"    ASSERT any_of({step.label or 'unnamed'}): "
                                 "FAIL (no sub-checks)")
                    return

                sub_results: list[dict[str, Any]] = []
                for idx, sub_step in enumerate(step.checks):
                    before_count = len(evidence.assertions)
                    self._eval_assert(sub_step, evidence)
                    generated = evidence.assertions[before_count:]
                    del evidence.assertions[before_count:]

                    if generated:
                        sub_results.append(generated[-1])
                    else:
                        sub_results.append({
                            "check": f"sub[{idx}]",
                            "passed": False,
                            "detail": "Sub-check produced no assertion result",
                        })

                passed_count = sum(1 for r in sub_results if r.get("passed"))
                total = len(sub_results)
                passed = passed_count > 0

                lines = []
                for idx, res in enumerate(sub_results):
                    status = "PASS" if res.get("passed") else "FAIL"
                    lines.append(
                        f"sub[{idx}] {res.get('check', 'unknown')}: {status} "
                        f"-- {res.get('detail', '')}"
                    )
                lines.append(f"overall: {'PASS' if passed else 'FAIL'} ({passed_count}/{total} passed)")

                label = step.label or "unnamed"
                evidence.add_assertion(
                    f"any_of:{label}",
                    passed,
                    "\n".join(lines),
                )
                evidence.log(
                    f"    ASSERT any_of({label}): "
                    f"{'PASS' if passed else 'FAIL'} ({passed_count}/{total} passed)"
                )

            case _:
                evidence.add_assertion(
                    f"unknown_check:{check}", False,
                    f"Unrecognized assertion type: {check}")
                evidence.log(f"    ASSERT unknown check '{check}': FAIL")

    # ==================================================================
    # Public helpers (used by plugins and built-in actions)
    # ==================================================================

    def extract_eip(self, regs: Any) -> int | None:
        """Extract EIP (32-bit) or RIP (64-bit) from a register dump."""
        if isinstance(regs, dict):
            # The MCP server may return registers in various formats
            for key in ("eip", "EIP", "rip", "RIP", "pc", "PC"):
                if key in regs:
                    val = regs[key]
                    if isinstance(val, str):
                        return int(val, 16) if val.startswith("0x") else int(val)
                    return int(val)
            # May be nested: {"registers": [...]} or list of {name, value}
            if "registers" in regs:
                return self.extract_eip(regs["registers"])
        if isinstance(regs, list):
            for item in regs:
                if isinstance(item, dict):
                    name = item.get("name", "").lower()
                    if name in ("eip", "rip", "pc"):
                        val = item.get("value", 0)
                        if isinstance(val, str):
                            return int(val, 16) if val.startswith("0x") else int(val)
                        return int(val)
        return None

    def normalize_regs(self, regs: Any) -> dict[str, Any]:
        """Normalize register data into a flat {name: value} dict."""
        if isinstance(regs, dict):
            if "registers" in regs and isinstance(regs["registers"], list):
                return {r["name"]: r["value"]
                        for r in regs["registers"]
                        if isinstance(r, dict) and "name" in r}
            return regs
        if isinstance(regs, list):
            return {r["name"]: r["value"]
                    for r in regs
                    if isinstance(r, dict) and "name" in r}
        return {"raw": str(regs)}

    def match_breakpoint(self, eip: int, evidence: Evidence) -> str | None:
        """Check if EIP matches any active breakpoint (with INT3 off-by-one)."""
        for label, addr in self._bp_addrs.items():
            # x86 INT3: EIP may be at the BP address itself or addr+1
            if eip == addr or eip == addr + 1 or eip == addr - 1:
                evidence.breakpoint_hits[label] = True
                evidence.log(f"    -> BP hit: {label} @ {hex(addr)} "
                             f"(EIP={hex(eip)})")
                return label
        evidence.log(f"    -> No matching BP for EIP={hex(eip)}")
        return None
