#!/usr/bin/env python3
"""Lot 25 render-input loader: strict-validated captures -> ff8dump records.

decode_capture()/load_capture() run the strict parse first, then the strict
replay, and only then decode the capture into ff8dump record objects for a
re-render and tests:

- build whitelist: lot24_contract.SUPPORTED_BUILDS (0x5642/0x5643/0x5644;
  identical v15 record formats, see lot24_contract BUILD_V16/BUILD_V17).
- capture bytes are never mutated; every decoded copy is exact and is keyed
  on the offsets/sizes validated by lot24_contract.parse_strict.
- ST09 (40 B) never becomes geometry: it stays parsed-only provenance in
  parsed['events'].
- ND07/ND08 -> ff8dump.Record (own fields, original build kept; raw 24-byte
  OT node at +36; kind1 u32 prim + 40-byte packet; kind2 vc/ic then ic*2
  indices + pad4 + vc*32 FVF; ND08 footer 4I tpage/mode/clut/idc + idc u8
  ids + pad4 + 13I state words: dropped_ids, texobj, window_word,
  clut_sys_id, ot_z, state_epoch, state_flags, stage0_texture/device/devvt/
  hr, st_emitted, st_lost). No index repair, bounds are the controller's
  checks, kept raw.
- TX07 -> ff8dump.TexRecord (8 header fields minus magic + mirror 0x100000
  at +32 + 2048-byte system-CLUT row + .texwin last 8 bytes as 4H).
- TR08 -> ff8dump.TexResRecord (10I header - magic,bld,seq,texobj,w,h,
  pal_entries,pal_count,pixel_size,clut_size - then exact pixels/raw_clut
  copies).

No render state (RS/blend/depth/STP) is applied, no index repair, no live
capture, no writer, no deploy.
"""
from __future__ import annotations

import struct
from pathlib import Path

import ff8dump
import lot24_contract

SUPPORTED_BUILDS = lot24_contract.SUPPORTED_BUILDS
_TR_HDR_BYTES = 40                    # TR08 10I header
_STATE_WORDS = 13                     # ND08 footer tail u32 words
_STATE_WORDS_BYTES = _STATE_WORDS * 4
_SYS_CLUT_ROW_BYTES = 2048            # identical TX format for all builds
_TEXWIN_BYTES = 8                     # 4H origin_xy/wh appended last
_ND_KIND1_EXTRA = 4 + 40              # u32 prim + 40-byte packet


class CaptureDecodeError(lot24_contract.ContractError):
    """Decode-stage fail-closed rejection (strict-parse guarantees exhausted)."""


def _require(condition, reason, offset):
    if not condition:
        raise CaptureDecodeError(f'{reason} at {offset}')


def _provenance(family, off, size, **regions):
    base = {'family': family, 'record_offset': off, 'record_size': size}
    base.update(regions)
    return base


def _decode_tx(data, off, size):
    """TX07: 8I header, 0x100000 VRAM mirror, 2048-byte sys CLUT, TEXWIN 4H."""
    _require(size == lot24_contract.TX_BYTES, 'TX07 size mismatch', off)
    (_magic, build, seq, clut_now, vram_base, sys_clut_base, m_b7,
     page_probe) = ff8dump.TX_HDR.unpack_from(data, off)
    mirror_at = off + ff8dump.TX_HDR.size
    sysclut_at = mirror_at + ff8dump.TX_VRAM_BYTES
    texwin_at = sysclut_at + _SYS_CLUT_ROW_BYTES
    _require(texwin_at + _TEXWIN_BYTES == off + size,
             'TX07 payload layout mismatch', off)
    rec = ff8dump.TexRecord(
        offset=off, build=build, seq=seq, clut_now=clut_now,
        vram_base=vram_base, sys_clut_base=sys_clut_base, m_B7DB44=m_b7,
        page_probe=page_probe,
        mirror=data[mirror_at:mirror_at + ff8dump.TX_VRAM_BYTES],
        sys_clut_row=data[sysclut_at:sysclut_at + _SYS_CLUT_ROW_BYTES],
    )
    rec.texwin = struct.unpack_from('<4H', data, texwin_at)
    rec.provenance = _provenance(
        'TX07', off, size, mirror_offset=mirror_at,
        mirror_size=ff8dump.TX_VRAM_BYTES, sys_clut_offset=sysclut_at,
        sys_clut_row_bytes=_SYS_CLUT_ROW_BYTES, texwin_offset=texwin_at,
        texwin_bytes=_TEXWIN_BYTES)
    return rec


def _decode_tr(data, off, size):
    """TR08: 10I header then exact pixels / raw_clut copies."""
    (_magic, build, seq, texobj, w, h, pal_entries, pal_count, psz,
     csz) = struct.unpack_from('<10I', data, off)
    _require(size == _TR_HDR_BYTES + psz + csz, 'TR08 size mismatch', off)
    pixels_at = off + _TR_HDR_BYTES
    clut_at = pixels_at + psz
    rec = ff8dump.TexResRecord(
        offset=off, build=build, seq=seq, texobj=texobj, w=w, h=h,
        pal_entries=pal_entries, pal_count=pal_count,
        pixels=data[pixels_at:clut_at],
        raw_clut=data[clut_at:off + size],
    )
    rec.provenance = _provenance(
        'TR08', off, size, pixels_offset=pixels_at, pixel_bytes=psz,
        raw_clut_offset=clut_at, clut_bytes=csz)
    return rec


def _decode_nd(data, off, size, family):
    """ND07/ND08: 9I header, node24 at +36, own geometry, footer state words.

    Bounds come from the controller checks (lot24_contract pre-validation:
    kind caps, id_count cap, index bounds, footer arithmetic). The loader
    only re-derives the layout it slices and fails closed on any drift.
    """
    (_magic, slot, seq, ctx, node_addr, kind, fails, psize,
     build) = ff8dump.HDR.unpack_from(data, off)
    _require(size == ff8dump.HDR.size + psize, 'ND size mismatch', off)
    _require((family == 'ND08') == (kind == 2), 'ND family/kind mismatch', off)
    _require(fails == 0, 'ND failed read', off)
    node_at = off + ff8dump.HDR.size
    node = data[node_at:node_at + ff8dump.NODE_SIZE]
    _require(len(node) == ff8dump.NODE_SIZE, 'ND truncated node', off)
    rec = ff8dump.Record(offset=off, slot=slot, seq=seq, ctx=ctx,
                         node_addr=node_addr, geom_kind=kind, fails=fails,
                         node=node, build=build)
    counts_at = node_at + ff8dump.NODE_SIZE
    provenance = {'family': family, 'record_offset': off,
                  'record_size': size, 'node_offset': node_at,
                  'node_bytes': ff8dump.NODE_SIZE}
    if kind == 0:
        # node-only record: the 24-byte node *is* the payload, no geometry
        _require(size == ff8dump.HDR.size + ff8dump.NODE_SIZE,
                 'ND kind0 payload mismatch', off)
    elif kind == 1:
        _require(size == counts_at - off + _ND_KIND1_EXTRA,
                 'ND kind1 payload mismatch', off)
        prim_at = counts_at
        packet_at = prim_at + 4
        rec.prim = struct.unpack_from('<I', data, prim_at)[0]
        rec.packet = data[packet_at:packet_at + 40]
        provenance.update(prim_offset=prim_at, packet_offset=packet_at)
    else:
        vc, ic = struct.unpack_from('<2I', data, counts_at)
        idx_at = counts_at + 8
        idx_bytes = ic * 2
        idx_pad = (-idx_bytes) % 4
        fvf_at = idx_at + idx_bytes + idx_pad
        fvf_bytes = vc * ff8dump.VERT.size
        footer_at = fvf_at + fvf_bytes
        _require(footer_at + 16 <= off + size, 'ND08 footer head missing', off)
        tpage, mode, clut, id_count = struct.unpack_from('<4I', data,
                                                         footer_at)
        _require(id_count <= 255, 'ND08 id_count cap exceeded', off)
        ids_at = footer_at + 16
        ids_pad = (-id_count) % 4
        after_ids = ids_at + id_count + ids_pad
        _require(after_ids + _STATE_WORDS_BYTES == off + size,
                 'ND08 footer layout mismatch', off)
        rec.vcount, rec.icount = vc, ic
        rec.indices = data[idx_at:idx_at + idx_bytes]       # raw, no repair
        rec.fvf = data[fvf_at:footer_at]                    # raw FVF blob
        rec.idx_repaired = False
        rec.tpage, rec.mode, rec.clut = tpage, mode, clut
        rec.id_count = id_count
        rec.ids = data[ids_at:ids_at + id_count]            # raw u8 ids
        (dropped, texobj, window_word, clut_sys_id, ot_z, state_epoch,
         state_flags, stage0_tex, stage0_dev, stage0_devvt, stage0_hr,
         st_emitted, st_lost) = struct.unpack_from(f'<{_STATE_WORDS}I', data,
                                                   after_ids)
        rec.dropped_ids = dropped
        rec.texobj = texobj
        rec.window_word = window_word
        rec.clut_sys_id = clut_sys_id
        rec.ot_z = ot_z
        rec.state_epoch = state_epoch
        rec.state_flags = state_flags
        rec.stage0_texture = stage0_tex
        rec.stage0_device = stage0_dev
        rec.stage0_devvt = stage0_devvt
        rec.stage0_hr = stage0_hr
        rec.st_emitted = st_emitted
        rec.st_lost = st_lost
        provenance.update(counts_offset=counts_at, indices_offset=idx_at,
                          indices_bytes=idx_bytes, fvf_offset=fvf_at,
                          fvf_bytes=fvf_bytes, footer_offset=footer_at,
                          tpage_mode_clut_offset=footer_at, ids_offset=ids_at,
                          ids_bytes=id_count,
                          state_words_offset=after_ids,
                          state_words=_STATE_WORDS)
    rec.provenance = provenance
    return rec


def decode_capture(data: bytes, *, build: int) -> dict:
    """Strict parse + strict replay first, then decode validated records.

    Returns {'data', 'build', 'records', 'mirrors', 'resources', 'parsed',
    'replay'}: records = decoded ND geometry ff8dump.Record objects in stream
    order (ND only); mirrors/resources = ff8dump.TexRecord/TexResRecord
    lists; ST09 stays in parsed['events'] (parsed-only provenance, no
    geometry is ever built from it). The capture bytes are returned as-is,
    never mutated.
    """
    parsed = lot24_contract.parse_strict(data, build=build)
    replay = lot24_contract.replay_strict(parsed)
    records, mirrors, resources = [], [], []
    for entry in parsed['records']:
        off, size, family = entry['offset'], entry['size'], entry['family']
        if family == 'ST09':
            continue          # ST stays parsed for provenance, not geometry
        if family == 'TX07':
            mirrors.append(_decode_tx(data, off, size))
        elif family == 'TR08':
            resources.append(_decode_tr(data, off, size))
        elif family in ('ND07', 'ND08'):
            records.append(_decode_nd(data, off, size, family))
        else:
            _require(False, 'unknown record family', off)
    return {'data': data, 'build': parsed['build'], 'records': records,
            'mirrors': mirrors, 'resources': resources, 'parsed': parsed,
            'replay': replay}


def load_capture(path, *, build: int) -> dict:
    """Read a capture file and decode it (see decode_capture)."""
    return decode_capture(Path(path).read_bytes(), build=build)
