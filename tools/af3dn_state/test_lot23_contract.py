#!/usr/bin/env python3
"""Bounded synthetic tests; no live capture, writer, or oracle mutation."""
import copy
import json
from pathlib import Path
import struct
import tempfile
import unittest
from unittest.mock import patch

import ff8dump
import analyze_lot22_state as legacy
import lot23_contract as contract
from test_lot22_state import nd08_v14, nd07_setup, st09, tr08, tx07


def word(blob, offset, value):
    data = bytearray(blob)
    struct.pack_into('<I', data, offset, value)
    return bytes(data)


def event(epoch=1, kind=1, typ=3, value=1, aux=0, seq=1):
    return st09(kind, typ, value, aux, epoch, seq)


def draw(epoch=1, **kwargs):
    return nd08_v14(seq=kwargs.pop('seq', 1), epoch=epoch, **kwargs)


def kind1(seq=1):
    payload = bytes(24) + struct.pack('<I', 3) + bytes(40)
    return ff8dump.HDR.pack(ff8dump.MAGIC_ND, 43, seq, 0x1111, 0x2222,
                           1, 0, len(payload), contract.BUILD) + payload


def v13_nd(**kwargs):
    candidate = draw(epoch=0, **kwargs)
    # The v13 footer is exactly eight bytes shorter, with the same IDs + pad.
    historical = candidate[:-contract.EPOCH_EXTENSION_BYTES]
    historical = word(historical, 28, len(historical) - 36)
    return word(historical, 32, 0x5640)


def v13_tx():
    return word(tx07(1), 4, 0x5640)


def v13_tr():
    return word(tr08(1), 4, 0x5640)


def replay(blob):
    return contract.replay_strict(contract.parse_strict(blob))


def raw(draw_state):
    return draw_state['global_requested_unattributed']


class ParseStrictTests(unittest.TestCase):
    def reject(self, blob, reason=None):
        with self.assertRaises(contract.ContractError) as caught:
            contract.parse_strict(blob)
        if reason:
            self.assertIn(reason, str(caught.exception))

    def test_codec_sizes_and_kind1_legacy_consumption(self):
        self.assertEqual(contract.ST_HDR.size, 32)
        self.assertEqual(contract.ND_HDR.size, 36)
        self.assertEqual(contract.FOOTER_U32 * 4, 44)
        self.assertEqual(contract.EPOCH_EXTENSION_BYTES, 8)
        blob = kind1()
        self.assertEqual(struct.unpack_from('<I', blob, 28)[0], 68)
        parsed = contract.parse_strict(blob)
        self.assertEqual(parsed['draws'][0]['ctx'], 0x1111)
        historical = word(blob, 32, 0x5640)
        decoded = contract.load_capture_strict_bytes(historical)[2][0]
        self.assertEqual((decoded.prim, len(decoded.packet)), (3, 40))
        for size in (24, 28, 67, 69):
            bad = word(blob, 28, size)
            bad = bad[:36 + size] if size < 68 else bad + b'\0'
            self.reject(bad, 'kind1 payload')

    def test_every_family_unknown_build_mixed_and_truncated(self):
        fixtures = ((event(), 4), (draw(), 32), (nd07_setup(1), 32),
                    (kind1(), 32), (tx07(1), 4), (tr08(1), 4))
        for blob, build_offset in fixtures:
            with self.subTest(magic=blob[:4]):
                contract.parse_strict(blob)
                for build in (0x5640, 0xFFFFFFFF):
                    bad = word(blob, build_offset, build)
                    self.reject(bad, 'build mismatch')
                    self.reject(event() + bad, 'build mismatch')
                for cut in (1, 3, 7, min(31, len(blob) - 1), len(blob) - 1):
                    self.reject(blob[:cut])
                    self.reject(event() + blob[:cut])

    def test_empty_garbage_and_unknown_kinds(self):
        for blob in (b'', b'garbage', draw() + b'\0', event(kind=0),
                     event(kind=8), word(draw(), 20, 3)):
            self.reject(blob)

    def test_st09_validation_matrix(self):
        valid = [(1, t, 0, 0) for t in range(26)]
        valid += [(2, t, 0, 0) for t in (30, 31, 32)]
        valid += [(3, 33, v, 0) for v in range(5)]
        valid += [(4, 39, 0, 0), (5, 0, 0, 0), (5, 1, 0, 0)]
        valid += [(6, t, 1, 1) for t in contract.SETUP_SLOTS]
        valid += [(7, t, 0, 0) for t in (40, 41)]
        for kind, typ, value, aux in valid:
            with self.subTest(valid=(kind, typ, value, aux)):
                contract.parse_strict(event(kind=kind, typ=typ, value=value, aux=aux))
        invalid = [(1, 26, 1, 0), (1, 0xFFFFFFFF, 1, 0),
                   (2, 29, 1, 0), (2, 33, 1, 0), (3, 3, 1, 0),
                   (3, 33, 5, 0), (4, 38, 0, 0), (5, 2, 0, 0),
                   (7, 39, 0, 0), (7, 42, 0, 0)]
        invalid += [(6, t, 1, 1) for t in (52, 53, 54, 56)]
        invalid += [(6, t, v, a) for t in contract.SETUP_SLOTS
                    for v, a in ((0, 1), (1, 0), (0, 0))]
        for kind, typ, value, aux in invalid:
            with self.subTest(invalid=(kind, typ, value, aux)):
                self.reject(event(kind=kind, typ=typ, value=value, aux=aux),
                            'invalid ST09')

    def test_nd_magic_kind_fails_and_kind0_exact_size(self):
        for blob in (word(draw(), 0, ff8dump.MAGIC_ND),
                     word(nd07_setup(1), 0, ff8dump.MAGIC_ND8),
                     word(kind1(), 0, ff8dump.MAGIC_ND8)):
            self.reject(blob, 'magic/kind')
        for blob in (draw(), nd07_setup(1), kind1()):
            self.reject(word(blob, 24, 1), 'failed read')
        self.reject(word(nd07_setup(1) + b'\0', 28, 25), 'kind0 payload')
        self.reject(word(draw(), 4, 42), 'slot outside')

    def test_footer_flags_epoch_zero_and_payload_mismatch(self):
        for flags in (0, 2, 3, 7, 8, 9, 0xFFFFFFFF):
            self.reject(draw(flags=flags))
        for flags in (1, 5):
            parsed = contract.parse_strict(draw(epoch=0, flags=flags))
            self.assertEqual(parsed['draws'][0]['epoch'], 0)
        blob = draw(ids=b'\1\2\3', icount=3, vcount=3)
        contract.parse_strict(blob)             # BOTH index and ID padding count
        self.reject(word(blob, 28, len(blob) - 36 - 1))
        self.reject(word(blob + b'\0', 28, len(blob) - 36 + 1))
        footer = 36 + 24 + 8 + 8 + 3 * 32
        self.reject(word(blob, footer + 12, 256), 'id_count')
        self.reject(word(blob, footer + 12, 0), 'footer/payload')
        self.reject(word(blob, 60, 4))          # in-cap but disagrees with byte layout
        self.reject(word(blob, 64, 5))
        self.reject(blob[:-8], 'truncated ND payload')

    def test_counts_caps_and_total_record_max(self):
        maximum = draw(vcount=4096, icount=16384, ids=bytes(255),
                       idx=tuple(i % 4096 for i in range(16384)))
        self.assertEqual(len(maximum), 0x28170)
        contract.parse_strict(maximum)
        self.reject(word(maximum + b'\0', 28, len(maximum) - 36 + 1),
                    'record size outside')
        for off, count in ((60, 4097), (64, 16385)):
            self.reject(word(draw(), off, count), 'count caps')
        self.reject(draw(vcount=4, icount=6, idx=(65535, 1, 0, 3, 1, 2)),
                    'out-of-range indices')
        self.reject(word(tr08(1), 32, 65537), 'TR08 count caps')
        self.reject(word(tr08(1), 36, 32769), 'TR08 count caps')

    def test_epoch_duplicates_decreasing_and_zero(self):
        for epochs in ((1, 1), (2, 1), (1, 0)):
            self.reject(b''.join(event(epoch=e) for e in epochs))

    def test_st_count_cap_per_seq(self):
        cap = b''.join(event(epoch=e) for e in range(1, 1025))
        contract.parse_strict(cap)
        self.reject(cap + event(epoch=1025), 'per-frame cap exceeded')
        contract.parse_strict(cap + event(epoch=1025, seq=2))

    def test_context_and_texture_metadata(self):
        parsed = contract.parse_strict(tx07(1) + tr08(1) + event() + draw(ctx=0xABC))
        self.assertEqual(parsed['draws'][0]['ctx'], 0xABC)
        self.assertEqual(parsed['tx_metadata'][0]['offset'], 0)
        self.assertEqual(parsed['tr_metadata'][0]['offset'], contract.TX_BYTES)
        self.assertEqual(parsed['tr_metadata'][0]['texobj'], 0x6D65790)
        self.assertIn('device_reset_or_loss', parsed['surface_not_captured'])
        self.assertEqual(parsed['nd_records'], 1)


class ReplayStrictTests(unittest.TestCase):
    def test_no_event_zero_epoch_unseen_and_applied_unavailable(self):
        state = replay(draw(epoch=0))['draws'][0]
        self.assertEqual(state['epoch_status'], 'unseen')
        self.assertEqual(raw(state)['rs_raw'][3], {'status': 'unseen', 'value': None})
        self.assertEqual(raw(state)['blend_raw']['status'], 'unseen')
        self.assertEqual(state['applied_state']['status'], 'unavailable')
        self.assertEqual(state['stage0_binding']['status'], 'unavailable')

    def test_observed_zero_is_not_unseen_or_applied(self):
        state = replay(event(value=0) + draw())['draws'][0]
        self.assertEqual(raw(state)['rs_raw'][3]['status'], 'observed')
        self.assertEqual(raw(state)['rs_raw'][3]['value'], 0)
        self.assertEqual(raw(state)['rs_raw'][4]['status'], 'unseen')
        self.assertEqual(state['applied_state']['status'], 'unavailable')

    def test_one_context_is_still_unattributed(self):
        state = replay(event() + draw())['draws'][0]
        self.assertEqual(state['context_association'], 'unavailable')
        self.assertFalse(state['association_valid'])
        self.assertTrue(state['incomplete'])
        self.assertTrue(set(contract.MISSING_FIELDS) <= set(state['missing_fields']))
        self.assertNotIn('rs_raw', state)        # never a certain per-context state

    def test_file_prefix_and_epoch_intersection_during_forward(self):
        blob = event(value=10) + event(epoch=2, value=20) + draw(epoch=1)
        blob += draw(epoch=2)
        states = replay(blob)['draws']
        self.assertEqual(raw(states[0])['rs_raw'][3]['value'], 10)
        self.assertEqual(raw(states[1])['rs_raw'][3]['value'], 20)

    def test_draw_before_event_and_future_footer_contradiction(self):
        blob = draw(epoch=0) + event() + draw(epoch=1)
        states = replay(blob)['draws']
        self.assertEqual(raw(states[0])['rs_raw'][3]['status'], 'unseen')
        self.assertEqual(raw(states[1])['rs_raw'][3]['value'], 1)
        bad_footer = replay(draw(epoch=1) + event())
        state = bad_footer['draws'][0]
        self.assertEqual(raw(state)['rs_raw'][3]['status'], 'unseen')
        self.assertIn('footer_contradiction', state['reasons'])
        self.assertIn('footer_reference_unseen', state['reasons'])

    def test_unseen_footer_reference_stays_sticky(self):
        result = replay(draw(epoch=3) + event() + draw(epoch=1, seq=2))
        self.assertIn('footer_reference_unseen', result['draws'][1]['persistent_reasons'])
        self.assertEqual(result['draws'][0]['epoch_status'], 'unseen')

    def test_context_change_purges_observations_not_captured_invalidation(self):
        blob = event(value=10) + draw(ctx=0x1111)
        blob += draw(ctx=0x2222) + event(epoch=2, value=20) + draw(epoch=2, ctx=0x2222)
        result = replay(blob)
        first, second, third = result['draws']
        self.assertEqual(raw(first)['rs_raw'][3]['value'], 10)
        self.assertEqual(raw(second)['rs_raw'][3]['status'], 'unseen')
        self.assertEqual(raw(third)['rs_raw'][3]['value'], 20)
        self.assertIn('draw_context_change', second['reasons'])
        self.assertFalse(result['observed_invalidations'][0]['event_invalidation_captured'])
        self.assertTrue(all(not item['association_valid'] for item in result['draws']))

    def test_init_and_uninit_purge_all_observed_cache(self):
        for slot in (0, 1):
            blob = event() + event(epoch=2, kind=3, typ=33, value=2)
            blob += event(epoch=3, kind=4, typ=39, value=123)
            blob += event(epoch=4, kind=2, typ=30, value=234)
            blob += event(epoch=5, kind=6, typ=43, value=345, aux=1)
            blob += draw(epoch=5)
            blob += event(epoch=6, kind=5, typ=slot, value=0) + draw(epoch=6)
            result = replay(blob)
            state = raw(result['draws'][1])
            self.assertEqual(state['rs_raw'][3]['status'], 'unseen')
            self.assertEqual(state['blend_raw']['status'], 'unseen')
            self.assertEqual(state['target_raw']['status'], 'unseen')
            self.assertEqual(state['commit_calls'], [])
            self.assertEqual(state['setup_gates'], [])
            self.assertEqual(result['observed_invalidations'][0]['device_reset_loss_coverage'],
                             'unavailable')

    def test_commit_is_call_only_including_zero_descriptor(self):
        for slot in (30, 31, 32):
            for value, aux in ((0, 0), (123, 0), (0, 1)):
                state = replay(event(kind=2, typ=slot, value=value, aux=aux) + draw())['draws'][0]
                call = raw(state)['commit_calls'][0]
                self.assertEqual(call['status'], 'commit_call_observed')
                self.assertEqual(call['committed'], 'unavailable')
                self.assertEqual(call['applied'], 'unavailable')
                self.assertEqual(call['token'], value)

    def test_setup_gates_not_device_success_or_commit(self):
        for slot in contract.SETUP_SLOTS:
            state = replay(event(kind=6, typ=slot, value=0xFFFF0000, aux=7) + draw())['draws'][0]
            setup = raw(state)['setup_gates'][0]
            self.assertEqual(setup['status'], 'post_forward_setup_gates_observed')
            self.assertEqual(setup['committed'], 'path_unproven')
            self.assertEqual(setup['applied'], 'unavailable')
            self.assertEqual(setup['gate'], 7)

    def test_requested_blend_target_and_no_semantic_aliases(self):
        blob = event(typ=5, value=0) + event(epoch=2, kind=3, typ=33, value=0)
        blob += event(epoch=3, kind=4, typ=39, value=0) + draw(epoch=3)
        state = replay(blob)['draws'][0]
        self.assertEqual(raw(state)['blend_raw']['value'], 0)
        self.assertEqual(raw(state)['target_raw']['value'], 0)
        for name in ('depth', 'depth_enabled', 'blend_enabled', 'stp', 'STP', 'stage0'):
            self.assertNotIn(name, state)
            self.assertNotIn(name, raw(state))

    def test_ordinals_per_seq_and_forged_duplicates(self):
        parsed = contract.parse_strict(draw(epoch=0) + nd07_setup(1) + draw(epoch=0) +
                                       draw(epoch=0, seq=2))
        self.assertEqual([(d['seq'], d['ordinal']) for d in parsed['draws'] if d['kind'] == 2],
                         [(1, 0), (1, 1), (2, 0)])
        contract.replay_strict(parsed)
        forged = copy.deepcopy(parsed)
        forged['draws'][2]['ordinal'] = 0
        with self.assertRaisesRegex(contract.ContractError, 'ordinal'):
            contract.replay_strict(forged)

    def test_forged_events_flags_offsets_revalidated(self):
        base = contract.parse_strict(event() + draw())
        for field, value in (('kind', 8), ('type', 26), ('epoch', 0), ('build', 0x5640)):
            forged = copy.deepcopy(base)
            forged['events'][0][field] = value
            with self.assertRaises(contract.ContractError):
                contract.replay_strict(forged)
        for field, value in (('flags', 3), ('offset', 0), ('fails', 1)):
            forged = copy.deepcopy(base)
            forged['draws'][0][field] = value
            with self.assertRaises(contract.ContractError):
                contract.replay_strict(forged)

    def test_epoch_gap_sticky_across_rs_frames_and_no_reanchors(self):
        for first in (2, 4):
            blob = event(epoch=first) + draw(epoch=first)
            for epoch, kind, typ, value, aux in (
                    (first + 1, 1, 3, 1, 0), (first + 2, 5, 0, 0, 0),
                    (first + 3, 7, 40, 0, 0), (first + 4, 6, 44, 1, 1)):
                blob += event(epoch=epoch, kind=kind, typ=typ, value=value, aux=aux, seq=2)
                blob += draw(epoch=epoch, seq=2)
            result = replay(blob)
            self.assertFalse(result['reanchor_available'])
            self.assertTrue(all('epoch_gap' in d['persistent_reasons'] for d in result['draws']))
        result = replay(event() + event(epoch=3) + draw(epoch=3))
        self.assertIn('epoch_gap', result['persistent_reasons'])

    def test_ring_flags_sticky_after_new_rs_and_next_frame(self):
        result = replay(event() + draw(flags=5) + event(epoch=2, seq=2) +
                        draw(epoch=2, flags=1, seq=2))
        self.assertIn('writer_incomplete', result['draws'][1]['persistent_reasons'])
        self.assertTrue(result['draws'][1]['incomplete'])

    def test_ring_flags_no_init_scene_or_setup_reanchor(self):
        blob = event() + draw(flags=5)
        for epoch, kind, typ, value, aux in ((2, 5, 0, 0, 0), (3, 7, 41, 0, 0),
                                            (4, 6, 55, 1, 1), (5, 1, 3, 0, 0)):
            blob += event(epoch=epoch, kind=kind, typ=typ, value=value, aux=aux, seq=2)
            blob += draw(epoch=epoch, seq=2)
        result = replay(blob)
        self.assertTrue(all('writer_incomplete' in d['persistent_reasons']
                            for d in result['draws']))
        self.assertFalse(result['reanchor_available'])

    def test_1024_cap_ambiguity_sticky_next_frame_and_new_rs(self):
        blob = b''.join(event(epoch=e, value=0) for e in range(1, 1025))
        blob += draw(epoch=1024) + event(epoch=1025, value=1, seq=2)
        blob += draw(epoch=1025, seq=2)
        result = replay(blob)
        self.assertTrue(all('cap_ambiguity' in d['persistent_reasons'] for d in result['draws']))
        self.assertEqual(raw(result['draws'][0])['rs_raw'][3]['value'], 0)
        self.assertEqual(raw(result['draws'][0])['rs_raw'][4]['status'], 'unseen')
        self.assertEqual(raw(result['draws'][1])['rs_raw'][3]['value'], 1)
        self.assertTrue(result['draws'][1]['incomplete'])

    def test_no_future_cap_or_flag_contamination(self):
        blob = event() + draw(epoch=1)
        blob += b''.join(event(epoch=e) for e in range(2, 1025))
        blob += draw(epoch=1024, flags=5)
        result = replay(blob)
        self.assertNotIn('cap_ambiguity', result['draws'][0]['persistent_reasons'])
        self.assertNotIn('writer_incomplete', result['draws'][0]['persistent_reasons'])

    def test_legacy_replay_never_called(self):
        with patch.object(legacy, 'replay_state', side_effect=AssertionError('unsafe replay')):
            self.assertTrue(contract.audit_bytes(event() + draw())['accepted'])


class HistoricalDifferentialTests(unittest.TestCase):
    """Compare the LOCAL v13 loader with the immutable oracle, not candidate policy.

    Both reject warnings/failed reads/repaired indices. Historical permissive
    corners are characterized explicitly below, not silently tightened here.
    """
    def compare(self, blob, accepted):
        with tempfile.TemporaryDirectory(prefix='lot23-differential-') as directory:
            path = Path(directory) / 'capture.bin'
            path.write_bytes(blob)
            results = []
            for loader, argument in ((contract.load_capture_strict_bytes, blob),
                                     (legacy.render_lot17.load_capture, path)):
                try:
                    value = loader(argument)
                except (ValueError, ff8dump.DumpError):
                    results.append((False, None))
                else:
                    results.append((True, value))
            self.assertEqual(results[0][0], results[1][0], 'local/oracle acceptance drift')
            self.assertEqual(results[0][0], accepted)
            if accepted:
                self.assertEqual(results[0][1], results[1][1], 'successful tuple drift')

    def test_v13_success_tuple_nd_tx_tr_and_mixed_families(self):
        for blob in (v13_nd(), v13_tx(), v13_tr(), v13_tx() + v13_tr() + v13_nd()):
            with self.subTest(magic=blob[:4]):
                self.compare(blob, True)

    def test_negative_empty_magic_header_payload_and_garbage(self):
        negative = [b'', b'N', b'ND0', b'ND08', b'ND08\0\0\0', v13_nd()[:35],
                    v13_nd()[:-1], v13_tx()[:31], v13_tx()[:-1],
                    v13_tr()[:39], v13_tr()[:-1], b'garbage!',
                    v13_nd() + b'garbage', word(v13_nd(), 32, 0xDEAD)]
        for index, blob in enumerate(negative):
            with self.subTest(case=index):
                self.compare(blob, False)

    def test_negative_mixed_nd_tx_tr_unknownbuild_and_failedread(self):
        for tail, offset in ((v13_nd(), 32), (v13_tx(), 4), (v13_tr(), 4)):
            for build in (0x563F, 0xDEAD):
                with self.subTest(magic=tail[:4], build=build):
                    # Start with TX: ND's historical resynchronizer must not
                    # turn this build-mismatch fixture into a chain-break case.
                    self.compare(v13_tx() + word(tail, offset, build), False)
        self.compare(word(v13_nd(), 24, 1), False)

    def test_negative_index_repair_has_valid_quad_strip_shape(self):
        blob = v13_nd(vcount=4, icount=6, idx=(65535, 1, 0, 3, 1, 2))
        records, warnings, _, _ = ff8dump.parse_dump(blob, expected_build=0x5640)
        self.assertTrue(records[0].idx_repaired)
        self.assertTrue(any('rebuilt quad-strip' in warning for warning in warnings))
        self.compare(blob, False)

    def test_characterization_historical_kind0_extra_payload_is_accepted_by_both(self):
        # Oracle does not enforce psize==24 for kind0. This is NOT a mismatch:
        # pin the historical hole, while candidate prevalidation rejects it.
        blob = word(nd07_setup(1), 32, 0x5640)
        blob = word(blob + b'\0', 28, 25)
        self.compare(blob, True)
        with self.assertRaises(contract.ContractError):
            contract.parse_strict(word(blob, 32, contract.BUILD))


class AuditCliTests(unittest.TestCase):
    def test_audit_success_and_rejection(self):
        good = contract.audit_bytes(event() + draw())
        self.assertTrue(good['accepted'])
        self.assertTrue(good['incomplete'])
        self.assertEqual(good['build'], 0x5641)
        bad = contract.audit_bytes(b'')
        self.assertFalse(bad['accepted'])
        self.assertIn('empty capture', bad['error'])

    def test_cli_capture_optional_out_and_exit_status(self):
        with tempfile.TemporaryDirectory(prefix='lot23-cli-') as directory:
            source, out = Path(directory) / 'capture.bin', Path(directory) / 'audit.json'
            source.write_bytes(event() + draw())
            self.assertEqual(contract.main([str(source), '--out', str(out)]), 0)
            self.assertTrue(json.loads(out.read_text(encoding='utf-8'))['accepted'])
            source.write_bytes(b'')
            with patch('builtins.print') as printing:
                self.assertEqual(contract.main([str(source)]), 2)
            self.assertFalse(json.loads(printing.call_args.args[0])['accepted'])


if __name__ == '__main__':
    unittest.main()
