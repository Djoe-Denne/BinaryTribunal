#!/usr/bin/env python3
"""FF8 battle archive reader: battle.fi/fl/fs -> payloads + LZS decompression.

Contract (verified byte-exact against docs/tech/investigation/
battle-static-discovery/c0m-registry.json; sha256 anchors c0m000/c0m090):

- battle.fl : one DOS path per line (CRLF), 853 lines; line i == archive entry i.
- battle.fi : 853 * 12 bytes; entry = {u32 uncompressed_size, u32 offset, u32 flag};
             flag 1 = LZS-compressed (779 entries), flag 0 = stored raw (74).
- battle.fs : per-entry blob layout
             flag=1: [u32 stream_len][LZS stream] then payload = lzs(stream)
             flag=0: raw bytes at [offset, offset+size)  (no 4-byte header)
             The u32 stored IN battle.fs at `offset` is the COMPRESSED stream
             length (== next_entry_offset - offset - 4, verified on all 779
             compressed entries); FI's size field is the UNCOMPRESSED payload
             size (verified byte-exact via sha256 on c0m000/c0m090).
- LZS (PSX flavor): control byte, bits LSB-first; bit=1 -> literal (1 byte),
  bit=0 -> backref: position = b0 | ((b1 & 0xF0) << 4), length = (b1 & 0x0F)+3,
  ring window 4096 bytes, write cursor starts at 4096-18, window zero-filled.
  (Differs from classic Okumura LZSS: initial window is zeros, not spaces.)

Mapping: c0mNNN.dat == FI entry with that FL leaf; c0m000.dat at FI index 234,
c0m090.dat at 322 (both sha256-verified).  The "FI 166..309" index claim is
FALSE for the FS archive (FI 166 is a0stg095.x) - see README anchor table.

CLI:
    python extract_lzs.py                    # archive hash check + anchors 0,90
    python extract_lzs.py --c0m 90,127 --write
    python extract_lzs.py --all              # all 200 c0m entries
    python extract_lzs.py --fl-index 166     # identify an arbitrary entry

LZS decode re-implemented from HobbitDur/FF8UltimateEditor FF8GameData/fs/lzs.py
(GPL-3.0) -> this file is GPL-3.0.  See README.md for full credits.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import struct
import sys
from pathlib import Path

DEFAULT_ARCHIVE_DIR = Path(
    r"C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII\Data\lang-en"
)
REGISTRY_PATH = (
    Path(__file__).resolve().parents[2]
    / "docs"
    / "tech"
    / "investigation"
    / "battle-static-discovery"
    / "c0m-registry.json"
)

N = 4096  # LZS ring window size
F = 18  # max match length
THRESHOLD = 2  # backref length = nibble + THRESHOLD + 1  (3..18)


def lzs_decode(data: bytes) -> bytes:
    """Decode one PSX LZS stream.

    Ported from HobbitDur FF8UltimateEditor FF8GameData/fs/lzs.py (GPL-3.0),
    verified byte-exact on the c0m000/c0m090 anchor payloads.
    """
    out = bytearray()
    buf = bytearray(N + F)  # ring window, zero-filled start
    r = N - F  # initial write position (FF8-specific, != Okumura's N-F spaces)
    mask = N - 1  # engine wraps at N-1, not N+F
    flags = 0  # control byte mirror: bit0..7 pending, bit8 sentinel
    pos = 0
    end = len(data)
    while pos < end:
        if (flags & 0x100) == 0:
            flags = data[pos] | 0xFF00
            pos += 1
        if pos >= end:
            break
        if flags & 1:  # literal
            byte = data[pos]
            pos += 1
            buf[r] = byte
            r = (r + 1) & mask
            out.append(byte)
        else:  # back-reference
            i = data[pos] | ((data[pos + 1] & 0xF0) << 4)
            length = (data[pos + 1] & 0x0F) + THRESHOLD
            pos += 2
            for k in range(length + 1):
                byte = buf[(i + k) & mask]
                buf[r] = byte
                r = (r + 1) & mask
                out.append(byte)
        flags >>= 1
    return bytes(out)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1 << 20), b""):
            digest.update(block)
    return digest.hexdigest()


class BattleArchive:
    """battle.fi/fl/fs loader with FI -> FL 1:1 mapping enforcement."""

    def __init__(self, archive_dir: Path | None = None) -> None:
        self.dir = archive_dir or DEFAULT_ARCHIVE_DIR
        self.fi_path = self.dir / "battle.fi"
        self.fl_path = self.dir / "battle.fl"
        self.fs_path = self.dir / "battle.fs"
        for path in (self.fi_path, self.fl_path, self.fs_path):
            if not path.is_file():
                raise FileNotFoundError(path)
        self.sha256 = {p.name: sha256_file(p) for p in (self.fi_path, self.fl_path, self.fs_path)}
        fl_text = self.fl_path.read_text(encoding="latin-1")
        # FL uses CRLF DOS lines; NUL-split finds no separate segments (single
        # 30 491-byte list), so line-splitting is the correct parse.
        self.fl_names = [
            line.strip()
            for line in fl_text.replace("\r\n", "\n").split("\n")
            if line.strip()
        ]
        fi = self.fi_path.read_bytes()
        if len(fi) != len(self.fl_names) * 12:
            raise RuntimeError(
                f"FI/FL 1:1 mismatch: {len(fi) // 12} FI entries vs {len(self.fl_names)} FL paths"
            )
        self.entries = [struct.unpack_from("<III", fi, i * 12) for i in range(len(self.fl_names))]
        self.fs = self.fs_path.read_bytes()

    def leaf(self, index: int) -> str:
        return self.fl_names[index].rsplit("\\", 1)[-1]

    def c0m_index(self, c0m_number: int) -> int | None:
        want = f"c0m{c0m_number:03d}.dat"
        for i, name in enumerate(self.fl_names):
            if self.leaf(i).lower() == want:
                return i
        return None

    def read_entry(self, index: int) -> tuple[str, bytes, dict]:
        """Return (leaf, payload, meta) for archive entry `index`."""
        size, offset, flag = self.entries[index]
        next_off = self.entries[index + 1][1] if index + 1 < len(self.entries) else len(self.fs)
        if flag == 1:
            stream_len = struct.unpack_from("<I", self.fs, offset)[0]
            blob = lzs_decode(self.fs[offset + 4 : offset + 4 + stream_len])
        elif flag == 0:
            blob = self.fs[offset : offset + size]
        else:
            raise ValueError(f"unknown FI flag {flag} at entry {index}")
        if size and len(blob) > size:
            blob = blob[:size]  # LZS output is exact in practice; raw entries may pad
        meta = {
            "fi_index": index,
            "fl_name": self.fl_names[index],
            "leaf": self.leaf(index),
            "fi_uncompressed_size": size,
            "fi_offset": offset,
            "fi_flag": flag,
            "payload_size": len(blob),
            "payload_sha256": hashlib.sha256(blob).hexdigest(),
        }
        return self.leaf(index), blob, meta

    # ---- registry cross-validation ------------------------------------

    def load_registry(self) -> dict:
        with REGISTRY_PATH.open(encoding="utf-8") as fh:
            return json.load(fh)

    def validate_c0m(self, c0m_number: int) -> dict:
        """Full byte-exact contract check of one c0m payload against the registry."""
        index = self.c0m_index(c0m_number)
        if index is None:
            return {"c0m": c0m_number, "status": "not-in-archive"}
        _, payload, meta = self.read_entry(index)
        entry = next(
            e for e in self.load_registry()["entries"] if e["name"] == f"c0m{c0m_number:03d}.dat"
        )
        payload_ok = (
            meta["payload_sha256"] == entry["sha256"] and meta["payload_size"] == entry["size"]
        )
        section_rows, matched = self._verify_sections(payload, entry["sections"])
        return {
            "c0m": c0m_number,
            "fi_index": index,
            "status": "pass" if payload_ok else "fail",
            "fl_name": meta["fl_name"],
            "fi_flag": meta["fi_flag"],
            "fi_offset": meta["fi_offset"],
            "payload_size": meta["payload_size"],
            "payload_sha256": meta["payload_sha256"],
            "registry_sha256": entry["sha256"],
            "sections_declared": len(entry["sections"]),
            "sections_matched": matched,
            "section_report": section_rows,
            "_payload": payload,
        }

    @staticmethod
    def _spans(payload: bytes) -> list[tuple[int, int]]:
        count = struct.unpack_from("<I", payload, 0)[0]
        header = 4 + 4 * (count + 1)
        offsets = struct.unpack_from(f"<{count + 1}I", payload, 4)
        return list(zip(offsets[:-1], offsets[1:]))

    def _verify_sections(self, payload: bytes, declared: list[dict]) -> tuple[list[dict], int]:
        spans = self._spans(payload)
        rows, matched = [], 0
        for spec in declared:
            idx = spec["section_index_1based"]
            if idx - 1 < len(spans):
                start, end = spans[idx - 1]
                blob = payload[start:end]
                ok = hashlib.sha256(blob).hexdigest() == spec["sha256"]
                matched += 1 if ok else 0
                observed = len(blob)
            else:
                start = end = None
                ok, observed = False, None
            rows.append(
                {
                    "section": idx,
                    "size_declared": spec["size"],
                    "size_observed": observed,
                    "sha_match": ok,
                }
            )
        return rows, matched

    def anchor_report(self, numbers: list[int]) -> list[dict]:
        return [self.validate_c0m(n) for n in numbers]


def main() -> int:
    parser = argparse.ArgumentParser(
        description="FF8 battle FI/FL/FS extractor + LZS decoder + registry anchor validator"
    )
    parser.add_argument("--archive-dir", type=Path, default=DEFAULT_ARCHIVE_DIR)
    parser.add_argument("--c0m", default="0,90", help="comma list of c0m numbers (default: 0,90)")
    parser.add_argument("--all", action="store_true", help="validate all 200 c0m entries")
    parser.add_argument("--fl-index", type=int, help="dump meta for an arbitrary FI/FL index")
    parser.add_argument("--write", action="store_true", help="write extracted payloads to --out")
    parser.add_argument("--out", type=Path, default=Path(__file__).resolve().parent / "out")
    args = parser.parse_args()

    archive = BattleArchive(args.archive_dir)
    print("battle.fi/fl/fs sha256:")
    for name, digest in archive.sha256.items():
        print(f"  {name}: {digest}")

    if args.fl_index is not None:
        _, payload, meta = archive.read_entry(args.fl_index)
        meta["_head_hex"] = payload[:32].hex(" ")
        print(json.dumps(meta, indent=1))

    numbers = list(range(200)) if args.all else [int(x) for x in args.c0m.split(",") if x.strip()]
    rows = archive.anchor_report(numbers)
    if args.write:
        args.out.mkdir(parents=True, exist_ok=True)
    for row in rows:
        print(
            f"c0m{row['c0m']:03d}: FI index {row['fi_index']} flag={row['fi_flag']} "
            f"payload {row['payload_size']}B "
            f"sha={'MATCH' if row['status'] == 'pass' else 'MISMATCH'} "
            f"sections {row['sections_matched']}/{row['sections_declared']} byte-exact"
        )
        if args.write and row["status"] == "pass":
            (args.out / f"c0m{row['c0m']:03d}.dat").write_bytes(row["_payload"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
