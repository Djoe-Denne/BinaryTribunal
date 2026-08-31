# Nouveau batch — G22 init combat de remplacement

Tu dois **commencer** G22. Il n’existe **aucun** `run_init_encounter`,
aucun bit suite G22, aucun témoin snapshot après 4344.

G21 (readers) et G05–G20 (tick / familles) **existent**. Compose
dessus. Ne les réécris pas.

Prépare ensuite toute l’instrumentation manquante, puis conduis la
validation live **minimale** avec l’opérateur. Travaille de façon
autonome jusqu’au premier geste réellement nécessaire dans FF8. À ce
moment-là, demande une action courte, précise et unique.

Ne committe et ne pousse rien sans demande explicite.

G21 est **live-promoted**. Ne le rouvre pas. Ne commence pas G23.
**N’ouvre pas P2.** Le gate milestone « P2 GameplayDomain / toutes les
familles supported depuis un snapshot post-init » **n’est pas** le
contrat de ce batch. G22 se travaille **sous P1**.

## G vs P — ne les confonds pas

- **G21** = *readers*. Un `EncounterDescriptor` depuis des fichiers.
  Clos. Tu le **consommes**.
- **G22** = chantier *init*. Gate : un combat supporté **démarre**
  depuis save + descripteur, **sans** `import_legacy` / snapshot
  post-init comme source, **sans** appeler les helpers d’init natifs.
- **P2** = prétention runtime « tout le domaine *supported* depuis un
  état déjà initialisé ». `content-matrix.toml` a
  `[P2] blocked_until = ["G13..G20"]` et **aucun** `claimed` P2.
  Satisfaire G22 n’écrit pas P2. Ne crée pas de profil P2 dans
  `make_suite_payload.py`.
- **P3 / G23** = cleanup, result, handoff terrain. Interdit ici.
- **SQ-G20-001** (dumps Limit / Renzokuken) **reste G20**. Ne la
  ferme pas. Ne change pas `resolve_limit_action` /
  `compute_crisis_level` sauf pour *appeler* ce dernier après le HP
  initial (U22.2 / U22.3).

## Résultat attendu

À la fin de **ce** batch :

- les unités U22.1 à U22.8 sont soit implémentées et testées, soit
  explicitement fail-closed avec une `SQ-G22-xxx` nommée (ou
  SQ-G21-001 **fermée** si le layout save est enfin prouvé) ;
- `application::run_init_encounter` (nom à aligner) produit un
  `BattleState` canonique depuis un `EncounterDescriptor` G21 +
  dumps save / working-copy **déjà décodés**, pas depuis
  `BATTLE_SLOT_DATA` natif ;
- le runtime **exporte** ce state vers l’hôte (slots, `F_CHAR_DATA`,
  files d’actions, ATB, flags d’init) sur une allowlist bornée, avec
  préimage et restore à `FF8Iso_Shutdown` ;
- aucun appel à `ParseBattleParty`, `ParseBattleCharacter`,
  `Battle_CalculateJunctionStats`, `setBattleSlotData`,
  `SceneOut_InitEnemySlot`, `setAllMonsterInfoFromDatSection`,
  `setMonsterInfoFromDatInfoSection`, `BS_ParseItems`,
  `ReadSceneOutForEncounter`, `Battle_InitATB_*` natifs,
  `Odin_BattleInit_ZantetsukenCheck`,
  `Gilgamesh_BattleInit_TriggerCheck` ;
- `import_legacy` n’est **jamais** la source de l’init. Un combat
  déjà en `mode_3_subsubsubstep == 4` = refuse typé, pas un
  re-import ;
- U22.8 : après `mode_3_subsubsubstep = 4`, **la même frame** pompe
  encore `Battle_RunFileLoadingCallbacks` et
  `BdLink_GF_battle_input_and_texture_upload` via le seam **G07**
  déjà promu. Pas de nouveau chargeur C0M / TIM ;
- une campagne live unique, sous **P1**, depuis un handoff terrain
  vers **une** rencontre ordinaire, prouve l’ancre ready + un refuse
  « déjà actif ». Pas une campagne de trois start-types en live ;
- rollback exact, `Detached`, processus vivant ;
- README, contrats, ownership, address map, ABI ledger et wiki
  Oxygen à jour ;
- `[promotion.G22].satisfied` reste `false` jusqu’à la clôture live.

G22 ne possède pas le tick (G05+), ATB *per-frame* (G06), pending
(G07), targeting (G08), apply des familles (G09–G20), la
présentation (G14 / G25–G29), ni le cleanup (G23).

Ce batch **ne clôt pas** P2 et **ne commence pas** G23
(`Battle_EndCleanupAndTransition`, commit SG, rewards).

## Préambule outillage — vérifie une fois, puis travaille

Lis `ai-prompt/todo/_gate-layer-preamble.md` et
`.agents/skills/implementing-iso-layer-boundary/SKILL.md` avant tout
code.

### RTK

```powershell
rtk --version
```

Version observée : `0.42.4`. Si le hook `preToolUse` est présent, ne
l’invoque pas manuellement.

### QMD / Oxygen

Utilise la commande `qmd`, jamais un MCP QMD.

```powershell
qmd status
qmd get ff8-wiki/index.md --no-line-numbers
qmd get ff8-wiki/projects/re-ff8/references/battle-iso-migration-milestones.md:829:25 --no-line-numbers
qmd get ff8-wiki/projects/final-fantasy-viii-reimaginated/references/p1-g21-battle-data-validation.md --no-line-numbers
qmd get ff8-wiki/projects/re-ff8/concepts/battle-lifecycle.md --no-line-numbers
qmd get ff8-wiki/projects/re-ff8/concepts/battle-state-model.md --no-line-numbers
qmd get ff8-wiki/projects/re-ff8/references/battle-formulas.md --no-line-numbers
qmd get ff8-wiki/projects/re-ff8/skills/ff8-live-validation-operations.md --no-line-numbers
```

Lis aussi directement :

```text
ai-prompt/todo/g21-battle-data-readers-new-chat.md
docs/tech/systems/battle_init.md
docs/tech/systems/battle_loop.md
docs/tech/systems/battle_slot_data.md
docs/tech/reference/battle_slot_layout.md
docs/tech/reference/address_catalog.md
docs/tech/investigation/battle_state_reconstruction.md
obsidian-docs/projects/re-ff8/concepts/battle-lifecycle.md
C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g21-sq-002-003-closure-2026-08-28.md
C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g21-battle-data-live-promotion-2026-08-28.md
```

Si le reranker CUDA échoue : `qmd search` ou `qmd query --no-gpu --no-rerank`.

### Context Mode

Le MCP workspace a `CONTEXT_MODE_PROJECT_DIR` = racine `re-ff8`. Pour
le code d’implémentation, utilise les outils locaux / Serena sur
`FinalFantasy_VIII_Reimaginated`. Ne mets pas ce chemin dans le
`mcp.json` utilisateur. Appelle `initial_instructions` Serena avant
le premier edit impl.

### IDA MCP

IDB autoritative :

```text
D:\Modding\ff8\retro-exe\FF8_EN.exe.i64
```

EXE Steam 2013 SHA-256
`064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.

N’ouvre IDA que pour une ambiguïté encore ouverte. Racines déjà
nommées — **à revalider dans l’IDB**, puis porter en formules
`core/`, **jamais** appeler :

| Symbole | EA | Rôle G22 |
| --- | ---: | --- |
| `FFBattleDirector_battleLoop` | `0x47CCB0` | machine 4 niveaux ; tu interceptes l’init, pas le tick 4 |
| `ReadSceneOutForEncounter` | `0x48D0E0` | **interdit d’appeler** — codec G21 + export 128 o si l’hôte en a besoin |
| `BattleSlot_ClearAllSlots` | `0x48C620` | remplacer (U22.1) |
| `Battle_InitActionQueueGroup` | `0x48C740` | remplacer ou réutiliser le clear G07, pas l’appel natif |
| `ParseBattleParty` | `0x48B7E0` | **interdit** — U22.2 |
| `ParseBattleCharacter` | `0x495530` | **interdit** — source save → `F_CHAR_DATA` |
| `Battle_CalculateJunctionStats` | `0x495960` | **interdit** — formules + SQ-G21-001 |
| `Battle_InitPartySlotStatusFromChar` | `0x48B5F0` | **interdit** — auto-status / Initiative |
| `setBattleSlotData` | `0x48B310` | **interdit** — copie vers slot |
| `Battle_FinalizePartySetup` | `0x495EC0` | porter si l’IDB le ferme, sinon SQ |
| `setAllMonsterInfoFromDatSection` | `0x48BA10` | **interdit** — U22.3 |
| `setMonsterInfoFromDatInfoSection` | `0x48BBD0` | **interdit** — section 6 (SQ-G21-003 **fermée**) |
| `BattleSlot_ApplyMonsterStatScaling` | `0x48C1C0` | **interdit** — courbes 4 octets |
| `Battle_InitDrawSpellAvailability` | `0x48C7A0` | porter si `SG_KNOWN_MAGIC` est prouvé |
| `Battle_InitATB_MaxAndReset` | `0x484490` | **interdit** — `MAX = 4000*(speed+1)` |
| `Battle_InitATB_RandomFromSpeed` | `0x4844D0` | **interdit** — U22.4 |
| `Battle_InitPreemptiveBackAttackStatus` | `0x48AFD0` | **interdit** — U22.4 |
| `Battle_SeedRNG` | `0x48F050` | **interdit** — U22.5 |
| `Odin_BattleInit_ZantetsukenCheck` | `0x482E00` | **interdit** — roll 32/255, U22.7 / U17.6 schedule |
| `Gilgamesh_BattleInit_TriggerCheck` | `0x4831F0` | **interdit** — roll 8/255 |
| `Battle_InitDeadTimer` | `0x482F70` | porter depuis `K_MISC` si déjà décodé |
| `Battle_RunFileLoadingCallbacks` | `0x48D0C0` | **G07** — pompe U22.8, ne pas forker |
| `BdLink_GF_battle_input_and_texture_upload` | `0x500900` | **G07 / G14** — queue U22.8 |
| `sub_507120` / task `102` | `0x507120` | chargeur C0M **présentation** — ne pas le réécrire |
| `Battle_EndCleanupAndTransition` | `0x4868C0` | **G23** — interdit |
| `Archive_IO_LoadFile` | I/O | **HOST** seulement, jamais depuis `core` |

Ordre natif à reproduire (docs `battle_init.md`, revalider) :

1. **subsub 0** — seed RNG, copier l’id de scène, poser la rangée
   `scene.out` (depuis le fichier G21), merger les flags, reset
   rewards, clear 11 slots, init 3 files, visibilité ennemis, party,
   items, hit-count, enqueue présentation scénario, `subsub = 1`.
2. **subsubsub 0** — pompe fichiers (stage). Callback natif → 1.
3. **subsubsub 1** — stats monstres section 6, preemptive/ATB,
   positions, models VRAM (enqueue 102, pas le parse). → 2.
4. **subsubsub 2** — pompe textures. Callback → 3.
5. **subsubsub 3** — masques, enqueue party initiale, AI flag,
   Odin/Gilgamesh **rolls**, dead-timer. → **4**.
6. **même frame que le write `= 4`** — callbacks + BdLink.

Une découverte va d’abord dans l’IDB (nom, type, commentaire),
ensuite seulement address map / ABI ledger.

## Dépôts et état de départ audité

Documentation et prompt :

```text
C:\Users\djden\source\repos\retro-eng\re-ff8
```

Implémentation :

```text
C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated
```

Injecteur :

```text
C:\Users\djden\source\repos\FFScriptLoader\build\bin\RelWithDebInfo\app_injector.exe
```

`Invoke-IsoGroup` **n’existe pas**. Le test injecté du milestone G22
(`Invoke-IsoGroup -Group G22 -Profile P2`) est **obsolète**. Flux
live réel — identique à G15–G21 :

```text
tools\make_bootstrap_payload.py
tools\make_suite_payload.py
app_injector.exe  (FF8Iso_Bootstrap / FF8Iso_RunInProcessSuite / FF8Iso_Shutdown)
tools\capture_runtime_evidence.py
tools\capture_live_canaries.py
```

État observé le 2026-08-28, **à revalider** :

- G05–G21 sont `live-promoted`. `[promotion.G21].satisfied = true`
  (PID **23764**, DLL
  `decf543d9e8cf89b7ad0099d195e993945b224d71f634d53f4d08e48905ac61e`) ;
- schéma **25**, snapshot **4344**, témoin G21 `[4088:4344]`, bit
  `1u << 21`, evidence **33** ;
- SQ-G21-002 / SQ-G21-003 **fermées** (hash scene `+0x40..+0x77` ;
  monster_info = section `.dat` 6, 380 o, loader `0x50724C`) ;
- SQ-G21-001 (junctions perso + flags d’histoire) **ouverte** —
  handoff **G22** (U22.2 / U22.7). Sans preuve IDB du record save,
  refuse typé. Ne recycle pas le numéro pour autre chose ;
- le travail G21 + clôture 002/003 peut être **encore uncommitted**
  dans l’un des deux worktrees ;
- si le worktree impl n’a **pas** le schéma 25 / `promotion.G21` /
  `G21.suite.toml` / `kDatInfoSectionIndex == 6` : **arrête et
  rapporte**. G22 dépend de G21. Ne rebase pas, ne reset pas, ne
  réécris pas G21 ;
- pas de façade G22, pas de `FF8ISO_SUITE_G22_*`, pas de témoin
  G22, pas de `G22.suite.toml` ;
- `make_suite_payload.py` s’arrête à G21 / P1 ;
- codecs à **consommer** : `scene_out_codec`, `dat_section_table_codec`
  (section 6 + 8), `monster_ability_codec`, `kernel_*`,
  `save_party_codec`, `working_copy_codec`, `run_describe_encounter` ;
- fixtures G21 : `scene.out` `6723ad12…`, `kernel.bin` `e378fb8f…`,
  `c0m016.dat` `8ccb2810…`. Il **n’y a pas** encore de dump
  `SG_ARRAY_CHARA_DATA` authentifié pour les junctions. Extraire
  après preuve IDB, ou rester fail-closed ;
- `F_CHAR_DATA` (`0x018ff000`, `0x0570`) : G21 le *décrit* ; G22
  **l’écrit** (export borné + restore) ;
- `crisis_level` : réutiliser G20 après le HP initial.

Revalide `git status`, `git log -5`, `validate_contracts.py` et le
binaire de tests au début. Préserve le travail utilisateur et G21.
Ne lance pas de link si `FF8_EN.exe` tourne.

## Contrats précédents à préserver

### G21 — clos

`[promotion.G21].satisfied = true`. Ne réécris aucune enveloppe
hash-bound :

| Fichier | SHA-256 |
| --- | --- |
| `evidence/battle-iso/p1-g21-describe-post-suite-2026-08-28.json` | `93490dfd851633c69a0bf6dd6e821309bc6a30c0e24ac705a46fbe9361cb2b23` |
| `evidence/battle-iso/p1-g21-post-shutdown-2026-08-28.json` | `56b6edee606820f4cfbd2f8a20cdcf94c41be13793090fcfa67ccbfc945ee22d` |

Ne change pas `run_describe_encounter`, le témoin `[4088:4344]`, ni
les hashes scene / kernel / dat. G22 **appelle** describe (ou
réutilise les vues déjà décodées). Il ne forke pas un second parser
`scene.out`.

### G20 / G19 / G18

| Fichier | SHA-256 |
| --- | --- |
| `p1-g20-crisis-post-suite-2026-08-28.json` | `7dfd7b2d9b3491218a974236c638db14f71392db0f8ba7b714d12f54d8ce8a1b` |
| `p1-g20-post-shutdown-2026-08-28.json` | `e6f7c0f49fdcc97bb0dc6b987a8e5c845f5e20de1140fa1af0d0e8bb45fe544e` |

SQ-G20-001 **reste ouvert**. G18 : ne touche pas seed labo `12`,
Zantetsuken *during-battle*, finalize summon. Les rolls **init**
Odin/Gilgamesh sont U22.7 (domaine), le *schedule* runtime reste
U17.6.

### G15–G16 / G07 / G14

- Section 8 AI et table 380 o section 6 restent les codecs G15/G16.
  G22 **remplit les slots** depuis ces octets. Il ne reparse pas
  l’IA.
- `monster_info_section` / `monster_ai_section` hôte : pointeurs
  posés par le chargeur C0M (`0x507120`). G22 n’écrit ces pointeurs
  que si l’IDB prouve un autre writer **domaine**. Sinon : la queue
  U22.8 laisse la présentation les poser, et les stats slot sont
  déjà dérivées des fichiers.
- File callbacks / BdLink : seam G07. Pas de
  `TemporaryG22NcompAdapter` pour les pomper.
- Pas de nouveau NCOMP de mesh / TIM / caméra (G25–G29).

### G06 / G09–G14 writes

HUD / Director **non** installés au bootstrap (`0x47`, même que
G21). G22 a le **droit** d’écrire l’allowlist d’init (slots,
`F_CHAR_DATA`, ATB, flags, `mode_3_subsubsubstep`). Chaque région
écrite a une préimage. Un write hors allowlist est terminal.

## Architecture à poser

### `core`

Possède les **règles d’init** : clear, dérivation party, dérivation
ennemi (niveaux, HP/stats, résistances, draw, flags), ATB initial,
seed RNG, rolls Odin/Gilgamesh, dead-timer, transition ready.
Entrée = vues G21 déjà typées + seed. Sortie = `BattleState` (ou
un `InitReport` qui le remplit). Pas de RVA, pas de POD natif, pas
de `find_symbol`, pas d’`#include "ff8iso/abi/"`.

Réutilise `compute_crisis_level`, catalogs kernel, table ability
section 6, formules déjà dans `lift` / `integer_semantics`
(`cap_to_255`). Ne re-déclare pas les catalogs G11–G20.

SQ-G21-001 : si le stride / les offsets `SG_ARRAY_CHARA_DATA` ne
sont pas fermés octet par octet dans l’IDB **comme dump disque**,
les bonus de junction et les flags d’histoire restent
`UnprovenLayout`. Pas de table wiki communautaire.

### `application`

`run_init_encounter` : une session, un state, un rapport
(écrit / rolled_back / error / `native_helper_calls==0` /
`imported_post_init==0`). Accepte le descripteur G21, pas une
`LegacyBattleImage`.

### `abi`

POD / address map seulement. Nouveaux symboles (`SG_ARRAY_CHARA_DATA`
stride, `BACK_PREEMTIVE_INFO`, `mode_3_subsubsubstep`, …) **après**
IDB. Beaucoup existent déjà dans l’address map : réutilise.

### `runtime-x86`

- codecs save manquants **seulement** après preuve ;
- `export_*` bornés vers slots / `F_CHAR_DATA` / scene blob 128 o /
  files / ATB / flags ;
- suite `g22_battle_init` : allowlist + préimage + restore ;
- **interdit** d’appeler les helpers d’init listés plus haut.

Pas de `TemporaryG22NcompAdapter` pour du gameplay. Un adapter n’est
licite que pour un *nouveau* helper NCOMP introuvable dans G07/G14,
avec `Removal target: U14.x`. Si tu en as besoin, arrête et
rapporte avant de le créer.

Snapshot : **append-only**. Témoin G22 = schéma **26**, **après**
4344. Tailles à ne pas bouger :

| Témoin | Intervalle | Schéma |
| --- | --- | ---: |
| G18 | `[3320:3576]` | 22+ |
| G19 | `[3576:3832]` | 23+ |
| G20 | `[3832:4088]` | 24 |
| G21 | `[4088:4344]` | 25 |

Vérifie `sizeof(FF8IsoRuntimeEvidenceSnapshot)` dans
`launch_contract.h` avant d’étendre. Un témoin 256 o donne **4600**.
`static_assert` obligatoire. Evidence kind : **34** (33 est G21).
Bit : `FF8ISO_SUITE_G22_BATTLE_INIT = 1u << 22`.

## Unités

### U22.1 Clear / reset

Autorisé : 11 slots (dead, HP 0), 3 files d’actions, latches
d’init, accumulators XP/items, hit-count, `BATTLE_RESULT_CODE = 0`,
countdown / subsubsub = 0.

Interdit : cleanup de fin de combat (G23), wipe des canaries frame,
clear du Director/HUD.

### U22.2 Party derivation

Chaîne native à remplacer, dans l’ordre, **si** chaque étape est
prouvée :

1. save / `SG_ARRAY_CHARA_DATA` → working copy `F_CHAR_DATA` ;
2. niveau depuis XP (`getCharaXP_*`) ;
3. stats finales (HP/STR/VIT/MAG/SPR/SPD/LUCK/HIT/EVA) ;
4. `elem_def` / `mental_res` / auto-status / Initiative ;
5. copie vers `BATTLE_SLOT_DATA[0..2]` ;
6. `compute_crisis_level` G20 ;
7. finalize GF battle data si l’IDB le ferme.

**SQ-G21-001** vit ici. Junction (`JFlag`, stock magie ×
`K_MAGIC.statJunctionValue`, commandes, GF list) : porter champ par
champ après `ParseBattleCharacter` / `Battle_CalculateJunctionStats`
revalidés. Champ non borné = refuse, pas une moyenne inventée.

G21 fournit déjà : `SG_ITEM`, battle-speed, Odin-Angel-Gilga,
`F_CHAR_DATA+0x172` HP, weapon, abilities dword, stock magie
**si** le dump 0x570 est fourni. Compose. N’invente pas le stride
save.

### U22.3 Enemy derivation

Depuis `SceneRow` + section 6 (380 o) + `enemy_levels` /
`enemy_com_value` :

- visibilité / targetable / loaded depuis les masques scène
  **prouvés** (pas `unknown_40..70`) ;
- `level_code` 0–255 : table `battle_init.md` (0–100 littéral,
  101–200 / 251–255 helpers). Revalider chaque helper avant de le
  nommer. Non prouvé = SQ + skip de ce code ;
- HP quadratique et scaling STR/VIT/MAG/SPR/SPD (offsets info
  +28..+48) — revalider, puis `core/` ;
- innate Zombie / Fly / Reflect / Protect / Shell depuis
  `flag_byte_1` ;
- draw list si `Battle_InitDrawSpellAvailability` +
  `SG_KNOWN_MAGIC` sont fermés.

Ne charge pas le `.dat` via `Archive_IO_LoadFile`. Les octets
viennent du descripteur / fixtures.

### U22.4 ATB initial

```
MAX_ATB = 4000 × (battle_speed + 1)
CUR_ATB = MAX/100 × (SPD/4 + rand(0..127) + 1 − 35)  clamp
```

Overrides : Initiative → full ; preemptive (info 3/4) party full /
ennemis 0 ; back (1/2) party 0 sauf Initiative / ennemis full.
Porter `Battle_InitPreemptiveBackAttackStatus` (roll + immunité +
Rare Item −20 + flags scène surprise/back). Live : **un** ordinary
suffit. Preemptive / back = hors-ligne + seed fixé.

### U22.5 RNG

Un seed de bataille (natif : `Battle_SeedRNG(rand())`). Hors-ligne :
seed injecté, déterministe. Live : observer puis *soit* imposer le
seed de fixture, *soit* n’asserter que les champs non RNG (HP max,
stats sans roll, flags). Ne pas « corriger » un roll en écrivant
le résultat attendu.

### U22.6 Scripts / masques / gates

Masques de visibilité / target (G08 types si déjà là),
`AI_BATTLE_ACTIVE_FLAG = 1`, pause enable, enqueue des actions
party *initiales* seulement si le flag slot est prouvé. AI Init
bytecode = G15 ; G22 **arme** le slot, il n’exécute pas la VM
sauf si un test hors-ligne le demande déjà via G15.

### U22.7 Auto-special + dead-timer + story flags

- Odin init : 32/255 si flag Odin et tous les ennemis vivants ont
  death res < 200. **Intent** seulement ; le schedule est U17.6.
  Ne pas appeler le natif. Ne pas infliger Zantetsuken ici.
- Gilgamesh init : 8/255, variante 0–3. Idem.
- `BATTLE_DEAD_TIMER` depuis `K_MISC` si le codec existe.
- Flags d’histoire : **SQ-G21-001**. Pas de bit inventé.

### U22.8 Ready + queue même frame

Reproduire l’ordre des phases jusqu’à `mode_3_subsubsubstep = 4`.
**Immédiatement après ce write**, même entrée Director : pompe
G07 file-callbacks + BdLink. C’est le contrat de compat
présentation, pas un second init.

Interdit : installer HUD/ATB/Director pour « aider » l’init ;
réimplémenter `sub_507120` ; avancer le tick 4 dans G22.

## Protocole runtime G22 — à créer

Avant FF8 :

- bit `FF8ISO_SUITE_G22_BATTLE_INIT = 1u << 22` ;
- evidence `FF8ISO_EVIDENCE_G22_BATTLE_INIT = 34` ;
- protocole `g22-battle-init-v1` ;
- témoin append-only (scénario, scene_id, seed, party/enemy HP+ATB
  hashes, `BACK_PREEMTIVE_INFO`, `subsubsub`, error, write_count,
  forbidden_calls, `imported_post_init=0`, runtime_state,
  restore_ok) ;
- `tools/make_suite_payload.py --group G22 --profile P1` ;
- `tests/in-process/G22.suite.toml` ;
- `tests/offline/test_g22.cpp` + `test_g22_payload.py` ;
- decodeur evidence + `validate_evidence_envelope.py` ;
- `[P1.G22]` dans `ownership-matrix.toml` ;
- `[promotion.G22]` dans `evidence-policy.toml` **sans**
  `satisfied = true`.

`validate_contracts.py` n’ajoute G22 à `REQUIRED_SUITES` que lorsque
le protocole existe, et le bloc promotion reste `false` jusqu’au
live.

Scénarios payload minimaux (réarmables sans rebuild) :

1. `init-ordinary` — fixtures `scene.out` + `kernel.bin` + `.dat` +
   dump party **prouvé** → slots dérivés, hashes stables,
   `imported_post_init == 0`, `forbidden_calls == 0` ;
2. `init-preemptive` / `init-back` — hors-ligne, seed fixé, ATB
   overrides. Pas obligatoire en live ;
3. `refuse-active` — si `BattleActive` et `subsubsub == 4` :
   `Busy` / `InvalidState`, **zéro** `import_legacy` ;
4. `refuse-unproven` — dump save sans layout junction → SQ-G21-001,
   pas de stats « à peu près » ;
5. `repeat-init` — deux inits, même seed, même descripteur → même
   state canonique ; le second ne lit pas l’hôte post-init.

Ne crée pas de profil P2. Ne crée pas de scénario cleanup / victory.

## Audit des appels et écritures

Interdis depuis `core` / `application` et le seam G22 :

- toute la liste IDA ci-dessus (helpers d’init + cleanup G23) ;
- tout helper déjà interdit à G18–G21
  (`BattleAction_ResolveAndApplyDamage`, persist Card/Mug/Devour,
  `ComputeRenzokukenDamage`, …) ;
- `import_legacy` **comme source** de l’init ;
- `Archive_IO_LoadFile` depuis core.

Allowlist live : **bornée et nommée** (slots 0–10 champs dérivés,
`F_CHAR_DATA` 0x570 ou sous-ensemble prouvé, ATB, flags init,
`CURRENT_ENCOUNTER_*` 128 o si export, `mode_*` d’init, dead-timer).
`write_count` compte ces writes. Un write hors liste est terminal.
Shutdown restore **toutes** les préimages, y compris si le live a
atteint `subsubsub == 4`.

## Politique live

Même discipline que G16–G21 **sauf le lieu** :

- CTest cumulatif vert, contrats verts, DLL PE32, hash calculé,
  payloads prêts ;
- jeu fermé avant build, relancé par l’opérateur ;
- bootstrap → préimage → watch → **une** action → verdict machine →
  `FF8Iso_Shutdown` → `Detached` + survie ;
- un `BUSY` : une frontière de frame, une seule tentative ;
- ne reconstruis jamais une DLL chargée ;
- ne réécris aucune enveloppe G18–G21.

Bootstrap : flags `0x47` (frame seam + garde Odin/Gilgamesh ; HUD /
ATB / Director **non** installés). La garde spéciale n’est pas un
outil pour forcer Odin.

**Le live ancre se fait depuis le terrain, puis une entrée en
combat.** C’est l’inverse de G21. Une rencontre **ordinaire**
suffit (scène connue, notée dans la preuve, de préférence déjà
dans `scene.out` fixture). Ne demande pas Ifrit / crise / Limit.

Si l’opérateur est **déjà** en tick 4 : ne lance **pas**
`init-ordinary` comme ancre. Utilise `refuse-active`, puis une
**nouvelle** session : terrain → entrer dans la rencontre → suite
init.

## Stratégie live minimale — une session, une rencontre

Une ancre représentative suffit.

Ordre recommandé, **un seul PID** si stable :

1. Bootstrap OpenWorld / terrain (mode 2), canaries : HUD/ATB/
   Director non installés.
2. Demander **une** action : entrer dans la rencontre notée
   (ou confirmer `COMBAT_SCENE_ID` avant le premier tick 4).
3. Suite `init-ordinary` : state ready, helpers natifs 0,
   `imported_post_init == 0`, writes = allowlist, hashes party /
   enemy cohérents avec le hors-ligne **pour les champs non RNG**.
4. Suite `refuse-active` seulement si tu es déjà en tick 4 sur ce
   PID et que tu n’as pas d’autre session. Sinon skip + documente.
5. Shutdown → `Detached`, préimages restaurées, processus vivant.

Pas de campagne G23. Pas de Limits. Pas de P2. Pas trois
start-types live.

## Instructions à l’opérateur

- français ;
- une action à la fois (lancer le jeu, rester terrain, **entrer
  dans la rencontre X**, fermer) ;
- aucune mutation mémoire non annoncée ;
- fermer FF8 avant tout link ;
- si l’opérateur redémarre, abandonne l’ancien PID.

Ne lui demande pas de farmer une crise, de lire des HP à l’œil, ni
de gagner le combat. L’ancre s’arrête à ready.

## Vérifications avant promotion

```powershell
python .\tools\validate_contracts.py
cmake --build --preset debug-x86 --parallel --target battle_iso_tests
.\build\debug-x86\bin\Debug\battle_iso_tests.exe G21
.\build\debug-x86\bin\Debug\battle_iso_tests.exe G22
ctest --preset debug-x86 --output-on-failure
```

Puis payloads G22 une fois le protocole posé. DLL PE32 + SHA-256.

La promotion est interdite si :

- l’init vient d’un snapshot post-init / `import_legacy` ;
- un helper d’init natif est appelé ;
- un write hors allowlist a lieu, ou le restore est incomplet ;
- une stat / junction « à peu près » fait passer un test ;
- G00–G21 régressent, ou une enveloppe G18–G21 change de hash ;
- le hash DLL de preuve ≠ candidat final ;
- le live a utilisé le profil P2 ou `Invoke-IsoGroup` ;
- G23 (cleanup) a commencé ;
- le tick 4 a été « possédé » au-delà du handoff U22.8.

Une promotion **avec** SQ-G21-001 / SQ-G22-xxx ouvertes est licite
**si** le live prouve l’init ordinary sur les champs prouvés et que
les junctions / flags non prouvés restent refusés. Même pattern que
G21 + SQ-G21-001.

## Manifestes et documentation

Minimum :

- `manifests/ownership-matrix.toml` `[P1.G22]` (`offline-draft`
  jusqu’au live, puis `live-promoted` **seulement** après l’ancre) ;
- `manifests/evidence-policy.toml` `[promotion.G22]` ;
- address map / ABI ledger si un symbole nouveau est prouvé ;
- CMake, suite G22, README ;
- `obsidian-docs/projects/re-ff8/references/battle-iso-migration-milestones.md`
  unités U22.x — **corrige** le test injecté `Invoke-IsoGroup` / P2 ;
- ledger + SQ-G22-xxx nommées (ne recycle pas SQ-G20-001 ;
  ferme SQ-G21-001 seulement avec preuve IDB) ;
- page
  `obsidian-docs/projects/final-fantasy-viii-reimaginated/references/p1-g22-battle-init-validation.md` ;
- journal du jour.

`[P2]` reste sans `claimed` et sans `satisfied`. Ne l’invente pas.

Preuves attendues :

```text
evidence/g22-battle-init-offline-draft-YYYY-MM-DD.md
evidence/g22-battle-init-offline-validation-YYYY-MM-DD.md
evidence/g22-battle-init-live-promotion-YYYY-MM-DD.md
evidence/battle-iso/p1-g22-*-post-suite-*.json
evidence/battle-iso/p1-g22-*-post-shutdown-*.json
```

Ingest `ff8-evidence-wiki-ingest`, puis compile QMD.

## Stop conditions

Arrête et rapporte le diagnostic si :

- G21 n’est pas présent (schéma ≠ 25, pas de promotion G21, pas de
  section 6) ;
- tu dois appeler `ParseBattleParty` / `setAllMonsterInfoFromDatSection`
  / `ReadSceneOutForEncounter` natif ;
- tu dois `import_legacy` pour « avoir des slots » ;
- tu inventes un stride save / junction pour fermer SQ-G21-001 ;
- tu réimplémentes le chargeur C0M ou un TIM ;
- tu commences G23 ou tu écris `[P2] claimed` ;
- le jeu tourne au moment d’un link ;
- PID ou hash DLL change en session ;
- write guard / call audit faute ;
- G18–G21 promotion ou enveloppes sont menacées.

Ne promeus pas « avec dette » une violation de frontière. Des SQ
ouvertes n’empêchent pas une promotion **si** le live prouve
l’owned (init ordinary ready) et le refuse (déjà actif / unproven),
pas l’inventé.

## Rapport final attendu

1. fichiers créés / modifiés (diff vs worktree G21) ;
2. frontières de couches ;
3. dérivé vs refusé (party, junctions, ennemis, ATB, rolls, flags) ;
4. CTest / contrats / nouveau total ;
5. hash DLL, schéma snapshot, bit suite ;
6. résultat live (init-ordinary / refuse-active / skip) ;
7. appels natifs (0 helpers d’init) et writes (allowlist + restore) ;
8. rollback / `Detached` / survie ;
9. confiance U22.1–U22.8 ;
10. SQ restantes (G22, G21-001, G20-001 inchangée) ;
11. statut `[promotion.G22].satisfied` ;
12. pages Oxygen + QMD ;
13. confirmation explicite : **P2 non ouvert**, **G23 non commencé**.

Ne conclus jamais « G22 terminé » ni « P2 ouvert » si le rapport ne
distingue pas : prouvé hors-ligne, prouvé live représentatif, encore
seulement inventorié et refusé.
