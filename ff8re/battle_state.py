"""
FF8 battle domain primitives.

Encodes confirmed reverse-engineering knowledge into reusable memory
read/write operations against a live FF8 process via the MCP debugger.

All addresses and offsets are sourced from:
  - tech/battle_state_reconstruction.md
  - tech/battle_main_loop.md
  - tech/domain_action_resolution_pipeline.md
  - tech/battle_action_resolve.h
"""

from __future__ import annotations

from typing import Any

from binaryTribunal.mcp_client import McpClient


# ======================================================================
# Status bit constants  (from domain_battle_status_access.md)
# ======================================================================

# status_1  (+0x80, u32)
STATUS1_DEATH       = 0x01
STATUS1_POISON      = 0x02
STATUS1_PETRIFY     = 0x04
STATUS1_DARKNESS    = 0x08
STATUS1_SILENCE     = 0x10
STATUS1_BERSERK     = 0x20
STATUS1_ZOMBIE      = 0x40

# status_2  (+0x08, u32)
STATUS2_SLEEP       = 0x01
STATUS2_HASTE       = 0x02
STATUS2_SLOW        = 0x04
STATUS2_STOP        = 0x08
STATUS2_REGEN       = 0x10
STATUS2_PROTECT     = 0x20
STATUS2_SHELL       = 0x40
STATUS2_REFLECT     = 0x80
STATUS2_AURA        = 0x100
STATUS2_DRAIN       = 0x200
STATUS2_HAS_MAGIC   = 0x40000000


# ======================================================================
# Confirmed command_id values for battle_pending_action_entry
# (from breakpoint captures at BattlePendingAction_Write 0x484D20)
# ======================================================================

CMD_ATTACK  = 0x01
CMD_MAGIC   = 0x02
CMD_GF      = 0x03
# CMD_DRAW  = 0x04   # TBD
# CMD_ITEM  = 0x05   # TBD

# ======================================================================
# Confirmed GF kernel IDs (command_arg for CMD_GF)
# These are kernel ability IDs, NOT sequential GF party indices.
# ======================================================================

GF_SHIVA    = 0x41   # 65 decimal, confirmed via runtime action_globals (COMMAND_TYPE_ID=0xFE)
GF_IFRIT    = 0x42   # 66 decimal, confirmed via BP capture

# ======================================================================
# Confirmed GF target masks
# ======================================================================

GF_TARGET_DEFAULT = 0x8008   # Standard GF targeting (confirmed for Ifrit)


class FF8BattleState:
    """Domain primitives for FF8 battle memory manipulation."""

    # ------------------------------------------------------------------
    # Confirmed global addresses
    # ------------------------------------------------------------------

    # Actor slot array: FF8BattleSlotData_s[11], stride 0xD0
    SLOT_BASE           = 0x1D27B10
    SLOT_STRIDE         = 0xD0
    SLOT_COUNT          = 11
    ENEMY_SLOT_START    = 3
    ENEMY_SLOT_END      = 7  # exclusive; enemy slots are typically 3..6

    # Pending action buffer: battle_pending_action_entry[3], stride 0x08
    PENDING_BASE        = 0x1D28D44
    PENDING_STRIDE      = 0x08
    PENDING_COUNT       = 3

    # Execution queue
    EXEC_QUEUE_BYTES    = 0x1D288E8
    EXEC_QUEUE_MASKS    = 0x1D288EE

    # Encounter data
    ENCOUNTER_DATA      = 0x1D287DC   # FF8SceneOut, size 0x80

    # ATB UI mirror
    ATB_UI_MIRROR       = 0x1CFF180

    # ------------------------------------------------------------------
    # Slot field offsets  (FF8BattleSlotData_s, size 0xD0 / 208)
    # ------------------------------------------------------------------

    OFF_STATUS2         = 0x08   # u32
    OFF_MAX_ATB         = 0x10   # u32
    OFF_CUR_ATB         = 0x14   # u32
    OFF_CURRENT_HP      = 0x18   # u16 (or u32 — read as u16 for safety)
    OFF_MAX_HP          = 0x1C   # u16
    OFF_FLAG_DATA       = 0x7C   # u32
    OFF_STATUS1         = 0x80   # u32
    OFF_TARGET_MASK     = 0x84   # u16
    OFF_SPD             = 0xC1   # u8
    OFF_CRISIS_LEVEL    = 0xCA   # u8

    # ------------------------------------------------------------------
    # Transient action-resolution globals (from battle_action_resolve.h)
    # These addresses are symbolic names in IDA; actual addresses need
    # to be resolved at runtime via lookup_funcs or read_global_value.
    # Store them as class attrs once discovered.
    # ------------------------------------------------------------------

    # Key functions
    FUNC_BATTLE_LOOP            = 0x47CCB0
    FUNC_ATB_TICK               = 0x4842B0
    FUNC_PENDING_WRITE          = 0x484D20
    FUNC_PENDING_TRANSFER       = 0x4847F0
    FUNC_ARBITRATION_SELECT     = 0x485460
    FUNC_RESOLVE_SPECIAL        = 0x485160
    FUNC_RESOLVE_AND_APPLY      = 0x48FE20
    FUNC_COMPUTE_DAMAGE         = 0x4922B0
    FUNC_APPLY_DAMAGE_OR_HEAL   = 0x494410
    FUNC_UPDATE_DAMAGE          = 0x48EF80
    FUNC_COMMAND_MENU_MAIN      = 0x4BB9E0
    FUNC_CRISIS_COMPUTE         = 0x4941F0

    def __init__(self, mcp: McpClient) -> None:
        self.mcp = mcp

    # ==================================================================
    # Slot access
    # ==================================================================

    def slot_addr(self, slot_id: int, offset: int = 0) -> int:
        """Return the memory address for *slot_id* + *offset*."""
        if not 0 <= slot_id < self.SLOT_COUNT:
            raise ValueError(f"slot_id {slot_id} out of range [0, {self.SLOT_COUNT})")
        return self.SLOT_BASE + slot_id * self.SLOT_STRIDE + offset

    def read_hp(self, slot_id: int) -> int:
        return self.mcp.read_u16(self.slot_addr(slot_id, self.OFF_CURRENT_HP))

    def write_hp(self, slot_id: int, hp: int) -> None:
        self.mcp.write_u16(self.slot_addr(slot_id, self.OFF_CURRENT_HP), hp)

    def read_max_hp(self, slot_id: int) -> int:
        return self.mcp.read_u16(self.slot_addr(slot_id, self.OFF_MAX_HP))

    def read_status1(self, slot_id: int) -> int:
        return self.mcp.read_u32(self.slot_addr(slot_id, self.OFF_STATUS1))

    def read_status2(self, slot_id: int) -> int:
        return self.mcp.read_u32(self.slot_addr(slot_id, self.OFF_STATUS2))

    def read_atb(self, slot_id: int) -> tuple[int, int]:
        """Return (cur_atb, max_atb)."""
        cur = self.mcp.read_u32(self.slot_addr(slot_id, self.OFF_CUR_ATB))
        max_ = self.mcp.read_u32(self.slot_addr(slot_id, self.OFF_MAX_ATB))
        return cur, max_

    def read_spd(self, slot_id: int) -> int:
        return self.mcp.read_u8(self.slot_addr(slot_id, self.OFF_SPD))

    def read_crisis_level(self, slot_id: int) -> int:
        return self.mcp.read_u8(self.slot_addr(slot_id, self.OFF_CRISIS_LEVEL))

    def read_flag_data(self, slot_id: int) -> int:
        return self.mcp.read_u32(self.slot_addr(slot_id, self.OFF_FLAG_DATA))

    def read_target_mask(self, slot_id: int) -> int:
        return self.mcp.read_u16(self.slot_addr(slot_id, self.OFF_TARGET_MASK))

    def snapshot_slot(self, slot_id: int) -> dict[str, Any]:
        """Full slot snapshot for before/after comparison."""
        base = self.slot_addr(slot_id)
        raw = self.mcp.read_bytes(base, self.SLOT_STRIDE)
        return {
            "slot_id": slot_id,
            "base_addr": hex(base),
            "raw_hex": raw.hex(),
            "current_hp": self.read_hp(slot_id),
            "max_hp": self.read_max_hp(slot_id),
            "status1": hex(self.read_status1(slot_id)),
            "status2": hex(self.read_status2(slot_id)),
            "atb_cur": self.read_atb(slot_id)[0],
            "atb_max": self.read_atb(slot_id)[1],
            "flag_data": hex(self.read_flag_data(slot_id)),
            "target_mask": hex(self.read_target_mask(slot_id)),
            "spd": self.read_spd(slot_id),
            "crisis_level": self.read_crisis_level(slot_id),
        }

    def snapshot_all_slots(self) -> list[dict[str, Any]]:
        """Snapshot every slot in the 11-entry array."""
        return [self.snapshot_slot(i) for i in range(self.SLOT_COUNT)]

    def iter_enemy_slots(self) -> range:
        """Return enemy slot range (default 3..6)."""
        return range(self.ENEMY_SLOT_START, self.ENEMY_SLOT_END)

    def is_enemy_slot_live(self, slot_id: int) -> bool:
        """Heuristic: live if max HP is non-zero and DEATH flag is not set."""
        if slot_id not in self.iter_enemy_slots():
            return False
        if self.read_max_hp(slot_id) == 0:
            return False
        return (self.read_status1(slot_id) & STATUS1_DEATH) == 0

    # ==================================================================
    # Pending action injection
    # ==================================================================

    def pending_addr(self, entry_index: int, offset: int = 0) -> int:
        if not 0 <= entry_index < self.PENDING_COUNT:
            raise ValueError(
                f"entry_index {entry_index} out of range [0, {self.PENDING_COUNT})")
        return self.PENDING_BASE + entry_index * self.PENDING_STRIDE + offset

    def write_pending_action(
        self,
        entry_index: int,
        target_mask: int,
        attacker_slot: int,
        command_id: int,
        command_arg: int,
        active: int = 1,
    ) -> None:
        """Write a pending action entry into the buffer.

        Layout (battle_pending_action_entry, 8 bytes):
          +0x0  u16  target_mask
          +0x2  u8   attacker_slot
          +0x3  u8   command_id
          +0x4  u8   command_arg
          +0x5  u8   padding (0)
          +0x6  u8   padding (0)
          +0x7  u8   active

        Confirmed command_id values:
          0x01 = Attack, 0x02 = Magic, 0x03 = GF

        Confirmed GF command_arg (kernel IDs, NOT sequential):
          0x42 = Ifrit

        NOTE: Uses idc.patch_dbg_byte via py_eval for the active flag
        at +7, because ida_dbg.write_dbg_memory silently fails on that
        specific byte.  The MCP write_bytes path may not work reliably
        for the active flag; if injection fails, fall back to py_eval
        with idc.patch_dbg_byte for all 8 bytes.
        """
        base = self.pending_addr(entry_index)
        self.mcp.write_u16(base + 0, target_mask)
        self.mcp.write_u8(base + 2, attacker_slot)
        self.mcp.write_u8(base + 3, command_id)
        self.mcp.write_u8(base + 4, command_arg)
        self.mcp.write_u8(base + 7, active)

    def read_pending_action(self, entry_index: int) -> dict[str, Any]:
        """Read and decode a pending action entry."""
        base = self.pending_addr(entry_index)
        return {
            "entry_index": entry_index,
            "base_addr": hex(base),
            "target_mask": hex(self.mcp.read_u16(base + 0)),
            "attacker_slot": self.mcp.read_u8(base + 2),
            "command_id": hex(self.mcp.read_u8(base + 3)),
            "command_arg": hex(self.mcp.read_u8(base + 4)),
            "active": self.mcp.read_u8(base + 7),
        }

    def read_all_pending_actions(self) -> list[dict[str, Any]]:
        return [self.read_pending_action(i) for i in range(self.PENDING_COUNT)]

    def snapshot_pending_buffer(self) -> bytes:
        """Raw snapshot of the entire pending action buffer."""
        return self.mcp.read_bytes(
            self.PENDING_BASE, self.PENDING_COUNT * self.PENDING_STRIDE)

    def restore_pending_buffer(self, data: bytes) -> None:
        """Restore a previously-captured pending buffer snapshot."""
        self.mcp.write_bytes(self.PENDING_BASE, data)

    # ==================================================================
    # Execution queue (read-only for observation)
    # ==================================================================

    def read_exec_queue_bytes(self, count: int = 6) -> bytes:
        """Read the first *count* bytes of the execution queue byte array."""
        return self.mcp.read_bytes(self.EXEC_QUEUE_BYTES, count)

    def read_exec_queue_masks(self, count: int = 3) -> list[int]:
        """Read *count* u16 target masks from the execution queue."""
        masks = []
        for i in range(count):
            masks.append(self.mcp.read_u16(self.EXEC_QUEUE_MASKS + i * 2))
        return masks

    # ==================================================================
    # Phase flags (battle loop state machine)
    # ==================================================================

    def read_phase_flags(self) -> dict[str, Any]:
        """Read the battle loop state machine global phase flags.

        These are global variables whose addresses must be resolved
        from the IDB.  We use the IDA MCP ``get_global_value`` tool
        to read them by name.
        """
        names = [
            "mode_StateGlobal",
            "mode3_substep",
            "mode3_subsub_step",
            "mode_3_subsubsubstep",
            "battle_result_byte_mode_3_subsubsubcondition",
        ]
        result: dict[str, Any] = {}
        for name in names:
            try:
                val = self.mcp.tool("get_global_value", {"queries": [name]})
                if isinstance(val, list) and val:
                    row = val[0]
                    result[name] = row.get("value", row)
                else:
                    result[name] = val
            except Exception as exc:
                result[name] = f"<error: {exc}>"
        return result

    # ==================================================================
    # Transient action-resolution globals (read by name)
    # ==================================================================

    def read_action_globals(self) -> dict[str, Any]:
        """Read the transient globals used during action resolution."""
        names = [
            "ATTACKER_SLOT_ID",
            "COMMAND_TYPE_ID",
            "CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID",
            "CURRENT_SLOT_ID_TURN",
        ]
        result: dict[str, Any] = {}
        for name in names:
            try:
                val = self.mcp.tool("get_global_value", {"queries": [name]})
                if isinstance(val, list) and val:
                    row = val[0]
                    result[name] = row.get("value", row)
                else:
                    result[name] = val
            except Exception as exc:
                result[name] = f"<error: {exc}>"
        return result
