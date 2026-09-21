# HANDOFF — Décompilation du pipeline graphique de la Battle Room

> Prompt de redémarrage. Coller tel quel dans un **nouveau chat**. Première action : §0.
> Ce document **prime** sur les HANDOFF antérieurs pour tout ce qui est pipeline graphique.
> Mission : décompiler et sémantifier un **maximum de fonctions** du pipeline de rendu
> graphique de la Battle Room de FF8 (FF8_EN.exe PC x86, base 0x400000).

## 0. CHECKPOINT COURANT — 2026-09-20 (prime sur tout le reste du document)

Session 2026-09-20 close : **48 / 68 EA du lot 6 fermés** (§0.2 : 0x69E420 → 0x6A30C0,
blocs A+B+C complets). **File restante = bloc D : 17 EA** (0x6A3960 → 0x6A5DB0, §0.2).
IDB sauvée en fin de session (save_final.py). Packs du bloc D : GÉNÉRÉS le 2026-09-21
(17/17, sizes relevées). Aucune voix en vol à l'arrêt.

Reste à traiter (ordre §0.2, 17 EA — classification de taille au pack du 2026-09-21) :
```
0x6a3960(67,stub) 0x6a3a30(39,stub) 0x6a3ab0(5,MAG_207_MAELSTROM,stub) 0x6a3ac0(5,MAG_207_FL,stub)
0x6a3ae0(41,stub) 0x6a3b70(161) 0x6a3d90(319) 0x6a41e0(295) 0x6a4710(380) 0x6a4ba0(450)
0x6a5120(424) 0x6a5650(48,stub) 0x6a5700(171) 0x6a5950(135) 0x6a5ad0(156) 0x6a5c90(100)
0x6a5db0(119)
```
NB : 0x6A3AB0/0x6A3AC0 (MAG_207) suivent le gabarit stub MAG_xxx (cf. 0x6A0D20/0x6A0D30 fermés) ;
gros blocs >900 o (analyse PAR BLOCS imposée) : 0x6A4BA0 (1408 o), 0x6A5120 (1316 o),
0x6A4710 (1168 o), 0x6A3D90 (1103 o), 0x6A41E0 (1010 o).

### 0.1 Méthode consolidée de session 2026-09-20 (à réappliquer telle quelle)

- **CELLULE = CONTRAT** : 1 fonction = pack → 4 voix en parallèle (c_a/c_b/semantic_a/semantic_b) →
  contrôle au sol (4 fichiers non triviaux) → C-R + semantic-R contre l'ASM → check parent §5.6 →
  push IDB append-only + save_database → livrable decomp/ + commit → catalogue + ledger.
- **finish_cell.py** (tools/_tmp_semantic_triple/) : chaîne unique push IDB + livrable + catalogue +
  ledger ; idempotent (SKIP push = succès au re-run) ; parseur IDBCOMMENT tolère tous les formats
  (inline, ## section, **gras**, avec parenthèses) ; --cmt-text pour override parent (arbitrages P) ;
  --no-draft assemble depuis c_reconciled.c/reconcile_notes.md/semantic_r.md.
- **FIX E stubs (≤~80 instr)** : 2 voix seulement (c_a + semantic_a) ; verdict UNCERTAIN de
  semantic_a levable par sondes IDA parent (probe_xrefs.py, probe_970.py — read-only) : caller
  unique + têtes des callees prouvent le domaine → CERTAIN arbitré sans escalade.
- **Providers** : glm-decompile MCP MORT. Voix = sous-agents decompileur/semantic-analyste GLM.
  **zai-coding-plan GELÉ à 91% de quota (réinitialisation 21h57)** — tout sur opencode-go.
  zai ≤2 voix simultanées si réactivé. 8 voix max en vol, lancements étalés 30-60 s.
- **Watchdog** : scan timestamps chaque tour, décisions groupées ; voix sans fichier à 15 min =
  morte → relance isolée sur l'autre provider ; complétion silencieuse sans fichier = même règle
  (2 cas : c_a 0x69FD50, sem_b 0x6A01B0 ; 1 relance zai livrée en double à ~16,5 min).
- **Pièges session** : (1) lancer le C-R AVANT le sem-R (2 oubli → push déjà fait + livrable
  manquant ; finish_cell idempotent récupère proprement au 2e run) ; (2) 4 voix par cellule,
  rattrapages immédiats si sous-comptage (0x6A2A90/0x6A2B80/0x6A3510) ; (3) Hex-Rays rend les
  `g_BattleOTBase` offsets en unités pointeur (+17 dwords) — l'ASM dit +0x44/-0xBC en octets ;
  (4) names IDA VIT_0_STATUS_MASK leurre pour imm32 0x01000000 ; (5) do-while sans garde,
  sar vs shr, movsx vs movzx : re-dériver de l'ASM toujours.

### 0.2 Lot 6 — file intégrale mag FX (20 EA restantes, dans l'ordre)

```
0x69e420 0x69e5e0 0x69e700 0x69e860 0x69e940 0x69e970 0x69e9a0 0x69eac0(MAG_213_STORM_BREATH)
0x69ead0(MAG_213_FL) 0x69eaf0 0x69eb70 0x69ee80 0x69eee0(Bitmask_SumS16_Runs) 0x69ef60 0x69fb30
0x69fd00 0x69fd50 0x6a01b0 0x6a06c0 0x6a0760 0x6a08d0 0x6a0a50 0x6a0af0 0x6a0be0 0x6a0c80
0x6a0d20(MAG_212_UNK8) 0x6a0d30(MAG_212_FL) 0x6a0d50 0x6a0dc0 0x6a1230(IndexLut_FillFF_AssignKeys)
0x6a1280 0x6a12b0 0x6a2760 0x6a2940 0x6a2a90 0x6a2b80 0x6a2f20 0x6a2f60 0x6a30c0 0x6a30f0 0x6a3220
0x6a3280 0x6a32a0 0x6a33c0 0x6a33e0 0x6a3400 0x6a3510 0x6a3630 0x6a3750 0x6a3800 0x6a38b0 0x6a3960
0x6a3a30 0x6a3ab0(MAG_207_MAELSTROM) 0x6a3ac0(MAG_207_FL) 0x6a3ae0 0x6a3b70 0x6a3d90 0x6a41e0
0x6a4710 0x6a4ba0 0x6a5120 0x6a5650 0x6a5700 0x6a5950 0x6a5ad0 0x6a5c90 0x6a5db0
```

Déjà clos mag FX : 0x6CBF90 (CERTAIN, callback BdLinkTask du sort MAG_112_UNK6), 0x6A79B0
(CERTAIN — tête réelle, EA catalogue 0x6A7A20 corrigée), 0x6A45E0 (LIKELY, dispatcher 8 handlers).
**0x6DA980 MagFx_IndexPackedNodeTree : NE PAS retoucher.**
Gros blocs >900 o (analyse PAR BLOCS imposée aux 4 voix) : 0x69ef60 (3019 o), 0x6a4ba0 (1408),
0x6a5120 (1316), 0x6a01b0 (1292), 0x6a4710 (1168), 0x6a0dc0 (1132), 0x69fd50 (1107), 0x6a3d90
(1103), 0x6a41e0 (1010), 0x6a12b0 (939), 0x6a2b80 (926), 0x69eb70 (782).
Stubs MAG_xxx (14 o) / MAG_xxx_FL (19 o) : traitement triple light acceptable (un slot peut
regrouper 2 stubs). Le pool de 5 tourne jusqu'à épuisement de la file ; un commit par fonction ;
index (catalogue + ledger) mis à jour après chaque vague.

### 0.3 Méthode et retour d'expérience de session (à appliquer tel quel)

- Triple GLM par fonction : 2 décompileurs (c_a.c/c_b.c, aveugles croisés) + 2 analystes
  (semantic_a.md/semantic_b.md, aveugles) en parallèle → puis C-R (c_reconciled.c +
  reconcile_notes.md) et semantic-R (semantic_r.md) tranchent CONTRE l'ASM, jamais une moyenne.
  Parent check bloquant (§5.3) avant tout push.
- Providers : `opencode-go/glm-5.3-flash#high` + `zai-coding-plan/glm-5.3-flash#high` en mix croisé
  (voix A d'un domaine ≠ voix B). **zai-coding-plan rate-limite au-delà de ~4 appels simultanés**
  (4 voix perdues sur une vague de 20) → ≤ 2 voix zai concurrentes, le reste opencode-go. Vérifier
  AU SOL que chaque voix a bien écrit son fichier (1 complétion silencieuse sans fichier constatée).
- Packs : `python tools/_tmp_semantic_triple/pack_semantic.py <EA>` (hexrays corrigé : passe par
  py_eval ida_hexrays, l'outil MCP `decompile` exige `addr`) ; `pack_batch.py` pour les vagues
  (éditer BATCH). **Contrôle à la génération : si instr du pack << SIZE/4 → chunks/tête ailleurs ;
  résoudre la vraie tête via idautils.Functions (leçon 0x6A79B0 : 0x6A7A20 = chunk de queue, tête
  réelle 0x6A79B0).**
- `callers.txt` : fn.addr peut être le SITE du call, pas le début de fonction (artefact récurrent)
  → toujours `get_func_attr(ea, FUNCATTR_START)`.
- `rpc_read.py` = helper IDA LECTURE SEULE pour les réconciliateurs (refuse set_*/save_database).
  Blind rules analystes : interdits hexrays.c, c_*.c, c_reconciled.c, decomp.md, glm_*.c,
  semantic_*.md, champ CMT de meta.json (tags antérieurs).
- Push : set_func_cmt **append-only** (préserver le glm-triple antérieur) +
  `idc.save_database(idc.get_idb_path())` — **save_database EXIGE idbname dans cette version
  d'IDA**. Gabarits : push_lot5_w1/w2/w3.py, push_6a79b0.py.
- Commit : `decomp(battle): <EA> <nom-court>` ; ne committer que decomp/ + ledger
  (semantic-certainty.md) ; catalogue obsidian et HANDOFF non suivis → édition sans commit.
- Livrable : format du modèle `decomp/0x559690__BattleTransition_InitScanlinesNormal.md` (méta
  Mode/Verdict/Push/Revue + C réconcilié intégral + Preuves 3–8 + Divergences). Fonctions avec
  livrable glm antérieur : conserver l'historique, ajouter les lignes de revue.
- Index après chaque vague : `decomp-function-catalog.md` (| EA | Nom | Palier | Confiance |) +
  `semantic-certainty.md` (9 colonnes, formats visibles in situ).
- Fin de session : save_database final + mise à jour §0/§3 de ce HANDOFF + commit ledger.

### 0.4 Exclusions déjà triées (ne pas traiter)
CRT 0x55ABB0–0x56B000 ; World_* 0x559140/0x559240 ; sub_559520 (plomberie main-loop) ;
sub_55A100 (CRT) ; thunks 5–6 o (0x559880, 0x56D750, 0x56D760) ; bloc Movie/BINK 0x55A140+ ;
0x56DCE0/0x56DD70 (GF boost, GLM, hors lot 5).

### Annexe A — briefs de relance des 2 réconciliateurs 0x6A1660 (si sorties absentes)

**C-R** : « Réconcilie c_a.c (15 blocs) vs c_b.c (23 blocs) contre asm.asm (paginé, sondages),
hexrays.c vérificateur seulement. Points : carte canonique unifiée ; prototype IDA callback =
leurre → unsigned char *ctx ; blend C @0x6A2651 A[4]=si registre hérité (commenter) ; dword 0xFF00
@0x6A1C62 ; divisions magiques /12 signé, /48 unsigned, /40, /25, /38, /28, 4700·rand/0x8000 ;
rampe dimmer 0..2300 (fade /12, plateau 0x8FC) vs "frame*512/3" de B. Produis c_reconciled.c +
reconcile_notes.md (blocs répétitifs résumés explicitement, jamais tus). Ni IDB, ni git. »

**semantic-R** : « Ferme les ouverts de semantic_a/b.md via rpc_read.py (lecture seule) :
① identité du sort — dump 0x6A0E60–0x6A0E90 (xref data de 0x6A1660 dans sub_6A0DC0) et remonte la
chaîne MagicList_Logic comme le R de 0x6CBF90 (→ MAG_112_UNK6) ; ② consommation du retour 0/2 par
sub_6A0DC0 ; ③ nom : trancher MagFx_SequenceTick (A) vs MagCinematicTimeline_Tick (B), ≥2 preuves ;
④ verdict CERTAIN si le caller se ferme, sinon LIKELY consolidé. Produis semantic_r.md :
divergences tranchées + verdict + commentaire IDB FR 3–4 phrases tag [semantic-triple 2026-09-19].
Ni IDB, ni git. »

## 1. Objectif

Pour chaque fonction graphique de la file : un **C réconcilié fidèle à l'ASM live** et/ou une
**analyse sémantique revue**, ancrés sur l'ASM (ground truth), l'arbre d'appel haut/bas, le
pseudo-C Hex-Rays (vérificateur seulement), le C GLM existant et la documentation wiki.
Livrable par fonction sous docs/tech/investigation/battle-static-discovery/decomp/<EA>__<Name>.md,
poussé dans l'IDB (commentaire append-only + save_database), commité git.

## 2. Périmètre graphique (décision 2026-09-15, inchangée)

**Inclus** : cœur OT/paquets GPU, draw-list/TIM/TPage/CLUT, render state interne, parsers mesh ISO,
émission de primitives, blit/staging texture, swirl/transition overlay, GTE (support transform),
soumission battle/menus, chemin render battle (acteurs/mesh), mag FX.
**Exclus** : vendor PC (RenderGL_*, RenderDDraw*, GfxDriver_*, constructeurs backend, gl*/wgl*/DDraw IAT),
CRT, thunks, nullsub, non-graphique (battle logic, AI, GF gameplay, son).
Règle de classement : **le corps, pas le nom** — le préfixe Gfx_* est trop large ; les graphismes
internes Square SKIP_NODECOMP sont promus dès qu'un decomp est produit.

## 3. État au 2026-09-20 (fin de session)

- Session 2026-09-20 : **48/68 EA du lot 6 fermés** (0x69E420 → 0x6A30C0). Bilan de verdicts :
  25 CERTAIN / 22 LIKELY / 1 LIKELY consolidé (compte précis dans semantic-certainty.md,
  tag `semantic-triple 2026-09-20`). Chaîne MAG_212 entièrement fermée et cohérente
  (thunk 0x6A0D20 → loader 0x6A0D30 → setup 0x6A0D50 → stepper 0x6A0DC0 → ticker 0x6A1660 ;
  FL cache dword_25101F8 ; table effets 0x1D972C0 stride 0x9C).
- Livrables decomp/ : ≈517 (≈469 + 48 nouveaux). Catalogue : decomp-function-catalog.md
  (+48 lignes, palier high/low, verdicts). Ledger : semantic-certainty.md (+48 lignes 9 colonnes).
- IDB : 48 commentaires `[semantic-triple 2026-09-20]` append-only + save_database après chaque
  push + save final (save_final.py). Aucun rename, aucun SetType, aucun patch.
- Outillage session : finish_cell.py (chaîne de clôture idempotente), probe_xrefs.py /
  probe_970.py (sondes read-only), save_final.py, rpc_read.py (lecture seule, inchangé).
- Commits de session : 47 `decomp(battle): <EA> <nom>` + 1 driver (opérateur) — voir git log.
- Reste : **20 EA mag FX (bloc D, §0.2)** + lots suivants du §6.

## 4. Outillage

- **MCP glm-decompile : MORT** (gateway morte). Pas de c_a.c/c_b.c/c_c.c : le fonctionnel s'extrait
  **directement de l'ASM** (ground truth). Sous-agents Task : modèle fireworks glm-5p3-flash (A/V/B),
  réconciliateur R = glm-5p3 si escalade 2+1.
- MCP ida-pro-mcp (HTTP JSON-RPC http://127.0.0.1:13337/mcp), IDB D:\Modding\ff8\retro-exe\FF8_EN.exe - 9.3.i64
  (confirmer via idc.get_idb_path()) ; fallback tools/_tmp_wave_review/glm_triple/ida_rpc.py.
- GrepAI (project-0-re-ff8-grepai), QMD **CLI uniquement** (qmd search/get, collection ff8-wiki ;
  jamais qmd update/embed depuis la campagne).
- Générateur de pack : tools/_tmp_semantic_triple/pack_semantic.py <EA>.
- PE référence : C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII\FF8_EN.exe,
  SHA-256 064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570.

## 5. Pipeline par fonction (obligatoire, une à la fois)

1. **Pack** (ordre imposé) : asm.asm (Intel + labels IDA loc_/def_/jpt_, pagination si >400 instr.),
   meta.json (prototype, stack frame), callees.txt + add_esp.txt, callers.txt + callgraph.json (2–5 callers min),
   grepai.txt, globals.txt (strides), qmd_search.txt + wiki.md, hexrays.c, C GLM existant + prompt_hints.txt.
2. **Modes** : 1+P (parent vérifie, ≤80 instr., CERTAIN requis), **1+V défaut** (A aveugle puis V adversariale
   re-dérivée de l'ASM), **2+1 escalade** (B aveugle puis R réconcilie **contre l'ASM**, jamais une moyenne).
   Escalade si : >200 instr. ou chunks multiples, nom de catalogue trop large/mensonger, A UNCERTAIN/CONFLICT,
   désaccord A/V sur rôle/nom/confiance, échec du check parent, ou verdict V = ESCALADE_2+1.
3. **Check parent** (bloquant) : chaque callee/caller cité existe ; strides développés (pas *232 si *0x1D0) ;
   polarité setcc/ja/jb cohérente ; largeur de retour (AL/AX/EAX) compatible ; nom justifié par ≥2 preuves.
4. **Push IDB** : append-only via set_func_cmt (jamais set_comments), tag [semantic-triple AAAA-MM-JJ] ;
   si un tag glm-triple/reconstructed-C/semantic-triple existe déjà → skip. Pas de rename, pas de SetType,
   pas de patch_asm. idc.save_database après chaque push (IDB hors git).
5. **Livrable git** : docs/.../decomp/<EA>__<Name>.md (ASM + C réconcilié + preuves 3–8 + divergences
   Hex-Rays/GLM + meta), puis commit. Ne jamais lancer N+1 avant le commit de N.

## 6. File priorisée (pipeline graphique, lots de 5, série)

- **Lot 1 — cœur OT/draw-list (clos)** : 0x45C870 OT_InsertPrimitive, 0x45D080 Gpu_DrawOTag,
  0x416D82 Gfx_CreateDrawList, 0x417464 Gfx_AllocDrawListBatch, 0x460F30 Gpu_EmitPolyF3.
- **Lot 2 — émission + scène (clos)** : 0x461800 Gpu_EmitPolyFT3, 0x461A90 Gpu_EmitPolyFT4, 0x460C20 et voisins.
- **Lot 3 — loaders modèles (clos)** : 0x5079B0, 0x507E20, 0x509B50, 0x508480, ParseVertices 0x50F900.
- **Lot 4 — GTE (clos)** : 0x45E5C0/0x45E610 AVSZ3/4, 0x45EE10 NCLIP, 0x460860 MVMVA, 0x45F930 SQR, GteState_* .
- **Lot 5 — transitions/swirl (CLOS 2026-09-19, 13 fonctions)** : 0x559530, 0x559690, 0x559750,
  0x5597F0, 0x559820, 0x559860, 0x559890, 0x559910, 0x559A10, 0x559A40, 0x559AF0, 0x559C70,
  0x559E40, 0x559F30, 0x56D1D0–0x56D770. `0x559240` **exclu** : frame world/input/render.
- **Lot 6 — mag FX (EN COURS)** : 0x6CBF90 ✓, 0x6A79B0 ✓ (catalogue 0x6A7A20), 0x6A45E0 ✓,
  0x6A1660 ✓ (MAG_212_Timeline_Tick), intégralité 0x69E4xx–0x6A5DB0 (§0.2) ;
  0x6DA980 MagFx_IndexPackedNodeTree LIKELY — ne pas retoucher.

## 7. Pièges (ne pas retomber)

- Noms de catalogue menteurs : CountAlive* = find-first ; SelectRandomMagicFromStock = get-qty
  (RNG 0x4837E0) ; LookupAbilityByIndex = registraire de callback ; ResetExecState = thunk ;
  SetPhaseFlag = switch 5–10. Décrire le comportement, ne pas « corriger » l'ASM vers le nom.
- Bit 0x40 inversé selon l'accesseur (GetMaskFromInfoField SET = ennemi ; GetTargetMaskFromMask SET = party).
- Battle_GetRandomInt 0x48F020 : retour **AL seul**, wrap inc al. GetRandomPartyMask 255→0 ;
  GetRandomMonsterMask 255→8. Occupancy exec : groupes 1+2 (0x497270, 0x4876B0).
- Hex-Rays type F_CHAR_DATA/BATTLE_SLOT_DATA en __int16* strides 232/104 **faux** (vrais : 0x1D0 / 0xD0).
- Émetteurs Gpu_EmitPoly* sans callers statiques : dispatch indirect funcs_461842 / bind 0x406DD0 →
  vérifier les **data xrefs** avant de conclure.
- 0x502E20/0x502D40 partagent le même nom IDA (thunk vs corps) : vérifier l'EA exacte au pack.
- ParsePolygons_GfMagic (0x5108A0, 0x9a2) proche du seuil chunk : découpage par blocs avant analyse.
- asm.asm tronqué / hexrays.c stub erreur : re-récupérer via MCP ; hangs GLM possibles (budget high au retry).
- **Nouveaux (session 2026-09-19)** : nom IDA `CONST_0.0125` rendu `CONST_0_0125` (point→underscore,
  lecture 0.125 piégeuse — dumper les bits) ; misnomers prouvés : `ENGINE_VAR1_RELATED_MUSIC`
  (sélecteur vidéo), `time_related_deltaTimeMaybe2` (frame pacer Sleep), `Alloc4C` en fait correct
  (alloc+unwind 0x4C), `VIT_0_STATUS_MASK_` = données primitive GPU, `Render_ESI_A60h_unused`
  appelé, `au_re_CompilerDebug_7` = pool-free garbagemem 0x467220.

## 8. Règles transverses

- Lots de 5 **en série** ; rapport de lot : EA | mode | confiance | nom | 1 phrase | A==V.
- Commit après chaque fonction close ; message decomp(battle): <EA> <nom-court> ; pas de --no-verify,
  pas d'amend, pas de push remote. Ne **jamais** committer tools/_tmp_semantic_triple/ ni tools/_tmp_wave_review/
  (gitignore) ; ne pas committer d'autres M user/benches.
- QMD CLI en lecture seule (jamais qmd update/embed) ; GrepAI lecture ; les sous-agents n'écrivent
  ni l'IDB ni git.
- ASM Intel + labels IDA uniquement (jamais AT&T). CRT, GL/DDraw/DSound, GetSingletonAddress,
  OutputDebugString, IAT : hors décompilation (relinker, ne pas décompiler un vendor).

## 9. Première action

1. Vérifier l'IDB avec `idc.get_idb_path()`, puis exécuter **§0.2** directement (68 EA mag FX,
   vagues de 5, triple GLM 2+1) jusqu'à épuisement de la file.
2. Fin de session : save_database final + mise à jour §0/§3 + commit ledger.

## 10. Ce que cette mission n'est pas

- Pas de portage Wicked/R1 (voir HANDOFF_R1-plan.md) — ne pas exécuter de fixtures.
- Pas de rename de masse, pas d'ingest wiki pendant la campagne, pas d'élargissement hors §2.
- Pas de « le parent résume » à la place d'une review d'opcodes.

## Références

- HANDOFF_glm-triple-review.md, HANDOFF_semantic-triple-review.md, PROMPT_semantic-triple-continue-2.md
- semantic-certainty.md (ledger 498), glm-mcp-function-budget.md (budget 484/14)
- obsidian-docs : projects/re-ff8/references/semantic-triple-pipeline.md, decomp-function-catalog.md
