# BdLinkCallback_5A6D20 @ 0x5A6D20 — tranchage CONFLICT (2+1 : A + B aveugle + R)

- Confiance: LIKELY (mécanique 100 % opcode-prouvée + vérifiée live IDB ; CERTAIN bloqué uniquement par wiki ff8-wiki indisponible au moment du R + sens métier de `0xFFFE` non établi)
- Nom catalogue: **confirme** (structurel exact, non descriptif — ≥2 preuves) ; proposition markdown seule: `BattlePresentation_MagicActorSequenceTick_5A6D20`
- Mode: 2+1 — A = semantic-analyste-sol (session 2, 15:02), B = semantic-analyste-astra aveugle (session 2, 15:02), R = semantic-reconciler (session 3). Livrable détaillé: `tools/_tmp_semantic_triple/0x5a6d20/semantic_r.md`
- Verdict CONFLICT: **tranché contre l'ASM** — callback BdLink de séquence de présentation d'effet de magie acteur, tické par la pompe, retour 2 = demande de retrait (conjecture convergente A/B promue en établi par preuve live)
- Push IDB: oui, tag `[semantic-triple 2026-10-08]`, pas de rename, `idc.save_database` après push
- Preuves §5.6 parent (live IDB 2026-10-08):
  - `xrefs_to 0x5A6D20` = 1 seule ref **DATA** (type=1, iscode=0) depuis `0x5A6C88` : `push offset BdLinkCallback_5A6D20` → `call BdLinkTask_Register` (list_head `dword_2258A80`) — pas de call direct, consommation indirecte par la pompe = rôle callback confirmé
  - Pompe générique `0x508420` : `call dword ptr [esi+8]` @`0x508434`, `test al,2` @`0x50843A`, `jz` keep, sinon unlink (clear `word [esi]`, relink next) — contrat retour bit 1 prouvé ; clones byte-identiques `0x539164/0x681282/0x6B1D72/0x6D2EF2`
  - Compteur WORD nodal `[+0xC]` : init 0 à l'inscription (`mov word ptr [eax+0Ch],0` @`0x5A6C97`), phases lues/écrites dans le corps (`mov dx/si/ax`, `movsx`, `cmp word ptr [edi+0Ch], 3Ah` @`0x5A6E9F`)
  - Enfants cités existent (func starts live) : `sub_5A7660/5A7BA0/5A7CD0/5A8340/5A70A0` ; `T = byte_1D98214[+idx]` lu @`0x5A6DD6`/`0x5A6DEE` ; `dword_225993C = 4` posé par le pack avant inscription @`0x5A6CAA` (lève la question ouverte de A sur T)
  - Fin de vie: `mov ecx, off_B8B7D8` @`0x5A7066` → `mov dword_1D972E8[eax], ecx` @`0x5A706F` — **écriture de la valeur globale courante** (B avait raison contre la « restauration » de A ; aucune sauvegarde antérieure du DWORD dans la fonction)
  - Polarité: `setz dl` @`0x5A6CBF` (M = `word [[dword_22598A0+4]+4] == 0xFFFE`, figé à l'installation dans `dword_2259940` @`0x5A6CC2`, côté installateur MAG_259)
- Divergences A/B arbitrées par R: (1) retour 2 « plausible non prouvé » (A et B) → **prouvé live** ; (2) nom « trop large » (A) vs « confirme » (B) → **confirme** (inscription queue + consommation pompe) ; (3) acteur +0x28 fin : restauration (A) vs écriture globale (B) → **B**

## Analyse réconciliée

- Rôle (1 phrase) : tâche BdLink de séquence de présentation d'effet de magie pour un acteur — tickée par `BdLinkTask_Pump`, compteur WORD nodal `[+0xC]` à travers phases 0 (pose bit 0x800) / 1 (anim+son) / 2 (T = somme `byte_1D98214` + 3 enfants) / 0x3A (4e enfant + 6 copies DWORD), rampes helper/caméra/GTE en entrée-sortie, retour 2 = demande de retrait.
- In / Out / Effets : in = node cdecl (callback `[+8]`, pool stride 0x24 × 0x64, queue `dword_2258A80`) ; out = EAX 0/2, contrat porté par AL bit 1 (`test al,2` @`0x50843A`) ; effets = sous-tâches enfants inscrites sur `dword_2258A80` (4 pushes list_head dans le corps), M/global `dword_225993C/2259940` posés côté installateur MAG_259.
- Questions ouvertes : sens métier de `0xFFFE` (M), du bit acteur 0x800, de `off_B8B7D8` (valeur écrite en +0x28) et des 6 DWORD copiés — non établis, aucune invention ; corps des 5 enfants (`sub_5A7660/5A7BA0/5A7CD0/5A8340/5A70A0`) non analysés (hors périmètre J3) ; driver périodique qui pompe la queue frame par frame hors pack (pompe générique prouvée, contrat inchangé).

## Avenant correction C historique 2026-10-09 — DRAFT, parent §5.6 pending

Append documentaire, pas nouvelle génération sémantique/vote/reclasse : nom et classe historiques conservés. Les anciennes conclusions de fidélité/clôture du C ordinaire sont supersédées par le **modèle x86 borné** du premier fence actif decomp (SHA `8364098674530453ece3ec71ffc0be22e47e5162b50890a1407bc4560166a82d`), pas par le second fence d'archive. La mécanique historiquement « opcode-prouvée » ne prouve ni backend fourni ni équivalence compilée/native/ISO/runtime ; la confiance ne dépend donc pas uniquement des incertitudes wiki lorsqu'on parle de fidélité du C.

- R1 : SI capturé à `5A6DC4`, transmis/effets setter, puis CMP `5A6E01` utilise ce snapshot, pas une relecture substituée.
- R2 : capture du slot WORD à `5A6E8D` **avant** store enfant `5A6E97` et slot enfant `5A6E9B` ; l'ancienne formulation « store enfant avant reload slot » est rejetée contre ASM, pas conservée comme preuve.
- R3 : six copies DWORD à phase3A `5A6ED4–5A6F29` conservent exactement ordre des captures/stores ; pas snapshot global arbitraire.
- R4 : état guest explicite, opérations mémoire de largeur exacte ordonnées, wraps x86/compteurs/shift masqué ; pas hypothèse de pureté/nonalias des callees ni C ordinaire ready-to-link. Les callbacks mémoire/appels profonds sont des contrats **non fournis/non validés**.
- Relectures postCamera `5A6F88/5A6FC4` et T `5A6FC8` conservées, sélection de branche préCamera `5A6F74/5A6FAC` ; owner courant relu à `5A6FF2`, slot épilogue `5A7058`.
- Inventaire phase node/child +0xC : **16 sites d'instruction, 17 opérations WORD du modèle**, dix lectures seules/cinq stores child/un INC nodal read+write : 11 lectures +6 écritures. Ni 16 copies ni compte dynamique/matériel.
- EAX32 retourne0/0/2 aux trois exits ; la pompe teste AL masque2 (bit1), sans prouver un retour AL-only ; référence entrée DATA à `5A6C88`, callback indirect, pas CALL direct inventé.

Re-review finale Sol accepte le C actif **dans son modèle**, mais a exigé ces deux rectifications documentaires (décompte WORD et append réel au fichier sémantique). Backend externe/flags complets/conditions mémoire/aliases réalisables restent non prouvés ; aucun incident runtime établi, aucune équivalence native inconditionnelle. Revalidation de l'avenant et gate parent natif restent pending, aucune nouvelle promotion pilote.

## Gate parent natif 2026-10-10 — avenant historique fermé dans le modèle borné

Le pending de l'avenant ci-dessus est supersédé par cette vérification parent,
sans nouveau vote, rename ou changement de classe **LIKELY**. Source actuelle :
247 instructions uniques, chunk `[0x5A6D20,0x5A7095)`, SHA256
`f72f60b2e03e3baf6c4630045de0cb639a54b3f305b799fbb073a98b13ea4ee7`.
Premier fence C actif inchangé SHA `8364098674530453ece3ec71ffc0be22e47e5162b50890a1407bc4560166a82d` ; second fence reste archive non active.

- Parent en ASM IDA courant : bijection **247/247** adresses du C, destinations
  de tous branches/jumps/calls et trois retours exactes, aucun missing/extra.
  21 Jcc : Z/NZ et signed `jl/jle/jg` correspondent à leurs prédicats, pas unsigned
  inventé. Les cibles de tous K/calls existent ; les cinq callbacks poussés sont
  des fonctions existantes, pas cinq appels directs du corps.
- ABI cdecl vérifiée : groupe initial 3+2 args → `add esp,14h` ; deux Register
  différés après rand() zéro arg → `add esp,10h` ; caméra3 + setter1 + setter1 +
  transform0 + getter1 → `add esp,18h` ; autres cleanups8/0Ch exacts. Ordre des
  pushes conservé, aucun contrat de pureté/nonalias des appels ajouté.
- R1 SI snapshot `5A6DC4` utilisé à `5A6E01` ; R2 CX WORD capturé `5A6E8D`
  avant stores `5A6E97/5A6E9B` ; R3 les six lectures/stores DWORD `5A6ED4–5A6F29`
  et les deux stores WORD enfant intercalés conservent l'ordre du C actif.
  Branches préCamera / reloads postCamera `5A6F88/5A6FC4`, T `5A6FC8`, owner
  `5A6FF2` et slot épilogue `5A7058` vérifiés, sans hoist sur appels opaques.
- Largeurs : les 16 sites +0xC représentent 17 opérations WORD (11 read,6 write).
  Trois exits **EAX32=0/0/2** ; pompe `508434/50843A/50843C` consomme AL masque2.
  Stride acteur `(5*i*8-i)*4=156=0x9C` ; pool configuré `0x24=36` ×
  `0x64=100` par pushes `5A6C6F/71` et stores WORD `508323/327` du helper
  `508300` (son nom IDA `BS_Memset` n'est pas sa preuve).
- Nom structurel confirmé par deux ancres : seule xref entrée DATA `5A6C88`
  vers Register `5A6C92`, puis callback indirect `[node+8]` et retrait bit1 dans
  la pompe. Installateur `setz dl` `5A6CBF` a la polarité zéro documentée.

Gate **PASS statique borné**. Les helpers mémoire/appels profonds, flags hors
modèle, réalisabilité des aliases et équivalence compilée/ISO/native/runtime
restent non fournis/non prouvés. Aucune campagne runtime ou promotion pilote.
Preuve locale parent `tools/_tmp_semantic_triple/0x5a6d20/native_parent_gate_2026-10-10.json`,
SHA `cdb6a10b545ddb30f6f32d3959e132f1f448a7b5bdf0619391bdb1847928054c`.

IDB append réel `[semantic-triple 2026-10-10]` via `set_func_cmt`, historique
préservé ; save `D:/Modding/ff8/retro-exe/FF8_EN.exe - 9.3.i64` **true**,
readback exact, tag unique1, SHA commentaire
`20ba594da3ea51751c4900800e9922bd87928bcdb5c2205af16e270a4cc401fd`.
