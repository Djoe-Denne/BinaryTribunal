"""Interactive battle-camera control-word probe (live debugger via IDA MCP).

Subcommands:
  baseline   - check debugger state, snapshot slots, read camera globals (READ ONLY)
  boost      - set both live enemy slots' HP+maxHP to a high value (WRITE)
  read       - one-shot read of the camera globals + action globals
"""
from __future__ import annotations

import json
import sys
import time

from binaryTribunal.mcp_client import McpClient
from ff8re.battle_state import FF8BattleState

# --- camera control globals (from static analysis) -----------------
CAM_GLOBALS = {
    "dword_1D97704": (0x1D97704, "u32"),          # main cinematic control word
    "battle_update_flags_1D96A9C": (0x1D96A9C, "u32"),
    "word_1D9771E": (0x1D9771E, "u16"),           # blend factor 0..4096
    "word_1D977A0": (0x1D977A0, "u16"),
    "word_1D977A2": (0x1D977A2, "u16"),
    "Battle_Camera_world_XZ_s16": (0x1D981E8, "u32"),  # tentative; resolve by name below
}

# functions of interest
FUNCS = {
    "updateBattleCamera": 0x504060,
    "someUnknownBSCameraOperations": 0x5033E0,
    "BattleTaskQueue_Tick": 0x500CC0,
    "BattleTaskQueue_Dispatch": 0x502380,
    "BattleActionSequence_Tick_GF_Cinematic": 0x50B2A0,
}

RESOLVE_NAMES = [
    "dword_1D97704",
    "cameraRelated_pointerAnimColl",
    "Battle_Camera_world_XZ_s16",
    "Battle_Camera_LookAt_XZ_s16",
    "BattleActionSequence_SelectGenericCameraAnimation",
    "cameraStructPointer",
]


def read_scalar(c: McpClient, addr: int, ty: str) -> int:
    if ty == "u8":
        return c.read_u8(addr)
    if ty == "u16":
        return c.read_u16(addr)
    return c.read_u32(addr)


def read_cam(c: McpClient) -> dict:
    out = {}
    for name, (addr, ty) in CAM_GLOBALS.items():
        try:
            v = read_scalar(c, addr, ty)
            out[name] = hex(v)
        except Exception as exc:
            out[name] = f"<err {exc}>"
    return out


def resolve_all(c: McpClient) -> dict:
    """Resolve names by scanning idautils.Names() (more reliable than get_name_ea_simple here)."""
    code = """
import idautils, json
want = %s
res = {}
for ea, nm in idautils.Names():
    if nm in want:
        res[nm] = hex(ea)
json.dumps(res)
""" % json.dumps(RESOLVE_NAMES)
    raw = c.tool("py_eval", {"code": code}, timeout=120)
    try:
        return json.loads(raw if isinstance(raw, str) else raw.get("result", "{}"))
    except Exception:
        return {"raw": raw}


def eip_from_gpregs(c: McpClient) -> int:
    regs = c.get_gpregs()
    rows = regs if isinstance(regs, list) else regs.get("result", regs)
    if isinstance(rows, list):
        for r in rows:
            nm = str(r.get("name", "")).lower()
            if nm in ("eip", "rip", "pc"):
                v = r.get("value", r.get("val", 0))
                return int(v, 16) if isinstance(v, str) and v.startswith("0x") else int(v)
    if isinstance(rows, dict):
        for k in ("eip", "rip", "pc"):
            if k in rows:
                v = rows[k]
                return int(v, 16) if isinstance(v, str) and v.startswith("0x") else int(v)
    return 0


def func_name_at(c: McpClient, ea: int) -> str:
    code = f"""
import ida_funcs, json
ea = {ea}
fn = ida_funcs.get_func(ea)
nm = ida_funcs.get_func_name(ea) or ""
start = hex(fn.start_ea) if fn else None
json.dumps({{"name": nm, "start": start}})
"""
    raw = c.tool("py_eval", {"code": code}, timeout=60)
    try:
        return json.loads(raw if isinstance(raw, str) else raw.get("result", "{}"))
    except Exception:
        return {"raw": raw}


def cmd_baseline() -> None:
    c = McpClient()
    battle = FF8BattleState(c)
    out: dict = {}
    out["process_state"] = c.get_process_state()
    out["resolved"] = resolve_all(c)
    # slots: party 0..2 + enemies 3..6
    slots = {}
    for sid in list(range(0, 3)) + list(range(3, 7)):
        try:
            s = battle.snapshot_slot(sid)
            slots[sid] = {
                "hp": s["current_hp"], "max_hp": s["max_hp"],
                "status1": s["status1"], "status2": s["status2"],
                "flag_data": s["flag_data"],
            }
        except Exception as exc:
            slots[sid] = f"<err {exc}>"
    out["slots"] = slots
    out["cam_globals_idle"] = read_cam(c)
    print(json.dumps(out, indent=2))


def cmd_read() -> None:
    c = McpClient()
    battle = FF8BattleState(c)
    out = {
        "cam_globals": read_cam(c),
        "action_globals": battle.read_action_globals(),
        "phase_flags": battle.read_phase_flags(),
    }
    print(json.dumps(out, indent=2))


def cmd_boost() -> None:
    c = McpClient()
    battle = FF8BattleState(c)
    hp = int(sys.argv[2]) if len(sys.argv) > 2 else 0xFFFF
    hp = max(0, min(0xFFFF, hp))
    touched, skipped = [], []
    for sid in battle.iter_enemy_slots():
        if battle.is_enemy_slot_live(sid):
            battle.write_max_hp(sid, hp)
            battle.write_hp(sid, hp)
            touched.append(sid)
        else:
            skipped.append(sid)
    readback = {sid: {"hp": battle.read_hp(sid), "max_hp": battle.read_max_hp(sid)} for sid in touched}
    print(json.dumps({"hp": hp, "touched": touched, "skipped": skipped, "readback": readback}, indent=2))


def cmd_prep() -> None:
    """One-shot: resolve camera globals, boost live enemies, print baseline."""
    c = McpClient()
    battle = FF8BattleState(c)
    out: dict = {}
    out["process_state"] = c.get_process_state()
    out["resolved"] = resolve_all(c)
    # boost
    hp = int(sys.argv[2]) if len(sys.argv) > 2 else 0xFFFF
    hp = max(0, min(0xFFFF, hp))
    touched = []
    for sid in battle.iter_enemy_slots():
        if battle.is_enemy_slot_live(sid):
            battle.write_max_hp(sid, hp)
            battle.write_hp(sid, hp)
            touched.append(sid)
    out["boosted"] = touched
    out["enemy_hp"] = {
        sid: {"hp": battle.read_hp(sid), "max_hp": battle.read_max_hp(sid)}
        for sid in battle.iter_enemy_slots()
    }
    out["cam_globals_idle"] = read_cam(c)
    print(json.dumps(out, indent=2))


# Contiguous block covering the key camera words for fast single-read polling
_POLL_BLK = 0x1D97700
_POLL_LEN = 0xA8


_CAM_COORD_BASE = 0xB8B7F0  # Battle_Camera_world_XZ_s16 (+0), LookAt (+8)


def _poll_snapshot(c: McpClient) -> dict:
    blk = c.read_bytes(_POLL_BLK, _POLL_LEN)
    cam = c.read_bytes(_CAM_COORD_BASE, 0x10)
    s16 = lambda b, o: int.from_bytes(b[o:o + 2], "little", signed=True)
    return {
        "ctrl": int.from_bytes(blk[0x04:0x08], "little"),   # 0x1D97704 control word
        "animptr": int.from_bytes(blk[0x18:0x1C], "little"),  # 0x1D97718 cam-script handle
        "w1e": int.from_bytes(blk[0x1E:0x20], "little"),     # 0x1D9771E blend
        "camptr": int.from_bytes(blk[0x98:0x9C], "little"),  # 0x1D97798 cameraStructPointer
        "wa0": int.from_bytes(blk[0xA0:0xA2], "little"),     # 0x1D977A0
        "wa2": int.from_bytes(blk[0xA2:0xA4], "little"),     # 0x1D977A2
        "upd": c.read_u32(0x1D96A9C),                        # battle_update_flags
        "cam": [s16(cam, 0x0), s16(cam, 0x2), s16(cam, 0x8), s16(cam, 0xA)],  # wX,wZ,lookX,lookZ
    }


def cmd_poll() -> None:
    """Poll the camera control words while the game runs; stream every change.

    Usage: poll [duration_s] [reboost] [outfile.jsonl]

    Each detected transition is written *immediately* (flushed) to the JSONL
    output file so the capture survives an early stop and can be tailed live.
    """
    duration = float(sys.argv[2]) if len(sys.argv) > 2 else 14.0
    reboost = len(sys.argv) > 3 and "reboost" in sys.argv[3:]
    outfile = "cam_poll_live.jsonl"
    for a in sys.argv[3:]:
        if a.endswith(".jsonl"):
            outfile = a
    c = McpClient()
    battle = FF8BattleState(c) if reboost else None
    start = time.monotonic()
    last = None
    samples = 0
    transitions = 0
    with open(outfile, "w", encoding="utf-8") as f:
        def emit(rec: dict) -> None:
            f.write(json.dumps(rec) + "\n")
            f.flush()
        emit({"event": "start", "duration_s": duration, "reboost": reboost})
        while time.monotonic() - start < duration:
            t = round(time.monotonic() - start, 3)
            try:
                snap = _poll_snapshot(c)
            except Exception as exc:
                emit({"t": t, "err": str(exc)})
                continue
            samples += 1
            camq = tuple(v >> 4 for v in snap["cam"])  # 16-unit buckets
            key = (snap["ctrl"], snap["animptr"], snap["camptr"],
                   snap["w1e"], snap["wa0"], snap["wa2"], snap["upd"], camq)
            if key != last:
                rec = {
                    "t": t,
                    "ctrl": hex(snap["ctrl"]),
                    "animptr": hex(snap["animptr"]),
                    "camptr": hex(snap["camptr"]),
                    "w1e": snap["w1e"],
                    "wa0": snap["wa0"],
                    "wa2": snap["wa2"],
                    "upd": hex(snap["upd"]),
                    "cam": snap["cam"],
                }
                emit(rec)
                transitions += 1
                last = key
            if reboost and battle is not None and samples % 20 == 0:
                for sid in battle.iter_enemy_slots():
                    if battle.read_max_hp(sid) > 0:
                        battle.write_hp(sid, 0xFFFF)
        emit({"event": "end", "samples": samples, "transitions": transitions,
              "rate_hz": round(samples / duration, 1)})
    print(json.dumps({"outfile": outfile, "samples": samples,
                      "transitions": transitions}, indent=2))


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "baseline"
    {
        "baseline": cmd_baseline,
        "read": cmd_read,
        "boost": cmd_boost,
        "prep": cmd_prep,
        "poll": cmd_poll,
    }[cmd]()
