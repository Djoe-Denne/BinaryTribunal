"""
MCP transport smoke test (Phase 0 validation).

Validates the full MCP debugger API surface by performing:
  1. Read slot[0].current_hp via dbg_read
  2. Write a known value, read it back, restore original
  3. Set breakpoint at BattleATB_TickAndReady (0x4842B0), continue, verify it fires
  4. Read registers at the breakpoint
  5. Read the stacktrace
  6. Delete the breakpoint and continue
"""

from __future__ import annotations

from binaryTribunal.evidence import Evidence
from binaryTribunal.mcp_client import McpClient, McpToolError, McpTransportError

from .battle_state import FF8BattleState


def run_smoke_test(mcp: McpClient, battle: FF8BattleState) -> Evidence:
    """Execute the Phase 0 MCP smoke test, returning evidence."""
    evidence = Evidence(test_id="SMOKE_000", title="MCP Transport Smoke Test")
    evidence.log("=== MCP Smoke Test (Phase 0) ===")

    # ------------------------------------------------------------------
    # Test 1: Read slot[0].current_hp via dbg_read
    # ------------------------------------------------------------------
    evidence.log("--- Test 1: Read slot[0].current_hp ---")
    try:
        hp = battle.read_hp(0)
        evidence.snapshots["slot0_hp"] = hp
        evidence.log(f"  slot[0].current_hp = {hp}")
        evidence.add_assertion(
            "read_slot0_hp", True,
            f"Successfully read HP={hp} from slot[0]")
    except Exception as exc:
        evidence.log(f"  FAILED: {exc}")
        evidence.add_assertion(
            "read_slot0_hp", False, f"Error: {exc}")
        # If we can't even read memory, remaining tests won't work
        return evidence

    # ------------------------------------------------------------------
    # Test 2: Write a known value, read it back, restore original
    # ------------------------------------------------------------------
    evidence.log("--- Test 2: Write/read-back/restore ---")
    try:
        original_hp = hp
        test_value = 9999
        addr = battle.slot_addr(0, battle.OFF_CURRENT_HP)

        # Write test value
        mcp.write_u16(addr, test_value)
        evidence.log(f"  Wrote {test_value} to {hex(addr)}")

        # Read it back
        readback = mcp.read_u16(addr)
        evidence.log(f"  Read back: {readback}")
        write_ok = readback == test_value

        # Restore original
        mcp.write_u16(addr, original_hp)
        restored = mcp.read_u16(addr)
        evidence.log(f"  Restored original: {restored}")
        restore_ok = restored == original_hp

        evidence.add_assertion(
            "write_readback", write_ok,
            f"Wrote {test_value}, read back {readback}")
        evidence.add_assertion(
            "restore_original", restore_ok,
            f"Restored {original_hp}, verified {restored}")
    except Exception as exc:
        evidence.log(f"  FAILED: {exc}")
        evidence.add_assertion("write_readback", False, f"Error: {exc}")

    # ------------------------------------------------------------------
    # Test 3: Set breakpoint, continue, verify it fires
    # ------------------------------------------------------------------
    evidence.log("--- Test 3: Breakpoint at BattleATB_TickAndReady ---")
    bp_addr = battle.FUNC_ATB_TICK  # 0x4842B0
    try:
        mcp.add_breakpoint(bp_addr)
        evidence.log(f"  BP set at {hex(bp_addr)}")

        # Continue execution — should hit the BP quickly since ATB ticks every frame
        evidence.log("  Continuing execution...")
        mcp.continue_exec(timeout=30)
        evidence.log("  Execution suspended.")

        # Read registers to check EIP
        regs = mcp.get_gpregs()
        evidence.register_dumps["at_atb_tick"] = _extract_regs(regs)
        eip = _get_eip(regs)
        evidence.log(f"  EIP after continue: {hex(eip) if eip else 'unknown'}")

        # Check if EIP matches the breakpoint
        bp_hit = False
        if eip is not None:
            bp_hit = eip == bp_addr or eip == bp_addr + 1 or eip == bp_addr - 1
        evidence.breakpoint_hits["bp_atb_tick"] = bp_hit
        evidence.add_assertion(
            "bp_atb_tick_hit", bp_hit,
            f"EIP={hex(eip) if eip else 'None'}, "
            f"expected near {hex(bp_addr)}")
    except Exception as exc:
        evidence.log(f"  FAILED: {exc}")
        evidence.add_assertion("bp_atb_tick_hit", False, f"Error: {exc}")

    # ------------------------------------------------------------------
    # Test 4: Read registers at the breakpoint
    # ------------------------------------------------------------------
    evidence.log("--- Test 4: Read registers ---")
    try:
        regs = mcp.get_regs()
        evidence.register_dumps["full_regs_at_bp"] = _extract_regs(regs)
        evidence.add_assertion(
            "read_registers", True,
            f"Got {len(_extract_regs(regs))} registers")
        evidence.log(f"  Read {len(_extract_regs(regs))} registers")
    except Exception as exc:
        evidence.log(f"  FAILED: {exc}")
        evidence.add_assertion("read_registers", False, f"Error: {exc}")

    # ------------------------------------------------------------------
    # Test 5: Read the stacktrace
    # ------------------------------------------------------------------
    evidence.log("--- Test 5: Read stacktrace ---")
    try:
        st = mcp.stacktrace()
        evidence.stacktraces["at_atb_tick"] = st if isinstance(st, list) else [st]
        frame_count = len(st) if isinstance(st, list) else 1
        evidence.add_assertion(
            "read_stacktrace", frame_count > 0,
            f"Got {frame_count} stack frames")
        evidence.log(f"  Stacktrace: {frame_count} frames")
    except Exception as exc:
        evidence.log(f"  FAILED: {exc}")
        evidence.add_assertion("read_stacktrace", False, f"Error: {exc}")

    # ------------------------------------------------------------------
    # Test 6: Delete breakpoint and continue
    # ------------------------------------------------------------------
    evidence.log("--- Test 6: Delete BP and continue ---")
    try:
        mcp.delete_breakpoint(bp_addr)
        evidence.log(f"  BP deleted at {hex(bp_addr)}")

        # Continue execution so the game isn't left paused
        mcp.continue_exec(timeout=5)
        evidence.log("  Execution continued (game running)")
        evidence.add_assertion(
            "cleanup_continue", True,
            "Breakpoint deleted and execution resumed")
    except Exception as exc:
        evidence.log(f"  FAILED: {exc}")
        evidence.add_assertion("cleanup_continue", False, f"Error: {exc}")

    evidence.log("=== Smoke test complete ===")
    return evidence


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def _extract_regs(regs) -> dict:
    """Normalize register data to a flat dict."""
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


def _get_eip(regs) -> int | None:
    """Extract EIP/RIP from register data."""
    flat = _extract_regs(regs)
    for key in ("eip", "EIP", "rip", "RIP", "pc", "PC"):
        if key in flat:
            val = flat[key]
            if isinstance(val, str):
                return int(val, 16) if val.startswith("0x") else int(val)
            return int(val)
    return None
