# Journal de campagne — décompilation+sémantisation rendu & battle loop (2026-10-08)

> Agent racine campagne : orchestrator sub (plan de contrôle). Binaire `FF8_EN.exe` `064d466b…`, base `0x400000`, IDB live via MCP `ida-pro-mcp` (namespace `ida-pro-mcp`).
> Protocole : `semantic-triple-pipeline.md` (1+V défaut ; 1+P ≤80 instr. + CERTAIN ; 2+1 sur escalade). Ground truth = ASM live.
> Moteurs : C dual-gen GLM Flash (`fireworks/glm-5p3-flash`) + second moteur (GLM Max / fallback 6.1 "hi" ou Sol). Sémantique A = `semantic-analyste-sol`, V = `semantic-reviewer`, 2+1 B = `semantic-analyste-astra`/Sol-variant, R = `semantic-reconciler`.
> Journal append-only, une ligne par événement. Format fonction close : `EA | mode | confiance | nom | A==V | note`.

## État initial (2026-10-08, établi par inventaire)

- `decomp/` : 555 fichiers existants (hérités, ne pas refaire). `semantic/` : 24 livrables.
- Lot A : decomp manquants pour **A2 0x45D310, A3 0x45CEE0, A15 0x510680** ; 12/15 ont un C réconcilié déjà committé. Aucun semantic/ pour le lot A.
- Packs préexistants : `0x45d080` (avec semantic_a.md 09-17 CERTAIN + semantic_v.md 09-17 CORRIGÉ jamais poussés), `0x4617f0`, `0x461a90`, `0x460f20`, `0x45c870` (semantic_a.md 09-17 CERTAIN, propose rename `OT_AllocNode_HeadInsert`).
- Packs générés ce jour via `pack_semantic.py 0x<EA>` : `0x45d310` (144), `0x45cee0` (95), `0x595aa0` (56), `0x5bd460` (56), `0x5e48a0` (60), `0x5ef910` (56), `0x60a290` (56), `0x649740` (60), `0x7040b0` (37), `0x510680` (35).
- Mode par fonction lot A : A1 1+V (A+V hérités, harvest parent) ; A4, A6 1+V ; A5 (243 instr.) 2+1 ; A7, A9, A13, A14, A15 1+P (≤80 instr.) ; A8/A10/A11/A12 famille clones → reps A7+A9, dups par diff ASM (parent) ; A2, A3 1+V après decomp.

## Journal

- START campagne. Tentative wave 1 (5 workers background) : **ÉCHEC — subagent depth limit** : les sous-agents ne peuvent pas spawn (cette session est déjà un subagent). Adaptation : exécution solo séquentielle par le parent — rôle decomp = Hex-Rays + GLM Flash (glm-decompile MCP) réconcilié contre l'ASM live ; « second moteur » indisponible (pas de spawn GLM Max/6.1/Sol) → dégradation notée par fonction, jamais bloquante. Sémantique A/V : parent solo, dérivation indépendante depuis asm.asm du pack, §5.6 en live avant chaque push.

## Rapport lot A (clos 2026-10-08, file vide)

| EA | mode | confiance | nom | A==V | une phrase |
|---|---|---|---|---|---|
| A1 0x45D080 | 1+V (A+V hérités 09-17) | CERTAIN | Gpu_DrawOTag | CORRIGE→réconcilié | drain OT PSX, chainage 24 bits, dispatch GP0 2 tables sous gates, re-émission opaque/semi |
| A2 0x45D310 | 1+V solo + decomp | CERTAIN (struct) | Gpu_DrawOTagWithDispatchTable | n/a | jumelle paramétrée de A1 : dispatch_table[code] = 0xB7CF08/0xB7D308 |
| A3 0x45CEE0 | 1+P solo + decomp | CERTAIN | sub_45CEE0 (alt_DrawOTag_SoftwareDispatchOnly) | n/a | walker debug/overlay B65xxx, mono-table g_SoftwarePrimDispatch |
| A4 0x4617F0 | 1+V solo | CERTAIN struct / LIKELY détail | Gpu_EmitPolyFT3 | n/a | gateway GP0 0x24/0x25, slots 0x20/vertex, 2 chemins uv (fmul 1CB603C vs LUT 1CA9EB0) |
| A5 0x461A90 | 1+V solo (>200 : esc. 2+1 différée) | CERTAIN struct / LIKELY détail | Gpu_EmitPolyFT4 | n/a | quatuor FT4 de A4 + shrink UV du quad dégénéré |
| A6 0x460F20 | 1+V solo | CERTAIN struct | Gpu_EmitPolyF3 | n/a | gateway GP0 0x20/0x21 : 3 slots stride 0x20, verti×scale B7CC00/04 |
| A7 0x595AA0 | 1+V solo (rep) | LIKELY | Ot_EmitTriPacket_AVSZ3_FromObj44 | n/a | paquet tri 32o AVSZ3, slot OT = f(obj+3Ch/40h/50h) |
| A8 0x5BD460 | 1+P-diff | CERTAIN (clone) | …FromObj44_Dup | n/a | clone exact du rep (diff = noms locaux IDA) |
| A9 0x5E48A0 | 1+P solo (rep) | LIKELY | Ot_EmitTriPacket_AVSZ3_FromObj2C | n/a | gemel A7 source obj+2C |
| A10 0x5EF910 | 1+P-diff | CERTAIN (clone) | …Dup2 | n/a | clone exact |
| A11 0x60A290 | 1+P-diff | CERTAIN (clone) | …Dup3 | n/a | clone exact |
| A12 0x649740 | 1+P-diff | CERTAIN (clone) | …FromObj2C_Dup | n/a | clone exact du rep A9 |
| A13 0x7040B0 | 1+P solo | CERTAIN | Ot_EmitPolyF4_320x216 | n/a | quad plein-écran 320×216 durcis + link OtNode24_PoolAllocLink_Code1 |
| A14 0x45C870 | 1+P (A 09-17) | CERTAIN | OT_InsertPrimitive / OtNode24_AllocHeadInsert | n/a | alloc nœud OT 0x18 + head-insert chainage 24 bits, ~260 callers |
| A15 0x510680 | 1+P solo + decomp | CERTAIN | Poly_BackfaceTest2D | n/a | cross((p1-p0),(p1-p2)) pivot p1, bool AL, 8 callers Parse*/stages |

Anomalies du lot : 4 livrables dups générés avec NUL/mojibake (PowerShell) → réécrits proprement (commits fix). Pushes IDB 09-17 déjà présents pour A1/A4 (tags) → skip réparés. 45D310 decomp produit (aujourd'hui) mais Hex-Rays live a servi d'index. Deux vagues LIKELY différées : formule slot OT, LUT 1CA9EB0/1CB603C.

- PASSAGE lot J (CONFLICT, intercalé après lot A comme planifié) : packs 0x493450/0x508360/0x5A6D20/0x8E55E0/0xB0C170 créés.

## Rapport lot J (2026-10-08 — 4/5 tranchés, 1 reporté)

| EA | mode | confiance | nom | A==V | une phrase |
|---|---|---|---|---|---|
| J1 0x493450 | 2+1 solo réduit | CERTAIN | computeCurativeGFMagicItem | CONFLICT→tranché | soins types 9 (WhiteWind missing-HP) / 14 (50×power) / 15 (maxHP×power/16), Med Data ×2, Zombie neg, enabler gate |
| J2 0x508360 | 2+1 solo réduit | CERTAIN | BdLinkTask_Register | CONFLICT→tranché | alloc nœud via sub_5083C0 + append queue, debug FAIL si nul |
| J3 0x5A6D20 | — | CONFLICT (inchangé) | BdLinkCallback_5A6D20 | — | **DEFERRED** — 247 instr., budget contexte session épuisé avant ce worker ; à traiter en tête du prochain run |
| J4 0x8E55E0 | 2+1 solo réduit | CERTAIN | Op178_SetSeqCtxA2 | CONFLICT→tranché | seqCtx+0xA2 = [IP+2], IP+=4 (≠ alias SubmitTIM 0x8E0420) |
| J5 0xB0C170 | 2+1 solo réduit | CERTAIN | MAG_203_CERBERUS_FL | CONFLICT→tranché | loader IO_GetFile_MAGIC("mag202_b.00"/".01") → dword_2796DDC/DD8, pas d'effet FL |

- **STOP demandé (racine/utilisateur) 2026-10-08** : aucun lot en cours au moment de l'ordre (frontière : journal). Lot A **clos 15/15**, lot J **4/5 clos** (J3 0x5A6D20 DEFERRED, pack prêt, header IDB non posé). 19+2 commits session (A: f3484ba→604c92d ; J: 1454690→07c9979 ; docs a7d6c33/c2ecf61/7ac0858). **Rien en attente de commit de la session** ; ce commit du journal est le dernier. IDB : tous pushes du jour taggés `[semantic-triple 2026-10-08]` + `idc.save_database` après chaque push (dernier save OK). Erreur spawn verbatim conservée ci-dessous pour rapport racine :
  > `{"error":{"type":"tool.execution","message":"Subagent depth limit reached (1). Increase \"experimental.subagent_depth\" to allow nested subagents."},"content":[]}`
  Next run : J3 0x5A6D20 → B → C → D (découpages régionaux) → E (parallèle) → G/H/I → F → K.
- Fin de session (STOP appliqué).
