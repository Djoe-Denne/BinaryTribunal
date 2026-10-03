#!/usr/bin/env python3
"""Three bounded, experimental OFFLINE simulations, not an installation gate.

Only caller-supplied bytes/bytearray and synthetic integer events are consumed.
No image loading, process memory, executable pages, hooks, OS APIs, codec changes,
or real draw validation exist here. Passing these models proves nothing live.
ST09 in codec 0x5641 does NOT capture stage0, device results, or reanchors.
The two static device-call sites are alternative research anchors, not a selected
installation site. The IDB hash below is NOT an executable/PE hash pin.
"""
from __future__ import annotations

from dataclasses import dataclass
import hashlib
import struct

import capstone
from capstone import CS_ARCH_X86, CS_MODE_32, Cs
from capstone.x86_const import X86_OP_IMM


CAPSTONE_VERSION = '5.0.6'
U32_MAX = 0xFFFFFFFF
MAX_STOLEN_BYTES = 128
MAX_OWNED_BYTES = 128
MAX_OWNED_RANGES = 16
MAX_LEDGER_EVENTS = 1024
STAGE0_VA = 0x41EF3C
STAGE0_RVA = 0x1EF3C
STAGE0_PREIMAGE = bytes.fromhex('558bec837d0c007433837d0800741a')
STATIC_DATABASE_SHA256 = (
    '064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570'
)
PREFIXES = frozenset((0xF0, 0xF2, 0xF3, 0x2E, 0x36, 0x3E, 0x26,
                      0x64, 0x65, 0x66, 0x67))


class OfflineError(ValueError):
    """Fail-closed rejection in a simulation, never a live safety verdict."""


class RelocationError(OfflineError):
    pass


class TransactionError(OfflineError):
    pass


class LedgerError(OfflineError):
    pass


def _integer(value, name, low=0, high=U32_MAX, error=OfflineError):
    if type(value) is not int or not low <= value <= high:
        raise error(f'{name} outside integer bounds [{low}, {high}]')
    return value


def _address_end(start, size):
    end = start + size
    if not 0 <= end <= U32_MAX:
        raise RelocationError('address range wraps or leaves u32')
    return end


def _decoder():
    if capstone.__version__ != CAPSTONE_VERSION:
        raise RelocationError(f'capstone=={CAPSTONE_VERSION} required')
    decoder = Cs(CS_ARCH_X86, CS_MODE_32)
    decoder.detail = True
    decoder.skipdata = False
    return decoder


def _decode_entire(decoder, code, address):
    instructions = list(decoder.disasm(code, address))
    cursor = address
    for instruction in instructions:
        if instruction.address != cursor or instruction.size <= 0:
            raise RelocationError('noncontiguous decoding')
        cursor += instruction.size
    if cursor != address + len(code):
        raise RelocationError('truncated, invalid, or partially decoded buffer')
    return instructions


def _branch_spec(instruction):
    """Return (kind, expanded opcode, displacement width), or a copy marker."""
    raw = bytes(instruction.bytes)
    opcode = raw[0]
    if opcode in PREFIXES or any(instruction.prefix):
        raise RelocationError('prefixed instructions are unsupported')
    if (0x50 <= opcode <= 0x57 and opcode != 0x54
            or 0x58 <= opcode <= 0x5F and opcode != 0x5C
            or opcode == 0x90):
        if len(raw) != 1:
            raise RelocationError('unexpected one-byte instruction length')
        return None
    if opcode in (0x8B, 0x89):
        return None                         # unprefixed MOV r/m32, r32
    if opcode == 0x83 and len(raw) >= 3 and ((raw[1] >> 3) & 7) == 7:
        return None                         # CMP /7, imm8 only
    if opcode in (0xE8, 0xE9) and len(raw) == 5:
        return ('call' if opcode == 0xE8 else 'jmp', raw[:1], 4)
    if opcode == 0xEB and len(raw) == 2:
        return ('jmp', b'\xE9', 1)
    if 0x70 <= opcode <= 0x7F and len(raw) == 2:
        return ('jcc', bytes((0x0F, opcode + 0x10)), 1)
    if opcode == 0x0F and len(raw) == 6 and 0x80 <= raw[1] <= 0x8F:
        return ('jcc', raw[:2], 4)
    raise RelocationError(f'opcode not on exact allowlist at {instruction.address:#x}')


def _direct_target(instruction, displacement_width):
    displacement = int.from_bytes(bytes(instruction.bytes)[-displacement_width:],
                                  'little', signed=True)
    target = instruction.address + instruction.size + displacement
    _integer(target, 'branch target (no modulo wrap)', error=RelocationError)
    operands = instruction.operands
    if len(operands) != 1 or operands[0].type != X86_OP_IMM:
        raise RelocationError('direct immediate branch required')
    if operands[0].imm != target:
        raise RelocationError('decoder target disagrees with signed displacement')
    return target


def _emit_branch(opcode, source, target):
    end = _address_end(source, len(opcode) + 4)
    displacement = target - end
    if not -(1 << 31) <= displacement <= (1 << 31) - 1:
        raise RelocationError('rel32 displacement out of signed range')
    return opcode + struct.pack('<i', displacement)


def relocate(code: bytes, old: int, new: int) -> dict:
    """Relocate a whole <=128-byte x86-32 buffer into bytes, without execution.

    Returns ``relocated`` (including the return E9), instruction-address
    ``mapping`` (old_end is deliberately NOT mapped), ``external_targets``
    (including old_end), and branch diagnostics. Internal direct CALL/PIC is
    refused. This narrow allowlist is not a general-purpose relocator.
    """
    if type(code) is not bytes or not 1 <= len(code) <= MAX_STOLEN_BYTES:
        raise RelocationError('nonempty bytes of at most 128 bytes required')
    _integer(old, 'old address', error=RelocationError)
    _integer(new, 'new address', error=RelocationError)
    old_end = _address_end(old, len(code))
    decoder = _decoder()
    instructions = _decode_entire(decoder, code, old)
    boundaries = {instruction.address for instruction in instructions}
    plan, mapping, cursor = [], {}, new
    for instruction in instructions:        # pass 1: expanded lengths/boundaries
        spec = _branch_spec(instruction)
        target = None if spec is None else _direct_target(instruction, spec[2])
        internal = target is not None and old <= target < old_end
        if internal and target not in boundaries:
            raise RelocationError('branch targets middle of an instruction')
        if spec is not None and spec[0] == 'call':
            if internal or target == instruction.address + instruction.size:
                raise RelocationError('internal CALL or CALL-next/PIC is unsupported')
        size = instruction.size if spec is None else len(spec[1]) + 4
        mapping[instruction.address] = cursor
        plan.append((instruction, spec, target, internal, cursor, size))
        cursor = _address_end(cursor, size)
    _address_end(cursor, 5)                   # reserve return E9, without wrap
    relocated, branches, external = bytearray(), [], {old_end}
    expected = []
    for instruction, spec, target, internal, source, size in plan:
        if spec is None:
            emitted = bytes(instruction.bytes)
            relocated.extend(emitted)
            expected.append((source, size, emitted, None))
            continue
        destination = mapping[target] if internal else target
        emitted = _emit_branch(spec[1], source, destination)
        relocated.extend(emitted)
        expected.append((source, size, emitted, destination))
        if not internal:
            external.add(target)
        branches.append({'kind': spec[0], 'old_source': instruction.address,
                         'new_source': source, 'old_target': target,
                         'new_target': destination, 'internal': internal})
    return_jump = _emit_branch(b'\xE9', cursor, old_end)
    relocated.extend(return_jump)
    expected.append((cursor, 5, return_jump, old_end))
    result_bytes = bytes(relocated)
    decoded = _decode_entire(decoder, result_bytes, new)
    if len(decoded) != len(expected):
        raise RelocationError('relocated decoder instruction count mismatch')
    for instruction, (source, size, raw, target) in zip(decoded, expected):
        if (instruction.address != source or instruction.size != size
                or bytes(instruction.bytes) != raw):
            raise RelocationError('relocated decoder boundary/bytes mismatch')
        if target is not None and _direct_target(instruction, 4) != target:
            raise RelocationError('relocated decoder branch target mismatch')
    return {'simulation_only': True, 'relocated': result_bytes,
            'mapping': mapping, 'external_targets': tuple(sorted(external)),
            'branches': tuple(branches), 'old_end': old_end,
            'stolen_size': len(code), 'return_source': cursor}


def validate_preimage(code: bytes, expected: bytes = STAGE0_PREIMAGE, *,
                      offset: int = 0, image_bytes: bytes | None = None,
                      image_sha256: str | None = None) -> dict:
    """Compare supplied bytes; optionally hash supplied PE bytes, never load one.

    The caller, not this model, identifies the PE and its trusted hash. No PE
    parsing or connection between code and image_bytes is inferred here.
    """
    if type(code) is not bytes or type(expected) is not bytes or not expected:
        raise OfflineError('bytes and nonempty expected preimage required')
    _integer(offset, 'preimage offset')
    if offset + len(expected) > len(code) or code[offset:offset + len(expected)] != expected:
        raise OfflineError('preimage mismatch or out of range')
    if (image_bytes is None) != (image_sha256 is None):
        raise OfflineError('image bytes and SHA-256 pin must be supplied together')
    digest = None
    if image_bytes is not None:
        if (type(image_bytes) is not bytes or type(image_sha256) is not str
                or len(image_sha256) != 64
                or any(c not in '0123456789abcdefABCDEF' for c in image_sha256)):
            raise OfflineError('invalid supplied image bytes or SHA-256 pin')
        digest = hashlib.sha256(image_bytes).hexdigest()
        if digest != image_sha256.lower():
            raise OfflineError('supplied image SHA-256 mismatch')
    return {'simulation_only': True, 'preimage_matches': True,
            'supplied_image_sha256': digest, 'image_identity_proven': False}


@dataclass(frozen=True)
class _OwnedChange:
    offset: int
    preimage: bytes
    replacement: bytes

    @property
    def end(self):
        return self.offset + len(self.preimage)


class OwnedBufferTransaction:
    """One-shot bytearray transaction simulation, NOT a runtime installer.

    The explicit (offset, length) allowlist and changes are bounded to 16 ranges
    and 128 total bytes each. Immediate nonowned neighbors are read-only
    canaries. Caller concurrency/resizing is unsupported; restore refuses ALL
    writes if any owned replacement has changed. No runtime detach is modeled.
    """

    def __init__(self, buffer: bytearray, changes: list[dict], *, allowed_ranges):
        if type(buffer) is not bytearray:
            raise TransactionError('native bytearray required')
        self.buffer = buffer
        self._buffer_length = len(buffer)
        ranges = self._ranges(allowed_ranges)
        if type(changes) not in (list, tuple) or not 1 <= len(changes) <= MAX_OWNED_RANGES:
            raise TransactionError('bounded nonempty changes required')
        normalized = []
        for change in changes:
            if type(change) is not dict or set(change) != {'offset', 'preimage', 'replacement'}:
                raise TransactionError('change needs exactly offset/preimage/replacement')
            offset = _integer(change['offset'], 'change offset', error=TransactionError)
            before, after = change['preimage'], change['replacement']
            if (type(before) is not bytes or type(after) is not bytes or not before
                    or len(before) != len(after)):
                raise TransactionError('nonempty equal-length bytes required')
            item = _OwnedChange(offset, before, after)
            if item.end > len(buffer) or not any(lo <= offset and item.end <= hi
                                                  for lo, hi in ranges):
                raise TransactionError('change outside buffer or explicit allowlist')
            normalized.append(item)
        ordered = sorted(normalized, key=lambda item: item.offset)
        if any(left.end > right.offset for left, right in zip(ordered, ordered[1:])):
            raise TransactionError('overlapping changes')
        if sum(len(item.preimage) for item in ordered) > MAX_OWNED_BYTES:
            raise TransactionError('owned-byte budget exceeded')
        self._changes = tuple(normalized)     # preserve injection/write order
        owned = {i for item in ordered for i in range(item.offset, item.end)}
        self._canary_positions = tuple(sorted({p for item in ordered
                                               for p in (item.offset - 1, item.end)
                                               if 0 <= p < len(buffer) and p not in owned}))
        self._canaries = {}
        self._written = []
        self._state = 'prepared'

    def _ranges(self, allowed_ranges):
        if (type(allowed_ranges) not in (list, tuple)
                or not 1 <= len(allowed_ranges) <= MAX_OWNED_RANGES):
            raise TransactionError('explicit bounded allowlist required')
        ranges = []
        for item in allowed_ranges:
            if type(item) not in (list, tuple) or len(item) != 2:
                raise TransactionError('allowlist entries are (offset, length)')
            offset = _integer(item[0], 'allowlist offset', error=TransactionError)
            size = _integer(item[1], 'allowlist length', 1, MAX_OWNED_BYTES,
                            error=TransactionError)
            if offset + size > self._buffer_length:
                raise TransactionError('allowlist outside buffer')
            ranges.append((offset, offset + size))
        ranges.sort()
        if (any(a[1] > b[0] for a, b in zip(ranges, ranges[1:]))
                or sum(hi - lo for lo, hi in ranges) > MAX_OWNED_BYTES):
            raise TransactionError('overlapping or overbudget allowlist')
        return tuple(ranges)

    @property
    def receipt(self):
        return {'simulation_only': True, 'state': self._state,
                'writes_attempted': len(self._written),
                'owned_ranges': tuple((c.offset, len(c.preimage)) for c in self._changes),
                'production_gate_passed': False}

    def _check_length(self):
        if len(self.buffer) != self._buffer_length:
            raise TransactionError('caller resized bytearray; model ownership lost')

    def _check_canaries(self):
        self._check_length()
        if any(self.buffer[p] != value for p, value in self._canaries.items()):
            raise TransactionError('adjacent nonowned canary changed')

    def _write(self, item):
        self.buffer[item.offset:item.end] = item.replacement

    def _readback(self, item):
        return bytes(self.buffer[item.offset:item.end])

    def apply(self, fail_after: int | None = None) -> dict:
        """Validate every preimage before writing; rollback every attempted range."""
        if self._state != 'prepared':
            raise TransactionError('transaction is one-shot')
        if fail_after is not None:
            _integer(fail_after, 'fail_after', 0, len(self._changes), TransactionError)
        self._check_length()
        for item in self._changes:
            if bytes(self.buffer[item.offset:item.end]) != item.preimage:
                raise TransactionError('preimage mismatch; no writes performed')
        self._canaries = {p: self.buffer[p] for p in self._canary_positions}
        self._state = 'applying'
        try:
            if fail_after == 0:
                raise TransactionError('injected failure after 0 writes')
            for item in self._changes:
                self._written.append(item)  # include an exceptional partial write
                self._write(item)
                if self._readback(item) != item.replacement:
                    raise TransactionError('replacement readback mismatch')
                self._check_canaries()
                if fail_after == len(self._written):
                    raise TransactionError(f'injected failure after {fail_after} writes')
            self._state = 'applied'
            return self.receipt
        except Exception as exc:
            # Native equal-length bytearray writes are the entire model. Never
            # use the injectable write/readback seams for restoration.
            self._state = 'rollback_failed'
            self._check_length()
            for item in reversed(self._written):
                self.buffer[item.offset:item.end] = item.preimage
            if any(bytes(self.buffer[c.offset:c.end]) != c.preimage for c in self._written):
                self._state = 'rollback_failed'
                raise TransactionError('byte-exact rollback failed') from exc
            self._state = 'rolled_back'
            raise TransactionError(f'apply failed; owned bytes rolled back: {exc}') from exc

    def restore(self) -> dict:
        """Offline detach analogue; precheck ALL ownership, then restore only it."""
        if self._state != 'applied':
            raise TransactionError('only an applied model can restore')
        self._check_length()
        for item in self._changes:
            if bytes(self.buffer[item.offset:item.end]) != item.replacement:
                raise TransactionError('foreign changes in owned range; restore refused')
        self._check_canaries()
        for item in reversed(self._changes):
            self.buffer[item.offset:item.end] = item.preimage
        for item in self._changes:
            if bytes(self.buffer[item.offset:item.end]) != item.preimage:
                raise TransactionError('restore readback mismatch')
        self._check_canaries()
        self._state = 'restored'
        return self.receipt


class BindingLedger:
    """Bounded, single-binding-lane model of SYNTHETIC events, not ST09 decoding.

    Tokens are opaque u32 values, never dereferenced. Resources are synthetic
    TR08-style token associations. Only a witnessed, successful applied call
    can yield the top-level stage0_resource. Requested and applied views remain
    separate. A failed/pending call makes applied unavailable while retaining
    the previous effective event for diagnostics, NOT as a draw-state proof.

    Any loss/drop/init/uninit or observed ctx/device switch stays invalid until
    explicit proven synthetic reanchor. Reanchor establishes no binding (in
    particular no default unbind). Codec 0x5641 cannot provide such a witness.
    """

    INVALIDATIONS = frozenset(('context_change', 'device_change', 'init',
                               'uninit', 'loss', 'drop'))

    def __init__(self):
        self._events = []
        self._overflow_offset = None

    def _position(self, seq, event_offset):
        _integer(seq, 'seq', error=LedgerError)
        _integer(event_offset, 'event_offset', error=LedgerError)
        if self._events and (event_offset <= self._events[-1]['event_offset']
                             or seq < self._events[-1]['seq']):
            raise LedgerError('synthetic offsets must increase; seq must not decrease')

    def _record(self, event):
        self._position(event['seq'], event['event_offset'])
        if len(self._events) >= MAX_LEDGER_EVENTS or self._overflow_offset is not None:
            if self._overflow_offset is None:
                self._overflow_offset = event['event_offset']
            raise LedgerError('bounded ledger exhausted; sticky synthetic drop')
        self._events.append(dict(event))

    def reanchor(self, ctx, device, *, seq, event_offset, proven: bool,
                 source='synthetic') -> dict:
        """Explicit model-only proof; source=0x5641 is always unavailable."""
        _integer(ctx, 'ctx', error=LedgerError)
        _integer(device, 'device', error=LedgerError)
        if type(proven) is not bool:
            raise LedgerError('proven must be an explicit bool')
        valid = proven and source == 'synthetic' and device != 0
        reason = ('synthetic_reanchor' if valid else
                  'codec_0x5641_has_no_stage0_reanchor' if source in (0x5641, '0x5641') else
                  'reanchor_not_proven')
        self._record({'kind': 'reanchor', 'ctx': ctx, 'device': device,
                      'seq': seq, 'event_offset': event_offset,
                      'valid': valid, 'reason': reason})
        return {'simulation_only': True, 'availability': 'available' if valid else 'unavailable',
                'reason': reason, 'binding_established': False}

    def invalidate(self, reason, *, seq, event_offset, ctx=None, device=None):
        if reason not in self.INVALIDATIONS:
            raise LedgerError('unknown synthetic invalidation')
        for name, token in (('ctx', ctx), ('device', device)):
            if token is not None:
                _integer(token, name, error=LedgerError)
        self._record({'kind': 'invalidate', 'reason': reason, 'ctx': ctx,
                      'device': device, 'seq': seq, 'event_offset': event_offset})

    def observe(self, ctx, device, texobj, T, *, status='requested', seq,
                event_offset, read_guarded: bool, success: bool | None = None,
                result: int | None = None, device_call_observed: bool = False) -> dict:
        """Observe supplied tokens; HRESULT is required even with success=True.

        device_call_observed is an explicit synthetic call-site witness. A
        requested texobj=0 without it is NOT observed unbind. device=0 is never
        a call or unbind, regardless of supplied success/result flags.
        """
        for name, token in (('ctx', ctx), ('device', device), ('texobj', texobj)):
            _integer(token, name, error=LedgerError)
        if T is not None:
            _integer(T, 'T', error=LedgerError)
        if status not in ('requested', 'applied'):
            raise LedgerError('requested/applied status required')
        if type(read_guarded) is not bool or type(device_call_observed) is not bool:
            raise LedgerError('guard/call witnesses must be explicit bools')
        if success is not None and type(success) is not bool:
            raise LedgerError('success must be bool or None')
        if result is not None:
            _integer(result, 'HRESULT', -(1 << 31), U32_MAX, LedgerError)
        binding = ('unavailable' if device == 0 else
                   'unbind' if texobj == 0 and device_call_observed else
                   'unavailable' if texobj == 0 else 'bound')
        token_observed = device != 0 and texobj != 0 and read_guarded and T is not None
        applied_proven = (status == 'applied' and device != 0
                          and device_call_observed and success is True
                          and result is not None and 0 <= result < (1 << 31))
        event = {'kind': 'binding', 'ctx': ctx, 'device': device, 'texobj': texobj,
                 'T': T if token_observed else None, 'T_observed': token_observed,
                 'status': status, 'seq': seq, 'event_offset': event_offset,
                 'read_guarded': read_guarded, 'success': success, 'result': result,
                 'device_call_observed': device_call_observed and device != 0,
                 'binding': binding, 'applied_proven': applied_proven}
        self._record(event)
        view = self._view(event)
        # Observation results must not bypass sticky invalidation either.
        # Retained fields are diagnostics; availability comes from the ledger.
        if event_offset < U32_MAX:
            state = self.snapshot(ctx, device, event_offset + 1)
            lane = state[status]
            if lane['availability'] != 'available':
                view.update(availability='unavailable', binding='unavailable',
                            reason=lane['reason'])
        else:
            view.update(availability='unavailable', binding='unavailable',
                        reason='no_representable_draw_prefix')
        view.update(simulation_only=True, real_draw_validated=False)
        return view

    def observe_tr08(self, ctx, device, T, resource, *, seq, event_offset):
        """Synthetic association only; no TR08 parsing or codec extension."""
        for name, token in (('ctx', ctx), ('device', device), ('T', T), ('resource', resource)):
            _integer(token, name, error=LedgerError)
        self._record({'kind': 'resource', 'ctx': ctx, 'device': device, 'T': T,
                      'resource': resource, 'seq': seq, 'event_offset': event_offset})

    @staticmethod
    def _view(event, reason=None):
        if event is None:
            return {'availability': 'unavailable', 'binding': 'unavailable',
                    'observation': 'unseen', 'status': 'unseen',
                    'T': None, 'T_observation': 'unavailable',
                    'reason': reason or 'no_event'}
        available = (reason is None and event['binding'] != 'unavailable'
                     and (event['status'] == 'requested' or event['applied_proven']))
        return {'availability': 'available' if available else 'unavailable',
                'observation': 'observed',
                'binding': event['binding'] if available else 'unavailable',
                'T': event['T'],
                'T_observation': 'observed' if event['T_observed'] else 'unavailable',
                'status': event['status'], 'ctx': event['ctx'], 'device': event['device'],
                'texobj': event['texobj'], 'seq': event['seq'],
                'event_offset': event['event_offset'], 'result': event['result'],
                'device_call_observed': event['device_call_observed'],
                'reason': reason or ('observed_' + event['status'] if available else
                                     'device_zero_no_call' if event['device'] == 0 else
                                     'device_call_or_applied_result_unproven')}

    @staticmethod
    def _resource(view, resources):
        unavailable = {'availability': 'unavailable', 'resource': None}
        if view['availability'] != 'available' or view['binding'] != 'bound':
            return dict(unavailable, reason='no_proven_binding')
        if view['T_observation'] != 'observed':
            return dict(unavailable, reason='T_read_unavailable')
        if view['T'] == 0:
            return dict(unavailable, reason='observed_T_zero_no_resource')
        matches = [r for r in resources if r['ctx'] == view['ctx']
                   and r['device'] == view['device'] and r['T'] == view['T']]
        if not matches:
            return dict(unavailable, reason='no_prefix_TR08_token_match')
        match = matches[-1]
        return {'availability': 'available', 'resource': match['resource'],
                'T': match['T'], 'event_offset': match['event_offset'],
                'seq': match['seq'], 'reason': 'synthetic_prefix_token_match'}

    def snapshot(self, ctx, device, draw_offset) -> dict:
        """Replay ONLY prefix offsets < draw_offset; never validate a real draw."""
        for name, token in (('ctx', ctx), ('device', device), ('draw_offset', draw_offset)):
            _integer(token, name, error=LedgerError)
        anchored, pair, reason = False, None, 'no_explicit_reanchor'
        requested, attempt, effective, resources = None, None, None, []
        pending = False
        for event in self._events:
            if event['event_offset'] >= draw_offset:
                break
            kind = event['kind']
            if kind in ('reanchor', 'invalidate'):
                anchored = kind == 'reanchor' and event['valid']
                pair = (event['ctx'], event['device']) if anchored else None
                reason = event['reason']
                requested, attempt, effective, resources = None, None, None, []
                pending = False
            elif kind == 'resource':
                if anchored:
                    resources.append(event)
            elif kind == 'binding':
                if anchored and pair != (event['ctx'], event['device']):
                    anchored = False
                    reason = 'observed_context_or_device_change'
                    requested, attempt, effective, resources = None, None, None, []
                if not anchored:
                    continue                   # sticky, even when original pair returns
                if event['status'] == 'requested':
                    requested, pending = event, True
                else:
                    attempt, pending = event, False
                    if event['applied_proven'] and event['binding'] != 'unavailable':
                        effective = event
        if self._overflow_offset is not None and self._overflow_offset < draw_offset:
            anchored, reason = False, 'bounded_ledger_drop'
        valid = anchored and pair == (ctx, device) and device != 0
        invalid_reason = None if valid else reason if not anchored else 'ctx_device_mismatch'
        requested_view = self._view(requested, invalid_reason)
        applied_reason = invalid_reason or ('requested_not_applied' if pending else None)
        applied_view = self._view(attempt, applied_reason)
        resource = self._resource(applied_view, resources)
        # Prior effective state is diagnostic only, even following HRESULT failure.
        prior = None if effective is None else self._view(effective, 'diagnostic_only_not_current_proof')
        incomplete = (not valid or applied_view['availability'] != 'available'
                      or (applied_view['binding'] == 'bound'
                          and resource['availability'] != 'available'))
        return {'simulation_only': True, 'stage0_captured_by_st09': False,
                'real_draw_validated': False, 'ctx': ctx, 'device': device,
                'draw_offset': draw_offset, 'anchored': valid, 'incomplete': incomplete,
                'reason': invalid_reason or ('applied_unavailable' if incomplete else 'synthetic_only'),
                'requested': requested_view, 'applied': applied_view,
                'previous_effective': prior, 'stage0_resource': resource}
