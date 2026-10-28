#!/usr/bin/env python3
"""Lot 21 offline background diagnostics and reviewable battle composite.

The v13 capture contains final FVF UVs.  The renderer therefore preserves the
captured vertex/index association, uses RHW for the normal path, and exposes UV
rotation only as a deliberately wrong diagnostic.  Direct slot-49 draws have no
captured texture binding and are rendered separately from diffuse colors.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path
import struct

import numpy as np
from PIL import Image, ImageDraw

import ff8dump as dump
from lot17_texture_window import MissingEvidence, barycentric_weights, locate_index_rect, triangles_with_slots
from render_lot17 import load_capture


BACKGROUND_RECTS = {
    (0, 256): "sky",
    (256, 256): "terrain",
    (512, 256): "horizon",
}
BACKGROUND_ORDER = ("sky", "horizon", "terrain")
FRAME_SHAPE = (480, 640, 3)
BACKGROUND_RGB = (29, 30, 39)


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def palette_bgra(tr, slot: int) -> np.ndarray:
    """Return one captured PC palette as RGBA without reinterpreting PSX words."""
    if slot < 0 or slot >= tr.pal_count:
        raise MissingEvidence(f"palette slot {slot} outside 0..{tr.pal_count - 1} for {tr.texobj:#x}")
    start = slot * tr.pal_entries * 4
    raw = np.frombuffer(tr.raw_clut[start:start + tr.pal_entries * 4], dtype=np.uint8)
    if raw.size != tr.pal_entries * 4:
        raise MissingEvidence(f"truncated palette {tr.texobj:#x}/{slot}")
    bgra = raw.reshape(-1, 4)
    return bgra[:, [2, 1, 0, 3]].copy()


def rotate_uv(tri, amount: int):
    """Rotate UV ownership while leaving screen vertices fixed (diagnostic only)."""
    amount %= 3
    if not amount:
        return tuple(tri)
    uvs = [(v[6], v[7]) for v in tri]
    result = []
    for i, vertex in enumerate(tri):
        values = list(vertex)
        values[6], values[7] = uvs[(i + amount) % 3]
        result.append(tuple(values))
    return tuple(result)


def raster_triangle_alpha(frame: np.ndarray, tri, index_image: np.ndarray | None,
                          rgba_palette: np.ndarray | None, *, perspective: bool,
                          uv_rotate: int = 0, modulate: bool = True,
                          blend_diffuse: bool = True,
                          palette_zero_transparent: bool = True) -> dict:
    """Raster one triangle with captured diffuse alpha and source-over blending.

    Palette alpha zero is used only as the captured transparent-color sentinel.
    Nonzero palette alpha is not promoted to blend state because that state was
    not captured.  FVF diffuse alpha is the evidence-backed host approximation.
    """
    tri = rotate_uv(tri, uv_rotate)
    points = np.array([[v[0], v[1]] for v in tri], dtype=np.float64)
    if not np.isfinite(points).all():
        raise ValueError("nonfinite screen-space vertex")
    x0, y0 = np.maximum(np.floor(points.min(axis=0)).astype(int), (0, 0))
    x1, y1 = np.minimum(np.ceil(points.max(axis=0)).astype(int),
                        (frame.shape[1] - 1, frame.shape[0] - 1))
    if x1 < x0 or y1 < y0:
        return {"pixels": 0, "blended": 0, "transparent": 0}
    yy, xx = np.mgrid[y0:y1 + 1, x0:x1 + 1]
    try:
        weights = np.array(barycentric_weights(points, xx, yy))
    except ValueError:
        return {"pixels": 0, "blended": 0, "transparent": 0}
    # Half-open top-left ownership is required for source-over: a shared edge
    # must not be blended once by each adjacent triangle.
    area = ((points[1, 0] - points[0, 0]) * (points[2, 1] - points[0, 1]) -
            (points[1, 1] - points[0, 1]) * (points[2, 0] - points[0, 0]))
    edge_vertices = ((points[1], points[2]), (points[2], points[0]),
                     (points[0], points[1]))
    inside = np.ones(weights.shape[1:], dtype=bool)
    for weight, (start, end) in zip(weights, edge_vertices):
        if area < 0:
            start, end = end, start
        dx, dy = end[0] - start[0], end[1] - start[1]
        top_left = dy < 0 or (abs(dy) <= 1e-12 and dx > 0)
        inside &= (weight > 1e-9) | ((np.abs(weight) <= 1e-9) & top_left)
    if not inside.any():
        return {"pixels": 0, "blended": 0, "transparent": 0}

    uv = np.array([[v[6], v[7]] for v in tri], dtype=np.float64)
    if perspective:
        rhw = np.array([v[3] for v in tri], dtype=np.float64)[:, None, None]
        denominator = (weights * rhw).sum(axis=0)
        valid = np.isfinite(denominator) & (np.abs(denominator) > 1e-12)
        inside &= valid
        uv_weights = weights * rhw / np.where(valid, denominator, 1.0)
    else:
        uv_weights = weights
    uu, vv = np.einsum("ihw,ij->jhw", uv_weights, uv)

    diffuse = np.array([[(v[4] >> 16) & 255, (v[4] >> 8) & 255,
                         v[4] & 255, (v[4] >> 24) & 255]
                        for v in tri], dtype=np.float64)
    shade = np.einsum("ihw,ij->hwj", weights, diffuse)
    source_alpha = np.clip(shade[:, :, 3] / 255.0, 0.0, 1.0)
    transparent = source_alpha < (8.0 / 255.0)
    if not blend_diffuse:
        source_alpha = np.where(transparent, 0.0, 1.0)

    if index_image is None:
        colors = shade[:, :, :3].copy()
    else:
        if rgba_palette is None:
            raise ValueError("textured triangle requires a palette")
        h, w = index_image.shape
        ix = np.floor(uu * w).astype(np.int64) % w
        iy = np.floor(vv * h).astype(np.int64) % h
        samples = rgba_palette[index_image[iy, ix]]
        colors = samples[:, :, :3].astype(np.float64)
        if palette_zero_transparent:
            transparent |= samples[:, :, 3] == 0
        if modulate:
            colors *= shade[:, :, :3] / 255.0

    active = inside & ~transparent
    target = frame[y0:y1 + 1, x0:x1 + 1]
    alpha = source_alpha[:, :, None]
    composite = np.rint(colors * alpha + target.astype(np.float64) * (1.0 - alpha))
    target[active] = np.clip(composite[active], 0, 255).astype(np.uint8)
    blended = active & (source_alpha < (254.5 / 255.0))
    return {"pixels": int(active.sum()), "blended": int(blended.sum()),
            "transparent": int((inside & transparent).sum())}


def blank_frame() -> np.ndarray:
    return np.full(FRAME_SHAPE, BACKGROUND_RGB, dtype=np.uint8)


def labelled(array: np.ndarray, title: str, subtitle: str = "") -> Image.Image:
    image = Image.fromarray(array)
    canvas = Image.new("RGB", (image.width, image.height + 36), (18, 20, 26))
    canvas.paste(image, (0, 36))
    draw = ImageDraw.Draw(canvas)
    draw.text((8, 4), title, fill=(235, 238, 244))
    if subtitle:
        draw.text((8, 20), subtitle, fill=(168, 175, 188))
    return canvas


def grid(rows) -> Image.Image:
    widths = [max(panel.width for panel in row) for row in zip(*rows)]
    heights = [max(panel.height for panel in row) for row in rows]
    canvas = Image.new("RGB", (sum(widths), sum(heights)), (18, 20, 26))
    y = 0
    for row, height in zip(rows, heights):
        x = 0
        for panel, width in zip(row, widths):
            canvas.paste(panel, (x, y))
            x += width
        y += height
    return canvas


def classify_resources(frame_records, frame_resources, mirror):
    classes = {"background": defaultdict(list), "actors": [], "ui": []}
    resource_info = {}
    for tr in frame_resources:
        rects = locate_index_rect(mirror, tr.pixels, tr.w, tr.h)
        role = None
        if len(rects) == 1 and tuple(rects[0]) in BACKGROUND_RECTS:
            role = BACKGROUND_RECTS[tuple(rects[0])]
            classes["background"][role].append(tr.texobj)
        elif len(rects) == 1 and rects[0][0] >= 1280 and rects[0][1] == 0:
            role = "actor"
            classes["actors"].append(tr.texobj)
        else:
            role = "ui"
            classes["ui"].append(tr.texobj)
        resource_info[tr.texobj] = {"role": role, "mirror_rects": rects,
                                    "records": sum(getattr(r, "texobj", 0) == tr.texobj
                                                   for r in frame_records)}
    return classes, resource_info


def render_records(records, resources, *, perspective: bool, uv_rotate: int = 0,
                   initial=None, blend_diffuse: bool = True,
                   palette_zero_transparent: bool = True):
    frame = blank_frame() if initial is None else initial.copy()
    totals = Counter()
    for record in records:
        tr = resources.get(getattr(record, "texobj", 0))
        if tr is None:
            raise MissingEvidence(f"missing TR08 for {getattr(record, 'texobj', 0):#x}")
        image = np.frombuffer(tr.pixels, dtype=np.uint8).reshape(tr.h, tr.w)
        for tri, slot in triangles_with_slots(record):
            result = raster_triangle_alpha(frame, tri, image, palette_bgra(tr, slot),
                                           perspective=perspective, uv_rotate=uv_rotate,
                                           blend_diffuse=blend_diffuse,
                                           palette_zero_transparent=palette_zero_transparent)
            totals.update(result)
            totals["triangles"] += 1
    return frame, dict(totals)


def render_slot49(records):
    frame = blank_frame()
    totals = Counter()
    descriptions = []
    for record in records:
        vertices = list(dump.VERT.iter_unpack(record.fvf))
        alpha = Counter((v[4] >> 24) & 255 for v in vertices)
        descriptions.append({"vertices": record.vcount, "indices": record.icount,
                             "triangles": sum(1 for _ in dump.kind2_triangles(record)),
                             "diffuse_alpha": dict(alpha), "clut_sys_id": getattr(record, "clut_sys_id", 0)})
        for tri in dump.kind2_triangles(record):
            result = raster_triangle_alpha(frame, tri, None, None, perspective=True)
            totals.update(result)
            totals["triangles"] += 1
    return frame, dict(totals), descriptions


def shared_edge_metrics(records, uv_rotate: int) -> dict:
    edges = defaultdict(list)
    for record in records:
        for tri, _ in triangles_with_slots(record):
            tri = rotate_uv(tri, uv_rotate)
            for a, b in ((0, 1), (1, 2), (2, 0)):
                va, vb = tri[a], tri[b]
                pa = (round(va[0], 4), round(va[1], 4))
                pb = (round(vb[0], 4), round(vb[1], 4))
                if pa <= pb:
                    key = (pa, pb); value = ((round(va[6], 6), round(va[7], 6)),
                                             (round(vb[6], 6), round(vb[7], 6)))
                else:
                    key = (pb, pa); value = ((round(vb[6], 6), round(vb[7], 6)),
                                             (round(va[6], 6), round(va[7], 6)))
                edges[key].append(value)
    shared = [values for values in edges.values() if len(values) > 1]
    return {"shared_edges": len(shared),
            "uv_mismatches": sum(len(set(values)) > 1 for values in shared)}


def save_png(path: Path, image: Image.Image | np.ndarray) -> dict:
    if isinstance(image, np.ndarray):
        image = Image.fromarray(image)
    image.save(path)
    raw = path.read_bytes()
    return {"file": path.name, "sha256": sha256(raw), "bytes": len(raw),
            "size": list(image.size)}


def run(args):
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    data, build, records, mirrors, resources_all = load_capture(args.dump)
    if build != 0x5640:
        raise ValueError(f"lot21 requires strict v13 build 0x5640, got {build:#x}")
    if any(tuple(getattr(tx, "texwin", (0, 0, 0, 0))) != (0, 0, 0, 0) for tx in mirrors):
        raise MissingEvidence("lot21 requires TEXWIN {0,0,0,0} on every frame")
    seq = args.seq if args.seq is not None else sorted(tx.seq for tx in mirrors)[0]
    txs = [tx for tx in mirrors if tx.seq == seq]
    if len(txs) != 1:
        raise MissingEvidence(f"seq {seq}: expected exactly one TX07")
    frame_records = [r for r in records if r.seq == seq]
    kind2 = [r for r in frame_records if r.geom_kind == 2]
    frame_resources = [tr for tr in resources_all if tr.seq == seq]
    resources = {tr.texobj: tr for tr in frame_resources}
    classes, resource_info = classify_resources(frame_records, frame_resources, txs[0].mirror)

    role_records = {}
    for role in BACKGROUND_ORDER:
        objects = set(classes["background"].get(role, ()))
        selected = [r for r in kind2 if r.slot == 51 and getattr(r, "texobj", 0) in objects]
        if not selected:
            raise MissingEvidence(f"no {role} records identified by byte-exact mirror binding")
        role_records[role] = selected

    variants = (("affine / rot0", False, 0), ("RHW / rot0", True, 0),
                ("RHW / rot1", True, 1), ("RHW / rot2", True, 2))
    board_rows = []
    background_metrics = {}
    for role in BACKGROUND_ORDER:
        panels = []
        rendered = {}
        for title, perspective, rotation in variants:
            image, counts = render_records(role_records[role], resources,
                                           perspective=perspective, uv_rotate=rotation)
            rendered[title] = image
            panels.append(labelled(image, f"{role.upper()} - {title}",
                                   f"{len(role_records[role])} records; final FVF UV"))
        affine, best = rendered["affine / rot0"], rendered["RHW / rot0"]
        changed = np.any(affine != best, axis=2)
        background_metrics[role] = {
            "records": len(role_records[role]),
            "triangles": sum(sum(1 for _ in triangles_with_slots(r)) for r in role_records[role]),
            "perspective_vs_affine_changed_pixel_fraction": float(changed.mean()),
            "perspective_vs_affine_rgb_mae": float(np.abs(affine.astype(int) - best.astype(int)).mean()),
            "shared_edge_uv": {f"rot{rot}": shared_edge_metrics(role_records[role], rot)
                               for rot in range(3)},
        }
        board_rows.append(panels)
    uv_board = grid(board_rows)

    background = blank_frame()
    background_counts = Counter()
    for role in BACKGROUND_ORDER:
        background, counts = render_records(role_records[role], resources, perspective=True,
                                             initial=background)
        background_counts.update(counts)

    actor_objects = set(classes["actors"])
    ui_objects = set(classes["ui"])
    actor_records = [r for r in kind2 if r.slot == 51 and getattr(r, "texobj", 0) in actor_objects]
    ui_records = [r for r in kind2 if r.slot == 51 and getattr(r, "texobj", 0) in ui_objects]
    semantic, actor_counts = render_records(actor_records, resources, perspective=True,
                                            initial=background)
    semantic, ui_counts = render_records(ui_records, resources, perspective=True,
                                         initial=semantic, palette_zero_transparent=False)
    opaque, _ = render_records(actor_records, resources, perspective=True,
                               initial=background, blend_diffuse=False)
    opaque, _ = render_records(ui_records, resources, perspective=True,
                               initial=opaque, blend_diffuse=False,
                               palette_zero_transparent=False)

    capture_records = [r for r in kind2 if r.slot == 51 and getattr(r, "texobj", 0) in resources]
    host_order, host_counts = render_records(capture_records, resources, perspective=True)
    slot49_records = [r for r in kind2 if r.slot == 49 and getattr(r, "texobj", 0) == 0]
    slot49, slot49_counts, slot49_description = render_slot49(slot49_records)

    outputs = []
    outputs.append(save_png(out / "LOT21_uv_board.png", uv_board))
    outputs.append(save_png(out / "LOT21_background.png", background))
    outputs.append(save_png(out / "LOT21_slot49_diagnostic.png", slot49))
    outputs.append(save_png(out / "LOT21_composite_full.png", semantic))
    outputs.append(save_png(out / "LOT21_composite_opaque.png", opaque))
    outputs.append(save_png(out / "LOT21_host_order.png", host_order))
    blend_pair = Image.new("RGB", (1280, 516), (18, 20, 26))
    blend_pair.paste(labelled(opaque, "DIFFUSE ALPHA IGNORED", "diagnostic: alpha>=8 overwritten"), (0, 0))
    blend_pair.paste(labelled(semantic, "DIFFUSE ALPHA SOURCE-OVER", "candidate: alpha127/255 host approximation"), (640, 0))
    outputs.append(save_png(out / "LOT21_blend_comparison.png", blend_pair))
    if args.reference:
        reference = Image.open(args.reference).convert("RGB").resize((640, 480), Image.Resampling.LANCZOS)
        pair = Image.new("RGB", (1280, 516), (18, 20, 26))
        pair.paste(labelled(semantic, "LOT21 semantic layers", "background -> actors -> UI"), (0, 0))
        pair.paste(labelled(np.array(reference), "GAME REFERENCE", "visual review; pose/UI differ"), (640, 0))
        outputs.append(save_png(out / "LOT21_composite_pair.png", pair))
        host_pair = Image.new("RGB", (1280, 516), (18, 20, 26))
        host_pair.paste(labelled(host_order, "LOT21 host submission order", "TPage/state order; not global PSX OT"), (0, 0))
        host_pair.paste(labelled(np.array(reference), "GAME REFERENCE", "visual review; pose/UI differ"), (640, 0))
        outputs.append(save_png(out / "LOT21_host_order_pair.png", host_pair))

    alpha_records = Counter()
    for record in capture_records:
        for tri, _ in triangles_with_slots(record):
            alphas = sorted({(v[4] >> 24) & 255 for v in tri})
            key = str(alphas[0]) if len(alphas) == 1 else "mixed:" + ",".join(map(str, alphas))
            alpha_records[key] += 1
    manifest = {
        "schema": "lot21-offline-v1",
        "dump": str(Path(args.dump).resolve()), "dump_sha256": sha256(data),
        "build": f"0x{build:X}", "frame": seq, "records": len(records),
        "frames": len({r.seq for r in records}), "TX07": len(mirrors), "TR08": len(resources_all),
        "parse_warnings": [], "failed_or_repaired_records": 0,
        "texwin_all_frames": [list(getattr(tx, "texwin", (0, 0, 0, 0))) for tx in mirrors],
        "background_order": list(BACKGROUND_ORDER), "background_metrics": background_metrics,
        "resource_bindings": {f"0x{obj:X}": info for obj, info in resource_info.items()},
        "counts": {"background": dict(background_counts), "actors": actor_counts,
                   "ui": ui_counts, "host_order": host_counts, "slot49": slot49_counts},
        "diffuse_alpha_triangle_counts": dict(sorted(alpha_records.items())),
        "alpha_policy": "FVF diffuse alpha source-over; palette alpha==0 is a transparent sentinel for mirror-bound background/actors but ignored for unmatched UI atlases; nonzero palette alpha does not imply blend state",
        "ordering": {
            "default": "explicit semantic approximation: sky+horizon+terrain, actors, UI",
            "host_candidate": "captured D3D submission order, rebucketed by host TPage/state lists",
            "unavailable": "global PSX OT identity/depth was not captured",
        },
        "slot49": {"status": "MissingEvidence: texobj=0 and active inherited texture state absent; excluded from composites",
                   "records": slot49_description,
                   "classification": "four actor ground shadows; target cursor; HP/status bars"},
        "uv_verdict": "captured index/UV association (rot0) + RHW; extra C-A-B rotation rejected",
        "outputs": outputs,
        "code_sha256": {Path(__file__).name: sha256(Path(__file__).read_bytes())},
        "limitations": ["host blend-state identity absent", "global PSX OT identity absent",
                        "slot49 active texture binding absent"],
    }
    (out / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf8")
    print(json.dumps({"out": str(out.resolve()), "frame": seq, "build": manifest["build"],
                      "records": len(records), "background": background_metrics,
                      "slot49_records": len(slot49_records), "outputs": [o["file"] for o in outputs]}))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("dump")
    parser.add_argument("--out", required=True)
    parser.add_argument("--seq", type=int)
    parser.add_argument("--reference")
    args = parser.parse_args()
    run(args)


if __name__ == "__main__":
    main()
