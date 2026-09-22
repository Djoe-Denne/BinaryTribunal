---
title: Semantic Pipeline Sessions 2026-09-17
category: references
tags: [ff8, rendering, reverse-engineering, reference]
aliases: [semantic pipeline sessions, gfx pipeline campaign 2026-09-17, 0x416D82 verdicts]
sources:
  - C:/Users/djden/.codex/sessions/2026/09/17/rollout-2026-09-17T12-44-24-01a0aef7-b3ae-70f3-b84b-38e1a08e86c9.jsonl
  - C:/Users/djden/.codex/sessions/2026/09/17/rollout-2026-09-17T13-17-32-01a0af16-08d7-7b60-834b-883581d19a54.jsonl
  - C:/Users/djden/.codex/sessions/2026/09/17/rollout-2026-09-17T13-20-19-01a0af18-9815-7440-ae00-cf828aab684e.jsonl
  - C:/Users/djden/.codex/sessions/2026/09/17/rollout-2026-09-17T13-28-26-01a0af20-0518-7c40-8037-b26b33288e7e.jsonl
  - C:/Users/djden/.codex/sessions/2026/09/17/rollout-2026-09-17T13-35-50-01a0af26-caca-76f1-8d39-f2bf8107d356.jsonl
  - C:/Users/djden/.codex/sessions/2026/09/17/rollout-2026-09-17T13-40-16-01a0af2a-d95e-7073-9a1b-03610f28abe7.jsonl
  - C:/Users/djden/.codex/sessions/2026/09/17/rollout-2026-09-17T13-50-55-01a0af34-9c2b-78a3-b72f-163a65d5a298.jsonl
  - C:/Users/djden/.codex/sessions/2026/09/17/rollout-2026-09-17T13-16-21-01a0af12-bf18-7102-bc46-daf58122a371_01a0af14-f642-7973-accc-d96967c4bd49.jsonl
  - C:/Users/djden/.codex/sessions/2026/09/17/rollout-2026-09-17T20-17-35-01a0b096-9b3e-7d53-9c39-b6751762004a.jsonl
  - C:/Users/djden/.codex/sessions/2026/09/17/rollout-2026-09-17T21-21-53-01a0b0d1-7b0c-7330-adc0-749de19d758d.jsonl
  - C:/Users/djden/.codex/sessions/2026/09/18/rollout-2026-09-18T18-48-03-01a0b568-6070-74b2-8725-03a6945e604e_01a0b56b-0066-7d41-9bb5-733cceb8f9a4.jsonl
  - docs/tech/investigation/battle-static-discovery/HANDOFF_gfx-pipeline-decomp.md
summary: Verdicts A/V/R du 2026-09-17 sur le pipeline graphique Battle Room (0x45C870, 0x45D080, 0x416D82, 0x461800, 0x461A90...), lots 1-4 clos, checkpoint 0x559AF0.
provenance:
  extracted: 0.92
  inferred: 0.06
  ambiguous: 0.02
created: 2026-09-22T10:30:00+02:00
updated: 2026-09-22T10:30:00+02:00
---

# Semantic Pipeline Sessions 2026-09-17

Distillation des sessions du 2026-09-17 (le jour où la campagne de sémantification du **pipeline graphique Battle Room** a été lancée puis interrompue) : verdicts A/V/R par fonction, corrections apportées par les reviews adversariales, état de campagne et checkpoint de reprise. Le protocole lui-même (1+V, escalade 2+1, invariants IDB) est documenté dans [[projects/re-ff8/references/semantic-triple-pipeline]].

## Verdicts par fonction (tous CERTAIN après réconciliation) ^[extracted]

| EA | Nom retenu | Mode | Apport clé |
| --- | --- | --- | --- |
| `0x45C870` | OT insert primitive | 1+P | Allocation tête de liste dans le pool borné `0x60000` (nœuds `0x18`), chaînage 24 bits + octet haut à `node+0x16`, feuille (callees vide) avec 100+ callers code (parsers de polygones/draws). Cohérent avec `OT_InsertPrimitive`. |
| `0x45D080` | `Gpu_DrawOTag` | 1+V | Drain de l'OT PSX (terminateur `0xFFFFFF`), reconstruction du suivant en miroir de `0x45C870` (`(node+0x16)<<24 \| link&0xFFFFFF`), reset final `g_OtNodePoolCursor = g_OtNodePool`. |
| `0x416D82` | `Gfx_CreateDrawList` | 2+1 | Factory d'objet draw-list `0xEC` (236 octets, `memset`), cdecl 5 args, retour `EAX` pointeur ou 0. Charge/upload TIM (`TIMrelated_0`, `tim_mode` 0/1), bind backend via `sub_416CE9`/`sub_41E1AF`, réciproques `1.0/W`/`1.0/H`. Remappage type `0x11→0x0C`, parité de type inscrite `[sub+0x20]`. 67 callers code, tous création de textures/draw-lists. |
| `0x417464` | `Gfx_ReserveDrawListEntries` | 2+1 | Renommage sémantique (réservation d'entrées de draw-list). |
| `0x460F20` | `Gpu_EmitPolyF3` | 1+P | Correction d'adresse : `0x460F30` est une EA intérieure, la vraie entrée est `0x460F20`. |
| `0x460C20` | `Gpu_BeginPrimitivePass` | 1+P | Début de passe de primitives. |
| `0x460C90` | `Gpu_FlushCurrentDrawList` | 1+P | Flush de la draw-list courante. |
| `0x460CE0` | `Gpu_EndPrimitivePass` | 1+P | Fin de passe de primitives. |
| `0x4617F0` | `Gpu_EmitPolyFT3` | 1+V | Correction d'adresse : `0x461800` est une EA intérieure (zéro xref, pas de prologue), la vraie entrée est `0x4617F0`. Slot TPage/CLUT via `sub_461A30` (mots `+0x0E`/`+0x16`), émetteur variante `funcs_461842[pass*2+bit1(code)]`, UV 3 sommets (tables `dword_1CA9EB0` ou floats `1CB6038/C`), couleur `0xFFFFFF` si bit0, positions s16→float scale/offset. |
| `0x461A90` | `Gpu_EmitPolyFT4` | 2+1 | FT4 avec correction du rectangle UV. |
| `0x508480` | `BattleFile_CharacterLoad` | 1+P | Adaptateur de chargement asynchrone. |
| `0x509B50` | `MemMove_OverlapSafe` | 1+P | Nom corrigé (`MemMove_OverlapSafe`). |
| `0x559690` | `BattleTransition_InitScanlinesNormal` | 1+P | Correction d'adresse : `0x5596D0` est une EA intérieure. |

11 commentaires IDB `[semantic-triple 2026-09-17]` posés, `save_database` après chaque fonction, aucun rename/SetType/patch_asm/set_comments, un commit git par fonction (série `d423dd5`…`05b97f6`). ^[extracted]

## Corrections apportées par les reviews V (le rôle V a gagné 4 fois) ^[extracted]

Les sessions V du jour (rollout 13-28-26) ont corrigé les analyses A sur des points qui changent la lecture du pipeline :

- **Dispatch par code de primitive, pas par tag** — dans `Gpu_DrawOTag`, le dispatch indexé est fait par le **code de primitive u8 `[packet+7]`** (tables `g_TexturePageDirtyDispatch`/`g_SoftwarePrimDispatch`), pas par le tag OT ; le tag est un compte de mots (`dword_1CA89B0`). L'analyse A avait inversé les deux.
- **`0x461800` n'est pas une entrée** — zéro xref, pas de prologue, première instruction à `0x461801` : c'est la queue d'une fonction parente ; la vraie entrée `0x4617F0` a été retrouvée et committée.
- **Contrat d'entrée mi-fonction de `Gpu_EmitPolyFT3`** — seul `esi/ebp` + 8 octets de locaux sont hérités du parent ; `ebx/edi` sont sauvés en interne (`0x461832/33`) et `var_8` est pré-remplie par le parent. La voie FPU écrit aussi `vtx0`.
- **Collision de nom `funcs_461842`** — le nom de table entre en collision avec l'adresse du `call eax` (`0x461842`, milieu de code) : base de table impossible telle qu'imprimée par IDA, flag à re-vérifier contre les data xrefs.
- **Sous-boucle stride interne omise par A** dans `0x45D080` (`0x45d111`–`0x45d224`, condition `jg`), et retour `EAX=0` sur le chemin d'abandon.

Pattern confirmé : quand A et V dérivent indépendamment depuis le même pack ASM, V attrape surtout les erreurs de **contrat d'entrée** (EA réelle, registres hérités) et de **clé de dispatch**. ^[inferred]

## Caveats de la campagne du jour ^[extracted]

- `asm.asm` livré corrompu en ~10 plages (par ex. switchs `0x416E3F`, blocs `AllocIdentity/BufApp`, fail path de `0x416D82`, `0x45d197–0x45d1e0`) : structure confirmée par recoupement `callees.txt`/`callers.txt`, mais les plages restent à re-dumper avant toute révision ultérieure.
- Tables `byte_4173AB`/`byte_4173C7` non dumpées ; ordre des args de `sub_41E1AF` à confirmer contre `hexrays.c` (qui était en erreur de params ce jour-là).
- Le « miroir de 0x45C870 » cité par A pour `0x45D080` n'est pas vérifiable depuis le pack (`hexrays.c` et `wiki.md` en échec) — pas tranché.

## État de campagne et checkpoint ^[extracted]

- Lots 1–4 **clos** selon la règle skip/tag (lots 3–4 : skips car tags `glm-triple` existants). Lot 5 **engagé** : `0x559690` clos/committé.
- Point de reprise : **`0x559AF0 NormalTransition_Phase1`**, puis `0x559F30 BossTransition_Phase`, la famille swirl non taggée (`0x56D1D0`–`0x56D5F0`), et la famille Mag FX non taggée (`0x69E4xx`–`0x6A5DB0`). ≈61 EA graphiques restants (SKIP_NODECOMP Square, 14 chunks, re-reviews).
- `0x559240` **exclu** : corps world/input/render, pas `Gpu_DrawOTagCurrent` (erreur de classement corrigée dans le HANDOFF).
- État consigné dans `docs/tech/investigation/battle-static-discovery/HANDOFF_gfx-pipeline-decomp.md` (checkpoint 2026-09-17 après pause).
- Le moteur de reprise a deux fois buté sur l'infra la veille et le lendemain : quota Fireworks suspendu (412) puis rate limits `429 [1302]` sur `glm-5.3-flash` pendant les fan-out parallèles, et un pool de workers OCG (09-18) qui ne rendait aucun livrable (`OUTILS_OK` non reçu). Voir [[concepts/codex-agent-orchestration]] et [[concepts/9router-model-routing]] pour la face infra. ^[extracted]

## Lot de fan-out parallèle prévu (non exécuté) ^[extracted]

Le pool de 5 prévu pour le lot 5 attribuait une fonction par worker avec rôles spécialisés : Dirac (`0x559AF0`), Bernoulli (`0x559F30`), Pasteur (famille swirl), Tesla (Mag FX), un agent V (Einstein) en review adversariale des livrables, et un agent R en réconciliation 2+1 sur escalade. Règles : R ne tranchant jamais par moyenne (l'ASM gagne), ni push IDB ni commit par les workers. Les tentatives du 17 (rate limit) et du 18 (workers OCG muets) n'ont produit aucun livrable — le checkpoint `0x559AF0` reste valable. ^[extracted]

## Liens

- [[projects/re-ff8/references/semantic-triple-pipeline]] — protocole, invariants IDB, ledger de certitude.
- [[projects/re-ff8/references/battle-render-pipeline-entrypoints]] — chaîne OT→draw-lists→GPU que ces fonctions composent.
- [[projects/re-ff8/references/decomp-function-catalog]] — index des livrables decomp/.
- [[projects/re-ff8/re-ff8]] — état d'avancement projet.
- [[concepts/codex-agent-orchestration]] — mécanique orchestrator/pools utilisée pour la campagne.
