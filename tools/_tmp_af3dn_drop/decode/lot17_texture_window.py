"""Offline texture-window/actor CLUT rules from CLOSURE_tim-vram-tpage.md.

None means missing evidence; window word zero means the observed LUT path.
The comparison /255 convention is u8/255 * (256/W, 256/H) for an active
window, u8/255 otherwise. It is an experimental convention, not a claim
about a particular FFNx implementation or about missing capture state.
"""
from dataclasses import dataclass
import math
import struct

import numpy as np

from texture import rgb555_to_rgb888

MIRROR_SIZE = 1024 * 512 * 2
ROW_BYTES = 2048


class MissingEvidence(ValueError):
    """A requested conversion needs information absent from the capture."""


@dataclass(frozen=True)
class TextureWindow:
    word: int
    x: int
    y: int
    width: int
    height: int
    active: bool

    @classmethod
    def from_word(cls, word):
        if not isinstance(word, int) or not 0 <= word <= 0xFFFFFFFF:
            raise ValueError('window word must be a u32')
        x, y = (word >> 7) & 0xF8, (word >> 12) & 0xF8
        width = min(256 - (word & 31) * 8, 256 - x)
        height = min(256 - ((word >> 5) & 31) * 8, 256 - y)
        return cls(word, x, y, width, height, bool(word & 0xFFFFFF))


def convert_uv(u, v, *, provenance, mode='exact', window_word=None):
    if mode not in ('exact', 'corrected255'):
        raise ValueError('unknown UV mode')
    if not all(math.isfinite(float(x)) for x in (u, v)):
        raise ValueError('UVs must be finite')
    if provenance == 'final_f32':
        if mode != 'exact':
            raise MissingEvidence('CORRECTED /255 requires original u8 UVs')
        return u, v  # no clamp, rounding, offset, scale or LUT inversion
    if provenance != 'u8':
        raise ValueError('UV provenance must be u8 or final_f32')
    if any(int(x) != x or not 0 <= x <= 255 for x in (u, v)):
        raise ValueError('raw UVs must be integral bytes')
    if window_word is None:
        raise MissingEvidence('window word/latch is UNPROVEN')
    win = TextureWindow.from_word(window_word)
    if mode == 'corrected255':
        sx, sy = (256 / win.width, 256 / win.height) if win.active else (1, 1)
        return u / 255 * sx, v / 255 * sy
    if win.active:
        return u / win.width, v / win.height
    return max(1, min(254, u)) / 256, max(1, min(254, v)) / 256


def _mirror(data):
    if len(data) != MIRROR_SIZE:
        raise ValueError(f'expected {MIRROR_SIZE} mirror bytes, got {len(data)}')


def clut_offset(word):
    if not isinstance(word, int) or not 0 <= word <= 0x7FFF:
        raise ValueError('CLUT reference must be a 15-bit word')
    return ROW_BYTES * (word >> 6) + 32 * (word & 63)


def read_clut_bytes(mirror, word, entries=256):
    _mirror(mirror)
    if entries not in (16, 256):
        raise ValueError('CLUT must contain 16 or 256 colors')
    offset = clut_offset(word)
    end = offset + entries * 2
    if end > len(mirror):
        raise ValueError('CLUT extends beyond mirror')
    return mirror[offset:end]


def read_actor_band(mirror, actor):
    _mirror(mirror)
    if not isinstance(actor, int) or not 0 <= actor <= 143:
        raise ValueError('actor band outside VRAM')
    y = 0xE0 + 2 * actor
    return b''.join(mirror[(y + row) * ROW_BYTES:(y + row) * ROW_BYTES + 512]
                    for row in (0, 1))


def actor_palette(mirror, actor, half=0):
    if half not in (0, 1):
        raise ValueError('actor palette half must be 0 or 1')
    band = read_actor_band(mirror, actor)
    words = struct.unpack('<256H', band[half * 512:(half + 1) * 512])
    return np.array([rgb555_to_rgb888(w) for w in words], dtype=np.uint8), words


def locate_pc_bgra_palette(mirror, raw_bgra):
    """Resolve a captured cache palette to actor staging rows by all 256 colors.

    PC BGRA and PSX STP|B5|G5|R5 are different encodings. Compare their
    quantized color fields, not the byte arrays. STP/PC alpha correspondence
    is deliberately not asserted. Empty palettes are not useful evidence.
    """
    _mirror(mirror)
    if len(raw_bgra) != 1024:
        raise ValueError('expected 256 captured u32 colors')
    pc = np.frombuffer(raw_bgra, dtype='<u4')
    rgb555 = (((pc >> 3) & 31) << 10) | (((pc >> 11) & 31) << 5) | ((pc >> 19) & 31)
    if not np.any(rgb555):
        raise MissingEvidence('empty cache palette cannot establish a binding')
    rows = np.frombuffer(mirror, dtype='<u2').reshape(512, 1024)
    return [y for y in range(224, 256)
            if np.array_equal(rows[y, :256] & 0x7FFF, rgb555)]


def actor_palette_pc_bgra(mirror, actor, half=0):
    """Read actor VRAM bytes and preserve the validated PC BGRA color convention.

    PC conversion expands by floor(c5*255/31). This separate function keeps
    the historical texture.py high-field-red diagnostic unchanged.
    """
    if half not in (0, 1):
        raise ValueError('actor palette half must be 0 or 1')
    band = read_actor_band(mirror, actor)
    words = np.frombuffer(band[half*512:(half+1)*512], dtype='<u2').astype(np.uint32)
    return np.stack([(words & 31) * 255 // 31, ((words >> 5) & 31) * 255 // 31,
                     ((words >> 10) & 31) * 255 // 31], axis=1).astype(np.uint8)


def slot_actor(slot):
    """The observed first CLUT slots are 0,2,4; do not interpret as a stride."""
    if slot not in (0, 2, 4):
        raise MissingEvidence(f'actor mapping for footer slot {slot} is UNPROVEN')
    return slot // 2


def extract_index_rect(mirror, byte_x, y, width, height):
    _mirror(mirror)
    if any(not isinstance(x, int) for x in (byte_x, y, width, height)):
        raise ValueError('rectangle coordinates must be integers')
    if not (0 <= byte_x < ROW_BYTES and 0 <= y < 512 and
            0 < width <= ROW_BYTES - byte_x and 0 < height <= 512 - y):
        raise ValueError('8bpp rectangle outside mirror')
    return np.frombuffer(mirror, dtype=np.uint8).reshape(512, ROW_BYTES)[
        y:y + height, byte_x:byte_x + width].copy()


def extract_page_window(mirror, tpage, window):
    """8bpp: two texels/halfword. Origin affects the blit, never UVs."""
    byte_x = (tpage & 15) * 128 + window.x
    y = ((tpage >> 4) & 1) * 256 + window.y
    return extract_index_rect(mirror, byte_x, y, window.width, window.height)


def locate_index_rect(mirror, pixels, width, height):
    """All byte-exact TR08->TX07 matches; no guessed page or fuzzy score."""
    _mirror(mirror)
    if width <= 0 or height <= 0 or len(pixels) != width * height:
        raise ValueError('invalid index image')
    rows = [pixels[i * width:(i + 1) * width] for i in range(height)]
    probe = max(range(height), key=lambda row: len(set(rows[row])))
    needle = rows[probe]
    matches, start = [], 0
    while True:
        found = mirror.find(needle, start)
        if found < 0:
            return matches
        start = found + 1
        origin = found - probe * ROW_BYTES
        if origin < 0:
            continue
        y, x = divmod(origin, ROW_BYTES)
        if x + width > ROW_BYTES or y + height > 512:
            continue
        if all(mirror[(y + r) * ROW_BYTES + x:(y + r) * ROW_BYTES + x + width]
               == rows[r] for r in range(height)):
            matches.append((x, y))


def triangles_with_slots(record):
    """Use captured index order and one footer ID per primitive, not per draw."""
    verts = list(struct.iter_unpack('<4f2I2f', record.fvf))
    ids = list(getattr(record, 'ids', ()))
    indices = list(struct.unpack(f'<{record.icount}H', record.indices)) if record.icount else list(range(record.vcount))
    if not ids:
        raise MissingEvidence('no primitive CLUT slots')
    if record.vcount == 3 * len(ids) and len(indices) == 3 * len(ids):
        vertices_per_prim, indices_per_prim = 3, 3
    elif record.vcount == 4 * len(ids) and len(indices) == 6 * len(ids):
        vertices_per_prim, indices_per_prim = 4, 6
    else:
        raise MissingEvidence('ambiguous primitive-to-ID grouping')
    for primitive, slot in enumerate(ids):
        block = indices[primitive * indices_per_prim:(primitive + 1) * indices_per_prim]
        if any(i < primitive * vertices_per_prim or
               i >= (primitive + 1) * vertices_per_prim for i in block):
            raise MissingEvidence('index crosses the captured primitive group')
        for k in range(0, len(block), 3):
            yield tuple(verts[i] for i in block[k:k + 3]), slot


def barycentric_weights(points, x, y):
    (ax, ay), (bx, by), (cx, cy) = points
    area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)
    if area == 0:
        raise ValueError('degenerate triangle')
    wa = ((bx - x) * (cy - y) - (by - y) * (cx - x)) / area
    wb = ((cx - x) * (ay - y) - (cy - y) * (ax - x)) / area
    return wa, wb, 1 - wa - wb


def raster_triangle(frame, tri, index_image, palette, *, modulate=True, perspective=False):
    """Point sampling, integer pixel centers, painter order; no implicit UV fixes."""
    p = np.array([[v[0], v[1]] for v in tri], dtype=np.float64)
    if not np.isfinite(p).all():
        raise ValueError('nonfinite screen-space vertex')
    x0, y0 = np.maximum(np.floor(p.min(axis=0)).astype(int), (0, 0))
    x1, y1 = np.minimum(np.ceil(p.max(axis=0)).astype(int), (frame.shape[1] - 1, frame.shape[0] - 1))
    if x1 < x0 or y1 < y0:
        return 0
    yy, xx = np.mgrid[y0:y1 + 1, x0:x1 + 1]
    try:
        weights = np.array(barycentric_weights(p, xx, yy))
    except ValueError:
        return 0
    inside = np.all(weights >= -1e-9, axis=0)
    if not inside.any():
        return 0
    uv = np.array([[v[6], v[7]] for v in tri], dtype=np.float64)
    if perspective:
        q = np.array([v[3] for v in tri])[:, None, None]
        denominator = (weights * q).sum(axis=0)
        inside &= np.isfinite(denominator) & (np.abs(denominator) > 1e-12)
        weights_uv = weights * q / np.where(inside, denominator, 1)
    else:
        weights_uv = weights
    uu, vv = np.einsum('ihw,ij->jhw', weights_uv, uv)
    h, w = index_image.shape
    ix = np.floor(uu * w).astype(np.int64) % w
    iy = np.floor(vv * h).astype(np.int64) % h
    colors = palette[index_image[iy, ix]].astype(np.float64)
    diffuse = np.array([[(v[4] >> 16) & 255, (v[4] >> 8) & 255, v[4] & 255,
                         (v[4] >> 24) & 255] for v in tri], dtype=np.float64)
    shade = np.einsum('ihw,ij->hwj', weights, diffuse)
    inside &= shade[:, :, 3] >= 8
    if modulate:
        colors *= shade[:, :, :3] / 255
    target = frame[y0:y1 + 1, x0:x1 + 1]
    target[inside] = np.clip(np.rint(colors[inside]), 0, 255).astype(np.uint8)
    return int(inside.sum())
