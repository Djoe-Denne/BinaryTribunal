---
title: Semantic Triple Decompilation Pipeline
category: references
tags: [ff8, reverse-engineering, evidence-processing, battle-system]
aliases: [triple GLM, semantic triple, campagne de decompilation, 1+V 2+1 pipeline]
sources:
  - docs/tech/investigation/battle-static-discovery/HANDOFF_glm-triple-review.md
  - docs/tech/investigation/battle-static-discovery/HANDOFF_semantic-triple-review.md
  - docs/tech/investigation/battle-static-discovery/PROMPT_semantic-triple-continue.md
  - docs/tech/investigation/battle-static-discovery/PROMPT_semantic-triple-continue-2.md
  - docs/tech/investigation/battle-static-discovery/semantic-certainty.md
  - docs/tech/investigation/battle-static-discovery/glm-mcp-function-budget.md
  - tools/_tmp_semantic_triple/
  - tools/_tmp_wave_review/
summary: Methode de decompilation et semantification des fonctions FF8 : dual-gen GLM reconcilie, analyse/review 1+V avec escalade 2+1, push IDB append-only, ledger de certitude sur 498 fonctions.
provenance:
  extracted: 0.85
  inferred: 0.15
  ambiguous: 0.0
created: 2026-09-17T12:00:00+02:00
updated: 2026-09-22T10:50:00+02:00
---

# Pipeline triple GLM et semantic triple
Deux campagnes paralleles sur la file des 498 fonctions wiki (budget GLM : 484 traitables en un appel, 426 high sous 200 instr., 58 high 200-600, 14 chunks de plus de 600 instr. hors campagne) :
- **Triple GLM** (HANDOFF 2026-09-12) : produire un C reconcilie fidele a l ASM live. Deux generations GLM en parallele (meme prompt, temperature 0.2), puis une reconciliation GLM-R (temperature 0.0) recevant VERSION_A et VERSION_B. Le parent verifie 3-4 points ASM (strides, polarite setcc/jump, add esp, largeur de retour AL/AX/EAX) avant push IDB. Le C pousse est le livrable : SetType du prototype + append du listing avec tag de date, puis commit de decomp/<EA>__<Name>.md. Hex-Rays ne sert qu a la verification finale, jamais d entree.
- **Semantic triple** (protocole revise 2026-09-15) : confirmer le SENS sans produire de C. Defaut 1+V : Grok-A analyse aveugle (pack seul, contrat role/confiance/nom catalogue/in-out/preuves 3-8), puis Grok-V review adversariale re-derivee de l ASM. Le 2+1 (B aveugle puis R) est une ESCALADE, pas le chemin normal - retenu apres 3 fonctions ou B n a tranche qu une fois sur trois.

## Pack de contexte
Outillage parent : tools/_tmp_semantic_triple/<ea>/ avec ordre impose - asm.asm (Intel, labels IDA, pagination si plus de 400 instr.), meta.json (prototype, stack frame), callees.txt + add_esp.txt, callers.txt + callgraph.json (2-5 callers minimum), grepai.txt, globals.txt (strides F_CHAR 0x1D0, BATTLE_SLOT 0xD0, exec 1+2), qmd_search.txt + wiki.md (recherche ff8-wiki CLI seulement), hexrays.c, et le C GLM deja produit + prompt_hints.txt. Generateur : tools/_tmp_semantic_triple/pack_semantic.py <EA>.

## Modes et escalade 2+1
1+P (parent verifie, fonction courte a confiance CERTAIN), 1+V (defaut), 2+1 (filet). Escalade si : plus de 200 instr. ou chunks multiples, nom de catalogue trop large ou mensonger, A en UNCERTAIN/CONFLICT, desaccord A/V sur role nom ou confiance, echec de la verification parent (callee invente, stride faux, polarite, AL vs EAX), ou verdict V ESCALADE_2+1. B ne voit ni A ni V ; R reconcilie CONTRE L ASM, jamais une moyenne - si A et B contredisent un opcode, l ASM gagne.

## Invariants IDB et cadence
Push IDB append-only : set_func_cmt avec tag de date (jamais set_comments), pas de rename, pas de SetType (fait par la vague GLM), pas de patch_asm ; idc.save_database apres chaque push (IDB hors git). Une fonction a la fois, lots de 5 en serie, commit git par fonction close (message decomp(battle) ou semantic(battle) + EA + nom court, sans --no-verify ni amend), rapport de lot EA - mode - confiance - nom - une phrase - A==V. QMD en CLI uniquement (qmd search, collection ff8-wiki), jamais qmd update ni embed depuis ces campagnes.

## Ledger de certitude (semantic-certainty.md)
Classes sur 498 fonctions : CERTAIN 23, LIKELY 285, UNCERTAIN 3, CONFLICT 5, SKIP_L3 25 (vendor PC : GL/DDraw/D3D, CRT, thunks, constructeurs backend), SKIP_CHUNK 14, SKIP_NODECOMP 143. File Grok restante : 293 dont 218 dans la plage bataille 0x47xxxx-0x51Bxxx. Reclassement du 2026-09-15 : la regle est le CORPS, pas le nom - le prefixe Gfx_* est trop large ; les graphismes internes Square sont promus des que le decomp existe (ex. SetRenderState : ecriture de engine+0xA84[type]).

## Outillage courant (apres mort du MCP glm-decompile)
Le MCP glm-decompile n existe plus (gateway morte) : le C ne se genere plus par MCP, le fonctionnel s extrait directement de l ASM. Sous-agents Task avec modele fireworks glm-5p3-flash (A/V/B), reconcileur R glm-5p3 en escalade ; MCP ida-pro-mcp en HTTP local avec fallback tools/_tmp_wave_review/glm_triple/ida_rpc.py. Perimetre courant (continue-2, decision 2026-09-15) : PIPELINE GRAPHIQUE SEULEMENT - coeur OT/paquets GPU, draw-list/TIM/TPage/CLUT, render state interne, parsers mesh ISO, emission de primitives, blit/staging texture, overlay swirl/transition, GTE de support, chemin render battle, mag FX. Exclus : vendor PC, CRT, non-graphique.

## Pieges recurrents
Noms de catalogue menteurs (CountAlive = find-first, SelectRandomMagicFromStock = get-qty avec RNG 0x4837E0, LookupAbilityByIndex = registraire de callback, ResetExecState = thunk, SetPhaseFlag = switch 5-10) ; bit 0x40 inverse entre accesseurs (GetMaskFromInfoField SET = ennemi, GetTargetMaskFromMask SET = party) ; Battle_GetRandomInt 0x48F020 retourne AL seul avec wrap inc al ; GetRandomPartyMask 255 vers 0, GetRandomMonsterMask 255 vers 8 ; occupancy exec en groupes 1+2 (0x497270, 0x4876B0) ; pointeurs F_CHAR_DATA / BATTLE_SLOT_DATA types int16* dans Hex-Rays avec strides 232/104 faux (vrais : 464 / 0xD0) ; emetteurs Gpu_EmitPoly* sans callers statiques (dispatch indirect funcs_461842, verifier les data xrefs) ; familles clones (GF render ~20, emit menus ~8, mag FX ~10) : 1-2 representants en semantique complete, le reste par diff ASM.

## Etat des livrables (2026-09-17)
- 437 fichiers decomp/ committes (425 palier high, 12 low) ; index par famille : [[projects/re-ff8/references/decomp-function-catalog]].
- 33 packs tools/_tmp_semantic_triple : 24 analyses A, 6 reviews V, 5 B aveugles, 17 reconciliations R.
- 3 fonctions semantiques closes en 2+1 (0x47CA90 Field_Encounter_RollAndSelectScene, 0x47CCB0 main::FFBattleDirector_battleLoop, 0x47CE10 FFBattleInitSystem), toutes R=CERTAIN avec push IDB.
- Vague locale anterieure tools/_tmp_wave_review : 93 fonctions traitees (48 recensees dans le budget wiki).
- Journee du 2026-09-17 : campagne graphique lancee, lots 1-4 clos, verdicts A/V/R et corrections V dans [[projects/re-ff8/references/semantic-pipeline-sessions-2026-09]].

## Liens

- [[projects/re-ff8/re-ff8]] — vue d'ensemble du projet.
- [[projects/re-ff8/references/battle-iso-migration-milestones]] - unites SEM/CLIFT qui consomment ces livrables.
- [[projects/re-ff8/concepts/battle-system-map]] - mecanismes cibles.
- [[projects/re-ff8/concepts/external-battle-renderer-architecture]] - piste presentation qui recevra la semantique graphique.
- [[projects/re-ff8/concepts/enemy-ai-vm]] et [[projects/re-ff8/concepts/command-action-pipeline]] - familles EnemyAI et exec/pending du catalogue.
- [[projects/re-ff8/concepts/gforce-cinematic-architecture]] - familles GF_ du catalogue.
