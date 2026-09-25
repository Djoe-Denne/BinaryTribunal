#!/usr/bin/env python3
"""FF8 battle draw-list dump decoder (lot 13, magic 'ND07'): info stats + software render.

Dump contract (pinned for the parallel v7 DLL): little-endian stream of per-node
records, no global header. Record order inside one `seq` frame == exact draw order
(painter's algorithm, no z-buffer): slots 43..64 are invoked PER NODE by
Gfx_WalkDrawList, next pointer at node+0
(docs/tech/investigation/battle-static-discovery/decomp/0x4178D7__Gfx_WalkDrawList.md).

Geometry:
  kind 2 = FVF 0x1C4 (XYZRHW|DIFFUSE|SPECULAR|TEX1) TRIANGLELIST, 32-byte vertices,
           already in screen space (0x43E24A__RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4.md).
  kind 1 = PSX poly packet, POLY_FT3 32B / FT4 40B (driver-abi-spec.md section 8).
           v1 does a LOW-CONFIDENCE 2D fallback read of the screen coords.
  kind 0 = node captured with no geometry.

Record layout (v7 writer contract, see driver-passthrough gfx_driver_passthrough.c):
  u32 magic 'ND07' (0x3730444E); u32 slot (43..64); u32 seq; u32 ctx; u32 node_addr;
  u32 geom_kind (0/1/2); u32 fails; u32 payload_size -- payload_size counts ALL bytes
  after this field: node[24] + kind payload. Total record = 32 + payload_size.
  u8 node[24]; payload:
    kind 0: none
    kind 1: u32 prim (3=FT3, 4=FT4); u8 packet[40]
    kind 2: u32 vcount; u32 icount; u16 idx[icount]; u16 pad[icount & 1] (zeros,
            4-byte alignment of the fvf blob); u8 fvf[vcount*32]

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

MAGIC = 0x3730444E               # 'ND07' little-endian
HDR = struct.Struct('<8I')       # magic, slot, seq, ctx, node_addr, geom_kind, fails, payload_size
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
    prim: int = 0         # kind1: 3=FT3, 4=FT4
    packet: bytes = b''   # kind1: raw 40-byte packet (LOW-CONFIDENCE layout)
    vcount: int = 0       # kind2
    icount: int = 0
    indices: bytes = b''  # kind2: raw u16 LE index array
    fvf: bytes = b''      # kind2: raw vcount*32 vertex blob
    idx_repaired: bool = False  # indices rebuilt from quad-strip pattern (post-consumption capture)


def parse_dump(data: bytes):
    """Parse the whole record stream. Raises DumpError on bad magic or truncation."""
    records, warnings = [], []
    pos, n = 0, len(data)
    while pos < n:
        base = pos
        if n - pos < HDR.size:
            raise DumpError(f'truncated record header (need {HDR.size} bytes, have {n - pos})', pos)
        magic, slot, seq, ctx, node_addr, kind, fails, psize = HDR.unpack_from(data, pos)
        if magic != MAGIC:
            raise DumpError(f"bad magic 0x{magic:08X} (expected 0x{MAGIC:08X} 'ND07')", pos)
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
        declared_end = node_start + psize
        actual_end = None
        skew = 0
        MAGIC_BYTES = struct.pack('<I', MAGIC)

        def _cand_ok(off):
            if off + HDR.size > n:
                return False
            m2, s2, q2, c2, a2, k2, f2, p2 = struct.unpack_from('<8I', data, off)
            if not (m2 == MAGIC and 43 <= s2 <= 64 and k2 <= 2 and p2 <= 262144):
                return False
            if k2 == 2 and off + HDR.size + NODE_SIZE + 8 <= n:
                vc2, ic2 = struct.unpack_from('<2I', data, off + HDR.size + NODE_SIZE)
                if vc2 > 4096 or ic2 > 16384:
                    return False
            return True

        if _cand_ok(declared_end):
            actual_end = declared_end
        else:
            found = -1
            if declared_end < n:
                for probe in range(declared_end, min(declared_end + 256, n - 3)):
                    if data[probe:probe + 4] == MAGIC_BYTES and _cand_ok(probe):
                        found = probe
                        break
                if found < 0:
                    # self-heal: chain desync (historic writer) — resume at the next
                    # structurally valid record, dropping ambiguous in-between bytes.
                    for probe in range(declared_end, n - 3):
                        if data[probe:probe + 4] == MAGIC_BYTES and _cand_ok(probe):
                            found = probe
                            break
            if found < 0:
                if declared_end <= n <= declared_end + 16:
                    actual_end = n
                    skew = actual_end - declared_end
                else:
                    raise DumpError(f'truncated record (declared {psize} bytes after header, '
                                    f'have {n - node_start})', node_start)
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
        rec = Record(base, slot, seq, ctx, node_addr, kind, fails, node)
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
    return records, warnings


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


def stats(records):
    kinds = Counter(r.geom_kind for r in records)
    slots = Counter(r.slot for r in records)
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


def cmd_info(args, records, warnings) -> int:
    frames = group_by_seq(records)
    glob = stats(records)
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


def render_frame(records, width, height, wire=False, scale=1.0, packet_layout='packed'):
    """One frame: fill triangles in record order (painter), then optional white wire overlay.

    Returns (Framebuffer, render_stats dict).
    """
    fb = Framebuffer(width, height)
    st = {'filled': 0, 'alpha_skipped': 0, 'lowconf': 0, 'wire': 0, 'nan_skipped': 0}
    wires = []
    for rec in records:
        if rec.geom_kind == 2:
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


def cmd_render(args, records, warnings) -> int:
    for w in warnings:
        print(f'warning: {w}', file=sys.stderr)
    items = list(group_by_seq(records).items())
    if args.frames > 0:
        items = items[:args.frames]
    os.makedirs(args.out, exist_ok=True)
    for seq, rs in items:
        fb, st = render_frame(rs, args.width, args.height, wire=args.wire,
                              scale=args.scale, packet_layout=args.packet_layout)
        path = os.path.join(args.out, f'frame_{seq:06d}.png')
        fb.to_image().save(path)
        note = '  [LOW-CONFIDENCE kind1 fallback]' if st['lowconf'] else ''
        print(f'{path}: {args.width}x{args.height}, {len(rs)} records, '
              f'tris filled={st["filled"]} alpha_skipped={st["alpha_skipped"]} '
              f'lowconf={st["lowconf"]} wire={st["wire"]}{note}')
    print(f'rendered {len(items)} frame(s) -> {args.out}')
    return 0


# --------------------------------------------------------------------------- CLI

def build_parser():
    ap = argparse.ArgumentParser(
        prog='ff8dump.py',
        description="Offline decoder for FF8 battle draw-list dumps (lot 13, magic 'ND07').")
    sub = ap.add_subparsers(dest='cmd', required=True)
    p_info = sub.add_parser('info', help='per-frame and global stats')
    p_info.add_argument('dump')
    p_info.add_argument('--json', action='store_true', help='machine-readable output')
    p_rend = sub.add_parser('render', help='software-raster each frame to PNG (painter order, flat fill)')
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
        records, warnings = parse_dump(data)
    except DumpError as e:
        print(f'error: {e}', file=sys.stderr)
        return 2
    if not records:
        print('warning: 0 records (empty or headerless file)', file=sys.stderr)
    return cmd_info(args, records, warnings) if args.cmd == 'info' else cmd_render(args, records, warnings)


if __name__ == '__main__':
    sys.exit(main())
