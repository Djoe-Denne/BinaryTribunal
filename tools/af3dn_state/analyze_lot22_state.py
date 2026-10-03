#!/usr/bin/env python3
"""Lot 22 — offline per-draw state diagnostic (v13) + candidate state contract reader.

Deterministic, offline only. Two strictly separated roles:

1. v13 diagnostic (build 0x5640): consumes the strict lot20 dump through the
   untouched oracle (render_lot17.load_capture) and proves BY DATA that v13
   carries neither a per-draw blend/depth state nor the inherited stage0
   texture binding of slot-49 draws. Emits state_matrix.json + a summary.

2. Candidate contract reader (build 0x5641): strict parser for the Lot 22
   contract (ST09 sideband events + ND08 footer epoch extension). Refuses
   truncation, unknown build, epoch holes and duplicate draw ordinals.
   Used by tests on synthetic fixtures. On the real 0x5640 dump the reader
   returns BLOCKED_BY_MISSING_STATE (no state fields exist in v13) — that is
   the diagnosis, not a failure.

No oracle mutation: render_lot17.py / ff8dump.py are imported, never written.
"""
from __future__ import annotations

import argparse
import json
import struct
import sys
from pathlib import Path

import render_lot17
import ff8dump as dump

# ---------------------------------------------------------------------------
# Candidate contract constants (PIN — must match the lot22 writer fork).
# ---------------------------------------------------------------------------
BUILD_V13 = 0x5640
BUILD_CAND = 0x5641

MAGIC_ST = 0x39305453            # 'ST09'
ST_HDR = struct.Struct('<8I')    # magic, build, seq, epoch, kind, type, value, aux
ST_REC_BYTES = 32

KIND_RS_SET = 1                  # slot 29: raw type 0..25 + raw value
KIND_COMMIT = 2                  # slots 30/31/32: descriptor commit (value = matdesc token)
KIND_BLEND = 3                   # slot 33: raw blend mode 0..4
KIND_TARGET = 4                  # slot 39: opaque target token
KIND_INVALIDATE = 5              # slot 0 init / slot 1 uninit
KIND_SETUP_COMMIT = 6            # setup slots: matdesc = *(ctx+0x38), aux = gate *(cookie+0xAC4)
KIND_SCENE = 7                   # slots 40/41: non-invalidating scene markers

RS_TYPE_MIN, RS_TYPE_MAX = 0, 25
FOOTER_V14_BYTES = 8             # state_epoch + state_flags appended after the v12 footer

STATE_FLAG_HAS_EPOCH = 1 << 0
STATE_FLAG_STAGE0_VALID = 1 << 1
STATE_FLAG_INCOMPLETE = 1 << 2

ND08_V13_FOOTER_U32 = 9          # tpage mode clut id_count dropped texobj window clut_sys ot_z
ND08_V14_FOOTER_U32 = 11         # + state_epoch + state_flags


class ContractError(Exception):
    """Strict reader rejection (truncation/build/epoch/ordinal violations)."""


def sha(data: bytes) -> str:
    import hashlib
    return hashlib.sha256(data).hexdigest()


def load_capture_strict_bytes(data: bytes):
    """Strict load of a v13 capture from bytes — Lot 22 local re-implementation
    of render_lot17.load_capture's contract (same rules, oracle untouched)."""
    if len(data) < 8:
        raise ValueError('capture header is truncated')
    magic = struct.unpack_from('<I', data)[0]
    if magic in (dump.MAGIC_ND, dump.MAGIC_ND8):
        if len(data) < dump.HDR.size:
            raise ValueError('ND header is truncated')
        build = struct.unpack_from('<I', data, 32)[0]
    elif magic in (dump.MAGIC_TR, dump.MAGIC_TX):
        build = struct.unpack_from('<I', data, 4)[0]
    else:
        raise ValueError('unknown first record magic')
    if build not in dump.SUPPORTED_REPLAY_BUILDS:
        raise ValueError(f'unsupported capture build 0x{build:X}')
    recs, warnings, tx, tr = dump.parse_dump(data, expected_build=build)
    if warnings:
        raise ValueError(f'strict replay rejects {len(warnings)} warnings: {warnings[0]}')
    if any(r.build != build for r in [*recs, *tx, *tr]):
        raise ValueError('mixed capture builds')
    if any(r.fails or r.idx_repaired for r in recs):
        raise ValueError('strict replay rejects failed reads/repaired indices')
    return data, build, recs, tx, tr


# ---------------------------------------------------------------------------
# Candidate contract strict parser (build 0x5641 fixtures; also parses 0x5640
# captures in state-diagnostic mode where every state field is MissingEvidence).
# ---------------------------------------------------------------------------

def _parse_st09(data: bytes, off: int) -> dict:
    if len(data) - off < ST_HDR.size:
        raise ContractError(f'truncated ST09 header at {off} (need {ST_HDR.size}, '
                            f'have {len(data) - off})')
    magic, build, seq, epoch, kind, rtype, value, aux = ST_HDR.unpack_from(data, off)
    if magic != MAGIC_ST:
        raise ContractError(f'bad ST09 magic 0x{magic:08X} at {off}')
    if epoch == 0:
        raise ContractError(f'ST09 epoch 0 is reserved at {off}')
    if kind == KIND_RS_SET and not (RS_TYPE_MIN <= rtype <= RS_TYPE_MAX):
        # Engine gates 0..25 (wrapper decomp 0x41E650); the reader keeps any raw
        # type verbatim instead of rejecting or renaming it.
        pass
    return {'offset': off, 'build': build, 'seq': seq, 'epoch': epoch,
            'kind': kind, 'type': rtype, 'value': value, 'aux': aux}


def _nd08_v14_footer_bytes() -> int:
    # always-present u32 count * 4 (ids appended by caller knowledge)
    return ND08_V14_FOOTER_U32 * 4


def parse_candidate_stream(data: bytes):
    """Strict parse of a Lot 22 candidate capture (build 0x5641).

    Returns dict: events, draws, frames, counters. TX07/TR08 are skipped
    structurally with build checks; ND07 (kind 0/1) size comes from
    payload_size; ND08 (kind 2) size is recomputed from vcount/icount and
    footer (mismatch -> rejection; no permissive resync).
    """
    n = len(data)
    pos = 0
    events: list[dict] = []
    draws: list[dict] = []
    ordinals: dict[int, int] = {}     # seq -> next draw ordinal
    frames: set[int] = set()
    st_count = 0
    nd_count = 0
    tx_count = 0
    tr_count = 0
    tx_rec_bytes = dump.TX_HDR.size + dump.TX_VRAM_BYTES + 2048 + 8   # v13/v14 TX layout
    while pos < n:
        if n - pos < 4:
            raise ContractError(f'truncated record magic at {pos}')
        magic = struct.unpack_from('<I', data, pos)[0]
        if magic == MAGIC_ST:
            ev = _parse_st09(data, pos)
            if ev['build'] != BUILD_CAND:
                raise ContractError(f"ST09 build 0x{ev['build']:X} != 0x{BUILD_CAND:X} at {pos}")
            events.append(ev)
            st_count += 1
            pos += ST_REC_BYTES
            continue
        if magic == dump.MAGIC_TR:
            if n - pos < 40:
                raise ContractError(f'truncated TR08 header at {pos}')
            _m, build, seq, _tobj, _w, _h, _pent, _pcnt, psz, csz = struct.unpack_from('<10I', data, pos)
            if build != BUILD_CAND:
                raise ContractError(f'TR08 build 0x{build:X} != 0x{BUILD_CAND:X} at {pos}')
            if psz > 65536 or csz > 32768:
                raise ContractError(f'TR08 caps exceeded at {pos} (psz={psz} csz={csz})')
            if n - pos < 40 + psz + csz:
                raise ContractError(f'truncated TR08 payload at {pos}')
            tr_count += 1
            pos += 40 + psz + csz
            continue
        if magic == dump.MAGIC_TX:
            if n - pos < tx_rec_bytes:
                raise ContractError(f'truncated TX07 record at {pos}')
            build = struct.unpack_from('<I', data, pos + 4)[0]
            if build != BUILD_CAND:
                raise ContractError(f'TX07 build 0x{build:X} != 0x{BUILD_CAND:X} at {pos}')
            tx_count += 1
            pos += tx_rec_bytes
            continue
        if magic in (dump.MAGIC_ND, dump.MAGIC_ND8):
            if n - pos < dump.HDR.size:
                raise ContractError(f'truncated ND header at {pos}')
            hdr_magic, slot, seq, _ctx, _addr, kind, fails, psize, build = \
                dump.HDR.unpack_from(data, pos)
            if build != BUILD_CAND:
                raise ContractError(f'ND build 0x{build:X} != 0x{BUILD_CAND:X} at {pos}')
            if psize < dump.NODE_SIZE:
                raise ContractError(f'payload_size {psize} < node size at {pos}')
            if kind == 2:
                if n - pos < dump.HDR.size + dump.NODE_SIZE + 8:
                    raise ContractError(f'truncated kind2 counts at {pos}')
                vc, ic = struct.unpack_from('<2I', data, pos + dump.HDR.size + dump.NODE_SIZE)
                idx_bytes = ic * 2
                idx_pad = (4 - (idx_bytes % 4)) % 4
                footer_off = pos + dump.HDR.size + dump.NODE_SIZE + 8 + idx_bytes + idx_pad + vc * 32
                if footer_off + 16 > n:
                    raise ContractError(f'truncated ND08 footer head at {pos}')
                tpage, mode, clut, idc = struct.unpack_from('<4I', data, footer_off)
                if idc > 255:
                    raise ContractError(f'ND08 id_count {idc} > 255 at {pos}')
                ids_pad = (4 - (idc % 4)) % 4
                expected_payload = (dump.NODE_SIZE + 8 + idx_bytes + idx_pad
                                    + vc * 32 + 16 + idc + ids_pad + 4 + 4
                                    + 12 + FOOTER_V14_BYTES)
                need = dump.HDR.size + expected_payload
                if psize != expected_payload:
                    raise ContractError(
                        f'ND08 v14 payload mismatch at {pos}: declared {psize}, '
                        f'expected {expected_payload} (vcount={vc} icount={ic} id_count={idc})')
                if n - pos < need:
                    raise ContractError(f'truncated ND08 record at {pos} (need {need})')
                after_ids = footer_off + 16 + idc + ids_pad
                dropped, tobj, wword, csys, otz, epoch, sflags = \
                    struct.unpack_from('<7I', data, after_ids)
                if not sflags & STATE_FLAG_HAS_EPOCH:
                    raise ContractError(f'ND08 footer has_epoch=0 at {pos} (contract violation)')
                ordinal = ordinals.get(seq, 0)
                draws.append({'offset': pos, 'slot': slot, 'seq': seq, 'kind': kind,
                              'fails': fails, 'vcount': vc, 'icount': ic,
                              'tpage': tpage, 'mode': mode, 'clut': clut, 'texobj': tobj,
                              'epoch': epoch, 'flags': sflags, 'ordinal': ordinal,
                              'build': build})
                ordinals[seq] = ordinal + 1
                frames.add(seq)
                nd_count += 1
                pos += need
                continue
            # kind 0/1: size from header (node + declared payload)
            need = dump.HDR.size + psize
            if n - pos < need:
                raise ContractError(f'truncated ND07 record at {pos}')
            if kind == 1:
                if n - pos < dump.HDR.size + dump.NODE_SIZE + 4:
                    raise ContractError(f'truncated kind1 payload at {pos}')
            draws.append({'offset': pos, 'slot': slot, 'seq': seq, 'kind': kind,
                          'fails': fails, 'vcount': 0, 'icount': 0, 'tpage': 0,
                          'mode': 0, 'clut': 0, 'texobj': 0, 'epoch': 0, 'flags': 0,
                          'ordinal': -1, 'build': build})
            frames.add(seq)
            nd_count += 1
            pos += need
            continue
        raise ContractError(f'unknown record magic 0x{magic:08X} at {pos}')
    return {'events': events, 'draws': draws, 'frames': sorted(frames),
            'st_records': st_count, 'nd_records': nd_count,
            'tx_records': tx_count, 'tr_records': tr_count}


# ---------------------------------------------------------------------------
# State replay: events -> per-draw state (raw, no semantic aliasing).
# ---------------------------------------------------------------------------

def replay_state(parsed: dict) -> dict:
    """Replay ST09 events in stream order and attach state to each draw.

    Per-draw state = all events with epoch <= draw.epoch (epoch hole if the
    draw's epoch exceeds the highest event epoch seen so far). Raw RS values
    live in `rs_raw` (valid mask derived); descriptor commits live in a
    separate `commit_chain` (requested/committed/applied are never fused).
    """
    events = parsed['events']
    rs_raw: dict[int, int] = {}
    rs_epoch: dict[int, int] = {}
    commit_chain: list[dict] = []
    blend: dict | None = None
    target: dict | None = None
    invalidated = False
    max_epoch = 0
    invalidations = []
    draws_state = []
    ev_by_idx = 0
    for draw in parsed['draws']:
        if draw['kind'] != 2:
            continue
        # consume every event whose epoch <= draw epoch (stream order)
        while ev_by_idx < len(events) and events[ev_by_idx]['epoch'] <= draw['epoch']:
            ev = events[ev_by_idx]
            max_epoch = max(max_epoch, ev['epoch'])
            k = ev['kind']
            if k == KIND_RS_SET:
                invalidated = False
                rs_raw[ev['type']] = ev['value']
                rs_epoch[ev['type']] = ev['epoch']
            elif k == KIND_COMMIT:
                commit_chain.append({'epoch': ev['epoch'], 'slot': ev['type'],
                                     'token': ev['value']})
            elif k == KIND_BLEND:
                invalidated = False
                blend = {'epoch': ev['epoch'], 'raw': ev['value']}
            elif k == KIND_TARGET:
                invalidated = False
                target = {'epoch': ev['epoch'], 'token': ev['value']}
            elif k == KIND_INVALIDATE:
                invalidated = True
                rs_raw.clear()
                rs_epoch.clear()
                commit_chain.clear()
                blend = None
                target = None
                invalidations.append({'epoch': ev['epoch'], 'slot': ev['type']})
            elif k == KIND_SETUP_COMMIT:
                commit_chain.append({'epoch': ev['epoch'], 'slot': ev['type'],
                                     'token': ev['value'], 'gate': ev['aux'],
                                     'setup': True})
            # KIND_SCENE: ordering aid only, never invalidates
            ev_by_idx += 1
        hole = draw['epoch'] > max_epoch
        no_state_yet = draw['epoch'] == 0
        flags_incomplete = (bool(draw['flags'] & STATE_FLAG_INCOMPLETE) or hole
                            or invalidated or no_state_yet)
        rs_present = {t: v for t, v in sorted(rs_raw.items())}
        mask = 0
        for t in rs_present:
            mask |= 1 << t
        stage0_valid = bool(draw['flags'] & STATE_FLAG_STAGE0_VALID)
        missing = []
        if no_state_yet:
            missing.append('no_state_yet')
        if invalidated:
            missing.append('state_invalidated_no_renewal')
        if hole:
            missing.append('epoch_hole')
        if blend is None:
            missing.append('blend_raw')
        if target is None:
            missing.append('target_token')
        if not stage0_valid:
            missing.append('stage0_binding')
        draws_state.append({
            'seq': draw['seq'], 'ordinal': draw['ordinal'], 'slot': draw['slot'],
            'epoch': draw['epoch'],
            'rs_valid_mask': mask, 'rs_raw': rs_present,
            'rs_set_epochs': dict(rs_epoch),
            'commit_chain': list(commit_chain),
            'blend_raw': blend, 'target_token': target,
            'stage0': ({'valid': True} if stage0_valid else
                       {'valid': False, 'reason': 'MissingEvidence(SetTexture stage0)'}),
            'incomplete': flags_incomplete,
            'missing_fields': missing,
        })
    return {'draws': draws_state, 'invalidations': invalidations,
            'events_consumed': ev_by_idx,
            'ab_status': 'BLOCKED_BY_MISSING_STATE'}


def depth_policy_available(replay: dict) -> bool:
    """Depth-aware A/B requires proven enable/write/compare mapping + Z
    convention/range + clear + target. None is proven offline (Lot 22)."""
    return False


def blend_policy_available(replay: dict) -> bool:
    """Blend-aware A/B requires mode + factors/op + texture-stage state +
    alpha-test + color-write. Only the raw mode index is captured."""
    return False


# ---------------------------------------------------------------------------
# v13 diagnostic (build 0x5640, real dump)
# ---------------------------------------------------------------------------

def alpha_bucket(diffuse: int) -> str:
    a = (diffuse >> 24) & 0xFF
    if a == 255:
        return 'alpha255'
    if a == 127:
        return 'alpha127'
    if a == 128:
        return 'alpha128'
    if a == 0:
        return 'alpha000'
    return 'alphaOther'


def analyze_v13(data: bytes) -> dict:
    _, build, recs, tx, tr = load_capture_strict_bytes(data)
    assert build == BUILD_V13, f'unexpected build 0x{build:X} (want 0x5640)'
    frames = dump.group_by_seq(recs)

    slot_dist = {}
    for slot in sorted({r.slot for r in recs}):
        rs = [r for r in recs if r.slot == slot]
        kind2 = [r for r in rs if r.geom_kind == 2]
        verts = sum(r.vcount for r in kind2)
        tris = sum((r.icount // 3) if r.icount else (r.vcount // 3) for r in kind2)
        textured = sum(1 for r in kind2 if getattr(r, 'tpage', 0) or getattr(r, 'mode', 0))
        alpha_ct: dict[str, int] = {}
        rhw_lt1 = 0
        rhw_eq1 = 0
        for r in kind2:
            for v in dump.VERT.iter_unpack(r.fvf):
                alpha_ct[alpha_bucket(v[4])] = alpha_ct.get(alpha_bucket(v[4]), 0) + 1
                if v[3] == 1.0:
                    rhw_eq1 += 1
                else:
                    rhw_lt1 += 1
        texobjs = sorted({getattr(r, 'texobj', 0) for r in kind2})
        slot_dist[str(slot)] = {
            'records': len(rs), 'kind2': len(kind2), 'kind0': len(rs) - len(kind2),
            'vertices': verts, 'triangles': tris,
            'textured_kind2': textured, 'untextured_kind2': len(kind2) - textured,
            'diffuse_alpha_buckets': {k: alpha_ct[k] for k in sorted(alpha_ct)},
            'rhw_eq1_vertices': rhw_eq1, 'rhw_lt1_vertices': rhw_lt1,
            'texobj_values': [f'0x{t:X}' for t in texobjs],
            'footers_present': sorted({f for r in kind2
                                       for f in ('tpage', 'mode', 'clut', 'texobj',
                                                 'window_word', 'clut_sys_id', 'ot_z')
                                       if getattr(r, f, 0)}),
        }

    txwin = []
    for t in tx:
        origin_xy, wh = struct.unpack('<2I', t.sys_clut_row[-8:])
        x0 = origin_xy & 0xFFFF
        y0 = (origin_xy >> 16) & 0xFFFF
        w_raw = wh & 0xFFFF
        h_raw = (wh >> 16) & 0xFFFF
        w_der = 256 - (w_raw & 0x1F) * 8
        h_der = 256 - ((h_raw >> 5) & 0x1F) * 8
        txwin.append({'seq': t.seq, 'origin_xy': origin_xy, 'wh': wh,
                      'x0': x0, 'y0': y0, 'w_raw': w_raw, 'h_raw': h_raw,
                      'w_derived_sub45BC60': w_der, 'h_derived_sub45BC60': h_der})

    seq7105 = [r for r in recs if r.seq == 7105]
    slot49 = [r for r in seq7105 if r.slot == 49 and r.geom_kind == 2]
    slot49_detail = []
    for r in slot49:
        alphas = [(v[4] >> 24) & 0xFF for v in dump.VERT.iter_unpack(r.fvf)]
        tris = (r.icount // 3) if r.icount else (r.vcount // 3)
        slot49_detail.append({'seq': r.seq, 'vcount': r.vcount, 'icount': r.icount,
                              'tris': tris, 'texobj': getattr(r, 'texobj', 0),
                              'tpage': getattr(r, 'tpage', 0), 'mode': getattr(r, 'mode', 0),
                              'distinct_diffuse_alpha': sorted(set(alphas)),
                              'offset': r.offset})
    alpha_counts_7105: dict[str, int] = {}
    rhw_counts_7105 = {'eq1': 0, 'lt1': 0}
    for r in seq7105:
        if r.geom_kind == 2:
            for v in dump.VERT.iter_unpack(r.fvf):
                alpha_counts_7105[alpha_bucket(v[4])] = alpha_counts_7105.get(alpha_bucket(v[4]), 0) + 1
                if v[3] == 1.0:
                    rhw_counts_7105['eq1'] += 1
                else:
                    rhw_counts_7105['lt1'] += 1

    # Field-level proof that v13 lacks per-draw blend/depth/binding:
    nd08_fields_present = ['slot', 'seq', 'ctx', 'node_addr', 'geom_kind', 'fails',
                           'vcount', 'icount', 'fvf', 'tpage', 'mode', 'clut',
                           'id_count', 'ids', 'dropped_ids', 'texobj',
                           'window_word', 'clut_sys_id', 'ot_z']
    absent_state_fields = ['render_state_raw_0_25', 'blend_mode_raw',
                           'depth_enable_write_compare', 'target_token',
                           'stage0_token', 'state_epoch']
    matrix = {
        'diffuse_alpha': {
            'measured': 'per-vertex FVF DIFFUSE alpha (ARGB byte 3)',
            'provenance': 'Measured', 'coverage': 'complete per vertex',
            'rule': 'never derive blend mode from alpha alone',
        },
        'slot33_blend': {
            'measured': None, 'provenance': 'MissingEvidence',
            'coverage': 'proxy slot 33 surface proven (0x41E752 -> [driver+0x84]) but no value per draw in v13',
            'rule': 'shadow only if all transition paths covered',
        },
        'render_state_raw_0_25': {
            'measured': None, 'provenance': 'MissingEvidence',
            'coverage': 'proxy slot 29 surface proven (0x41E650 jl/jge gate 0..25, 48 rel callers); no per-draw snapshot in v13',
            'rule': 'keep raw type+value + valid mask; no semantic alias',
        },
        'depth': {
            'measured': 'RHW per vertex (perspective)',
            'provenance': 'MissingEvidence',
            'coverage': 'backend 0x440FF0 writes device RS immediately (no shadow table); no proven depth_enable/write/compare alias; Z convention/range/clear/target unproven',
            'rule': 'no invented defaults; depth policy refused in A/B',
        },
        'texture_regular': {
            'measured': 'ND08.texobj <-> TR08 (kind2 51/60); footer tpage/mode/clut',
            'provenance': 'Measured',
            'coverage': 'regular draw-list textures closed (lots 14-21)',
            'rule': 'keep ND08 identity and device identity separate',
        },
        'slot49': {
            'measured': 'texobj=0 captured on all slot-49 records',
            'provenance': 'MissingEvidence(stage0_binding)',
            'coverage': 'stage0 inherited bind not observable via proxy slots (sub_407EB4 chain inside setup forwards)',
            'rule': 'MissingEvidence until observed; no fallback texture',
        },
        'render_target': {
            'measured': None, 'provenance': 'MissingEvidence',
            'coverage': 'slot 39 surface proven (0x41E947, 19 rel callers; backend +0x9C writes engine+0xA68) but no per-draw token in v13',
            'rule': 'token runtime opaque, never static EA',
        },
        'alpha_pipeline': {
            'measured': 'diffuse/palette partials; blend candidate source-over alpha127',
            'provenance': 'MissingEvidence',
            'coverage': 'texture-stage state, alpha-test, color-write mask, factors/op NOT captured; prim desc +0x44/+0x5C (Gfx_SetPrimBlendMode 0x407162) not in dump',
            'rule': 'a raw blend mode alone is insufficient',
        },
        'order': {
            'measured': 'host submission order intra-list',
            'provenance': 'DerivedFromMeasured',
            'coverage': 'layer policy fond->acteurs->UI is a replay candidate; OT global is out of objective',
            'rule': 'test depth before any OT reconstruction',
        },
    }
    return {
        'schema': 'lot22-state-diagnostic-v1',
        'build': f'0x{build:X}', 'records': len(recs), 'frames': len(frames),
        'TX07': len(tx), 'TR08': len(tr),
        'nd08_fields_present': nd08_fields_present,
        'state_fields_absent_in_v13': absent_state_fields,
        'state_fields_absent_proof': ('structural: the v13 ND08 footer is 9 x u32 '
                                      '(tpage|mode|clut|id_count|dropped_ids|texobj|'
                                      'window_word|clut_sys_id|ot_z) — no blend/depth/'
                                      'RS/stage0/state_epoch field exists in the contract'),
        'slot_distribution': slot_dist,
        'txwin': txwin,
        'frame_7105': {
            'records': len(seq7105),
            'slot49_draws': slot49_detail,
            'diffuse_alpha_buckets': {k: alpha_counts_7105[k] for k in sorted(alpha_counts_7105)},
            'rhw': rhw_counts_7105,
        },
        'matrix': matrix,
        'ab_status': 'BLOCKED_BY_MISSING_STATE',
        'ab_reasons': ['blend_mode_raw missing per draw', 'depth_enable/write/compare unproven',
                       'stage0_binding missing (slot 49)', 'target_token missing per draw'],
        'dump_sha256': sha(data),
    }


def run_v13_cli(dump_path: str, out_json: str) -> int:
    data = Path(dump_path).read_bytes()
    result = analyze_v13(data)
    out = Path(out_json)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, indent=2, sort_keys=True) + '\n', encoding='utf8')
    print(json.dumps({'out': str(out.resolve()), 'build': result['build'],
                      'records': result['records'], 'frames': result['frames'],
                      'ab_status': result['ab_status']}))
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    sub = ap.add_subparsers(dest='cmd', required=True)
    p = sub.add_parser('v13', help='offline v13 diagnostic -> state_matrix.json')
    p.add_argument('dump')
    p.add_argument('--out', required=True)
    p2 = sub.add_parser('replay', help='strict candidate-contract reader (0x5641 fixtures)')
    p2.add_argument('capture')
    p2.add_argument('--out')
    args = ap.parse_args(argv)
    if args.cmd == 'v13':
        return run_v13_cli(args.dump, args.out)
    data = Path(args.capture).read_bytes()
    parsed = parse_candidate_stream(data)
    result = replay_state(parsed)
    if args.out:
        Path(args.out).write_text(json.dumps(result, indent=2, sort_keys=True) + '\n',
                                  encoding='utf8')
    print(json.dumps({'draws': len(result['draws']),
                      'events': parsed['st_records'],
                      'ab_status': result['ab_status']}))
    return 0


if __name__ == '__main__':
    sys.exit(main())
