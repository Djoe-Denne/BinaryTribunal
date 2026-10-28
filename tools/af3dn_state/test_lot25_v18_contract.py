#!/usr/bin/env python3
"""Explicit v18 (0x5646) admission; historical 0x5645 stays a negative.

Synthetic bytes only. BUILD is never patched, including in fixtures or CLI
tests. Every family must carry the selected build; RS/blend remain raw.
"""
import contextlib
import copy
import io
import json
from pathlib import Path
import struct
import tempfile
import unittest

import lot24_contract as contract
from test_lot24_contract import draw, event, kind1, nd07_setup, tr08, tx07, word


V18 = 0x5646
LEGACY = (0x5642, 0x5643, 0x5644)
FAMILIES = ('ST09', 'ND08', 'ND07setup', 'ND07kind1', 'TX07', 'TR08')
BUILD_OFFSET = dict.fromkeys(('ST09', 'TX07', 'TR08'), 4)
BUILD_OFFSET.update(dict.fromkeys(('ND08', 'ND07setup', 'ND07kind1'), 32))


def fixture(family, build=V18):
    factories = {'ST09': event, 'ND08': draw, 'ND07setup': lambda: nd07_setup(1),
                 'ND07kind1': kind1, 'TX07': lambda: tx07(1),
                 'TR08': lambda: tr08(1)}
    return word(factories[family](), BUILD_OFFSET[family], build)


def capture(build=V18):
    return b''.join(fixture(family, build) for family in FAMILIES)


class V18ContractTests(unittest.TestCase):
    def test_default_is_still_v15_and_admission_is_explicit(self):
        self.assertEqual(contract.BUILD, 0x5642)
        self.assertEqual(contract.BUILD_V18, V18)
        self.assertEqual(contract.SUPPORTED_BUILDS, (*LEGACY, V18))
        self.assertEqual(contract.parse_strict.__defaults__, (0x5642,))
        self.assertEqual(contract.audit_bytes.__defaults__, (0x5642,))
        self.assertEqual(contract.ST_HDR.size, 40)
        self.assertEqual(contract.FOOTER_U32 * 4, 68)
        for family in FAMILIES:
            with self.subTest(family=family):
                data = fixture(family)
                self.assertEqual(contract.parse_strict(data, build=V18)['build'], V18)
                with self.assertRaisesRegex(contract.ContractError, 'build mismatch'):
                    contract.parse_strict(data)

    def test_all_families_uniform_replay_and_legacy_acceptance(self):
        for build in (*LEGACY, V18):
            with self.subTest(build=hex(build)):
                parsed = contract.parse_strict(capture(build), build=build)
                self.assertEqual(parsed['build'], build)
                self.assertEqual({r['family'] for r in parsed['records']},
                                 {'ST09', 'ND08', 'ND07', 'TX07', 'TR08'})
                replay = contract.replay_strict(parsed)
                self.assertTrue(replay['draws'])
                self.assertEqual({d['build'] for d in replay['draws']}, {build})

    def test_every_family_mixed_build_rejected_in_both_directions(self):
        for other in LEGACY:
            for selected, foreign in ((V18, other), (other, V18)):
                for family in FAMILIES:
                    with self.subTest(selected=hex(selected), foreign=hex(foreign),
                                      family=family):
                        data = b''.join(fixture(f, foreign if f == family else selected)
                                        for f in FAMILIES)
                        with self.assertRaisesRegex(contract.ContractError,
                                                    'build mismatch'):
                            contract.parse_strict(data, build=selected)

    def test_unknown_and_historical_negative_words_still_rejected(self):
        for unknown in (0x5641, 0x5645, 0x5647, 0xDEAD, 0xFFFFFFFF):
            with self.subTest(selector=hex(unknown)):
                with self.assertRaisesRegex(contract.ContractError, 'unsupported build'):
                    contract.parse_strict(capture(unknown), build=unknown)
            for selected in (*LEGACY, V18):
                for family in FAMILIES:
                    with self.subTest(selected=hex(selected), family=family,
                                      word=hex(unknown)):
                        with self.assertRaisesRegex(contract.ContractError,
                                                    'build mismatch'):
                            contract.parse_strict(fixture(family, unknown),
                                                  build=selected)

    def test_selector_types_not_coerced(self):
        for bad in (True, False, None, '0x5646', float(V18)):
            with self.subTest(selector=bad):
                with self.assertRaisesRegex(contract.ContractError,
                                            'unsupported build selector'):
                    contract.parse_strict(capture(), build=bad)

    def test_replay_rejects_forged_builds(self):
        base = contract.parse_strict(capture(), build=V18)
        for bad in (*LEGACY, 0x5645, None, True, float(V18)):
            with self.subTest(top_level=bad):
                forged = copy.deepcopy(base)
                forged['build'] = bad
                with self.assertRaises(contract.ContractError):
                    contract.replay_strict(forged)
            for family in ('events', 'draws'):
                for index in range(len(base[family])):
                    with self.subTest(family=family, index=index, build=bad):
                        forged = copy.deepcopy(base)
                        forged[family][index]['build'] = bad
                        with self.assertRaises(contract.ContractError):
                            contract.replay_strict(forged)

    def test_default_and_explicit_audit_are_distinct(self):
        data = capture()
        self.assertFalse(contract.audit_bytes(data)['accepted'])
        result = contract.audit_bytes(data, build=V18)
        self.assertTrue(result['accepted'], result.get('error'))
        self.assertEqual(result['build'], V18)
        self.assertTrue(result['incomplete'])
        self.assertEqual(contract.BUILD, 0x5642)

    def test_raw_rs_and_blend_are_identical_to_v15(self):
        # A raw RS value (including zero) and raw blend selector are never
        # promoted to applied-state proof by the lifecycle-only build change.
        old = (event(epoch=1, kind=1, typ=5, value=0) +
               event(epoch=2, kind=3, typ=33, value=4) +
               draw(epoch=2, st_emitted=2))
        new = word(word(word(old, 4, V18), 44, V18), 80 + 32, V18)
        a = contract.replay_strict(contract.parse_strict(old))
        b = contract.replay_strict(contract.parse_strict(new, build=V18))
        normalized = copy.deepcopy(b)
        for record in normalized['draws'] + normalized['events']:
            record['build'] = 0x5642
        self.assertEqual(a, normalized)
        self.assertEqual(contract.BUILD, 0x5642)

    def test_truncation_and_unknown_footer_flags_remain_fail_closed(self):
        for family in FAMILIES:
            with self.subTest(family=family):
                with self.assertRaises(contract.ContractError):
                    contract.parse_strict(fixture(family)[:-1], build=V18)
        bad = bytearray(fixture('ND08'))
        # flags = word 10 of the 17-u32 footer, independent of vertex count.
        flags_off = len(bad) - 68 + 40
        flags = struct.unpack_from('<I', bad, flags_off)[0]
        struct.pack_into('<I', bad, flags_off, flags | 0x10)
        with self.assertRaisesRegex(contract.ContractError, 'unknown flags'):
            contract.parse_strict(bytes(bad), build=V18)


class V18CliTests(unittest.TestCase):
    def test_cli_default_rejects_and_hex_decimal_selectors_accept(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'v18.bin'
            path.write_bytes(capture())
            for args, expected in (([], 2), (['--build', '0x5646'], 0),
                                   (['--build', str(V18)], 0)):
                with self.subTest(args=args):
                    out = io.StringIO()
                    with contextlib.redirect_stdout(out):
                        rc = contract.main([str(path), *args])
                    result = json.loads(out.getvalue())
                    self.assertEqual(rc, expected)
                    self.assertEqual(result['accepted'], expected == 0)
                    if expected == 0:
                        self.assertEqual(result['build'], V18)
            self.assertEqual(contract.BUILD, 0x5642)

    def test_cli_historical_negative_selector_is_not_a_choice(self):
        with contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as caught:
                contract.main(['unused.bin', '--build', '0x5645'])
        self.assertEqual(caught.exception.code, 2)


if __name__ == '__main__':
    unittest.main()
