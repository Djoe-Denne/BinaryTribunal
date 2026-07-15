"""
FF8-specific action handlers for the binaryTribunal hypothesis runner.

These actions operate on FF8 battle memory structures (slots, pending
actions, phase flags, action globals) and are registered as a plugin
on the generic :class:`binaryTribunal.runner.HypothesisRunner`.
"""

from __future__ import annotations

from binaryTribunal.evidence import Evidence
from binaryTribunal.hypothesis import Step, resolve_address
from binaryTribunal.mcp_client import McpClient, McpToolError, McpTransportError
from binaryTribunal.runner import HypothesisRunner

from .battle_state import FF8BattleState


def _resolve_int_field(value: object, constants: dict[str, int], default: int = 0) -> int:
    """Resolve a step-field value to an int, honoring named constants.

    Accepts plain ints, hex/decimal strings, or constant-name expressions
    (e.g. ``"CMD_ID"`` or ``"BASE + 4"``) so that matrix-injected per-case
    constants can parametrize injection fields.
    """
    if value is None:
        return default
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, int):
        return value
    if isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            return default
        return resolve_address(stripped, constants)
    return default


def register_ff8_actions(
    runner: HypothesisRunner,
    battle: FF8BattleState,
) -> None:
    """Register all FF8-specific action handlers on *runner*.

    This is the plugin entry point called by the FF8 CLI wrapper to
    extend the generic engine with FF8 battle domain actions.
    """

    # ------------------------------------------------------------------
    # snapshot_slot
    # ------------------------------------------------------------------
    def do_snapshot_slot(
        step: Step, constants: dict[str, int], evidence: Evidence,
    ) -> None:
        slot_id = step.slot
        snapshot = battle.snapshot_slot(slot_id)
        evidence.snapshots[step.label] = snapshot
        evidence.log(
            f"    {step.label}: slot {slot_id} HP={snapshot['current_hp']}")

    runner.register_action("snapshot_slot", do_snapshot_slot)

    # ------------------------------------------------------------------
    # snapshot_all_slots
    # ------------------------------------------------------------------
    def do_snapshot_all_slots(
        step: Step, constants: dict[str, int], evidence: Evidence,
    ) -> None:
        del constants
        snapshot = battle.snapshot_all_slots()
        evidence.snapshots[step.label or "all_slots"] = snapshot
        evidence.log(f"    Snapshot all slots [{step.label or 'all_slots'}]: {len(snapshot)} slot(s)")

    runner.register_action("snapshot_all_slots", do_snapshot_all_slots)

    # ------------------------------------------------------------------
    # write_pending_action
    # ------------------------------------------------------------------
    def do_write_pending_action(
        step: Step, constants: dict[str, int], evidence: Evidence,
    ) -> None:
        f = step.fields
        resolved = {
            "entry_index": step.slot,
            "target_mask": _resolve_int_field(f.get("target_mask"), constants, 0),
            "attacker_slot": _resolve_int_field(f.get("attacker_slot"), constants, 0),
            "command_id": _resolve_int_field(f.get("command_id"), constants, 0),
            "command_arg": _resolve_int_field(f.get("command_arg"), constants, 0),
            "active": _resolve_int_field(f.get("active"), constants, 1),
        }
        battle.write_pending_action(**resolved)
        readback = battle.read_pending_action(step.slot)
        evidence.snapshots[step.label or "injected_pending"] = readback
        evidence.log(
            f"    Injected pending slot {resolved['entry_index']}: "
            f"cmd_id={hex(resolved['command_id'])} arg={hex(resolved['command_arg'])} "
            f"mask={hex(resolved['target_mask'])} attacker={resolved['attacker_slot']} "
            f"-> readback {readback}"
        )

    runner.register_action("write_pending_action", do_write_pending_action)

    # ------------------------------------------------------------------
    # read_pending_action
    # ------------------------------------------------------------------
    def do_read_pending_action(
        step: Step, constants: dict[str, int], evidence: Evidence,
    ) -> None:
        entry = battle.read_pending_action(step.slot)
        evidence.snapshots[step.label] = entry
        evidence.log(f"    Pending action [{step.label}]: {entry}")

    runner.register_action("read_pending_action", do_read_pending_action)

    # ------------------------------------------------------------------
    # read_phase_flags
    # ------------------------------------------------------------------
    def do_read_phase_flags(
        step: Step, constants: dict[str, int], evidence: Evidence,
    ) -> None:
        flags = battle.read_phase_flags()
        evidence.snapshots[step.label] = flags
        evidence.log(f"    Phase flags [{step.label}]: {flags}")

    runner.register_action("read_phase_flags", do_read_phase_flags)

    # ------------------------------------------------------------------
    # read_action_globals
    # ------------------------------------------------------------------
    def do_read_action_globals(
        step: Step, constants: dict[str, int], evidence: Evidence,
    ) -> None:
        globs = battle.read_action_globals()
        evidence.snapshots[step.label] = globs
        evidence.log(f"    Action globals [{step.label}]: {globs}")

    runner.register_action("read_action_globals", do_read_action_globals)

    # ------------------------------------------------------------------
    # read_exec_queue
    # ------------------------------------------------------------------
    def do_read_exec_queue(
        step: Step, constants: dict[str, int], evidence: Evidence,
    ) -> None:
        del constants
        byte_count = int(step.fields.get("byte_count", 12) or 12)
        mask_count = int(step.fields.get("mask_count", 6) or 6)
        queue = battle.read_exec_queue_state(byte_count=byte_count, mask_count=mask_count)
        evidence.snapshots[step.label] = queue
        evidence.log(f"    Exec queue [{step.label}]: bytes={queue['bytes_hex']}")

    runner.register_action("read_exec_queue", do_read_exec_queue)

    # ------------------------------------------------------------------
    # read_result_globals
    # ------------------------------------------------------------------
    def do_read_result_globals(
        step: Step, constants: dict[str, int], evidence: Evidence,
    ) -> None:
        del constants
        result = battle.read_result_globals()
        evidence.snapshots[step.label] = result
        evidence.log(
            f"    Result globals [{step.label}]: "
            f"result={result.get('BATTLE_RESULT_CODE')} end_type={result.get('BATTLE_END_TYPE')}"
        )

    runner.register_action("read_result_globals", do_read_result_globals)

    # ------------------------------------------------------------------
    # read_elemental_globals
    # ------------------------------------------------------------------
    def do_read_elemental_globals(
        step: Step, constants: dict[str, int], evidence: Evidence,
    ) -> None:
        del constants
        result = battle.read_elemental_globals()
        evidence.snapshots[step.label] = result
        evidence.log(f"    Elemental globals [{step.label}]: {result}")

    runner.register_action("read_elemental_globals", do_read_elemental_globals)

    # ------------------------------------------------------------------
    # read_rng_state
    # ------------------------------------------------------------------
    def do_read_rng_state(
        step: Step, constants: dict[str, int], evidence: Evidence,
    ) -> None:
        del constants
        result = battle.read_rng_state()
        evidence.snapshots[step.label] = result
        evidence.log(f"    RNG state [{step.label}]: {result}")

    runner.register_action("read_rng_state", do_read_rng_state)

    # ------------------------------------------------------------------
    # sync_to_battle_tick
    # ------------------------------------------------------------------
    def do_sync_to_battle_tick(
        step: Step, constants: dict[str, int], evidence: Evidence,
    ) -> None:
        """Synchronize to a known battle-tick boundary.

        Handles all three input states:
          - Game running:   the sync BP will fire on the next frame tick
          - Game paused:    continue resumes until the sync BP fires
          - Game at a BP:   continue resumes until the sync BP fires

        Uses the address from the step (default: FUNC_ATB_TICK) as the
        sync point.  After hitting it, the sync BP is removed so it
        doesn't interfere with subsequent execution.
        """
        sync_addr = step.resolved_address(constants)
        if sync_addr == 0:
            sync_addr = battle.FUNC_ATB_TICK
        timeout_ms = step.timeout_ms or 15000
        sync_label = step.label or "_sync_bp"

        evidence.log(f"    Syncing to battle tick @ {hex(sync_addr)} "
                     f"(timeout={timeout_ms}ms)")

        # Arm the sync breakpoint
        runner.mcp.add_breakpoint(sync_addr)
        runner._bp_addrs[sync_label] = sync_addr
        evidence.breakpoint_hits[sync_label] = False
        evidence.breakpoint_hit_counts[sync_label] = 0

        # Continue until the sync BP is actually the stop reason.
        try:
            stop = runner._continue_until_labels([sync_label], timeout_ms, evidence)
            if stop is None:
                evidence.log("    Sync timeout waiting for battle tick")
                raise RuntimeError(
                    f"sync_to_battle_tick timed out waiting for {hex(sync_addr)}"
                )
            eip = stop.get("eip")
            evidence.log(
                f"    Sync landed at EIP={hex(eip) if isinstance(eip, int) else eip}, match=True"
            )
            evidence.breakpoint_hits[sync_label] = True
        except Exception as exc:
            evidence.log(f"    Sync error: {exc}")
            raise

        # Remove the sync BP so it doesn't keep firing
        try:
            runner.mcp.delete_breakpoint(sync_addr)
            runner._bp_addrs.pop(sync_label, None)
            evidence.log(f"    Sync BP removed @ {hex(sync_addr)}")
        except Exception as exc:
            evidence.log(f"    Sync BP cleanup error: {exc}")

    runner.register_action("sync_to_battle_tick", do_sync_to_battle_tick)

    # ------------------------------------------------------------------
    # set_enemy_hp_all_10000
    # ------------------------------------------------------------------
    def do_set_enemy_hp_all_10000(
        step: Step, constants: dict[str, int], evidence: Evidence,
    ) -> None:
        """Force live enemy slots to a high, durable HP pool.

        Writes *both* max HP and current HP (max first so the engine cannot
        clamp current back down). HP fields are u16, so the effective ceiling
        is 0xFFFF (65535) regardless of the requested value -- enough to
        survive a manual attack while a live scenario captures evidence.
        """
        hp = int(step.fields.get("hp", 10000))
        hp = max(0, min(0xFFFF, hp))
        touched: list[int] = []
        skipped: list[int] = []

        for slot_id in battle.iter_enemy_slots():
            if battle.is_enemy_slot_live(slot_id):
                battle.write_max_hp(slot_id, hp)
                battle.write_hp(slot_id, hp)
                touched.append(slot_id)
            else:
                skipped.append(slot_id)

        readback = {
            slot_id: {"hp": battle.read_hp(slot_id), "max_hp": battle.read_max_hp(slot_id)}
            for slot_id in touched
        }
        evidence.snapshots[step.label or "set_enemy_hp_all_10000"] = {
            "hp": hp,
            "touched_slots": touched,
            "skipped_slots": skipped,
            "readback_hp": readback,
        }
        evidence.log(
            f"    Set enemy HP+maxHP={hp} for live slots={touched}; skipped={skipped}"
        )

    runner.register_action("set_enemy_hp_all_10000", do_set_enemy_hp_all_10000)

    # ------------------------------------------------------------------
    # write_slot_status_bits
    # ------------------------------------------------------------------
    def do_write_slot_status_bits(
        step: Step, constants: dict[str, int], evidence: Evidence,
    ) -> None:
        mask = _resolve_int_field(step.fields.get("mask"), constants, 0)
        set_bits = bool(step.fields.get("set", True))
        result = battle.write_status2_bits(step.slot, mask, set_bits=set_bits)
        evidence.snapshots[step.label or "write_slot_status_bits"] = result
        evidence.log(
            f"    Status2 write [{step.label or 'write_slot_status_bits'}]: "
            f"slot={step.slot} mask={hex(mask)} set={set_bits}"
        )

    runner.register_action("write_slot_status_bits", do_write_slot_status_bits)
