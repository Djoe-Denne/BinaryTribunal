# Nouveau batch — G21 readers bornés des data de combat

Tu dois **commencer** G21. Il n’existe **aucun** façade `EncounterDescriptor`
/ reader unifié commité : pas de `core/battle_data_*`, pas de codec
`scene.out`, pas de bit suite G21, pas de témoin snapshot après 4088.

Les codecs kernel **déjà** posés par G11–G20 et les codecs `.dat`
section 8 / ability G15–G16 **existent**. Ne les réécris pas. Compose
dessus.

Prépare ensuite toute l’instrumentation manquante, puis conduis la
validation live **minimale** avec l’opérateur. Travaille de façon
autonome jusqu’au premier geste réellement nécessaire dans FF8. À ce
moment-là, demande une action courte, précise et unique.

Ne committe et ne pousse rien sans demande explicite.

G20 est **live-promoted**. Ne le rouvre pas. Ne commence pas G22.
**N’ouvre pas P2.** Le gate milestone « P2 GameplayDomain / toutes les
familles supported / zéro appel domaine natif » **n’est pas** le
contrat de ce batch. G21 se travaille **sous P1**.

## G vs P — ne les confonds pas

- **G21** = chantier *readers*. Gate : décrire une rencontre
  supportée **sans** lire un état de combat natif déjà initialisé.
- **P2** = prétention runtime « tout le domaine *supported* depuis un
  snapshot post-init ». `content-matrix.toml` a
  `[P2] blocked_until = ["G13..G20"]` et **aucun** `claimed` P2.
  Satisfaire `blocked_until` n’écrit pas P2. Ne crée pas de profil P2
  dans `make_suite_payload.py`.
- Les dettes Limit (fenêtres Renzokuken, Duel/Shot input, Slot reroll,
  Angel Wing consume, SQ-G20-001) **restent G20**. G21 ne les ferme
  pas et n’en a pas besoin pour son gate.

## Résultat attendu

À la fin de **ce** batch :

- les unités U21.1 à U21.7 sont soit implémentées et testées, soit
  explicitement fail-closed avec une `SQ-G21-xxx` nommée ;
- un descripteur typé (rencontre + party + monstres + kernel rows
  **déjà décodées**) se construit depuis des **fichiers / fixtures**,
  pas depuis `import_legacy` / `BATTLE_SLOT_DATA` post-init ;
- `scene.out` : rangée 128 o à `scene_id << 7`, bornes prouvées ;
  une table absente ou un layout non prouvé = pas de champ inventé ;
- U21.2 **réutilise** les codecs kernel existants (Magic, Item,
  command abilities, enemy attacks, GF, Limits, misc, character).
  Pas de second `kernel.bin` parser parallèle ;
- U21.3 décode save/party (personnages, junctions, stock magie,
  items, état GF, config, flags d’histoire) **autant que le layout
  est prouvé** ; le reste = refuse typé ;
- U21.4 étend le `.dat` au-delà de la section 8 AI déjà portée :
  info / ability / texte / refs modèle-effet **si** les offsets sont
  prouvés ; le visuel reste G27–G29 ;
- U21.5 **décrit** les working copies (`F_CHAR_DATA`, equal-item,
  strings, IDs transitoires). Il ne les **écrit pas** sur l’hôte
  (c’est G22) ;
- U21.6 = identifiants et durées de vie seulement ; aucun décode
  texture / caméra / mesh ;
- U21.7 : fichier manquant, tronqué, ID hors bornes, overflow =
  erreur typée déterministe, **zéro write** combat ;
- une campagne live unique, sous **P1**, **hors combat** (terrain /
  OpenWorld / menu), prouve **une** ancre describe + un refuse
  bornes/corrupt. Pas d’entrée en combat pour « avoir un snapshot » ;
- rollback exact (en pratique : aucune mutation combat), `Detached`,
  processus vivant ;
- README, contrats, ownership, address map, ABI ledger et wiki
  Oxygen à jour ;
- `[promotion.G21].satisfied` reste `false` jusqu’à la clôture live.

G21 ne possède pas l’init combat (G22), le tick (G05+), ATB (G06),
pending (G07), targeting (G08), Attack/Magic/Item/Draw/AI/GF/cmd/
Limits apply (G09–G20), ni la présentation (G14 / G25–G29).

Ce batch **ne clôt pas** P2 et **ne commence pas** G22
(`ParseBattleParty`, `SceneOut_InitEnemySlot`, clear slots, ATB
init, rolls Odin).

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
qmd get ff8-wiki/projects/re-ff8/references/battle-iso-migration-milestones.md:809:25 --no-line-numbers
qmd get ff8-wiki/projects/final-fantasy-viii-reimaginated/references/p1-g20-limit-families-validation.md --no-line-numbers
qmd get ff8-wiki/projects/re-ff8/concepts/battle-lifecycle.md --no-line-numbers
qmd get ff8-wiki/projects/re-ff8/concepts/battle-state-model.md --no-line-numbers
qmd get ff8-wiki/projects/re-ff8/skills/ff8-live-validation-operations.md --no-line-numbers
```

Lis aussi directement :

```text
ai-prompt/todo/g20-limit-families-new-chat.md
docs/tech/systems/battle_init.md
docs/tech/systems/encounter_trigger.md
docs/tech/reference/address_catalog.md
docs/tech/investigation/battle_state_reconstruction.md
obsidian-docs/projects/re-ff8/concepts/battle-lifecycle.md
obsidian-docs/projects/re-ff8/concepts/battle-state-model.md
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
nommées — **à revalider dans l’IDB**, pas à traiter comme state
machines d’init :

| Symbole | EA | Rôle |
| --- | ---: | --- |
| `ReadSceneOutForEncounter` | `0x48D0E0` | charge 128 o à `scene_id << 7` |
| `CURRENT_ENCOUNTER_DATA_SCENE_OUT` | `0x1D287DC` | snapshot 0x80 **post-load** — **pas** la source G21 |
| `COMBAT_SCENE_ID` | RVA `0x018ff6e0` | u16 ; lisible hors combat comme *id* |
| `SceneOut_InitEnemySlot` | `0x48AD10` | **G22** — interdit d’appeler |
| `ParseBattleParty` | `0x48B7E0` | **G22** — interdit d’appeler |
| `BS_ParseItems` | (init) | **G22** — interdit d’appeler |
| `setAllMonsterInfoFromDatSection` | (init) | **G22** — interdit d’appeler |
| `Archive_IO_LoadFile` | I/O archive | **HOST** seulement, jamais depuis `core` |

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

`Invoke-IsoGroup` **n’existe pas**. Le test injecté du milestone G21
(« `Invoke-IsoGroup -Group G21 -Profile P2` ») est **obsolète**.
Flux live réel — identique à G15–G20, **mais hors combat** :

```text
tools\make_bootstrap_payload.py
tools\make_suite_payload.py
app_injector.exe  (FF8Iso_Bootstrap / FF8Iso_RunInProcessSuite / FF8Iso_Shutdown)
tools\capture_runtime_evidence.py
tools\capture_live_canaries.py
```

État observé le 2026-08-28, **à revalider** :

- G05–G20 sont `live-promoted`. `[promotion.G20].satisfied = true`
  (Session P, PID **63104**, DLL
  `380406606745a33557cab6d21e6787f041838309433db51b97a3c9ff3714fd69`) ;
- le travail G20 (schéma **24**, snapshot **4088**, témoin 256 o à
  **3832**, bit `1u << 20`, `[P1.G20]`) peut être **encore
  uncommitted** dans l’un des deux worktrees ;
- si le worktree impl n’a **pas** le schéma 24 / `promotion.G20` /
  `g20_limit_families` : **arrête et rapporte**. G21 dépend de G20.
  Ne rebase pas, ne reset pas, ne réécris pas G20 ;
- pas de façade G21, pas de `FF8ISO_SUITE_G21_*`, pas de témoin
  G21, pas de `G21.suite.toml` ;
- `make_suite_payload.py` s’arrête à G20 / P1 ;
- `REQUIRED_SUITES` s’arrête à G20 ;
- codecs déjà là (à composer, pas à dupliquer) :
  `kernel_magic_codec`, `kernel_item_codec`,
  `kernel_command_ability_codec`, `kernel_enemy_attack_codec`,
  `kernel_gf_codec`, `kernel_limit_codec`, `dat_section8_codec`,
  `monster_ability_codec` ;
- `kernel.bin` fixture SHA-256
  `e378fb8f198ede3dae858f0ded6670f9ba423aa79abfff7237e701dfc7f9e7f6`
  (37 992 octets) ;
- `F_CHAR_DATA` est dans l’address map (`0x018ff000`, `0x0570`)
  comme **working copy hôte**. G21 le *décrit* ; G22 l’écrit ;
- `crisis_level` / Limits apply restent G20.

Revalide `git status`, `git log -5`, `validate_contracts.py` et le
binaire de tests au début. Préserve le travail utilisateur et G20.
Ne lance pas de link si `FF8_EN.exe` tourne.

## Contrats précédents à préserver

### G20 — clos

`[promotion.G20].satisfied = true`. Ne réécris aucune enveloppe
hash-bound :

| Fichier | SHA-256 |
| --- | --- |
| `evidence/battle-iso/p1-g20-crisis-post-suite-2026-08-28.json` | `7dfd7b2d9b3491218a974236c638db14f71392db0f8ba7b714d12f54d8ce8a1b` |
| `evidence/battle-iso/p1-g20-post-shutdown-2026-08-28.json` | `e6f7c0f49fdcc97bb0dc6b987a8e5c845f5e20de1140fa1af0d0e8bb45fe544e` |

SQ-G20-001 (records Limit authentiques) **reste ouvert**. Ne le
ferme pas depuis G21. Ne change pas `resolve_limit_action` /
`compute_crisis_level`.

### G19 / G18 / G15–G16

- G19 : enveloppes Recover / shutdown hash-bound
  (`5bb1b9e8…` / `464d7413…`). SQ-G19-001 ouvert.
- G18 : ne touche pas seed labo `12`, Zantetsuken, finalize summon.
- G15–G16 : `dat_section8_codec` / `monster_ability_codec` restent
  la source AI. G21 **ajoute** les autres sections `.dat` prouvées ;
  il ne casse pas le parse section 8.

### G06 / G07 / G09–G14

Aucun write HUD, pending, HP, status, ATB, présentation. Allowlist
live G21 = **vide** (lecture seule) sauf preuve IDA qu’un octet
hors combat est requis — et même alors, pas un slot de combat.

## Architecture à poser

### `core`

Possède le descripteur sémantique : `EncounterId`, flags, mapping
ennemis, positions, refs stage/caméra **comme IDs**, party view
(stats/junction/stock **déjà typés**), refs kernel row, refs
monster dat, erreurs de bornes. Pas de RVA, pas de POD natif, pas
de `find_symbol`, pas d’`#include "ff8iso/abi/"`.

Réutilise les types / catalogs G11–G20 (`MagicCatalog`,
`LimitCatalog`, `CommandCatalog`, `GfCatalog`, …). Ne les
re-déclare pas.

### `application`

`run_describe_encounter` (nom à aligner) : une copie, un
descripteur, **zéro commit hôte**. Rollback = no-op si tu n’as
rien écrit — mais le rapport doit le dire.

### `abi`

POD / address map seulement. Ajoute un symbole (`scene.out` path,
`CURRENT_ENCOUNTER_*` si tu le *lis* comme id, archive handle)
**après** IDB. `COMBAT_SCENE_ID` existe déjà.

### `runtime-x86`

Codecs octets : `scene.out` 128 o, save/party, sections `.dat`
manquantes. Compose les codecs kernel existants.

Pas de `TemporaryG21NcompAdapter` pour du gameplay. Interdit
d’appeler `ReadSceneOutForEncounter` / `ParseBattleParty` /
`SceneOut_InitEnemySlot` depuis core/application.

`Archive_IO_LoadFile` : seulement runtime HOST, seulement si
l’ABI est prouvée **et** que les fixtures ne suffisent pas. Le
pack hors-ligne **doit** passer sur des fichiers extraits, comme
`tests/fixtures/g12/kernel.bin`.

Snapshot : **append-only**. Témoin G21 = schéma **25**, **après**
4088. Tailles actuelles à ne pas bouger :

| Témoin | Intervalle | Schéma |
| --- | --- | ---: |
| G18 | `[3320:3576]` | 22+ |
| G19 | `[3576:3832]` | 23+ |
| G20 | `[3832:4088]` | 24 |

Vérifie `sizeof(FF8IsoRuntimeEvidenceSnapshot)` dans
`launch_contract.h` avant d’étendre. Un témoin 256 o donne **4344**.
`static_assert` obligatoire.

## Unités

### U21.1 `scene.out`

Autorisé :

- rangée 128 o, index `scene_id << 7` (`0x48D0E0`) ;
- flags, mapping ennemis, positions, refs stage/caméra **si** le
  layout IDA / wiki est fermé octet par octet ;
- bornes : `offset + 128 <= file_size` ; `scene_id` hors fichier =
  erreur typée.

Interdit :

- inventer des champs « d’après wiki communautaire » sans IDB ou
  dump authentifié ;
- écrire `CURRENT_ENCOUNTER_DATA_SCENE_OUT` ;
- appeler `SceneOut_InitEnemySlot`.

### U21.2 Kernel readers

Façade : un `describe` qui *sélectionne* les rangées déjà décodées
(Magic 57, Item 32, commands 39/12/16, GF, Limits, enemy attacks).
Fixture `kernel.bin` `e378fb8f…`.

Si une section n’a pas encore de codec (ex. une table que G10–G20
n’ont pas portée) : decode-only **après** preuve de stride, sinon
SQ + skip. Ne « complète » pas le kernel au feeling.

### U21.3 Save / party

Source = octets save / `SG_ARRAY_CHARA_DATA` **lus comme fichier
ou dump**, pas le résultat de `ParseBattleParty`.

Porté seulement si le layout est dans l’IDB / address map / docs
prouvés. Junction, stock magie, items, GF, config, story flags :
chacun fail-closed séparément si le champ n’est pas borné.

Ne reconstruis pas `F_CHAR_DATA` hôte.

### U21.4 Monster `.dat`

Réutilise `decode_monster_dat` / section 8. Ajoute info, ability
table (codec G16 si déjà suffisant), texte, refs modèle/effet
**bornées**. G27–G29 possèdent le visuel : G21 s’arrête à
l’identifiant et à la taille de section.

### U21.5 Working copies

Documente + decode-from-bytes `F_CHAR_DATA` (0x570), equal-item,
strings, IDs transitoires. Tests hors-ligne sur dumps. **Zero
`export_*` vers l’hôte.**

### U21.6 Resource descriptors

`{ kind, id, lifetime }` seulement. Stage / caméra / texture =
IDs. Pas de mesh, pas de TIM, pas de BdLink.

### U21.7 Failure

Toute entrée malformée : erreur typée, pas d’exception non
capturée, pas de write. Corpus fuzz / truncate obligatoire dans
`test_g21.cpp`.

## Protocole runtime G21 — à créer

Avant FF8 :

- bit `FF8ISO_SUITE_G21_BATTLE_DATA = 1u << 21` ;
- evidence `FF8ISO_EVIDENCE_G21_BATTLE_DATA` (prochaine valeur libre
  après G20 = 32 ; prends **33** si 32 est G20) ;
- protocole versionné `g21-battle-data-v1` ;
- témoin append-only (scénario, scene_id, row hash, catalog
  counts, error, write_count=0, forbidden calls, runtime_state,
  `battle_imported=0`) ;
- `tools/make_suite_payload.py --group G21 --profile P1` ;
- `tests/in-process/G21.suite.toml` ;
- `tests/offline/test_g21.cpp` + `test_g21_payload.py` ;
- decodeur evidence + `validate_evidence_envelope.py` ;
- `[P1.G21]` dans `ownership-matrix.toml` ;
- `[promotion.G21]` dans `evidence-policy.toml` **sans**
  `satisfied = true`.

`validate_contracts.py` n’ajoute G21 à `REQUIRED_SUITES` que lorsque
le protocole existe, et le bloc promotion reste `false` jusqu’au
live.

Scénarios payload minimaux (réarmables sans rebuild) :

1. `describe` — parse fixture `scene.out` + `kernel.bin` + un
   `.dat` connu → hashes stables, `write_count == 0`,
   `battle_imported == 0` ;
2. `bounds` — fichier tronqué / `scene_id` overflow → erreur typée,
   0 write ;
3. `refuse-init` — si `BattleActive` / pause combat : refuse
   (`Busy` ou `InvalidState`), **ne pas** tomber sur
   `import_legacy` comme source du descripteur ;
4. `field-id` optionnel — lit `COMBAT_SCENE_ID` sur le terrain
   (u16) et parse **le fichier**, pas le blob
   `CURRENT_ENCOUNTER_DATA_SCENE_OUT`.

Ne crée pas de scénario « init puis compare les slots ». Ne crée
pas de profil P2.

## Audit des appels et écritures

Interdis depuis `core` / `application` et le seam G21 :

- `ReadSceneOutForEncounter`, `SceneOut_InitEnemySlot`,
  `ParseBattleParty`, `BS_ParseItems`,
  `setAllMonsterInfoFromDatSection` ;
- tout helper déjà interdit à G18–G20
  (`BattleAction_ResolveAndApplyDamage`, `ComputeRenzokukenDamage`,
  persist Card/Mug/Devour, …) ;
- `import_legacy` **comme source** du descripteur.

Allowlist live : **vide**. `write_count` doit rester 0. Un write
combat est terminal.

## Politique live

Même discipline que G16–G20 **sauf le lieu** :

- CTest cumulatif vert, contrats verts, DLL PE32, hash calculé,
  payloads prêts ;
- jeu fermé avant build, relancé par l’opérateur ;
- bootstrap → préimage → watch → **une** action → verdict machine →
  `FF8Iso_Shutdown` → `Detached` + survie ;
- un `BUSY` : une frontière de frame, une seule tentative ;
- ne reconstruis jamais une DLL chargée ;
- ne réécris aucune enveloppe G18 / G19 / G20.

Bootstrap : flags `0x47` (frame seam + garde Odin/Gilgamesh, **pas**
HUD/ATB/Director). La garde spéciale n’est pas un outil « pour
forcer une rencontre ».

**Le live se fait hors combat.** Terrain / OpenWorld / menu, comme
le bootstrap G20. `safe_field_or_menu == true`. Ne demande **pas**
d’entrer en combat. Ifrit n’est pas requis.

Fixtures : extraire ou réutiliser un `scene.out` / un `.dat`
authentifiés (SHA-256 dans la note). Ne pas inventer une rencontre.

## Stratégie live minimale — une session, pas de combat

Une ancre représentative suffit.

Ordre recommandé, **un seul PID** si stable :

1. Bootstrap sur le terrain (mode 2), canaries : HUD/ATB/Director
   non installés, `battle_post_init == false`.
2. Suite `describe` : hashes = fixtures hors-ligne, 0 write, 0
   import battle.
3. Suite `bounds` : truncate, erreur typée, 0 write.
4. `field-id` optionnel si `COMBAT_SCENE_ID` est un u16 stable hors
   combat. Sinon skip + documente.
5. Shutdown → `Detached`, préimage frame restaurée, processus
   vivant.

Si l’opérateur est déjà en combat : **ne lance pas** la suite
describe comme ancre. Demande de sortir, ou utilise seulement
`refuse-init` comme preuve négative, puis une **nouvelle** session
terrain pour l’ancre positive.

Pas de campagne G22. Pas de Limits. Pas de P2.

## Instructions à l’opérateur

- français ;
- une action à la fois (lancer le jeu, rester hors combat, fermer) ;
- aucune mutation mémoire non annoncée ;
- fermer FF8 avant tout link ;
- si l’opérateur redémarre, abandonne l’ancien PID.

Ne lui demande pas d’entrer en combat, de farmer une crise, ni de
lire des HP à l’œil.

## Vérifications avant promotion

```powershell
python .\tools\validate_contracts.py
cmake --build --preset debug-x86 --parallel --target battle_iso_tests
.\build\debug-x86\bin\Debug\battle_iso_tests.exe G20
.\build\debug-x86\bin\Debug\battle_iso_tests.exe G21
ctest --preset debug-x86 --output-on-failure
```

Puis payloads G21 une fois le protocole posé. DLL PE32 + SHA-256.

La promotion est interdite si :

- le descripteur vient d’un snapshot post-init ;
- un helper d’init natif est appelé ;
- un write combat a lieu ;
- une rangée kernel / scene / dat claimée n’a pas de fixture
  hors-ligne ;
- un layout « à peu près » fait passer un test ;
- G00–G20 régressent, ou une enveloppe G18–G20 change de hash ;
- le hash DLL de preuve ≠ candidat final ;
- le live a utilisé le profil P2 ou `Invoke-IsoGroup` ;
- G22 (init) a commencé.

Une promotion **avec** SQ-G21-xxx ouvertes est licite **si** le live
prouve describe + refuse bornes, et que les sections non prouvées
restent refusées. Même pattern que G20 + SQ-G20-001.

## Manifestes et documentation

Minimum :

- `manifests/ownership-matrix.toml` `[P1.G21]` (`offline-draft`
  jusqu’au live, puis `live-promoted` **seulement** après l’ancre) ;
- `manifests/evidence-policy.toml` `[promotion.G21]` ;
- address map / ABI ledger si un symbole nouveau est prouvé ;
- CMake, suite G21, README ;
- `obsidian-docs/projects/re-ff8/references/battle-iso-migration-milestones.md`
  unités U21.x — corrige le test injecté `Invoke-IsoGroup` / P2 ;
- ledger + SQ-G21-xxx nommées (ne recycle pas SQ-G20-001) ;
- page
  `obsidian-docs/projects/final-fantasy-viii-reimaginated/references/p1-g21-battle-data-validation.md` ;
- journal du jour.

`[P2]` reste sans `claimed` et sans `satisfied`. Ne l’invente pas.

Preuves attendues :

```text
evidence/g21-battle-data-offline-draft-YYYY-MM-DD.md
evidence/g21-battle-data-offline-validation-YYYY-MM-DD.md
evidence/g21-battle-data-live-promotion-YYYY-MM-DD.md
evidence/battle-iso/p1-g21-*-post-suite-*.json
evidence/battle-iso/p1-g21-*-post-shutdown-*.json
```

Ingest `ff8-evidence-wiki-ingest`, puis compile QMD.

## Stop conditions

Arrête et rapporte le diagnostic si :

- G20 n’est pas présent (schéma ≠ 24, pas de promotion G20) ;
- tu dois entrer en combat pour que le test passe ;
- tu dois appeler `ParseBattleParty` / `ReadSceneOutForEncounter`
  natif ;
- tu dois écrire `F_CHAR_DATA` / slots / ATB ;
- un layout scene/save/dat « à peu près » serait nécessaire ;
- le jeu tourne au moment d’un link ;
- PID ou hash DLL change en session ;
- write guard / call audit faute ;
- G18–G20 promotion ou enveloppes sont menacées ;
- tu es tenté d’écrire `[P2] claimed`.

Ne promeus pas « avec dette » une violation de frontière. Des SQ
ouvertes n’empêchent pas une promotion **si** le live prouve
l’owned (describe) et le refuse (bornes), pas l’inventé.

## Rapport final attendu

1. fichiers créés / modifiés (diff vs worktree G20) ;
2. frontières de couches ;
3. tables / fichiers décodés vs refusés (scene, kernel reuse,
   save, dat, working copies) ;
4. CTest / contrats / nouveau total ;
5. hash DLL, schéma snapshot, bit suite ;
6. résultat live (describe / bounds / refuse-init / field-id) ;
7. appels natifs et écritures (doivent être 0 writes combat) ;
8. rollback / `Detached` / survie ;
9. confiance U21.1–U21.7 ;
10. SQ restantes (G21 **et** G20 inchangées) ;
11. statut `[promotion.G21].satisfied` ;
12. pages Oxygen + QMD ;
13. confirmation explicite : **P2 non ouvert**, **G22 non commencé**.

Ne conclus jamais « G21 terminé » ni « P2 ouvert » si le rapport ne
distingue pas : prouvé hors-ligne, prouvé live représentatif, encore
seulement inventorié et refusé.
