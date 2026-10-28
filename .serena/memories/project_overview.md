# re-ff8 — Reverse engineering Final Fantasy VIII

Campagne active : battle-static-discovery — certification sémantique des fonctions battle
de l'EXE FF8 1.2 US (rôle, nom, confiance, preuves ASM).

Sources de vérité (ordre d'autorité) :
1. IDB IDA via MCP ida-pro-mcp (l'ASM live est la ground truth unique).
2. AGENT.md, HANDOFF_semantic-triple-review.md (§5 pipeline, §8 pièges), PROMPT_semantic-triple-continue.md.
3. Ledger docs/tech/investigation/battle-static-discovery/semantic-certainty.md.
4. Skills .agents/skills/ff8-*.

Livrables git : semantic/<EA>__<Name>.md, decomp/<EA>__<Name>.md (+ ledger si la classe change).
Packs temporaires : tools/_tmp_semantic_triple/<ea>/ (jamais commités).
Registry outils : tools/battle_static_registry.py.

## Driver passthrough — état lot21 (2026-10-02)
Mémoire détaillée : battle_driver_lot21.
Rapport : docs/tech/investigation/battle-static-discovery/driver-passthrough/CAMPAIGN_lot21_2026-10-01.md.
Wiki : obsidian-docs/projects/re-ff8/references/driver-replay-fond-uv-composite-lot21-2026-10-01.md.
UV capturés+RHW confirmés; ciel/falaise/terrain et entités restaurés. ND08 ordre hôte par listes TPage/état, pas OT global; blend et UI restent candidats. Verdict PARTIAL, 23 tests PASS. Ne pas répéter capture live ni présenter index QMD comme actualisé.