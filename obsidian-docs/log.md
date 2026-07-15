---
title: Wiki Log
---

# Wiki Log

- [2026-06-02T16:28:00+02:00] INIT vault_path="C:\Users\djden\source\repos\retro-eng\re-ff8\obsidian-docs" categories=concepts,entities,skills,references,synthesis,journal,projects,_archives,_raw
- [2026-06-02T16:37:00+02:00] INGEST source="docs" pages_updated=0 pages_created=16 mode=full
- [2026-06-02T16:50:00+02:00] INGEST source="ai-prompt,ff8re,tools" pages_updated=9 pages_created=6 mode=append
- [2026-06-02T17:04:00+02:00] CLASSIFY rule="docs => documentation; ai-prompt/ff8re/tools/python/yaml workflows => skills" pages_reclassified=3
- [2026-06-02T17:10:00+02:00] INGEST source="binaryTribunal" project="binary-tribunal" pages_updated=0 pages_created=6 mode=append boundary="separate project; no FF8 factual docs linked to Binary Tribunal"
- [2026-06-02T17:24:00+02:00] QUERY query="Quelles sont encore les zones qui restent à éclaircir sur la boucle de combat ? Tu peux commencer par des concepts généraux qui ne sont pas encore couverts et descendre jusqu'aux plus petits concepts." result_pages=11 mode=normal escalated=true
- [2026-06-09T19:00:00+02:00] INGEST source="obsidian-docs/_staging/investigations (21 files)" project="re-ff8" pages_updated=13 pages_created=6 mode=append note="static staging merge; runtime validation still pending"
- [2026-06-11T11:26:00+02:00] QUERY query="Sur la base de tes connaissances et de tes récentes découvertes, est-ce que tu penses qu'il serait possible d'avoir une commande binaire tribunal pou déclencher un combat?" result_pages=5 mode=normal escalated=true
- [2026-06-13T16:30:00+02:00] INGEST source="ai-prompt/completed (4 live follow-ups) + IDA static + read-only live corroboration" project="re-ff8" pages_created=1 pages_updated=5 mode=append note="closed: RNG no-CRT-rand, exec-queue group1/2 routing, targeting slot-7 {3,4,5,6}, status 0x180800 damage+status invuln & Angel Wing 0x02000000"
- [2026-06-13T17:20:00+02:00] INGEST source="live debugger elemental matrix (elem_def injection + Fire casts) + evidence/2026-06-13T17-20-00_ELEMENTAL_HP_OUTCOME_MATRIX_001.json" project="re-ff8" pages_created=1 pages_updated=2 mode=append note="closed elemental magic matrix: (900-elem_def)/100 confirmed x2.0/x1.0/x0.5/x0/x-1.0; absorb->heal flip proven (HP increased)"
- [2026-06-13T18:00:00+02:00] INGEST source="ai-prompt/completed (3 static follow-ups) + IDA static decompilation" project="re-ff8" pages_created=1 pages_updated=5 mode=append note="static closures: AI relays 0x70=camera-barrier/0x71=actor-ready-callback (sub_5085F0/sub_502F30 via BattleTaskQueue); Doom timer10/bit0x400 -> EnqueueSpecialAction type5 group-0 -> arbitration/resolve/ApplyDamageOrHeal (terminal KO bytes runtime-pending); escape commit + mode5 shared with victory (BATTLE_RESULT_CODE switch, RNG num 16/64/128/255, relay 0x70+0x74); camera control word = dword_1D97704 (partial, per-bit decode runtime-pending)"
- [2026-07-12T12:25:00+02:00] INGEST source="IDA static + live frame/callback/BdLink/cleanup matrices" project="re-ff8" pages_created=1 pages_updated=8 mode=append note="proved FFBattleModule whole-frame ownership, corrected 3/3/1/4 guard, classified HUD/action callbacks as authoritative and file/BdLink as replaceable presentation, traced victory cleanup through FFBattleExitSystem into BattleRewardMenu_MainLoop"
- [2026-07-12T13:45:00+02:00] INGEST source="Wicked FF8 external renderer architecture cluster" project="re-ff8" pages_created=6 pages_updated=10 mode=append note="documented x86 bridge + warm x64 host, pointer-free semantic model, Wicked APIs, LegacyFF8RenderPass, P0-P11 migration gates, visual parity, rollback, and implementation skill; no renderer code claimed"
- [2026-07-15T13:17:00+02:00] QUERY query="Comment fonctionne l'animation des G-Forces : fonctions hardcodées ou fichiers de données ?" result_pages=4 mode=normal escalated=false
- [2026-07-15T13:25:00+02:00] QUERY query="Adresses mémoire importantes pour les données et la state machine d'animation GF" result_pages=3 mode=normal escalated=false
- [2026-07-15T13:31:00+02:00] QUERY query="Signification de l'index N dans les noms de fichiers GF" result_pages=2 mode=normal escalated=false
