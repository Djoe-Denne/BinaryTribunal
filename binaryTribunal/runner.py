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
import textwrap
import time
from typing import Any, Callable

from .evidence import Evidence
from .hypothesis import HypothesisDefinition, Step, resolve_address
from .mcp_client import McpClient, McpToolError, McpTransportError

ActionHandler = Callable[[Step, "dict[str, int]", Evidence], None]
AssertHandler = Callable[[Step, Evidence], bool]

_BUILTIN_ASSERTIONS = {
    "breakpoint_was_hit",
    "breakpoint_not_hit",
    "value_equals",
    "value_changed",
    "value_in_range",
    "value_not_zero",
    "hit_count_at_least",
    "bits_set",
    "bits_clear",
    "value_delta_in_range",
    "any_of",
    "all_of",
}


class HypothesisRunner:
    """Deterministic test executor for RE hypotheses."""

    def __init__(
        self,
        mcp: McpClient,
        *,
        keep_breakpoints: bool = False,
    ) -> None:
        self.mcp = mcp
        self.keep_breakpoints = keep_breakpoints
        self._bp_addrs: dict[str, int] = {}
        self._wp_addrs: dict[str, tuple[int, int]] = {}
        self._in_cleanup = False
        self._start_time: float | None = None

        self._actions: dict[str, ActionHandler] = {}
        self._assertions: dict[str, AssertHandler] = {}
        self._register_builtin_actions()

    @staticmethod
    def _is_debugger_not_running_error(exc: Exception) -> bool:
        text = str(exc).lower()
        return "debugger not running" in text or "no debugger" in text

    def _raise_if_debugger_not_running(self, exc: Exception, context: str) -> None:
        if self._is_debugger_not_running_error(exc):
            raise RuntimeError(f"{context}: debugger not running") from exc

    # ==================================================================
    # Action registry
    # ==================================================================

    def register_action(self, name: str, handler: ActionHandler) -> None:
        """Register (or override) an action handler."""
        self._actions[name] = handler

    def register_assertion(self, name: str, handler: AssertHandler) -> None:
        """Register (or override) a custom assertion handler."""
        self._assertions[name] = handler

    def known_actions(self) -> list[str]:
        """Return all registered action names."""
        return sorted(self._actions)

    def known_assertions(self) -> list[str]:
        """Return all built-in and custom assertion names."""
        return sorted(_BUILTIN_ASSERTIONS | set(self._assertions))

    def _register_builtin_actions(self) -> None:
        """Register the generic debugger actions that ship with the engine."""
        self._actions["snapshot_memory"] = self._do_snapshot_memory
        self._actions["set_breakpoint"] = self._do_set_breakpoint
        self._actions["delete_breakpoint"] = self._do_delete_breakpoint
        self._actions["set_watchpoint"] = self._do_set_watchpoint
        self._actions["delete_watchpoint"] = self._do_delete_watchpoint
        self._actions["write_memory"] = self._do_write_memory
        self._actions["wait"] = self._do_wait
        self._actions["continue_execution"] = self._do_continue_execution
        self._actions["trace_breakpoint_hits"] = self._do_trace_breakpoint_hits
        self._actions["manual_checkpoint"] = self._do_manual_checkpoint
        self._actions["sample_memory"] = self._do_sample_memory
        self._actions["check_breakpoint_hit"] = self._do_check_breakpoint_hit
        self._actions["read_registers"] = self._do_read_registers
        self._actions["read_stacktrace"] = self._do_read_stacktrace
        self._actions["read_global"] = self._do_read_global
        self._actions["read_stack_args"] = self._do_read_stack_args
        self._actions["restore_snapshot"] = self._do_restore_snapshot

    # ==================================================================
    # Public API
    # ==================================================================

    def run(self, hypothesis: HypothesisDefinition) -> Evidence:
        """Execute *hypothesis* end-to-end, returning collected evidence."""
        evidence = Evidence(test_id=hypothesis.id, title=hypothesis.title)
        evidence.log(f"Starting hypothesis: {hypothesis.id} — {hypothesis.title}")
        t0 = time.perf_counter()
        self._start_time = t0

        try:
            evidence.log("=== Phase 1: Setup ===")
            for step in hypothesis.setup:
                self._exec_step(step, hypothesis.constants, evidence)

            evidence.log("=== Phase 2: Act ===")
            for step in hypothesis.act:
                self._exec_step(step, hypothesis.constants, evidence)

            evidence.log("=== Phase 3: Observe ===")
            for step in hypothesis.observe:
                self._exec_step(step, hypothesis.constants, evidence)

            evidence.log("=== Phase 4: Assert ===")
            for step in hypothesis.asserts:
                self._eval_assert(step, evidence)

        except Exception as exc:
            evidence.log(f"EXCEPTION during execution: {type(exc).__name__}: {exc}")
            evidence.add_assertion("execution_completed", False, f"Exception: {exc}")
        finally:
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
            f"result: {evidence.deterministic_result}"
        )
        return evidence

    def run_hook_steps(
        self,
        steps: list[Step],
        constants: dict[str, int],
        evidence: Evidence,
        *,
        phase_name: str = "Hook",
    ) -> None:
        """Execute an arbitrary list of steps using normal action dispatch."""
        if self._start_time is None:
            self._start_time = time.perf_counter()
        evidence.log(f"=== {phase_name} ===")
        for step in steps:
            self._exec_step(step, constants, evidence)

    # ==================================================================
    # Step dispatcher
    # ==================================================================

    def _exec_step(self, step: Step, constants: dict[str, int], evidence: Evidence) -> None:
        """Dispatch a single step to the appropriate handler."""
        action = step.action or step.check
        evidence.log(f"  step: {action}" + (f" [{step.label}]" if step.label else ""))
        handler = self._actions.get(action)
        if handler is not None:
            handler(step, constants, evidence)
        else:
            evidence.log(f"    WARNING: unknown action '{action}', skipping")

    # ==================================================================
    # Built-in action handlers
    # ==================================================================

    def _do_snapshot_memory(self, step: Step, constants: dict[str, int], evidence: Evidence) -> None:
        addr = step.resolved_address(constants)
        size = step.size or 4
        raw = self.mcp.read_bytes(addr, size)
        value = self._decode_raw_value(raw, step.type)
        evidence.snapshots[step.label] = value
        evidence.log(f"    {step.label} = {value} (@ {hex(addr)}, {size}B)")

    def _do_set_breakpoint(self, step: Step, constants: dict[str, int], evidence: Evidence) -> None:
        addr = step.resolved_address(constants)
        self.mcp.add_breakpoint(addr)
        self._bp_addrs[step.label] = addr
        evidence.breakpoint_hits[step.label] = False
        evidence.breakpoint_hit_counts[step.label] = 0
        evidence.log(f"    BP set: {step.label} @ {hex(addr)}")

    def _do_delete_breakpoint(self, step: Step, constants: dict[str, int], evidence: Evidence) -> None:
        if self.keep_breakpoints and self._in_cleanup:
            evidence.log(
                "    BP delete skipped during cleanup "
                f"(keep_breakpoints=True): {step.label}"
            )
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

    def _do_set_watchpoint(self, step: Step, constants: dict[str, int], evidence: Evidence) -> None:
        addr = step.resolved_address(constants)
        size = int(step.size or step.fields.get("size", 1) or 1)
        if step.label not in self._wp_addrs and len(self._wp_addrs) >= 4:
            raise ValueError("Cannot arm more than 4 simultaneous hardware watchpoints")
        self.mcp.add_watchpoint(addr, size)
        self._wp_addrs[step.label] = (addr, size)
        evidence.breakpoint_hits[step.label] = False
        evidence.breakpoint_hit_counts[step.label] = 0
        evidence.log(f"    WP set: {step.label} @ {hex(addr)} size={size}")

    def _do_delete_watchpoint(self, step: Step, constants: dict[str, int], evidence: Evidence) -> None:
        if self.keep_breakpoints and self._in_cleanup:
            evidence.log(
                "    WP delete skipped during cleanup "
                f"(keep_breakpoints=True): {step.label}"
            )
            return
        label = step.label
        wp = self._wp_addrs.pop(label, None)
        addr = wp[0] if wp is not None else step.resolved_address(constants)
        if addr:
            self.mcp.delete_watchpoint(addr)
            evidence.log(f"    WP deleted: {label} @ {hex(addr)}")
        else:
            evidence.log(f"    WP delete: {label} — no address found")

    def _do_write_memory(self, step: Step, constants: dict[str, int], evidence: Evidence) -> None:
        addr = step.resolved_address(constants)
        val = step.fields.get("value", 0)

        def _resolve_val(v: Any) -> int:
            # Allow named constants / arithmetic expressions for scalar writes.
            if isinstance(v, str) and v.strip():
                return resolve_address(v.strip(), constants)
            return _coerce_int(v)

        match step.type:
            case "u8":
                self.mcp.write_u8(addr, _resolve_val(val))
            case "u16":
                self.mcp.write_u16(addr, _resolve_val(val))
            case "u32":
                self.mcp.write_u32(addr, _resolve_val(val))
            case _:
                if isinstance(val, str) and not val.strip().startswith(("0x", "0X")) and val.strip() in constants:
                    self.mcp.write_u32(addr, resolve_address(val.strip(), constants))
                elif isinstance(val, str):
                    self.mcp.write_bytes(addr, bytes.fromhex(val))
                else:
                    self.mcp.write_u32(addr, _coerce_int(val))
        evidence.log(f"    Wrote {step.type} @ {hex(addr)} = {val}")

    def _do_wait(self, step: Step, constants: dict[str, int], evidence: Evidence) -> None:
        """Wait for ``timeout_ms`` milliseconds."""
        del constants
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
                self._raise_if_debugger_not_running(exc, "wait/resume lost debugger")
                evidence.log(f"    wait/resume continue returned: {exc}")
        elapsed = int((time.perf_counter() - t0) * 1000)
        evidence.log(f"    Wait+resume complete ({elapsed}ms)")

    def _do_continue_execution(self, step: Step, constants: dict[str, int], evidence: Evidence) -> None:
        del constants
        wait_labels = step.wait_until or []
        if not wait_labels:
            raise ValueError(
                "continue_execution requires wait_until and timeout_ms "
                '(e.g. wait_until: ["bp_name"]).'
            )
        evidence.log(
            "    Continuing execution "
            f"(timeout={step.timeout_ms}ms, wait_until={wait_labels})"
        )
        stop = self._continue_until_labels(wait_labels, step.timeout_ms, evidence)
        if stop is None:
            evidence.log(f"    Timeout waiting for breakpoints {wait_labels}")

    def _do_trace_breakpoint_hits(self, step: Step, constants: dict[str, int], evidence: Evidence) -> None:
        labels = step.wait_until or [*self._bp_addrs.keys(), *self._wp_addrs.keys()]
        if not labels:
            raise ValueError("trace_breakpoint_hits requires wait_until or active labels")

        max_hits = int(step.max_hits or 0)
        evidence.log(
            "    Tracing stop events "
            f"(timeout={step.timeout_ms}ms, labels={labels}, max_hits={max_hits or 'unbounded'})"
        )

        deadline = time.perf_counter() + ((step.timeout_ms or 0) / 1000.0)
        matched = 0
        initial_stop = self._detect_stop(evidence)
        if initial_stop is not None:
            if initial_stop["label"] in labels:
                self._record_trace_stop(initial_stop, step, constants, evidence, matched + 1)
                matched += 1
                if max_hits > 0 and matched >= max_hits:
                    evidence.log(f"    Trace finished after {matched} matching hit(s)")
                    return
            else:
                evidence.log(
                    f"    Initial stop on '{initial_stop['label']}' ignored while tracing labels {labels}"
                )

        while True:
            remaining_s = deadline - time.perf_counter()
            if remaining_s <= 0:
                break
            try:
                self.mcp.continue_exec(timeout=remaining_s)
            except (McpTransportError, McpToolError) as exc:
                self._raise_if_debugger_not_running(exc, "trace_breakpoint_hits lost debugger")
                evidence.log(f"    Trace continue returned with: {exc}")

            stop = self._detect_stop(evidence)
            if stop is None:
                continue
            if stop["label"] not in labels:
                evidence.log(
                    f"    Stop on '{stop['label']}' ignored while tracing labels {labels}"
                )
                continue

            self._record_trace_stop(stop, step, constants, evidence, matched + 1)
            matched += 1
            if max_hits > 0 and matched >= max_hits:
                break

        evidence.log(f"    Trace finished after {matched} matching hit(s)")

    def _do_manual_checkpoint(self, step: Step, constants: dict[str, int], evidence: Evidence) -> None:
        message = step.message or str(step.fields.get("message", "") or "").strip()
        if not message:
            message = step.label or "Manual checkpoint"
        resume_execution = bool(step.fields.get("resume_execution", False))
        wait_timeout = int(step.timeout_ms or step.fields.get("timeout_ms", 5000) or 5000)

        evidence.log(f"    Manual checkpoint: {message}")

        if resume_execution:
            self._run_resume_checkpoint(step, constants, evidence, message, wait_timeout)
            return

        # Passive checkpoint: the game stays exactly where it is.
        self._print_checkpoint_header(step, message, paused=True)
        print("ETAPE UNIQUE -> Appuie sur [Entree] quand tu es pret a continuer.")
        print("               (le jeu reste EN PAUSE, le runner ne le relance pas)")
        try:
            input()
        except EOFError:
            evidence.log("    Manual checkpoint input unavailable; continuing automatically")

    def _print_checkpoint_header(self, step: Step, message: str, *, paused: bool) -> None:
        state = "EN PAUSE (le runner controle l'execution)" if paused else "EN COURS"
        print("")
        print("=" * 66)
        print(f"[CHECKPOINT MANUEL] {step.label or 'checkpoint'}")
        print("-" * 66)
        print(f"ETAT DU JEU : {state}")
        print("")
        print("ACTION A FAIRE DANS LE JEU :")
        print(textwrap.indent(message.strip(), "  "))
        print("-" * 66)

    @staticmethod
    def _prompt_enter(evidence: Evidence, fallback_log: str) -> None:
        try:
            input()
        except EOFError:
            evidence.log(fallback_log)

    def _run_resume_checkpoint(
        self,
        step: Step,
        constants: dict[str, int],
        evidence: Evidence,
        message: str,
        wait_timeout: int,
    ) -> None:
        """Interactive checkpoint that resumes the game for a manual action.

        Two kinds of checkpoint are supported, chosen by whether the step
        declares observation labels in ``wait_until``:

        * **observation checkpoint** (``wait_until`` set): the breakpoints stay
          *armed* while the player performs the action, so the runner reacquires
          control automatically the instant the action trips one of them. The
          player only presses Enter once (to start), then simply plays; there is
          no second keystroke and nothing to time.
        * **resync checkpoint** (no ``wait_until``, only an ``address`` /
          ``sync_address``): the runner gives a free-running window (breakpoints
          disabled) so the player can set the battle up, then realigns to a tick
          boundary and resumes the game so it keeps running for what comes next.
        """
        if bool(step.wait_until):
            self._run_observation_checkpoint(step, evidence, message, wait_timeout)
        else:
            self._run_resync_checkpoint(step, constants, evidence, message, wait_timeout)

    def _run_observation_checkpoint(
        self,
        step: Step,
        evidence: Evidence,
        message: str,
        wait_timeout: int,
    ) -> None:
        """Single-keystroke checkpoint: arm, resume, auto-capture on action."""
        wait_labels = list(step.wait_until)
        # Manual play needs slack: keep a generous floor so the player is never
        # rushed while navigating menus and triggering the action.
        capture_timeout = max(int(wait_timeout), 120000)

        self._print_checkpoint_header(step, message, paused=True)
        print("ETAPE UNIQUE -> Appuie sur [Entree], PUIS declenche l'action dans le jeu.")
        print("   - Les breakpoints RESTENT armes : le runner reprend la main TOUT SEUL")
        print("     des que l'action atteint un point d'observation.")
        print("   - Tu n'attends PAS la fin de l'animation.")
        print("   - Tu n'as RIEN d'autre a taper : pas de second [Entree].")
        self._prompt_enter(evidence, "    Observation checkpoint input unavailable; resuming automatically")

        state = self.mcp.get_process_state()
        if not bool(state.get("debugger_on", False)):
            raise RuntimeError("debugger not attached after manual checkpoint")

        if not self._process_is_running(state):
            try:
                self.mcp.request_continue_process()
                evidence.log("    Observation checkpoint: game RUNNING, breakpoints armed")
            except Exception as exc:
                self._raise_if_debugger_not_running(exc, "could not resume for observation checkpoint")
                evidence.log(f"    Could not resume for observation checkpoint: {exc}")
        else:
            evidence.log("    Observation checkpoint: target already RUNNING, breakpoints armed")

        print("")
        print(">>> JEU RELANCE. Declenche l'action maintenant - capture automatique en cours...")

        stop = self._wait_running_until_labels(wait_labels, capture_timeout, evidence)
        if stop is None:
            raise RuntimeError(
                f"observation checkpoint timed out waiting for {wait_labels} "
                "(l'action n'a touche aucun breakpoint d'observation)"
            )
        evidence.log(f"    Action captured on '{stop['label']}'; game PAUSED for observation")
        print(f">>> Action capturee sur '{stop['label']}'. JEU EN PAUSE - le runner observe, ne touche a rien.")

    def _run_resync_checkpoint(
        self,
        step: Step,
        constants: dict[str, int],
        evidence: Evidence,
        message: str,
        wait_timeout: int,
    ) -> None:
        """Two-keystroke checkpoint: free-play to set up, then resync + resume."""
        self._print_checkpoint_header(step, message, paused=True)

        # --- Step 1: free-running window so the player can set things up ----
        print("ETAPE 1/2 -> Appuie sur [Entree] pour RELANCER le jeu (jeu libre).")
        print("            (les breakpoints sont desactives : aucun gel pendant la prepa)")
        self._prompt_enter(evidence, "    Manual checkpoint resume input unavailable; resuming automatically")

        disabled_bps = self._disable_armed_breakpoints(evidence)
        try:
            self.mcp.request_continue_process()
            evidence.log("    Target resumed for resync checkpoint (game RUNNING)")
        except Exception as exc:
            evidence.log(f"    Could not resume target before checkpoint: {exc}")

        print("")
        print(">>> JEU RELANCE. Prepare/maintiens l'etat de combat voulu.")
        print("")

        # --- Step 2: player signals ready; runner realigns and resumes ------
        print("ETAPE 2/2 -> Quand le combat est pret, appuie sur [Entree].")
        print("            (le runner se recale sur un tick puis RELANCE le jeu)")
        self._prompt_enter(evidence, "    Manual checkpoint input unavailable; continuing automatically")

        self._reenable_breakpoints(disabled_bps, evidence)

        state = self.mcp.get_process_state()
        if not bool(state.get("debugger_on", False)):
            raise RuntimeError("debugger not attached after manual checkpoint")
        already_suspended = not self._process_is_running(state)

        temp_addr = step.resolved_address(constants) or self._resolve_field_address(
            step, constants, "sync_address"
        )
        if not temp_addr:
            raise RuntimeError(
                "resync manual_checkpoint requires an 'address' or fields.sync_address"
            )
        temp_label = f"{step.label or '_manual_checkpoint'}__sync"
        self._add_temp_breakpoint(temp_label, temp_addr, evidence)

        reacquired = False
        try:
            if already_suspended:
                stop = self._continue_until_labels([temp_label], wait_timeout, evidence)
            else:
                stop = self._wait_running_until_labels([temp_label], wait_timeout, evidence)
            if stop is None:
                raise RuntimeError(f"resync checkpoint timed out waiting for {temp_label}")
            reacquired = True
            evidence.log(f"    Target reacquired after resync checkpoint on '{stop['label']}'")
        finally:
            self._delete_temp_breakpoint(temp_label, evidence)

        # Hand the game back to free-running so it is not left frozen.
        if reacquired:
            try:
                self.mcp.request_continue_process()
                evidence.log("    Resync complete; target RESUMED (game RUNNING)")
                print(">>> Recale sur le tick. JEU RELANCE pour la suite du scenario.")
            except Exception as exc:
                self._raise_if_debugger_not_running(exc, "could not resume after resync checkpoint")
                evidence.log(f"    Could not resume after resync checkpoint: {exc}")

    def _do_sample_memory(self, step: Step, constants: dict[str, int], evidence: Evidence) -> None:
        label = step.label or "sample_memory"
        regions = list(step.regions)
        if not regions and step.address:
            regions = [{
                "label": label,
                "address": step.address,
                "size": step.size or 4,
                "type": step.type or "bytes",
            }]
        if not regions:
            raise ValueError("sample_memory requires at least one region")

        interval_ms = int(step.interval_ms or step.fields.get("interval_ms", 250) or 250)
        interval_ms = max(interval_ms, 1)
        timeout_ms = int(step.timeout_ms or 0)
        if timeout_ms <= 0:
            raise ValueError("sample_memory requires timeout_ms > 0")
        resume_execution = bool(step.fields.get("resume_execution", False))
        reacquire_timeout = int(
            step.fields.get("reacquire_timeout_ms", max(interval_ms * 4, 5000)) or max(interval_ms * 4, 5000)
        )
        sync_labels = list(step.wait_until)
        sync_addr = self._resolve_field_address(step, constants, "sync_address")

        evidence.log(
            f"    Sampling {len(regions)} region(s) every {interval_ms}ms for {timeout_ms}ms"
        )
        deadline = time.perf_counter() + (timeout_ms / 1000.0)
        sample_index = 0

        while True:
            if sample_index > 0:
                if resume_execution:
                    try:
                        self.mcp.request_continue_process()
                    except Exception as exc:
                        evidence.log(f"    sample/resume request failed: {exc}")
                    time.sleep(interval_ms / 1000.0)
                    state = self.mcp.get_process_state()
                    if self._process_is_running(state):
                        temp_label = ""
                        wait_labels = list(sync_labels)
                        if not wait_labels:
                            if not sync_addr:
                                raise RuntimeError(
                                    "sample_memory with resume_execution=true requires "
                                    "wait_until labels or fields.sync_address to reacquire safely"
                                )
                            temp_label = f"{label}__sample_sync"
                            self._add_temp_breakpoint(temp_label, sync_addr, evidence)
                            wait_labels = [temp_label]
                        try:
                            stop = self._wait_running_until_labels(
                                wait_labels,
                                reacquire_timeout,
                                evidence,
                            )
                            if stop is None:
                                raise RuntimeError(
                                    f"sample_memory timed out waiting for {wait_labels}"
                                )
                        finally:
                            if temp_label:
                                self._delete_temp_breakpoint(temp_label, evidence)
                else:
                    time.sleep(interval_ms / 1000.0)

            values: dict[str, Any] = {}
            for idx, region in enumerate(regions, start=1):
                result = self._read_region_spec(region, constants)
                region_label = str(region.get("label", "") or f"region_{idx}")
                values[region_label] = result

            sample = {
                "index": sample_index + 1,
                "t_ms": self._current_t_ms(),
                "values": values,
            }
            evidence.add_sample(label, sample)
            sample_index += 1

            if time.perf_counter() >= deadline:
                break

        evidence.log(f"    Collected {sample_index} sample(s) into '{label}'")

    def _do_check_breakpoint_hit(self, step: Step, constants: dict[str, int], evidence: Evidence) -> None:
        label = step.label
        was_hit = evidence.breakpoint_hits.get(label, False)
        hit_count = evidence.breakpoint_hit_counts.get(label, 0)
        expected = step.expect.lower() if step.expect else "hit"
        if expected == "hit":
            evidence.log(
                f"    Check BP {label}: hit={was_hit} hits={hit_count} (expected=hit)"
            )
        else:
            evidence.log(
                f"    Check BP {label}: hit={was_hit} hits={hit_count} (expected=not_hit)"
            )

        delete_if_hit = bool(step.fields.get("delete_if_hit", False))
        min_hits = int(step.fields.get("min_hits", 1) or 1)
        if delete_if_hit and was_hit and hit_count >= min_hits:
            if label in self._wp_addrs:
                addr = self._wp_addrs[label][0]
                self.mcp.delete_watchpoint(addr)
                self._wp_addrs.pop(label, None)
                evidence.log(
                    f"    WP deleted (delete_if_hit, hits>={min_hits}): {label} @ {hex(addr)}"
                )
            else:
                addr = self._bp_addrs.get(label)
                if addr is None:
                    addr = step.resolved_address(constants)
                if addr:
                    self.mcp.delete_breakpoint(addr)
                    self._bp_addrs.pop(label, None)
                    evidence.log(
                        f"    BP deleted (delete_if_hit, hits>={min_hits}): {label} @ {hex(addr)}"
                    )

    def _do_read_registers(self, step: Step, constants: dict[str, int], evidence: Evidence) -> None:
        del constants
        regs = self.mcp.get_gpregs()
        evidence.register_dumps[step.label] = self.normalize_regs(regs)
        evidence.log(f"    Registers [{step.label}]: EIP={hex(self.extract_eip(regs) or 0)}")

    def _do_read_stacktrace(self, step: Step, constants: dict[str, int], evidence: Evidence) -> None:
        del constants
        st = self.mcp.stacktrace()
        evidence.stacktraces[step.label] = st
        evidence.log(f"    Stacktrace [{step.label}]: {len(st)} frames")

    def _do_read_global(self, step: Step, constants: dict[str, int], evidence: Evidence) -> None:
        addr = step.resolved_address(constants)
        size = step.size or 1
        raw = self.mcp.read_bytes(addr, size)
        value = self._decode_raw_value(raw, step.type)
        evidence.snapshots[step.label] = value
        evidence.log(f"    Global [{step.label}] @ {hex(addr)} = {value}")

    def _do_read_stack_args(self, step: Step, constants: dict[str, int], evidence: Evidence) -> None:
        del constants
        count = int(step.fields.get("count", step.size or 4) or 4)
        word_size = int(step.fields.get("word_size", 4) or 4)
        if word_size not in (4, 8):
            raise ValueError("read_stack_args only supports word_size 4 or 8")

        sp = self.mcp.get_stack_pointer()
        raw = self.mcp.read_bytes(sp + word_size, count * word_size)
        args: dict[str, int] = {}
        for idx in range(count):
            offset = idx * word_size
            if word_size == 4:
                value = struct.unpack_from("<I", raw, offset)[0]
            else:
                value = struct.unpack_from("<Q", raw, offset)[0]
            args[f"arg{idx + 1}"] = value

        payload = {
            "stack_pointer": hex(sp),
            "word_size": word_size,
            "args": {name: hex(val) for name, val in args.items()},
        }
        evidence.snapshots[step.label] = payload
        evidence.log(f"    Stack args [{step.label}]: {payload['args']}")

    def _do_restore_snapshot(self, step: Step, constants: dict[str, int], evidence: Evidence) -> None:
        """Restore a previously-captured memory snapshot."""
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
            evidence.log(
                f"    Restore: snapshot '{source_label}' is not bytes/hex "
                f"(type={type(saved).__name__}), skipping"
            )
            return

        self.mcp.write_bytes(addr, data)
        evidence.log(
            f"    Restored {len(data)} bytes to {hex(addr)} "
            f"from snapshot '{source_label}'"
        )

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
                    f"breakpoint_was_hit:{step.label}",
                    hit,
                    f"BP '{step.label}' hit={hit}",
                )
                evidence.log(
                    f"    ASSERT breakpoint_was_hit({step.label}): "
                    f"{'PASS' if hit else 'FAIL'}"
                )

            case "breakpoint_not_hit":
                hit = evidence.breakpoint_hits.get(step.label, False)
                passed = not hit
                evidence.add_assertion(
                    f"breakpoint_not_hit:{step.label}",
                    passed,
                    f"BP '{step.label}' hit={hit}",
                )
                evidence.log(
                    f"    ASSERT breakpoint_not_hit({step.label}): "
                    f"{'PASS' if passed else 'FAIL'}"
                )

            case "hit_count_at_least":
                actual = evidence.breakpoint_hit_counts.get(step.label, 0)
                minimum = int(step.min_val or step.fields.get("min_hits", 1) or 1)
                passed = actual >= minimum
                evidence.add_assertion(
                    f"hit_count_at_least:{step.label}",
                    passed,
                    f"actual={actual}, min_hits={minimum}",
                )
                evidence.log(
                    f"    ASSERT hit_count_at_least({step.label}): "
                    f"actual={actual} min_hits={minimum} "
                    f"{'PASS' if passed else 'FAIL'}"
                )

            case "value_equals":
                actual = evidence.snapshots.get(step.label)
                expected = step.fields.get("expected")
                passed = actual == expected
                evidence.add_assertion(
                    f"value_equals:{step.label}",
                    passed,
                    f"actual={actual}, expected={expected}",
                )
                evidence.log(
                    f"    ASSERT value_equals({step.label}): "
                    f"actual={actual} expected={expected} "
                    f"{'PASS' if passed else 'FAIL'}"
                )

            case "value_changed":
                before = evidence.snapshots.get(step.before)
                after = evidence.snapshots.get(step.after)
                passed = before != after
                evidence.add_assertion(
                    f"value_changed:{step.before}->{step.after}",
                    passed,
                    f"before={before}, after={after}",
                )
                evidence.log(
                    f"    ASSERT value_changed({step.before} -> {step.after}): "
                    f"before={before} after={after} "
                    f"{'PASS' if passed else 'FAIL'}"
                )

            case "value_in_range":
                actual = evidence.snapshots.get(step.label)
                lo = step.min_val if step.min_val is not None else 0
                hi = step.max_val if step.max_val is not None else 0xFFFFFFFF
                actual_int = _coerce_int(actual)
                passed = isinstance(actual, (int, str, bool)) and lo <= actual_int <= hi
                evidence.add_assertion(
                    f"value_in_range:{step.label}",
                    passed,
                    f"actual={actual}, range=[{lo}, {hi}]",
                )
                evidence.log(
                    f"    ASSERT value_in_range({step.label}): "
                    f"actual={actual} range=[{lo},{hi}] "
                    f"{'PASS' if passed else 'FAIL'}"
                )

            case "value_not_zero":
                actual = evidence.snapshots.get(step.label, 0)
                actual_int = _coerce_int(actual)
                passed = actual_int != 0 and actual != "00"
                evidence.add_assertion(
                    f"value_not_zero:{step.label}",
                    passed,
                    f"actual={actual}",
                )
                evidence.log(
                    f"    ASSERT value_not_zero({step.label}): "
                    f"actual={actual} {'PASS' if passed else 'FAIL'}"
                )

            case "bits_set":
                actual = self._extract_assert_value(step.label, evidence, step.fields.get("field"))
                mask = _coerce_int(step.fields.get("mask", 0))
                passed = (actual & mask) == mask if mask else False
                evidence.add_assertion(
                    f"bits_set:{step.label}",
                    passed,
                    f"actual={hex(actual)}, mask={hex(mask)}",
                )
                evidence.log(
                    f"    ASSERT bits_set({step.label}): "
                    f"actual={hex(actual)} mask={hex(mask)} "
                    f"{'PASS' if passed else 'FAIL'}"
                )

            case "bits_clear":
                actual = self._extract_assert_value(step.label, evidence, step.fields.get("field"))
                mask = _coerce_int(step.fields.get("mask", 0))
                passed = (actual & mask) == 0 if mask else False
                evidence.add_assertion(
                    f"bits_clear:{step.label}",
                    passed,
                    f"actual={hex(actual)}, mask={hex(mask)}",
                )
                evidence.log(
                    f"    ASSERT bits_clear({step.label}): "
                    f"actual={hex(actual)} mask={hex(mask)} "
                    f"{'PASS' if passed else 'FAIL'}"
                )

            case "value_delta_in_range":
                before = _coerce_int(evidence.snapshots.get(step.before))
                after = _coerce_int(evidence.snapshots.get(step.after))
                delta = after - before
                lo = step.min_val if step.min_val is not None else -0xFFFFFFFF
                hi = step.max_val if step.max_val is not None else 0xFFFFFFFF
                passed = lo <= delta <= hi
                evidence.add_assertion(
                    f"value_delta_in_range:{step.before}->{step.after}",
                    passed,
                    f"before={before}, after={after}, delta={delta}, range=[{lo}, {hi}]",
                )
                evidence.log(
                    f"    ASSERT value_delta_in_range({step.before}->{step.after}): "
                    f"delta={delta} range=[{lo},{hi}] "
                    f"{'PASS' if passed else 'FAIL'}"
                )

            case "any_of":
                self._eval_compound(step, evidence, require_all=False)

            case "all_of":
                self._eval_compound(step, evidence, require_all=True)

            case _:
                evidence.add_assertion(
                    f"unknown_check:{check}",
                    False,
                    f"Unrecognized assertion type: {check}",
                )
                evidence.log(f"    ASSERT unknown check '{check}': FAIL")

    # ==================================================================
    # Public helpers (used by plugins and built-in actions)
    # ==================================================================

    def extract_eip(self, regs: Any) -> int | None:
        """Extract EIP (32-bit) or RIP (64-bit) from a register dump."""
        if isinstance(regs, dict):
            for key in ("eip", "EIP", "rip", "RIP", "pc", "PC"):
                if key in regs:
                    return _coerce_int(regs[key])
            if "registers" in regs:
                return self.extract_eip(regs["registers"])
        if isinstance(regs, list):
            for item in regs:
                if isinstance(item, dict):
                    name = item.get("name", "").lower()
                    if name in ("eip", "rip", "pc"):
                        return _coerce_int(item.get("value", 0))
        return None

    def normalize_regs(self, regs: Any) -> dict[str, Any]:
        """Normalize register data into a flat {name: value} dict."""
        if isinstance(regs, dict):
            if "registers" in regs and isinstance(regs["registers"], list):
                return {
                    r["name"]: r["value"]
                    for r in regs["registers"]
                    if isinstance(r, dict) and "name" in r
                }
            return regs
        if isinstance(regs, list):
            return {
                r["name"]: r["value"]
                for r in regs
                if isinstance(r, dict) and "name" in r
            }
        return {"raw": str(regs)}

    @staticmethod
    def _process_is_running(state: dict[str, Any] | None) -> bool:
        if not isinstance(state, dict):
            return False
        try:
            debugger_on = bool(state.get("debugger_on", False))
            process_state = int(state.get("process_state", -9999))
            dstate_run = int(state.get("DSTATE_RUN", 1))
        except Exception:
            return False
        return debugger_on and process_state == dstate_run

    def _current_process_state(self) -> dict[str, Any]:
        """Read the live debugger/process state, tolerating transient errors."""
        try:
            state = self.mcp.get_process_state()
        except Exception as exc:
            self._raise_if_debugger_not_running(exc, "could not read process state")
            return {}
        return state if isinstance(state, dict) else {}

    @staticmethod
    def _resolve_field_address(
        step: Step,
        constants: dict[str, int],
        field_name: str,
    ) -> int:
        value = step.fields.get(field_name, 0)
        if isinstance(value, int):
            return value
        if isinstance(value, str) and value.strip():
            return resolve_address(value, constants)
        return 0

    def _disable_armed_breakpoints(self, evidence: Evidence) -> list[tuple[str, int]]:
        """Temporarily disable all armed BPs/WPs so the game can run freely."""
        disabled: list[tuple[str, int]] = []
        for label, addr in self._bp_addrs.items():
            try:
                self.mcp.toggle_breakpoint(addr, enabled=False)
                disabled.append((label, addr))
            except Exception as exc:
                evidence.log(f"    Warning: could not disable BP {label} @ {hex(addr)}: {exc}")
        for label, (addr, _size) in self._wp_addrs.items():
            try:
                self.mcp.toggle_breakpoint(addr, enabled=False)
                disabled.append((label, addr))
            except Exception as exc:
                evidence.log(f"    Warning: could not disable WP {label} @ {hex(addr)}: {exc}")
        if disabled:
            names = ", ".join(lbl for lbl, _ in disabled)
            evidence.log(f"    Disabled {len(disabled)} breakpoints for free-play window: {names}")
        return disabled

    def _reenable_breakpoints(
        self, disabled: list[tuple[str, int]], evidence: Evidence
    ) -> None:
        """Re-enable breakpoints that were disabled for the free-play window."""
        for label, addr in disabled:
            try:
                self.mcp.toggle_breakpoint(addr, enabled=True)
            except Exception as exc:
                evidence.log(f"    Warning: could not re-enable {label} @ {hex(addr)}: {exc}")
        if disabled:
            evidence.log(f"    Re-enabled {len(disabled)} breakpoints after free-play window")

    def _add_temp_breakpoint(self, label: str, addr: int, evidence: Evidence) -> None:
        self.mcp.add_breakpoint(addr)
        self._bp_addrs[label] = addr
        evidence.breakpoint_hits[label] = False
        evidence.breakpoint_hit_counts[label] = 0
        evidence.log(f"    Temp BP set: {label} @ {hex(addr)}")

    def _delete_temp_breakpoint(self, label: str, evidence: Evidence) -> None:
        addr = self._bp_addrs.get(label)
        if not addr:
            return
        try:
            self.mcp.delete_breakpoint(addr)
            evidence.log(f"    Temp BP deleted: {label} @ {hex(addr)}")
        finally:
            self._bp_addrs.pop(label, None)

    def match_breakpoint(self, eip: int, evidence: Evidence) -> str | None:
        """Check if EIP matches any active breakpoint (with INT3 off-by-one)."""
        for label, addr in self._bp_addrs.items():
            if eip == addr or eip == addr + 1 or eip == addr - 1:
                self._mark_hit(label, evidence)
                evidence.log(f"    -> BP hit: {label} @ {hex(addr)} (EIP={hex(eip)})")
                return label
        return None

    def match_breakpoint_event(
        self,
        event: dict[str, Any],
        eip: int | None,
        evidence: Evidence,
    ) -> tuple[str, int] | None:
        """Check if the latest debugger event identifies an active breakpoint."""
        if not isinstance(event, dict):
            return None

        bpt = event.get("bpt", {})
        candidates = [
            _coerce_int(bpt.get("ea", 0)),
            _coerce_int(bpt.get("kea", 0)),
            _coerce_int(event.get("ea", 0)),
        ]
        seen: set[int] = set()
        for source_addr in candidates:
            if not source_addr or source_addr in seen:
                continue
            seen.add(source_addr)
            for label, addr in self._bp_addrs.items():
                if source_addr == addr:
                    self._mark_hit(label, evidence)
                    if eip is not None:
                        evidence.log(
                            f"    -> BP hit: {label} @ {hex(addr)} "
                            f"(event_addr={hex(source_addr)}, stop_eip={hex(eip)})"
                        )
                    else:
                        evidence.log(
                            f"    -> BP hit: {label} @ {hex(addr)} "
                            f"(event_addr={hex(source_addr)})"
                        )
                    return label, source_addr
        return None

    def match_watchpoint(self, event: dict[str, Any], eip: int | None, evidence: Evidence) -> tuple[str, int] | None:
        """Check if the latest debugger event matches an active watchpoint."""
        bpt = event.get("bpt", {}) if isinstance(event, dict) else {}
        source_addr = _coerce_int(
            bpt.get("hea", bpt.get("ea", bpt.get("kea", 0)))
        )
        if not source_addr:
            return None
        for label, (addr, _size) in self._wp_addrs.items():
            if source_addr == addr:
                self._mark_hit(label, evidence)
                if eip is not None:
                    evidence.log(
                        f"    -> WP hit: {label} source={hex(source_addr)} "
                        f"(writer_pc={hex(eip)})"
                    )
                else:
                    evidence.log(f"    -> WP hit: {label} source={hex(source_addr)}")
                return label, source_addr
        return None

    # ==================================================================
    # Internal helpers
    # ==================================================================

    def _mark_hit(self, label: str, evidence: Evidence) -> None:
        evidence.breakpoint_hits[label] = True
        evidence.breakpoint_hit_counts[label] = (
            evidence.breakpoint_hit_counts.get(label, 0) + 1
        )
        evidence.last_breakpoint_hit = label

    def _continue_until_labels(
        self,
        wait_labels: list[str],
        timeout_ms: int,
        evidence: Evidence,
    ) -> dict[str, Any] | None:
        """Continue execution until one of *wait_labels* fires or timeout.

        Works whether the target starts suspended (we drive it with
        ``continue_exec``) or already running (we wait for the next suspend
        with ``wait_for_suspend``). ``_detect_stop`` only reports a hit when
        the process is genuinely suspended, so a freshly-resumed game cannot
        falsely satisfy the wait on a stale event.
        """
        deadline = time.perf_counter() + (timeout_ms / 1000.0)

        # Trust an existing stop only when the process is actually suspended.
        if not self._process_is_running(self._current_process_state()):
            initial_stop = self._detect_stop(evidence)
            if initial_stop is not None:
                if initial_stop["label"] in wait_labels:
                    evidence.log(f"    wait_until satisfied by existing stop '{initial_stop['label']}'")
                    return initial_stop
                evidence.log(
                    f"    Existing stop '{initial_stop['label']}' not in wait_until {wait_labels}, resuming..."
                )

        while True:
            remaining_s = deadline - time.perf_counter()
            if remaining_s <= 0:
                return None

            running = self._process_is_running(self._current_process_state())
            try:
                if running:
                    self.mcp.wait_for_suspend(timeout_ms=int(remaining_s * 1000))
                else:
                    self.mcp.continue_exec(timeout=remaining_s)
            except (McpTransportError, McpToolError) as exc:
                self._raise_if_debugger_not_running(exc, "continue_until_labels lost debugger")
                evidence.log(f"    Continue returned with: {exc}")

            stop = self._detect_stop(evidence)
            if stop is None:
                continue
            if stop["label"] in wait_labels:
                evidence.log(f"    wait_until satisfied by '{stop['label']}'")
                return stop
            evidence.log(
                f"    Stop '{stop['label']}' hit but not in wait_until {wait_labels}, resuming..."
            )

    def _wait_running_until_labels(
        self,
        wait_labels: list[str],
        timeout_ms: int,
        evidence: Evidence,
    ) -> dict[str, Any] | None:
        """Wait for a running target to stop on one of *wait_labels*."""
        deadline = time.perf_counter() + (timeout_ms / 1000.0)
        # Poll in short chunks so a long (manual) overall timeout never turns
        # into a single multi-minute transport call.
        chunk_ms = 5000
        while True:
            remaining_ms = int((deadline - time.perf_counter()) * 1000)
            if remaining_ms <= 0:
                return None

            try:
                wait_result = self.mcp.wait_for_suspend(timeout_ms=min(remaining_ms, chunk_ms))
            except (McpTransportError, McpToolError) as exc:
                self._raise_if_debugger_not_running(exc, "wait_running_until_labels lost debugger")
                evidence.log(f"    Wait-for-stop returned with: {exc}")
                continue

            if wait_result.get("event") is None:
                continue

            stop = self._detect_stop(evidence)
            if stop is None:
                try:
                    state = self.mcp.get_process_state()
                except Exception as exc:
                    self._raise_if_debugger_not_running(exc, "could not read process state")
                    evidence.log(f"    Could not read process state after stop: {exc}")
                    state = {}

                if self._process_is_running(state):
                    continue

                evidence.log(
                    f"    Running wait observed a stop without matching label; "
                    f"resuming toward {wait_labels}"
                )
            elif stop["label"] in wait_labels:
                evidence.log(f"    running wait satisfied by '{stop['label']}'")
                return stop
            else:
                evidence.log(
                    f"    Stop '{stop['label']}' hit but not in running wait_until {wait_labels}, resuming..."
                )

            try:
                self.mcp.request_continue_process()
            except Exception as exc:
                self._raise_if_debugger_not_running(exc, "could not resume after unrelated stop")
                evidence.log(f"    Could not resume after unrelated stop: {exc}")
                return None

    def _detect_stop(self, evidence: Evidence) -> dict[str, Any] | None:
        """Inspect the latest stop reason and classify it.

        A stop only exists when the process is actually suspended; if the
        target is still running the last debug event is stale and must not be
        treated as a fresh hit (otherwise a freshly-resumed game would falsely
        "match" the breakpoint it last stopped on).
        """
        if self._process_is_running(self._current_process_state()):
            return None
        try:
            event = self.mcp.get_last_debug_event()
        except Exception as exc:
            self._raise_if_debugger_not_running(exc, "could not read last debug event")
            evidence.log(f"    Could not read last debug event: {exc}")
            event = {}

        try:
            regs = self.mcp.get_gpregs()
        except Exception as exc:
            self._raise_if_debugger_not_running(exc, "could not read registers")
            evidence.log(f"    Could not read registers after continue: {exc}")
            return None

        eip = self.extract_eip(regs)
        bp_event = self.match_breakpoint_event(event, eip, evidence)
        if bp_event is not None:
            label, source_addr = bp_event
            return {
                "label": label,
                "event_type": "breakpoint",
                "eip": eip,
                "source_addr": source_addr,
                "regs": self.normalize_regs(regs),
                "event": event,
            }

        if eip:
            hit_label = self.match_breakpoint(eip, evidence)
            if hit_label:
                return {
                    "label": hit_label,
                    "event_type": "breakpoint",
                    "eip": eip,
                    "source_addr": self._bp_addrs.get(hit_label),
                    "regs": self.normalize_regs(regs),
                }

        watch = self.match_watchpoint(event, eip, evidence)
        if watch is not None:
            label, source_addr = watch
            return {
                "label": label,
                "event_type": "watchpoint",
                "eip": eip,
                "source_addr": source_addr,
                "regs": self.normalize_regs(regs),
                "event": event,
            }

        if eip is not None:
            evidence.log(f"    -> No matching stop label for EIP={hex(eip)}")
        else:
            evidence.log("    -> No matching stop label (unknown EIP)")
        return None

    def _record_trace_stop(
        self,
        stop: dict[str, Any],
        step: Step,
        constants: dict[str, int],
        evidence: Evidence,
        ordinal: int,
    ) -> None:
        """Record one trace stop and its on-hit captures."""
        captures = self._collect_on_hit(step.on_hit, constants)
        evidence.add_hit_event(
            label=stop["label"],
            event_type=stop["event_type"],
            eip=stop.get("eip"),
            source_addr=stop.get("source_addr"),
            captures=captures,
            detail=f"trace hit for {stop['label']}",
            t_ms=self._current_t_ms(),
        )
        evidence.log(
            f"    Trace recorded hit for '{stop['label']}' "
            f"(type={stop['event_type']}, total={ordinal})"
        )

    def _collect_on_hit(self, steps: list[Step], constants: dict[str, int]) -> dict[str, Any]:
        """Execute observational sub-steps and package their results."""
        captures: dict[str, Any] = {}
        for idx, capture_step in enumerate(steps, start=1):
            temp = Evidence(test_id="__capture__", title="capture")
            self._exec_step(capture_step, constants, temp)
            key = capture_step.label or capture_step.action or f"capture_{idx}"
            captures[key] = self._extract_capture_payload(capture_step, temp)
        return captures

    def _extract_capture_payload(self, step: Step, evidence: Evidence) -> Any:
        """Return the most relevant payload from a temporary evidence object."""
        if step.label:
            if step.label in evidence.snapshots:
                return evidence.snapshots[step.label]
            if step.label in evidence.register_dumps:
                return evidence.register_dumps[step.label]
            if step.label in evidence.stacktraces:
                return evidence.stacktraces[step.label]
            if step.label in evidence.samples:
                return evidence.samples[step.label]

        if len(evidence.snapshots) == 1:
            return next(iter(evidence.snapshots.values()))
        if len(evidence.register_dumps) == 1:
            return next(iter(evidence.register_dumps.values()))
        if len(evidence.stacktraces) == 1:
            return next(iter(evidence.stacktraces.values()))
        if len(evidence.samples) == 1:
            return next(iter(evidence.samples.values()))
        return evidence.to_dict()

    def _read_region_spec(self, spec: dict[str, Any], constants: dict[str, int]) -> dict[str, Any]:
        """Read one sampling region specification."""
        addr = spec.get("address", 0)
        if isinstance(addr, str):
            resolved = resolve_address(addr, constants)
        elif isinstance(addr, int):
            resolved = addr
        else:
            resolved = 0
        size = int(spec.get("size", 4) or 4)
        value_type = str(spec.get("type", "bytes") or "bytes")
        raw = self.mcp.read_bytes(resolved, size)
        return {
            "address": hex(resolved),
            "size": size,
            "type": value_type,
            "value": self._decode_raw_value(raw, value_type),
        }

    def _decode_raw_value(self, raw: bytes, value_type: str) -> Any:
        """Decode raw memory according to the requested type."""
        match value_type:
            case "u8":
                return struct.unpack_from("<B", raw)[0]
            case "u16":
                return struct.unpack_from("<H", raw)[0]
            case "u32":
                return struct.unpack_from("<I", raw)[0]
            case "u64":
                return struct.unpack_from("<Q", raw)[0]
            case "i8":
                return struct.unpack_from("<b", raw)[0]
            case "i16":
                return struct.unpack_from("<h", raw)[0]
            case "i32":
                return struct.unpack_from("<i", raw)[0]
            case "i64":
                return struct.unpack_from("<q", raw)[0]
            case _:
                return raw.hex()

    def _extract_assert_value(self, label: str, evidence: Evidence, field_name: Any = None) -> int:
        """Extract a scalar integer for assertion helpers."""
        value = evidence.snapshots.get(label)
        if field_name and isinstance(value, dict):
            value = value.get(str(field_name))
        return _coerce_int(value)

    def _eval_compound(self, step: Step, evidence: Evidence, *, require_all: bool) -> None:
        """Evaluate any_of/all_of compound checks."""
        check_name = "all_of" if require_all else "any_of"
        if not step.checks:
            evidence.add_assertion(
                f"{check_name}:{step.label or 'unnamed'}",
                False,
                "No sub-checks provided in 'checks'",
            )
            evidence.log(
                f"    ASSERT {check_name}({step.label or 'unnamed'}): FAIL (no sub-checks)"
            )
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
                sub_results.append(
                    {
                        "check": f"sub[{idx}]",
                        "passed": False,
                        "detail": "Sub-check produced no assertion result",
                    }
                )

        passed_count = sum(1 for r in sub_results if r.get("passed"))
        total = len(sub_results)
        passed = passed_count == total if require_all else passed_count > 0

        lines = []
        for idx, res in enumerate(sub_results):
            status = "PASS" if res.get("passed") else "FAIL"
            lines.append(
                f"sub[{idx}] {res.get('check', 'unknown')}: {status} -- {res.get('detail', '')}"
            )
        lines.append(
            f"overall: {'PASS' if passed else 'FAIL'} ({passed_count}/{total} passed)"
        )

        label = step.label or "unnamed"
        evidence.add_assertion(
            f"{check_name}:{label}",
            passed,
            "\n".join(lines),
        )
        evidence.log(
            f"    ASSERT {check_name}({label}): "
            f"{'PASS' if passed else 'FAIL'} ({passed_count}/{total} passed)"
        )

    def _current_t_ms(self) -> int:
        """Milliseconds elapsed since the start of the current run."""
        if self._start_time is None:
            return 0
        return int((time.perf_counter() - self._start_time) * 1000)


def _coerce_int(value: Any) -> int:
    """Best-effort conversion to int for assertions and address-like values."""
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, int):
        return value
    if isinstance(value, str):
        text = value.strip()
        if not text:
            return 0
        try:
            return int(text, 16) if text.lower().startswith("0x") else int(text)
        except ValueError:
            return 0
    return 0
