"""Minimal software rasterizer for the ff8dump decoder -- no graphics API.

Flat-fill triangles via a half-space rule on an RGB bytearray framebuffer,
Sutherland-Hodgman clip to the viewport, Bresenham lines for the --wire overlay.
Coordinates are screen-space floats (FVF 0x1C4 XYZRHW), rounded half-up to ints.
Fill rule is edge-inclusive (all edge functions >= 0), so shared edges of adjacent
triangles may be written twice; harmless for same-color flat fills (v1 limit).
"""
from __future__ import annotations

from math import floor


def _round(v: float) -> int:
    """Half-up rounding (screen coords are already float screen-space)."""
    return int(floor(v + 0.5))


class Framebuffer:
    __slots__ = ('w', 'h', 'buf')

    def __init__(self, w: int, h: int):
        self.w = w
        self.h = h
        self.buf = bytearray(w * h * 3)  # black RGB

    def put(self, x: int, y: int, color) -> None:
        if 0 <= x < self.w and 0 <= y < self.h:
            i = (y * self.w + x) * 3
            self.buf[i:i + 3] = color

    def to_image(self):
        from PIL import Image  # Pillow used as pixel container only, no rendering API
        return Image.frombytes('RGB', (self.w, self.h), bytes(self.buf))


def _mix(p, q, t):
    return (p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t)


def clip_rect(poly, minx, miny, maxx, maxy):
    """Sutherland-Hodgman clip of a float polygon to [minx,maxx]x[miny,maxy]."""
    planes = (
        (lambda p: p[0] >= minx, lambda p, q: _mix(p, q, (minx - p[0]) / (q[0] - p[0]))),
        (lambda p: p[0] <= maxx, lambda p, q: _mix(p, q, (maxx - p[0]) / (q[0] - p[0]))),
        (lambda p: p[1] >= miny, lambda p, q: _mix(p, q, (miny - p[1]) / (q[1] - p[1]))),
        (lambda p: p[1] <= maxy, lambda p, q: _mix(p, q, (maxy - p[1]) / (q[1] - p[1]))),
    )
    for keep, isect in planes:
        out = []
        for i in range(len(poly)):
            cur, prev = poly[i], poly[i - 1]
            if keep(cur):
                if not keep(prev):
                    out.append(isect(prev, cur))
                out.append(cur)
            elif keep(prev):
                out.append(isect(prev, cur))
        poly = out
        if not poly:
            return []
    return poly


def fill_triangle(fb: Framebuffer, a, b, c, color) -> None:
    """Fill one screen-space float triangle, clipped to the viewport."""
    poly = clip_rect([a, b, c], 0.0, 0.0, float(fb.w), float(fb.h))
    if len(poly) < 3:
        return
    pts = [(_round(x), _round(y)) for x, y in poly]
    for i in range(1, len(pts) - 1):  # fan-triangulate the clipped polygon
        _fill_halfspace(fb, pts[0], pts[i], pts[i + 1], color)


def _fill_halfspace(fb: Framebuffer, p0, p1, p2, color) -> None:
    x0, y0 = p0
    x1, y1 = p1
    x2, y2 = p2
    area = (x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0)
    if area == 0:
        return
    if area < 0:  # orient CCW so "inside" == all edge functions >= 0
        x1, y1, x2, y2 = x2, y2, x1, y1
    minx = max(0, min(x0, x1, x2))
    maxx = min(fb.w - 1, max(x0, x1, x2))
    miny = max(0, min(y0, y1, y2))
    maxy = min(fb.h - 1, max(y0, y1, y2))
    if minx > maxx or miny > maxy:
        return
    # Edge functions with per-row/per-pixel increments.
    a0, b0 = y1 - y2, x2 - x1
    a1, b1 = y2 - y0, x0 - x2
    a2, b2 = y0 - y1, x1 - x0
    w0 = (x2 - x1) * (miny - y1) - (y2 - y1) * (minx - x1)
    w1 = (x0 - x2) * (miny - y2) - (y0 - y2) * (minx - x2)
    w2 = (x1 - x0) * (miny - y0) - (y1 - y0) * (minx - x0)
    buf, stride = fb.buf, fb.w
    cr, cg, cb = color
    for y in range(miny, maxy + 1):
        u0, u1, u2, row = w0, w1, w2, y * stride
        for x in range(minx, maxx + 1):
            if (u0 | u1 | u2) >= 0:  # sign-bit OR: true iff all three >= 0
                i = (row + x) * 3
                buf[i], buf[i + 1], buf[i + 2] = cr, cg, cb
            u0 += a0
            u1 += a1
            u2 += a2
        w0 += b0
        w1 += b1
        w2 += b2


def draw_line_clipped(fb: Framebuffer, p0, p1, color) -> None:
    """Bresenham segment clipped to the viewport (wire overlay)."""
    pts = clip_rect([p0, p1], 0.0, 0.0, float(fb.w - 1), float(fb.h - 1))
    if len(pts) == 2:
        _bresenham(fb, _round(pts[0][0]), _round(pts[0][1]),
                   _round(pts[1][0]), _round(pts[1][1]), color)


def _bresenham(fb: Framebuffer, x0, y0, x1, y1, color) -> None:
    dx, dy = abs(x1 - x0), -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        fb.put(x0, y0, color)
        if x0 == x1 and y0 == y1:
            return
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy
