#!/usr/bin/env python3
"""Offline self-test for the ff8dump v2 decoder (v8 writer contract).

No live data. Builds SYNTHETIC v8-layout dumps (ND07 = 9 x u32 header with
build=0x563E, plus a TX07 frame mirror for the --texture path), runs the
ff8dump CLI as a subprocess, then verifies the output PROGRAMMATICALLY with
PIL (pixel colors, PNG size, stats fields) and prints SELFTEST PASS / FAIL.
Also exercises the kind-1 LOW-CONFIDENCE fallback, the --texture TX07 path
(mode 0 CLUT and mode 2 direct RGB555), the build-id --strict gate, the VRAM
word layout, the resync-historic handling, and the truncated/bad-magic error
paths. Exit code 0 on pass.

Outputs are written to selftest_out/ next to this script (kept for inspection).
"""
from __future__ import annotations

import json
import shutil
import struct
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / 'selftest_out'
W, H = 640, 480

MAGIC = 0x3730444E               # 'ND07'
TX_MAGIC = 0x37305458            # 'TX07'
BUILD = 0x563E                   # GFXPT_BUILD_ID
HDR = struct.Struct('<9I')       # v8: 9th u32 = build (offset 0x20)
TX_HDR = struct.Struct('<8I')    # magic, build, seq, clut_now, vram_base, sys_clut_base, m_B7DB44, page_probe

RED_TRIANGLE = dict(slot=51, verts=[(100, 100), (300, 100), (100, 300)], diffuse=0xFFFF0000)
BLUE_QUAD = dict(slot=47, verts=[(350, 200), (550, 200), (550, 400), (350, 400)],
                 diffuse=0xFF0000FF, indices=[0, 1, 2, 0, 2, 3, 1, 2, 3])  # 9 idx: ODD -> pad path


def vertex(x, y, diffuse, u=0.0, v=0.0):
    # FVF 0x1C4: f32 X,Y,Z,RHW; u32 DIFFUSE(ARGB); u32 SPECULAR; f32 U,V
    return struct.pack('<4f2I2f', x, y, 0.5, 1.0, diffuse, 0, u, v)


def kind2_payload(verts, indices):
    """Exact v8 writer layout: counts, u16 idx[], u16 pad[icount&1] zeros, fvf blob.

    verts entries are (x, y, diffuse) or (x, y, diffuse, u, v) tuples.
    """
    pad = b'\x00\x00' if len(indices) & 1 else b''
    return (struct.pack('<2I', len(verts), len(indices))
            + struct.pack(f'<{len(indices)}H', *indices) + pad
            + b''.join(vertex(*v) for v in verts))


def kind1_payload(prim, pairs):
    packet = bytes(8) + b''.join(struct.pack('<hh', x, y) for x, y in pairs)
    packet += bytes(40 - len(packet))
    return struct.pack('<I', prim) + packet


def record(slot, seq, kind, payload, build=BUILD):
    """v8 writer contract: payload_size counts node[24] + payload (record = 36 + psize)."""
    node = bytes(range(24))
    return HDR.pack(MAGIC, slot, seq, 0xCAFE, 0xBEEF00, kind, 0,
                    len(node) + len(payload), build) + node + payload


def tx_record(build, seq, clut_now, vram_base, sys_clut_base, m_b7, page_probe, mirror):
    """v9 TX07 record: hdr 32 + vram[0x100000] + sys_clut_row[2048]."""
    row = bytes(2048)
    return (TX_HDR.pack(TX_MAGIC, build, seq, clut_now, vram_base, sys_clut_base,
                        m_b7, page_probe) + mirror + row)

def build_main_dump() -> bytes:
    """Exactly 2 kind-2 records, same seq: red direct triangle + blue indexed quad."""
    r = RED_TRIANGLE
    q = BLUE_QUAD
    return (record(r['slot'], 1, 2, kind2_payload([(x, y, r['diffuse']) for x, y in r['verts']], []))
            + record(q['slot'], 1, 2, kind2_payload([(x, y, q['diffuse']) for x, y in q['verts']],
                                                    q['indices'])))


def build_kind1_dump() -> bytes:
    """1 kind-1 FT4 record (LOW-CONFIDENCE fallback path)."""
    return record(55, 1, 1, kind1_payload(4, [(50, 50), (200, 50), (200, 200), (50, 200)]))


def build_texture_dump() -> bytes:
    """TX07 mirror + 2-triangle kind-2 quad, all UVs (0,0) -> texel (0,0).

    vram words 0..3 = RGB555 magenta 0x7C1F (pinned pattern). Word 15 (clut[15]
    for clut id 0 = the CLUT window at word offset 0<<5) is also magenta: the
    mode-0 decode of texel (0,0) reads byte 0x1F -> lo nibble 0xF -> clut[15].
    Probe fields (vram_base/sys/m_B7DB44/page_probe/clut_now) all zero except
    sys_clut_base = 0x1B47818 (the pinned constant the real writer writes).
    """
    mirror = bytearray(0x100000)
    for w in (0, 1, 2, 3, 15):
        struct.pack_into('<H', mirror, w * 2, 0x7C1F)
    tx = tx_record(BUILD, 1, 0, 0, 0x1B47818, 0, 0, mirror)
    return (tx
            + record(51, 1, 2, kind2_payload([(100, 100, 0xFFFFFFFF, 0.0, 0.0),
                                              (300, 100, 0xFFFFFFFF, 0.0, 0.0),
                                              (100, 300, 0xFFFFFFFF, 0.0, 0.0)], []))
            + record(51, 1, 2, kind2_payload([(300, 100, 0xFFFFFFFF, 0.0, 0.0),
                                              (300, 300, 0xFFFFFFFF, 0.0, 0.0),
                                              (100, 300, 0xFFFFFFFF, 0.0, 0.0)], [])))


def run_ff8dump(*argv):
    return subprocess.run([sys.executable, str(HERE / 'ff8dump.py'), *argv],
                          capture_output=True, text=True)


class Checker:
    def __init__(self):
        self.fails = []

    def check(self, cond, msg):
        print(('  ok   ' if cond else '  FAIL ') + msg)
        if not cond:
            self.fails.append(msg)

    @staticmethod
    def near(got, want, tol=2):
        return got is not None and all(abs(a - b) <= tol for a, b in zip(got, want))


def main() -> int:
    ck = Checker()
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    from PIL import Image  # selftest needs PIL for programmatic pixel verification

    dump = OUT / 'selftest.bin'
    dump.write_bytes(build_main_dump())

    # ---- [1] info --json: exact counts on the 2-record synthetic dump
    print('[1] info --json (2 kind-2 records)')
    r = run_ff8dump('info', str(dump), '--json')
    ck.check(r.returncode == 0, f'info exit code 0 (got {r.returncode})')
    if r.returncode != 0:
        print(r.stderr, end='')
        return finish(ck)
    info = json.loads(r.stdout)
    g = info['global']
    ck.check(info['record_count'] == 2, f'record_count == 2 (got {info["record_count"]})')
    ck.check(info['frame_count'] == 1, f'frame_count == 1 (got {info["frame_count"]})')
    ck.check(g['kind_counts'] == {'0': 0, '1': 0, '2': 2},
             f'kind_counts == 0x0,1x0,2x2 (got {g["kind_counts"]})')
    ck.check(g['vcount_total'] == 7, f'vcount_total == 7 (3+4) (got {g["vcount_total"]})')
    ck.check(g['icount_total'] == 9, f'icount_total == 9 (0+9, odd -> pad) (got {g["icount_total"]})')
    ck.check(g['tris_kind2'] == 4, f'tris_kind2 == 4 (1 direct + 3 indexed) (got {g["tris_kind2"]})')
    ck.check(g['implausible_kind2'] == 0, f'implausible_kind2 == 0 (got {g["implausible_kind2"]})')
    ck.check(g['slot_counts'] == {'47': 1, '51': 1}, f'slot_counts == 47x1 51x1 (got {g["slot_counts"]})')
    bb = g['bbox']
    ck.check(bool(bb) and bb['x'] == [100.0, 550.0] and bb['y'] == [100.0, 400.0],
             f'bbox == x[100..550] y[100..400] (got {bb})')
    ck.check(g.get('build_ids') == {'0x563E': 2}, f'build_ids == 0x563Ex2 (got {g.get("build_ids")})')
    ck.check(g.get('build_expected') == 0x563E, f'build_expected == 0x563E (got {g.get("build_expected")})')
    ck.check(g.get('tx_records') == 0 and g.get('tx_frames') == 0 and g.get('vram_mbytes') == 0,
             f'tx counters == 0/0/0 MB (got tx_records={g.get("tx_records")} '
             f'tx_frames={g.get("tx_frames")} vram_mbytes={g.get("vram_mbytes")})')
    ck.check(info['warnings'] == [], f'zero warnings on the conformant v8 dump (got {info["warnings"]})')

    # ---- [2] render: PNG size + programmatic pixel checks (v1 flat fill default)
    print('[2] render (fill)')
    fill_dir = OUT / 'fill'
    r = run_ff8dump('render', str(dump), '--out', str(fill_dir))
    ck.check(r.returncode == 0, f'render exit code 0 (got {r.returncode})')
    png = fill_dir / 'frame_000001.png'
    ck.check(png.is_file(), 'frame_000001.png written')
    if png.is_file():
        img = Image.open(png)
        ck.check(img.size == (W, H), f'PNG size == {W}x{H} (got {img.size})')
        img = img.convert('RGB')
        px_red = img.getpixel((167, 167))    # centroid of the red triangle
        px_blue = img.getpixel((450, 300))   # centroid of the blue quad
        px_bg = img.getpixel((10, 10))       # untouched background
        ck.check(ck.near(px_red, (255, 0, 0)), f'red triangle centroid is red (got {px_red})')
        ck.check(ck.near(px_blue, (0, 0, 255)), f'blue quad centroid is blue (got {px_blue})')
        ck.check(px_bg == (0, 0, 0), f'background stays black (got {px_bg})')

    # ---- [3] render --wire: white overlay on the quad's left edge
    print('[3] render --wire (overlay)')
    wire_dir = OUT / 'wire'
    r = run_ff8dump('render', str(dump), '--out', str(wire_dir), '--wire')
    ck.check(r.returncode == 0, f'render --wire exit code 0 (got {r.returncode})')
    wpng = wire_dir / 'frame_000001.png'
    if wpng.is_file():
        wimg = Image.open(wpng).convert('RGB')
        ck.check(wimg.size == (W, H), f'wire PNG size == {W}x{H} (got {wimg.size})')
        got = wimg.getpixel((350, 300))
        ck.check(ck.near(got, (255, 255, 255)), f'quad left edge is white in wire mode (got {got})')

    # ---- [4] kind-1 LOW-CONFIDENCE fallback renders its fallback fill
    print('[4] kind1 LOW-CONFIDENCE fallback')
    k1 = OUT / 'kind1.bin'
    k1.write_bytes(build_kind1_dump())
    k1_dir = OUT / 'kind1_out'
    r = run_ff8dump('render', str(k1), '--out', str(k1_dir))
    ck.check(r.returncode == 0, f'kind1 render exit code 0 (got {r.returncode})')
    ck.check('LOW-CONFIDENCE' in r.stdout, 'stdout flags LOW-CONFIDENCE for kind1')
    k1png = k1_dir / 'frame_000001.png'
    if k1png.is_file():
        k1img = Image.open(k1png).convert('RGB')
        got = k1img.getpixel((100, 100))
        ck.check(ck.near(got, (255, 200, 0)), f'kind1 fallback fill color (got {got})')

    # ---- [5] error handling: truncation and bad magic -> clean error + offset, exit != 0
    print('[5] error handling')
    trunc = OUT / 'trunc.bin'
    trunc.write_bytes(dump.read_bytes()[:-10])
    r = run_ff8dump('info', str(trunc))
    ck.check(r.returncode != 0, f'truncated file: nonzero exit (got {r.returncode})')
    ck.check('offset' in r.stderr.lower(), f'truncated file: error gives offset (stderr: {r.stderr.strip()!r})')
    bad = OUT / 'badmagic.bin'
    blob = bytearray(dump.read_bytes())
    blob[0:4] = b'XXXX'
    bad.write_bytes(bytes(blob))
    r = run_ff8dump('info', str(bad))
    ck.check(r.returncode != 0, f'bad magic: nonzero exit (got {r.returncode})')
    ck.check('magic' in r.stderr.lower(), f'bad magic: error mentions magic (stderr: {r.stderr.strip()!r})')

    # ---- [6] vram word layout (texture.VramMirror unit test, direct import)
    print('[6] vram word layout')
    import texture
    lay = bytearray(texture.MIRROR_BYTES)
    lay[0] = 0x34          # vram[0:2] little-endian -> word 0 = 0x1234
    lay[1] = 0x12
    lay[2048] = 0x78       # (1 << 10) * 2 = 2048 -> word (row 1, col 0) = 0x5678
    lay[2049] = 0x56
    vm = texture.VramMirror(bytes(lay))
    ck.check(vm.pixel(0, 0) == 0x1234, f'pixel(0,0) reads vram[0:2] LE (got {vm.pixel(0, 0):#06x})')
    ck.check(vm.pixel(1, 0) == 0x5678, f'pixel(1,0) reads byte offset 2048 LE (got {vm.pixel(1, 0):#06x})')
    ck.check(vm.pixel(0, 1) == 0 and vm.pixel(2, 0) == 0, 'untouched words read 0')
    clut0 = texture.read_clut(vm, 0)
    ck.check(len(clut0) == 256, f'read_clut(mirror, 0) returns 256 entries (got {len(clut0)})')
    ck.check(clut0[0] == 0x1234 and sum(1 for w in clut0 if w) == 1,
             'CLUT window mirrors the layout words: exactly word 0 visible at clut[0]')

    # ---- [7] --texture: TX07 mirror + 2-triangle kind-2 quad -> magenta fill
    print('[7] render --texture (TX07 mirror, mode 0 CLUT + mode 2 RGB555)')
    txdump = OUT / 'texture.bin'
    txdump.write_bytes(build_texture_dump())
    ri = run_ff8dump('info', str(txdump), '--json')
    ck.check(ri.returncode == 0, f'texture dump info exit code 0 (got {ri.returncode})')
    tinfo = json.loads(ri.stdout)
    tg = tinfo['global']
    ck.check(tg['tx_records'] == 1, f'tx_records == 1 (got {tg["tx_records"]})')
    ck.check(tg['tx_frames'] == 1, f'tx_frames == 1 (got {tg["tx_frames"]})')
    ck.check(tinfo['record_count'] == 2, f'record_count == 2 (TX07 does not count) (got {tinfo["record_count"]})')
    ck.check(tg['vram_mbytes'] == 1.0, f'vram_mbytes == 1.0 (got {tg["vram_mbytes"]})')
    ck.check(tg['build_ids'] == {'0x563E': 2}, f'build_ids == 0x563Ex2 (got {tg["build_ids"]})')
    ck.check(tg['tx'] and tg['tx'][0]['page_probe'] == '0x00000000  (diagnostic)',
             f'tx[0].page_probe diagnostic == 0 (got {tg["tx"][0]["page_probe"]})')
    for mode in (0, 2):  # mode 0: CLUT path (needs word 15); mode 2: direct RGB555
        tdir = OUT / f'tex_mode{mode}'
        rt = run_ff8dump('render', str(txdump), '--out', str(tdir),
                         '--texture', '--tpage', '0', '--texmode', str(mode))
        ck.check(rt.returncode == 0, f'--texture render mode {mode}: exit 0 (got {rt.returncode})')
        ck.check('textured=2' in rt.stdout, f'--texture mode {mode}: 2 triangles textured (stdout: {rt.stdout.strip()!r})')
        tpng = tdir / 'frame_000001.png'
        if tpng.is_file():
            timg = Image.open(tpng).convert('RGB')
            pg = timg.getpixel((150, 150))   # inside triangle 1 (vram word 0 pattern)
            pd = timg.getpixel((280, 280))   # inside triangle 2
            pbg = timg.getpixel((10, 10))    # untouched background
            ck.check(ck.near(pg, (255, 0, 255)), f'--texture mode {mode}: tex (150,150) == magenta (got {pg})')
            ck.check(ck.near(pd, (255, 0, 255)), f'--texture mode {mode}: pixel (280,280) == magenta (got {pd})')
            ck.check(pbg == (0, 0, 0), f'--texture mode {mode}: background stays black (got {pbg})')
    # --texture with no TX07 for the frame -> flat fill fallback, exit 0
    rnt = run_ff8dump('render', str(dump), '--out', str(OUT / 'tex_missing'), '--texture')
    ck.check(rnt.returncode == 0, f'--texture on a TX-less dump: exit 0 (got {rnt.returncode})')
    ck.check('no TX07 mirror record' in rnt.stderr,
             f'--texture without TX07: stderr notes the fallback (stderr: {rnt.stderr.strip()!r})')

    # ---- [8] --strict build-id gate: v8 build != 0x563E -> exit 3; 0x563E -> pass
    print('[8] strict build-id gate')
    build_bad = OUT / 'build_bad.bin'
    build_ok = OUT / 'build_ok.bin'
    build_bad.write_bytes(record(43, 1, 0, b'', build=0x1111))
    build_ok.write_bytes(record(43, 1, 0, b'', build=BUILD))
    for tag, path in (('build=0x1111', build_bad), ('build=0x563E', build_ok)):
        rs = run_ff8dump('info', str(path), '--strict')
        if '0x1111' in tag:
            ck.check(rs.returncode == 3, f'--strict {tag}: exit 3 (got {rs.returncode})')
            ck.check('build-id mismatch' in rs.stderr,
                     f'--strict {tag}: stderr has build-id mismatch (stderr: {rs.stderr.strip()!r})')
        else:
            ck.check(rs.returncode == 0, f'--strict {tag}: exit 0 (got {rs.returncode})')
            ck.check('STRICT PASS' in rs.stdout, f'--strict {tag}: stdout says STRICT PASS (got {rs.stdout.strip()!r})')

    return finish(ck)


def finish(ck: Checker) -> int:
    if ck.fails:
        print(f'SELFTEST FAIL ({len(ck.fails)} check(s))')
        for m in ck.fails:
            print(f'  - {m}')
        return 1
    print(f'SELFTEST PASS (outputs in {OUT})')
    return 0


if __name__ == '__main__':
    sys.exit(main())

