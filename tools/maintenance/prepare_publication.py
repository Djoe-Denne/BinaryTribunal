"""Inventory changed Git paths for an explicitly approved, non-destructive checkpoint.

No staging, commits, remote operations, source rewrites or cleanup. Excluded
artifacts remain local; fingerprints permit later identification without upload.
"""

from __future__ import annotations

import argparse
import collections
import hashlib
import json
import pathlib
import re
import subprocess
import time


MAX_BLOB = 100 * 1024 * 1024
BINARY_SUFFIXES = {".exe", ".dll", ".pdb", ".obj", ".o", ".lib", ".a", ".so", ".dylib", ".bin", ".dat", ".sqlite", ".sqlite3", ".db", ".i64", ".idb", ".dmp", ".zip", ".7z", ".gz", ".tar", ".png", ".jpg", ".jpeg", ".bmp", ".dds", ".tga", ".wav", ".mp3", ".mp4", ".pdf", ".pyc"}
SECRET = re.compile(rb"(?:\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b|\bgh[pousr]_[A-Za-z0-9]{20,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|(?i:authorization\s*[:=]\s*[\"']?(?:bearer|basic)\s+)[A-Za-z0-9._~+/=-]{16,})")
CSHARP = re.compile(rb"(?m)^\s*using\s+System(?:\.[A-Za-z0-9_.]+)?\s*;|<Project\s+Sdk=[\"']Microsoft\.NET|\b(?:Microsoft\.CodeAnalysis\.CSharp|TargetFramework>net[0-9])")
# Reviewed fixture: deliberately fabricated provider-error credentials in one
# historical test file, copied byte-identically eight times. Never a live token.
REVIEWED_FIXTURE_SHA256 = {"01b6eaa3615336ca4eda7f15a1e8af1a6fd07c3f277dfef0e4dfe5eaf303ebbe"}


def hash_file(path: pathlib.Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        while block := f.read(8 * 1024 * 1024):
            h.update(block)
    return h.hexdigest()


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--output", type=pathlib.Path, required=True)
    p.add_argument("--reuse-reviewed-content", action="store_true",
                   help="Reuse prior content-scan decisions for metadata-unchanged bytes; path policy is always reevaluated")
    args = p.parse_args()
    root = pathlib.Path.cwd().resolve()
    git = subprocess.run(["git", "rev-parse", "--show-toplevel"], capture_output=True, text=True, check=True).stdout.strip()
    if pathlib.Path(git).resolve() != root:
        raise RuntimeError("Run from the Git root")
    args.output.mkdir(parents=True, exist_ok=True)
    output_rel = args.output.resolve().relative_to(root).as_posix().rstrip("/") + "/"
    cached = {}
    previous_started = 0
    previous_summary = args.output / "summary.json"
    if previous_summary.exists() and (args.output / "excluded.jsonl").exists():
        prior = json.loads(previous_summary.read_text(encoding="utf-8"))
        previous_started = previous_summary.stat().st_mtime - prior["elapsed_seconds"] - 1
        for cache_name in ("excluded.jsonl", "included.jsonl"):
            cached.update({r["path"]: r for line in (args.output / cache_name).read_text(encoding="utf-8").splitlines()
                           if (r := json.loads(line)).get("sha256")})
    raw = subprocess.run(["git", "status", "--porcelain=v1", "-z", "--untracked-files=all"], capture_output=True, check=True).stdout
    entries = raw.decode("utf-8").split("\0")
    included, excluded = [], []
    reused = 0
    parent_scope = {}
    cursor = 0
    started = time.time()
    while cursor < len(entries):
        row = entries[cursor]
        cursor += 1
        if not row:
            continue
        status, relative = row[:2], row[3:]
        if "R" in status or "C" in status:
            cursor += 1
        path = root / relative
        record = {"path": relative, "status": status}
        if relative.startswith(output_rel):
            continue
        reason = None
        if path.parent not in parent_scope:
            parent_scope[path.parent] = path.parent.resolve().is_relative_to(root)
        if path.is_symlink() or not parent_scope[path.parent]:
            reason = "link-or-outside-root"
        elif not path.exists():
            if "D" in status:
                included.append({**record, "deleted": True, "bytes": 0})
                continue
            reason = "missing-path"
        elif not path.is_file():
            reason = "directory-or-nested-repository"
        else:
            stat = path.stat()
            size = stat.st_size
            old = cached.get(relative)
            unchanged = bool(old and old.get("bytes") == size and stat.st_mtime < previous_started and stat.st_ctime < previous_started)
            if unchanged:
                file_sha = old["sha256"]
                reused += 1
            else:
                file_sha = hash_file(path)
            record.update({"bytes": size, "sha256": file_sha})
            name = path.name.lower()
            if size >= MAX_BLOB:
                reason = "github-oversize"
            elif relative.startswith("tools/_tmp_af3dn_drop/") and path.suffix.lower() == ".csv":
                reason = "raw-capture-local"
            elif path.suffix.lower() in {".cs", ".csproj", ".sln", ".fsproj", ".vbproj"}:
                reason = "managed-source-or-project"
            elif path.suffix.lower() in BINARY_SUFFIXES or name.endswith(("-wal", "-shm", ".pid", ".lock.tmp")):
                reason = "local-binary-or-runtime-artifact"
            elif relative in {".cursor/mcp.json", ".codex/config.toml", "opencode.jsonc", "opencode.json", "nul"} or name.startswith(".env"):
                reason = "machine-configuration-or-secret-file"
            elif any(part in {"node_modules", ".git", "__pycache__", ".venv"} for part in pathlib.PurePosixPath(relative).parts):
                reason = "dependency-or-cache"
            elif unchanged and args.reuse_reviewed_content:
                reason = old.get("reason")
                if reason == "credential-pattern-review-needed" and file_sha in REVIEWED_FIXTURE_SHA256:
                    reason = None
            else:
                data = path.read_bytes()
                if b"\0" in data[:8192] or data.startswith((b"MZ", b"\x7fELF")):
                    reason = "binary-content"
                elif SECRET.search(data) and record["sha256"] not in REVIEWED_FIXTURE_SHA256:
                    reason = "credential-pattern-review-needed"
                elif CSHARP.search(data):
                    reason = "managed-code-content-review-needed"
                else:
                    try:
                        data.decode("utf-8-sig")
                    except UnicodeDecodeError:
                        reason = "non-utf8-content-review-needed"
        if reason:
            excluded.append({**record, "reason": reason})
        else:
            included.append(record)
    for filename, records in (("included.jsonl", included), ("excluded.jsonl", excluded)):
        with (args.output / filename).open("w", encoding="utf-8", newline="\n") as f:
            for record in records:
                f.write(json.dumps(record, ensure_ascii=False) + "\n")
    (args.output / "stage-paths.nul").write_bytes(b"".join(record["path"].encode() + b"\0" for record in included))
    summary = {"version": 1, "kind": "checkpoint-not-product-acceptance", "source_files_rewritten": False,
               "source_files_deleted": False, "included_files": len(included), "included_bytes": sum(r["bytes"] for r in included),
               "excluded_files": len(excluded), "excluded_bytes": sum(r.get("bytes", 0) for r in excluded),
               "reasons": dict(collections.Counter(r["reason"] for r in excluded)),
               "elapsed_seconds": round(time.time() - started, 3), "blob_limit_bytes": MAX_BLOB,
               "reused_hashes": reused,
               "hash_reuse_rule": "previous byte hashes with unchanged size and timestamps predating the previous audit; new or potentially changed files are rehashed",
               "reviewed_content_reuse": args.reuse_reviewed_content,
               "reviewed_synthetic_fixture_sha256": sorted(REVIEWED_FIXTURE_SHA256)}
    (args.output / "summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary))


if __name__ == "__main__":
    main()
