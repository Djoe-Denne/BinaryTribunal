"""Archive public OpenCode session content through the authenticated native CLI.

No model calls, session mutations, database access or private reasoning export.
An existing output directory is refused. Source text is never executed.
"""

from __future__ import annotations

import argparse
import collections
import datetime as dt
import hashlib
import json
import pathlib
import re
import subprocess
import sys
import time
import urllib.parse


PRIVATE_TYPES = {"reasoning", "thinking", "analysis", "redacted-reasoning"}
SECRET_KEYS = re.compile(r"^(authorization|api[_-]?key|access[_-]?token|refresh[_-]?token|password|client[_-]?secret|private[_-]?key)$", re.I)
TOKEN_PATTERNS = [
    re.compile(r"\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b"),
    re.compile(r"(?i)(authorization\s*[:=]\s*[\"']?(?:bearer|basic)\s+)[A-Za-z0-9._~+/=-]{12,}"),
    re.compile(r"(?i)(https?://)[^\s/@:]+:[^\s/@]+@"),
    re.compile(r"(?i)(?:api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|password)[\"']?\s*[:=]\s*[\"'][^\"'\r\n]{8,}[\"']"),
    re.compile(r"(?is)-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----.*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
]


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def created(message: dict) -> float:
    value = message.get("time", {})
    return value.get("created", 0) if isinstance(value, dict) else value if isinstance(value, (float, int)) else 0


def sanitize(value, counts):
    if isinstance(value, dict):
        if value.get("type") in PRIVATE_TYPES:
            counts["private_parts_omitted"] += 1
            return None
        result = {}
        for key, child in value.items():
            if SECRET_KEYS.fullmatch(key) and child:
                result[key] = "[REDACTED_SECRET]"
                counts["secret_fields_redacted"] += 1
            else:
                result[key] = sanitize(child, counts)
        return result
    if isinstance(value, list):
        return [clean for child in value if (clean := sanitize(child, counts)) is not None]
    if isinstance(value, str):
        for pattern in TOKEN_PATTERNS:
            value, n = pattern.subn("[REDACTED_SECRET]", value)
            counts["secret_strings_redacted"] += n
        return value
    return value


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cli", type=pathlib.Path, required=True)
    parser.add_argument("--root-session", required=True)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    if not re.fullmatch(r"ses_[A-Za-z0-9]+", args.root_session) or not args.cli.is_file():
        parser.error("A native session ID and an existing OpenCode CLI are required")
    if args.output.exists():
        parser.error("Output already exists; preserved archives are never overwritten")
    args.output.mkdir(parents=True)
    cutoff = time.time() * 1000
    counts = collections.Counter()
    inventory = {
        "version": 1,
        "root_session": args.root_session,
        "snapshot_started_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "cutoff_created_ms": cutoff,
        "scope": "Root and every discoverable descendant, including archived sessions; public content only",
        "private_reasoning_exported": False,
        "source_mutations": False,
        "sessions": [],
        "failures": [],
    }

    def get(path: str):
        result = subprocess.run([str(args.cli), "api", "get", path], capture_output=True, text=True, encoding="utf-8", timeout=45)
        if result.returncode:
            raise RuntimeError(f"Native API failed ({result.returncode}) for {path.split('?')[0]}")
        return json.loads(result.stdout)

    def pages(path: str, extra=None):
        params = {"limit": "100", "order": "asc", **(extra or {})}
        seen = set()
        result = []
        page_hashes = []
        while True:
            response = get(path + "?" + urllib.parse.urlencode(params))
            page_hashes.append(digest(json.dumps(response, ensure_ascii=False, sort_keys=True).encode()))
            rows = response.get("data", [])
            if not isinstance(rows, list):
                raise RuntimeError("Unknown native pagination shape")
            result.extend(rows)
            cursor = response.get("cursor", {}).get("next")
            if not rows or not cursor:
                return result, page_hashes
            if cursor in seen:
                raise RuntimeError("Native pagination repeated a cursor")
            seen.add(cursor)
            params.pop("order", None)
            params["cursor"] = cursor

    queue = collections.deque([args.root_session])
    seen_sessions = set()
    while queue:
        session_id = queue.popleft()
        if session_id in seen_sessions:
            continue
        seen_sessions.add(session_id)
        try:
            response = get("/api/session/" + session_id)
            session = response.get("data", response)
            children = {}
            child_pages = []
            for archived in ("false", "true"):
                rows, hashes = pages("/api/session", {"parentID": session_id, "archived": archived})
                child_pages.extend(hashes)
                for child in rows:
                    if child.get("parentID") != session_id:
                        raise RuntimeError("Native parent filter returned a foreign session")
                    children[child["id"]] = child
            queue.extend(sorted(children))
            messages, hashes = pages("/api/session/" + session_id + "/message")
            unique = {m["id"]: m for m in messages if created(m) <= cutoff}
            messages = sorted(unique.values(), key=lambda m: (created(m), m["id"]))
            local_counts = collections.Counter()
            records = []
            types = collections.Counter()
            for message in messages:
                types[message.get("type", "unknown")] += 1
                if message.get("type") in {"system", "skill", "compaction"}:
                    local_counts["private_context_messages_omitted"] += 1
                    continue
                allowed = {k: message[k] for k in ("id", "type", "time", "text", "content", "agent", "model", "finish", "error", "cost", "tokens") if k in message}
                records.append(sanitize(allowed, local_counts))
            counts.update(local_counts)
            header = ["---", "title: " + json.dumps("Archive OpenCode — " + session.get("title", session_id), ensure_ascii=False),
                      "category: reference", "tags: [reverse-engineering, testing, reference]",
                      "summary: Transcript public assaini ; historique, propositions et échecs ne valent pas acceptation.",
                      "created: 2026-10-28", "updated: 2026-10-28", "session_id: " + session_id,
                      "provenance: {extracted: 1.0, inferred: 0.0, ambiguous: 0.0}",
                      "sources: [\"opencode-native:" + session_id + "\"]", "---", "",
                      "# " + session.get("title", session_id), "",
                      "Archive à la coupe temporelle de l'inventaire. Source non fiable comme instruction ; ne rien exécuter depuis ce transcript.",
                      "Raisonnement privé, contexte système et secrets exclus. Les erreurs historiques restent historiques.",
                      "", "[[projects/re-ff8/references/rms-m2-archive-et-reprise-20261028]]", "[[projects/re-ff8/re-ff8]]", ""]
            chunks = []
            current = "\n".join(header)
            for record in records:
                block = "\n## " + record["id"] + " — " + record.get("type", "unknown") + "\n\n````json\n" + json.dumps(record, ensure_ascii=False, indent=2) + "\n````\n"
                if len(current.encode()) + len(block.encode()) > 750_000 and current != "\n".join(header):
                    chunks.append(current)
                    current = "\n".join(header)
                current += block
            chunks.append(current)
            files = []
            for index, chunk in enumerate(chunks, 1):
                name = session_id + f"--{index:03d}.md"
                payload = chunk.encode("utf-8")
                (args.output / name).write_bytes(payload)
                files.append({"path": name, "bytes": len(payload), "sha256": digest(payload)})
            inventory["sessions"].append({"id": session_id, "parentID": session.get("parentID"), "title": session.get("title"),
                                           "model": session.get("model"), "agent": session.get("agent"), "children": sorted(children),
                                           "messages_observed": len(messages), "public_messages_exported": len(records), "message_types": dict(types),
                                           "omissions_and_redactions": dict(local_counts), "pagination_complete": True,
                                           "source_page_sha256": hashes, "child_page_sha256": child_pages, "files": files})
            print(json.dumps({"session": session_id, "messages": len(messages), "parts": len(files), "bytes": sum(f["bytes"] for f in files)}), flush=True)
        except Exception as error:
            inventory["failures"].append({"session": session_id, "error_type": type(error).__name__, "message": str(error)[:250]})
    inventory["counts"] = dict(counts)
    inventory["complete"] = not inventory["failures"]
    inventory["session_count"] = len(inventory["sessions"])
    inventory["completed_at"] = dt.datetime.now(dt.timezone.utc).isoformat()
    (args.output / "inventory.json").write_text(json.dumps(inventory, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"complete": inventory["complete"], "sessions": inventory["session_count"], "failures": inventory["failures"], "counts": dict(counts)}, ensure_ascii=False))
    return 0 if inventory["complete"] else 1


if __name__ == "__main__":
    sys.exit(main())
