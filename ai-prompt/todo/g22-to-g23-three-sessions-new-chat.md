# G22 → G23 — guide d’une session (nouveau chat)

Tu es un **nouvel agent**. Ce fichier est le brief. L’opérateur
écrit **une** ligne : `Session 1` ou `Session 2` ou `Session 3`.
Tu ne fais **que** cette session. Tu n’ouvres pas G23. Tu ne
flippes pas `[promotion.G22].satisfied`.

Le chat parent (30–31 août 2026) a découpé le travail. Quand les
**trois** rapports existent, l’opérateur y retourne : ce chat-là
lira les rapports et **prendra la décision** (promouvoir / encore
une session / G23). Toi, tu livres un rapport, pas une promotion.

Repos : docs `C:\Users\djden\source\repos\retro-eng\re-ff8`,
code `C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated`.

Lis avant de coder : `.agents/skills/implementing-iso-layer-boundary/SKILL.md`.
Session 3 seulement : `.agents/skills/ff8-live-necessity-filter/SKILL.md`.

## Loi commune

- G22 = comment un combat **démarre**. G23 = comment il **se
  termine**. G23 interdit (`Battle_EndCleanupAndTransition`,
  rewards, commit save de fin).
- Pas d’helpers d’init natifs, pas d’`import_legacy` comme source.
- `core/` / `application/` sans `#include "ff8iso/abi/"`.
- N’invente pas offset, stride, bit, ordre de party, formule.
- Autorité : IDB > kernel fixture `e378fb8f…` > save Hyne+EXE >
  Reimaginated > wiki communautaire.
- Kernel `D:\Modding\ff8\kernel.bin` (`f7db5cf6…`) **rejeté**.
- EXE Steam 2013 `064d466b…6589570`. IDB
  `D:\Modding\ff8\retro-exe\FF8_EN.exe.i64`.
- Ne rouvre pas G21. Ne relance pas l’ancre v15 « pour voir ».
- Après edit C++ : `python .\tools\validate_contracts.py` puis
  `cmake --build --preset debug-x86 --target battle_iso_tests` et
  `battle_iso_tests.exe G21` + `G22`.
- Pas de commit sans demande.

## Ne pas redécouvrir

| Déjà fermé | Où |
| --- | --- |
| Enqueue policy `0x47D8A0` (pas Attack ; ordinary masks 0/0) | `g22-init-static-layouts-2026-08-30.md` |
| `CharacterData[8]` stride 152, Steam `savemap+0x490` = decomp `+0x610` | même page + `decode_sg_chara_dump` + `tests/fixtures/g22/sg_chara.bin` |
| Dead-timer `K_MISC+0x0F` = 200 (fixture `0x4CDB`) | `battle-formulas.md` |
| Roll ordinary / surprise / dos (bits `0x80/0x20/0x40`, seuils 20/236) | même page |
| Draw wiring `SG_KNOWN_MAGIC` + `.dat+260` | ledger SQ-G22-002 (liste concrète encore ouverte) |
| Helpers niveau 101–255 | SQ-G22-001 (pick DAT = SQ-G22-006) |
| Ancre live v15 PID 38256 / DLL `d901a8c2…` L22-A/B/C | `p1-g22-battle-init-validation.md` |
| SQ-G22-004 | live-proven |

Ordinary offline après sessions 1–2 : `refused_mask = 373` avec
triplet (501 sans triplet) = Junction + DrawList + StoryFlags +
InitialEnqueue + CrisisCatalog + OrdinaryStartType.
`PartyDerivation` tombe seulement si `decode_sg_party_battle`
réussit (checksum `+0xAF4` = `01 00 02 ff` sur slot1_save02).

**Pas fermé :** consommateur exec `special_id=0` ; DAT par ennemi ;
appliquer jonctions / JFlag `0x3A–0x4D` / `max_hp`.

## Session 1 — brancher les oracles fermés (offline)

**Inclus :** dead-timer (`dead_timer_valid` ← octet 200) ;
roll ordinary si `forced_back_preemptive` dérive (table déjà
prouvée) ; **décision écrite** du bit `InitialEnqueue` — soit tu
l’éteins parce que masks 0 sont le résultat natif ordinary, soit
tu le laisses fail-closed. Tu n’implémentes **pas** le
consommateur `special_id=0`.

**Exclus :** jonctions, party slots, Draw concret, DAT
multi-ennemis, live, G23, flip `satisfied`.

Succès : tests G22 verts ; bits DeadTimer et/ou OrdinaryStartType
tombent **sans inventer** ; note enqueue dans le rapport.

## Session 2 — party / jonctions (offline)

**Inclus :** appliquer `SaveCharacterRecord` **seulement** si tu
as une source **prouvée** des 3 slots (F_CHAR working copy déjà
décodé, ou triplet party fichier **re-prouvé** — pas
`+0x1F4` tel quel). JFlag dérivé (abilities `0x3A–0x4D`), pas
stocké. HP / XP / arme selon IDB +
`g22-init-static-layouts-2026-08-30.md`.

**Exclus :** inventer l’ordre Squall-Zell-… ; SQ-G22-006 ;
liste Draw sans `.dat` de scène ; live ; G23.

Si le triplet party n’est pas fermé : skip nommé, **aucun**
`PartyDerivation` éteint. Rapport = bloqué + preuve manquante.

## Session 3 — carte live de promotion (pas le flip)

Lis le filtre de nécessité **avant** de demander d’ouvrir FF8.
Carte minimale : process frais, pas de debugger, DLL **nouvelle**
(ne pas recycler `14cd2bbf…`). L22-A / B / C dans l’ordre du
pack `evidence/g22-constrained-anchor-test-pack-2026-08-29.md`.
Un geste opérateur à la fois, consignes en français.

Tu captures. Tu mets à jour le wiki **sans** écrire
`satisfied = true`. Les hashes v1 dans `evidence-policy.toml`
restent historiques ; tu **proposes** les hashes v3/v15+ dans le
rapport.

Stop au premier échec safety (write-guard, restore, helper
natif, `import_legacy`).

## Rapport obligatoire (fin de **ta** session)

Écris **un** fichier, rien d’autre comme livrable de décision :

`ai-prompt/todo/g22-to-g23-reports/session-N.md`

(`N` = 1, 2 ou 3). Copie le canevas
`ai-prompt/todo/g22-to-g23-reports/_template.md`.
Ne réécris pas les rapports des autres sessions.

Le chat parent ne lira que ces trois fichiers.
