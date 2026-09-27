#!/usr/bin/env python3
"""FF8 battle draw-list dump decoder v2 (lot 13/14, magics 'ND07' + 'TX07').

v2 decodes the v8 DLL writer contract (gfx_driver_passthrough.c): ND07
records grow to 9 x u32 (36-byte header; field 9 = build GFXPT_BUILD_ID
0x5638) and frame-level VRAM-mirror records 'TX07' carry the full VRAM
snapshot used for texture-mapped rendering (--texture; texture.py does the
sampling). Without --texture the render is byte-identical to v1 (flat fill)
so the v1 selftests keep passing.

Dump contract (pinned for the parallel v8 DLL): little-endian stream of
records, no global header. ND07 record order inside one `seq` frame == exact
draw order (painter's algorithm, no z-buffer): slots 43..64 are invoked PER
NODE by Gfx_WalkDrawList, next pointer at node+0
(docs/tech/investigation/battle-static-discovery/decomp/0x4178D7__Gfx_WalkDrawList.md).

Geometry:
  kind 2 = FVF 0x1C4 (XYZRHW|DIFFUSE|SPECULAR|TEX1) TRIANGLELIST, 32-byte vertices,
           already in screen space (0x43E24A__RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4.md).
  kind 1 = PSX poly packet, POLY_FT3 32B / FT4 40B (driver-abi-spec.md section 8).
           v1 does a LOW-CONFIDENCE 2D fallback read of the screen coords.
  kind 0 = node captured with no geometry.

Record layout (v8 writer contract, see driver-passthrough gfx_driver_passthrough.c):
  u32 magic 'ND07' (0x3730444E); u32 slot (43..64); u32 seq; u32 ctx; u32 node_addr;
  u32 geom_kind (0/1/2); u32 fails; u32 payload_size -- counts ALL bytes after
  this field: node[24] + kind payload; u32 build (v8 field 9, offset 0x20,
  GFXPT_BUILD_ID 0x5638). Header 32 -> 36 bytes vs v7; total record
  = 36 + payload_size. Build mismatches are mixed into `warnings` (never a
  crash); with --strict they gate to exit 3.
  u8 node[24]; payload (unchanged in v8):
    kind 0: none
    kind 1: u32 prim (3=FT3, 4=FT4); u8 packet[40]
    kind 2: u32 vcount; u32 icount; u16 idx[icount]; u16 pad[icount & 1] (zeros,
            4-byte alignment of the fvf blob); u8 fvf[vcount*32]

v8 TX07 record (texture mirror, ONE per armed frame, keyed on seq -- same
counter as ND07; NOT part of painter order; does not count toward records;
NO fails field):
  u32 magic 'TX07' (0x37305458); u32 build; u32 seq; u32 clut_now
  (dword_1CA89B8 raw -- mask & 0x7FFF applied decode-side); u32 vram_base
  (dword_1CB602C); u32 sys_clut_base (0x1B47818); u32 m_B7DB44; u32
  page_probe (*(texinfo+0x10) of the FIRST textured walk node; diagnostic
  only); u8 vram[0x100000] (full VRAM mirror, 1024 u16/row x 512 rows).
  Record total = 32 + 0x100000 = 0x100020.

v2 LIMITATION (documented): the ND07 record carries no per-node page pointer
and TX07.page_probe only covers the FIRST textured node's page, so texture
sampling assumes every textured draw of a frame samples the SAME page region
(--tpage, default 0). Multi-texture frames paint with the first node's
context. No page-locating logic is invented: page_probe is printed as a
diagnostic only (texture.py).

Vertex FVF 0x1C4 (32 B): f32 X@0 Y@4 Z@8 RHW@12; u32 DIFFUSE(ARGB)@16;
u32 SPECULAR@20; f32 U@24 V@28.

Stdlib + Pillow only; raster.py fills an RGB bytearray (no graphics API).
CLI messages are ASCII-only (Windows console friendly).
"""
from __future__ import annotations

import argparse
import json
import math
import os
import struct
import sys
from collections import Counter
from dataclasses import dataclass

from raster import Framebuffer, draw_line_clipped, fill_triangle
from texture import (VramMirror, fill_triangle_textured, page_fits_vram,
                     read_clut)

MAGIC_ND = 0x3730444E            # 'ND07' little-endian
MAGIC_ND8 = 0x3830444E           # 'ND08' little-endian (v9 kind-2)
MAGIC_TR = 0x38305254            # 'TR08' little-endian (v10 texture resource)
MAGIC_TX = 0x37305458            # 'TX07' little-endian (v8 frame mirror)
HDR = struct.Struct('<9I')       # magic, slot, seq, ctx, node_addr, geom_kind, fails, payload_size, build
TX_HDR = struct.Struct('<8I')    # magic, build, seq, clut_now, vram_base, sys_clut_base, m_B7DB44, page_probe
TX_VRAM_BYTES = 0x100000         # full VRAM mirror: 1024 u16/row x 512 rows
BUILD_ID = 0x563E                # GFXPT_BUILD_ID (v11: direct slots 48/49/50 matdesc chain; v10.3=0x563D, v10=0x563A, v9=0x5639, v8=0x5638)
BUILD_ID_V8 = 0x5638             # v8 layout: kind-2 without the texture footer, TX07 w/o sys_clut_row
SUPPORTED_REPLAY_BUILDS = frozenset((0x563D, 0x563E))  # v10.3/v11: same captured layout
TX_SYSROW_BYTES = 2048 if BUILD_ID >= 0x5639 else 0   # v9: + sys_clut_row (2 KiB)
TX_REC_BYTES = TX_HDR.size + TX_VRAM_BYTES + TX_SYSROW_BYTES   # 0x100020 (v8) / 0x100820 (v9)
NODE_SIZE = 24                   # OT node (driver-abi-spec.md section 8)
VERT = struct.Struct('<4f2I2f')  # FVF 0x1C4: X,Y,Z,RHW; DIFFUSE; SPECULAR; U,V (32 bytes)
SLOT_MIN, SLOT_MAX = 43, 64

LOWCONF_COLOR = (255, 200, 0)    # kind1 fallback fill: packet color layout unknown in v1
WIRE_COLOR = (255, 255, 255)
ALPHA_MIN = 8                    # D3D-style alpha-test threshold: discard DIFFUSE alpha < 8

# kind1 packet screen-coord offsets (int16 LE (x,y) pairs) -- LOW-CONFIDENCE, two readings:
#   packed: contiguous 4-byte pairs -> tri1 @8,12,16; FT4 tri2 @12,16,20 (literal contract).
#   psxq:   Psy-Q POLY_FT3/FT4 (u/v interleaved, stride 8) -> tri1 @8,16,24; FT4 tri2 @16,24,32
#           (the contract's "FT4: +24" matches x2y2@0x18 in this reading).
PACKET_LAYOUTS = {
    'packed': ((8, 12, 16), (12, 16, 20)),
    'psxq': ((8, 16, 24), (16, 24, 32)),
}


class DumpError(Exception):
    def __init__(self, msg: str, offset: int):
        super().__init__(f'{msg} at offset {offset} (0x{offset:x})')
        self.offset = offset


@dataclass
class Record:
    offset: int           # file offset of this record's header
    slot: int
    seq: int
    ctx: int
    node_addr: int
    geom_kind: int
    fails: int
    node: bytes           # raw 24-byte OT node
    build: int = 0        # v8 field 9; expected == BUILD_ID (0x5638)
    prim: int = 0         # kind1: 3=FT3, 4=FT4
    packet: bytes = b''   # kind1: raw 40-byte packet (LOW-CONFIDENCE layout)
    vcount: int = 0       # kind2
    icount: int = 0
    indices: bytes = b''  # kind2: raw u16 LE index array
    fvf: bytes = b''      # kind2: raw vcount*32 vertex blob
    idx_repaired: bool = False  # indices rebuilt from quad-strip pattern (post-consumption capture)


@dataclass
class TexRecord:
    """One TX07 frame mirror record (not painter; keyed on seq)."""
    offset: int
    build: int
    seq: int
    clut_now: int         # dword_1CA89B8 RAW (mask & 0x7FFF applied decode-side)
    vram_base: int
    sys_clut_base: int
    m_B7DB44: int
    page_probe: int       # first textured node's page object; DIAGNOSTIC ONLY
    mirror: bytes         # raw 0x100000 VRAM mirror
    sys_clut_row: bytes = b''   # v9: 2048 B system-CLUT row copy (b'' for v8)



@dataclass
class TexResRecord:
    """v10 TR08 texture resource (battle TIM textures, one per texobj per frame)."""
    offset: int
    build: int
    seq: int
    texobj: int
    w: int
    h: int
    pal_entries: int
    pal_count: int
    pixels: bytes        # w*h bytes (1 B/texel, paletted)
    raw_clut: bytes      # pal_count*pal_entries*4 bytes (u32 per color, byte3 = STP)

    @property
    def palette(self, idx: int):
        """u32 colors of sub-palette idx."""
        n = self.pal_entries
        off = 4 * n * idx
        return struct.unpack_from(f'<{n}I', self.raw_clut, off)


def _cand_tr_ok(off: int, data: bytes, n: int, expected_build: int = BUILD_ID) -> bool:
    """Structural plausibility of a TR08 record start (v10 texture resource)."""
    if off + 40 > n:
        return False
    m2, b2 = struct.unpack_from('<2I', data, off)
    return m2 == MAGIC_TR and b2 == expected_build


def _cand_tx_ok(off: int, data: bytes, n: int, expected_build: int = BUILD_ID) -> bool:
    """Structural plausibility of a TX07 record start at `off` (used by the ND07
    resync scan, so a TX07 record that directly follows a skewed ND07 record is
    found as an anchor instead of being chain-broken). TX07 only exists in the
    v8 era, so requiring build == BUILD_ID here is safe."""
    if off + TX_HDR.size > n:
        return False
    m2, b2 = struct.unpack_from('<2I', data, off)
    return m2 == MAGIC_TX and b2 == expected_build


def parse_dump(data: bytes, *, expected_build: int = BUILD_ID):
    """Parse the whole record stream. Raises DumpError on bad magic or truncation.

    Returns (records, warnings, tx_records, tr_records). The caller must opt in
    explicitly to a supported historical build; globals and capture bytes stay
    unchanged. Both supported builds include TX07's 2048-byte system CLUT row.
    Build mismatches remain warnings for the existing diagnostic reader and
    are rejected by strict replay callers.
    """
    if expected_build not in SUPPORTED_REPLAY_BUILDS:
        raise DumpError(f'unsupported replay build 0x{expected_build:X}', 0)
    records, tx_records, tr_records, warnings = [], [], [], []
    pos, n = 0, len(data)
    MAGIC_BYTES = struct.pack('<I', MAGIC_ND)
    TX_BYTES = struct.pack('<I', MAGIC_TX)
    TR_BYTES = struct.pack('<I', MAGIC_TR)
    while pos < n:
        base = pos
        if n - pos < 4:
            raise DumpError(f'truncated record header (need 4 bytes for magic, have {n - pos})', pos)
        magic = struct.unpack_from('<I', data, pos)[0]
        if magic == MAGIC_TR:
            # v10 texture resource: hdr 10 x u32 + pixels + raw clut.
            if n - pos < 40:
                raise DumpError(f'truncated TR08 header (need 40 bytes, have {n - pos})', pos)
            _m, bld, s2, tobj, tw, th, pent, pcnt, psz, csz = struct.unpack_from('<10I', data, pos)
            if bld != expected_build:
                warnings.append(f'tr@{base}: build 0x{bld:X} != 0x{expected_build:X}')
            psz_c = min(psz, 65536)
            csz_c = min(csz, 32768)
            if n - pos < 40 + psz_c + csz_c:
                raise DumpError(f'truncated TR08 record (need {40 + psz_c + csz_c} bytes, have {n - pos})', pos)
            tr_records.append(TexResRecord(base, bld, s2, tobj, tw, th, pent, pcnt,
                                           bytes(data[pos + 40:pos + 40 + psz_c]),
                                           bytes(data[pos + 40 + psz_c:pos + 40 + psz_c + csz_c])))
            pos += 40 + psz_c + csz_c
            continue

        if magic == MAGIC_TX:
            # v8 frame mirror: fixed size, no resync machinery, no fails field.
            if n - pos < TX_HDR.size:
                raise DumpError(f'truncated TX07 header (need {TX_HDR.size} bytes, have {n - pos})', pos)
            if n - pos < TX_REC_BYTES:
                raise DumpError(f'truncated TX07 record (need {TX_REC_BYTES} bytes, have {n - pos})', pos)
            _magic, build, seq, clut_now, vram_base, sys_clut_base, m_b7, page_probe = \
                TX_HDR.unpack_from(data, pos)
            if build != expected_build:
                warnings.append(f'tx@{base}: build 0x{build:X} != 0x{expected_build:X} (expected)')
            tx_records.append(TexRecord(base, build, seq, clut_now, vram_base,
                                        sys_clut_base, m_b7, page_probe,
                                        bytes(data[pos + TX_HDR.size:pos + TX_HDR.size + TX_VRAM_BYTES]),
                                        bytes(data[pos + TX_HDR.size + TX_VRAM_BYTES:pos + TX_REC_BYTES])))
            pos += TX_REC_BYTES
            continue

        if n - pos < HDR.size:
            raise DumpError(f'truncated record header (need {HDR.size} bytes, have {n - pos})', pos)
        magic, slot, seq, ctx, node_addr, kind, fails, psize, build = HDR.unpack_from(data, pos)
        if magic != MAGIC_ND and magic != MAGIC_ND8:
            raise DumpError(f"bad magic 0x{magic:08X} (expected 0x{MAGIC_ND:08X} 'ND07', "
                            f"0x{MAGIC_ND8:08X} 'ND08' or 0x{MAGIC_TX:08X} 'TX07')", pos)
        if build != expected_build:
            warnings.append(f'record@{base}: build 0x{build:X} != 0x{expected_build:X} '
                            f'(expected GFXPT_BUILD_ID 0x{expected_build:X})')
        pos += HDR.size
        if psize < NODE_SIZE:
            raise DumpError(f'payload_size {psize} < node size {NODE_SIZE}', pos)
        node = bytes(data[pos:pos + NODE_SIZE])
        node_start = pos
        pos += NODE_SIZE
        payload_start = pos
        declared_end = node_start + psize
        actual_end = None
        skew = 0

        def _cand_ok(off):
            if off + HDR.size > n:
                return False
            m2, s2, _q2, _c2, _a2, k2, _f2, p2, b2 = struct.unpack_from('<9I', data, off)
            if not ((m2 == MAGIC_ND or m2 == MAGIC_ND8) and 43 <= s2 <= 64 and k2 <= 2 and p2 <= 262144):
                return False
            if k2 == 2 and off + HDR.size + NODE_SIZE + 8 <= n:
                vc2, ic2 = struct.unpack_from('<2I', data, off + HDR.size + NODE_SIZE)
                if vc2 > 4096 or ic2 > 16384:
                    return False
            if b2 != expected_build:
                return False
            return True

        if _cand_ok(declared_end):
            actual_end = declared_end
        else:
            found = -1
            if declared_end < n:
                for probe in range(declared_end, min(declared_end + 256, n - 3)):
                    w4 = data[probe:probe + 4]
                    if w4 == MAGIC_BYTES and _cand_ok(probe):
                        found = probe
                        break
                    if w4 == TX_BYTES and _cand_tx_ok(probe, data, n, expected_build):
                        found = probe
                        break
                if found < 0:
                    # self-heal: chain desync (historic writer) -- resume at the next
                    # structurally valid record, dropping ambiguous in-between bytes.
                    for probe in range(declared_end, n - 3):
                        w4 = data[probe:probe + 4]
                        if w4 == MAGIC_BYTES and _cand_ok(probe):
                            found = probe
                            break
                        if w4 == TX_BYTES and _cand_tx_ok(probe, data, n, expected_build):
                            found = probe
                            break
                        if w4 == TR_BYTES and _cand_tr_ok(probe, data, n, expected_build):
                            found = probe
                            break
            if found < 0:
                if declared_end <= n <= declared_end + 16:
                    actual_end = n
                    skew = actual_end - declared_end
                else:
                    hint = ''
                    if base == 0 and build != expected_build:
                        # forward-compat note for v7-era (32-byte header) files:
                        # v8's 9th u32 (offset 0x20) carries the build-id there.
                        hint = (f' (v7-era dump? v2 expects the v8 36-byte ND07 header '
                                f'with build=0x{expected_build:X} at offset 0x20; got '
                                f'0x{build:X}; v2 decodes v8 dumps only)')
                    raise DumpError(f'truncated record (declared {psize} bytes after header, '
                                    f'have {n - node_start}){hint}', node_start)
            else:
                actual_end = found
                skew = actual_end - declared_end
                if skew > 16:
                    warnings.append(f'chain-break@{base}: {skew} bytes skipped before next '
                                    f'valid record (historic writer bug, slot {slot}, seq {seq})')
        if skew:
            warnings.append(f'resync@{base}: record tail {skew:+d} bytes vs declared size '
                            f'(historic v7 writer skew, slot {slot}, seq {seq})')
        payload = bytes(data[payload_start:actual_end])
        pos = actual_end

        if not SLOT_MIN <= slot <= SLOT_MAX:
            warnings.append(f'record@{base}: slot {slot} outside {SLOT_MIN}..{SLOT_MAX}')
        rec = Record(base, slot, seq, ctx, node_addr, kind, fails, node, build=build)
        if kind == 0:
            pass
        elif kind == 1:
            if len(payload) < 44:
                raise DumpError(f'kind1 payload too small ({len(payload)} bytes, need 44: u32 prim + 40-byte packet)', base)
            rec.prim = struct.unpack_from('<I', payload, 0)[0]
            rec.packet = payload[4:44]
            if len(payload) > 44:
                warnings.append(f'record@{base}: kind1 payload {len(payload)} > 44 bytes (extra ignored)')
        elif kind == 2:
            if len(payload) < 8:
                raise DumpError(f'kind2 payload too small ({len(payload)} bytes, need 8: u32 vcount + u32 icount)', base)
            rec.vcount, rec.icount = struct.unpack_from('<2I', payload, 0)
            pad = (4 - (rec.icount * 2 % 4)) % 4  # writer pads idx to 4-byte alignment
            need = 8 + rec.icount * 2 + pad + rec.vcount * VERT.size
            if len(payload) < need:
                raise DumpError(f'truncated kind2 payload (declared {len(payload)}, need {need} '
                                f'for vcount={rec.vcount} icount={rec.icount})', base)
            rec.indices = payload[8:8 + rec.icount * 2]
            if skew:
                fvf_start = len(payload) - rec.vcount * VERT.size   # skewed: fvf at record tail
            else:
                fvf_start = 8 + rec.icount * 2 + pad
            rec.fvf = payload[fvf_start:fvf_start + rec.vcount * VERT.size]
            idxs = struct.unpack(f'<{rec.icount}H', rec.indices) if rec.icount else ()
            # v9 texture footer (kind-2 only): u32 tpage; u32 mode; u32 clut; u32 id_count;
            # u8 ids[id_count] padded to 4; u32 dropped_ids. Present when the record
            # carries magic 'ND08' (kind-2 only) or build >= 0x5639 (writer v9).
            rec.tpage = rec.mode = rec.clut = rec.id_count = rec.dropped_ids = 0
            rec.texobj = 0
            rec.texobj = 0
            rec.ids = b''
            footer_at = None
            if magic == MAGIC_ND8:
                footer_at = fvf_start + rec.vcount * VERT.size
            elif build == expected_build and len(payload) > need + 16:
                # lenient v9: plain ND07 magic with extra bytes = v9 footer anyway
                footer_at = fvf_start + rec.vcount * VERT.size
            if footer_at is not None and len(payload) >= footer_at + 16:
                tp, md, cu, idc = struct.unpack_from('<4I', payload, footer_at)
                rec.tpage, rec.mode, rec.clut, rec.id_count = tp, md, cu, min(idc, 255)
                ids_start = footer_at + 16
                ids_end = ids_start + rec.id_count
                rec.ids = payload[ids_start:ids_end]
                pad2 = (4 - (len(rec.ids) % 4)) % 4
                drop_off = ids_end + pad2
                if len(payload) >= drop_off + 4:
                    rec.dropped_ids = struct.unpack_from('<I', payload, drop_off)[0]
                # v10: texobj u32 appended after dropped_ids
                if len(payload) >= drop_off + 8:
                    rec.texobj = struct.unpack_from('<I', payload, drop_off + 4)[0]
                need = drop_off + 8          # footer counted into the expected size
            # Post-consumption capture: the native walk (0x43E356 VB batch) rewrites part
            # of its index buffer as scratch before the detour copies it. When the
            # record matches the quad-strip shape (vcount = G*4, icount = G*6) and raw
            # indices exceed vcount, rebuild the observed PSX FT4 pattern (evidence:
            # sane head/tail groups of the same records follow base+(2,1,0,3,1,2)).
            if idxs and max(idxs) >= rec.vcount and rec.vcount % 4 == 0 \
                    and rec.icount == rec.vcount // 4 * 6:
                pat = (2, 1, 0, 3, 1, 2)
                rec.indices = struct.pack(f'<{rec.icount}H',
                                          *(v + g * 4 for g in range(rec.vcount // 4) for v in pat))
                rec.idx_repaired = True
                warnings.append(f'record@{base}: idx out-of-range -> rebuilt quad-strip '
                                f'pattern (vcount={rec.vcount}, icount={rec.icount})')
            if len(payload) > need:
                warnings.append(f'record@{base}: kind2 payload {len(payload)} > {need} bytes (extra ignored)')
        else:
            warnings.append(f'record@{base}: unknown geom_kind {kind} (payload consumed, not decoded)')
        records.append(rec)
    return records, warnings, tx_records, tr_records


def _cand_tx_ok(off: int, data: bytes, n: int, expected_build: int = BUILD_ID) -> bool:
    """Structural plausibility of a TX07 record start (build-checked: TX07 only
    exists in v8 era, so a build match is safe for resync anchoring)."""
    if off + TX_HDR.size > n:
        return False
    m2, b2 = struct.unpack_from('<2I', data, off)
    return m2 == MAGIC_TX and b2 == expected_build


# --------------------------------------------------------------------------- geometry access

def iter_indices(rec: Record):
    return struct.unpack(f'<{rec.icount}H', rec.indices) if rec.icount else ()


def unpack_diffuse(d: int):
    """u32 ARGB -> ((r, g, b), alpha)."""
    return ((d >> 16) & 0xFF, (d >> 8) & 0xFF, d & 0xFF), (d >> 24) & 0xFF


def kind2_triangles(rec: Record):
    """TRIANGLELIST: indexed when icount>0, else direct vcount/3. Yields vertex triples."""
    verts = list(VERT.iter_unpack(rec.fvf))
    idx = list(iter_indices(rec))
    if idx:
        nv = len(verts)
        for i in range(0, len(idx) - len(idx) % 3, 3):
            a, b, c = idx[i], idx[i + 1], idx[i + 2]
            if a < nv and b < nv and c < nv:
                yield verts[a], verts[b], verts[c]
    else:
        for i in range(0, len(verts) - len(verts) % 3, 3):
            yield verts[i], verts[i + 1], verts[i + 2]


def packet_triangles(rec: Record, layout: str = 'packed'):
    """LOW-CONFIDENCE kind1 fallback: int16 LE screen pairs at the layout's offsets."""
    tri1, tri2 = PACKET_LAYOUTS[layout]
    pkt = rec.packet

    def pair(off):
        x, y = struct.unpack_from('<hh', pkt, off)
        return float(x), float(y)

    if rec.prim == 3:
        yield pair(tri1[0]), pair(tri1[1]), pair(tri1[2])
    elif rec.prim == 4:
        yield pair(tri1[0]), pair(tri1[1]), pair(tri1[2])
        yield pair(tri2[0]), pair(tri2[1]), pair(tri2[2])


# --------------------------------------------------------------------------- stats / info

def group_by_seq(records):
    """seq -> [records], insertion order == first appearance == file (draw) order."""
    frames = {}
    for r in records:
        frames.setdefault(r.seq, []).append(r)
    return frames


def stats(records, *, expected_build: int = BUILD_ID):
    kinds = Counter(r.geom_kind for r in records)
    slots = Counter(r.slot for r in records)
    builds = Counter(f'0x{r.build:X}' for r in records)
    prims = Counter()
    tris2 = lowconf = implaus = vtot = itot = 0
    xs, ys, us, vs = [], [], [], []
    for r in records:
        if r.geom_kind == 2:
            idx = list(iter_indices(r))
            vtot += r.vcount
            itot += len(idx)
            tris2 += (len(idx) // 3) if idx else (r.vcount // 3)
            if idx:
                ok = len(idx) % 3 == 0 and r.vcount > 0 and max(idx) < r.vcount
            else:
                ok = r.vcount > 0 and r.vcount % 3 == 0
            implaus += 0 if ok else 1
            for x, y, _z, _rhw, _diff, _spec, u, v in VERT.iter_unpack(r.fvf):
                xs.append(x)
                ys.append(y)
                us.append(u)
                vs.append(v)
        elif r.geom_kind == 1:
            prims[r.prim] += 1
            if r.prim == 3:
                lowconf += 1
            elif r.prim == 4:
                lowconf += 2
    return {
        'records': len(records),
        'kind_counts': {str(k): kinds.get(k, 0) for k in (0, 1, 2)},
        'fails_total': sum(r.fails for r in records),
        'records_with_fails': sum(1 for r in records if r.fails),
        'slot_counts': {str(s): c for s, c in sorted(slots.items())},
        'build_ids': {k: c for k, c in sorted(builds.items())},
        'build_mismatches': sum(1 for r in records if r.build != expected_build),
        'vcount_total': vtot,
        'icount_total': itot,
        'tris_kind2': tris2,
        'tris_kind1_lowconf': lowconf,
        'prim_counts_kind1': {str(p): c for p, c in sorted(prims.items())},
        'implausible_kind2': implaus,
        'bbox': None if not xs else {'x': [min(xs), max(xs)], 'y': [min(ys), max(ys)]},
        'uv': None if not us else {'u': [min(us), max(us)], 'v': [min(vs), max(vs)]},
    }


def _fmt_rng(r, ka, kb):
    if r is None:
        return f'{ka}[-] {kb}[-]'
    return (f"{ka}[{r[ka][0]:.3f} .. {r[ka][1]:.3f}] "
            f"{kb}[{r[kb][0]:.3f} .. {r[kb][1]:.3f}]")


def _strict_gate(args, warnings, records, *, expected_build: int = BUILD_ID) -> int:
    """--strict: resync/chain-break events or ND07 build-id mismatches -> exit 3."""
    bad = [w for w in warnings if 'resync@' in w or 'chain-break@' in w]
    if bad:
        print(f'STRICT FAIL: {len(bad)} resync event(s), first: {bad[0]}', file=sys.stderr)
        return 3
    mism = [r for r in records if r.build != expected_build]
    if mism:
        print(f'STRICT FAIL: build-id mismatch in {len(mism)} record(s), first at offset '
              f'{mism[0].offset} (0x{mism[0].offset:x})', file=sys.stderr)
        return 3
    print('STRICT PASS: 0 resync events')
    return 0


def cmd_info(args, records, warnings, tx_records) -> int:
    if args.strict:
        rc = _strict_gate(args, warnings, records)
        if rc:
            return rc
    frames = group_by_seq(records)
    glob = stats(records)
    glob.update({
        'tx_records': len(tx_records),
        'tx_frames': len({t.seq for t in tx_records}),
        'build_expected': BUILD_ID,
        'vram_mbytes': round(sum(len(t.mirror) for t in tx_records) / (1024 * 1024), 3),
        'tx': [{'offset': t.offset, 'seq': t.seq, 'build': f'0x{t.build:X}',
                'clut_now': f'0x{t.clut_now:08X}', 'vram_base': f'0x{t.vram_base:08X}',
                'sys_clut_base': f'0x{t.sys_clut_base:08X}',
                'm_B7DB44': f'0x{t.m_B7DB44:08X}',
                'page_probe': f'0x{t.page_probe:08X}  (diagnostic)'} for t in tx_records],
    })
    per_frame = [{'seq': seq, **stats(rs)} for seq, rs in frames.items()]
    size = os.path.getsize(args.dump)
    if args.json:
        print(json.dumps({
            'file': args.dump,
            'file_size': size,
            'record_count': len(records),
            'frame_count': len(frames),
            'warnings': warnings,
            'global': glob,
            'frames': per_frame,
        }, indent=2))
        return 0
    print(f'file: {args.dump} ({size} bytes)')
    print(f'records: {glob["records"]}  frames: {len(frames)}  kinds: '
          + ' '.join(f'kind{k}={v}' for k, v in glob['kind_counts'].items()))
    print(f'fails: total={glob["fails_total"]} records_with_fails={glob["records_with_fails"]}')
    print('slots: ' + (' '.join(f'{s}x{c}' for s, c in glob['slot_counts'].items()) or '-'))
    print(f'tris: kind2={glob["tris_kind2"]} kind1_lowconf={glob["tris_kind1_lowconf"]} '
          f'(vcount_total={glob["vcount_total"]} icount_total={glob["icount_total"]})')
    print('kind1 prims: ' + (' '.join(f'{p}x{c}' for p, c in glob['prim_counts_kind1'].items()) or '-'))
    print(f'implausible kind2 records: {glob["implausible_kind2"]}')
    print('bbox (kind2, screen): ' + _fmt_rng(glob['bbox'], 'x', 'y'))
    print('uv (kind2): ' + _fmt_rng(glob['uv'], 'u', 'v'))
    print(f'tx: {glob["tx_records"]} mirror record(s), {glob["tx_frames"]} frame(s), '
          f'vram {glob["vram_mbytes"]} MB, build_expected=0x{glob["build_expected"]:X}, '
          f'build_mismatches={glob["build_mismatches"]}')
    for t in tx_records:
        print(f'  tx seq={t.seq} clut_now=0x{t.clut_now:08X} vram_base=0x{t.vram_base:08X} '
              f'sys_clut_base=0x{t.sys_clut_base:08X} m_B7DB44=0x{t.m_B7DB44:08X} '
              f'page_probe=0x{t.page_probe:08X} (diagnostic)')
    for w in warnings:
        print(f'warning: {w}', file=sys.stderr)
    print(f'frames ({len(frames)}):')
    for f in per_frame:
        print(f'  seq={f["seq"]:<10} records={f["records"]:<8} tris2={f["tris_kind2"]:<10} '
              f'lowconf={f["tris_kind1_lowconf"]:<7} fails={f["fails_total"]:<8} '
              f'bbox={_fmt_rng(f["bbox"], "x", "y")}')
    return 0


# --------------------------------------------------------------------------- render

def _pt(v, scale):
    return (v[0] * scale, v[1] * scale)


def render_frame(records, width, height, wire=False, scale=1.0, packet_layout='packed',
                 texture_ctx=None):
    """One frame: fill triangles in record order (painter), then optional white wire overlay.

    texture_ctx: None -> flat fill for every kind-2 record (v1 behavior,
    byte-identical); else {'mirror', 'clut', 'tpage', 'mode'} -> kind-2
    triangles are point-sampled from the frame's TX07 VRAM mirror (texture.py;
    affine UV interpolation, first-vertex diffuse modulate). kind-1 stays on
    the LOW-CONFIDENCE flat fallback either way.

    Returns (Framebuffer, render_stats dict).
    """
    fb = Framebuffer(width, height)
    st = {'filled': 0, 'alpha_skipped': 0, 'lowconf': 0, 'wire': 0, 'nan_skipped': 0,
          'textured': 0, 'uv_clamped': 0}
    wires = []
    for rec in records:
        if rec.geom_kind == 2:
            if texture_ctx is not None:
                # v9: per-node texture fields from the ND08 footer (fallback: ctx)
                node_tpage = rec.tpage if getattr(rec, 'tpage', 0) or rec.mode else texture_ctx['tpage']
                node_mode = rec.mode if rec.tpage or rec.mode else texture_ctx['mode']
                node_clut = rec.clut if rec.tpage or rec.mode else texture_ctx['clut']
                for a, b, c in kind2_triangles(rec):
                    rgb, alpha = unpack_diffuse(a[4])     # flat modulate: first vertex DIFFUSE
                    if alpha < ALPHA_MIN:
                        st['alpha_skipped'] += 1
                        continue
                    tri = [_pt(a, scale), _pt(b, scale), _pt(c, scale)]
                    if any(not (math.isfinite(p[0]) and math.isfinite(p[1])) for p in tri):
                        st['nan_skipped'] += 1  # stale/garbage vertex (post-consumption capture)
                        continue
                    filled, clamped = fill_triangle_textured(
                        fb, tri, ((a[6], a[7]), (b[6], b[7]), (c[6], c[7])), rgb,
                        texture_ctx['mirror'], node_tpage,
                        node_mode, node_clut, texture_ctx['txrec'],
                        node_clut=rec.clut if rec.tpage or rec.mode else None)
                    st['textured'] += filled
                    st['uv_clamped'] += clamped
                    if wire:
                        wires.append(tri)
                continue
            for a, b, c in kind2_triangles(rec):
                rgb, alpha = unpack_diffuse(a[4])  # flat fill: first vertex DIFFUSE
                if alpha < ALPHA_MIN:
                    st['alpha_skipped'] += 1
                    continue
                tri = [_pt(a, scale), _pt(b, scale), _pt(c, scale)]
                if any(not (math.isfinite(p[0]) and math.isfinite(p[1])) for p in tri):
                    st['nan_skipped'] += 1  # stale/garbage vertex (post-consumption capture)
                    continue
                fill_triangle(fb, *tri, rgb)
                st['filled'] += 1
                if wire:
                    wires.append(tri)
        elif rec.geom_kind == 1:
            for tri in packet_triangles(rec, packet_layout):  # LOW-CONFIDENCE fallback
                tri = [_pt(p, scale) for p in tri]
                fill_triangle(fb, *tri, LOWCONF_COLOR)
                st['lowconf'] += 1
                if wire:
                    wires.append(tri)
    if wire:
        for tri in wires:
            for i in range(3):
                draw_line_clipped(fb, tri[i], tri[(i + 1) % 3], WIRE_COLOR)
            st['wire'] += 1
    return fb, st


def cmd_render(args, records, warnings, tx_records) -> int:
    if args.strict:
        rc = _strict_gate(args, warnings, records)
        if rc:
            return rc
    for w in warnings:
        print(f'warning: {w}', file=sys.stderr)
    tx_by_seq = {t.seq: t for t in tx_records}
    items = list(group_by_seq(records).items())
    if args.frames > 0:
        items = items[:args.frames]
    os.makedirs(args.out, exist_ok=True)
    for seq, rs in items:
        tex_ctx = None
        if args.texture:
            txrec = tx_by_seq.get(seq)
            if txrec is None:
                print(f'note: seq {seq}: no TX07 mirror record -> kind2 falls back to flat fill',
                      file=sys.stderr)
            elif not page_fits_vram(args.tpage, args.texmode):
                print(f'note: seq {seq}: tpage {args.tpage} page rect is outside the VRAM '
                      f'width for texmode {args.texmode} -> kind2 falls back to flat fill',
                      file=sys.stderr)
            else:
                mirror = VramMirror(txrec.mirror)
                clut = None if args.texmode == 2 else read_clut(mirror, txrec.clut_now)
                tex_ctx = {'mirror': mirror, 'clut': clut, 'txrec': txrec,
                           'tpage': args.tpage, 'mode': args.texmode}
        fb, st = render_frame(rs, args.width, args.height, wire=args.wire,
                              scale=args.scale, packet_layout=args.packet_layout,
                              texture_ctx=tex_ctx)
        path = os.path.join(args.out, f'frame_{seq:06d}.png')
        fb.to_image().save(path)
        note = '  [LOW-CONFIDENCE kind1 fallback]' if st['lowconf'] else ''
        if args.texture:
            note += f'  [texture: tpage={args.tpage} mode={args.texmode} ' \
                    f'textured={st["textured"]} uv_clamped={st["uv_clamped"]}' \
                    + ('' if tex_ctx is not None else '; no TEX ctx -> flat fill for kind2') + ']'
        print(f'{path}: {args.width}x{args.height}, {len(rs)} records, '
              f'tris filled={st["filled"]} alpha_skipped={st["alpha_skipped"]} '
              f'lowconf={st["lowconf"]} wire={st["wire"]}{note}')
    print(f'rendered {len(items)} frame(s) -> {args.out}')
    return 0


# --------------------------------------------------------------------------- CLI

def build_parser():
    ap = argparse.ArgumentParser(
        prog='ff8dump.py',
        description="Offline decoder v2 for FF8 battle draw-list dumps "
                    "(lot 13/14, magics 'ND07' + 'TX07', v8 writer contract).")
    sub = ap.add_subparsers(dest='cmd', required=True)
    p_info = sub.add_parser('info', help='per-frame and global stats')
    p_info.add_argument('dump')
    p_info.add_argument('--json', action='store_true', help='machine-readable output')
    p_info.add_argument('--strict', action='store_true',
                        help='fail (exit 3) if any resync/chain-break event is needed '
                             'or any ND07 build != 0x5638 '
                             '(expected: clean dumps from the fixed writer)')
    p_rend = sub.add_parser('render', help='software-raster each frame to PNG (painter order)')
    p_rend.add_argument('dump')
    p_rend.add_argument('--out', required=True, help='output directory for frame_XXXXXX.png')
    p_rend.add_argument('--frames', type=int, default=0, help='render only the first N frames (0 = all)')
    p_rend.add_argument('--width', type=int, default=640, help='viewport width (default 640)')
    p_rend.add_argument('--height', type=int, default=480, help='viewport height (default 480)')
    p_rend.add_argument('--wire', action='store_true', help='white wireframe overlay on top of the fill')
    p_rend.add_argument('--scale', type=float, default=1.0,
                        help='coordinate scale factor (scales coords only; raise --width/--height for a bigger PNG)')
    p_rend.add_argument('--packet-layout', choices=sorted(PACKET_LAYOUTS), default='packed',
                        help='kind1 coord layout (LOW-CONFIDENCE): packed = contiguous xy pairs @8/12/16; '
                             'psxq = Psy-Q POLY_FT3/FT4 stride-8 @8/16/24')
    p_rend.add_argument('--texture', action='store_true',
                        help='texture-map kind-2 triangles from the frame TX07 VRAM mirror '
                             '(v2 LIMITATION: all textured draws sample the --tpage page; '
                             'kind1 stays on the flat fallback)')
    p_rend.add_argument('--tpage', type=int, default=0,
                        help='virtual texture page 0..0x1F: x0=(t&0xF)*64, y0=((t>>4)&1)*256 (default 0)')
    p_rend.add_argument('--texmode', type=int, choices=(0, 1, 2), default=0, metavar='{0,1,2}',
                        help='texel mode: 0=4bpp CLUT, 1=8bpp CLUT, 2=16bpp RGB555 direct (default 0)')
    p_rend.add_argument('--strict', action='store_true',
                        help='fail (exit 3) if any resync/chain-break event is needed '
                             'or any ND07 build != 0x5638')
    return ap


def main(argv=None) -> int:
    args = build_parser().parse_args(argv)
    try:
        with open(args.dump, 'rb') as fh:
            data = fh.read()
    except OSError as e:
        print(f'error: cannot read {args.dump}: {e}', file=sys.stderr)
        return 2
    try:
        records, warnings, tx_records, tr_records = parse_dump(data)
    except DumpError as e:
        print(f'error: {e}', file=sys.stderr)
        return 2
    if not records and not tx_records:
        print('warning: 0 records (empty or headerless file)', file=sys.stderr)
    elif not records:
        print('warning: 0 ND07 records (TX07 mirror records only)', file=sys.stderr)
    return cmd_info(args, records, warnings, tx_records) \
        if args.cmd == 'info' else cmd_render(args, records, warnings, tx_records)


if __name__ == '__main__':
    sys.exit(main())
