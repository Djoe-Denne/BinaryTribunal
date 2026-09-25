#!/usr/bin/env python3
"""Offline self-test for the ff8dump decoder: synthetic dump -> info + render -> pixel checks.

No live data. Builds a synthetic dump with exactly 2 kind-2 records (1 red triangle,
1 blue quad via indices, both inside 640x480), runs the ff8dump CLI as a subprocess,
then verifies the output PROGRAMMATICALLY with PIL (pixel colors, PNG size, stats
fields) and prints SELFTEST PASS / FAIL. Also exercises the kind-1 LOW-CONFIDENCE
fallback and the truncated/bad-magic error paths. Exit code 0 on pass.

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

MAGIC = 0x3730444E
HDR = struct.Struct('<8I')

RED_TRIANGLE = dict(slot=51, verts=[(100, 100), (300, 100), (100, 300)], diffuse=0xFFFF0000)
BLUE_QUAD = dict(slot=47, verts=[(350, 200), (550, 200), (550, 400), (350, 400)],
                 diffuse=0xFF0000FF, indices=[0, 1, 2, 0, 2, 3, 1, 2, 3])  # 9 idx: ODD -> pad path


def vertex(x, y, diffuse, u=0.0, v=0.0):
    # FVF 0x1C4: f32 X,Y,Z,RHW; u32 DIFFUSE(ARGB); u32 SPECULAR; f32 U,V
    return struct.pack('<4f2I2f', x, y, 0.5, 1.0, diffuse, 0, u, v)


def kind2_payload(verts, indices):
    """Exact v7 writer layout: counts, u16 idx[], u16 pad[icount&1] zeros, fvf blob."""
    pad = b'\x00\x00' if len(indices) & 1 else b''
    return (struct.pack('<2I', len(verts), len(indices))
            + struct.pack(f'<{len(indices)}H', *indices) + pad
            + b''.join(vertex(x, y, diffuse) for x, y, diffuse in verts))


def kind1_payload(prim, pairs):
    packet = bytes(8) + b''.join(struct.pack('<hh', x, y) for x, y in pairs)
    packet += bytes(40 - len(packet))
    return struct.pack('<I', prim) + packet


def record(slot, seq, kind, payload):
    """v7 writer contract: payload_size counts node[24] + payload (record = 32 + psize)."""
    node = bytes(range(24))
    return HDR.pack(MAGIC, slot, seq, 0xCAFE, 0xBEEF00, kind, 0,
                    len(node) + len(payload)) + node + payload


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

    # ---- [2] render: PNG size + programmatic pixel checks
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
