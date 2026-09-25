#!/usr/bin/env python3
"""FF8 battle monster c0mNNN.dat parser: sections 1/2/3/11 -> JSON + textured GLB + TIM PNGs.

Container  : u32 section_count, u32 offsets[count+1] (payload-relative).
             Section i (1-based) = payload[offsets[i-1]:offsets[i]].
S1 skeleton : 16B header (u8 nb_bones @+0, u8 extra_data flag @+1, u16 unk
             @+2/+4/+6, s16 scale XYZ @+8/+10/+12, u16 unk @+14), then
             nb_bones * 48B: u16 parent (0xFFFF=root), s16 size (/2048),
             s16 rotX/rotY/rotZ (4096 units = full turn), 38 unknown bytes
             (preserved verbatim; see README for the scale-field dispute).
S2 mesh     : u32 nbObjects, u32 objectOffsets[nbObjects], objects...,
             u32 end u32 @section end.  Object: u16 nbBlocks; blocks
             {u16 boneId, u16 nbVertices, nbVertices*6B (s16 x,z,y - disk
             order X,Z,Y)}; ONE alignment pad to 4B; u16 nbTri, nbQuad,
             nbColTri, nbColQuad; u32 unused; faces:
               Tri   16B: a(nib) b c | uC vC uA vA | clut | uB vB | tpage
               Quad  20B: a(nib) b c d | uA vA | clut | uB vB | tpage | uC vC uD vD
               ColTri 20B = tri + u32 color ; ColQuad 24B = quad + u32 color
             Faces with tpage & 0xFE00 are engine-hidden -> skipped.
             UV normalize (u & 0xFF) / 128 (HobbitDur viewer rule).
S3 anims    : u32 nbAnim, u32 offsets[nbAnim]; per anim u8 nbFrames then a
             continuous LSB-first bitstream (no per-frame alignment):
             per frame 3x position (2-bit type -> size {3,6,9,16}, signed,
             deltas accumulated), 1 mode bit, per bone 3x rotation (1-bit
             present; if set 2-bit type -> size {3,6,8,12} signed delta,
             else reuse previous raw), and if mode==1 per bone 3x scale
             (1-bit flag; if set 16-bit payload, raw = payload + 1024).
S11 textures: u32 nbTIM, u32 offsets[nbTIM], u32 endOffset; complete PSX TIMs
             (4bpp/8bpp + CLUT, 16bpp direct) -> PNG (Pillow).

GLB        : derivative of HobbitDur Ifrit3D gltfexporter.py (GPL-3.0):
             bind pose = anim 0 frame 0; vertex world = M * (x,-y,-z) + trans
             (column-vector convention); one primitive per tex word with
             per-face-expanded vertices; JOINTS_0 = block bone id; skin with
             inverseBindMatrices; all animations embedded at 15 fps.

CLI: python parse_c0m.py --c0m 90,0
GPL-3.0 (derivative). Credits + assumptions in README.md.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import math
import struct
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from extract_lzs import BattleArchive, REGISTRY_PATH  # noqa: E402

from PIL import Image  # noqa: E402

VERTEX_SCALE = 1.0 / 2048.0
POSITION_SCALE = -1.0 / 204.8  # engine root-position unit, X and Y mirrored
FPS = 15.0
ROOT_PARENT = 0xFFFF
POSITION_SIZES = (3, 6, 9, 16)
ROTATION_SIZES = (3, 6, 8, 12)
SCALE_NEUTRAL_RAW = 1024


# =====================================================================
# Section 1: skeleton
# =====================================================================

class Skeleton:
    def __init__(self) -> None:
        self.nb_bones = 0
        self.extra_data = 0
        self.unknown00 = self.unknown01 = self.unknown02 = self.unknown2 = 0
        self.scale_raw = (0, 0, 0)
        self.bones: list[dict] = []

    def parse(self, data: bytes) -> None:
        self.nb_bones = data[0]
        self.extra_data = data[1]
        (self.unknown00,) = struct.unpack_from("<H", data, 2)
        (self.unknown01,) = struct.unpack_from("<H", data, 4)
        (self.unknown02,) = struct.unpack_from("<H", data, 6)
        self.scale_raw = struct.unpack_from("<hhh", data, 8)
        (self.unknown2,) = struct.unpack_from("<H", data, 14)
        pos = 16
        for bone_id in range(self.nb_bones):
            parent, size, rx, ry, rz = struct.unpack_from("<Hhhhh", data, pos)
            self.bones.append({
                "bone_id": bone_id, "parent": parent, "size_raw": size,
                "rot_raw": [rx, ry, rz],
                "tail_hex": data[pos + 10 : pos + 48].hex()})
            pos += 48

    def to_json(self) -> dict:
        return {
            "nb_bones": self.nb_bones,
            "extra_data_flag": self.extra_data,
            "header": {
                "u16_+2": self.unknown00, "u16_+4": self.unknown01,
                "u16_+6": self.unknown02, "u16_+14": self.unknown2,
                "scale_raw_xyz": list(self.scale_raw)},
            "bones": self.bones,
        }


# =====================================================================
# Section 2: mesh
# =====================================================================

class Mesh:
    def __init__(self) -> None:
        self.objects: list[dict] = []
        self.walked_vertices = 0
        self.trailing_u32 = 0

    def parse(self, data: bytes) -> None:
        nb_objects = struct.unpack_from("<I", data, 0)[0]
        offsets = list(struct.unpack_from(f"<{nb_objects}I", data, 4))
        vertex_base = 0
        for obj_i, obj_off in enumerate(offsets):
            obj_end = offsets[obj_i + 1] if obj_i + 1 < nb_objects else len(data) - 4
            pos = obj_off
            nb_blocks = struct.unpack_from("<H", data, pos)[0]
            pos += 2
            blocks = []
            for _ in range(nb_blocks):
                bone_id, nb_vertices = struct.unpack_from("<HH", data, pos)
                pos += 4
                verts = []
                for _v in range(nb_vertices):
                    x, z, y = struct.unpack_from("<hhh", data, pos)
                    pos += 6
                    verts.append({"raw": (x, y, z), "bone": bone_id})
                blocks.append({"bone": bone_id, "nb_vertices": nb_vertices,
                               "vertex_base": vertex_base, "vertices": verts})
                vertex_base += nb_vertices
            pos += (4 - pos % 4) % 4  # single pad after the whole block list
            nb_tri, nb_quad, nb_ct, nb_cq = struct.unpack_from("<HHHH", data, pos)
            (unused,) = struct.unpack_from("<I", data, pos + 8)
            pos += 12
            tris, quads, col_tris, col_quads = [], [], [], []
            for _ in range(nb_tri):
                a_raw, b, c = struct.unpack_from("<HHH", data, pos)
                u_c, v_c, u_a, v_a, clut, u_b, v_b, tpage = struct.unpack_from(
                    "<BBBBHBBH", data, pos + 6)
                tris.append({
                    "v": (a_raw & 0xFFF, b & 0xFFF, c & 0xFFF),
                    "depth_bias": (a_raw >> 12) - 8,
                    "uv": ((u_a, v_a), (u_b, v_b), (u_c, v_c)),  # corners A,B,C
                    "tex_word": clut, "tpage": tpage,
                    "hidden": bool(tpage & 0xFE00)})
                pos += 16
            for _ in range(nb_quad):
                a_raw, b, c, d = struct.unpack_from("<HHHH", data, pos)
                u_a, v_a, clut, u_b, v_b, tpage, u_c, v_c, u_d, v_d = struct.unpack_from(
                    "<BBHBBHBBBB", data, pos + 8)
                quads.append({
                    "v": (a_raw & 0xFFF, b & 0xFFF, c & 0xFFF, d & 0xFFF),
                    "depth_bias": (a_raw >> 12) - 8,
                    "uv": ((u_a, v_a), (u_b, v_b), (u_c, v_c), (u_d, v_d)),
                    "tex_word": clut, "tpage": tpage,
                    "hidden": bool(tpage & 0xFE00)})
                pos += 20
            for _ in range(nb_ct):
                a_raw, b, c = struct.unpack_from("<HHH", data, pos)
                u_c, v_c, u_a, v_a, clut, u_b, v_b, tpage = struct.unpack_from(
                    "<BBBBHBBH", data, pos + 6)
                (color,) = struct.unpack_from("<I", data, pos + 16)
                col_tris.append({
                    "v": (a_raw & 0xFFF, b & 0xFFF, c & 0xFFF),
                    "depth_bias": (a_raw >> 12) - 8,
                    "uv": ((u_a, v_a), (u_b, v_b), (u_c, v_c)),
                    "tex_word": clut, "tpage": tpage,
                    "hidden": bool(tpage & 0xFE00), "color_raw": color})
                pos += 20
            for _ in range(nb_cq):
                a_raw, b, c, d = struct.unpack_from("<HHHH", data, pos)
                u_a, v_a, clut, u_b, v_b, tpage, u_c, v_c, u_d, v_d = struct.unpack_from(
                    "<BBHBBHBBBB", data, pos + 8)
                (color,) = struct.unpack_from("<I", data, pos + 20)
                col_quads.append({
                    "v": (a_raw & 0xFFF, b & 0xFFF, c & 0xFFF, d & 0xFFF),
                    "depth_bias": (a_raw >> 12) - 8,
                    "uv": ((u_a, v_a), (u_b, v_b), (u_c, v_c), (u_d, v_d)),
                    "tex_word": clut, "tpage": tpage,
                    "hidden": bool(tpage & 0xFE00), "color_raw": color})
                pos += 24
            if pos != obj_end:
                raise ValueError(
                    f"object {obj_i} walk ended at {pos}, expected {obj_end}")
            self.objects.append({
                "offset": obj_off, "blocks": blocks, "nb_tri": nb_tri,
                "nb_quad": nb_quad, "nb_col_tri": nb_ct, "nb_col_quad": nb_cq,
                "unused_u32": unused, "vertex_base": 0,
                "triangles": tris, "quads": quads,
                "col_triangles": col_tris, "col_quads": col_quads})
        self.walked_vertices = vertex_base
        self.trailing_u32 = struct.unpack_from("<I", data, len(data) - 4)[0]

    def all_vertices(self) -> list[tuple[tuple[int, int, int], int]]:
        out = []
        for obj in self.objects:
            for blk in obj["blocks"]:
                for v in blk["vertices"]:
                    out.append((v["raw"], v["bone"]))
        return out

    def faces_by_tex_word(self, include_hidden: bool = False) -> dict[int, list[dict]]:
        """Faces grouped by the full raw tex word; quads -> two triangles
        (A,B,D / A,C,D, like the engine viewer)."""
        groups: dict[int, list[dict]] = {}
        for obj in self.objects:
            for tri in obj["triangles"]:
                if tri["hidden"] and not include_hidden:
                    continue
                groups.setdefault(tri["tex_word"], []).append({
                    "kind": "tri", "v": tri["v"], "uv": tri["uv"],
                    "depth_bias": tri["depth_bias"]})
            for quad in obj["quads"]:
                if quad["hidden"] and not include_hidden:
                    continue
                a, b, c, d = quad["v"]
                uva, uvb, uvc, uvd = quad["uv"]
                groups.setdefault(quad["tex_word"], []).append({
                    "kind": "tri", "v": (a, b, d), "uv": (uva, uvb, uvd),
                    "depth_bias": quad["depth_bias"]})
                groups.setdefault(quad["tex_word"], []).append({
                    "kind": "tri", "v": (a, c, d), "uv": (uva, uvc, uvd),
                    "depth_bias": quad["depth_bias"]})
            for tri in obj["col_triangles"]:
                if tri["hidden"] and not include_hidden:
                    continue
                groups.setdefault(tri["tex_word"], []).append({
                    "kind": "tri", "v": tri["v"], "uv": tri["uv"],
                    "depth_bias": tri["depth_bias"],
                    "color_raw": tri["color_raw"]})
            for quad in obj["col_quads"]:
                if quad["hidden"] and not include_hidden:
                    continue
                a, b, c, d = quad["v"]
                uva, uvb, uvc, uvd = quad["uv"]
                groups.setdefault(quad["tex_word"], []).append({
                    "kind": "tri", "v": (a, b, d), "uv": (uva, uvb, uvd),
                    "depth_bias": quad["depth_bias"],
                    "color_raw": quad["color_raw"]})
                groups.setdefault(quad["tex_word"], []).append({
                    "kind": "tri", "v": (a, c, d), "uv": (uva, uvc, uvd),
                    "depth_bias": quad["depth_bias"],
                    "color_raw": quad["color_raw"]})
        return groups


# =====================================================================
# Section 3: animations
# =====================================================================

class BitReader:
    """LSB-first, unaligned bit reader (always sign-extends, like the ref)."""

    def __init__(self, data: bytes, start_byte: int = 0) -> None:
        self.data = data
        self.byte_pos = start_byte
        self.bit_pos = 0

    def read_bits(self, count: int) -> int:
        pos = self.byte_pos
        n = len(self.data)
        b0 = self.data[pos] if pos < n else 0
        b1 = self.data[pos + 1] if pos + 1 < n else 0
        b2 = self.data[pos + 2] if pos + 2 < n else 0
        temp = b0 | (b1 << 8) | (b2 << 16)
        temp = (temp >> self.bit_pos) & ((1 << count) - 1)
        if temp & (1 << (count - 1)):
            temp -= 1 << count
        self.byte_pos = pos + (count + self.bit_pos) // 8
        self.bit_pos = (count + self.bit_pos) % 8
        return temp

    def read_bit(self) -> bool:
        return bool(self.read_bits(1) & 1)


class Animations:
    def __init__(self) -> None:
        self.clips: list[dict] = []

    def parse(self, data: bytes, skeleton: Skeleton) -> None:
        nb_anim = struct.unpack_from("<I", data, 0)[0]
        offsets = list(struct.unpack_from(f"<{nb_anim}I", data, 4))
        nb_bones = len(skeleton.bones)
        for anim_i, anim_start in enumerate(offsets):
            nb_frames = data[anim_start]
            br = BitReader(data, anim_start + 1)
            frames = []
            prev_pos = [0, 0, 0]
            prev_rot = [(0, 0, 0)] * nb_bones
            for _ in range(nb_frames):
                pos_raw = []
                for axis in range(3):
                    type_bits = br.read_bits(2) & 3
                    pos_raw.append(prev_pos[axis] + br.read_bits(
                        POSITION_SIZES[type_bits]))
                prev_pos = pos_raw
                mode_bit = br.read_bit()
                bone_rots = []
                for bone in range(nb_bones):
                    axis_vals = []
                    for axis in range(3):
                        if br.read_bit():
                            type_bits = br.read_bits(2) & 3
                            axis_vals.append(prev_rot[bone][axis] + br.read_bits(
                                ROTATION_SIZES[type_bits]))
                        else:
                            axis_vals.append(prev_rot[bone][axis])
                    bone_rots.append(axis_vals)
                prev_rot = bone_rots
                scales = None
                if mode_bit:
                    scales = []
                    for _bone in range(nb_bones):
                        scales.append([
                            (br.read_bits(16) + SCALE_NEUTRAL_RAW) if br.read_bit()
                            else SCALE_NEUTRAL_RAW
                            for _axis in range(3)])
                frames.append({"pos_raw": pos_raw, "rot_raw": bone_rots,
                               "scale_raw": scales})
            self.clips.append({
                "index": anim_i, "offset": anim_start,
                "nb_frames": nb_frames, "frames": frames,
                "bit_end_byte": br.byte_pos + (1 if br.bit_pos else 0)})


# =====================================================================
# Section 11: TIM container
# =====================================================================

class Tim:
    def __init__(self, index: int) -> None:
        self.index = index
        self.bpp = None
        self.has_clut = False
        self.clut_org = None
        self.clut_colors: list[int] = []
        self.img_org = None
        self.img_w = 0
        self.img_h = 0
        self.image: Image.Image | None = None

    def parse(self, blob: bytes) -> None:
        (tag,) = struct.unpack_from("<I", blob, 0)
        if tag != 0x10:
            raise ValueError(f"not a TIM (tag {tag:#x})")
        (flags,) = struct.unpack_from("<I", blob, 4)
        self.bpp = flags & 0x07
        self.has_clut = bool(flags & 0x08)
        pos = 8
        if self.has_clut:
            blen, cx, cy, cw, ch = struct.unpack_from("<IHHHH", blob, pos)
            self.clut_org = (cx, cy)
            self.clut_colors = list(struct.unpack_from(
                f"<{(blen - 12) // 2}H", blob, pos + 12))
            pos += blen
        ilen, ix, iy, iw, ih = struct.unpack_from("<IHHHH", blob, pos)
        self.img_org = (ix, iy)
        self.img_h = ih
        pixels = blob[pos + 12 : pos + ilen]
        if self.bpp == 0:  # 4bpp: 2 px per byte, low nibble first
            self.img_w = iw * 4
            indexed = bytearray(self.img_w * ih)
            for r in range(ih):
                row = r * iw
                for c in range(iw):
                    byte = pixels[row + c]
                    indexed[r * self.img_w + c * 2] = byte & 0x0F
                    indexed[r * self.img_w + c * 2 + 1] = byte >> 4
            self.image = self._decode(indexed)
        elif self.bpp == 1:  # 8bpp: 1 px per byte
            self.img_w = iw * 2
            self.image = self._decode(pixels)
        elif self.bpp == 2:  # 16bpp direct color
            self.img_w = iw
            self.image = self._decode(pixels)
        else:
            raise ValueError(f"unsupported TIM bpp {self.bpp}")

    def _decode(self, indexed: bytes) -> Image.Image:
        rgba = Image.new("RGBA", (self.img_w, self.img_h))
        px = rgba.load()
        for r in range(self.img_h):
            for c in range(self.img_w):
                if self.bpp == 2:
                    cc = struct.unpack_from("<H", indexed, (r * self.img_w + c) * 2)[0]
                    r5, g5, b5 = cc & 31, (cc >> 5) & 31, (cc >> 10) & 31
                else:
                    idx = indexed[r * self.img_w + c]
                    cc = self.clut_colors[idx] if idx < len(self.clut_colors) else 0
                    r5, g5, b5 = cc & 31, (cc >> 5) & 31, (cc >> 10) & 31
                red = (r5 << 3) | (r5 >> 2)
                green = (g5 << 3) | (g5 >> 2)
                blue = (b5 << 3) | (b5 >> 2)
                alpha = 255 if (red or green or blue) else 0  # black -> transparent
                px[c, r] = (red, green, blue, alpha)
        return rgba

    def clut_word(self) -> int | None:
        if not self.has_clut:
            return None
        cx, cy = self.clut_org
        return ((cy & 0x1FF) << 6) | ((cx & 0x3F0) >> 4)


class TimContainer:
    def __init__(self) -> None:
        self.tims: list[Tim] = []

    def parse(self, data: bytes) -> None:
        nb_tim = struct.unpack_from("<I", data, 0)[0]
        offsets = list(struct.unpack_from(f"<{nb_tim}I", data, 4))
        (end,) = struct.unpack_from("<I", data, 4 + 4 * nb_tim)
        for i, off in enumerate(offsets):
            span_end = offsets[i + 1] if i + 1 < nb_tim else end
            tim = Tim(i)
            tim.parse(data[off:span_end])
            self.tims.append(tim)


# =====================================================================
# Pose chain (verbatim port of the reference matrix pipeline, GPL-3.0)
# =====================================================================

class Mat4:
    def __init__(self) -> None:
        self.m = [[1.0, 0.0, 0.0, 0.0], [0.0, 1.0, 0.0, 0.0],
                  [0.0, 0.0, 1.0, 0.0], [0.0, 0.0, 0.0, 1.0]]

    @staticmethod
    def rot(axis: int, deg: float) -> "Mat4":
        r = math.radians(deg)
        c, s = math.cos(r), math.sin(r)
        m = Mat4()
        if axis == 0:
            m.m = [[1, 0, 0, 0], [0, c, -s, 0], [0, s, c, 0], [0, 0, 0, 1]]
        elif axis == 1:
            m.m = [[c, 0, s, 0], [0, 1, 0, 0], [-s, 0, c, 0], [0, 0, 0, 1]]
        else:
            m.m = [[c, -s, 0, 0], [s, c, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]
        return m

    @staticmethod
    def mul(a: "Mat4", b: "Mat4") -> "Mat4":
        out = Mat4()
        out.m = [[sum(a.m[i][k] * b.m[k][j] for k in range(4)) for j in range(4)]
                 for i in range(4)]
        return out


def compose_pose(skeleton: Skeleton, frame: dict) -> list[list[list[float]]]:
    """Standard 4x4 (column-vector) per-bone matrices for one frame.

    Port of the engine chain: local = Z(-rz)*Y(-ry)*X(-rx) (X first),
    chain = parent_chain * local, child origin = parent origin +
    parent_SCALED * (0, 0, parent_size/2048), skin matrix = chain with the
    accumulated per-axis scale applied column-wise."""
    nb = len(skeleton.bones)
    deg = 360.0 / 4096.0
    chains = [Mat4() for _ in range(nb)]
    worlds = [Mat4() for _ in range(nb)]
    acc = [(1.0, 1.0, 1.0)] * nb
    scale_raw = frame.get("scale_raw")
    for bone_id in range(nb):
        bone = skeleton.bones[bone_id]
        rx, ry, rz = frame["rot_raw"][bone_id]
        local = Mat4.mul(Mat4.rot(2, -rz * deg),
                         Mat4.mul(Mat4.rot(1, -ry * deg), Mat4.rot(0, -rx * deg)))
        parent = bone["parent"]
        b_scale = (tuple(s / 1024.0 for s in scale_raw[bone_id])
                   if scale_raw else (1.0, 1.0, 1.0))
        if parent != ROOT_PARENT:
            chain = Mat4.mul(chains[parent], local)
            pa = acc[parent]
            acc_b = (pa[0] * b_scale[0], pa[1] * b_scale[1], pa[2] * b_scale[2])
            pm = worlds[parent].m
            plen = skeleton.bones[parent]["size_raw"] * VERTEX_SCALE
            tx = pm[0][2] * plen + pm[0][3]
            ty = pm[1][2] * plen + pm[1][3]
            tz = pm[2][2] * plen + pm[2][3]
        else:
            chain = local
            acc_b = b_scale
            tx = ty = tz = 0.0
        chains[bone_id] = chain
        acc[bone_id] = acc_b
        world = Mat4()
        world.m = [
            [chain.m[0][0] * acc_b[0], chain.m[0][1] * acc_b[1],
             chain.m[0][2] * acc_b[2], tx],
            [chain.m[1][0] * acc_b[0], chain.m[1][1] * acc_b[1],
             chain.m[1][2] * acc_b[2], ty],
            [chain.m[2][0] * acc_b[0], chain.m[2][1] * acc_b[1],
             chain.m[2][2] * acc_b[2], tz],
            [0.0, 0.0, 0.0, 1.0]]
        worlds[bone_id] = world
    return [w.m for w in worlds]


def transform_point(m: list[list[float]], p: tuple[float, float, float]):
    x, y, z = p
    return (
        m[0][0] * x + m[0][1] * y + m[0][2] * z + m[0][3],
        m[1][0] * x + m[1][1] * y + m[1][2] * z + m[1][3],
        m[2][0] * x + m[2][1] * y + m[2][2] * z + m[2][3],
    )


def mat_inverse(m: list[list[float]]) -> list[list[float]]:
    aug = [list(m[r]) + [1.0 if c == r else 0.0 for c in range(4)] for r in range(4)]
    for col in range(4):
        pivot = max(range(col, 4), key=lambda r: abs(aug[r][col]))
        if abs(aug[pivot][col]) < 1e-12:
            raise ValueError("singular matrix")
        aug[col], aug[pivot] = aug[pivot], aug[col]
        inv = 1.0 / aug[col][col]
        aug[col] = [v * inv for v in aug[col]]
        for r in range(4):
            if r != col and aug[r][col]:
                f = aug[r][col]
                aug[r] = [aug[r][k] - f * aug[col][k] for k in range(8)]
    return [row[4:] for row in aug]


def mat_mul(a: list[list[float]], b: list[list[float]]) -> list[list[float]]:
    return [[sum(a[r][k] * b[k][c] for k in range(4)) for c in range(4)]
            for r in range(4)]


def _vertex_world(m: list[list[float]], disk: tuple[int, int, int],
                  tx: float = 0.0, ty: float = 0.0, tz: float = 0.0):
    """One vertex through the validated reference pipeline.

    Disk vertex (a, b, c) -> viewer mapping get_list = (-a, b, -c)/2048
    -> bone matrix as M * (x, -y, -z) + (M41, M42, M43) -> + frame position."""
    a, b, c = disk
    x, y, z = -a * VERTEX_SCALE, b * VERTEX_SCALE, -c * VERTEX_SCALE
    return (
        m[0][0] * x + m[0][1] * (-y) + m[0][2] * (-z) + m[0][3] + tx,
        m[1][0] * x + m[1][1] * (-y) + m[1][2] * (-z) + m[1][3] + ty,
        m[2][0] * x + m[2][1] * (-y) + m[2][2] * (-z) + m[2][3] + tz,
    )


def pose_engine(model, frame: dict) -> list[tuple[float, float, float]]:
    """Engine-space world positions of every mesh vertex for one frame."""
    globals_ = compose_pose(model.skeleton, frame)
    tx, ty, tz = frame["pos_raw"]
    tx, ty, tz = tx * POSITION_SCALE, ty * POSITION_SCALE, -tz * POSITION_SCALE
    return [_vertex_world(globals_[bone], raw, tx, ty, tz)
            for raw, bone in model.mesh.all_vertices()]


def pose_bind(model) -> list[tuple[float, float, float]]:
    frame = model.animations.clips[0]["frames"][0] if (
        model.animations.clips and model.animations.clips[0]["frames"]) else None
    if frame is None:
        raise ValueError("no animation to bind against")
    return pose_engine(model, frame)


# =====================================================================
# Model
# =====================================================================

class C0mModel:
    def __init__(self, name: str) -> None:
        self.name = name
        self.payload = b""
        self.section_count = 0
        self.spans: list[tuple[int, int]] = []
        self.skeleton = Skeleton()
        self.mesh = Mesh()
        self.animations = Animations()
        self.tims = TimContainer()

    def parse(self, payload: bytes) -> None:
        self.payload = payload
        self.section_count = struct.unpack_from("<I", payload, 0)[0]
        offsets = struct.unpack_from(f"<{self.section_count + 1}I", payload, 4)
        self.spans = list(zip(offsets[:-1], offsets[1:]))
        sections = [payload[s:e] for s, e in self.spans]
        if self.section_count >= 1:
            self.skeleton.parse(sections[0])
        if self.section_count >= 2:
            self.mesh.parse(sections[1])
        if self.section_count >= 3:
            self.animations.parse(sections[2], self.skeleton)
        if self.section_count >= 11:
            self.tims.parse(sections[10])


# =====================================================================
# GLB export (derivative of HobbitDur gltfexporter.py / glbbuilder.py)
# =====================================================================

COMPONENT_FLOAT = 5126
COMPONENT_UNSIGNED_SHORT = 5123
TARGET_ARRAY_BUFFER = 34962
TARGET_ELEMENT_ARRAY_BUFFER = 34963
FILTER_NEAREST = 9728
WRAP_REPEAT = 10497
NB_COMPONENTS = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}


class GlbBuilder:
    def __init__(self) -> None:
        self.binary_data = bytearray()
        self.buffer_views: list[dict] = []
        self.accessors: list[dict] = []

    def add_buffer_view(self, raw: bytes, target=None) -> int:
        while len(self.binary_data) % 4:
            self.binary_data.append(0)
        view = {"buffer": 0, "byteOffset": len(self.binary_data),
                "byteLength": len(raw)}
        if target is not None:
            view["target"] = target
        self.binary_data.extend(raw)
        self.buffer_views.append(view)
        return len(self.buffer_views) - 1

    def add_accessor(self, flat, component_type, accessor_type, target=None,
                     with_min_max=False) -> int:
        nb = NB_COMPONENTS[accessor_type]
        fmt = {5126: "f", 5123: "H", 5125: "I"}[component_type]
        raw = struct.pack(f"<{len(flat)}{fmt}", *flat)
        accessor = {
            "bufferView": self.add_buffer_view(raw, target),
            "componentType": component_type,
            "count": len(flat) // nb,
            "type": accessor_type}
        if with_min_max:
            accessor["min"] = [min(flat[i::nb]) for i in range(nb)]
            accessor["max"] = [max(flat[i::nb]) for i in range(nb)]
        self.accessors.append(accessor)
        return len(self.accessors) - 1


def write_glb_file(path: Path, gltf: dict, binary: bytearray) -> None:
    json_bytes = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    json_bytes += b" " * ((4 - len(json_bytes) % 4) % 4)
    binary_bytes = bytes(binary)
    binary_bytes += b"\x00" * ((4 - len(binary_bytes) % 4) % 4)
    total = 12 + 8 + len(json_bytes) + 8 + len(binary_bytes)
    with open(path, "wb") as fh:
        fh.write(struct.pack("<III", 0x46546C67, 2, total))
        fh.write(struct.pack("<II", len(json_bytes), 0x4E4F534A))
        fh.write(json_bytes)
        fh.write(struct.pack("<II", len(binary_bytes), 0x004E4942))
        fh.write(binary_bytes)


def local_transforms(bones, globals_):
    """Per-joint local TRS: translation, quaternion, scale."""
    out = []
    for bone_id, bone in enumerate(bones):
        if bone["parent"] == ROOT_PARENT:
            local = globals_[bone_id]
        else:
            local = mat_mul(mat_inverse(globals_[bone["parent"]]), globals_[bone_id])
        cols = [[local[r][c] for r in range(3)] for c in range(3)]
        scale = [math.sqrt(sum(c * c for c in col)) or 1.0 for col in cols]
        rot = [[cols[c][r] / scale[c] for c in range(3)] for r in range(3)]
        det = (rot[0][0] * (rot[1][1] * rot[2][2] - rot[1][2] * rot[2][1])
               - rot[0][1] * (rot[1][0] * rot[2][2] - rot[1][2] * rot[2][0])
               + rot[0][2] * (rot[1][0] * rot[2][1] - rot[1][1] * rot[2][0]))
        if det < 0:
            scale[0] = -scale[0]
            for r in range(3):
                rot[r][0] = -rot[r][0]
        q = quat_from_rot_matrix(rot)
        out.append(((local[0][3], local[1][3], local[2][3]), q, tuple(scale)))
    return out


def quat_from_rot_matrix(rot: list[list[float]]) -> tuple[float, float, float, float]:
    """Quaternion (x, y, z, w) from a proper rotation matrix (Shepperd)."""
    m00, m01, m02 = rot[0]
    m10, m11, m12 = rot[1]
    m20, m21, m22 = rot[2]
    trace = m00 + m11 + m22
    if trace > 0:
        s = math.sqrt(trace + 1.0) * 2
        w, x, y, z = 0.25 * s, (m21 - m12) / s, (m02 - m20) / s, (m10 - m01) / s
    elif m00 > m11 and m00 > m22:
        s = math.sqrt(1.0 + m00 - m11 - m22) * 2
        w, x, y, z = (m21 - m12) / s, 0.25 * s, (m01 + m10) / s, (m02 + m20) / s
    elif m11 > m22:
        s = math.sqrt(1.0 + m11 - m00 - m22) * 2
        w, x, y, z = (m02 - m20) / s, (m01 + m10) / s, 0.25 * s, (m12 + m21) / s
    else:
        s = math.sqrt(1.0 + m22 - m00 - m11) * 2
        w, x, y, z = (m10 - m01) / s, (m02 + m20) / s, (m12 + m21) / s, 0.25 * s
    length = math.sqrt(x * x + y * y + z * z + w * w) or 1.0
    return (x / length, y / length, z / length, w / length)


def export_glb(model: C0mModel, path: Path) -> dict:
    bones = model.skeleton.bones
    raw_positions, bone_ids = [], []
    for raw, bone in model.mesh.all_vertices():
        raw_positions.append(raw)
        bone_ids.append(bone)

    bind_anim = model.animations.clips[0] if model.animations.clips else None
    bind_frame = bind_anim["frames"][0] if bind_anim and bind_anim["frames"] else None
    skinned = bool(bones) and bind_frame is not None
    bind_globals = compose_pose(model.skeleton, bind_frame) if skinned else None

    world_positions = []
    if skinned:
        world_positions = [_vertex_world(bind_globals[bone_ids[gi]], raw)
                           for gi, raw in enumerate(raw_positions)]
    else:
        world_positions = [
            (-x * VERTEX_SCALE, y * VERTEX_SCALE, -z * VERTEX_SCALE)
            for x, y, z in raw_positions]

    builder = GlbBuilder()
    gltf = {"asset": {"version": "2.0",
                      "generator": "re-ff8 battle-model-probe (parse_c0m)"},
            "scene": 0}

    # --- materials / textures ---
    face_groups = model.mesh.faces_by_tex_word()
    tims = model.tims.tims
    if not tims:
        gltf["materials"] = [{
            "name": "ff8_flat",
            "pbrMetallicRoughness": {"baseColorFactor": [0.45, 0.65, 0.95, 1.0],
                                     "metallicFactor": 0.0, "roughnessFactor": 1.0},
            "doubleSided": True}]
        material_of_word = {w: 0 for w in face_groups}
    else:
        gltf["samplers"] = [{"magFilter": FILTER_NEAREST, "minFilter": FILTER_NEAREST,
                             "wrapS": WRAP_REPEAT, "wrapT": WRAP_REPEAT}]
        gltf["images"], gltf["textures"] = [], []
        for image_index, tim in enumerate(tims):
            png_buf = io.BytesIO()
            tim.image.save(png_buf, "PNG")
            gltf["images"].append({
                "name": f"tim_{image_index}", "mimeType": "image/png",
                "bufferView": builder.add_buffer_view(png_buf.getvalue())})
            gltf["textures"].append({"sampler": 0, "source": image_index})
        gltf["materials"] = []
        material_of_word = {}
        for rank, tex_word in enumerate(sorted(face_groups)):
            texture_index = min(rank, len(tims) - 1)
            gltf["materials"].append({
                "name": f"ff8_texture_{tex_word:#06x}",
                "pbrMetallicRoughness": {"baseColorTexture": {"index": texture_index},
                                         "metallicFactor": 0.0, "roughnessFactor": 1.0},
                "alphaMode": "MASK", "alphaCutoff": 0.5, "doubleSided": True})
            material_of_word[tex_word] = rank

    # --- primitives: one per tex word, per-face-expanded vertices ---
    primitives = []
    for tex_word, faces in sorted(face_groups.items()):
        positions, uvs, joints = [], [], []
        for face in faces:
            for corner in range(3):
                vi = face["v"][corner]
                positions.extend(world_positions[vi])
                u, v = face["uv"][corner]
                uvs.extend(((u & 0xFF) / 128.0, (v & 0xFF) / 128.0))
                joints.append(bone_ids[vi])
        attributes = {
            "POSITION": builder.add_accessor(
                positions, COMPONENT_FLOAT, "VEC3",
                target=TARGET_ARRAY_BUFFER, with_min_max=True),
            "TEXCOORD_0": builder.add_accessor(
                uvs, COMPONENT_FLOAT, "VEC2", target=TARGET_ARRAY_BUFFER),
            "JOINTS_0": builder.add_accessor(
                [c for j in joints for c in (j, 0, 0, 0)],
                COMPONENT_UNSIGNED_SHORT, "VEC4", target=TARGET_ARRAY_BUFFER),
            "WEIGHTS_0": builder.add_accessor(
                [c for _ in joints for c in (1.0, 0.0, 0.0, 0.0)],
                COMPONENT_FLOAT, "VEC4", target=TARGET_ARRAY_BUFFER)}
        primitives.append({"attributes": attributes,
                           "material": material_of_word[tex_word]})

    gltf["meshes"] = [{"name": model.name, "primitives": primitives}]
    mesh_node = {"name": model.name, "mesh": 0}
    nodes = [mesh_node]
    scene_roots = [0]

    if skinned:
        bind_locals = local_transforms(bones, bind_globals)
        first_joint = len(nodes)
        for bone_id, (trans, quat, scale) in enumerate(bind_locals):
            node = {"name": f"bone_{bone_id:02d}",
                    "translation": [round(t, 6) for t in trans],
                    "rotation": [round(c, 6) for c in quat]}
            if any(abs(s - 1.0) > 1e-6 for s in scale):
                node["scale"] = [round(s, 6) for s in scale]
            nodes.append(node)
        for bone_id, bone in enumerate(bones):
            if bone["parent"] != ROOT_PARENT:
                nodes[first_joint + bone["parent"]].setdefault(
                    "children", []).append(first_joint + bone_id)
        root_joints = [first_joint + b for b, bone in enumerate(bones)
                       if bone["parent"] == ROOT_PARENT]
        scene_roots.extend(root_joints)
        ibm_flat = []
        for gm in bind_globals:
            inv = mat_inverse(gm)
            ibm_flat.extend(inv[row][col] for col in range(4) for row in range(4))
        gltf["skins"] = [{
            "joints": [first_joint + b for b in range(len(bones))],
            "inverseBindMatrices": builder.add_accessor(ibm_flat, COMPONENT_FLOAT, "MAT4"),
            "skeleton": root_joints[0]}]
        mesh_node["skin"] = 0
        gltf["animations"] = build_glb_animations(model, builder, first_joint)

    gltf["nodes"] = nodes
    gltf["scenes"] = [{"nodes": scene_roots}]
    gltf["bufferViews"] = builder.buffer_views
    gltf["accessors"] = builder.accessors
    gltf["buffers"] = [{"byteLength": len(builder.binary_data)}]
    write_glb_file(path, gltf, builder.binary_data)
    return {
        "nodes": len(nodes),
        "materials": len(gltf.get("materials", [])),
        "primitives": len(primitives),
        "animations": len(gltf.get("animations", [])),
        "binary_bytes": len(builder.binary_data),
    }


def build_glb_animations(model: C0mModel, builder: GlbBuilder, first_joint: int) -> list[dict]:
    """One glTF animation per FF8 clip; keyframe on every frame at 15 fps."""
    bones = model.skeleton.bones
    anims_out = []
    for anim in model.animations.clips:
        if not anim["frames"]:
            continue
        translations = [[] for _ in bones]
        rotations = [[] for _ in bones]
        for frame in anim["frames"]:
            globals_ = compose_pose(model.skeleton, frame)
            for bone_id, (trans, quat, _scale) in enumerate(
                    local_transforms(bones, globals_)):
                if rotations[bone_id]:
                    prev = rotations[bone_id][-4:]
                    if sum(p * r for p, r in zip(prev, quat)) < 0:
                        quat = tuple(-c for c in quat)
                translations[bone_id].extend(trans)
                rotations[bone_id].extend(quat)
        times = [i / FPS for i in range(len(anim["frames"]))]
        input_acc = builder.add_accessor(times, COMPONENT_FLOAT, "SCALAR",
                                         with_min_max=True)
        samplers, channels = [], []
        for bone_id in range(len(bones)):
            samplers.append({
                "input": input_acc, "interpolation": "LINEAR",
                "output": builder.add_accessor(translations[bone_id],
                                               COMPONENT_FLOAT, "VEC3")})
            channels.append({"sampler": len(samplers) - 1,
                             "target": {"node": first_joint + bone_id,
                                        "path": "translation"}})
            samplers.append({
                "input": input_acc, "interpolation": "LINEAR",
                "output": builder.add_accessor(rotations[bone_id],
                                               COMPONENT_FLOAT, "VEC4")})
            channels.append({"sampler": len(samplers) - 1,
                             "target": {"node": first_joint + bone_id,
                                        "path": "rotation"}})
        anims_out.append({"name": f"anim_{anim['index']}_{len(anim['frames'])}f",
                          "samplers": samplers, "channels": channels})
    return anims_out


# =====================================================================
# CLI
# =====================================================================

def main() -> int:
    parser = argparse.ArgumentParser(description="FF8 c0mNNN.dat parser + GLB/PNG exporter")
    parser.add_argument("--c0m", default="90,0", help="c0m numbers (default: 90 primary, 0 backup)")
    parser.add_argument("--archive-dir", type=Path, default=None)
    parser.add_argument("--out", type=Path, default=Path(__file__).resolve().parent / "out")
    args = parser.parse_args()

    archive = BattleArchive(args.archive_dir) if args.archive_dir else BattleArchive()
    args.out.mkdir(parents=True, exist_ok=True)
    registry = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    reg_entries = {e["name"]: e for e in registry["entries"]}

    for c0m in [int(x) for x in args.c0m.split(",") if x.strip()]:
        idx = archive.c0m_index(c0m)
        if idx is None:
            print(f"c0m{c0m:03d}: not in archive")
            continue
        _, payload, meta = archive.read_entry(idx)
        model = C0mModel(f"c0m{c0m:03d}")
        model.parse(payload)

        expected = reg_entries[f"c0m{c0m:03d}.dat"]
        payload_ok = hashlib.sha256(payload).hexdigest() == expected["sha256"]
        sections_ok = all(
            hashlib.sha256(payload[s:e]).hexdigest() == spec["sha256"]
            for (s, e), spec in zip(model.spans, expected["sections"]))

        face_groups = model.mesh.faces_by_tex_word()
        structure = {
            "name": model.name,
            "fi_index": idx,
            "fl_name": meta["fl_name"],
            "payload_size": len(payload),
            "payload_sha256": hashlib.sha256(payload).hexdigest(),
            "anchor_pass": payload_ok,
            "sections_byte_exact": sections_ok,
            "section_count": model.section_count,
            "skeleton": model.skeleton.to_json(),
            "mesh": {
                "trailing_u32": model.mesh.trailing_u32,
                "walked_vertices": model.mesh.walked_vertices,
                "vertex_count_note": (
                    "trailing u32 == walked vertex count"
                    if model.mesh.trailing_u32 == model.mesh.walked_vertices
                    else "trailing u32 != walked sum (multi-object mesh: "
                         "u32 = first object's vertex count; engine keeps "
                         "global indices across objects, like HobbitDur's "
                         "exporter)"),
                "nb_objects": len(model.mesh.objects),
                "objects": [
                    {
                        "vertex_base": obj["vertex_base"],
                        "nb_blocks": len(obj["blocks"]),
                        "blocks": [
                            {"bone": bl["bone"], "nb_vertices": bl["nb_vertices"],
                             "vertex_base": bl["vertex_base"]}
                            for bl in obj["blocks"]],
                        "nb_tri": obj["nb_tri"], "nb_quad": obj["nb_quad"],
                        "nb_col_tri": obj["nb_col_tri"],
                        "nb_col_quad": obj["nb_col_quad"],
                    }
                    for obj in model.mesh.objects],
                "tex_words_used": {f"{w:#06x}": len(v)
                                   for w, v in sorted(face_groups.items())},
            },
            "animations": [
                {
                    "index": clip["index"], "offset": clip["offset"],
                    "nb_frames": clip["nb_frames"],
                    "bit_end_byte": clip["bit_end_byte"],
                    "frames": [
                        {"pos_raw": list(f["pos_raw"]),
                         "rot_raw": f["rot_raw"],
                         "scale_raw": f["scale_raw"]}
                        for f in clip["frames"]],
                }
                for clip in model.animations.clips],
            "tim_container": {
                "nb_tim": len(model.tims.tims),
                "tims": [
                    {
                        "bpp": tim.bpp,
                        "has_clut": tim.has_clut,
                        "clut": None if not tim.has_clut else {
                            "org": list(tim.clut_org),
                            "nb_colors": len(tim.clut_colors)},
                        "img_org": list(tim.img_org),
                        "size_px": [tim.img_w, tim.img_h],
                        "clut_word": tim.clut_word(),
                    }
                    for tim in model.tims.tims],
            },
        }
        out_json = args.out / f"{model.name}_structure.json"
        out_json.write_text(json.dumps(structure, indent=1), encoding="utf-8")

        if not model.mesh.objects:
            print(f"{model.name}: no mesh (2-section overlay) -> structure json only")
            continue

        for tim_index, tim in enumerate(model.tims.tims):
            tim.image.save(args.out / f"{model.name}_tim{tim_index}.png")

        glb_stats = export_glb(model, args.out / f"{model.name}.glb")
        print(
            f"{model.name}: bones {len(model.skeleton.bones)}, "
            f"objects {len(model.mesh.objects)}, verts {model.mesh.walked_vertices}, "
            f"anims {len(model.animations.clips)}, tims {len(model.tims.tims)} "
            f"| GLB {glb_stats}"
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
