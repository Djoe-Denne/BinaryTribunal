#!/usr/bin/env python3
"""render_check.py - FF8 battle monster wireframe renderer (PIL only, no 3D lib).

Renders the c0m skeleton+mesh at the bind pose and at frames 0 / mid / last of
one animation, in an isometric projection, into one PNG (2x2 panels).

Pose math = engine chain ported in parse_c0m.py (HobbitDur monsterdata.py
semantics, validated by its glTF round-trip): disk vertex (a,b,c) -> viewer
mapping get_list = (-a, b, -c)/2048 -> bone matrix M * (x,-y,-z) + translation
-> frame root position; then a plain isometric projection.

CLI: python render_check.py --c0m 90 --anim 1 --out out
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from extract_lzs import BattleArchive  # noqa: E402
from parse_c0m import C0mModel, ROOT_PARENT, compose_pose, pose_engine  # noqa: E402

from PIL import Image, ImageDraw  # noqa: E402

BG = (16, 16, 24)
WIRE = (110, 160, 220)
BONE = (240, 210, 90)
BONE_JOINT = (255, 120, 60)
LABEL = (235, 235, 235)

MAX_WIRE_FACES = 2500  # keep the probe fast on big meshes


def to_viewer(p):
    """Engine space -> viewer space (HobbitDur convention: (-x, z, -y))."""
    x, y, z = p
    return (-x, z, -y)


def project_iso(p):
    x, y, z = p
    return (x - z) * 0.8660254, (x + z) * 0.5 - y


def main() -> int:
    parser = argparse.ArgumentParser(description="FF8 c0m wireframe renderer (PIL)")
    parser.add_argument("--c0m", type=int, default=90)
    parser.add_argument("--anim", type=int, default=None,
                        help="animation id (default: first with frames)")
    parser.add_argument("--archive-dir", default=None)
    parser.add_argument("--out", default=None)
    args = parser.parse_args()

    archive = BattleArchive(args.archive_dir) if args.archive_dir else BattleArchive()
    idx = archive.c0m_index(args.c0m)
    if idx is None:
        print(f"c0m{args.c0m:03d}: not in archive")
        return 1
    _, payload, _meta = archive.read_entry(idx)
    model = C0mModel(f"c0m{args.c0m:03d}")
    model.parse(payload)

    if not model.mesh.objects:
        print(f"{model.name}: no mesh - nothing to render")
        return 1
    clips = [c for c in model.animations.clips if c["frames"]]
    if not clips:
        print(f"{model.name}: no animation frames - nothing to render")
        return 1
    anim = clips[0]
    if args.anim is not None and args.anim < len(model.animations.clips):
        chosen = model.animations.clips[args.anim]
        if chosen["frames"]:
            anim = chosen
    anim_id, nb = anim["index"], anim["nb_frames"]

    PW = PH = 800
    panel_w = panel_h = PW // 2
    image = Image.new("RGB", (PW, PH), BG)
    draw = ImageDraw.Draw(image)

    panels = [
        ("bind pose (anim 0 frame 0, root zeroed)", None),
        (f"anim {anim_id} frame 0", 0),
        (f"anim {anim_id} frame {nb // 2}", nb // 2),
        (f"anim {anim_id} frame {nb - 1}", nb - 1),
    ]

    for pi, (label, fid) in enumerate(panels):
        px, py = (pi % 2) * panel_w, (pi // 2) * panel_h
        frame = anim["frames"][fid] if fid is not None else dict(anim["frames"][0])
        if fid is None:
            frame["pos_raw"] = [0, 0, 0]  # bind pose without root drift

        world = pose_engine(model, frame)
        view = [to_viewer(p) for p in world]
        proj2d = [project_iso(v) for v in view]
        min_x = min(p[0] for p in proj2d)
        max_x = max(p[0] for p in proj2d)
        min_y = min(p[1] for p in proj2d)
        max_y = max(p[1] for p in proj2d)
        span_x = max(max_x - min_x, 1e-6)
        span_y = max(max_y - min_y, 1e-6)
        scale = min((panel_w - 60) / span_x, (panel_h - 60) / span_y)
        cx, cy = (min_x + max_x) / 2, (min_y + max_y) / 2

        def to_screen(p):
            return (px + panel_w / 2 + (p[0] - cx) * scale,
                    py + panel_h / 2 - (p[1] - cy) * scale)

        drawn = 0
        for _word, flist in model.mesh.faces_by_tex_word(include_hidden=False).items():
            for face in flist:
                a, b, c = face["v"]
                p0, p1, p2 = to_screen(proj2d[a]), to_screen(proj2d[b]), to_screen(proj2d[c])
                draw.line([p0, p1], fill=WIRE, width=1)
                draw.line([p1, p2], fill=WIRE, width=1)
                draw.line([p2, p0], fill=WIRE, width=1)
                drawn += 1
                if drawn >= MAX_WIRE_FACES:
                    break
            if drawn >= MAX_WIRE_FACES:
                break

        joints = [(m[0][3], m[1][3], m[2][3]) for m in compose_pose(model.skeleton, frame)]
        vj = [project_iso(to_viewer(j)) for j in joints]
        for bone in model.skeleton.bones:
            if bone["parent"] == ROOT_PARENT:
                continue
            pa = to_screen(vj[bone["parent"]])
            pb = to_screen(vj[bone["bone_id"]])
            draw.line([pa, pb], fill=BONE, width=3)
            draw.ellipse([pb[0] - 3, pb[1] - 3, pb[0] + 3, pb[1] + 3], fill=BONE_JOINT)
        draw.text((px + 10, py + 8), f"panel {pi}  {label}", fill=LABEL)

    out = Path(args.out) if args.out else (
        Path(__file__).resolve().parent / "out" / f"{model.name}_render.png")
    image.save(out)
    print(f"{model.name}: 4 panels (anim {anim_id}, {nb} frames) -> {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
