"""Meaningful boundary and capture tests for the offline lot17 path."""
from pathlib import Path
from types import SimpleNamespace
import struct
import tempfile
import unittest

import numpy as np

import ff8dump as dump
from lot17_texture_window import (
    MIRROR_SIZE, MissingEvidence, TextureWindow, actor_palette, actor_palette_pc_bgra,
    barycentric_weights, clut_offset, convert_uv, extract_page_window,
    locate_index_rect, locate_pc_bgra_palette, raster_triangle, read_actor_band, slot_actor,
    triangles_with_slots,
)
from render_lot17 import load_capture

import fixture_paths


class WindowTests(unittest.TestCase):
    def test_packet_latch_and_origin_clamp(self):
        self.assertFalse(TextureWindow.from_word(0xE2000000).active)
        self.assertEqual(TextureWindow.from_word(0).width, 256)
        self.assertEqual(TextureWindow.from_word(31).width, 8)
        win = TextureWindow.from_word(16 | (24 << 10) | (31 << 15))
        self.assertEqual((win.x, win.y, win.width, win.height), (192, 248, 64, 8))

    def test_exact_paths_and_corrected_convention(self):
        self.assertEqual(convert_uv(0, 255, provenance='u8', window_word=0), (1/256, 254/256))
        self.assertEqual(convert_uv(0, 255, provenance='u8', window_word=16), (0, 255/256))
        self.assertEqual(convert_uv(128, 255, provenance='u8', window_word=16), (1, 255/256))
        self.assertEqual(convert_uv(255, 255, provenance='u8', window_word=0, mode='corrected255'), (1, 1))
        self.assertEqual(convert_uv(255, 255, provenance='u8', window_word=16, mode='corrected255'), (2, 1))

    def test_missing_is_not_zero(self):
        with self.assertRaises(MissingEvidence):
            convert_uv(40, 80, provenance='u8')
        with self.assertRaises(MissingEvidence):
            convert_uv(.5, .5, provenance='final_f32', mode='corrected255')
        with self.assertRaises(ValueError):
            convert_uv(256, 0, provenance='u8', window_word=0)

    def test_final_float_bits_unchanged(self):
        for u, v in [(-0.0, 1/256), (1.5, -.25), (254/256, 1.0)]:
            result = convert_uv(u, v, provenance='final_f32', window_word=16)
            self.assertEqual(struct.pack('<2f', u, v), struct.pack('<2f', *result))


class VramTests(unittest.TestCase):
    def setUp(self):
        self.mirror = bytearray(MIRROR_SIZE)
        for g in range(3):
            for half in (0, 1):
                off = (224 + 2*g + half) * 2048
                self.mirror[off:off+512] = struct.pack('<256H', *([0x4000 + 0x100*g + half] * 256))
                self.mirror[off+512:off+1024] = b'\xEE' * 512  # contiguous-slice trap

    def test_actor_bands_use_two_rows(self):
        for slot in (0, 2, 4):
            g = slot_actor(slot)
            band = read_actor_band(self.mirror, g)
            self.assertEqual(len(band), 1024)
            self.assertEqual(struct.unpack_from('<H', band, 512)[0], 0x4001 + 0x100*g)
            self.assertNotIn(b'\xEE\xEE', band)
            self.assertEqual(clut_offset((224 + 2*g) << 6), (224 + 2*g) * 2048)
        with self.assertRaises(MissingEvidence):
            slot_actor(3)

    def test_bgr_canary(self):
        self.mirror[224*2048:224*2048+2] = struct.pack('<H', 0x447F)
        colors, _ = actor_palette(self.mirror, 0)
        self.assertEqual(tuple(colors[0]), (140, 24, 255))

    def test_origin_applies_to_texture_not_uv(self):
        win = TextureWindow.from_word(16 | (1 << 10) | (2 << 15))
        self.mirror[16*2048+1280+8] = 77
        image = extract_page_window(self.mirror, 10, win)
        self.assertEqual(image.shape, (240, 128))
        self.assertEqual(image[0, 0], 77)
        self.assertEqual(convert_uv(64, 120, provenance='u8', window_word=win.word), (.5, .5))

    def test_byte_exact_image_localization(self):
        pixels = bytes(range(64))
        for y in range(4):
            off = (30+y)*2048 + 1408
            self.mirror[off:off+16] = pixels[y*16:(y+1)*16]
        self.assertEqual(locate_index_rect(bytes(self.mirror), pixels, 16, 4), [(1408, 30)])

    def test_pc_bgra_binding_is_not_the_footer_number(self):
        # A local cache ID can refer to the second palette of actor 3.
        words = np.array([i % 32 | ((i // 8) % 32) << 5 | ((i // 16) % 32) << 10
                          for i in range(256)], dtype='<u2')
        self.mirror[231*2048:231*2048+512] = words.tobytes()
        colors = actor_palette_pc_bgra(self.mirror, 3, 1)
        pc = (colors[:, 0].astype(np.uint32) << 16) | (colors[:, 1].astype(np.uint32) << 8) | colors[:, 2]
        self.assertEqual(locate_pc_bgra_palette(self.mirror, pc.astype('<u4').tobytes()), [231])
        self.assertEqual(tuple(colors[31]), (255, 24, 8))

    def test_empty_palette_cannot_prove_an_alias(self):
        with self.assertRaises(MissingEvidence):
            locate_pc_bgra_palette(self.mirror, bytes(1024))


class RasterTests(unittest.TestCase):
    def test_weights_correspond_to_their_vertices(self):
        points = [(0, 0), (8, 0), (0, 8)]
        for i, p in enumerate(points):
            expected = [0, 0, 0]
            expected[i] = 1
            self.assertEqual(tuple(barycentric_weights(points, *p)), tuple(expected))

    def test_textured_interpolation_not_cyclically_rotated(self):
        image = np.tile(np.arange(8, dtype=np.uint8), (8, 1))
        palette = np.array([(i*10, 0, 0) for i in range(256)], dtype=np.uint16)
        tri = [(0, 0, 0, 1, 0xFFFFFFFF, 0, 0, 0),
               (8, 0, 0, 1, 0xFFFFFFFF, 0, 1, 0),
               (0, 8, 0, 1, 0xFFFFFFFF, 0, 0, 1)]
        for vertices in (tri, tri[::-1]):
            frame = np.zeros((10, 10, 3), dtype=np.uint8)
            raster_triangle(frame, vertices, image, palette)
            self.assertEqual(tuple(frame[0, 4]), (40, 0, 0))

    def test_quad_and_triangle_id_grouping(self):
        for nv, indices, expected in [(6, [2,1,0,5,4,3], [0,2]),
                                      (8, [2,1,0,3,1,2,6,5,4,7,5,6], [0,0,2,2])]:
            fvf = b''.join(dump.VERT.pack(i, 0, 0, 1, 0xFFFFFFFF, 0, i/256, 0) for i in range(nv))
            record = SimpleNamespace(fvf=fvf, vcount=nv, icount=len(indices),
                                     indices=struct.pack(f'<{len(indices)}H', *indices), ids=[0,2])
            grouped = list(triangles_with_slots(record))
            self.assertEqual([slot for _, slot in grouped], expected)
            self.assertEqual([v[0] for v in grouped[0][0]], [2,1,0])

    def test_perspective_uses_captured_rhw(self):
        image = np.tile(np.arange(8, dtype=np.uint8), (8, 1))
        palette = np.array([(i*10, 0, 0) for i in range(256)], dtype=np.uint16)
        tri = [(0, 0, 0, 1, 0xFFFFFFFF, 0, 0, 0),
               (8, 0, 0, 2, 0xFFFFFFFF, 0, 1, 0),
               (0, 8, 0, 1, 0xFFFFFFFF, 0, 0, 1)]
        frame = np.zeros((10, 10, 3), dtype=np.uint8)
        raster_triangle(frame, tri, image, palette, perspective=True)
        self.assertEqual(tuple(frame[0, 4]), (50, 0, 0))


class BuildTests(unittest.TestCase):
    @staticmethod
    def node(build):
        return dump.HDR.pack(dump.MAGIC_ND, 47, 1, 0, 0, 0, 0, 24, build) + bytes(24)

    def test_explicit_historical_build_and_default_isolation(self):
        for build in (0x563D, 0x563E):
            recs, warnings, _, _ = dump.parse_dump(self.node(build), expected_build=build)
            self.assertEqual(warnings, [])
            self.assertEqual(dump.stats(recs, expected_build=build)['build_mismatches'], 0)
        self.assertEqual(dump.BUILD_ID, 0x563E)
        with self.assertRaises(dump.DumpError):
            dump.parse_dump(self.node(0x563C), expected_build=0x563C)

    def test_mixed_resource_build_rejected(self):
        # ND anchor followed by a TX07 with a different build must not slip
        # through strict loading merely because ND records match.
        tx = dump.TX_HDR.pack(dump.MAGIC_TX, 0x563E, 1, 0, 0, 0, 0, 0) + bytes(dump.TX_REC_BYTES - dump.TX_HDR.size)
        with tempfile.TemporaryDirectory() as d:
            p = Path(d)/'mixed.bin'
            p.write_bytes(self.node(0x563D) + tx)
            with self.assertRaises((ValueError, dump.DumpError)):
                load_capture(p)

    def test_battle13_strict_integration_when_available(self):
        p = fixture_paths.historical()
        if not p.exists():
            self.fail('BASELINE_MISSING: historical capture is required for the complete suite')
        _, build, recs, tx, tr = load_capture(p)
        self.assertEqual((build, len(recs), len(tx), len(tr)), (0x563D, 2512, 16, 176))
        self.assertEqual(sum(r.vcount for r in recs if r.slot == 51 and r.geom_kind == 2), 121280)


if __name__ == '__main__':
    unittest.main()
