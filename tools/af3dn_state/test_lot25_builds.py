#!/usr/bin/env python3
"""Lot 25 build-selector tests (v15 0x5642 / v16 0x5643 / v17 0x5644).

Explicit matrix for every family (ST09 offset 4, TX07 offset 4, TR08
offset 4, ND07/ND08 offset 32): accepted under the exact build, rejected
under the DEFAULT build (mismatch), rejected for unknown builds
(0x5641 / 0xDEAD / 0xFFFFFFFF), and mixed known builds within one window.
No live capture, writer, or deploy.
"""
import copy
import json
from pathlib import Path
import struct
import tempfile
import unittest
from unittest.mock import patch

import ff8dump
import lot24_contract as contract
from test_lot24_contract import word, event, draw, nd07_setup, kind1, tx07, tr08


def event_b(blob_build, **kw):
    """ST09 fixture with an explicit build word (default fixtures omit it)."""
    return struct.pack('<10I', contract.MAGIC_ST, blob_build, kw.get('seq', 1),
                       kw.get('epoch', 1), kw.get('kind', 1), kw.get('typ', 3),
                       kw.get('value', 1), kw.get('aux', 0),
                       kw.get('ctx_token', 0x1111),
                       kw.get('device_token', 0x2222))


def draw_b(blob_build, **kw):
    blob = draw(**kw)
    return word(blob, 32, blob_build)


def nd07_setup_b(blob_build, seq, slot=44):
    return word(nd07_setup(seq, slot=slot), 32, blob_build)


def kind1_b(blob_build, seq=1):
    return word(kind1(seq=seq), 32, blob_build)


def tx07_b(blob_build, seq):
    return word(tx07(seq), 4, blob_build)


def tr08_b(blob_build, seq):
    return word(tr08(seq), 4, blob_build)


# v15 fixtures come straight from test_lot24_contract (never weakened).
def family_fixture(family, build):
    return {
        'ST09': event() if build == contract.BUILD else event_b(build),
        'ND08': draw() if build == contract.BUILD else draw_b(build),
        'ND07setup': (nd07_setup(1) if build == contract.BUILD
                      else nd07_setup_b(build, 1)),
        'ND07kind1': kind1() if build == contract.BUILD else kind1_b(build),
        'TX07': tx07(1) if build == contract.BUILD else tx07_b(build, 1),
        'TR08': tr08(1) if build == contract.BUILD else tr08_b(build, 1),
    }[family]


FAMILIES = ('ST09', 'ND08', 'ND07setup', 'ND07kind1', 'TX07', 'TR08')
BUILD_OFFSET = {'ST09': 4, 'ND08': 32, 'ND07setup': 32, 'ND07kind1': 32,
                'TX07': 4, 'TR08': 4}
UNKNOWN_BUILDS = (0x5641, 0xDEAD, 0xFFFFFFFF)
OTHER_BUILDS = {build: tuple(other for other in contract.SUPPORTED_BUILDS
                             if other != build)
                for build in contract.SUPPORTED_BUILDS}


class BuildSelectorMatrixTests(unittest.TestCase):
    def reject(self, blob, build=contract.BUILD, reason=None):
        with self.assertRaises(contract.ContractError) as caught:
            contract.parse_strict(blob, build=build)
        if reason:
            self.assertIn(reason, str(caught.exception))

    def test_each_family_accepted_under_exact_build(self):
        for build in contract.SUPPORTED_BUILDS:
            for family in FAMILIES:
                with self.subTest(build=hex(build), family=family):
                    blob = family_fixture(family, build)
                    parsed = contract.parse_strict(blob, build=build)
                    self.assertEqual(parsed['build'], build)

    def test_each_family_rejected_under_default_mismatch(self):
        # v16/v17 captures are NOT accepted with the DEFAULT selector 0x5642.
        for build in (contract.BUILD_V16, contract.BUILD_V17):
            for family in FAMILIES:
                with self.subTest(build=hex(build), family=family):
                    blob = family_fixture(family, build)
                    for other in OTHER_BUILDS[build]:
                        self.reject(blob, build=other, reason='build mismatch')

    def test_each_family_unknown_build_words_rejected(self):
        for family in FAMILIES:
            for unknown in UNKNOWN_BUILDS:
                with self.subTest(family=family, build=hex(unknown)):
                    blob = family_fixture(family, contract.BUILD)
                    bad = word(blob, BUILD_OFFSET[family], unknown)
                    self.reject(bad, reason='build mismatch')
                    self.reject(event() + bad, reason='build mismatch')
                    # unknown build words also rejected under v16/v17 selectors
                    for other in (contract.BUILD_V16, contract.BUILD_V17):
                        self.reject(bad, build=other, reason='build mismatch')

    def test_mixed_known_builds_in_one_window_rejected(self):
        for build in contract.SUPPORTED_BUILDS:
            others = OTHER_BUILDS[build]
            for other in others:
                with self.subTest(build=hex(build), other=hex(other),
                                  mixed=(build, other)):
                    ST, TX, TR = (BUILD_OFFSET['ST09'], BUILD_OFFSET['TX07'],
                                  BUILD_OFFSET['TR08'])
                    blob = (family_fixture('ST09', build) +
                            word(family_fixture('TX07', other), TX, other) +
                            word(family_fixture('TR08', build), TR, build) +
                            family_fixture('ND08', build))
                    self.reject(blob, build=build, reason='build mismatch')
                    # sibling frogs stay within the same window: a single
                    # foreign family poisons the whole capture.

    def test_multi_family_uniform_blob_per_build(self):
        # ST + TX + TR + ND08 uniform, one blob per supported build.
        for build in contract.SUPPORTED_BUILDS:
            with self.subTest(build=hex(build)):
                blob = (family_fixture('ST09', build) +
                        family_fixture('TX07', build) +
                        family_fixture('TR08', build) +
                        family_fixture('ND08', build))
                parsed = contract.parse_strict(blob, build=build)
                self.assertEqual(parse_families(parsed),
                                 sorted(['ST09', 'TX07', 'TR08', 'ND08']))


def parse_families(parsed):
    seen = []
    for record in parsed['records']:
        if record['family'] not in seen:
            seen.append(record['family'])
    return sorted(seen)


class ReplayBuildIntegrityTests(unittest.TestCase):
    def base_parsed(self):
        return contract.parse_strict(event() + draw() + kind1() + tx07(1) +
                                     tr08(1), build=contract.BUILD)

    def test_replay_four_builds_accepted_uniform(self):
        for build in contract.SUPPORTED_BUILDS:
            with self.subTest(build=hex(build)):
                blob = (event_b(build) + draw_b(build) + kind1_b(build) +
                        tx07_b(build, 1) + tr08_b(build, 1))
                parsed = contract.parse_strict(blob, build=build)
                replayed = contract.replay_strict(parsed)
                self.assertEqual(replayed['draws'][0]['build'], build)

    def test_replay_rejects_forged_top_level_build(self):
        base = self.base_parsed()
        for value in (None, 0x5641, 0xDEAD, 0xFFFFFFFF, True, float(0x5642)):
            forged = copy.deepcopy(base)
            forged['build'] = value
            with self.assertRaises(contract.ContractError):
                contract.replay_strict(forged)

    def test_replay_rejects_forged_record_build(self):
        base = self.base_parsed()
        for value in (0x5641, 0xDEAD, 0xFFFFFFFF, contract.BUILD_V16,
                      contract.BUILD_V17):
            for target in (forged_event_target, forged_draw_target):
                forged = copy.deepcopy(base)
                target(forged)['build'] = value
                with self.assertRaises(contract.ContractError) as caught:
                    contract.replay_strict(forged)
                self.assertIn('build', str(caught.exception))
        # mix known builds inside events
        forged = copy.deepcopy(base)
        forged['events'][0]['build'] = contract.BUILD_V17
        with self.assertRaises(contract.ContractError):
            contract.replay_strict(forged)

    def test_replay_rejects_combined_mismatch(self):
        base = self.base_parsed()
        forged = copy.deepcopy(base)
        forged['build'] = contract.BUILD_V17
        forged['events'][0]['build'] = contract.BUILD_V17
        with self.assertRaises(contract.ContractError):
            contract.replay_strict(forged)

    def test_parse_strict_selector_types(self):
        for bad in (True, False, float(0x5642), '0x5642', None,
                    0x5642 + 0.5):
            with self.assertRaises(contract.ContractError):
                contract.parse_strict(event(), build=bad)
        for good in contract.SUPPORTED_BUILDS:
            contract.parse_strict(event_b(good), build=good)


def forged_event_target(parsed):
    return parsed['events'][0]


def forged_draw_target(parsed):
    return parsed['draws'][0] if parsed['draws'][0]['kind'] == 2 \
        else parsed['draws'][1]


class AuditBytesBuildTests(unittest.TestCase):
    def test_audit_accepts_all_supported_builds_and_reports_parsed(self):
        for build in contract.SUPPORTED_BUILDS:
            with self.subTest(build=hex(build)):
                blob = event_b(build) + draw_b(build)
                result = contract.audit_bytes(blob, build=build)
                self.assertTrue(result['accepted'], result.get('error'))
                self.assertEqual(result['build'], build)   # parsed, not constant
                self.assertTrue(result['incomplete'])

    def test_audit_default_rejects_other_builds(self):
        for build in (contract.BUILD_V16, contract.BUILD_V17):
            with self.subTest(build=hex(build)):
                result = contract.audit_bytes(event_b(build) + draw_b(build))
                self.assertFalse(result['accepted'])
                self.assertIn('build mismatch', result['error'])

    def test_audit_explicit_accepts_and_output_build(self):
        blob = event_b(contract.BUILD_V17) + draw_b(contract.BUILD_V17)
        result = contract.audit_bytes(blob, build=contract.BUILD_V17)
        self.assertTrue(result['accepted'])
        self.assertEqual(result['build'], contract.BUILD_V17)
        self.assertEqual(result['counters']['nd_records'], 1)


class CliBuildTests(unittest.TestCase):
    CAPTURE = {'v15': lambda: event() + draw(),
               'v16': lambda: event_b(contract.BUILD_V16) +
                              draw_b(contract.BUILD_V16),
               'v17': lambda: event_b(contract.BUILD_V17) +
                              draw_b(contract.BUILD_V17)}

    def cli(self, directory, name, build_version, extra=()):
        source = Path(directory) / f'{name}.bin'
        out = Path(directory) / f'{name}.json'
        source.write_bytes(self.CAPTURE[build_version]())
        status = contract.main([str(source), *extra, '--out', str(out)])
        return status, json.loads(out.read_text(encoding='utf-8'))

    def test_cli_default_rejects_v16_and_v17(self):
        with tempfile.TemporaryDirectory(prefix='lot25-cli-') as directory:
            for version in ('v16', 'v17'):
                with self.subTest(version=version):
                    status, result = self.cli(directory, f'default-{version}',
                                              version)
                    self.assertEqual(status, 2)
                    self.assertFalse(result['accepted'])
                    self.assertIn('build mismatch', result['error'])

    def test_cli_explicit_build_accepts_and_output_build(self):
        with tempfile.TemporaryDirectory(prefix='lot25-cli-') as directory:
            for version, build in (('v15', contract.BUILD),
                                   ('v16', contract.BUILD_V16),
                                   ('v17', contract.BUILD_V17)):
                with self.subTest(version=version):
                    status, result = self.cli(
                        directory, f'explicit-{version}', version,
                        extra=['--build', hex(build)])
                    self.assertEqual(status, 0)
                    self.assertTrue(result['accepted'])
                    self.assertEqual(result['build'], build)

    def test_cli_unknown_build_choice_rejected(self):
        with tempfile.TemporaryDirectory(prefix='lot25-cli-') as directory:
            source = Path(directory) / 'v15.bin'
            source.write_bytes(self.CAPTURE['v15']())
            with self.assertRaises(SystemExit):
                contract.main([str(source), '--build', '0x5641'])

    def test_cli_hex_and_decimal_syntax(self):
        with tempfile.TemporaryDirectory(prefix='lot25-cli-') as directory:
            for value, expected in (('0x5643', contract.BUILD_V16),
                                    ('22083', contract.BUILD_V16)):
                status, result = self.cli(directory, f'syntax-{value}',
                                          'v16', extra=['--build', value])
                self.assertEqual(status, 0)
                self.assertEqual(result['build'], expected)


if __name__ == '__main__':
    unittest.main()
