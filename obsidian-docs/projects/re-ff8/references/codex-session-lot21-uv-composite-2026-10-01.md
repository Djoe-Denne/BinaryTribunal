---
title: "Session Codex — Lot 21 UV/RHW et composite (2026-10-01)"
category: references
tags: [ff8, rendering, evidence-processing, reference]
aliases: [session lot21 uv composite, codex lot21]
sources:
  - C:/Users/djden/.codex/sessions/2026/10/01/rollout-2026-10-01T17-23-45-01a0f810-7370-70e0-bdaf-b6509350ee37.jsonl
  - .serena/memories/battle_driver_lot21.md
  - .serena/memories/project_overview.md
  - .serena/memories/environment_mcp.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/IDB_SYNC_lot21_2026-10-02.json
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/IDB_SYNC_lot21_2026-10-02.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/IDB_SYNC_lot21_2026-10-02.receipt.json
summary: >-
  Session visible de pilotage du lot 21 : 1MCP/Serena rétabli, UV rot0+RHW et
  falaise fermés, ordre hôte distinct de l’OT global, 23 tests et 13 hashes;
  UI/blend PARTIAL et QMD non reconstruit.
provenance:
  extracted: 0.96
  inferred: 0.03
  ambiguous: 0.01
created: 2026-10-02T18:10:00+02:00
updated: 2026-10-02T18:36:00+02:00
---

# Session Codex — Lot 21 UV/RHW et composite

La session visible a rétabli Serena/1MCP après des reprises et une interruption
par limite d’usage, puis a conduit la campagne offline Lot 21. Le transcript
assaini, sans instructions injectées ni plomberie d’outils, est archivé dans
[[_archives/codex-transcripts/2026-10-01-lot21-uv-composite]].
SHA-256 du Markdown assaini :
`5c2cf23687f5cf2f6a373373df1dc2b233e03fa50044b97383239836ba8a3185`.

Les conclusions durables sont déjà distillées: **rot0 + RHW** est confirmé; `AF00`
porte ciel et falaise blanche, `9E20` le terrain et `8E40` l’horizon. L’ASM établit
que l’ordre capturé est une soumission hôte TPage/état et non l’identité d’un OT
global. Les 23 tests et les 13 hashes Lot 21 sont validés. ^[extracted]

Le résultat reste **PARTIAL**: l’état texture hérité du slot 49, les états blend/
depth hôte et l’identité OT globale manquent au contrat de dump. QMD n’a pas été
reconstruit par règle de session; le contrôle global reste dégradé par des sources
historiques non gérées, sans contredire la vérification ciblée Lot 21. ^[extracted]

## Mémoires Serena

Les mémoires suivantes ont été créées ou mises à jour par ROOT durant cette session;
elles sont listées ici pour provenance et ne sont pas modifiées par cette ingestion :

- `.serena/memories/battle_driver_lot21.md`
- `.serena/memories/project_overview.md`
- `.serena/memories/environment_mcp.md`

## Synchronisation IDB

Le 2026-10-02, ROOT a synchronisé les conclusions Lot21 dans dix fonctions IDA :
dix commentaires idempotents, un rename certain (`Gpu_EndPrimitivePass` à
`0x460CE0`) et un prototype `void __cdecl()`. La validation indépendante confirme
un bloc par fonction, les commentaires historiques préservés et les octets de code
inchangés. ^[extracted]

## Related

- [[projects/re-ff8/references/driver-replay-fond-uv-composite-lot21-2026-10-01]]
- [[projects/re-ff8/references/af3dn-captures-evidence-catalog-lot21]]
- [[projects/re-ff8/references/battle-render-pipeline-entrypoints]]
- [[projects/re-ff8/re-ff8]]
