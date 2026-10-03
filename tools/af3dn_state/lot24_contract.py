#!/usr/bin/env python3
"""Offline audit of the Lot 24 stage0-instrumentation candidate (build 0x5642).

v15 deltas vs v14: ST09 grows to 40 bytes (+ctx_token/+device_token, raw
pointers, opaque); kind 8 = stage0 request, kind 9 = stage0 result (aux =
raw HRESULT); kind2/kind6 aux = raw native forward return (witness, never a
device success — the internal [deviceVT+0x58] HRESULT stays unreachable);
ND08 footer grows to 17 u32 (+stage0 texture/device/devVT/hr triple,
+st_emitted/st_lost); flags bit1 STAGE0_VALID, bit2 INCOMPLETE (now also set
on cap/overflow), bit3 ST_LOSS (>=1 emission refusal this frame).

Even a complete ledger is NOT an applied-state proof: stage0 hr==0 is an
applied WITNESS only, tokens stay raw integers and are never dereferenced.
"""
from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import struct

import ff8dump

BUILD = 0x5642
MAGIC_ST = 0x39305453              # 'ST09', unchanged since v14
ST_HDR = struct.Struct('<10I')     # magic, build, seq, epoch, kind, type,
#                                  value, aux, ctx_token, device_token
ND_HDR = struct.Struct('<9I')
NODE_BYTES = 24
FOOTER_U32 = 17                    # v14 order (11) + stage0 triple + emitted/lost
ND_MAX_BYTES = 0x28188             # v14 0x28170 + 24 (footer growth)
ST_MAX_PER_FRAME = 1024
HAS_EPOCH = 1
STAGE0_VALID = 2
INCOMPLETE = 4
ST_LOSS = 8
KNOWN_FLAGS = HAS_EPOCH | STAGE0_VALID | INCOMPLETE | ST_LOSS
SETUP_SLOTS = frozenset((43, 44, 45, 46, 47, 55))
TX_BYTES = ff8dump.TX_HDR.size + ff8dump.TX_VRAM_BYTES + 2048 + 8
ST_FIELDS = ('magic', 'build', 'seq', 'epoch', 'kind', 'type', 'value', 'aux',
             'ctx_token', 'device_token')
MISSING_FIELDS = ('event_context_identity', 'applied_state',
                  'device_reset_or_loss')
SURFACE_NOT_CAPTURED = (
    'event_context_identity', 'device_reset_or_loss', 'device_internal_hresult',
    'depth_semantics', 'blend_semantics',
)


class ContractError(ValueError):
    """Fail-closed rejection, before any state interpretation."""


def _require(condition, reason, offset):
    if not condition:
        raise ContractError(f'{reason} at {offset}')


def _validate_event(event):
    off = event['offset']
    for field in ('build', 'seq', 'epoch', 'kind', 'type', 'value', 'aux',
                  'ctx_token', 'device_token'):
        _require(type(event.get(field)) is int and 0 <= event[field] <= 0xFFFFFFFF,
                 f'invalid ST09 u32 {field}', off)
    _require(event['build'] == BUILD, 'ST09 build mismatch', off)
    _require(event['epoch'] > 0, 'ST09 epoch zero is reserved', off)
    kind, typ, value, device = (event[k] for k in ('kind', 'type', 'value',
                                                   'device_token'))
    _require(kind in range(1, 10), 'unknown ST09 kind', off)
    valid = {
        1: 0 <= typ <= 25,
        2: typ in (30, 31, 32),                 # aux = raw native return
        3: typ == 33 and 0 <= value <= 4,
        4: typ == 39,
        5: typ in (0, 1),
        6: typ in SETUP_SLOTS and value != 0 and device != 0,   # AC4 gate on token
        7: typ in (40, 41),
        8: typ in (0, 1, 2),                    # stage0 request site (0 = stub
                                                # entré hors site patché : appel
                                                # direct harnais / ret VA inconnu)
        9: typ in (0, 1, 2),                    # stage0 result site (idem)
    }
    _require(valid[kind], 'invalid ST09 type/value/gate combination', off)


def _validate_flags(flags, offset):
    _require(flags & HAS_EPOCH, 'ND08 HAS_EPOCH missing', offset)
    _require(not flags & ~KNOWN_FLAGS, 'ND08 unknown flags', offset)


def _prevalidate(data):
    """Check declared bounds before any footer or state interpretation."""
    _require(bool(data), 'empty capture', 0)
    pos, n = 0, len(data)
    records, contexts, textures, resources = [], {}, [], []
    events, draws = [], []
    st_counts, ordinals = Counter(), {}
    previous_epoch = 0
    while pos < n:
        _require(n - pos >= 4, 'truncated record magic', pos)
        magic = struct.unpack_from('<I', data, pos)[0]
        if magic == MAGIC_ST:
            _require(n - pos >= ST_HDR.size, 'truncated ST09 record', pos)
            event = dict(zip(ST_FIELDS, ST_HDR.unpack_from(data, pos)))
            event['offset'] = pos
            _validate_event(event)
            _require(event['epoch'] > previous_epoch,
                     'duplicate or decreasing event epoch', pos)
            previous_epoch = event['epoch']
            st_counts[event['seq']] += 1
            _require(st_counts[event['seq']] <= ST_MAX_PER_FRAME,
                     'ST09 per-frame cap exceeded', pos)
            size, seq, family = ST_HDR.size, event['seq'], 'ST09'
            events.append(event)
        elif magic == ff8dump.MAGIC_TX:
            _require(n - pos >= ff8dump.TX_HDR.size, 'truncated TX07 header', pos)
            fields = ff8dump.TX_HDR.unpack_from(data, pos)
            _require(fields[1] == BUILD, 'TX07 build mismatch', pos)
            _require(n - pos >= TX_BYTES, 'truncated TX07 payload', pos)
            size, seq, family = TX_BYTES, fields[2], 'TX07'
            textures.append({'offset': pos, 'build': fields[1], 'seq': seq,
                             'clut_now': fields[3], 'vram_base': fields[4],
                             'sys_clut_base': fields[5], 'm_B7DB44': fields[6],
                             'page_probe': fields[7]})
        elif magic == ff8dump.MAGIC_TR:
            _require(n - pos >= 40, 'truncated TR08 header', pos)
            fields = struct.unpack_from('<10I', data, pos)
            _require(fields[1] == BUILD, 'TR08 build mismatch', pos)
            psz, csz = fields[8:10]
            _require(psz <= 65536 and csz <= 32768, 'TR08 count caps exceeded', pos)
            size, seq, family = 40 + psz + csz, fields[2], 'TR08'
            _require(n - pos >= size, 'truncated TR08 payload', pos)
            resources.append({'offset': pos, 'build': fields[1], 'seq': seq,
                              'texobj': fields[3], 'width': fields[4],
                              'height': fields[5], 'palette_entries': fields[6],
                              'palette_count': fields[7], 'pixel_bytes': psz,
                              'clut_bytes': csz})
        elif magic in (ff8dump.MAGIC_ND, ff8dump.MAGIC_ND8):
            _require(n - pos >= ND_HDR.size, 'truncated ND header', pos)
            _, slot, seq, ctx, _, kind, fails, psize, build = ND_HDR.unpack_from(data, pos)
            _require(build == BUILD, 'ND build mismatch', pos)
            _require(ff8dump.SLOT_MIN <= slot <= ff8dump.SLOT_MAX,
                     'ND slot outside captured range', pos)
            _require(kind in (0, 1, 2), 'unknown ND kind', pos)
            _require((kind == 2 and magic == ff8dump.MAGIC_ND8) or
                     (kind in (0, 1) and magic == ff8dump.MAGIC_ND),
                     'ND magic/kind mismatch', pos)
            _require(fails == 0, 'ND failed read', pos)
            size, family = ND_HDR.size + psize, 'ND08' if kind == 2 else 'ND07'
            _require(NODE_BYTES <= psize and size <= ND_MAX_BYTES,
                     'ND record size outside bounds', pos)
            _require(n - pos >= size, 'truncated ND payload', pos)
            end = pos + size
            contexts[pos] = ctx                 # ND header offset 12, not ST09
            if kind == 0:
                _require(psize == NODE_BYTES, 'ND kind0 payload mismatch', pos)
            elif kind == 1:
                # ff8dump.parse_dump consumes u32 prim + exactly 40 packet bytes;
                # its strict caller rejects both shorter payloads and extra bytes.
                _require(psize == NODE_BYTES + 4 + 40,
                         'ND kind1 payload mismatch (legacy expects 68)', pos)
            else:
                counts_at = pos + ND_HDR.size + NODE_BYTES
                _require(counts_at + 8 <= end, 'truncated ND08 counts', pos)
                vc, ic = struct.unpack_from('<2I', data, counts_at)
                _require(vc <= 4096 and ic <= 16384, 'ND08 count caps exceeded', pos)
                idx_bytes = ic * 2
                idx_pad = (-idx_bytes) % 4
                footer_at = counts_at + 8 + idx_bytes + idx_pad + vc * 32
                _require(footer_at + 16 <= end, 'truncated ND08 footer head', pos)
                id_count = struct.unpack_from('<I', data, footer_at + 12)[0]
                _require(id_count <= 255, 'ND08 id_count cap exceeded', pos)
                footer_bytes = FOOTER_U32 * 4 + id_count + (-id_count) % 4
                _require(footer_at + footer_bytes == end,
                         'ND08 footer/payload size mismatch', pos)
                tpage, mode, clut = struct.unpack_from('<3I', data, footer_at)
                after_ids = footer_at + 16 + id_count + (-id_count) % 4
                (dropped, tobj, window, clut_sys, ot_z, epoch, flags,
                 s0_tex, s0_dev, s0_devvt, s0_hr, st_emitted, st_lost) = \
                    struct.unpack_from('<13I', data, after_ids)
                _validate_flags(flags, pos)
                if ic:
                    indices = struct.unpack_from(f'<{ic}H', data, counts_at + 8)
                    _require(max(indices) < vc, 'ND08 out-of-range indices', pos)
                ordinal = ordinals.get(seq, 0)
                ordinals[seq] = ordinal + 1
                draws.append({'offset': pos, 'slot': slot, 'seq': seq,
                              'kind': kind, 'fails': fails, 'vcount': vc,
                              'icount': ic, 'tpage': tpage, 'mode': mode,
                              'clut': clut, 'texobj': tobj, 'epoch': epoch,
                              'flags': flags, 'ordinal': ordinal, 'build': build,
                              'stage0_texture': s0_tex, 'stage0_device': s0_dev,
                              'stage0_devvt': s0_devvt, 'stage0_hr': s0_hr,
                              'st_emitted': st_emitted, 'st_lost': st_lost})
            if kind in (0, 1):
                draws.append({'offset': pos, 'slot': slot, 'seq': seq,
                              'kind': kind, 'fails': fails, 'vcount': 0,
                              'icount': 0, 'tpage': 0, 'mode': 0, 'clut': 0,
                              'texobj': 0, 'epoch': 0, 'flags': 0,
                              'ordinal': -1, 'build': build,
                              'stage0_texture': 0, 'stage0_device': 0,
                              'stage0_devvt': 0, 'stage0_hr': 0,
                              'st_emitted': 0, 'st_lost': 0})
        else:
            raise ContractError(f'unknown record magic 0x{magic:08X} at {pos}')
        records.append({'offset': pos, 'size': size, 'seq': seq, 'family': family})
        pos += size
    return records, contexts, textures, resources, events, draws


def parse_strict(data: bytes) -> dict:
    records, contexts, textures, resources, events, draws = _prevalidate(data)
    for draw in draws:
        draw['ctx'] = contexts[draw['offset']]
    return {'build': BUILD, 'events': events, 'draws': draws,
            'frames': sorted({draw['seq'] for draw in draws}),
            'records': records, 'tx_metadata': textures,
            'tr_metadata': resources, 'st_records': len(events),
            'nd_records': len(draws), 'tx_records': len(textures),
            'tr_records': len(resources),
            'surface_not_captured': list(SURFACE_NOT_CAPTURED)}


def _unseen():
    return {'status': 'unseen', 'value': None}


def _observed(event):
    return {'status': 'observed', 'value': event['value'],
            'epoch': event['epoch'], 'seq': event['seq'], 'offset': event['offset']}


def _stage0_status(event):
    """kind9 aux is the raw HRESULT: 0 is an applied witness, nothing more."""
    return 'applied_witness' if event['aux'] == 0 else 'requested_failed'


def _raw_snapshot(events):
    """Global observations only. Tokens/pointers remain raw, never dereferenced."""
    state = {'rs_raw': {typ: _unseen() for typ in range(26)},
             'blend_raw': _unseen(), 'target_raw': _unseen(),
             'commit_calls': [], 'setup_gates': [], 'scene_markers': [],
             'stage0_requests': [], 'stage0_results': []}
    for event in events:
        kind = event['kind']
        if kind == 5:
            state = _raw_snapshot([])           # init/uninit purge observations
        elif kind == 1:
            state['rs_raw'][event['type']] = _observed(event)
        elif kind in (3, 4):
            state['blend_raw' if kind == 3 else 'target_raw'] = _observed(event)
        elif kind in (2, 6):
            # aux = raw native forward return: a candidate witness, never a
            # device success (the COM-internal HRESULT stays unreachable).
            call = {'epoch': event['epoch'], 'offset': event['offset'],
                    'slot': event['type'], 'token': event['value'],
                    'ctx_token': event['ctx_token'],
                    'device_token': event['device_token'],
                    'result_raw': event['aux'],
                    'status': 'commit_result_observed',
                    'committed': 'result_raw', 'applied': 'unavailable'}
            state['commit_calls' if kind == 2 else 'setup_gates'].append(call)
        elif kind == 7:
            state['scene_markers'].append({'epoch': event['epoch'],
                                           'offset': event['offset'],
                                           'slot': event['type']})
        elif kind == 8:
            state['stage0_requests'].append(
                {'epoch': event['epoch'], 'offset': event['offset'],
                 'site': event['type'], 'texture': event['value'],
                 'stage': event['aux'], 'device': event['ctx_token'],
                 'devvt': event['device_token'], 'status': 'requested'})
        elif kind == 9:
            state['stage0_results'].append(
                {'epoch': event['epoch'], 'offset': event['offset'],
                 'site': event['type'], 'texture': event['value'],
                 'hr': event['aux'], 'device': event['ctx_token'],
                 'devvt': event['device_token'], 'status': _stage0_status(event)})
    for request in state['stage0_requests']:
        answered = any(result['offset'] > request['offset'] and
                       result['texture'] == request['texture'] and
                       result['device'] == request['device']
                       for result in state['stage0_results'])
        if not answered:
            request['status'] = 'requested_no_result'
    return state


def _stage0_binding(draw, prefix_events, epoch):
    """Footer triple <-> kind9 association. bit1=0: the triple is NOT trusted."""
    if not draw['flags'] & STAGE0_VALID:
        return {'status': 'unavailable', 'texture': None, 'device': None,
                'devvt': None, 'hr': None}
    texture, device = draw['stage0_texture'], draw['stage0_device']
    matches = [event for event in prefix_events
               if event['kind'] == 9 and event['epoch'] <= epoch and
               event['offset'] < draw['offset'] and
               event['value'] == texture and event['ctx_token'] == device]
    if not matches:
        # Writer-cache triple without a matching captured result: incomplete.
        return {'status': 'footer_unmatched', 'texture': texture,
                'device': device, 'devvt': draw['stage0_devvt'],
                'hr': draw['stage0_hr']}
    result = matches[-1]
    return {'status': _stage0_status(result), 'texture': texture,
            'device': device, 'devvt': result['device_token'],
            'hr': result['aux'], 'epoch': result['epoch'],
            'offset': result['offset']}


def _validate_replay_input(parsed):
    """Replay is public: do not trust a hand-edited parsed dictionary."""
    events = sorted(parsed['events'], key=lambda item: item['offset'])
    draws = sorted(parsed['draws'], key=lambda item: item['offset'])
    offsets, ordinals, counts = set(), set(), Counter()
    previous_epoch = 0
    for event in events:
        _validate_event(event)
        _require(event['epoch'] > previous_epoch,
                 'duplicate or decreasing event epoch', event['offset'])
        previous_epoch = event['epoch']
        counts[event['seq']] += 1
        _require(counts[event['seq']] <= ST_MAX_PER_FRAME,
                 'ST09 per-frame cap exceeded', event['offset'])
    for item in events + draws:
        _require(type(item['offset']) is int and item['offset'] >= 0 and
                 item['offset'] not in offsets,
                 'invalid or duplicate record offset', item['offset'])
        offsets.add(item['offset'])
    for draw in draws:
        for field in ('build', 'seq', 'kind', 'fails', 'ctx', 'epoch', 'flags',
                      'stage0_texture', 'stage0_device', 'stage0_devvt',
                      'stage0_hr', 'st_emitted', 'st_lost'):
            _require(type(draw.get(field)) is int and 0 <= draw[field] <= 0xFFFFFFFF,
                     f'invalid ND u32 {field}', draw['offset'])
        _require(draw['build'] == BUILD and draw['kind'] in (0, 1, 2),
                 'invalid ND replay record', draw['offset'])
        _require(draw['fails'] == 0, 'ND failed read', draw['offset'])
        if draw['kind'] == 2:
            _validate_flags(draw['flags'], draw['offset'])
            _require(0 <= draw['epoch'] <= 0xFFFFFFFF,
                     'invalid draw epoch', draw['offset'])
            key = (draw['seq'], draw['ordinal'])
            _require(type(draw['ordinal']) is int and draw['ordinal'] >= 0 and
                     key not in ordinals,
                     'duplicate or invalid draw ordinal', draw['offset'])
            ordinals.add(key)
    return events, draws


def replay_strict(parsed: dict) -> dict:
    events, draws = _validate_replay_input(parsed)
    stream = sorted([(event['offset'], 'event', event) for event in events] +
                    [(draw['offset'], 'draw', draw) for draw in draws])
    sticky, prefix, output, invalidations = set(), [], [], []
    st_counts = Counter()
    previous_epoch, previous_ctx, have_ctx, context_barrier = 0, None, False, -1
    for offset, family, item in stream:
        if family == 'event':
            if item['epoch'] != previous_epoch + 1:
                sticky.add('epoch_gap')          # first epoch >1 is also a hole
            previous_epoch = item['epoch']
            st_counts[item['seq']] += 1
            if st_counts[item['seq']] == ST_MAX_PER_FRAME:
                # v15 flags bit2 also covers cap/overflow; the reader keeps the
                # sticky ambiguity: the dropped events themselves are never seen.
                sticky.add('cap_ambiguity')
            if item['kind'] == 5:
                invalidations.append({'reason': 'init_uninit_observed',
                                      'offset': offset, 'epoch': item['epoch'],
                                      'slot': item['type'],
                                      'device_reset_loss_coverage': 'unavailable'})
            prefix.append(item)
            continue
        draw = item
        local = set()
        if have_ctx and draw['ctx'] != previous_ctx:
            context_barrier = offset
            local.add('draw_context_change')
            invalidations.append({'reason': 'draw_context_change', 'offset': offset,
                                  'previous_ctx': previous_ctx, 'ctx': draw['ctx'],
                                  'event_invalidation_captured': False})
        previous_ctx, have_ctx = draw['ctx'], True
        epoch = draw['epoch'] if draw['kind'] == 2 else 0
        if draw['kind'] == 2 and draw['flags'] & INCOMPLETE:
            sticky.add('writer_incomplete')
        if draw['kind'] == 2 and draw['flags'] & ST_LOSS:
            # bit3: >=1 emission refusal this frame (footer st_lost). Sticky:
            # no later RS/frame can prove the lost events were state-irrelevant.
            sticky.add('st_loss_frame')
        eligible = [event for event in prefix if event['epoch'] <= epoch]
        if epoch and not any(event['epoch'] == epoch for event in eligible):
            sticky.add('footer_reference_unseen')
        if any(event['offset'] > offset and event['epoch'] <= epoch for event in events):
            # A footer cannot reference an event which has not been written yet.
            sticky.add('footer_contradiction')
        cache_events = [event for event in eligible if event['offset'] > context_barrier]
        raw = _raw_snapshot(cache_events)
        missing = list(MISSING_FIELDS)
        if raw['blend_raw']['status'] == 'unseen':
            missing.append('blend_raw')
        if raw['target_raw']['status'] == 'unseen':
            missing.append('target_raw')
        state = dict(draw)
        state.update(
            context_association='unavailable', association_valid=False,
            incomplete=True, missing_fields=missing,
            reasons=sorted(sticky | local | {'event_context_identity_unavailable'}),
            persistent_reasons=sorted(sticky),
            epoch_status='observed' if epoch and any(event['epoch'] == epoch
                                                     for event in eligible) else 'unseen',
            global_requested_unattributed=raw,
            applied_state={'status': 'unavailable', 'value': None},
            stage0_binding=_stage0_binding(draw, prefix, epoch),
        )
        output.append(state)
    return {'draws': output, 'events': events, 'incomplete': True,
            'context_association': 'unavailable', 'association_valid': False,
            'missing_fields': list(MISSING_FIELDS),
            'persistent_reasons': sorted(sticky), 'observed_invalidations': invalidations,
            'reanchor_available': False, 'surface_not_captured': list(SURFACE_NOT_CAPTURED)}


def audit_bytes(data: bytes) -> dict:
    result = {'sha256': hashlib.sha256(data).hexdigest(), 'byte_count': len(data)}
    try:
        parsed = parse_strict(data)
        replay = replay_strict(parsed)
    except ContractError as exc:
        return dict(result, accepted=False, error=str(exc))
    result.update(replay)
    result.update(accepted=True, build=BUILD, frames=parsed['frames'],
                  counters={key: parsed[key] for key in
                            ('st_records', 'nd_records', 'tx_records', 'tr_records')},
                  tx_metadata=parsed['tx_metadata'], tr_metadata=parsed['tr_metadata'])
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('capture', type=Path)
    parser.add_argument('--out', type=Path)
    args = parser.parse_args(argv)
    try:
        result = audit_bytes(args.capture.read_bytes())
        text = json.dumps(result, indent=2, sort_keys=True) + '\n'
        if args.out:
            args.out.write_text(text, encoding='utf-8')
        else:
            print(text, end='')
    except OSError as exc:
        parser.exit(2, f'{exc}\n')
    return 0 if result['accepted'] else 2


if __name__ == '__main__':
    raise SystemExit(main())
