import hashlib
from pathlib import Path
from types import SimpleNamespace
import tempfile
import unittest

import numpy as np

import ff8dump as dump
import render_lot17
import render_lot21 as lot21


def vertex(x, y, u, v, *, rhw=1.0, rgb=(255, 255, 255), alpha=255):
    diffuse = (alpha << 24) | (rgb[0] << 16) | (rgb[1] << 8) | rgb[2]
    return (float(x), float(y), 0.0, float(rhw), diffuse, 0, float(u), float(v))


class Lot21RasterTests(unittest.TestCase):
    def setUp(self):
        self.image = np.array([[0, 1], [2, 3]], dtype=np.uint8)
        self.palette = np.array([[0, 0, 0, 0], [255, 0, 0, 255],
                                 [0, 255, 0, 255], [0, 0, 255, 255]], dtype=np.uint8)

    def test_uv_rotation_moves_uv_only(self):
        tri = (vertex(0, 0, 0, 0), vertex(4, 0, 1, 0), vertex(0, 4, 0, 1))
        rotated = lot21.rotate_uv(tri, 1)
        self.assertEqual([(v[0], v[1]) for v in rotated], [(0, 0), (4, 0), (0, 4)])
        self.assertEqual([(v[6], v[7]) for v in rotated], [(1, 0), (0, 1), (0, 0)])

    def test_perspective_changes_result(self):
        tri = (vertex(0, 0, 0, 0, rhw=1), vertex(7, 0, 1, 0, rhw=.1),
               vertex(0, 7, 0, 1, rhw=.1))
        affine = np.full((8, 8, 3), 32, dtype=np.uint8)
        perspective = affine.copy()
        lot21.raster_triangle_alpha(affine, tri, self.image, self.palette, perspective=False)
        lot21.raster_triangle_alpha(perspective, tri, self.image, self.palette, perspective=True)
        self.assertFalse(np.array_equal(affine, perspective))

    def test_diffuse_alpha_source_over_and_opaque_diagnostic(self):
        palette = np.array([[200, 0, 0, 255]], dtype=np.uint8)
        image = np.zeros((1, 1), dtype=np.uint8)
        tri = (vertex(0, 0, 0, 0, alpha=127), vertex(5, 0, 0, 0, alpha=127),
               vertex(0, 5, 0, 0, alpha=127))
        blended = np.full((6, 6, 3), 100, dtype=np.uint8)
        opaque = blended.copy()
        lot21.raster_triangle_alpha(blended, tri, image, palette, perspective=False)
        lot21.raster_triangle_alpha(opaque, tri, image, palette, perspective=False,
                                    blend_diffuse=False)
        self.assertTrue(np.allclose(blended[1, 1], [150, 50, 50], atol=1))
        self.assertEqual(opaque[1, 1].tolist(), [200, 0, 0])

    def test_palette_zero_alpha_and_low_diffuse_alpha_are_transparent(self):
        tri = (vertex(0, 0, 0, 0), vertex(5, 0, 0, 0), vertex(0, 5, 0, 0))
        frame = np.full((6, 6, 3), 77, dtype=np.uint8)
        transparent_palette = np.array([[255, 0, 0, 0]], dtype=np.uint8)
        lot21.raster_triangle_alpha(frame, tri, np.zeros((1, 1), dtype=np.uint8),
                                    transparent_palette, perspective=False)
        self.assertEqual(frame[1, 1].tolist(), [77, 77, 77])
        low = tuple(vertex(v[0], v[1], v[6], v[7], alpha=0) for v in tri)
        lot21.raster_triangle_alpha(frame, low, None, None, perspective=False)
        self.assertEqual(frame[1, 1].tolist(), [77, 77, 77])

    def test_shared_edge_is_owned_once_for_alpha_blend(self):
        image = np.zeros((1, 1), dtype=np.uint8)
        palette = np.array([[200, 0, 0, 255]], dtype=np.uint8)
        a = vertex(0, 0, 0, 0, alpha=127)
        b = vertex(4, 0, 0, 0, alpha=127)
        c = vertex(4, 4, 0, 0, alpha=127)
        d = vertex(0, 4, 0, 0, alpha=127)
        frame = np.full((5, 5, 3), 100, dtype=np.uint8)
        lot21.raster_triangle_alpha(frame, (a, b, c), image, palette, perspective=False)
        lot21.raster_triangle_alpha(frame, (a, c, d), image, palette, perspective=False)
        self.assertTrue(np.allclose(frame[2, 2], [150, 50, 50], atol=1))


class Lot21IntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.root = Path(__file__).resolve().parents[3]
        cls.capture = cls.root / "tools/_tmp_af3dn_drop/captures/lot20/battle_v13/gfx_passthrough_dump.bin"
        cls.reference = cls.root / "tools/_tmp_af3dn_drop/captures/lot20/battle_v13/visuals/20260929172809_1.jpg"

    def test_v13_strict_capture_and_outputs(self):
        if not self.capture.exists():
            self.skipTest("lot20 v13 capture is not available")
        oracle = Path(render_lot17.__file__)
        before = hashlib.sha256(oracle.read_bytes()).hexdigest()
        _, build, records, tx, tr = render_lot17.load_capture(self.capture)
        self.assertEqual((build, len(records), len(tx), len(tr)), (0x5640, 2512, 16, 192))
        self.assertTrue(all(tuple(getattr(item, "texwin", (0, 0, 0, 0))) == (0, 0, 0, 0)
                            for item in tx))
        with tempfile.TemporaryDirectory() as tmp:
            lot21.run(SimpleNamespace(dump=str(self.capture), out=tmp, seq=7105,
                                      reference=str(self.reference)))
            expected = {"LOT21_uv_board.png", "LOT21_background.png",
                        "LOT21_slot49_diagnostic.png", "LOT21_composite_full.png",
                        "LOT21_composite_pair.png", "LOT21_host_order.png",
                        "LOT21_host_order_pair.png", "LOT21_blend_comparison.png",
                        "manifest.json"}
            self.assertTrue(expected.issubset({p.name for p in Path(tmp).iterdir()}))
            manifest = __import__("json").loads((Path(tmp) / "manifest.json").read_text())
            self.assertEqual(manifest["build"], "0x5640")
            self.assertIn("MissingEvidence", manifest["slot49"]["status"])
        after = hashlib.sha256(oracle.read_bytes()).hexdigest()
        self.assertEqual(before, after)


if __name__ == "__main__":
    unittest.main()
