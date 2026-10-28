#!/usr/bin/env python3
"""Bounded synthetic Lot 25 loader tests; no live capture/writer/deploy.

Uses the existing Lot24 synthetic fixtures (test_lot24_contract: ST09 40B,
ND07 setup/kind1, ND08 kind2 with node24 + vc/ic + indices + FVF + footer
4I + ids + pad + 13I, TX07 0x100828 with TEXWIN tail, TR08 10I + payload)
and parameterizes them over every supported build (0x5642/0x5643/0x5644)
by rewriting only the whitelisted build word. Buffer-level tests (FVF,
indices, ids, TEXWIN window, palette row, mirror/sys-CLUT row) are exact
slice checks; record fields are sampled and never repaired.
"""
import struct
import tempfile
import unittest
from pathlib import Path

import ff8dump
import lot24_contract as contract
import lot25_render_input as ri
import test_lot24_contract as fx


def rebuilt(blob, build):
    """Same synthetic layout, explicit whitelisted build id (byte rewrite)."""
    magic = struct.unpack_from('<I', blob)[0]
    at = 32 if magic in (ff8dump.MAGIC_ND, ff8dump.MAGIC_ND8) else 4
    return fx.word(blob, at, build)


def capture(build=contract.BUILD, **draw_kwargs):
    """Mixed stream: ST09 + TX07 + TR08 + ND07 setup + kind1 + ND08 draw."""
    draw = fx.draw(seq=4, **draw_kwargs)
    return (rebuilt(fx.event(), build) + rebuilt(fx.tx07(1), build) +
            rebuilt(fx.tr08(1), build) + rebuilt(fx.nd07_setup(2), build) +
            rebuilt(fx.kind1(3), build) + rebuilt(draw, build))


def tx_rich(build, seq=1, texwin=(321, 432, 512, 256)):
    """TX07 with distinct mirror / sys-CLUT row / TEXWIN contents."""
    mirror = bytes(range(16)) * (ff8dump.TX_VRAM_BYTES // 16)
    sysclut = b'\xCD' * 2048
    tail = struct.pack('<4H', *texwin)
    return (ff8dump.TX_HDR.pack(ff8dump.MAGIC_TX, build, seq, 0x7FFF,
                                0x55AA0000, 0x1B47818, 0xB7DB44, 0x9876) +
            mirror + sysclut + tail)


def tr_rich(build, seq=5, texobj=0x6D65790, pixels=b'P' * 256,
            rawclut=b'C' * 64):
    """TR08 with non-zero pixel and palette blob contents."""
    return (struct.pack('<10I', ff8dump.MAGIC_TR, build, seq, texobj, 16, 16,
                        16, 4, len(pixels), len(rawclut)) + pixels + rawclut)


def draw_custom(build, seq=1, epoch=7):
    """ND08 quad-strip shape with a non-zero 13-word footer and 5 ids.

    Independent layout math (vcount=4, icount=6): header 36; node @36;
    counts @60; indices @68 (12 B, no pad); FVF @80 (4*32); footer @208 =
    4I + 5 ids + pad3 + 13I; record ends @284.
    """
    verts = b''.join(ff8dump.VERT.pack(float(i) * 1.5, float(i) * -2.5, 7.5,
                                       1.0, 0xFFFF0000, 0x00FF00FF,
                                       float(i), float(i) * 3.0)
                     for i in range(4))
    indices = struct.pack('<6H', 0, 1, 2, 3, 1, 2)
    ids = bytes((7, 8, 9, 10, 255))
    state = (2, 12345, 0x1234, 0x5678, 3, epoch,
             contract.HAS_EPOCH | contract.STAGE0_VALID, 5, 6, 7, 9, 4, 1)
    tail = struct.pack('<4I', 17, 18, 19, len(ids)) + ids
    tail += b'\0' * ((4 - (len(ids) % 4)) % 4) + struct.pack('<13I', *state)
    payload = (bytes(24) + struct.pack('<2I', 4, 6) + indices + verts + tail)
    return ff8dump.HDR.pack(ff8dump.MAGIC_ND8, 49, seq, 0xABC, 0xDEF, 2, 0,
                            len(payload), build) + payload


class LoaderDecodeTests(unittest.TestCase):
    def result_keys(self, result, build):
        self.assertEqual(set(result), {'data', 'build', 'records', 'mirrors',
                                       'resources', 'parsed', 'replay'})
        self.assertEqual(result['build'], build)

    def test_whitelist_passthrough_and_every_supported_build(self):
        self.assertEqual(ri.SUPPORTED_BUILDS, contract.SUPPORTED_BUILDS)
        self.assertEqual(ri.SUPPORTED_BUILDS, (0x5642, 0x5643, 0x5644, 0x5646))
        for build in contract.SUPPORTED_BUILDS:
            blob = capture(build)
            result = ri.decode_capture(blob, build=build)
            self.result_keys(result, build)
            self.assertIs(result['data'], blob)
            parsed = result['parsed']
            self.assertEqual([r['family'] for r in parsed['records']],
                             ['ST09', 'TX07', 'TR08', 'ND07', 'ND07', 'ND08'])
            self.assertEqual((len(result['records']), len(result['mirrors']),
                              len(result['resources'])), (3, 1, 1))
            self.assertEqual((parsed['st_records'], parsed['nd_records'],
                              parsed['tx_records'], parsed['tr_records']),
                             (1, 3, 1, 1))
            self.assertEqual([r.geom_kind for r in result['records']],
                             [0, 1, 2])
            self.assertEqual([r.slot for r in result['records']],
                             [44, 43, 49])
            self.assertEqual([r.build for r in result['records']],
                             [build, build, build])
            self.assertTrue(result['replay']['incomplete'])
            self.assertEqual(len(result['replay']['draws']), 3)

    def test_decode_matches_validated_offsets_and_stream_order(self):
        blob = capture()
        parsed = contract.parse_strict(blob, build=contract.BUILD)
        result = ri.decode_capture(blob, build=contract.BUILD)
        self.assertEqual([r.offset for r in result['records']],
                         [r['offset'] for r in parsed['records']
                          if r['family'].startswith('ND')])
        self.assertEqual([r.offset for r in result['mirrors']],
                         [r['offset'] for r in parsed['records']
                          if r['family'] == 'TX07'])
        self.assertEqual([r.offset for r in result['resources']],
                         [r['offset'] for r in parsed['records']
                          if r['family'] == 'TR08'])

    def test_st_retained_parsed_only_not_geometry_count(self):
        blob = rebuilt(fx.event(), contract.BUILD) + \
            rebuilt(fx.draw(seq=2), contract.BUILD)
        result = ri.decode_capture(blob, build=contract.BUILD)
        self.assertEqual(len(result['records']), 1)      # ND geometry only
        self.assertTrue(all(isinstance(r, ff8dump.Record)
                            for r in result['records']))
        self.assertEqual(result['records'][0].geom_kind, 2)
        self.assertEqual(len(result['parsed']['events']), 1)
        self.assertEqual(result['parsed']['st_records'], 1)

    def test_tx_mirror_sysclut_texwin_exact(self):
        texwin = (321, 432, 512, 256)
        mirror = bytes(range(16)) * (ff8dump.TX_VRAM_BYTES // 16)
        blob = tx_rich(contract.BUILD, texwin=texwin)
        # Metadata-only streams have no state/draw replay; keep a real ND
        # record in the fixture without shifting the TX offsets under test.
        rec = ri.decode_capture(blob + fx.nd07_setup(1), build=contract.BUILD)['mirrors'][0]
        self.assertEqual(rec.mirror, mirror)
        self.assertEqual(rec.sys_clut_row, b'\xCD' * 2048)
        self.assertEqual(rec.texwin, texwin)
        header = ff8dump.TX_HDR.size
        self.assertEqual(rec.mirror,
                         blob[header:header + ff8dump.TX_VRAM_BYTES])
        self.assertEqual(rec.sys_clut_row,
                         blob[header + ff8dump.TX_VRAM_BYTES:
                              header + ff8dump.TX_VRAM_BYTES + 2048])
        self.assertEqual(rec.texwin, struct.unpack('<4H', blob[-8:]))
        self.assertEqual((rec.build, rec.seq, rec.clut_now, rec.vram_base,
                          rec.sys_clut_base, rec.m_B7DB44, rec.page_probe),
                         (contract.BUILD, 1, 0x7FFF, 0x55AA0000, 0x1B47818,
                          0xB7DB44, 0x9876))
        self.assertEqual(rec.provenance['texwin_offset'],
                         header + ff8dump.TX_VRAM_BYTES + 2048)

    def test_tr_pixels_rawclut_exact(self):
        blob = tr_rich(contract.BUILD)
        rec = ri.decode_capture(blob + fx.nd07_setup(5), build=contract.BUILD)['resources'][0]
        self.assertEqual(rec.pixels, b'P' * 256)
        self.assertEqual(rec.raw_clut, b'C' * 64)
        self.assertEqual(rec.pixels, blob[40:40 + 256])
        self.assertEqual(rec.raw_clut, blob[40 + 256:40 + 256 + 64])
        self.assertEqual((rec.build, rec.seq, rec.texobj, rec.w, rec.h,
                          rec.pal_entries, rec.pal_count),
                         (contract.BUILD, 5, 0x6D65790, 16, 16, 16, 4))
        self.assertEqual(rec.provenance['raw_clut_offset'], 296)

    def test_nd_node_kind0_kind1_exact(self):
        blob = rebuilt(fx.nd07_setup(2), contract.BUILD) + \
            rebuilt(fx.kind1(3), contract.BUILD)
        result = ri.decode_capture(blob, build=contract.BUILD)
        node_only, kind1 = result['records']
        self.assertEqual((node_only.geom_kind, node_only.slot,
                          node_only.ctx, node_only.node_addr, node_only.seq),
                         (0, 44, 0x3333, 0x4444, 2))
        self.assertEqual(node_only.node, bytes(24))
        self.assertEqual((node_only.vcount, node_only.icount), (0, 0))
        self.assertEqual((node_only.indices, node_only.fvf, node_only.packet),
                         (b'', b'', b''))
        self.assertEqual(node_only.provenance['record_size'], 60)
        self.assertEqual((kind1.geom_kind, kind1.slot, kind1.seq,
                          kind1.ctx, kind1.node_addr), (1, 43, 3, 0x1111,
                                                        0x2222))
        self.assertEqual((kind1.prim, kind1.packet), (3, bytes(40)))
        self.assertEqual(kind1.node, bytes(24))
        for rec in (node_only, kind1):
            self.assertEqual((rec.fails, rec.build), (0, contract.BUILD))
            self.assertIs(rec.idx_repaired, False)
            self.assertEqual(rec.provenance['record_size'], 60 if
                             rec is node_only else 104)
        # This fixture has only ND07 setup then kind1, not the full capture()
        # ST/TX/TR prefix. Derive its absolute offset from the actual prefix.
        kind1_at = len(rebuilt(fx.nd07_setup(2), contract.BUILD))
        self.assertEqual(kind1.provenance['record_offset'], kind1_at)
        self.assertEqual(kind1.provenance['prim_offset'], kind1_at + 60)
        self.assertEqual(kind1.provenance['packet_offset'], kind1_at + 64)

    def test_nd_kind2_buffers_exact_and_no_repairs(self):
        verts = b''.join(ff8dump.VERT.pack(float(i), float(i), 0.0, 1.0,
                                           0xFFFF0000, 0, float(i), float(i))
                         for i in range(6))
        indices = struct.pack('<6H', 0, 1, 2, 3, 4, 5)
        blob = capture(ids=b'\1\2\3')          # fx.draw: vcount/icount 6/6
        rec = ri.decode_capture(blob, build=contract.BUILD)['records'][2]
        self.assertEqual(rec.node, bytes(24))
        self.assertEqual((rec.vcount, rec.icount), (6, 6))
        self.assertEqual(rec.indices, indices)           # raw, pad excluded
        self.assertEqual(rec.fvf, verts)
        self.assertIs(rec.idx_repaired, False)
        self.assertEqual(rec.ids, b'\1\2\3')             # raw u8 ids
        self.assertEqual(rec.id_count, 3)
        self.assertEqual((rec.tpage, rec.mode, rec.clut), (0, 0, 0))
        self.assertEqual((rec.dropped_ids, rec.texobj, rec.window_word,
                          rec.clut_sys_id, rec.ot_z), (0, 0, 0, 0, 0))
        self.assertEqual((rec.state_epoch, rec.state_flags), (1, 1))
        self.assertEqual((rec.stage0_texture, rec.stage0_device,
                          rec.stage0_devvt, rec.stage0_hr), (0, 0, 0, 0))
        self.assertEqual((rec.st_emitted, rec.st_lost), (0, 0))

    def test_nd_kind2_state_words_nonzero_bounds_no_repairs(self):
        blob = draw_custom(contract.BUILD)
        rec = ri.decode_capture(blob, build=contract.BUILD)['records'][0]
        self.assertEqual(len(blob), 284)
        self.assertEqual(rec.node, bytes(24))
        self.assertEqual((rec.vcount, rec.icount), (4, 6))
        self.assertEqual(rec.indices, struct.pack('<6H', 0, 1, 2, 3, 1, 2))
        self.assertIs(rec.idx_repaired, False)   # quad-strip shape untouched
        vin = b''.join(ff8dump.VERT.pack(float(i) * 1.5, float(i) * -2.5, 7.5,
                                         1.0, 0xFFFF0000, 0x00FF00FF,
                                         float(i), float(i) * 3.0)
                       for i in range(4))
        self.assertEqual(rec.fvf, vin)
        self.assertEqual(rec.ids, bytes((7, 8, 9, 10, 255)))
        self.assertEqual(rec.id_count, 5)
        self.assertEqual((rec.tpage, rec.mode, rec.clut), (17, 18, 19))
        self.assertEqual((rec.dropped_ids, rec.texobj, rec.window_word,
                          rec.clut_sys_id, rec.ot_z), (2, 12345, 0x1234,
                                                       0x5678, 3))
        self.assertEqual((rec.state_epoch, rec.state_flags), (7, 3))
        self.assertEqual((rec.stage0_texture, rec.stage0_device,
                          rec.stage0_devvt, rec.stage0_hr), (5, 6, 7, 9))
        self.assertEqual((rec.st_emitted, rec.st_lost), (4, 1))
        prov = rec.provenance
        self.assertEqual((prov['record_offset'], prov['record_size']),
                         (0, 284))
        self.assertEqual((prov['node_offset'], prov['counts_offset'],
                          prov['indices_offset'], prov['fvf_offset'],
                          prov['footer_offset'], prov['ids_offset'],
                          prov['state_words_offset']), (36, 60, 68, 80,
                                                        208, 224, 232))

    def test_footer_math_rederived_independently(self):
        """4I + idc u8 ids + pad4 + 13I; ids are bytes, not u32 words."""
        blob = draw_custom(contract.BUILD)
        parsed = contract.parse_strict(blob, build=contract.BUILD)
        self.assertEqual((parsed['draws'][0]['stage0_texture'],
                          parsed['draws'][0]['st_lost']), (5, 1))
        rec = ri.decode_capture(blob, build=contract.BUILD)['records'][0]
        footer_at = 36 + 24 + 8 + 6 * 2 + 4 * 32
        after_ids = footer_at + 16 + 5 + 3
        self.assertEqual(
            struct.unpack_from('<13I', blob, after_ids),
            (2, 12345, 0x1234, 0x5678, 3, 7, 3, 5, 6, 7, 9, 4, 1))
        self.assertEqual(rec.provenance['state_words_offset'], after_ids)

    def test_load_capture_reads_file_and_preserves_capture(self):
        blob = capture()
        with tempfile.TemporaryDirectory(prefix='lot25-load-') as directory:
            source = Path(directory) / 'capture.bin'
            source.write_bytes(blob)
            result = ri.load_capture(source, build=contract.BUILD)
        self.result_keys(result, contract.BUILD)
        self.assertEqual(result['data'], blob)
        self.assertEqual(len(result['records']), 3)
        self.assertEqual(len(result['parsed']['records']), 6)

    def test_stage0_raw_and_replay_incomplete_retained(self):
        blob = rebuilt(fx.draw(flags=contract.HAS_EPOCH |
                               contract.STAGE0_VALID, stage0=(5, 6, 7, 9)),
                       contract.BUILD)
        result = ri.decode_capture(blob, build=contract.BUILD)
        self.assertTrue(result['replay']['incomplete'])
        binding = result['replay']['draws'][0]['stage0_binding']
        self.assertEqual(binding['status'], 'footer_unmatched')
        self.assertEqual((binding['texture'], binding['device'],
                          binding['devvt'], binding['hr']), (5, 6, 7, 9))
        self.assertIn('footer_reference_unseen',
                      result['replay']['persistent_reasons'])
        draw_state = result['parsed']['draws'][0]
        self.assertEqual((draw_state['stage0_texture'],
                          draw_state['st_lost']), (5, 0))


class FailClosedTests(unittest.TestCase):
    def reject(self, blob, build=contract.BUILD, reason=None):
        with self.assertRaises(contract.ContractError) as caught:
            ri.decode_capture(blob, build=build)
        if reason:
            self.assertIn(reason, str(caught.exception))

    def test_decode_error_is_contract_error(self):
        self.assertTrue(issubclass(ri.CaptureDecodeError,
                                   contract.ContractError))

    def test_garbage_and_unknown_magic(self):
        for blob, reason in ((b'', 'empty capture'), (b'garbage',
                                                      'unknown record magic'),
                             (b'\x00' * 40, 'unknown record magic')):
            self.reject(blob, reason=reason)

    def test_truncated_every_family(self):
        for blob in (rebuilt(fx.event(), contract.BUILD)[:39],
                     capture()[:-1],
                     capture()[:40 + contract.TX_BYTES - 1],
                     tx_rich(contract.BUILD)[:-1],
                     tr_rich(contract.BUILD)[:-1],
                     draw_custom(contract.BUILD)[:-1]):
            self.reject(blob)

    def test_mixed_builds_fail_closed(self):
        self.reject(fx.event() + rebuilt(fx.draw(seq=2), 0x5643),
                    reason='build mismatch')
        # First record selects the build; a later build skew still fails.
        self.reject(rebuilt(fx.nd07_setup(1), 0x5643) + fx.event(),
                    reason='build mismatch')

    def test_unknown_build_selector_rejected(self):
        blob = rebuilt(fx.event(), contract.BUILD)
        for build in (0x5640, 0x5641, 0x5645, 0, 0xFFFFFFFF):
            self.reject(blob, build=build, reason='unsupported build')
        for build in ('0x5642', None):
            self.reject(blob, build=build, reason='unsupported build selector')

    def test_missing_build_selector_raises_typeerror(self):
        blob = capture()
        with self.assertRaises(TypeError):
            ri.decode_capture(blob)
        with self.assertRaises(TypeError):
            ri.load_capture(blob)


if __name__ == '__main__':
    unittest.main()
