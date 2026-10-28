"""Generate the session catalogue and additive, hash-based wiki bookkeeping."""

from __future__ import annotations

import datetime as dt
import hashlib
import json
import pathlib
import shutil


ROOT = pathlib.Path(__file__).resolve().parents[2]
VAULT = ROOT / "obsidian-docs"
RAW = VAULT / "_raw/rms-m2-opencode-20261028"
MISSION = "docs/missions/rms-static-closure-20261028/MISSION.md"
OLD = ".opencode/missions/team_mvnxgnse_0000_39vpc8"
BATCH = "rms-m2-opencode-20261028"
NEW = [
    "projects/re-ff8/references/rms-m2-archive-et-reprise-20261028.md",
    "projects/re-ff8/references/rms-static-closure-mission-20261028.md",
    "projects/re-ff8/concepts/rms-remplacement-et-preuves.md",
    "projects/re-ff8/skills/recuperer-un-resultat-opencode-manquant.md",
]
UPDATED = ["projects/re-ff8/concepts/ensemble-coordination-helpers.md", "projects/re-ff8/re-ff8.md"]


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    now = dt.datetime.now(dt.timezone.utc).isoformat()
    inventories = [(RAW, json.loads((RAW / "inventory.json").read_text(encoding="utf-8"))),
                   (RAW / "preparation-pm", json.loads((RAW / "preparation-pm/inventory.json").read_text(encoding="utf-8")))]
    sessions = []
    for folder, inventory in inventories:
        if not inventory["complete"]:
            raise RuntimeError("Incomplete source inventory")
        for session in inventory["sessions"]:
            for file in session["files"]:
                payload = (folder / file["path"]).read_bytes()
                if len(payload) != file["bytes"] or sha(payload) != file["sha256"]:
                    raise RuntimeError("Archive source hash mismatch")
            sessions.append((folder, session))
    catalogue = ["---", "title: Catalogue des 18 sessions RMS M2 archivées", "category: reference",
                 "tags: [reverse-engineering, testing, reference]", "summary: Identités, modèles, messages et liens vers tous les fragments publics des sessions M2.",
                 "created: 2026-10-28", "updated: 2026-10-28", "provenance: {extracted: 1.0, inferred: 0.0, ambiguous: 0.0}",
                 "sources: [obsidian-docs/_raw/rms-m2-opencode-20261028/inventory.json, obsidian-docs/_raw/rms-m2-opencode-20261028/preparation-pm/inventory.json]", "---", "",
                 "# Catalogue des sessions", "", "[[projects/re-ff8/references/rms-m2-archive-et-reprise-20261028|Bilan et limites]] · [[projects/re-ff8/re-ff8|Projet]]", "",
                 "Les transcripts conservent les textes et entrées/sorties d'outils publics. Raisonnement privé, contexte système et secrets exclus. Les anciens états ne valent pas état courant.", ""]
    for folder, session in sessions:
        model = session.get("model") or {}
        catalogue.extend(["## " + session["title"], "", "- Session : `" + session["id"] + "`.",
                          "- Modèle natif observé : `" + json.dumps(model, ensure_ascii=False) + "`.",
                          f"- Messages observés : {session['messages_observed']} ; publics exportés : {session['public_messages_exported']} ; pagination terminée."])
        for file in session["files"]:
            link = (folder / file["path"]).relative_to(VAULT).with_suffix("").as_posix()
            catalogue.append("- [[" + link + "|" + file["path"] + "]]")
        catalogue.append("")
    (RAW / "catalogue.md").write_text("\n".join(catalogue) + "\n", encoding="utf-8")
    copies = [(MISSION, "mission-prepared.md"),
              (OLD + "/reports/180-bilan-copie-negligeable-arret-convenu.md", "proof-180-diagnostic-final.md"),
              (OLD + "/reports/181-historique-ensemble-messages-recuperation.md", "proof-181-plugin-history.md")]
    for source, destination in copies:
        target = RAW / destination
        if target.exists():
            raise RuntimeError("Existing source copy refused")
        shutil.copyfile(ROOT / source, target)
    manifest_path = VAULT / ".manifest.json"
    original = manifest_path.read_bytes()
    manifest = json.loads(original.decode("utf-8-sig"))
    if manifest.get("stats", {}).get("last_batch", {}).get("batch") == BATCH:
        raise RuntimeError("Batch already ingested; do not increment bookkeeping twice")
    selected = sorted({p.relative_to(ROOT).as_posix() for p in RAW.rglob("*") if p.is_file()} |
                      {MISSION, OLD + "/REPRISE_JOURNAL.md", *(source for source, _ in copies),
                       "docs/missions/re-graph-scheduler/ORDRE_MISSION_02_REPRISE_RMS_APRES_M1_20261020.md"})
    sources = manifest["sources"]
    added = 0
    for relative in selected:
        path = ROOT / relative
        data = path.read_bytes()
        added += relative not in sources
        sources[relative] = {"ingested_at": now, "last_ingested": now, "size_bytes": len(data),
                             "modified_at": dt.datetime.fromtimestamp(path.stat().st_mtime, dt.timezone.utc).isoformat(),
                             "content_hash": "sha256:" + sha(data), "source_type": "session" if path.name.startswith("ses_") else "document",
                             "project": "re-ff8", "pages_created": NEW, "pages_updated": UPDATED}
    stats = manifest["stats"]
    stats["total_sources_ingested"] = len(sources)
    stats["total_pages"] += len(NEW)
    stats["last_batch"] = {"batch": BATCH, "sources": len(selected), "sources_added": added,
                           "pages_created": len(NEW), "pages_updated": len(UPDATED), "pages_updated_list": UPDATED,
                           "archive_sessions": len(sessions), "index_status": "pending"}
    manifest["last_updated"] = now
    encoded = (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    manifest_path.write_bytes((b"\xef\xbb\xbf" if original.startswith(b"\xef\xbb\xbf") else b"") + encoded)
    with (VAULT / "log.md").open("a", encoding="utf-8", newline="\n") as log:
        log.write(f'\n- [{now}] INGEST source="{BATCH}" project=re-ff8 sources={len(selected)} sessions={len(sessions)} pages_created=4 pages_updated=2 mode=append status=archive-verified-index-pending note="65 fragments publics et préparateur lié ; 450+9 non rejoués ; S2/M2 non acceptés ; mission suivante préparée sans start ; exception QMD autorisée, mise à jour textuelle globale puis embed ff8-wiki seulement."\n')
    print(json.dumps({"sources": len(selected), "added": added, "sessions": len(sessions), "archive_hashes_verified": True,
                      "pages_created": NEW, "pages_updated": UPDATED, "manifest_source_count": len(sources)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
