#!/usr/bin/env python3
"""Pure precondition tests for gate_writer_lot24 (no native step, no execution).

Refusal paths, pin-mode logic and pure helpers are probed on synthetic files
only; the parent replays the full gate. No game path, no network, no compile,
no subprocess (run_logged is mocked).
"""
from __future__ import annotations

import json
import struct
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import gate_writer_lot24 as gate


class PreconditionTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='lot24-gate-test-',
                                               dir=gate.temp_base())
        self.addCleanup(self.tmp.cleanup)
        self.dir = Path(self.tmp.name)
        real_pin = gate.PIN_FILE
        gate.PIN_FILE = self.dir / 'candidate_pin.json'
        self.addCleanup(setattr, gate, 'PIN_FILE', real_pin)

    def test_candidate_missing_refused(self):
        self.assertEqual(gate.candidate_refusal(self.dir / 'missing.dll'),
                         'CANDIDATE_MISSING')

    def test_af3dn_p_refused_before_hash_check(self):
        p = self.dir / 'AF3DN.P'
        p.write_bytes(b'MZ' + b'\x00' * 8)
        self.assertEqual(gate.candidate_refusal(p), 'AF3DN.P_BASENAME_REFUSED')
        self.assertEqual(gate.candidate_refusal(p, 'a' * 64),
                         'AF3DN.P_BASENAME_REFUSED')

    def test_non_dll_suffix_refused(self):
        p = self.dir / 'writer.txt'
        p.write_bytes(b'MZ' + b'\x00' * 8)
        self.assertEqual(gate.candidate_refusal(p), 'NON_DLL_BASENAME_REFUSED')

    def test_expect_sha_mismatch_refused_and_pin_mode_unchecked(self):
        p = self.dir / 'writer.dll'
        p.write_bytes(b'MZ' + b'\x00' * 8)
        self.assertEqual(gate.candidate_refusal(p, 'f' * 64),
                         'CANDIDATE_SHA256_MISMATCH_REFUSED')
        # pin mode: no hash constant, identity comes from the static proof
        self.assertIsNone(gate.candidate_refusal(p))

    def test_pin_mode_decision(self):
        self.assertEqual(gate.pin_mode(SimpleNamespace(expect_sha=None)), 'pin')
        self.assertEqual(gate.pin_mode(SimpleNamespace(expect_sha='a' * 64)),
                         'strict')
        self.assertIsNone(gate.pin_precondition('pin'))

    def test_pin_exists_refused_no_overwrite(self):
        gate.PIN_FILE.write_text('{}', encoding='utf-8')
        self.assertTrue(gate.pin_precondition('pin').startswith('PIN_EXISTS'))
        with self.assertRaises(gate.PreconditionRefusal):
            gate.write_pin({'pin_version': 'lot24-pin-1'})

    def test_pin_missing_refused_in_strict_mode(self):
        with self.assertRaises(gate.PreconditionRefusal):
            gate.pin_precondition('strict')

    @staticmethod
    def full_pin(sha):
        return {'candidate_sha256': sha, 'exports': {}, 'build_sites': [],
                'ab_literal_rva': '0x2008', 'pinned_at': 'test'}

    def test_expect_sha_not_matching_pin_refused(self):
        gate.PIN_FILE.write_text(
            json.dumps(self.full_pin('a' * 64)), encoding='utf-8')
        refusal = gate.pin_precondition('strict', expect_sha='b' * 64,
                                        candidate_sha='b' * 64)
        self.assertTrue(refusal.startswith('PIN_SHA256_MISMATCH_REFUSED'), refusal)
        self.assertIsNone(gate.pin_precondition('strict', expect_sha='a' * 64,
                                                candidate_sha='a' * 64))

    def test_pin_malformed_refused(self):
        gate.PIN_FILE.write_text('not json', encoding='utf-8')
        with self.assertRaises(gate.PreconditionRefusal):
            gate.pin_precondition('strict')
        gate.PIN_FILE.write_text(
            json.dumps({'candidate_sha256': 'a' * 64}), encoding='utf-8')
        with self.assertRaises(gate.PreconditionRefusal):
            gate.pin_precondition('strict', expect_sha='a' * 64)
        # ^ pin minimal = malformé (champs requis manquants) : refus AVANT
        # toute comparaison de hash.

    def test_source_refusal_without_lot24_files(self):
        real = gate.LOT24
        gate.LOT24 = self.dir                      # empty tree -> unreadable
        try:
            reason = gate.source_refusal()
        finally:
            gate.LOT24 = real
        self.assertTrue(reason and
                        reason.startswith('LOT24_SOURCE_UNREADABLE'), reason)

    def test_source_expect_sha_mismatch_refused(self):
        real = gate.LOT24
        gate.LOT24 = self.dir
        try:
            (self.dir / 'gfx_driver_passthrough.c').write_bytes(b'c')
            (self.dir / 'gfx_driver_passthrough.h').write_bytes(b'h')
            reason = gate.source_refusal(('0' * 64, '0' * 64))
        finally:
            gate.LOT24 = real
        self.assertEqual(reason, 'LOT24_SOURCE_SHA_MISMATCH_REFUSED (--expect-src-sha)')

    def test_temp_base_is_approved_only(self):
        base = gate.temp_base()
        self.assertTrue(base.as_posix().lower().rstrip('/').endswith('temp/opencode'))
        workdir = gate.temp_workspace()
        self.addCleanup(workdir.rmdir)
        self.assertTrue(workdir.name.startswith('lot24-writer-'))
        self.assertTrue(workdir.is_relative_to(base))
        self.assertEqual(gate.decode_out(b'caf\x82'), 'café')
        self.assertEqual(gate.decode_out(b'plain'), 'plain')

    def test_verdicts_stay_blocked(self):
        self.assertEqual(gate.CONTRACT_STATUS, 'BLOCKED_BY_KNOWN_GAPS')
        self.assertEqual(gate.FIDELITY, 'PARTIAL/BLOCKED')
        self.assertEqual(gate.LIVE, 'NOT AUTHORIZED')
        self.assertEqual(gate.STATUS_OK, 'BUILD_ONLY_BYTES_VERIFIED_NOT_DEPLOYED')
        self.assertEqual(gate.STATUS_PINNED, 'PINNED')
        self.assertEqual(gate.STATUS_FAIL, 'FAIL')
        self.assertEqual(gate.STATUS_REFUSED, 'REFUSED')
        self.assertEqual(gate.BUILD_ID, 0x5642)
        self.assertEqual(gate.BUILD_ID_IMM, b'\x42\x56\x00\x00')
        self.assertEqual(gate.EXPECTED_EXPORT_TOTAL, 17)
        self.assertEqual(gate.EXPECTED_FORWARDS, 9)

    def test_native_process_environment_always_disables_boothook(self):
        completed = SimpleNamespace(returncode=0, stdout=b'ok', stderr=b'')
        with patch.dict(gate.os.environ, {'FF8_PASSTHROUGH_BOOTHOOK': '1'}):
            with patch.object(gate.subprocess, 'run', return_value=completed) as run:
                code, _ = gate.run_logged(['not-executed'], self.dir, 'mock.log')
        self.assertEqual(code, 0)
        self.assertEqual(run.call_args.kwargs['env']['FF8_PASSTHROUGH_BOOTHOOK'], '0')

    def test_expected_export_names_present_in_lot24_source(self):
        text = (gate.LOT24 / 'gfx_driver_passthrough.c').read_text(
            encoding='utf-8', errors='replace')
        for name in sorted(gate.REQUIRED_EXPORTS):
            self.assertIn(f'/EXPORT:{name}=', text)
        for name in ('dotemuCreateFileA', 'dotemuRegSetValueExA'):
            self.assertIn(f'/EXPORT:{name}=dotemu_orig.{name}', text)
        code, forwards = gate.parse_source_exports()
        self.assertEqual(len(code), gate.EXPECTED_EXPORT_TOTAL - gate.EXPECTED_FORWARDS)
        self.assertEqual(len(forwards), gate.EXPECTED_FORWARDS)
        self.assertTrue(gate.STAGE0_EXPORTS <= code)

    def test_harness_log_summary_and_counts_parsing(self):
        text = ('roundtrip.bin counts: nd=2 st=5 tx=1 tr=1\n'
                'stage0.bin counts: nd=1 st=4 tx=1 tr=1\n'
                'checks=42 fails=0\n')
        self.assertEqual(gate.parse_harness_summary(text), (42, 0))
        counts = gate.parse_harness_counts(text)
        self.assertEqual(counts['roundtrip.bin'],
                         {'nd': 2, 'st': 5, 'tx': 1, 'tr': 1})
        with self.assertRaises(gate.GateFailure):
            gate.parse_harness_summary('checks=3 fails=1')
        with self.assertRaises(gate.GateFailure):
            gate.parse_harness_summary('no summary at all')


class PeRegressionTests(unittest.TestCase):
    @staticmethod
    def image():
        data = bytearray(1024)
        data[:2] = b'MZ'
        struct.pack_into('<I', data, 0x3C, 0x80)
        data[0x80:0x84] = b'PE\0\0'
        struct.pack_into('<HHIIIHH', data, 0x84, 0x14C, 1, 0, 0, 0, 224, 0x210E)
        opt = 0x98
        struct.pack_into('<H', data, opt, 0x10B)
        struct.pack_into('<I', data, opt + 28, 0x10000000)
        struct.pack_into('<I', data, opt + 56, 0x2000)
        struct.pack_into('<II', data, opt + 96, 0x1000, 0x100)
        struct.pack_into('<8sIIIIIIHHI', data, opt + 224,
                         b'.text\0\0\0', 0x1000, 0x1000, 512, 512, 0, 0, 0, 0,
                         0x60000020)
        return bytes(data)

    @staticmethod
    def dual_image():
        data = bytearray(2048)
        data[:2] = b'MZ'
        struct.pack_into('<I', data, 0x3C, 0x80)
        data[0x80:0x84] = b'PE\0\0'
        struct.pack_into('<HHIIIHH', data, 0x84, 0x14C, 2, 0, 0, 0, 224, 0x210E)
        opt = 0x98
        struct.pack_into('<H', data, opt, 0x10B)
        struct.pack_into('<I', data, opt + 28, 0x10000000)
        struct.pack_into('<I', data, opt + 56, 0x3000)
        struct.pack_into('<II', data, opt + 96, 0x3000, 0x100)
        sect = opt + 224
        struct.pack_into('<8sIIIIIIHHI', data, sect, b'.text\0\0\0',
                         0x1000, 0x1000, 512, 512, 0, 0, 0, 0, 0x60000020)
        struct.pack_into('<8sIIIIIIHHI', data, sect + 40, b'.rdata\0\0',
                         0x2000, 0x2000, 512, 1024, 0, 0, 0, 0, 0x40000040)
        data[512:517] = b'\x68' + struct.pack('<I', 0x10002008)  # push 0x10002008
        data[1024 + 8:1024 + 11] = b'ab\0'                       # RVA 0x2008
        return bytes(data)

    def test_coff_has_seven_fields(self):
        pe = gate.parse_pe(self.image())
        self.assertEqual(pe['image_base'], 0x10000000)
        self.assertEqual(len(pe['sections']), 1)

    def test_rva_is_section_relative_not_va(self):
        data = self.image()
        pe = gate.parse_pe(data)
        self.assertEqual(gate.rva_to_off(pe, data, 0x1000)[0], 512)
        with self.assertRaises(gate.GateFailure):
            gate.rva_to_off(pe, data, 0x10001000)

    def test_zero_fill_and_cross_section_reads_refused(self):
        data = self.image()
        pe = gate.parse_pe(data)
        for rva, length in ((0x11FF, 2), (0x1200, 1), (0x1000, -1)):
            with self.subTest(rva=rva, length=length):
                with self.assertRaises(gate.GateFailure):
                    gate.rva_to_off(pe, data, rva, length)

    def test_non_pe32_or_wrong_machine_refused(self):
        for offset, value in ((0x84, 0x8664), (0x98, 0x20B)):
            data = bytearray(self.image())
            struct.pack_into('<H', data, offset, value)
            with self.assertRaises(gate.GateFailure):
                gate.parse_pe(bytes(data))

    def test_scan_immediates_reports_exec_section_vas(self):
        data = bytearray(self.image())
        data[512 + 16:512 + 20] = gate.BUILD_ID_IMM
        pe = gate.parse_pe(bytes(data))
        self.assertEqual(gate.scan_immediates(pe, bytes(data), gate.BUILD_ID_IMM),
                         [0x10000000 + 0x1000 + 16])

    def test_ab_literal_derivation_from_push_targets(self):
        data = self.dual_image()
        pe = gate.parse_pe(data)
        push_sites, literals = gate.find_ab_literals(pe, data)
        self.assertEqual(push_sites, [0x10000000 + 0x1000])
        self.assertEqual(literals, {0x2008})


if __name__ == '__main__':
    unittest.main()
