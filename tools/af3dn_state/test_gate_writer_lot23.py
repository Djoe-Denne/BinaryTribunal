#!/usr/bin/env python3
"""Pure precondition tests for gate_writer_lot23 (no native step, no execution).

Refusal paths and pure helpers are probed on synthetic files only; the parent
replays the full gate. No game path, no network, no subprocess.
"""
from __future__ import annotations

import sys
import struct
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import gate_writer_lot23 as gate


class PreconditionTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='lot23-gate-test-', dir=gate.temp_base())
        self.addCleanup(self.tmp.cleanup)
        self.dir = Path(self.tmp.name)

    def test_candidate_missing_refused(self):
        self.assertEqual(gate.candidate_refusal(self.dir / 'missing.dll'),
                         'CANDIDATE_MISSING')

    def test_af3dn_p_refused_before_hash_check(self):
        p = self.dir / 'AF3DN.P'
        p.write_bytes(b'MZ' + b'\x00' * 8)
        self.assertEqual(gate.candidate_refusal(p), 'AF3DN.P_BASENAME_REFUSED')

    def test_non_dll_suffix_refused(self):
        p = self.dir / 'writer.txt'
        p.write_bytes(b'MZ' + b'\x00' * 8)
        self.assertEqual(gate.candidate_refusal(p), 'NON_DLL_BASENAME_REFUSED')

    def test_wrong_sha256_refused(self):
        p = self.dir / 'writer.dll'
        p.write_bytes(b'MZ' + b'\x00' * 8)
        self.assertEqual(gate.candidate_refusal(p),
                         'CANDIDATE_SHA256_MISMATCH_REFUSED')

    def test_source_refusal_triggers_without_lot22_files(self):
        real = gate.LOT22
        gate.LOT22 = self.dir                      # empty tree -> c hash drift/refuse
        try:
            reason = gate.source_refusal()
        finally:
            gate.LOT22 = real
        self.assertTrue(reason and
                        reason.startswith(('LOT22_SOURCE_C_HASH_DRIFT_REFUSED',
                                           'LOT22_SOURCE_UNREADABLE')), reason)

    def test_temp_base_is_approved_only(self):
        base = gate.temp_base()
        self.assertTrue(base.as_posix().lower().rstrip('/').endswith('temp/opencode'))
        workdir = gate.temp_workspace()
        self.addCleanup(workdir.rmdir)
        self.assertTrue(workdir.name.startswith('lot23-writer-'))
        self.assertTrue(workdir.is_relative_to(base))
        self.assertEqual(gate.decode_out(b'caf\x82'), 'café')
        self.assertEqual(gate.decode_out(b'plain'), 'plain')

    def test_verdicts_stay_blocked(self):
        self.assertEqual(gate.CONTRACT_STATUS, 'BLOCKED_BY_KNOWN_GAPS')
        self.assertEqual(gate.FIDELITY, 'PARTIAL/BLOCKED')
        self.assertEqual(gate.LIVE, 'NOT AUTHORIZED')
        self.assertEqual(gate.STATUS_OK, 'BUILD_ONLY_BYTES_VERIFIED_NOT_DEPLOYED')

    def test_native_process_environment_always_disables_boothook(self):
        completed = SimpleNamespace(returncode=0, stdout=b'ok', stderr=b'')
        with patch.dict(gate.os.environ, {'FF8_PASSTHROUGH_BOOTHOOK': '1'}):
            with patch.object(gate.subprocess, 'run', return_value=completed) as run:
                code, _ = gate.run_logged(['not-executed'], self.dir, 'mock.log')
        self.assertEqual(code, 0)
        self.assertEqual(run.call_args.kwargs['env']['FF8_PASSTHROUGH_BOOTHOOK'], '0')

    def test_harness_disables_boothook_before_load_and_uses_value_abi(self):
        text = gate.HARNESS_C.read_text(encoding='utf-8')
        self.assertLess(text.index('SetEnvironmentVariableA("FF8_PASSTHROUGH_BOOTHOOK", "0")'),
                        text.index('hmod = LoadLibraryA(argv[1])'))
        self.assertIn('fn(slot, ctx, node, *pep, ctx)', text)
        self.assertIn('P32(backend, 0x14)', text)


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
        struct.pack_into('<I', data, opt + 56, 0x405A000)
        struct.pack_into('<II', data, opt + 96, 0x1000, 0x100)
        struct.pack_into('<8sIIIIIIHHI', data, opt + 224,
                         b'.text\0\0\0', 0x1000, 0x1000, 512, 512, 0, 0, 0, 0,
                         0x60000020)
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


if __name__ == '__main__':
    unittest.main()
