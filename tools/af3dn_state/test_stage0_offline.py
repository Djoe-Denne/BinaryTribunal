#!/usr/bin/env python3
"""Synthetic bytes-only tests; passing is NOT a production/live safety gate.

The parent session runs this suite via Context Mode after validating P1.
No existing capture, oracle, writer, runner, or live state is consumed.
"""
import hashlib
import struct
import unittest
from unittest.mock import patch

from capstone import CS_ARCH_X86, CS_MODE_32, Cs

import stage0_offline as model


def decode(code, address):
    decoder = Cs(CS_ARCH_X86, CS_MODE_32)
    decoder.detail = True
    return list(decoder.disasm(code, address))


def direct(opcode, source, target):
    return opcode + struct.pack('<i', target - source - len(opcode) - 4)


class RelocatorTests(unittest.TestCase):
    OLD = 0x1000
    NEW = 0x70000000

    def relocate(self, code):
        return model.relocate(code, self.OLD, self.NEW)

    def reject(self, code):
        with self.assertRaises(model.RelocationError):
            self.relocate(code)

    def test_static_preimage_boundaries_targets_and_return(self):
        original = model.STAGE0_PREIMAGE
        old, new = model.STAGE0_VA, self.NEW
        original_decoded = decode(original, old)
        self.assertEqual([i.size for i in original_decoded], [1, 2, 4, 2, 4, 2])
        self.assertEqual([original_decoded[i].operands[0].imm for i in (3, 5)],
                         [0x41EF78, 0x41EF65])
        result = model.relocate(original, old, new)
        relocated = decode(result['relocated'], new)
        self.assertEqual([i.size for i in relocated], [1, 2, 4, 6, 4, 6, 5])
        self.assertEqual([relocated[i].operands[0].imm for i in (3, 5, 6)],
                         [0x41EF78, 0x41EF65, old + 15])
        self.assertEqual(result['mapping'], dict(zip(
            [old + i for i in (0, 1, 3, 7, 9, 13)],
            [new + i for i in (0, 1, 3, 7, 13, 17)])))
        self.assertEqual(result['external_targets'], (old + 15, 0x41EF65, 0x41EF78))
        self.assertEqual(result['return_source'], new + 23)
        self.assertEqual(len(result['relocated']), 28)
        self.assertNotIn(old + 15, result['mapping'])
        self.assertTrue(result['simulation_only'])

    def test_original_input_immutable_and_output_is_bytes(self):
        original = bytes(model.STAGE0_PREIMAGE)
        saved = original[:]
        first = model.relocate(original, model.STAGE0_VA, self.NEW)
        first['mapping'].clear()
        first['branches'][0]['new_target'] = 0
        second = model.relocate(original, model.STAGE0_VA, self.NEW)
        self.assertEqual(original, saved)
        self.assertIs(type(second['relocated']), bytes)
        self.assertEqual(second['branches'][0]['new_target'], 0x41EF78)
        self.assertEqual(len(second['mapping']), 6)

    def test_internal_forward_jcc_retargets_expanded_boundary(self):
        result = self.relocate(b'\x74\x02\x90\x90\x90')
        instructions = decode(result['relocated'], self.NEW)
        self.assertEqual(instructions[0].operands[0].imm, self.NEW + 8)
        self.assertEqual(result['mapping'][self.OLD + 4], self.NEW + 8)
        self.assertTrue(result['branches'][0]['internal'])

    def test_internal_backward_jcc(self):
        result = self.relocate(b'\x90\x75\xFD')
        instructions = decode(result['relocated'], self.NEW)
        self.assertEqual(instructions[1].operands[0].imm, self.NEW)

    def test_internal_self_short_jmp(self):
        result = self.relocate(b'\xEB\xFE')
        instruction = decode(result['relocated'], self.NEW)[0]
        self.assertEqual(bytes(instruction.bytes)[:1], b'\xE9')
        self.assertEqual(instruction.operands[0].imm, self.NEW)

    def test_two_pass_multiple_forward_expansions(self):
        result = self.relocate(b'\x74\x04\xEB\x02\x90\x90\x90')
        instructions = decode(result['relocated'], self.NEW)
        target = result['mapping'][self.OLD + 6]
        self.assertEqual(target, self.NEW + 13)
        self.assertEqual([i.operands[0].imm for i in instructions[:2]], [target, target])

    def test_near_internal_jmp(self):
        code = direct(b'\xE9', self.OLD, self.OLD + 6) + b'\x90\x90'
        result = self.relocate(code)
        self.assertEqual(decode(result['relocated'], self.NEW)[0].operands[0].imm,
                         result['mapping'][self.OLD + 6])

    def test_near_internal_backward_jcc(self):
        code = direct(b'\x0F\x85', self.OLD, self.OLD)
        result = self.relocate(code)
        self.assertEqual(decode(result['relocated'], self.NEW)[0].operands[0].imm, self.NEW)

    def test_old_end_short_jmp_stays_external(self):
        result = self.relocate(b'\xEB\x00')
        self.assertEqual(decode(result['relocated'], self.NEW)[0].operands[0].imm,
                         self.OLD + 2)
        self.assertFalse(result['branches'][0]['internal'])
        self.assertNotIn(self.OLD + 2, result['mapping'])

    def test_old_end_jcc_stays_external(self):
        result = self.relocate(b'\x74\x00')
        self.assertEqual(decode(result['relocated'], self.NEW)[0].operands[0].imm,
                         self.OLD + 2)

    def test_all_short_conditions_preserved(self):
        for condition in range(16):
            with self.subTest(condition=condition):
                result = self.relocate(bytes((0x70 + condition, 0)))
                instruction = decode(result['relocated'], self.NEW)[0]
                self.assertEqual(bytes(instruction.bytes)[:2], bytes((0x0F, 0x80 + condition)))
                self.assertEqual(instruction.operands[0].imm, self.OLD + 2)

    def test_all_near_conditions_preserved(self):
        for condition in range(16):
            with self.subTest(condition=condition):
                opcode = bytes((0x0F, 0x80 + condition))
                result = self.relocate(direct(opcode, self.OLD, self.OLD + 6))
                instruction = decode(result['relocated'], self.NEW)[0]
                self.assertEqual(bytes(instruction.bytes)[:2], opcode)
                self.assertEqual(instruction.operands[0].imm, self.OLD + 6)

    def test_external_call_keeps_absolute_target(self):
        target = 0x2000
        result = self.relocate(direct(b'\xE8', self.OLD, target))
        self.assertEqual(decode(result['relocated'], self.NEW)[0].operands[0].imm, target)
        self.assertEqual(result['branches'][0]['kind'], 'call')
        self.assertIn(target, result['external_targets'])

    def test_negative_external_call_displacement(self):
        target = self.OLD - 0x100
        result = self.relocate(direct(b'\xE8', self.OLD, target))
        self.assertEqual(decode(result['relocated'], self.NEW)[0].operands[0].imm, target)

    def test_internal_call_refused(self):
        self.reject(direct(b'\xE8', self.OLD, self.OLD))
        self.reject(direct(b'\xE8', self.OLD, self.OLD + 6) + b'\x90\x90')

    def test_call_next_pic_refused_even_at_old_end(self):
        self.reject(b'\xE8\0\0\0\0')
        self.reject(b'\xE8\0\0\0\0\x90')

    def test_branch_into_instruction_middle_refused(self):
        self.reject(b'\xEB\x01\x8B\xEC')
        self.reject(b'\x74\x01\x8B\xEC')
        self.reject(direct(b'\xE9', self.OLD, self.OLD + 6) + b'\x8B\xEC')

    def test_exact_copy_allowlist(self):
        one_byte = bytes([i for i in range(0x50, 0x60) if i not in (0x54, 0x5C)]) + b'\x90'
        for code in (one_byte, b'\x8B\xEC', b'\x89\xD8', b'\x8B\x44\x24\x08',
                     bytes.fromhex('8b842478563412'), bytes.fromhex('890d78563412'),
                     bytes.fromhex('83f800'), bytes.fromhex('837c240400'),
                     bytes.fromhex('83bd7856341200')):
            with self.subTest(code=code.hex()):
                self.assertEqual(self.relocate(code)['relocated'][:-5], code)

    def test_push_pop_esp_refused(self):
        self.reject(b'\x54')
        self.reject(b'\x5C')

    def test_other_83_groups_and_other_mov_opcodes_refused(self):
        for code in (b'\x83\xC0\x01', b'\x83\xE8\x01', b'\xB8\0\0\0\0',
                     b'\x8D\x00', b'\x8C\xD8', b'\xA1\0\0\0\0'):
            with self.subTest(code=code.hex()):
                self.reject(code)

    def test_truncated_and_partial_decoding_refused(self):
        for code in (b'\xE8', b'\xE9\0\0', b'\x0F\x84\0', b'\x8B',
                     b'\x83', b'\x8B\x04', b'\x90\xE8\0'):
            with self.subTest(code=code.hex()):
                self.reject(code)

    def test_loop_family_refused(self):
        for opcode in range(0xE0, 0xE4):
            with self.subTest(opcode=opcode):
                self.reject(bytes((opcode, 0xFE)))

    def test_all_prefixes_refused(self):
        for code in (bytes.fromhex('66e90000'), bytes.fromhex('670f8400000000'),
                     bytes.fromhex('2e7400'), bytes.fromhex('f390'),
                     bytes.fromhex('648b00'), bytes.fromhex('668bec')):
            with self.subTest(code=code.hex()):
                self.reject(code)

    def test_indirect_call_and_jump_refused(self):
        for code in (bytes.fromhex('ffd0'), bytes.fromhex('ffe0'),
                     bytes.fromhex('ff9098000000'), bytes.fromhex('ff2500100000')):
            with self.subTest(code=code.hex()):
                self.reject(code)

    def test_far_ret_interrupt_and_syscalls_refused(self):
        for code in (bytes.fromhex('9a001000000800'), bytes.fromhex('ea001000000800'),
                     bytes.fromhex('c3'), bytes.fromhex('c20800'), bytes.fromhex('cb'),
                     bytes.fromhex('cc'), bytes.fromhex('cd80'), bytes.fromhex('ce'),
                     bytes.fromhex('0f05'), bytes.fromhex('0f34'), bytes.fromhex('9c')):
            with self.subTest(code=code.hex()):
                self.reject(code)

    def test_empty_oversized_and_nonbytes_refused(self):
        for code in (b'', b'\x90' * 129, bytearray(b'\x90'), '90'):
            with self.subTest(kind=type(code).__name__):
                self.reject(code)
        self.assertEqual(len(self.relocate(b'\x90' * 128)['mapping']), 128)

    def test_invalid_addresses_and_range_overflow_refused(self):
        for old, new in ((-1, self.NEW), (self.OLD, -1), (1 << 32, self.NEW),
                         (self.OLD, 1 << 32), (True, self.NEW),
                         (0xFFFFFFFF, self.NEW), (self.OLD, 0xFFFFFFFE)):
            with self.subTest(old=old, new=new):
                with self.assertRaises(model.RelocationError):
                    model.relocate(b'\x90', old, new)

    def test_original_target_wrap_refused_no_modulo(self):
        with self.assertRaises(model.RelocationError):
            model.relocate(b'\xEB\x80', 0, self.NEW)
        with self.assertRaises(model.RelocationError):
            model.relocate(b'\xE9\xFF\xFF\xFF\x7F', 0x7FFFFFFF, self.NEW)

    def test_positive_rel32_out_of_range_refused(self):
        old, new, target = 0x7FFF0000, 0x1000, 0x80010005
        with self.assertRaisesRegex(model.RelocationError, 'signed range'):
            model.relocate(direct(b'\xE9', old, target), old, new)

    def test_negative_rel32_out_of_range_refused(self):
        old, new, target = 0x1000, 0x7FFFFFFF, 0
        with self.assertRaisesRegex(model.RelocationError, 'signed range'):
            model.relocate(direct(b'\xE9', old, target), old, new)

    def test_signed_rel32_extremes_are_exact(self):
        for old, new, target, expected in (
                (0x7FFFF000, 0x1000, 0x80001004, 0x7FFFFFFF),
                (0x1000, 0x7FFFFFFF, 4, -0x80000000)):
            with self.subTest(expected=expected):
                result = model.relocate(direct(b'\xE9', old, target), old, new)
                self.assertEqual(struct.unpack('<i', result['relocated'][1:5])[0], expected)
                self.assertEqual(decode(result['relocated'], new)[0].operands[0].imm, target)

    def test_capstone_pin_enforced(self):
        with patch.object(model.capstone, '__version__', '0.0.0'):
            self.reject(b'\x90')


class PreimageTests(unittest.TestCase):
    def test_default_and_offset_preimage(self):
        result = model.validate_preimage(b'!' + model.STAGE0_PREIMAGE + b'?', offset=1)
        self.assertTrue(result['preimage_matches'])
        self.assertTrue(result['simulation_only'])
        self.assertFalse(result['image_identity_proven'])
        self.assertIsNone(result['supplied_image_sha256'])

    def test_mismatch_truncation_type_and_offset_refused(self):
        for code, offset in ((b'\0' * 15, 0), (model.STAGE0_PREIMAGE[:-1], 0),
                             (model.STAGE0_PREIMAGE, 1), (model.STAGE0_PREIMAGE, -1),
                             (bytearray(model.STAGE0_PREIMAGE), 0)):
            with self.subTest(offset=offset):
                with self.assertRaises(model.OfflineError):
                    model.validate_preimage(code, offset=offset)

    def test_supplied_image_hash_pin_only(self):
        image = b'SYNTHETIC caller supplied PE-like bytes, not a real executable'
        digest = hashlib.sha256(image).hexdigest()
        result = model.validate_preimage(model.STAGE0_PREIMAGE,
                                         image_bytes=image, image_sha256=digest)
        self.assertEqual(result['supplied_image_sha256'], digest)
        self.assertFalse(result['image_identity_proven'])
        with self.assertRaises(model.OfflineError):
            model.validate_preimage(model.STAGE0_PREIMAGE,
                                    image_bytes=image, image_sha256='0' * 64)

    def test_incomplete_or_invalid_hash_pin_refused(self):
        for kwargs in ({'image_bytes': b'PE'}, {'image_sha256': '0' * 64},
                       {'image_bytes': b'PE', 'image_sha256': 'not-a-hash'},
                       {'image_bytes': bytearray(b'PE'), 'image_sha256': '0' * 64}):
            with self.subTest(kwargs=kwargs):
                with self.assertRaises(model.OfflineError):
                    model.validate_preimage(model.STAGE0_PREIMAGE, **kwargs)


class OwnedBufferTests(unittest.TestCase):
    ORIGINAL = b'!abcdef?ghijkl$'

    def changes(self):
        return [{'offset': 1, 'preimage': b'ab', 'replacement': b'AB'},
                {'offset': 8, 'preimage': b'gh', 'replacement': b'GH'},
                {'offset': 12, 'preimage': b'kl', 'replacement': b'KL'}]

    def transaction(self, buffer=None, changes=None):
        return model.OwnedBufferTransaction(
            bytearray(self.ORIGINAL) if buffer is None else buffer,
            self.changes() if changes is None else changes,
            allowed_ranges=[(1, 2), (8, 2), (12, 2)])

    def test_success_readback_and_restore_exact(self):
        transaction = self.transaction()
        receipt = transaction.apply()
        self.assertEqual(transaction.buffer, b'!ABcdef?GHijKL$')
        self.assertEqual(receipt['state'], 'applied')
        self.assertEqual(receipt['writes_attempted'], 3)
        self.assertFalse(receipt['production_gate_passed'])
        self.assertTrue(receipt['simulation_only'])
        self.assertEqual(transaction.restore()['state'], 'restored')
        self.assertEqual(transaction.buffer, self.ORIGINAL)

    def test_partial_failure_after_one_range_restores_all_bytes(self):
        transaction = self.transaction()
        with self.assertRaises(model.TransactionError):
            transaction.apply(fail_after=1)
        self.assertEqual(transaction.buffer, self.ORIGINAL)
        self.assertEqual(transaction.receipt['state'], 'rolled_back')
        self.assertEqual(transaction.receipt['writes_attempted'], 1)

    def test_partial_failure_after_two_ranges_restores_all_bytes(self):
        transaction = self.transaction()
        with self.assertRaises(model.TransactionError):
            transaction.apply(fail_after=2)
        self.assertEqual(transaction.buffer, self.ORIGINAL)
        self.assertEqual(transaction.receipt['writes_attempted'], 2)

    def test_failure_before_or_after_all_writes(self):
        for count in (0, 3):
            with self.subTest(count=count):
                transaction = self.transaction()
                with self.assertRaises(model.TransactionError):
                    transaction.apply(fail_after=count)
                self.assertEqual(transaction.buffer, self.ORIGINAL)
                self.assertEqual(transaction.receipt['writes_attempted'], count)

    def test_all_preimages_checked_before_first_write(self):
        changes = self.changes()
        changes[-1]['preimage'] = b'XX'
        transaction = self.transaction(changes=changes)
        with patch.object(transaction, '_write') as writer:
            with self.assertRaises(model.TransactionError):
                transaction.apply()
            writer.assert_not_called()
        self.assertEqual(transaction.buffer, self.ORIGINAL)
        self.assertEqual(transaction.receipt['writes_attempted'], 0)

    def test_exception_after_partial_current_write_rolls_back(self):
        transaction = self.transaction()
        write = transaction._write

        def injected(item):
            if item.offset == 8:
                transaction.buffer[8] = ord('G')
                raise RuntimeError('synthetic partial write exception')
            write(item)

        with patch.object(transaction, '_write', side_effect=injected):
            with self.assertRaises(model.TransactionError):
                transaction.apply()
        self.assertEqual(transaction.buffer, self.ORIGINAL)
        self.assertEqual(transaction.receipt['writes_attempted'], 2)

    def test_readback_mismatch_rolls_back(self):
        transaction = self.transaction()
        readback = transaction._readback
        with patch.object(transaction, '_readback', side_effect=lambda c:
                          b'XX' if c.offset == 8 else readback(c)):
            with self.assertRaises(model.TransactionError):
                transaction.apply()
        self.assertEqual(transaction.buffer, self.ORIGINAL)

    def test_canary_detection_rolls_back_owned_without_restoring_foreign_byte(self):
        transaction = self.transaction()
        write = transaction._write

        def injected(item):
            write(item)
            transaction.buffer[0] = ord('@')

        with patch.object(transaction, '_write', side_effect=injected):
            with self.assertRaises(model.TransactionError):
                transaction.apply()
        self.assertEqual(transaction.buffer, b'@' + self.ORIGINAL[1:])
        self.assertEqual(transaction.receipt['state'], 'rolled_back')

    def test_canaries_and_all_nonowned_bytes_untouched(self):
        transaction = self.transaction()
        owned = {1, 2, 8, 9, 12, 13}
        self.assertEqual(transaction._canary_positions, (0, 3, 7, 10, 11, 14))
        transaction.apply()
        for i in range(len(self.ORIGINAL)):
            if i not in owned:
                self.assertEqual(transaction.buffer[i], self.ORIGINAL[i])
        transaction.restore()
        self.assertEqual(transaction.buffer, self.ORIGINAL)

    def test_overlap_refused_without_writes(self):
        buffer = bytearray(self.ORIGINAL)
        changes = self.changes()[:1] + [{'offset': 2, 'preimage': b'bc', 'replacement': b'BC'}]
        with self.assertRaises(model.TransactionError):
            model.OwnedBufferTransaction(buffer, changes, allowed_ranges=[(1, 4)])
        self.assertEqual(buffer, self.ORIGINAL)

    def test_out_of_bounds_and_nonallowlisted_refused(self):
        for offset, size in ((-1, 2), (14, 2), (4, 2), (1, 3)):
            with self.subTest(offset=offset, size=size):
                buffer = bytearray(self.ORIGINAL)
                change = {'offset': offset, 'preimage': b'x' * size, 'replacement': b'y' * size}
                with self.assertRaises(model.TransactionError):
                    self.transaction(buffer, [change])
                self.assertEqual(buffer, self.ORIGINAL)

    def test_unequal_empty_or_nonbytes_changes_refused(self):
        for before, after in ((b'ab', b'A'), (b'', b''), (bytearray(b'ab'), b'AB')):
            with self.subTest(before=before):
                with self.assertRaises(model.TransactionError):
                    self.transaction(changes=[{'offset': 1, 'preimage': before, 'replacement': after}])

    def test_explicit_allowlist_required_bounded_and_nonoverlapping(self):
        for ranges in ([], [(0, 129)], [(0, 8), (7, 4)], [(14, 2)], [(0, 0)],
                       [(i, 1) for i in range(17)]):
            with self.subTest(ranges=ranges):
                with self.assertRaises(model.TransactionError):
                    model.OwnedBufferTransaction(bytearray(self.ORIGINAL), self.changes(),
                                                 allowed_ranges=ranges)

    def test_native_bytearray_required(self):
        with self.assertRaises(model.TransactionError):
            self.transaction(buffer=self.ORIGINAL)

    def test_restore_checks_all_owned_before_any_write(self):
        transaction = self.transaction()
        transaction.apply()
        transaction.buffer[12:14] = b'ZZ'
        tampered = bytes(transaction.buffer)
        with self.assertRaisesRegex(model.TransactionError, 'foreign'):
            transaction.restore()
        self.assertEqual(transaction.buffer, tampered)
        self.assertEqual(transaction.buffer[1:3], b'AB')
        self.assertEqual(transaction.buffer[12:14], b'ZZ')

    def test_foreign_nonadjacent_changes_preserved_on_restore(self):
        transaction = self.transaction()
        transaction.apply()
        transaction.buffer[5] = ord('X')
        transaction.restore()
        expected = bytearray(self.ORIGINAL)
        expected[5] = ord('X')
        self.assertEqual(transaction.buffer, expected)

    def test_foreign_canary_change_refuses_without_clobber(self):
        transaction = self.transaction()
        transaction.apply()
        transaction.buffer[0] = ord('@')
        before = bytes(transaction.buffer)
        with self.assertRaises(model.TransactionError):
            transaction.restore()
        self.assertEqual(transaction.buffer, before)

    def test_allowlist_edges_and_adjacent_owned_ranges(self):
        buffer = bytearray(b'abcd')
        transaction = model.OwnedBufferTransaction(buffer, [
            {'offset': 0, 'preimage': b'ab', 'replacement': b'AB'},
            {'offset': 2, 'preimage': b'cd', 'replacement': b'CD'}],
            allowed_ranges=[(0, 4)])
        self.assertEqual(transaction._canary_positions, ())
        transaction.apply()
        self.assertEqual(buffer, b'ABCD')
        transaction.restore()
        self.assertEqual(buffer, b'abcd')

    def test_caller_changes_and_receipts_do_not_mutate_plan(self):
        changes = self.changes()
        transaction = self.transaction(changes=changes)
        changes[0]['replacement'] = b'ZZ'
        transaction.receipt['state'] = 'foreign'
        transaction.apply()
        self.assertEqual(transaction.buffer[1:3], b'AB')
        self.assertEqual(transaction.receipt['state'], 'applied')

    def test_one_shot_and_restore_before_apply_refused(self):
        transaction = self.transaction()
        with self.assertRaises(model.TransactionError):
            transaction.restore()
        transaction.apply()
        with self.assertRaises(model.TransactionError):
            transaction.apply()
        transaction.restore()
        with self.assertRaises(model.TransactionError):
            transaction.restore()

    def test_invalid_failure_injection_and_resizing_fail_before_write(self):
        for fail_after in (-1, 4, True, 1.5):
            with self.subTest(fail_after=fail_after):
                transaction = self.transaction()
                with self.assertRaises(model.TransactionError):
                    transaction.apply(fail_after=fail_after)
                self.assertEqual(transaction.buffer, self.ORIGINAL)
        transaction = self.transaction()
        transaction.buffer.append(0)
        before = bytes(transaction.buffer)
        with self.assertRaises(model.TransactionError):
            transaction.apply()
        self.assertEqual(transaction.buffer, before)


class BindingLedgerTests(unittest.TestCase):
    CTX = 0x1111
    DEVICE = 0x2222
    TEXOBJ = 0x3333
    TOKEN = 0x4444
    RESOURCE = 0x5555

    def ledger(self):
        ledger = model.BindingLedger()
        ledger.reanchor(self.CTX, self.DEVICE, seq=1, event_offset=1,
                        proven=True, source='synthetic')
        return ledger

    def bind(self, ledger, offset=10, **kwargs):
        values = dict(ctx=self.CTX, device=self.DEVICE, texobj=self.TEXOBJ, T=self.TOKEN,
                      status='applied', seq=offset, event_offset=offset,
                      read_guarded=True, success=True, result=0, device_call_observed=True)
        values.update(kwargs)
        return ledger.observe(**values)

    def resource(self, ledger, offset=5, **kwargs):
        values = dict(ctx=self.CTX, device=self.DEVICE, T=self.TOKEN,
                      resource=self.RESOURCE, seq=offset, event_offset=offset)
        values.update(kwargs)
        ledger.observe_tr08(**values)

    def snapshot(self, ledger, offset=20, **kwargs):
        values = dict(ctx=self.CTX, device=self.DEVICE, draw_offset=offset)
        values.update(kwargs)
        return ledger.snapshot(**values)

    def test_unseen_state_and_explicit_anchor_have_no_default_unbind(self):
        for ledger in (model.BindingLedger(), self.ledger()):
            with self.subTest(anchored=bool(ledger._events)):
                snapshot = self.snapshot(ledger)
                self.assertEqual(snapshot['applied']['availability'], 'unavailable')
                self.assertEqual(snapshot['applied']['binding'], 'unavailable')
                self.assertEqual(snapshot['stage0_resource']['availability'], 'unavailable')
                self.assertTrue(snapshot['incomplete'])
                self.assertFalse(snapshot['stage0_captured_by_st09'])
                self.assertFalse(snapshot['real_draw_validated'])

    def test_no_implicit_anchor_from_binding_or_resource(self):
        ledger = model.BindingLedger()
        self.resource(ledger)
        observed = self.bind(ledger)
        self.assertEqual(observed['availability'], 'unavailable')
        snapshot = self.snapshot(ledger)
        self.assertFalse(snapshot['anchored'])
        self.assertEqual(snapshot['applied']['availability'], 'unavailable')

    def test_guarded_token_and_matching_prefix_resource(self):
        ledger = self.ledger()
        self.resource(ledger)
        self.bind(ledger)
        snapshot = self.snapshot(ledger)
        self.assertEqual(snapshot['applied']['binding'], 'bound')
        self.assertEqual(snapshot['applied']['T'], self.TOKEN)
        self.assertEqual(snapshot['stage0_resource']['resource'], self.RESOURCE)
        self.assertFalse(snapshot['incomplete'])
        self.assertTrue(snapshot['simulation_only'])

    def test_observed_zero_token_distinct_from_unavailable(self):
        ledger = self.ledger()
        self.resource(ledger, T=0)
        self.bind(ledger, T=0)
        snapshot = self.snapshot(ledger)
        self.assertEqual(snapshot['applied']['binding'], 'bound')
        self.assertEqual(snapshot['applied']['T'], 0)
        self.assertEqual(snapshot['applied']['T_observation'], 'observed')
        self.assertEqual(snapshot['stage0_resource']['availability'], 'unavailable')
        self.assertEqual(snapshot['stage0_resource']['reason'], 'observed_T_zero_no_resource')

    def test_guarded_read_failure_none_not_token_zero(self):
        ledger = self.ledger()
        self.resource(ledger)
        self.bind(ledger, T=None)
        snapshot = self.snapshot(ledger)
        self.assertIsNone(snapshot['applied']['T'])
        self.assertEqual(snapshot['applied']['T_observation'], 'unavailable')
        self.assertEqual(snapshot['stage0_resource']['reason'], 'T_read_unavailable')

    def test_unguarded_token_ignored_not_dereferenced(self):
        ledger = self.ledger()
        self.resource(ledger)
        self.bind(ledger, read_guarded=False)
        snapshot = self.snapshot(ledger)
        self.assertIsNone(snapshot['applied']['T'])
        self.assertEqual(snapshot['stage0_resource']['availability'], 'unavailable')

    def test_device_zero_early_return_is_not_unbind(self):
        ledger = self.ledger()
        observed = self.bind(ledger, device=0, texobj=0, T=0)
        self.assertEqual(observed['availability'], 'unavailable')
        self.assertEqual(observed['binding'], 'unavailable')
        self.assertFalse(observed['device_call_observed'])
        self.assertIsNone(observed['T'])
        snapshot = self.snapshot(ledger, device=0)
        self.assertFalse(snapshot['anchored'])
        self.assertNotEqual(snapshot['applied']['binding'], 'unbind')

    def test_observed_unbind_requires_actual_call_witness(self):
        ledger = self.ledger()
        self.bind(ledger, texobj=0, T=self.TOKEN)
        snapshot = self.snapshot(ledger)
        self.assertEqual(snapshot['applied']['binding'], 'unbind')
        self.assertEqual(snapshot['applied']['availability'], 'available')
        self.assertIsNone(snapshot['applied']['T'])
        self.assertEqual(snapshot['stage0_resource']['availability'], 'unavailable')

    def test_zero_texobj_without_call_is_not_unbind(self):
        ledger = self.ledger()
        self.bind(ledger, texobj=0, device_call_observed=False)
        self.assertEqual(self.snapshot(ledger)['applied']['binding'], 'unavailable')

    def test_requested_unbind_separate_from_applied(self):
        ledger = self.ledger()
        self.bind(ledger, texobj=0, T=None, status='requested', success=None, result=None)
        snapshot = self.snapshot(ledger)
        self.assertEqual(snapshot['requested']['binding'], 'unbind')
        self.assertEqual(snapshot['applied']['availability'], 'unavailable')

    def test_requested_only_does_not_prove_applied_or_resource(self):
        ledger = self.ledger()
        self.resource(ledger)
        self.bind(ledger, status='requested', success=True, result=0)
        snapshot = self.snapshot(ledger)
        self.assertEqual(snapshot['requested']['availability'], 'available')
        self.assertEqual(snapshot['requested']['status'], 'requested')
        self.assertEqual(snapshot['applied']['availability'], 'unavailable')
        self.assertEqual(snapshot['stage0_resource']['availability'], 'unavailable')

    def test_requested_and_applied_not_merged(self):
        ledger = self.ledger()
        self.bind(ledger, status='requested', texobj=0, T=None, success=None, result=None)
        self.bind(ledger, offset=12)
        snapshot = self.snapshot(ledger)
        self.assertEqual(snapshot['requested']['binding'], 'unbind')
        self.assertEqual(snapshot['applied']['binding'], 'bound')
        self.assertEqual(snapshot['requested']['event_offset'], 10)
        self.assertEqual(snapshot['applied']['event_offset'], 12)

    def test_applied_requires_true_success_hresult_and_call(self):
        for kwargs in ({'success': None}, {'success': False}, {'result': None},
                       {'result': -1}, {'result': 0x80004005},
                       {'device_call_observed': False}):
            with self.subTest(kwargs=kwargs):
                ledger = self.ledger()
                self.bind(ledger, **kwargs)
                self.assertEqual(self.snapshot(ledger)['applied']['availability'], 'unavailable')

    def test_nonzero_success_hresult_accepted_in_simulation(self):
        ledger = self.ledger()
        self.bind(ledger, result=1)
        self.assertEqual(self.snapshot(ledger)['applied']['availability'], 'available')

    def test_failure_retains_previous_effective_but_current_unavailable(self):
        ledger = self.ledger()
        self.resource(ledger)
        self.bind(ledger)
        self.bind(ledger, offset=12, texobj=0x9999, T=0xAAAA,
                  success=False, result=0x80004005)
        snapshot = self.snapshot(ledger)
        self.assertEqual(snapshot['applied']['availability'], 'unavailable')
        self.assertEqual(snapshot['previous_effective']['texobj'], self.TEXOBJ)
        self.assertEqual(snapshot['previous_effective']['T'], self.TOKEN)
        self.assertEqual(snapshot['previous_effective']['availability'], 'unavailable')
        self.assertEqual(snapshot['stage0_resource']['availability'], 'unavailable')
        self.assertTrue(snapshot['incomplete'])

    def test_pending_request_does_not_reuse_prior_proof(self):
        ledger = self.ledger()
        self.bind(ledger)
        self.bind(ledger, offset=12, status='requested', success=None, result=None)
        snapshot = self.snapshot(ledger)
        self.assertEqual(snapshot['applied']['availability'], 'unavailable')
        self.assertEqual(snapshot['applied']['reason'], 'requested_not_applied')
        self.assertEqual(snapshot['previous_effective']['texobj'], self.TEXOBJ)

    def test_missing_token_mapping_unavailable(self):
        ledger = self.ledger()
        self.bind(ledger)
        snapshot = self.snapshot(ledger)
        self.assertEqual(snapshot['applied']['availability'], 'available')
        self.assertEqual(snapshot['stage0_resource']['availability'], 'unavailable')
        self.assertTrue(snapshot['incomplete'])

    def test_future_and_same_draw_offset_resource_never_match(self):
        for offset in (20, 25):
            with self.subTest(offset=offset):
                ledger = self.ledger()
                self.bind(ledger)
                self.resource(ledger, offset=offset)
                self.assertEqual(self.snapshot(ledger)['stage0_resource']['availability'], 'unavailable')
                self.assertEqual(self.snapshot(ledger, offset=offset + 1)['stage0_resource']['resource'],
                                 self.RESOURCE)

    def test_resource_after_bind_but_before_draw_matches(self):
        ledger = self.ledger()
        self.bind(ledger)
        self.resource(ledger, offset=15)
        self.assertEqual(self.snapshot(ledger)['stage0_resource']['resource'], self.RESOURCE)

    def test_wrong_context_device_or_token_resource_never_matches(self):
        for kwargs in ({'ctx': 0x9999}, {'device': 0x9999}, {'T': 0x9999}):
            with self.subTest(kwargs=kwargs):
                ledger = self.ledger()
                self.resource(ledger, **kwargs)
                self.bind(ledger)
                snapshot = self.snapshot(ledger)
                self.assertEqual(snapshot['applied']['availability'], 'available')
                self.assertEqual(snapshot['stage0_resource']['availability'], 'unavailable')

    def test_latest_prefix_mapping_selected_not_future_replacement(self):
        ledger = self.ledger()
        self.resource(ledger)
        self.bind(ledger)
        self.resource(ledger, offset=15, resource=0x6666)
        self.resource(ledger, offset=25, resource=0x7777)
        self.assertEqual(self.snapshot(ledger)['stage0_resource']['resource'], 0x6666)

    def test_binding_at_or_after_draw_is_not_used(self):
        for offset in (20, 25):
            with self.subTest(offset=offset):
                ledger = self.ledger()
                self.bind(ledger, offset=offset)
                self.assertEqual(self.snapshot(ledger)['applied']['availability'], 'unavailable')

    def test_loss_drop_init_uninit_are_sticky(self):
        for reason in model.BindingLedger.INVALIDATIONS:
            with self.subTest(reason=reason):
                ledger = self.ledger()
                self.bind(ledger)
                ledger.invalidate(reason, seq=11, event_offset=11,
                                  ctx=self.CTX, device=self.DEVICE)
                observed = self.bind(ledger, offset=12)
                self.assertEqual(observed['availability'], 'unavailable')
                self.resource(ledger, offset=15)
                snapshot = self.snapshot(ledger)
                self.assertFalse(snapshot['anchored'])
                self.assertEqual(snapshot['applied']['availability'], 'unavailable')
                self.assertEqual(snapshot['stage0_resource']['availability'], 'unavailable')
                self.assertEqual(snapshot['reason'], reason)

    def test_device_zero_reanchor_unavailable_even_if_claimed_proven(self):
        ledger = model.BindingLedger()
        result = ledger.reanchor(self.CTX, 0, seq=1, event_offset=1,
                                 proven=True, source='synthetic')
        self.assertEqual(result['availability'], 'unavailable')
        self.assertFalse(self.snapshot(ledger, device=0)['anchored'])

    def test_context_or_device_switch_and_return_remains_sticky(self):
        for kwargs in ({'ctx': 0x9999}, {'device': 0x9999}):
            with self.subTest(kwargs=kwargs):
                ledger = self.ledger()
                self.bind(ledger)
                self.bind(ledger, offset=11, **kwargs)
                self.bind(ledger, offset=12)
                self.assertFalse(self.snapshot(ledger)['anchored'])
                self.assertEqual(self.snapshot(ledger)['applied']['availability'], 'unavailable')

    def test_no_automatic_reanchor_on_init_or_rs_requested_change(self):
        ledger = self.ledger()
        self.bind(ledger)
        ledger.invalidate('loss', seq=11, event_offset=11)
        ledger.invalidate('init', seq=12, event_offset=12)
        self.bind(ledger, offset=13, status='requested', success=None, result=None, T=0)
        snapshot = self.snapshot(ledger)
        self.assertFalse(snapshot['anchored'])
        self.assertNotEqual(snapshot['applied']['binding'], 'unbind')

    def test_unproven_reanchor_and_current_codec_cannot_clear_loss(self):
        for proven, source in ((False, 'synthetic'), (True, 0x5641), (True, '0x5641')):
            with self.subTest(proven=proven, source=source):
                ledger = self.ledger()
                ledger.invalidate('loss', seq=5, event_offset=5)
                result = ledger.reanchor(self.CTX, self.DEVICE, seq=6, event_offset=6,
                                         proven=proven, source=source)
                self.bind(ledger)
                self.assertEqual(result['availability'], 'unavailable')
                self.assertFalse(self.snapshot(ledger)['anchored'])

    def test_explicit_reanchor_clears_loss_but_establishes_no_binding(self):
        ledger = self.ledger()
        self.resource(ledger)
        self.bind(ledger)
        ledger.invalidate('loss', seq=11, event_offset=11)
        result = ledger.reanchor(self.CTX, self.DEVICE, seq=12, event_offset=12,
                                 proven=True, source='synthetic')
        self.assertFalse(result['binding_established'])
        between = self.snapshot(ledger, offset=13)
        self.assertTrue(between['anchored'])
        self.assertEqual(between['applied']['binding'], 'unavailable')
        self.bind(ledger, offset=14)
        self.assertEqual(self.snapshot(ledger)['stage0_resource']['availability'], 'unavailable')
        self.resource(ledger, offset=15)
        self.assertEqual(self.snapshot(ledger)['stage0_resource']['resource'], self.RESOURCE)

    def test_future_loss_does_not_poison_earlier_prefix(self):
        ledger = self.ledger()
        self.bind(ledger)
        ledger.invalidate('loss', seq=25, event_offset=25)
        self.assertTrue(self.snapshot(ledger)['anchored'])
        self.assertFalse(self.snapshot(ledger, offset=26)['anchored'])

    def test_snapshot_wrong_context_or_device_unavailable(self):
        ledger = self.ledger()
        self.resource(ledger)
        self.bind(ledger)
        for kwargs in ({'ctx': 0x9999}, {'device': 0x9999}):
            with self.subTest(kwargs=kwargs):
                snapshot = self.snapshot(ledger, **kwargs)
                self.assertEqual(snapshot['applied']['availability'], 'unavailable')
                self.assertEqual(snapshot['stage0_resource']['availability'], 'unavailable')
        self.assertEqual(self.snapshot(ledger)['stage0_resource']['resource'], self.RESOURCE)

    def test_token_fields_boolean_witnesses_and_status_validation(self):
        for kwargs in ({'T': -1}, {'T': 1 << 32}, {'device': True}, {'ctx': -1},
                       {'texobj': 'pointer'}, {'read_guarded': 1}, {'success': 1},
                       {'result': True}, {'result': -(1 << 31) - 1},
                       {'status': 'effective'}, {'device_call_observed': 1}):
            with self.subTest(kwargs=kwargs):
                with self.assertRaises(model.LedgerError):
                    self.bind(self.ledger(), **kwargs)

    def test_offsets_strict_and_sequences_nondecreasing(self):
        ledger = self.ledger()
        self.bind(ledger)
        for offset, seq in ((10, 10), (9, 11), (11, 9)):
            with self.subTest(offset=offset, seq=seq):
                with self.assertRaises(model.LedgerError):
                    self.bind(ledger, offset=offset, seq=seq)
        self.bind(ledger, offset=11, seq=10)

    def test_snapshots_and_observation_results_cannot_mutate_events(self):
        ledger = self.ledger()
        self.resource(ledger)
        observed = self.bind(ledger)
        observed['T'] = 0
        snapshot = self.snapshot(ledger)
        snapshot['applied']['T'] = 0
        snapshot['stage0_resource']['resource'] = 0
        fresh = self.snapshot(ledger)
        self.assertEqual(fresh['applied']['T'], self.TOKEN)
        self.assertEqual(fresh['stage0_resource']['resource'], self.RESOURCE)

    def test_bounded_ledger_overflow_is_sticky_drop(self):
        ledger = self.ledger()
        self.bind(ledger, offset=2)
        for offset in range(3, model.MAX_LEDGER_EVENTS + 1):
            self.resource(ledger, offset=offset)
        with self.assertRaises(model.LedgerError):
            self.resource(ledger, offset=model.MAX_LEDGER_EVENTS + 1)
        snapshot = self.snapshot(ledger, offset=model.MAX_LEDGER_EVENTS + 2)
        self.assertFalse(snapshot['anchored'])
        self.assertEqual(snapshot['reason'], 'bounded_ledger_drop')
        self.assertEqual(snapshot['stage0_resource']['availability'], 'unavailable')
        with self.assertRaises(model.LedgerError):
            ledger.reanchor(self.CTX, self.DEVICE, seq=model.MAX_LEDGER_EVENTS + 3,
                            event_offset=model.MAX_LEDGER_EVENTS + 3, proven=True)


if __name__ == '__main__':
    unittest.main()
