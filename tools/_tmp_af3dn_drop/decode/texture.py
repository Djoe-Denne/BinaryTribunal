"""PSX VRAM mirror sampling (v2 texture path for ff8dump, magics ND07/TX07).

Pinned by gfx_driver_passthrough.c v8 (TX07 format block) and
driver-abi-spec.md section 6.2:

  * mirror = full VRAM: 1024 u16 columns x 512 rows (0x100000 bytes); the u16
    of vram word offset off = (row << 10) | col is stored LE at byte offset
    base + 2*off.
  * CLUT: the mirror itself contains the CLUT windows (the mirror IS the VRAM
    layout); clut_id = TX07.clut_now & 0x7FFF; read_clut() reads 256
    consecutive u16 starting at word offset (clut_id & 0x7FFF) << 5. The
    sub_45B920 sys-table derivation (base + 2048*(clut>>6) + 32*(clut&0x3F))
    agrees with this path when the mirror contains the CLUT row; the MIRROR
    path is authoritative for v2.
  * page geometry is VIRTUAL for v2 (user --tpage, default 0):
    x0 = (tpage & 0xF) * 64 u16 columns, y0 = ((tpage >> 4) & 1) * 256 rows,
    256x256 texels. TX07.page_probe is diagnostics-only (printed by
    ff8dump info; NO page-locating logic here). v2 LIMITATION: every textured
    draw of a frame samples this SAME page region (the ND07 record carries no
    per-node page pointer; TX07.page_probe covers only the FIRST textured
    node; multi-texture frames paint with that one context).
  * texel addressing (vramOff = (page_y + y) << 10 | page_x + (x >> (2 - mode)),
    u16 at base + 2*vramOff):
      mode 0 (4bpp):  4 texels per u16; 1 byte = 2 texels, LO nibble = even
                      ('left') texel; texel value -> clut[v].
      mode 1 (8bpp):  2 texels per u16 (1 B/texel, LE order); value -> clut[v].
      mode 2 (16bpp): the texel IS the RGB555 u16; no CLUT.
  * RGB555 -> RGB888 via <<3 | (bit>>2) (standard 5->8 expand).

Textured polygon fill (fill_triangle_textured): point-sampled barycentric
AFFINE UV interpolation -- no RHW perspective division. Documented v2
approximation: flat screen-space RHW traits make near-affine acceptable.
Out-of-range UVs are clamped to [0, 1] and counted (uv-clamp warning counter,
aggregated per record/frame by the caller). Diffuse modulates the sample
(pixel * diffuse/255, half-up); DIFFUSE alpha < ALPHA_MIN discard stays in
the caller for v1 skip-discard consistency.

Deterministic; stdlib + Pillow only (Pillow only inside raster's to_image).
"""
from __future__ import annotations

from math import floor
import struct

from raster import Framebuffer

WORDS_PER_ROW = 1024     # u16 per mirror row (pitch 0x800 bytes)
ROWS = 512
MIRROR_BYTES = WORDS_PER_ROW * ROWS * 2      # 0x100000
PAGE = 256               # texels per virtual page side (pinned v2 geometry)


def _round(v: float) -> int:
    """Half-up rounding -- mirrors raster's screen-coord convention."""
    return int(floor(v + 0.5))


class VramMirror:
    """Read-only view over one TX07 vram[0x100000] mirror (u16-major)."""

    __slots__ = ('data',)
    WORDS = WORDS_PER_ROW * ROWS              # 0x80000 u16 words

    def __init__(self, data: bytes):
        if len(data) != MIRROR_BYTES:
            raise ValueError(f'vram mirror must be {MIRROR_BYTES:#x} bytes '
                             f'(got {len(data):#x})')
        self.data = bytes(data)

    def u16(self, word_off: int) -> int:
        """u16 LE at mirror byte offset 2*word_off (vram word addressing)."""
        if not 0 <= word_off < self.WORDS:
            raise ValueError(f'vram word offset {word_off:#x} out of range '
                             f'[0, {self.WORDS:#x})')
        return struct.unpack_from('<H', self.data, word_off * 2)[0]

    def pixel(self, r: int, c: int) -> int:
        """vram word (row r, col c) -> u16 LE at byte offset 2*((r << 10) | c)."""
        if not (0 <= r < ROWS and 0 <= c < WORDS_PER_ROW):
            raise ValueError(f'pixel (r={r}, c={c}) out of range '
                             f'(rows 0..{ROWS - 1}, cols 0..{WORDS_PER_ROW - 1})')
        return struct.unpack_from('<H', self.data, ((r << 10) | c) * 2)[0]


def rgb555_to_rgb888(w: int):
    """RGB555 (bit 15 = STP, ignored) -> RGB888 via <<3 | (bit>>2) replication."""
    r = (w >> 10) & 0x1F
    g = (w >> 5) & 0x1F
    b = w & 0x1F
    return (r << 3 | (r >> 2), g << 3 | (g >> 2), b << 3 | (b >> 2))


def page_rect(tpage: int, mode: int):
    """Virtual page origin + u16 footprint for a tpage/mode pair.

    Pinned v2 page geometry: x0 = (tpage & 0xF) * 64 u16 columns,
    y0 = ((tpage >> 4) & 1) * 256 rows, 256x256 texels. The u16-column
    footprint is mode-scaled: 64 (4bpp), 128 (8bpp), 256 (16bpp).
    Raises ValueError on out-of-range tpage/mode.
    """
    if not 0 <= tpage <= 0x1F:
        raise ValueError('tpage must be 0..0x1F')
    if mode not in (0, 1, 2):
        raise ValueError('mode must be 0 (4bpp), 1 (8bpp) or 2 (16bpp)')
    return (tpage & 0xF) * 64, ((tpage >> 4) & 1) * 256, 256 >> (2 - mode)


def page_fits_vram(tpage: int, mode: int) -> bool:
    """True when the virtual page rect fits inside the 1024-u16-wide mirror.

    The pinned x0 = (tpage & 0xF) * 64 geometry overflows the right edge for
    16bpp pages with tpage&0xF >= 13 (256+ u16 footprint). The caller checks
    this once per frame: out-of-vram pages fall back to flat fill.
    """
    col0, _row0, cols = page_rect(tpage, mode)
    return col0 + cols - 1 < WORDS_PER_ROW


def read_clut(mirror: VramMirror, clut_id: int):
    """256 consecutive u16 at word offset (clut_id & 0x7FFF) << 5 in the mirror.

    The mirror IS the VRAM layout, so CLUT entries are accessed with the same
    +2*off word addressing as pixels (authoritative v2 path). Raises
    ValueError if the window would run past the mirror.
    """
    base = (clut_id & 0x7FFF) << 5        # u16 units (pinned v2 math)
    if base + 256 > mirror.WORDS:
        raise ValueError(f'clut window out of range: id 0x{clut_id & 0x7FFF:X} '
                         f'-> word base {base:#x}+256 > {mirror.WORDS:#x}')
    return [mirror.u16(base + i) for i in range(256)]


def read_clut_sys_row(sys_row: bytes, clut_id: int):
    """16 u16 palette at sys_clut_row[(clut_id & 0x3F) * 32] (32 bytes/entry row).

    v9 path: TX07's sys_clut_row = the engine's system-CLUT band
    (&unk_1B47818 + 2048*(clut>>6), 64 x 32-byte palettes per band). This
    reads the 16-color palette for `clut_id` inside that band; returns None
    when the band is absent (v8 record) or the row does not match the id
    (multi-band frames: caller falls back to the mirror read_clut).
    """
    if not sys_row or len(sys_row) < 2048:
        return None
    base = (clut_id & 0x3F) * 32
    return list(struct.unpack_from('<16H', sys_row, base))


def sample_page(mirror: VramMirror, tpage: int, x: int, y: int, mode: int, clut=None):
    """Sample one texel from the virtual page -> (r, g, b) 0..255.

    Modes 0/1 need `clut` (a read_clut() list of 256 u16); when omitted they
    fall back to clut id 0 (documented v2 default -- the caller normally
    passes read_clut(mirror, tx.clut_now)). Mode 2 ignores clut.
    """
    if not 0 <= x < PAGE or not 0 <= y < PAGE:
        # point-sampling edge rule: UV carries exclusive upper bound (U < 1.0
        # maps to last texel); a UV == 1.0 after float rounding maps to texel
        # PAGE, well documented by GC消费 pixels — clamp to PAGE-1 (fringe fix).
        if x in (PAGE, -1) or y in (PAGE, -1):
            x = max(0, min(x, PAGE - 1))
            y = max(0, min(y, PAGE - 1))
        else:
            raise ValueError(f'page texel ({x}, {y}) out of range [0, {PAGE})')
    col0, row0, _cols = page_rect(tpage, mode)
    w = mirror.u16(((row0 + y) << 10) | (col0 + (x >> (2 - mode))) )
    if mode == 0:
        b = (w >> (8 * ((x >> 1) & 1))) & 0xFF
        v = (b >> ((x & 1) * 4)) & 0xF        # lo nibble = even ('left') texel
    elif mode == 1:
        v = (w >> (8 * (x & 1))) & 0xFF
    else:
        return rgb555_to_rgb888(w)            # 16bpp: direct RGB555, no CLUT
    if clut is None:
        clut = read_clut(mirror, 0)
    return rgb555_to_rgb888(clut[v])


def fill_triangle_textured(fb: Framebuffer, tri, uvs, diffuse_rgb,
                           mirror: VramMirror, tpage: int, mode: int, clut=None,
                           txrec=None, node_clut=None):
    """Point-sampled textured fill of one screen-space float triangle.

    tri: 3 (x, y) float screen coords (same convention as raster.fill_triangle;
    no polygon clip -- the integer bbox is clamped to the viewport and
    Framebuffer.put drops out-of-range pixels);
    uvs: 3 (u, v) floats from the FVF Tu/Tv fields; OUT-OF-RANGE values are
    clamped to [0, 1] and counted (v2 approximation note: strict_final-era
    full-canvas patterns like u=0.875/0.75/0.969 are < 1.0 anyway);
    diffuse_rgb: flat (r, g, b) 0..255 multiplier (v1-style first vertex).

    UV interpolation is barycentric AFFINE on the 3 vertices -- no /RHW
    perspective (v2 approximation, flat screen-space RHW). Edge-inclusive
    fill (all edge functions >= 0) matches raster's flat fill rule.

    Returns (filled, clamped): filled = 1 when any pixel was written;
    clamped = number of pixels whose UV needed clamping.
    """
    filled, clamped = 0, 0
    # v9 per-node palette resolution: 4bpp/8bpp palettes live in the SYSTEM
    # CLUT table (16-color grain, 32 B per clut id), NOT in the VRAM mirror.
    # `clut` (list) = the v8 mirror fallback (frame CLUT); `node_clut` (int) =
    # the ND08 footer's per-node clut id. When the node's band matches the
    # TX07-captured sys row, the 16-color palette replaces the fallback list.
    pal = clut
    if node_clut and txrec is not None and getattr(txrec, 'sys_clut_row', b''):
        node_id = node_clut & 0x7FFF
        row_id = (txrec.clut_now & 0x7FFF) >> 6
        if (node_id >> 6) == row_id:
            band = read_clut_sys_row(txrec.sys_clut_row, node_id)
            if band is not None:
                pal = band * 16  # 16 entries x16 = 256 slots (index <16 wraps)
    pts = [(_round(p[0]), _round(p[1])) for p in tri]
    (x0, y0), (x1, y1), (x2, y2) = pts
    area = (x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0)
    if area == 0:
        return 0, 0
    (u0, v0), (u1, v1), (u2, v2) = uvs
    if area < 0:  # orient CCW so "inside" == all edge functions >= 0
        x1, y1, x2, y2 = x2, y2, x1, y1
        (u1, v1), (u2, v2) = (u2, v2), (u1, v1)
        area = -area
    minx = max(0, min(x0, x1, x2))
    maxx = min(fb.w - 1, max(x0, x1, x2))
    miny = max(0, min(y0, y1, y2))
    maxy = min(fb.h - 1, max(y0, y1, y2))
    if minx > maxx or miny > maxy:
        return 0, 0
    # Edge functions with per-row/per-pixel increments (uint trick as raster).
    a0, b0 = y1 - y2, x2 - x1
    a1, b1 = y2 - y0, x0 - x2
    a2, b2 = y0 - y1, x1 - x0
    w0 = (x2 - x1) * (miny - y1) - (y2 - y1) * (minx - x1)
    w1 = (x0 - x2) * (miny - y2) - (y0 - y2) * (minx - x2)
    w2 = (x1 - x0) * (miny - y0) - (y1 - y0) * (minx - x0)
    dr, dg, db = diffuse_rgb
    for y in range(miny, maxy + 1):
        e0, e1, e2, row = w0, w1, w2, y * fb.w
        for x in range(minx, maxx + 1):
            if (e0 | e1 | e2) >= 0:
                uf = (e0 * u0 + e1 * u1 + e2 * u2) / area
                vf = (e0 * v0 + e1 * v1 + e2 * v2) / area
                cu = uf < 0.0 or uf > 1.0
                cv = vf < 0.0 or vf > 1.0
                if cu or cv:
                    clamped += 1
                    uf = 0.0 if uf < 0.0 else (1.0 if uf > 1.0 else uf)
                    vf = 0.0 if vf < 0.0 else (1.0 if vf > 1.0 else vf)
                r, g, b = sample_page(mirror, tpage, int(uf * PAGE), int(vf * PAGE),
                                      mode, clut)
                fb.put(x, y, ((r * dr + 127) // 255,
                              (g * dg + 127) // 255,
                              (b * db + 127) // 255))
                filled = 1
            e0 += a0
            e1 += a1
            e2 += a2
        w0 += b0
        w1 += b1
        w2 += b2
    return filled, clamped
