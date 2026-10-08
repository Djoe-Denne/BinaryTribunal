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
