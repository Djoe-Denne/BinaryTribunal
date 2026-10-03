#!/usr/bin/env python3
"""Lot 22 tests — offline diagnostic + candidate state-contract reader.

Covers the 18 mandatory Lot 22 test requirements on synthetic fixtures plus
the real v13 dump. The lot17/lot21 oracle files must stay byte-identical.
"""
import hashlib
import struct
import unittest
from pathlib import Path

import ff8dump as dump

import analyze_lot22_state as lot22

import fixture_paths

ORACLE_SHA = {
    'render_lot17.py': '0eb63c416637ecda3ba93c4357be149f74c002af6d931c2f3cf6ffe3eb3a94bc',
    'ff8dump.py': 'e8d1e357805d6d7045b46f9807f1e5af0d10dd9c4ae81dc808a027efd6d3e98c',
}

DECODE = Path(__file__).resolve().parent
V13_DUMP = fixture_paths.v13()


def st09(kind, rtype, value, aux, epoch, seq=1):
    return lot22.ST_HDR.pack(lot22.MAGIC_ST, lot22.BUILD_CAND, seq, epoch,
                             kind, rtype, value, aux)


def nd08_v14(seq, epoch, flags=lot22.STATE_FLAG_HAS_EPOCH, slot=49,
             vcount=6, icount=6, texobj=0, tpage=0, mode=0, clut=0,
             ids=b'', idx=None, ctx=0x1111, node_addr=0x2222):
    verts = b''.join(dump.VERT.pack(float(i), float(i), 0.0, 1.0,
                                    0xFFFF0000, 0, float(i), float(i))
                     for i in range(vcount))
    if idx is None:
        idx = tuple(range(icount))
    indices = struct.pack(f'<{len(idx)}H', *idx)
    idx_bytes = len(indices)
    idx_pad = (4 - (idx_bytes % 4)) % 4
    indices += b'\0' * idx_pad
    idc = len(ids)
    ids_pad = (4 - (idc % 4)) % 4
    footer = struct.pack('<4I', tpage, mode, clut, idc) + ids + (b'\0' * ids_pad)
    footer += struct.pack('<7I', 0, texobj, 0, 0, 0, epoch, flags)
    payload = (bytes(dump.NODE_SIZE) + struct.pack('<2I', vcount, icount) + indices
               + verts + footer)
    hdr = dump.HDR.pack(dump.MAGIC_ND8, slot, seq, ctx, node_addr, 2, 0,
                        len(payload), lot22.BUILD_CAND)
    return hdr + payload


def nd07_setup(seq, slot=44):
    payload = bytes(dump.NODE_SIZE)
    hdr = dump.HDR.pack(dump.MAGIC_ND, slot, seq, 0x3333, 0x4444, 0, 0,
                        len(payload), lot22.BUILD_CAND)
    return hdr + payload


def tr08(seq, texobj=0x6D65790):
    hdr = struct.pack('<10I', dump.MAGIC_TR, lot22.BUILD_CAND, seq, texobj,
                      256, 256, 256, 4, 65536, 4096)
    return hdr + b'\0' * 65536 + b'\0' * 4096


def tx07(seq):
    return dump.TX_HDR.pack(dump.MAGIC_TX, lot22.BUILD_CAND, seq, 0, 0x55AA0000,
                            0x1B47818, 0, 0) + b'\0' * (dump.TX_VRAM_BYTES + 2048 + 8)


def state_of(parsed, ordinal=0):
    return next(d for d in parsed['draws'] if d['ordinal'] == ordinal)


class ContractFixtureTests(unittest.TestCase):
    def _parse(self, blob):
        return lot22.parse_candidate_stream(bytes(blob))

    def test_1_state_set_then_draw_receives_epoch(self):
        blob = st09(lot22.KIND_RS_SET, 5, 1, 0, 1) + nd08_v14(seq=1, epoch=1)
        parsed = self._parse(blob)
        result = lot22.replay_state(parsed)
        draw = state_of(result)
        self.assertEqual(draw['rs_raw'], {5: 1})
        self.assertEqual(draw['epoch'], 1)

    def test_2_draw_before_state_set_gets_no_future_state(self):
        blob = nd08_v14(seq=1, epoch=0) + st09(lot22.KIND_RS_SET, 5, 1, 0, 1)
        parsed = self._parse(blob)
        result = lot22.replay_state(parsed)
        draw = state_of(result)
        self.assertEqual(draw['rs_raw'], {})
        self.assertIn('blend_raw', draw['missing_fields'])
        self.assertTrue(draw['incomplete'])

    def test_3_zero_value_is_not_missing(self):
        blob = st09(lot22.KIND_RS_SET, 3, 0, 0, 1) + nd08_v14(seq=1, epoch=1)
        parsed = self._parse(blob)
        result = lot22.replay_state(parsed)
        draw = state_of(result)
        self.assertEqual(draw['rs_raw'], {3: 0})
        self.assertTrue(draw['rs_valid_mask'] & (1 << 3))

    def test_4_unknown_render_state_type_kept_raw(self):
        blob = st09(lot22.KIND_RS_SET, 27, 7, 0, 1) + nd08_v14(seq=1, epoch=1)
        parsed = self._parse(blob)
        result = lot22.replay_state(parsed)
        self.assertEqual(state_of(result)['rs_raw'].get(27), 7)

    def test_5_commit_boundary_kept_separate(self):
        blob = (st09(lot22.KIND_RS_SET, 5, 1, 0, 1)
                + st09(lot22.KIND_COMMIT, 30, 0xABC, 0, 2)
                + nd08_v14(seq=1, epoch=2))
        parsed = self._parse(blob)
        result = lot22.replay_state(parsed)
        draw = state_of(result)
        self.assertEqual(draw['rs_raw'], {5: 1})
        self.assertEqual(draw['commit_chain'],
                         [{'epoch': 2, 'slot': 30, 'token': 0xABC}])

    def test_6_blend_raw_round_trip_exact(self):
        blob = st09(lot22.KIND_BLEND, 33, 4, 0, 1) + nd08_v14(seq=1, epoch=1)
        parsed = self._parse(blob)
        result = lot22.replay_state(parsed)
        self.assertEqual(state_of(result)['blend_raw'],
                         {'epoch': 1, 'raw': 4})
        blob2 = st09(lot22.KIND_BLEND, 33, 0, 0, 1) + nd08_v14(seq=1, epoch=1)
        result2 = lot22.replay_state(self._parse(blob2))
        self.assertEqual(state_of(result2)['blend_raw'], {'epoch': 1, 'raw': 0})

    def test_7_depth_policy_refused_without_proof(self):
        blob = (st09(lot22.KIND_RS_SET, 5, 1, 0, 1)
                + nd08_v14(seq=1, epoch=1))
        result = lot22.replay_state(self._parse(blob))
        self.assertFalse(lot22.depth_policy_available(result))
        self.assertFalse(lot22.blend_policy_available(result))

    def test_8_stage0_slot49_missing_evidence_no_fallback(self):
        blob = st09(lot22.KIND_RS_SET, 5, 1, 0, 1) + nd08_v14(seq=1, epoch=1, slot=49)
        parsed = self._parse(blob)
        result = lot22.replay_state(parsed)
        stage0 = state_of(result)['stage0']
        self.assertFalse(stage0['valid'])
        self.assertIn('MissingEvidence', stage0['reason'])
        self.assertNotIn('texture', stage0)

    def test_9_runtime_token_never_resolved_to_logical_offset(self):
        blob = (st09(lot22.KIND_TARGET, 39, 0x05AF00, 0, 1)
                + nd08_v14(seq=1, epoch=1))
        parsed = self._parse(blob)
        result = lot22.replay_state(parsed)
        self.assertEqual(state_of(result)['target_token'],
                         {'epoch': 1, 'token': 0x05AF00})

    def test_10_truncated_sideband_and_footer_rejected(self):
        blob = st09(lot22.KIND_RS_SET, 5, 1, 0, 1)
        with self.assertRaises(lot22.ContractError):
            self._parse(blob[:-8])
        full = st09(lot22.KIND_RS_SET, 5, 1, 0, 1) + nd08_v14(seq=1, epoch=1)
        with self.assertRaises(lot22.ContractError):
            self._parse(full[:-4])
        with self.assertRaises(lot22.ContractError):
            self._parse(st09(lot22.KIND_RS_SET, 5, 1, 0, 0)[:-4])

    def test_11_sizes_alignment_and_record_max(self):
        self.assertEqual(lot22.ST_REC_BYTES, 32)
        self.assertEqual(lot22.FOOTER_V14_BYTES, 8)
        idx_bytes = 16384 * 2
        self.assertEqual(idx_bytes % 4, 0)
        idc, ids_pad = 255, 1
        nd_max = (dump.HDR.size + dump.NODE_SIZE + 8 + idx_bytes + 0 + 4096 * 32
                  + 16 + idc + ids_pad + 4 + 4 + 12 + 8)
        self.assertEqual(nd_max, 0x28170)
        self.assertLessEqual(nd_max, 0x100C80)
        blob = (tr08(1) + tx07(2) + nd07_setup(2, slot=44)
                + st09(lot22.KIND_RS_SET, 0, 1, 0, 1)
                + nd08_v14(seq=2, epoch=1, ids=b'\x05\x06\x07', icount=3, vcount=4))
        parsed = self._parse(blob)
        self.assertEqual((parsed['tx_records'], parsed['tr_records'],
                          parsed['nd_records'], parsed['st_records']), (1, 1, 2, 1))
        draws = [d for d in parsed['draws'] if d['kind'] == 2]
        self.assertEqual(draws[0]['ordinal'], 0)

    def test_12_13_oracle_files_byte_identical(self):
        for name, expected in ORACLE_SHA.items():
            path = DECODE / name
            self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), expected)

    def test_14_strict_v13_parse_counts(self):
        if not V13_DUMP.exists():
            self.fail('BASELINE_MISSING: v13 capture is required for the complete suite')
        data = V13_DUMP.read_bytes()
        result = lot22.analyze_v13(data)
        self.assertEqual((result['build'], result['records'], result['frames'],
                          result['TX07'], result['TR08']),
                         ('0x5640', 2512, 16, 16, 192))
        self.assertTrue(all(t['origin_xy'] == 0 and t['wh'] == 0 for t in result['txwin']))
        self.assertEqual(result['ab_status'], 'BLOCKED_BY_MISSING_STATE')

    def test_15_invalidate_and_renewal(self):
        blob = (st09(lot22.KIND_RS_SET, 5, 1, 0, 1)
                + st09(lot22.KIND_INVALIDATE, 0, 0, 0, 2)
                + nd08_v14(seq=1, epoch=2)
                + st09(lot22.KIND_RS_SET, 5, 2, 0, 3)
                + nd08_v14(seq=1, epoch=3))
        parsed = self._parse(blob)
        result = lot22.replay_state(parsed)
        draws = [d for d in result['draws']]
        self.assertEqual(draws[0]['rs_raw'], {})
        self.assertIn('state_invalidated_no_renewal', draws[0]['missing_fields'])
        self.assertEqual(draws[1]['rs_raw'], {5: 2})
        self.assertNotIn('state_invalidated_no_renewal', draws[1]['missing_fields'])

    def test_16_epoch_hole_and_flagged_incomplete(self):
        blob = (st09(lot22.KIND_RS_SET, 5, 1, 0, 1)
                + nd08_v14(seq=1, epoch=5))
        result = lot22.replay_state(self._parse(blob))
        draw = state_of(result)
        self.assertTrue(draw['incomplete'])
        self.assertIn('epoch_hole', draw['missing_fields'])
        blob2 = (st09(lot22.KIND_RS_SET, 5, 1, 0, 1)
                 + nd08_v14(seq=1, epoch=1, flags=lot22.STATE_FLAG_HAS_EPOCH
                            | lot22.STATE_FLAG_INCOMPLETE))
        result2 = lot22.replay_state(self._parse(blob2))
        self.assertTrue(state_of(result2)['incomplete'])

    def test_17_requested_and_committed_not_merged(self):
        blob = (st09(lot22.KIND_RS_SET, 5, 1, 0, 1)
                + st09(lot22.KIND_COMMIT, 32, 0x7777, 0, 2)
                + st09(lot22.KIND_SETUP_COMMIT, 47, 0x8888, 1, 3)
                + nd08_v14(seq=1, epoch=3, slot=51))
        result = lot22.replay_state(self._parse(blob))
        draw = state_of(result)
        self.assertEqual(draw['rs_raw'], {5: 1})
        self.assertEqual(len(draw['commit_chain']), 2)
        self.assertEqual(draw['commit_chain'][1],
                         {'epoch': 3, 'slot': 47, 'token': 0x8888,
                          'gate': 1, 'setup': True})
        self.assertNotIn(30, draw['rs_raw'])
        self.assertNotIn(32, draw['rs_raw'])
        self.assertNotIn(47, draw['rs_raw'])

    def test_18_one_epoch_per_draw_ordinal(self):
        blob = (st09(lot22.KIND_RS_SET, 5, 1, 0, 1)
                + nd08_v14(seq=1, epoch=1, slot=49, vcount=6)
                + nd08_v14(seq=1, epoch=1, slot=49, vcount=6)
                + nd08_v14(seq=1, epoch=1, slot=49, vcount=6))
        parsed = self._parse(blob)
        draws = [d for d in parsed['draws'] if d['kind'] == 2]
        self.assertEqual([d['ordinal'] for d in draws], [0, 1, 2])
        self.assertEqual([d['epoch'] for d in draws], [1, 1, 1])

    def test_extra_wrong_build_rejected(self):
        blob = bytearray(st09(lot22.KIND_RS_SET, 5, 1, 0, 1))
        struct.pack_into('<I', blob, 4, lot22.BUILD_V13)
        with self.assertRaises(lot22.ContractError):
            self._parse(bytes(blob))
        blob2 = bytearray(nd08_v14(seq=1, epoch=1))
        struct.pack_into('<I', blob2, 32, lot22.BUILD_V13)
        with self.assertRaises(lot22.ContractError):
            self._parse(bytes(blob2))

    def test_extra_build_id_v13_dump_rejected_by_candidate_reader(self):
        if not V13_DUMP.exists():
            self.fail('BASELINE_MISSING: v13 capture is required for the complete suite')
        with self.assertRaises(lot22.ContractError):
            lot22.parse_candidate_stream(V13_DUMP.read_bytes())


if __name__ == '__main__':
    unittest.main()
