#!/usr/bin/env python3
"""Generate and validate the battle-indirect (L2) registry.

The registry classifies every ledger ``call``/``jmp`` site that IDA recorded
without ``CodeRefsFrom`` (493 unique VAs).  Lot-E1 labels IAT/DRAW/HUD/GHOST;
lot-E2 reclassifies the former 263 PENDING_LOT2 sites (0 remaining).

Usage::

    py -3 tools/battle_indirect_registry.py
    py -3 tools/battle_indirect_registry.py --validate docs/tech/investigation/battle-static-discovery/battle-indirect-registry.json

Exit status is non-zero on any CR-B rule violation.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import struct
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


SCHEMA_VERSION = "1.1.0"
EXPECTED_BINARY_NAME = "FF8_EN.exe"
EXPECTED_BINARY_SHA256 = "064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570"
EXPECTED_BINARY_SIZE = 22_124_216
EXPECTED_MACHINE = 0x014C
EXPECTED_IMAGE_BASE = 0x00400000
EXPECTED_SITE_COUNT = 493
EXPECTED_COUNTS = {
    "IAT": 82,
    "DRAW": 116,
    "HUD_DRAW_FILE": 27,
    "LOT2": 263,
    "GHOST": 5,
}
EXPECTED_STACK_HANDLERS = 832
GFX_CTOR_GL = 0x4252B0
GFX_CTOR_DD = 0x425540
GFX_CTOR_ALT = 0x4257D0
GFX_CTOR_ENDS = {
    GFX_CTOR_GL: 0x425531,
    GFX_CTOR_DD: 0x4257C1,
    GFX_CTOR_ALT: 0x425A86,
}
FORBIDDEN_CTOR_STORES = {0x42537C, 0x42560C, 0x4258EF}
TEXT_VA_MIN = 0x401000
TEXT_VA_MAX = 0xB69000
MAGIC_LIST_LOGIC = 0xC81774
MAGIC_GET_ID_LOAD = 0x50AF20
MENU_SPRITE_TABLE = 0x1D2B550
MENU_SPRITE_DRAW = 0x4A0C00
MENU_SPRITE_DRAW2 = 0x4A09A0
MENU_SPRITE_INIT = 0x4A0880
MENU_SPRITE_WRITER = 0x4B6210
ACTION_TABLE_BASE = 0x1D28C44
ACTION_TABLE_REGISTRAR = 0x482C90
ACTION_TABLE_WRITERS = (0x47E030, 0x48ACD0, 0x48AC60, 0x48AC90, 0x48E620)
CARDGAME_TABLE = 0xB964D8
OT_SOFTWARE = 0xB7DC18
OT_DIRTY = 0xB7D708
OT_OPAQUE = 0xB7CF08
OT_SEMI = 0xB7D308
RELAY71_FPS = (0x48AD10, 0x487670, 0x4876B0, 0)
STACK_SWITCH_EXTRA_EDX = (0x7AF402, 0x7BCF8A)
STACK_SWITCH_EXTRA_ECX = (
    0x7DC3F7,
    0x84D287,
    0x8BE9B7,
    0x8BF687,
    0x7DE592,
    0x84FB42,
    0x851022,
    0x763F46,
)

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PE = Path(
    r"C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII\FF8_EN.exe"
)
DEFAULT_LEDGER = (
    REPO_ROOT
    / "docs"
    / "tech"
    / "investigation"
    / "battle-static-discovery"
    / "battle-graph-ledger.json"
)
DEFAULT_OUTPUT = (
    REPO_ROOT
    / "docs"
    / "tech"
    / "investigation"
    / "battle-static-discovery"
    / "battle-indirect-registry.json"
)

DRAW_TABLE_VA_MIN = 0x1850000
DRAW_TABLE_VA_MAX = 0x1880000
IAT_SLOT_VA_MIN = 0xB69000
IAT_SLOT_VA_MAX = 0xB69400
ACTION_BSS_PTRS = {0x21DFEC0, 0x21DFEC4}
HUD_BSS_SLOTS = {0x1D768D0, 0x1D768D4, 0x1D768D8}
FILE_CALLBACK_TABLE = 0x1D29638

GHOST_SITES = {
    0x40AA24: "rdtsc",
    0x48D56E: "and_edi_0xff",
    0x47ED0F: "mov_eax",
    0x403D99: "prologue_push_ebp",
    0x45B2E0: "prologue_push_esi",
}

C_SITE_FAMILY = {
    0x4FDE79: "hud_bss_1D768D0",
    0x4FE28E: "hud_bss_1D768D0",
    0x4FE3DF: "hud_bss_1D768D0",
    0x4FE5C1: "hud_bss_1D768D0",
    0x4FE6E3: "hud_bss_1D768D0",
    0x4FE878: "hud_bss_1D768D0",
    0x4FEBE1: "hud_bss_1D768D0",
    0x4FED3C: "hud_bss_1D768D0",
    0x4FE891: "hud_bss_1D768D8",
    0x4C7D6A: "hud_bss_1D768D4",
    0x4C7DDF: "hud_bss_1D768D4",
    0x4C7E54: "hud_bss_1D768D4",
    0x4B9F6C: "hud_widget_callback",
    0x4B9FBE: "hud_widget_callback",
    0x4B9D3A: "hud_widget_callback",
    0x4BA04A: "hud_widget_callback",
    0x4FF130: "hud_widget_callback",
    0x417963: "drawlist_walk",
    0x41797B: "drawlist_walk",
    0x508434: "bdlink_pump",
    0x539164: "bdlink_pump",
    0x681282: "bdlink_pump",
    0x6B1D72: "bdlink_pump",
    0x6D2EF2: "bdlink_pump",
    0x46427D: "tpage_init",
    0x4825C8: "file_callback",
    0x4828A2: "file_callback",
}

ACTION_SEQ_SITES = {
    0x50AC1F,
    0x50B165,
    0x50B229,
    0x50BEAB,
    0x50BF60,
    0x50BCA3,
    0x50B4B9,
    0x50B9A1,
}
RELAY71_SITES = {0x502F78}
SWIRL_SITES = {0x56D3E1, 0x56D433, 0x56D448, 0x56D49B, 0x56D4A6, 0x56D510}
SWIRL_LOCK_SITES = {0x56D3E1, 0x56D433}
VM_SITES = {0x50DB70, 0x50DBF5, 0x50DCD1}
OT_SITES = {0x45D192, 0x45D1C9, 0x45D1E2, 0x45D1FB, 0x45D464}
ACTION_TABLE_SITES = {0x482D70, 0x482D9B}
MENU_SPRITE_SITES = {0x4B712D, 0x4B6FF2}
CARDGAME_SITES = {0x5345BA}
SOUND_VTABLE_SITES = {0x46E12B}
TYPE2_FACTORY_SITES = {0x40951D}
FILE_ARCHIVE_SITES = {0x4AC191}
MENU_LIST_SITES = {0x4BE47E, 0x4BE529}
SINGLE_SOURCE_SITES = {0x46427D, 0x502F78}

GFX_DRIVER_SITES = {
    0x409572,
    0x41DF02,
    0x41DF32,
    0x41DFE0,
    0x41DFB0,
    0x41E106,
    0x41E1A5,
    0x41E333,
    0x41E58B,
    0x41E646,
    0x419ED8,
    0x419D3E,
    0x419D7F,
    0x41B188,
    0x417E39,
    0x41E9FC,
    0x418815,
    0x41E67E,
    0x41E770,
    0x41E9B7,
    0x41DED4,
    0x41E965,
    0x41E990,
}
COM_DDRAW_SITES = {
    0x40B53F,
    0x40B565,
    0x40B608,
    0x40B62B,
    0x40B659,
    0x40B682,
    0x40B6FD,
    0x465545,
    0x46559F,
    0x4655C6,
    0x46567B,
    0x46582A,
    0x46587E,
    0x4658AC,
    0x465903,
    0x40E214,
    0x4103A1,
    0x4103EC,
    0x4202FC,
    0x42054F,
    0x420582,
    0x4205F6,
    0x42082A,
    0x4362C5,
    0x43631A,
    0x56D1B8,
    0x4203DA,
    0x420793,
    0x431B52,
    0x4324B8,
}
COM_DINPUT_SITES = {
    0x468B20,
    0x468B73,
    0x468BB3,
    0x468D40,
    0x468D96,
    0x468DD9,
    0x46928D,
    0x4692D8,
    0x4692FA,
    0x469309,
    0x46933C,
    0x46A64B,
    0x46A66E,
    0x46A6E9,
    0x46A701,
    0x46D56C,
}
COM_DSOUND_SITES = {
    0x46DE28,
    0x46DEDF,
    0x46DF32,
    0x46DF01,
    0x46E037,
    0x46E309,
    0x46DF79,
    0x46E2C9,
    0x46DFAA,
    0x46DFE3,
    0x46E015,
    0x46E065,
    0x46E0AA,
    0x46E36F,
    0x46E0E6,
    0x46E15A,
    0x46E286,
    0x46E33F,
    0x46E3D5,
    0x46DE65,
    0x46DE95,
    0x46EAE3,
}
COM_DMUSIC_SITES = {
    0x46F231,
    0x46F270,
    0x46F298,
    0x46F2DA,
    0x46F346,
    0x46F364,
    0x46F38A,
    0x46F3AF,
    0x46F3D9,
    0x46F4A7,
    0x46F51A,
    0x46F552,
    0x46F622,
    0x46F689,
    0x46F73B,
    0x46F782,
    0x46FA2D,
    0x46FB05,
    0x46FB33,
    0x46FC9D,
    0x46FCEF,
    0x46FD0D,
    0x46FD32,
    0x46F3E8,
    0x46F4DB,
}
ARG_CALLBACK_SITES = {
    0x4246DE,
    0x424E25,
    0x425FB3,
    0x56F114,
    0x56F33E,
    0x5D99CE,
    0x701D96,
    0x4289F2,
}
OBJ_FIELD_SITES = {
    0x408345,
    0x40E35C,
    0x43C9BE,
    0x425B21,
    0x425D96,
    0x425E1C,
    0x500A41,
}
IAT_VIA_REG_SITES = {
    0x46AD33,
    0x46ADA8,
    0x46AE57,
    0x46D365,
    0x56D1A8,
    0x56D1BB,
    0x46961B,
    0x469622,
    0x46E60E,
    0x46E675,
    0x559A1A,
    0x559A36,
    0x46D383,
    0x52CE75,
    0x52CF70,
    0x55CA8B,
    0x55CABB,
}

E2_FAMILY_SETS = {
    "action_seq": ACTION_SEQ_SITES,
    "relay71": RELAY71_SITES,
    "swirl_vtable": SWIRL_SITES,
    "script_vm": VM_SITES,
    "ot_gpu": OT_SITES,
    "action_table_1D28C44": ACTION_TABLE_SITES,
    "menu_sprite_table_1D2B550": MENU_SPRITE_SITES,
    "cardgame": CARDGAME_SITES,
    "sound_vtable": SOUND_VTABLE_SITES,
    "gfx_driver": GFX_DRIVER_SITES,
    "type2_factory": TYPE2_FACTORY_SITES,
    "com_ddraw": COM_DDRAW_SITES,
    "com_dinput": COM_DINPUT_SITES,
    "com_dsound": COM_DSOUND_SITES,
    "com_dmusic": COM_DMUSIC_SITES,
    "arg_callback": ARG_CALLBACK_SITES,
    "obj_field_fp": OBJ_FIELD_SITES,
    "iat_via_reg": IAT_VIA_REG_SITES,
    "file_archive_callback": FILE_ARCHIVE_SITES,
    "menu_list_callback": MENU_LIST_SITES,
}
E2_FAMILY_BY_VA = {
    va: family for family, vas in E2_FAMILY_SETS.items() for va in vas
}
EXPECTED_E2_FAMILY_COUNTS = {
    "stack_switch": 82,
    "action_seq": 8,
    "relay71": 1,
    "script_vm": 3,
    "ot_gpu": 5,
    "swirl_vtable": 6,
    "action_table_1D28C44": 2,
    "cardgame": 1,
    "sound_vtable": 1,
    "gfx_driver": 23,
    "type2_factory": 1,
    "arg_callback": 8,
    "obj_field_fp": 7,
    "com_ddraw": 30,
    "com_dinput": 16,
    "com_dsound": 22,
    "com_dmusic": 25,
    "iat_via_reg": 17,
    "file_archive_callback": 1,
    "menu_sprite_table_1D2B550": 2,
    "menu_list_callback": 2,
}
EXPECTED_E2_CLOSURE_COUNTS = {
    "closed_static": 35,
    "open_static_bounded": 127,
    "runtime_com": 100,
    "runtime_only": 1,
}
FORBIDDEN_OLD_FAMILIES = {
    "driver_vtable",
    "obj_plus8",
    "hud_table_1D2B550",
    "misaligned_imm_46E12B",
    "driver_slot_9c_a0",
    "reg_eax",
    "reg_ebx",
    "reg_ebp",
    "reg_esi",
    "reg_edi",
}
OT_TABLES_BY_SITE = {
    0x45D192: ((OT_SOFTWARE, "g_SoftwarePrimDispatch"),),
    0x45D1C9: ((OT_DIRTY, "g_TexturePageDirtyDispatch"),),
    0x45D1E2: ((OT_SOFTWARE, "g_SoftwarePrimDispatch"),),
    0x45D1FB: (
        (OT_DIRTY, "g_TexturePageDirtyDispatch"),
        (OT_SOFTWARE, "g_SoftwarePrimDispatch"),
    ),
    0x45D464: (
        (OT_OPAQUE, "g_GpuPrimDispatchOpaque"),
        (OT_SEMI, "g_GpuPrimDispatchSemiTransparent"),
    ),
}
CARDGAME_SLOTS = {
    1: 0x536C30,
    2: 0x534340,
    3: 0x535C90,
    4: 0x534BC0,
    5: 0x534BB0,
}
IAT_REG_MOV = {
    0xD3: b"\x8b\x1d",
    0xD5: b"\x8b\x2d",
    0xD6: b"\x8b\x35",
    0xD7: b"\x8b\x3d",
}

DRAW_TABLE_NAMES = {
    0x18528F4: "dword_18528F4_MAG331_DRAW",
    0x187281C: "g_GF_AlexanderDrawOpcodeTable",
    0x186C170: "dword_186C170_Meteor_DRAW",
}

EAX_ECX_DRAW_TABLES = {0x18570A0, 0x1874D6C, 0x1876B90, 0x18776C0}

EXPECTED_IAT_IMPORT_COUNTS = {
    "LeaveCriticalSection": 23,
    "EnterCriticalSection": 19,
    "OutputDebugStringA": 10,
    "Sleep": 4,
    "InterlockedExchange": 2,
    "timeGetTime": 2,
    "timeSetEvent": 2,
}

REG_FAMILIES = {
    0xD0: "reg_eax",
    0xD1: "reg_ecx",
    0xD2: "reg_edx",
    0xD3: "reg_ebx",
    0xD5: "reg_ebp",
    0xD6: "reg_esi",
    0xD7: "reg_edi",
}


class RegistryError(RuntimeError):
    """A generate/validate invariant failed."""


def hex_addr(value: int | None) -> str | None:
    if value is None:
        return None
    if value < 0:
        return f"-0x{-value:X}"
    return f"0x{value:X}"


def parse_addr(value: object) -> int:
    if isinstance(value, int) and not isinstance(value, bool):
        return value
    if isinstance(value, str):
        text = value.strip()
        negative = text.startswith("-")
        if negative:
            text = text[1:]
        number = int(text, 0)
        return -number if negative else number
    raise RegistryError(f"expected address, got {value!r}")


def is_code_ptr(va: int) -> bool:
    return TEXT_VA_MIN <= va < TEXT_VA_MAX


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RegistryError(message)


class PE32:
    def __init__(self, data: bytes):
        self.data = data
        self.sha256 = sha256_bytes(data)
        require(self.sha256 == EXPECTED_BINARY_SHA256, "unexpected PE SHA-256")
        require(len(data) == EXPECTED_BINARY_SIZE, "unexpected PE size")
        require(data[:2] == b"MZ", "not an MZ executable")
        pe = struct.unpack_from("<I", data, 0x3C)[0]
        require(data[pe : pe + 4] == b"PE\0\0", "invalid PE signature")
        machine, section_count = struct.unpack_from("<HH", data, pe + 4)
        require(machine == EXPECTED_MACHINE, "expected i386 PE")
        optional_size = struct.unpack_from("<H", data, pe + 20)[0]
        optional = pe + 24
        require(struct.unpack_from("<H", data, optional)[0] == 0x10B, "expected PE32")
        self.base = struct.unpack_from("<I", data, optional + 28)[0]
        require(self.base == EXPECTED_IMAGE_BASE, "unexpected image base")
        self.sections: list[tuple[str, int, int, int, int]] = []
        for index in range(section_count):
            offset = optional + optional_size + index * 40
            name = data[offset : offset + 8].split(b"\x00", 1)[0].decode("ascii", "replace")
            vsize, rva, raw_size, raw_ptr = struct.unpack_from("<IIII", data, offset + 8)
            self.sections.append((name, rva, vsize, raw_ptr, raw_size))
        self.import_rva, self.import_size = struct.unpack_from("<II", data, optional + 104)
        self.iat_names = self._parse_iat()

    def va_to_offset(self, va: int) -> int | None:
        rva = va - self.base
        matches = []
        for _name, rva0, vsize, raw_ptr, raw_size in self.sections:
            span = max(vsize, raw_size)
            if rva0 <= rva < rva0 + span:
                offset = raw_ptr + (rva - rva0)
                if 0 <= offset < len(self.data):
                    matches.append(offset)
        if len(matches) != 1:
            return None
        return matches[0]

    def read(self, va: int, size: int) -> bytes:
        offset = self.va_to_offset(va)
        require(offset is not None, f"VA not file-backed: {hex_addr(va)}")
        result = self.data[offset : offset + size]
        require(len(result) == size, f"truncated read at {hex_addr(va)}")
        return result

    def try_read(self, va: int, size: int) -> bytes | None:
        offset = self.va_to_offset(va)
        if offset is None:
            return None
        result = self.data[offset : offset + size]
        return result if len(result) == size else None

    def in_image(self, va: int, size: int = 1) -> bool:
        return self.try_read(va, size) is not None

    def _parse_iat(self) -> dict[int, str]:
        desc_off = self.va_to_offset(self.base + self.import_rva)
        require(desc_off is not None, "import directory not file-backed")
        names: dict[int, str] = {}
        offset = desc_off
        while True:
            ilt, _stamp, _chain, name_rva, iat_rva = struct.unpack_from("<IIIII", self.data, offset)
            if ilt == 0 and name_rva == 0 and iat_rva == 0:
                break
            name_off = self.va_to_offset(self.base + name_rva) if name_rva else None
            if name_off is None:
                offset += 20
                continue
            dll = self.data[name_off:].split(b"\x00", 1)[0].decode("ascii", "replace")
            thunk_rva = ilt or iat_rva
            iat_cur = iat_rva
            while True:
                thunk_off = self.va_to_offset(self.base + thunk_rva)
                iat_off = self.va_to_offset(self.base + iat_cur)
                if thunk_off is None or iat_off is None:
                    break
                thunk = struct.unpack_from("<I", self.data, thunk_off)[0]
                if thunk == 0:
                    break
                slot_va = self.base + iat_cur
                if IAT_SLOT_VA_MIN <= slot_va < IAT_SLOT_VA_MAX:
                    if thunk & 0x80000000:
                        import_name = f"ord_{thunk & 0xFFFF}"
                    else:
                        hint_off = self.va_to_offset(self.base + thunk + 2)
                        import_name = (
                            self.data[hint_off:].split(b"\x00", 1)[0].decode("ascii", "replace")
                            if hint_off is not None
                            else "?"
                        )
                    names[slot_va] = f"{dll}!{import_name}"
                thunk_rva += 4
                iat_cur += 4
            offset += 20
        require(len(names) >= 76, f"too few IAT slots parsed: {len(names)}")
        return names


def decode_ff(data: bytes) -> dict[str, Any] | None:
    if not data or data[0] != 0xFF:
        return None
    modrm = data[1]
    mod = (modrm >> 6) & 3
    reg = (modrm >> 3) & 7
    rm = modrm & 7
    if reg not in (2, 4):
        return None
    opcode = "call" if reg == 2 else "jmp"
    index = 2
    sib = None
    disp = None
    disp_size = 0
    form = "reg" if mod == 3 else "base_disp"
    if mod != 3 and rm == 4:
        if len(data) < 3:
            return None
        sib = data[2]
        index = 3
        scale = 1 << ((sib >> 6) & 3)
        index_reg = (sib >> 3) & 7
        base_reg = sib & 7
        if index_reg == 4:
            form = "esp_disp" if base_reg == 4 else "base_disp"
            scale = None
            index_reg = None
        else:
            form = f"sib_scale{scale}"
        if mod == 0 and base_reg == 5:
            disp_size = 4
        elif mod == 1:
            disp_size = 1
        elif mod == 2:
            disp_size = 4
        if disp_size:
            if len(data) < index + disp_size:
                return None
            disp = (
                struct.unpack_from("<I", data, index)[0]
                if disp_size == 4
                else struct.unpack_from("<b", data, index)[0]
            )
        encoding_len = index + disp_size
        return {
            "opcode": opcode,
            "form": form,
            "modrm": modrm,
            "sib": sib,
            "scale": scale,
            "index_reg": index_reg,
            "base_reg": base_reg,
            "disp": disp,
            "length": encoding_len,
            "bytes": data[:encoding_len],
        }
    if mod == 0 and rm == 5:
        disp_size = 4
        form = "abs"
    elif mod == 1:
        disp_size = 1
    elif mod == 2:
        disp_size = 4
    if disp_size:
        if len(data) < index + disp_size:
            return None
        if form == "abs" or disp_size == 4:
            disp = struct.unpack_from("<I", data, index)[0]
        else:
            disp = struct.unpack_from("<b", data, index)[0]
    encoding_len = index + disp_size
    return {
        "opcode": opcode,
        "form": form,
        "modrm": modrm,
        "sib": None,
        "scale": None,
        "index_reg": None,
        "base_reg": rm if mod != 3 else rm,
        "disp": disp,
        "length": encoding_len,
        "bytes": data[:encoding_len],
    }


def is_indirect_ff(data: bytes) -> bool:
    return decode_ff(data) is not None


def load_ledger_sites(ledger: dict[str, Any]) -> list[dict[str, Any]]:
    nodes = {node["va"]: node for node in ledger["nodes"]}
    rows: list[dict[str, Any]] = []
    seen: set[int] = set()
    for opcode, key in (("call", "indirect_call_sites"), ("jmp", "indirect_jump_sites")):
        for site in ledger[key]:
            va = parse_addr(site["site_va"])
            require(va not in seen, f"duplicate ledger site {hex_addr(va)}")
            seen.add(va)
            parent_va = site.get("function_va")
            node = nodes.get(parent_va, {})
            rows.append(
                {
                    "site_va": va,
                    "opcode": opcode,
                    "ledger_class": site.get("class"),
                    "operand": site.get("operand"),
                    "parent_va": parse_addr(parent_va) if parent_va else None,
                    "parent_name": node.get("name"),
                    "parent_status": node.get("status"),
                }
            )
    require(len(rows) == EXPECTED_SITE_COUNT, f"ledger site count {len(rows)} != {EXPECTED_SITE_COUNT}")
    return rows


LOT2_CLOSURES = {
    "action_seq": "closed_static",
    "script_vm": "closed_static",
    "ot_gpu": "closed_static",
    "iat_via_reg": "closed_static",
    "menu_sprite_table_1D2B550": "closed_static",
    "stack_switch": "open_static_bounded",
    "relay71": "open_static_bounded",
    "action_table_1D28C44": "open_static_bounded",
    "cardgame": "open_static_bounded",
    "gfx_driver": "open_static_bounded",
    "arg_callback": "open_static_bounded",
    "obj_field_fp": "open_static_bounded",
    "file_archive_callback": "open_static_bounded",
    "menu_list_callback": "open_static_bounded",
    "swirl_vtable": "runtime_com",
    "sound_vtable": "runtime_com",
    "com_ddraw": "runtime_com",
    "com_dinput": "runtime_com",
    "com_dsound": "runtime_com",
    "com_dmusic": "runtime_com",
    "type2_factory": "runtime_only",
}


def extract_stack_handlers(pe: PE32, parent_va: int | None, site_va: int) -> list[int]:
    if parent_va is None or site_va <= parent_va:
        return []
    blob = pe.try_read(parent_va, site_va - parent_va)
    if not blob:
        return []
    slots: dict[int, int] = {}
    i = 0
    while i + 7 <= len(blob):
        if blob[i] == 0xC7 and blob[i + 1] == 0x44 and blob[i + 2] == 0x24:
            imm = struct.unpack_from("<I", blob, i + 4)[0]
            if is_code_ptr(imm):
                slots[blob[i + 3]] = imm
            i += 8
            continue
        if blob[i] == 0xC7 and blob[i + 1] == 0x04 and blob[i + 2] == 0x24:
            imm = struct.unpack_from("<I", blob, i + 3)[0]
            if is_code_ptr(imm):
                slots[0] = imm
            i += 7
            continue
        if blob[i] == 0xB8:
            imm = struct.unpack_from("<I", blob, i + 1)[0]
            if is_code_ptr(imm):
                window = blob[i + 5 : i + 17]
                if len(window) >= 3 and window[0] == 0x89 and window[1] == 0x04 and window[2] == 0x24:
                    slots[0] = imm
                elif len(window) >= 4 and window[0] == 0x89 and window[1] == 0x44 and window[2] == 0x24:
                    slots[window[3]] = imm
            i += 1
            continue
        i += 1
    return [slots[key] for key in sorted(slots)]


def extract_ctor_slots(pe: PE32, ctor: int, end: int) -> dict[int, int]:
    blob = pe.try_read(ctor, end - ctor)
    require(blob is not None, f"ctor not file-backed {hex_addr(ctor)}")
    slots: dict[int, int] = {}
    i = 0
    while i + 6 <= len(blob):
        if blob[i] == 0xC7 and blob[i + 1] == 0x00:
            imm = struct.unpack_from("<I", blob, i + 2)[0]
            if is_code_ptr(imm):
                slots[0] = imm
            i += 6
            continue
        if blob[i] == 0xC7 and blob[i + 1] in (0x40, 0x41, 0x42, 0x43, 0x46, 0x47):
            disp = blob[i + 2]
            imm = struct.unpack_from("<I", blob, i + 3)[0]
            if is_code_ptr(imm) and disp < 0x108:
                slots[disp] = imm
            i += 7
            continue
        if blob[i] == 0xC7 and blob[i + 1] in (0x80, 0x81, 0x82, 0x83, 0x86, 0x87):
            disp = struct.unpack_from("<I", blob, i + 2)[0]
            imm = struct.unpack_from("<I", blob, i + 6)[0]
            if is_code_ptr(imm) and disp < 0x108:
                slots[disp] = imm
            i += 10
            continue
        i += 1
    return slots


def attach_e2_maps(pe: PE32) -> None:
    pe.gfx_ctors = {
        "GL": extract_ctor_slots(pe, GFX_CTOR_GL, GFX_CTOR_ENDS[GFX_CTOR_GL]),
        "DD": extract_ctor_slots(pe, GFX_CTOR_DD, GFX_CTOR_ENDS[GFX_CTOR_DD]),
        "Alt": extract_ctor_slots(pe, GFX_CTOR_ALT, GFX_CTOR_ENDS[GFX_CTOR_ALT]),
    }
    require(len(pe.gfx_ctors["GL"]) == 52, f"GL ctor FP {len(pe.gfx_ctors['GL'])} != 52")
    require(len(pe.gfx_ctors["DD"]) == 52, f"DD ctor FP {len(pe.gfx_ctors['DD'])} != 52")
    require(len(pe.gfx_ctors["Alt"]) == 57, f"Alt ctor FP {len(pe.gfx_ctors['Alt'])} != 57")
    require(0x54 not in pe.gfx_ctors["GL"] and 0x60 not in pe.gfx_ctors["GL"], "GL wrote Alt-only slots")
    require(0x54 in pe.gfx_ctors["Alt"] and 0x60 in pe.gfx_ctors["Alt"], "Alt missing slots 21/24")


def find_reg_iat(pe: PE32, parent_va: int | None, site_va: int, raw: bytes) -> tuple[int, str] | None:
    if parent_va is None or len(raw) < 2:
        return None
    prefix = IAT_REG_MOV.get(raw[1])
    if prefix is None:
        return None
    blob = pe.try_read(parent_va, site_va - parent_va)
    if not blob:
        return None
    last = None
    i = 0
    while i + 6 <= len(blob):
        if blob[i : i + 2] == prefix:
            imm = struct.unpack_from("<I", blob, i + 2)[0]
            if imm in pe.iat_names:
                last = (imm, pe.iat_names[imm])
            i += 6
            continue
        i += 1
    return last


def classify_e2_family(va: int, decoded: dict[str, Any] | None, raw: bytes) -> str:
    if decoded is not None and decoded["bytes"][:4] in (b"\xff\x54\x8c\x10", b"\xff\x54\x94\x0c"):
        return "stack_switch"
    family = E2_FAMILY_BY_VA.get(va)
    require(family is not None, f"unmapped LOT2 site {hex_addr(va)}")
    return family


def lot_class_for(va: int, decoded: dict[str, Any] | None, raw: bytes, pe: PE32) -> tuple[str, str]:
    if va in GHOST_SITES:
        return "GHOST", "ghost_not_indirect"
    if decoded is not None and decoded["form"] == "abs" and decoded["disp"] in pe.iat_names:
        require(
            decoded["disp"] not in ACTION_BSS_PTRS | HUD_BSS_SLOTS,
            f"IAT rule leaked BSS pointer at {hex_addr(va)}",
        )
        return "IAT", "iat"
    if (
        decoded is not None
        and decoded.get("scale") == 4
        and decoded.get("disp") is not None
        and DRAW_TABLE_VA_MIN <= decoded["disp"] < DRAW_TABLE_VA_MAX
    ):
        return "DRAW", "familyb_draw"
    if va in C_SITE_FAMILY:
        return "HUD_DRAW_FILE", C_SITE_FAMILY[va]
    return "LOT2", classify_e2_family(va, decoded, raw)


def _target(kind: str, va: int | None, name: str | None, index: str | int | None) -> dict[str, Any]:
    return {"kind": kind, "va": hex_addr(va) if isinstance(va, int) else va, "name": name, "index": index}


def build_targets(
    lot_class: str,
    family: str,
    decoded: dict[str, Any] | None,
    pe: PE32,
    operand: str | None,
    va: int,
    parent_va: int | None,
) -> list[dict[str, Any]]:
    if lot_class == "GHOST" or decoded is None:
        return []
    disp = decoded.get("disp")
    if lot_class == "IAT" and disp in pe.iat_names:
        return [_target("import", disp, pe.iat_names[disp], None)]
    if lot_class == "DRAW":
        name = DRAW_TABLE_NAMES.get(disp, f"dword_{disp:X}")
        index = {0: "eax*4", 1: "ecx*4", 2: "edx*4"}.get(decoded.get("index_reg"), "reg*4")
        return [_target("table", disp, name, index)]
    if family.startswith("hud_bss_"):
        return [_target("bss_ptr", disp, operand, None)]
    if family == "file_callback" and disp == FILE_CALLBACK_TABLE:
        return [_target("table", disp, "battle_file_callback_2", "edx*4")]
    if family == "bdlink_pump":
        return [_target("slot", None, "node+8", "esi+8")]
    if family == "drawlist_walk":
        return [_target("slot", None, f"list+{decoded.get('disp'):#x}", None)]
    if family == "stack_switch":
        handlers = extract_stack_handlers(pe, parent_va, va)
        return [_target("code", handler, f"stack_slot_{index}", index) for index, handler in enumerate(handlers)]
    if family == "action_seq":
        ptr = 0x21DFEC0 if va == 0x50BCA3 else 0x21DFEC4
        return [
            _target("table", MAGIC_LIST_LOGIC, "MagicList_Logic", "magicID-1"),
            _target("writer", MAGIC_GET_ID_LOAD, "BattleGF_LoadCallbackByMagicID", "0..399"),
            _target("global_ptr", ptr, operand, None),
        ]
    if family == "relay71":
        return [_target("code", fp, "relay71_fp", None) if fp else _target("null", None, "null", None) for fp in RELAY71_FPS]
    if family == "script_vm":
        return [
            _target("code", 0x504BB0, "BattleEffectScript_Interpreter", "a3"),
            _target("code", 0x5044B0, "sub_5044B0", "a4"),
            _target("code", 0x5048E0, "sub_5048E0", "a5"),
            _target("code", 0x509810, "BattleCamera_DispatchVmOpcode", "a3"),
            _target("code", 0x509640, "sub_509640", "a4"),
            _target("code", 0x5097C0, "sub_5097C0", "a5"),
        ]
    if family == "ot_gpu":
        return [_target("table", table, name, "u8 prim+7") for table, name in OT_TABLES_BY_SITE[va]]
    if family == "swirl_vtable":
        if va in SWIRL_LOCK_SITES:
            return [_target("com_slot", None, "IDirectDrawSurface::Lock", "+0x64")]
        return [_target("com_slot", None, "IDirectDrawSurface::Unlock", "+0x80")]
    if family == "action_table_1D28C44":
        items = [
            _target("bss_record", ACTION_TABLE_BASE, "dword_1D28C44", "u8*16"),
            _target("writer", ACTION_TABLE_REGISTRAR, "EnemyAI_LookupAbilityByIndex", None),
        ]
        items.extend(_target("code", writer, "fp_writer", None) for writer in ACTION_TABLE_WRITERS)
        return items
    if family == "cardgame":
        items = [_target("table", CARDGAME_TABLE, "cardgame_funcs_dword_B964D8", "u8")]
        items.extend(_target("code", ptr, f"slot_{idx}", idx) for idx, ptr in CARDGAME_SLOTS.items())
        return items
    if family == "sound_vtable":
        return [_target("com_slot", None, "IDirectSoundBuffer::SetFrequency", "+0x44")]
    if family == "gfx_driver":
        off = 0 if disp is None else disp
        items = [_target("slot", None, "engine+0xA74", off // 4)]
        for backend, key in (("GL", "GL"), ("DD", "DD"), ("Alt", "Alt")):
            fp = pe.gfx_ctors[key].get(off)
            items.append(_target("code", fp, f"{backend}_slot_{off // 4}", off // 4))
        items.append(_target("ctor", GFX_CTOR_GL, "RenderBackend_Construct_OpenGL", None))
        items.append(_target("ctor", GFX_CTOR_DD, "RenderBackend_Construct_DDraw", None))
        items.append(_target("ctor", GFX_CTOR_ALT, "RenderBackend_Construct_DDrawAlt", None))
        return items
    if family == "type2_factory":
        return [_target("factory", 0x409805, "Gfx_LoadExternalBackendFactory", "engine+0xBD0")]
    if family == "iat_via_reg":
        found = find_reg_iat(pe, parent_va, va, decoded["bytes"] if decoded else b"")
        require(found is not None, f"IAT via register not found at {hex_addr(va)}")
        slot, name = found
        return [_target("import", slot, name, None)]
    if family == "menu_sprite_table_1D2B550":
        if va == 0x4B712D:
            return [
                _target("table", MENU_SPRITE_TABLE, "menu_sprite_table_1D2B550", "id<<6"),
                _target("code", MENU_SPRITE_DRAW, "MenuSprite_DrawCallback", "+0"),
                _target("writer", MENU_SPRITE_INIT, "sub_4A0880", None),
                _target("writer", MENU_SPRITE_WRITER, "sub_4B6210", None),
            ]
        return [
            _target("table", MENU_SPRITE_TABLE, "menu_sprite_table_1D2B550", "+4"),
            _target("code", MENU_SPRITE_DRAW2, "sub_4A09A0", "+4"),
        ]
    if family == "file_archive_callback":
        return [_target("bss_record", 0x1D750DC, "mngrp_file_callback", "+0xC")]
    if family == "menu_list_callback":
        name = "node+8" if va == 0x4BE47E else "node+0xC"
        return [_target("list", 0x1D76B48, "menu_hud_list", name)]
    if disp is not None and decoded["form"] == "abs":
        return [_target("global_ptr", disp, operand, None)]
    if decoded["form"] == "reg":
        return [_target("register", None, operand, None)]
    if disp is not None:
        return [_target("vtable_slot", None, operand, hex_addr(disp))]
    return [_target("unknown", None, operand, None)]


def closure_for(lot_class: str, family: str, decoded: dict[str, Any] | None, pe: PE32) -> str:
    if lot_class == "GHOST":
        return "ghost_not_indirect"
    if lot_class == "IAT":
        return "closed_static"
    if lot_class == "LOT2":
        return LOT2_CLOSURES[family]
    if decoded is not None and decoded.get("disp") is not None and pe.in_image(decoded["disp"], 4):
        return "open_static_bounded"
    return "open_static_bounded"


def index_fields(lot_class: str, family: str, decoded: dict[str, Any] | None) -> tuple[str | None, bool | None]:
    if lot_class == "DRAW":
        return "u8", False
    if family == "stack_switch":
        return "s8", True
    if family == "file_callback" and decoded and decoded.get("disp") == FILE_CALLBACK_TABLE:
        return "u32", False
    if family == "cardgame":
        return "u8", False
    if family == "ot_gpu":
        return "u8", False
    if family == "action_table_1D28C44":
        return "u8", False
    if family == "gfx_driver":
        return "u8", False
    return None, None


def evidence_for(
    va: int,
    decoded: dict[str, Any] | None,
    raw: bytes,
    operand: str | None,
    pe: PE32,
    lot_class: str,
    family: str,
) -> list[dict[str, str]]:
    items = [{"kind": "pe_bytes", "data": (decoded["bytes"] if decoded else raw[:8]).hex()}]
    if operand:
        items.append({"kind": "ledger_operand", "data": operand})
    if lot_class == "IAT" and decoded and decoded.get("disp") in pe.iat_names:
        items.append({"kind": "iat_slot", "data": pe.iat_names[decoded["disp"]]})
    if lot_class == "DRAW" and decoded and decoded.get("disp") is not None:
        items.append({"kind": "table_disp", "data": hex_addr(decoded["disp"]) or ""})
    if va in GHOST_SITES:
        items.append({"kind": "ghost_reason", "data": GHOST_SITES[va]})
    if va in SINGLE_SOURCE_SITES:
        items.append({"kind": "single_source", "data": "true"})
    if family == "stack_switch":
        items.append({"kind": "index", "data": "s8 [esi+0x29] unclamped"})
    if family == "type2_factory":
        items.append({"kind": "signed_disp", "data": "-8"})
    if va == 0x45D1FB:
        items.append({"kind": "bi_table", "data": "Dirty_or_Software"})
    return items


def classify_site(row: dict[str, Any], pe: PE32) -> dict[str, Any]:
    va = row["site_va"]
    raw = pe.try_read(va, 16) or b""
    decoded = decode_ff(raw)
    if va in GHOST_SITES:
        require(not is_indirect_ff(raw), f"GHOST {hex_addr(va)} is still FF /2 or /4")
    lot_class, family = lot_class_for(va, decoded, raw, pe)
    encoding = {
        "bytes": (decoded["bytes"] if decoded else raw[: min(8, len(raw))]).hex(),
        "form": decoded["form"] if decoded else "not_indirect",
        "disp": hex_addr(decoded["disp"]) if decoded and decoded.get("disp") is not None else None,
        "scale": decoded.get("scale") if decoded else None,
    }
    index_width, index_signed = index_fields(lot_class, family, decoded)
    opcode = row["opcode"] if va in GHOST_SITES else (decoded["opcode"] if decoded else row["opcode"])
    return {
        "site_va": hex_addr(va),
        "opcode": opcode,
        "parent_va": hex_addr(row["parent_va"]),
        "parent_name": row["parent_name"],
        "parent_status": row["parent_status"],
        "ledger_class": row["ledger_class"],
        "lot_class": lot_class,
        "family": family,
        "targets": build_targets(lot_class, family, decoded, pe, row["operand"], va, row["parent_va"]),
        "encoding": encoding,
        "closure": closure_for(lot_class, family, decoded, pe),
        "index_width": index_width,
        "index_signed": index_signed,
        "ida_code_xrefs": False,
        "in_no_ref_inventory": True,
        "single_source": va in SINGLE_SOURCE_SITES,
        "proof": evidence_for(va, decoded, raw, row["operand"], pe, lot_class, family),
        "_disp": decoded.get("disp") if decoded else None,
        "_scale": decoded.get("scale") if decoded else None,
        "_form": decoded["form"] if decoded else None,
        "_raw": raw,
        "_decoded": decoded,
    }


def attach_clone_families(sites: list[dict[str, Any]]) -> None:
    groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for site in sites:
        lot = site["lot_class"]
        family = site["family"]
        if lot == "DRAW":
            table = site["targets"][0]["va"] if site["targets"] else "unknown"
            key = f"familyb_draw:{table}"
        elif family == "stack_switch":
            key = "stack_switch_ecx" if site["encoding"]["bytes"].startswith("ff548c10") else "stack_switch_edx"
        elif family == "bdlink_pump":
            key = "bdlink_pump"
        elif family.startswith("hud_bss_"):
            key = family
        elif lot == "IAT" and site["targets"]:
            key = f"iat:{site['targets'][0]['name']}"
        elif family in {"action_seq", "gfx_driver", "swirl_vtable", "ot_gpu", "iat_via_reg", "com_dinput", "com_dsound", "com_dmusic", "com_ddraw"}:
            key = family
        else:
            site["clone_family"] = None
            site["clone_n"] = 1
            continue
        groups[key].append(site)
    for key, members in groups.items():
        for site in members:
            site["clone_family"] = key
            site["clone_n"] = len(members)


def e2_family_counts(sites: list[dict[str, Any]]) -> dict[str, int]:
    counts = Counter(site["family"] for site in sites if site["lot_class"] == "LOT2")
    return dict(sorted(counts.items(), key=lambda item: (-item[1], item[0])))


def e2_closure_counts(sites: list[dict[str, Any]]) -> dict[str, int]:
    counts = Counter(site["closure"] for site in sites if site["lot_class"] == "LOT2")
    return dict(sorted(counts.items(), key=lambda item: (-item[1], item[0])))


def generate(pe: PE32, ledger: dict[str, Any], ledger_path: Path) -> dict[str, Any]:
    attach_e2_maps(pe)
    rows = load_ledger_sites(ledger)
    classified = [classify_site(row, pe) for row in rows]
    classified.sort(key=lambda site: parse_addr(site["site_va"]))
    attach_clone_families(classified)
    counts = Counter(site["lot_class"] for site in classified)
    for key, expected in EXPECTED_COUNTS.items():
        require(counts[key] == expected, f"{key} count {counts[key]} != {expected}")
    require(counts.get("PENDING_LOT2", 0) == 0, "PENDING_LOT2 remaining")
    require(sum(counts.values()) == EXPECTED_SITE_COUNT, "class sum != 493")
    iat_names = Counter()
    for site in classified:
        if site["lot_class"] == "IAT" and site["targets"]:
            iat_names[site["targets"][0]["name"].split("!", 1)[-1]] += 1
    for name, expected in EXPECTED_IAT_IMPORT_COUNTS.items():
        require(iat_names[name] == expected, f"IAT {name} {iat_names[name]} != {expected}")
    draw_tables = {
        parse_addr(site["targets"][0]["va"])
        for site in classified
        if site["lot_class"] == "DRAW" and site["targets"]
    }
    require(len(draw_tables) == 58, f"DRAW tables {len(draw_tables)} != 58")
    require(0x187281C in draw_tables, "Alexander DRAW table missing")
    require(0x186C170 in draw_tables, "Meteor DRAW table missing")
    require(EAX_ECX_DRAW_TABLES <= draw_tables, "eax/ecx DRAW tables missing")
    public_sites = []
    for site in classified:
        public = {key: value for key, value in site.items() if not key.startswith("_")}
        public_sites.append(public)
    families = e2_family_counts(classified)
    closures = e2_closure_counts(classified)
    stack_n = sum(len(site["targets"]) for site in classified if site["family"] == "stack_switch")
    require(stack_n == EXPECTED_STACK_HANDLERS, f"stack_switch handlers {stack_n} != {EXPECTED_STACK_HANDLERS}")
    document = {
        "schema_version": SCHEMA_VERSION,
        "generated_at_utc": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "generator": "tools/battle_indirect_registry.py",
        "binary": {
            "path": str(DEFAULT_PE),
            "name": EXPECTED_BINARY_NAME,
            "sha256": pe.sha256,
            "image_base": hex_addr(pe.base),
        },
        "source_ledger": {
            "path": str(ledger_path.as_posix()),
            "schema_version": ledger.get("schema_version"),
            "generated_at_utc": ledger.get("generated_at_utc"),
            "sha256": sha256_file(ledger_path),
        },
        "counts": {
            "sites": EXPECTED_SITE_COUNT,
            "call": sum(1 for site in public_sites if site["opcode"] == "call"),
            "jmp": sum(1 for site in public_sites if site["opcode"] == "jmp"),
            **EXPECTED_COUNTS,
            "PENDING_LOT2": 0,
            "draw_tables": 58,
            "e2_families": families,
            "e2_closures": closures,
            "stack_switch_handlers": stack_n,
        },
        "rules": {
            "iat_ff15_bss_not_iat": [hex_addr(va) for va in sorted(ACTION_BSS_PTRS)],
            "hud_bss_slots": [hex_addr(va) for va in sorted(HUD_BSS_SLOTS)],
            "eax_ecx_draw_tables_are_draw_not_particle": [hex_addr(va) for va in sorted(EAX_ECX_DRAW_TABLES)],
            "runtime_only_forbidden_if_table_in_image": True,
            "gfx_driver_ctors": [hex_addr(GFX_CTOR_GL), hex_addr(GFX_CTOR_DD), hex_addr(GFX_CTOR_ALT)],
            "forbidden_ctor_stores": [hex_addr(va) for va in sorted(FORBIDDEN_CTOR_STORES)],
            "stack_switch_extra_pe_not_in_493": {
                "edx": [hex_addr(va) for va in STACK_SWITCH_EXTRA_EDX],
                "ecx_other_disp": [hex_addr(va) for va in STACK_SWITCH_EXTRA_ECX],
            },
            "vram_idb_equals_pe": ["0x465455", "0x4657D3"],
        },
        "sites": public_sites,
    }
    validate_document(document, pe, ledger)
    return document


def validate_document(document: dict[str, Any], pe: PE32, ledger: dict[str, Any] | None = None) -> dict[str, Any]:
    require(document.get("schema_version") == SCHEMA_VERSION, "schema_version mismatch")
    attach_e2_maps(pe)
    sites = document["sites"]
    require(isinstance(sites, list) and len(sites) == EXPECTED_SITE_COUNT, "expected 493 sites")
    vas = [parse_addr(site["site_va"]) for site in sites]
    require(len(vas) == len(set(vas)), "duplicate site_va")
    counts = Counter(site["lot_class"] for site in sites)
    for key, expected in EXPECTED_COUNTS.items():
        require(counts[key] == expected, f"{key} count {counts[key]} != {expected}")
    require(counts.get("PENDING_LOT2", 0) == 0, "PENDING_LOT2 remaining")
    require(sum(EXPECTED_COUNTS.values()) == EXPECTED_SITE_COUNT, "class constants do not sum to 493")
    require(document["binary"]["sha256"] == EXPECTED_BINARY_SHA256, "registry PE hash mismatch")
    mapped = [va for family, group in E2_FAMILY_SETS.items() for va in group]
    require(len(mapped) == len(set(mapped)), "E2 family VA collision")
    require(len(mapped) == 181, f"E2 explicit maps {len(mapped)} != 181")
    if ledger is not None:
        ledger_vas = {
            parse_addr(site["site_va"])
            for key in ("indirect_call_sites", "indirect_jump_sites")
            for site in ledger[key]
        }
        require(set(vas) == ledger_vas, "registry VAs do not match the ledger")
    family_counts = Counter(site["family"] for site in sites if site["lot_class"] == "LOT2")
    for family, expected in EXPECTED_E2_FAMILY_COUNTS.items():
        require(family_counts[family] == expected, f"E2 {family} {family_counts[family]} != {expected}")
    require(sum(family_counts.values()) == 263, "E2 family sum != 263")
    closure_counts = Counter(site["closure"] for site in sites if site["lot_class"] == "LOT2")
    for name, expected in EXPECTED_E2_CLOSURE_COUNTS.items():
        require(closure_counts[name] == expected, f"E2 closure {name} {closure_counts[name]} != {expected}")
    stack_n = 0
    for site in sites:
        va = parse_addr(site["site_va"])
        raw = pe.try_read(va, 16) or b""
        decoded = decode_ff(raw)
        lot = site["lot_class"]
        family = site["family"]
        require(family not in FORBIDDEN_OLD_FAMILIES, f"stale family {family} at {hex_addr(va)}")
        require(site["closure"] != "runtime_only" or not _table_in_image(decoded, pe),
                f"runtime_only forbidden for in-image table at {hex_addr(va)}")
        if lot == "IAT":
            require(decoded is not None, f"IAT site not FF /2|/4: {hex_addr(va)}")
            require(decoded["form"] == "abs", f"IAT not abs at {hex_addr(va)}")
            require(decoded["bytes"][:2] in (b"\xff\x15", b"\xff\x25"), f"IAT encoding at {hex_addr(va)}")
            require(decoded["disp"] in pe.iat_names, f"IAT disp not in import table: {hex_addr(va)}")
            require(decoded["disp"] not in ACTION_BSS_PTRS, f"FF 15 BSS classified IAT: {hex_addr(va)}")
        if lot == "DRAW":
            require(decoded is not None and decoded.get("scale") == 4, f"DRAW scale at {hex_addr(va)}")
            require(
                decoded.get("disp") is not None
                and DRAW_TABLE_VA_MIN <= decoded["disp"] < DRAW_TABLE_VA_MAX,
                f"DRAW disp out of range at {hex_addr(va)}",
            )
        if lot == "GHOST":
            require(not is_indirect_ff(raw), f"GHOST still indirect at {hex_addr(va)}")
            require(va in GHOST_SITES, f"unexpected GHOST {hex_addr(va)}")
        if va in C_SITE_FAMILY:
            require(lot == "HUD_DRAW_FILE", f"C site not HUD_DRAW_FILE: {hex_addr(va)}")
            require(family == C_SITE_FAMILY[va], f"C family mismatch at {hex_addr(va)}")
        if lot == "LOT2":
            require(family in LOT2_CLOSURES, f"unknown LOT2 family {family} at {hex_addr(va)}")
            require(site["closure"] == LOT2_CLOSURES[family], f"closure mismatch at {hex_addr(va)}")
        if va == 0x4B712D:
            require(lot == "LOT2" and family == "menu_sprite_table_1D2B550", "0x4B712D family")
            require(site["closure"] == "closed_static", "0x4B712D closure")
        if va in {0x41E965, 0x41E990, 0x41DED4, 0x41E9B7}:
            require(family == "gfx_driver", f"gfx_driver expected at {hex_addr(va)}")
        if va == 0x502F78:
            require(family == "relay71", "0x502F78 must be relay71")
        if va == 0x46E12B:
            require(family == "sound_vtable", "0x46E12B must be sound_vtable")
        if va == 0x40951D:
            require(family == "type2_factory", "type-2 factory")
            require(decoded is not None and decoded.get("disp") == -8, "type-2 disp must be -8")
            require(site["closure"] == "runtime_only", "type-2 runtime_only")
        if decoded is not None and decoded["bytes"][:3] == b"\xff\x54\x24":
            require(decoded["form"] == "esp_disp", f"FF 54 24 form at {hex_addr(va)}")
        if family == "stack_switch":
            stack_n += len(site["targets"])
            if va in {0x721A91, 0x8467B1}:
                require(len(site["targets"]) == 11, f"{hex_addr(va)} must have 11 slots")
            if va == 0x7B4E51:
                require(len(site["targets"]) == 13, "0x7B4E51 must have 13 slots")
        if site["encoding"]["bytes"].startswith("ff15c4fe") or (
            decoded and decoded.get("disp") == 0x21DFEC4
        ):
            require(lot != "IAT", f"FF 15 0x21DFEC4 classified IAT at {hex_addr(va)}")
    require(stack_n == EXPECTED_STACK_HANDLERS, f"stack_switch handlers {stack_n} != {EXPECTED_STACK_HANDLERS}")
    return {
        "status": "pass",
        "validated_at_utc": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "counts": dict(counts),
        "e2_families": dict(family_counts),
        "e2_closures": dict(closure_counts),
        "PENDING_LOT2": 0,
    }


def _table_in_image(decoded: dict[str, Any] | None, pe: PE32) -> bool:
    if decoded is None or decoded.get("disp") is None:
        return False
    return pe.in_image(decoded["disp"], 4)


def parse_args(argv: list[str] | None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pe", type=Path, default=DEFAULT_PE)
    parser.add_argument("--ledger", type=Path, default=DEFAULT_LEDGER)
    parser.add_argument("-o", "--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--validate", type=Path, metavar="PATH")
    parser.add_argument("--generate-only", action="store_true")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    try:
        pe = PE32(args.pe.read_bytes())
        if args.validate:
            document = json.loads(args.validate.read_text(encoding="utf-8"))
            ledger = json.loads(args.ledger.read_text(encoding="utf-8")) if args.ledger.exists() else None
            report = validate_document(document, pe, ledger)
            report["registry_sha256"] = sha256_file(args.validate)
            print(json.dumps(report, indent=2))
            return 0
        ledger = json.loads(args.ledger.read_text(encoding="utf-8"))
        document = generate(pe, ledger, args.ledger)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        payload = json.dumps(document, indent=2) + "\n"
        args.output.write_text(payload, encoding="utf-8")
        report = {
            "status": "pass",
            "path": str(args.output),
            "registry_sha256": sha256_bytes(args.output.read_bytes()),
            "counts": document["counts"],
        }
        if not args.generate_only:
            validate_document(json.loads(args.output.read_text(encoding="utf-8")), pe, ledger)
        print(json.dumps(report, indent=2))
        return 0
    except (OSError, KeyError, TypeError, ValueError, struct.error, RegistryError) as exc:
        print(json.dumps({"status": "fail", "error": str(exc)}))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
