#!/usr/bin/env python3
"""Audit, synchronize, verify, and compile FF8 evidence ingestion."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path


SKILL_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = Path(__file__).resolve().parents[4]
DEFAULT_VAULT = REPO_ROOT / "obsidian-docs"
DEFAULT_EVIDENCE = REPO_ROOT.parents[1] / "FinalFantasy_VIII_Reimaginated" / "evidence"
PROJECT = "final-fantasy-viii-reimaginated"
CATALOG = "projects/final-fantasy-viii-reimaginated/references/evidence-catalog.md"


def now_iso() -> str:
    return datetime.now().astimezone().replace(microsecond=0).isoformat()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return "sha256:" + digest.hexdigest()


def load_manifest(vault: Path) -> dict:
    path = vault / ".manifest.json"
    try:
        return json.loads(path.read_text(encoding="utf-8-sig"))
    except (OSError, json.JSONDecodeError) as exc:
        raise RuntimeError(f"invalid manifest {path}: {exc}") from exc


def normalize_source(raw: str, vault: Path) -> Path:
    value = raw.strip().strip('"\'')
    path = Path(value)
    if not path.is_absolute():
        path = vault / path
    return path.resolve(strict=False)


def frontmatter_sources(page: Path, vault: Path) -> list[Path]:
    text = page.read_text(encoding="utf-8-sig")
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return []
    try:
        end = lines.index("---", 1)
    except ValueError:
        return []

    result: list[Path] = []
    in_sources = False
    for line in lines[1:end]:
        if re.match(r"^sources:\s*$", line):
            in_sources = True
            continue
        if in_sources and re.match(r"^[A-Za-z0-9_-]+:\s*", line):
            break
        if in_sources:
            match = re.match(r"^\s{2,}-\s+(.+?)\s*$", line)
            if match:
                result.append(normalize_source(match.group(1), vault))
    return result


def evidence_references(vault: Path, evidence: Path) -> dict[Path, list[str]]:
    evidence = evidence.resolve()
    catalog = vault / CATALOG
    if not catalog.is_file():
        raise RuntimeError(f"missing canonical evidence catalog: {catalog}")
    selected = {
        source
        for source in frontmatter_sources(catalog, vault)
        if source == evidence or evidence in source.parents
    }
    mapping: dict[Path, list[str]] = {source: [] for source in selected}
    for page in vault.rglob("*.md"):
        if any(part in {".obsidian", "_archives"} for part in page.parts):
            continue
        for source in frontmatter_sources(page, vault):
            try:
                source.relative_to(evidence)
            except ValueError:
                continue
            if source not in selected:
                continue
            rel_page = page.relative_to(vault).as_posix()
            mapping.setdefault(source, []).append(rel_page)
    return {path: sorted(set(pages)) for path, pages in mapping.items()}


def managed_sources(manifest: dict, evidence: Path) -> dict[str, dict]:
    evidence_norm = evidence.resolve().as_posix().casefold().rstrip("/") + "/"
    return {
        key: value
        for key, value in manifest.get("sources", {}).items()
        if Path(key).resolve(strict=False).as_posix().casefold().startswith(evidence_norm)
    }


def source_key_for_path(manifest: dict, path: Path) -> str | None:
    target = path.resolve(strict=False).as_posix().casefold()
    for key in manifest.get("sources", {}):
        if Path(key).resolve(strict=False).as_posix().casefold() == target:
            return key
    return None


def build_entry(path: Path, pages: list[str], old: dict | None, stamp: str) -> dict:
    old = old or {}
    created = list(old.get("pages_created", []))
    produced = sorted(set(created + pages))
    entry = {
        "ingested_at": old.get("ingested_at", stamp),
        "last_ingested": old.get("last_ingested", stamp),
        "size_bytes": path.stat().st_size,
        "modified_at": datetime.fromtimestamp(path.stat().st_mtime).astimezone().isoformat(),
        "content_hash": sha256(path),
        "source_type": "document" if path.suffix.casefold() == ".md" else "data",
        "project": PROJECT,
        "pages_created": created,
        "pages_updated": pages,
        "pages_produced": produced,
    }
    compared_fields = set(entry) - {"last_ingested"}
    if old and any(old.get(field) != entry[field] for field in compared_fields):
        entry["last_ingested"] = stamp
    return entry


def find_matching(text: str, start: int, opening: str, closing: str) -> int:
    depth = 0
    quoted = False
    escaped = False
    for index in range(start, len(text)):
        char = text[index]
        if quoted:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                quoted = False
            continue
        if char == '"':
            quoted = True
        elif char == opening:
            depth += 1
        elif char == closing:
            depth -= 1
            if depth == 0:
                return index
    raise RuntimeError(f"unbalanced {opening}{closing} structure")


def object_span(text: str, key: str, within: tuple[int, int] | None = None) -> tuple[int, int]:
    needle = json.dumps(key, ensure_ascii=False)
    start_limit, end_limit = within or (0, len(text))
    key_at = text.find(needle, start_limit, end_limit)
    if key_at < 0:
        raise KeyError(key)
    colon = text.find(":", key_at + len(needle), end_limit)
    opening = text.find("{", colon + 1, end_limit)
    return opening, find_matching(text, opening, "{", "}") + 1


def array_span(text: str, key: str, within: tuple[int, int] | None = None) -> tuple[int, int]:
    needle = json.dumps(key, ensure_ascii=False)
    start_limit, end_limit = within or (0, len(text))
    key_at = text.find(needle, start_limit, end_limit)
    if key_at < 0:
        raise KeyError(key)
    colon = text.find(":", key_at + len(needle), end_limit)
    opening = text.find("[", colon + 1, end_limit)
    return opening, find_matching(text, opening, "[", "]") + 1


def sources_span(text: str) -> tuple[int, int]:
    opening, end = object_span(text, "sources")
    return opening, end - 1


def replace_scalar(text: str, key: str, value: object, within: tuple[int, int] | None = None) -> str:
    start, end = within or (0, len(text))
    pattern = re.compile(rf'({re.escape(json.dumps(key))}\s*:\s*)("(?:\\.|[^"\\])*"|-?\d+)')
    match = pattern.search(text, start, end)
    if not match:
        raise KeyError(key)
    return text[: match.start(2)] + json.dumps(value, ensure_ascii=False) + text[match.end(2) :]


def sync_text(
    original: str,
    manifest: dict,
    references: dict[Path, list[str]],
    new_pages: int,
) -> tuple[str, int, int]:
    stamp = now_iso()
    source_data: dict = manifest.setdefault("sources", {})
    desired: dict[str, dict] = {}
    for path, pages in references.items():
        if not path.is_file():
            raise RuntimeError(f"selected evidence source is missing: {path}")
        key = source_key_for_path(manifest, path) or path.as_posix()
        desired[key] = build_entry(path, pages, source_data.get(key), stamp)

    source_open, source_close = sources_span(original)
    replacements: list[tuple[int, int, str]] = []
    additions: list[tuple[str, dict]] = []
    changed = 0
    for key, entry in desired.items():
        if key in source_data:
            entry_open, entry_end = object_span(original, key, (source_open, source_close))
            compact = json.dumps(entry, ensure_ascii=False, separators=(",", ":"))
            if original[entry_open:entry_end] != compact:
                replacements.append((entry_open, entry_end, compact))
                changed += 1
        else:
            additions.append((key, entry))

    project_data = manifest.get("projects", {}).get(PROJECT, {})
    current_project_pages = list(project_data.get("pages_in_vault", []))
    referenced_project_pages = sorted({
        page
        for pages in references.values()
        for page in pages
        if page.startswith(f"projects/{PROJECT}/")
    })
    missing_project_pages = [
        page for page in referenced_project_pages if page not in current_project_pages
    ]

    if not replacements and not additions and not new_pages and not missing_project_pages:
        return original, 0, 0

    text = original
    for start, end, replacement in sorted(replacements, reverse=True):
        text = text[:start] + replacement + text[end:]

    if additions:
        _, close = sources_span(text)
        before = text[:close].rstrip()
        separator = "," if not before.endswith("{") else ""
        indent = " " * 20
        lines = [
            indent + json.dumps(key, ensure_ascii=False) + ": "
            + json.dumps(entry, ensure_ascii=False, separators=(",", ":"))
            for key, entry in additions
        ]
        insertion = separator + "\n" + ",\n".join(lines) + "\n" + " " * 16
        text = text[:close] + insertion + text[close:]

    text = replace_scalar(text, "generated_at", stamp)
    stats_open, stats_end = object_span(text, "stats")
    old_total = int(manifest.get("stats", {}).get("total_sources_ingested", 0))
    text = replace_scalar(
        text, "total_sources_ingested", old_total + len(additions), (stats_open, stats_end)
    )
    if new_pages:
        stats_open, stats_end = object_span(text, "stats")
        old_pages = int(manifest.get("stats", {}).get("total_pages", 0))
        text = replace_scalar(text, "total_pages", old_pages + new_pages, (stats_open, stats_end))

    projects_open, projects_end = object_span(text, "projects")
    project_open, project_end = object_span(text, PROJECT, (projects_open, projects_end))
    text = replace_scalar(text, "last_synced", stamp, (project_open, project_end))
    if missing_project_pages:
        projects_open, projects_end = object_span(text, "projects")
        project_open, project_end = object_span(text, PROJECT, (projects_open, projects_end))
        array_open, array_end = array_span(text, "pages_in_vault", (project_open, project_end))
        pages = current_project_pages + missing_project_pages
        text = text[:array_open] + json.dumps(pages, ensure_ascii=False) + text[array_end:]
    return text, len(additions), changed


def command_audit(args: argparse.Namespace) -> int:
    manifest = load_manifest(args.vault)
    references = evidence_references(args.vault, args.evidence)
    managed = managed_sources(manifest, args.evidence)
    markdown = len(list(args.evidence.rglob("*.md")))
    json_count = len(list(args.evidence.rglob("*.json")))
    new = sum(source_key_for_path(manifest, path) is None for path in references)
    changed = 0
    missing = 0
    for path in references:
        key = source_key_for_path(manifest, path)
        entry = manifest.get("sources", {}).get(key) if key else None
        if not path.is_file():
            missing += 1
        elif entry and entry.get("content_hash") != sha256(path):
            changed += 1
    print(f"inventory markdown={markdown} json={json_count}")
    print(f"selected={len(references)} managed={len(managed)} new={new} changed={changed} missing={missing}")
    print(f"managed_unselected={max(0, len(managed) - len(references))}")
    print(f"unselected_json={json_count - sum(path.suffix.casefold() == '.json' for path in references)}")
    return 1 if missing else 0


def command_sync(args: argparse.Namespace) -> int:
    path = args.vault / ".manifest.json"
    manifest = load_manifest(args.vault)
    references = evidence_references(args.vault, args.evidence)
    original = path.read_text(encoding="utf-8-sig")
    updated, added, changed = sync_text(original, manifest, references, args.new_pages)
    print(f"manifest delta: added={added} changed={changed} selected={len(references)}")
    if not args.write:
        print("dry-run; pass --write to apply")
        return 0
    if updated == original:
        print("manifest already current")
        return 0
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(updated, encoding="utf-8-sig", newline="\n")
    json.loads(temp.read_text(encoding="utf-8-sig"))
    temp.replace(path)
    print(f"updated {path}")
    return 0


def command_verify(args: argparse.Namespace) -> int:
    manifest = load_manifest(args.vault)
    references = evidence_references(args.vault, args.evidence)
    errors: list[str] = []
    for path, pages in references.items():
        key = source_key_for_path(manifest, path)
        entry = manifest.get("sources", {}).get(key) if key else None
        if not path.is_file():
            errors.append(f"missing source: {path}")
        elif not entry:
            errors.append(f"unmanaged source: {path}")
        elif entry.get("content_hash") != sha256(path):
            errors.append(f"hash mismatch: {path}")
        elif sorted(entry.get("pages_produced", [])) != sorted(set(entry.get("pages_created", []) + pages)):
            errors.append(f"page mapping mismatch: {path}")

    catalog = args.vault / CATALOG
    if not catalog.is_file():
        errors.append(f"missing catalog: {catalog}")
    else:
        text = catalog.read_text(encoding="utf-8-sig")
        for link in re.findall(r"\[\[([^\]|#]+)", text):
            if not (args.vault / f"{link}.md").is_file():
                errors.append(f"missing wikilink target: {link}")

    if errors:
        print("verification failed:")
        for error in errors:
            print(f"- {error}")
        return 1
    md = sum(path.suffix.casefold() == ".md" for path in references)
    data = len(references) - md
    print(f"verification passed: selected={len(references)} markdown={md} data={data}")
    return 0


def command_compile(args: argparse.Namespace) -> int:
    executable = shutil.which("qmd")
    if not executable:
        print("qmd is not installed or not on PATH", file=sys.stderr)
        return 1

    def run_qmd(*arguments: str) -> None:
        command = [executable, *arguments]
        if Path(executable).suffix.casefold() in {".cmd", ".bat"}:
            command = [os.environ.get("COMSPEC", "cmd.exe"), "/d", "/c", *command]
        subprocess.run(command, cwd=REPO_ROOT, check=True)

    run_qmd("update")
    if not args.skip_embed:
        run_qmd("embed", "-c", args.collection)
    run_qmd("collection", "show", args.collection)
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--vault", type=Path, default=DEFAULT_VAULT)
    parser.add_argument("--evidence", type=Path, default=DEFAULT_EVIDENCE)
    parser.add_argument("--collection", default="ff8-wiki")
    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("audit")
    sync = subparsers.add_parser("sync-manifest")
    sync.add_argument("--write", action="store_true")
    sync.add_argument("--new-pages", type=int, default=0)
    subparsers.add_parser("verify")
    compile_parser = subparsers.add_parser("compile")
    compile_parser.add_argument("--skip-embed", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    args.vault = args.vault.resolve()
    args.evidence = args.evidence.resolve()
    if not args.vault.is_dir() or not args.evidence.is_dir():
        print(f"invalid vault/evidence path: {args.vault} | {args.evidence}", file=sys.stderr)
        return 2
    commands = {
        "audit": command_audit,
        "sync-manifest": command_sync,
        "verify": command_verify,
        "compile": command_compile,
    }
    try:
        return commands[args.command](args)
    except (OSError, RuntimeError, KeyError, subprocess.CalledProcessError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
