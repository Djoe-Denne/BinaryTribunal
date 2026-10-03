#!/usr/bin/env python3
"""Bounded synthetic v15 (0x5642) tests; no live capture, writer, or deploy."""
import copy
import json
from pathlib import Path
import struct
import tempfile
import unittest
from unittest.mock import patch

import ff8dump
import lot23_contract as lot23
import lot24_contract as contract


def word(blob, offset, value):
    data = bytearray(blob)
    struct.pack_into('<I', data, offset, value)
    return bytes(data)


def event(epoch=1, kind=1, typ=3, value=1, aux=0, seq=1,
          ctx_token=0x1111, device_token=0x2222):
    return struct.pack('<10I', contract.MAGIC_ST, contract.BUILD, seq, epoch,
                       kind, typ, value, aux, ctx_token, device_token)


def draw(epoch=1, flags=contract.HAS_EPOCH, slot=49, vcount=6, icount=6,
         texobj=0, tpage=0, mode=0, clut=0, ids=b'', idx=None, ctx=0x1111,
         node_addr=0x2222, seq=1, stage0=(0, 0, 0, 0), st_emitted=0, st_lost=0):
    verts = b''.join(ff8dump.VERT.pack(float(i), float(i), 0.0, 1.0,
                                       0xFFFF0000, 0, float(i), float(i))
                     for i in range(vcount))
    if idx is None:
        idx = tuple(range(icount))
    indices = struct.pack(f'<{len(idx)}H', *idx)
    indices += b'\0' * ((4 - (len(indices) % 4)) % 4)
    idc = len(ids)
    footer = struct.pack('<4I', tpage, mode, clut, idc) + ids
    footer += b'\0' * ((4 - (idc % 4)) % 4)
    footer += struct.pack('<13I', 0, texobj, 0, 0, 0, epoch, flags,
                          stage0[0], stage0[1], stage0[2], stage0[3],
                          st_emitted, st_lost)
    payload = (bytes(24) + struct.pack('<2I', vcount, icount) + indices
               + verts + footer)
    hdr = ff8dump.HDR.pack(ff8dump.MAGIC_ND8, slot, seq, ctx, node_addr, 2, 0,
                           len(payload), contract.BUILD)
    return hdr + payload


def nd07_setup(seq, slot=44):
    payload = bytes(24)
    return ff8dump.HDR.pack(ff8dump.MAGIC_ND, slot, seq, 0x3333, 0x4444, 0, 0,
                            len(payload), contract.BUILD) + payload


def kind1(seq=1):
    payload = bytes(24) + struct.pack('<I', 3) + bytes(40)
    return ff8dump.HDR.pack(ff8dump.MAGIC_ND, 43, seq, 0x1111, 0x2222, 1, 0,
                            len(payload), contract.BUILD) + payload


def tx07(seq):
    return ff8dump.TX_HDR.pack(ff8dump.MAGIC_TX, contract.BUILD, seq, 0,
                               0x55AA0000, 0x1B47818, 0, 0) + \
        b'\0' * (ff8dump.TX_VRAM_BYTES + 2048 + 8)


def tr08(seq, texobj=0x6D65790):
    hdr = struct.pack('<10I', ff8dump.MAGIC_TR, contract.BUILD, seq, texobj,
                      256, 256, 256, 4, 65536, 4096)
    return hdr + b'\0' * 65536 + b'\0' * 4096


def st09_v14(epoch=1, kind=1, typ=3, value=1, aux=0, seq=1):
    return struct.pack('<8I', lot23.MAGIC_ST, lot23.BUILD, seq, epoch,
                       kind, typ, value, aux)


def nd08_v14(seq=1, epoch=1, flags=lot23.HAS_EPOCH, ctx=0x1111):
    footer = struct.pack('<4I', 0, 0, 0, 0)
    footer += struct.pack('<7I', 0, 0, 0, 0, 0, epoch, flags)
    payload = (bytes(24) + struct.pack('<2I', 6, 6) +
               struct.pack('<6H', 0, 1, 2, 3, 4, 5) +
               b''.join(ff8dump.VERT.pack(float(i), float(i), 0.0, 1.0,
                                          0xFFFF0000, 0, float(i), float(i))
                        for i in range(6)) + footer)
    return ff8dump.HDR.pack(ff8dump.MAGIC_ND8, 49, seq, ctx, 0x2222, 2, 0,
                            len(payload), lot23.BUILD) + payload


def replay(blob):
    return contract.replay_strict(contract.parse_strict(blob))


def raw(draw_state):
    return draw_state['global_requested_unattributed']


def stage0_request(kind=8, epoch=1, site=1, texture=5, stage=2, device=6,
                   devvt=7):
    return event(epoch=epoch, kind=kind, typ=site, value=texture, aux=stage,
                 ctx_token=device, device_token=devvt)


def stage0_result(epoch=2, site=1, texture=5, hr=0, device=6, devvt=7):
    return event(epoch=epoch, kind=9, typ=site, value=texture, aux=hr,
                 ctx_token=device, device_token=devvt)


class ParseStrictTests(unittest.TestCase):
    def reject(self, blob, reason=None):
        with self.assertRaises(contract.ContractError) as caught:
            contract.parse_strict(blob)
        if reason:
            self.assertIn(reason, str(caught.exception))

    def test_v15_codec_sizes_and_stage0_footer_layout(self):
        self.assertEqual(contract.ST_HDR.size, 40)
        self.assertEqual(contract.ND_HDR.size, 36)
        self.assertEqual(contract.FOOTER_U32 * 4, 68)
        self.assertEqual(contract.ND_MAX_BYTES, 0x28188)
        self.assertEqual(contract.ST_MAX_PER_FRAME, 1024)
        self.assertEqual({contract.HAS_EPOCH, contract.STAGE0_VALID,
                          contract.INCOMPLETE, contract.ST_LOSS}, {1, 2, 4, 8})
        data = draw(stage0=(1, 2, 3, 4), st_emitted=5, st_lost=6)
        # v14 order preserved, then the six v15 u32 at the tail.
        self.assertEqual(struct.unpack_from('<6I', data, len(data) - 24),
                         (1, 2, 3, 4, 5, 6))
        self.assertEqual(struct.unpack_from('<I', data, len(data) - 28)[0],
                         contract.HAS_EPOCH)
        blob = kind1()
        self.assertEqual(struct.unpack_from('<I', blob, 28)[0], 68)
        parsed = contract.parse_strict(blob)
        self.assertEqual(parsed['draws'][0]['ordinal'], -1)
        self.assertEqual(parsed['draws'][0]['stage0_hr'], 0)
        self.assertEqual(parsed['build'], 0x5642)

    def test_every_family_unknown_build_mixed_and_truncated(self):
        fixtures = ((event(), 4), (draw(), 32), (nd07_setup(1), 32),
                    (kind1(), 32), (tx07(1), 4), (tr08(1), 4))
        for blob, build_offset in fixtures:
            with self.subTest(magic=blob[:4]):
                contract.parse_strict(blob)
                for build in (0x5641, 0xFFFFFFFF):
                    bad = word(blob, build_offset, build)
                    self.reject(bad, 'build mismatch')
                    self.reject(event() + bad, 'build mismatch')
                for cut in (1, 3, 7, min(39, len(blob) - 1), len(blob) - 1):
                    self.reject(blob[:cut])
                    self.reject(event() + blob[:cut])

    def test_empty_garbage_unknown_kinds_and_flags(self):
        for blob in (b'', b'garbage', draw() + b'\0', event(kind=0),
                     event(kind=10), word(draw(), 20, 3), draw(flags=0),
                     draw(flags=16), draw(flags=0xFFFFFFFF)):
            self.reject(blob)
        contract.parse_strict(draw(flags=15, stage0=(1, 1, 1, 1)))

    def test_st15_validation_matrix_valid(self):
        valid = [(1, t, 0, 0) for t in range(26)]
        valid += [(2, t, 0, 0xFFFFFFFF) for t in (30, 31, 32)]
        valid += [(3, 33, v, 0) for v in range(5)]
        valid += [(4, 39, 0, 0), (5, 0, 0, 0), (5, 1, 0, 0)]
        valid += [(6, t, 1, 0) for t in contract.SETUP_SLOTS]
        valid += [(7, t, 0, 0) for t in (40, 41)]
        valid += [(k, s, 0xFFFFFFFF, 0xFFFFFFFF) for k in (8, 9) for s in (1, 2)]
        for kind, typ, value, aux in valid:
            with self.subTest(valid=(kind, typ, value, aux)):
                contract.parse_strict(event(kind=kind, typ=typ, value=value,
                                            aux=aux))

    def test_st15_validation_matrix_invalid(self):
        invalid = [(1, 26, 1, 0), (1, 0xFFFFFFFF, 1, 0), (2, 29, 1, 0),
                   (2, 33, 1, 0), (3, 3, 1, 0), (3, 33, 5, 0), (4, 38, 0, 0),
                   (5, 2, 0, 0), (7, 39, 0, 0), (7, 42, 0, 0),
                   (8, 3, 0, 0), (9, 33, 0, 0)]
        # (8, typ=0) est désormais VALIDE : le stub logue "site inconnu" (0)
        # quand il est entré hors site patché (appel direct harnais) — couvert
        # dans test_stage0_request_result_kinds_tokens_unconstrained.
        invalid += [(6, t, 1, 1) for t in (52, 53, 54, 56)]
        invalid += [(6, t, 0, 1) for t in contract.SETUP_SLOTS]
        for kind, typ, value, aux in invalid:
            with self.subTest(invalid=(kind, typ, value, aux)):
                self.reject(event(kind=kind, typ=typ, value=value, aux=aux),
                            'invalid ST09')

    def test_kind6_gate_moved_to_device_token_aux_free(self):
        good = event(kind=6, typ=43, value=0xFFFF0000, aux=0, device_token=0x55)
        contract.parse_strict(good)             # aux=0 native return accepted
        self.reject(word(good, 36, 0), 'invalid ST09')      # device_token gate
        self.reject(event(kind=6, typ=43, value=0, aux=7, device_token=0x55),
                    'invalid ST09')                     # value!=0 unchanged

    def test_stage0_request_result_kinds_tokens_unconstrained(self):
        for kind in (8, 9):
            for tokens in ((0, 0), (0xFFFFFFFF, 0), (0x1111, 0x2222)):
                with self.subTest(kind=kind, tokens=tokens):
                    blob = event(epoch=1, kind=kind, typ=2, value=9, aux=7,
                                 ctx_token=tokens[0], device_token=tokens[1])
                    contract.parse_strict(blob)
        # site 0 = stub entré hors site patché (appel direct harnais) : accepté
        contract.parse_strict(event(epoch=1, kind=8, typ=0, value=9, aux=7))
        contract.parse_strict(event(epoch=2, kind=9, typ=0, value=9, aux=0))
        self.reject(event(epoch=1, kind=8, typ=3, value=9, aux=7),
                    'invalid ST09 type/value/gate combination')
        self.reject(event(epoch=1, kind=9, typ=7, value=9, aux=0),
                    'invalid ST09 type/value/gate combination')

    def test_epoch_duplicates_decreasing_and_zero(self):
        for epochs in ((1, 1), (2, 1), (1, 0)):
            self.reject(b''.join(event(epoch=e) for e in epochs))

    def test_st_count_cap_per_seq(self):
        cap = b''.join(event(epoch=e) for e in range(1, 1025))
        contract.parse_strict(cap)
        self.reject(cap + event(epoch=1025), 'per-frame cap exceeded')
        contract.parse_strict(cap + event(epoch=1025, seq=2))

    def test_nd08_maximum_0x28188_and_beyond(self):
        maximum = draw(vcount=4096, icount=16384, ids=bytes(255),
                       idx=tuple(i % 4096 for i in range(16384)))
        self.assertEqual(len(maximum), 0x28188)
        contract.parse_strict(maximum)
        self.reject(word(maximum + b'\0', 28, len(maximum) - 36 + 1),
                    'record size outside')

    def test_nd08_counts_ids_footer_and_flag_rules(self):
        blob = draw(ids=b'\1\2\3', icount=3, vcount=3)
        contract.parse_strict(blob)             # BOTH index and ID padding count
        self.reject(word(blob, 28, len(blob) - 36 - 1), 'footer/payload')
        self.reject(word(blob + b'\0', 28, len(blob) - 36 + 1), 'footer/payload')
        footer = 36 + 24 + 8 + 8 + 3 * 32
        self.reject(word(blob, footer + 12, 256), 'id_count')
        self.reject(word(draw(), 60, 4))        # in-cap but disagrees with layout
        self.reject(word(draw(), 60, 4097), 'count caps')
        self.reject(word(draw(), 64, 16385), 'count caps')
        self.reject(draw(vcount=4, icount=6, idx=(65535, 1, 0, 3, 1, 2)),
                    'out-of-range indices')
        self.reject(blob[:-8], 'truncated ND payload')

    def test_metadata_tokens_stage0_fields_and_records(self):
        blob = tx07(1) + tr08(1) + event() + draw(ctx=0xABC, stage0=(7, 8, 9, 0x1234),
                                                  st_emitted=5, st_lost=2)
        parsed = contract.parse_strict(blob)
        self.assertEqual([r['family'] for r in parsed['records']],
                         ['TX07', 'TR08', 'ST09', 'ND08'])
        self.assertEqual(parsed['tx_metadata'][0]['offset'], 0)
        self.assertEqual(parsed['tr_metadata'][0]['offset'], contract.TX_BYTES)
        self.assertEqual(parsed['tr_metadata'][0]['texobj'], 0x6D65790)
        state = parsed['draws'][0]
        self.assertEqual(state['ctx'], 0xABC)
        self.assertEqual((state['stage0_texture'], state['stage0_device'],
                          state['stage0_devvt'], state['stage0_hr']),
                         (7, 8, 9, 0x1234))
        self.assertEqual((state['st_emitted'], state['st_lost']), (5, 2))
        first_event = parsed['events'][0]
        self.assertEqual((first_event['ctx_token'], first_event['device_token']),
                         (0x1111, 0x2222))
        self.assertIn('device_reset_or_loss', parsed['surface_not_captured'])


class ReplayStrictTests(unittest.TestCase):
    def test_stage0_unavailable_when_bit1_clear_ignores_triple(self):
        blob = stage0_result() + draw(stage0=(5, 6, 7, 0))
        state = replay(blob)['draws'][0]
        self.assertEqual(state['stage0_binding'],
                         {'status': 'unavailable', 'texture': None,
                          'device': None, 'devvt': None, 'hr': None})

    def test_stage0_footer_unmatched_without_kind9(self):
        state = replay(draw(flags=contract.HAS_EPOCH | contract.STAGE0_VALID,
                            stage0=(5, 6, 7, 9)))['draws'][0]
        self.assertEqual(state['stage0_binding']['status'], 'footer_unmatched')
        self.assertEqual((state['stage0_binding']['texture'],
                          state['stage0_binding']['device'],
                          state['stage0_binding']['devvt'],
                          state['stage0_binding']['hr']), (5, 6, 7, 9))

    def test_kind9_hr0_is_applied_witness(self):
        blob = stage0_result(hr=0) + draw(epoch=2, flags=3, stage0=(5, 6, 7, 0))
        binding = replay(blob)['draws'][0]['stage0_binding']
        self.assertEqual(binding['status'], 'applied_witness')
        self.assertEqual(binding['hr'], 0)
        self.assertEqual(binding['devvt'], 7)
        self.assertEqual((binding['epoch'], binding['offset']), (2, 0))

    def test_kind9_hr7_is_requested_failed_raw_preserved(self):
        blob = stage0_result(hr=7) + draw(epoch=2, flags=3, stage0=(5, 6, 7, 7))
        binding = replay(blob)['draws'][0]['stage0_binding']
        self.assertEqual(binding['status'], 'requested_failed')
        self.assertEqual(binding['hr'], 7)
        results = raw(replay(blob)['draws'][0])['stage0_results']
        self.assertEqual(results[0]['hr'], 7)

    def test_kind9_after_draw_or_future_epoch_not_matched(self):
        late = draw(flags=3, stage0=(5, 6, 7, 0)) + stage0_result()
        self.assertEqual(replay(late)['draws'][0]['stage0_binding']['status'],
                         'footer_unmatched')
        future = stage0_result(epoch=5) + draw(epoch=2, flags=3, stage0=(5, 6, 7, 0))
        self.assertEqual(replay(future)['draws'][0]['stage0_binding']['status'],
                         'footer_unmatched')

    def test_kind8_requested_and_requested_no_result(self):
        alone = replay(stage0_request() + draw(epoch=2))['draws'][0]
        self.assertEqual(raw(alone)['stage0_requests'][0]['status'],
                         'requested_no_result')
        answered = replay(stage0_request() + stage0_result() +
                          draw(epoch=2))['draws'][0]
        snapshot = raw(answered)
        self.assertEqual(snapshot['stage0_requests'][0]['status'], 'requested')
        self.assertEqual(snapshot['stage0_results'][0]['status'], 'applied_witness')

    def test_kind2_kind6_commit_result_observed_raw_tokens(self):
        commit = replay(event(kind=2, typ=30, value=234, aux=0x80070057) +
                        draw())['draws'][0]
        call = raw(commit)['commit_calls'][0]
        self.assertEqual(call['status'], 'commit_result_observed')
        self.assertEqual(call['committed'], 'result_raw')
        self.assertEqual(call['applied'], 'unavailable')
        self.assertEqual(call['result_raw'], 0x80070057)
        self.assertEqual((call['ctx_token'], call['device_token']),
                         (0x1111, 0x2222))
        setup = replay(event(kind=6, typ=55, value=0xFFFF0000, aux=0,
                             device_token=0x55) + draw())['draws'][0]
        gate = raw(setup)['setup_gates'][0]
        self.assertEqual(gate['status'], 'commit_result_observed')
        self.assertEqual(gate['committed'], 'result_raw')
        self.assertEqual(gate['applied'], 'unavailable')
        self.assertEqual(gate['result_raw'], 0)
        self.assertEqual(gate['device_token'], 0x55)

    def test_st_loss_bit3_sticky_writer_incomplete_unchanged(self):
        blob = event() + draw(flags=contract.HAS_EPOCH | contract.ST_LOSS)
        blob += event(epoch=2, seq=2) + draw(epoch=2, flags=contract.HAS_EPOCH,
                                             seq=2)
        result = replay(blob)
        self.assertTrue(all('st_loss_frame' in d['persistent_reasons']
                            for d in result['draws']))
        blob = event() + draw(flags=contract.HAS_EPOCH | contract.INCOMPLETE)
        blob += event(epoch=2, seq=2) + draw(epoch=2, flags=contract.HAS_EPOCH,
                                             seq=2)
        result = replay(blob)
        self.assertTrue(all('writer_incomplete' in d['persistent_reasons']
                            for d in result['draws']))

    def test_all_known_flags_accepted_and_stickies_combined(self):
        state = replay(draw(flags=15, stage0=(1, 1, 1, 1)))['draws'][0]
        self.assertIn('st_loss_frame', state['persistent_reasons'])
        self.assertIn('writer_incomplete', state['persistent_reasons'])

    def test_epoch_gap_sticky(self):
        result = replay(event(epoch=3) + draw(epoch=3))
        self.assertIn('epoch_gap', result['persistent_reasons'])
        self.assertIn('epoch_gap', result['draws'][0]['persistent_reasons'])
        self.assertFalse(result['reanchor_available'])

    def test_cap_ambiguity_sticky_next_frame(self):
        blob = b''.join(event(epoch=e, value=0) for e in range(1, 1025))
        blob += draw(epoch=1024) + event(epoch=1025, value=1, seq=2)
        blob += draw(epoch=1025, seq=2)
        result = replay(blob)
        self.assertTrue(all('cap_ambiguity' in d['persistent_reasons']
                            for d in result['draws']))

    def test_init_purge_clears_stage0_lists(self):
        blob = stage0_result() + stage0_request(epoch=3) + \
            event(epoch=4, kind=5, typ=0, value=0)
        blob += draw(epoch=4, flags=3, stage0=(5, 6, 7, 0))
        state = replay(blob)['draws'][0]
        self.assertEqual(raw(state)['stage0_requests'], [])
        self.assertEqual(raw(state)['stage0_results'], [])
        # The footer triple is writer-cache truth at draw time: association
        # stays epoch/offset-prefix based, independent of the purged cache.
        self.assertEqual(state['stage0_binding']['status'], 'applied_witness')
        result = replay(blob)
        self.assertEqual(result['observed_invalidations'][0]['reason'],
                         'init_uninit_observed')

    def test_context_change_purge_and_no_reanchor(self):
        blob = event(value=10) + draw(ctx=0x1111)
        blob += event(epoch=2, value=20) + draw(epoch=2, ctx=0x2222)
        result = replay(blob)
        first, second = result['draws']
        self.assertEqual(raw(first)['rs_raw'][3]['value'], 10)
        self.assertEqual(raw(second)['rs_raw'][3]['status'], 'unseen')
        self.assertIn('draw_context_change', second['reasons'])
        self.assertFalse(result['reanchor_available'])
        self.assertTrue(all(not d['association_valid'] for d in result['draws']))

    def test_footer_reference_unseen_and_contradiction(self):
        state = replay(draw(epoch=1) + event(epoch=1))['draws'][0]
        self.assertIn('footer_reference_unseen', state['reasons'])
        self.assertIn('footer_contradiction', state['reasons'])

    def test_forged_replay_input_revalidated(self):
        base = contract.parse_strict(event() + draw())
        for field, value in (('kind', 10), ('build', 0x5641), ('epoch', 0),
                             ('device_token', -1)):
            forged = copy.deepcopy(base)
            forged['events'][0][field] = value
            with self.assertRaises(contract.ContractError):
                contract.replay_strict(forged)
        for field, value in (('flags', 16), ('stage0_hr', -1), ('offset', 0),
                             ('st_lost', 0x100000000), ('ordinal', -1)):
            forged = copy.deepcopy(base)
            forged['draws'][0][field] = value
            with self.assertRaises(contract.ContractError):
                contract.replay_strict(forged)


class RegressionV14Tests(unittest.TestCase):
    def test_v14_fixture_still_accepted_by_lot23(self):
        self.assertEqual(lot23.ST_HDR.size, 32)
        self.assertEqual(lot23.FOOTER_U32 * 4, 44)
        blob = st09_v14() + nd08_v14()
        parsed = lot23.parse_strict(blob)
        self.assertEqual(parsed['build'], 0x5641)
        self.assertEqual(parsed['draws'][0]['epoch'], 1)
        replayed = lot23.replay_strict(parsed)
        self.assertEqual(replayed['draws'][0]['epoch_status'], 'observed')

    def test_cross_rejections_both_directions(self):
        v15 = event() + draw()
        with self.assertRaises(lot23.ContractError):
            lot23.parse_strict(v15)
        with self.assertRaises(lot23.ContractError):
            lot23.parse_strict(draw())
        v14 = st09_v14() + nd08_v14()
        with self.assertRaises(contract.ContractError):
            contract.parse_strict(v14)
        with self.assertRaises(contract.ContractError):
            contract.parse_strict(st09_v14())


class AuditCliTests(unittest.TestCase):
    def test_audit_success_rejection_and_build(self):
        good = contract.audit_bytes(event() + draw())
        self.assertTrue(good['accepted'])
        self.assertTrue(good['incomplete'])
        self.assertEqual(good['build'], 0x5642)
        self.assertEqual(good['counters']['nd_records'], 1)
        bad = contract.audit_bytes(b'')
        self.assertFalse(bad['accepted'])
        self.assertIn('empty capture', bad['error'])

    def test_cli_capture_optional_out_and_exit_status(self):
        with tempfile.TemporaryDirectory(prefix='lot24-cli-') as directory:
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
