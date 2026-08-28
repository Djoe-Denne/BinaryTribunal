# Nouveau batch — G20 familles Limit Break

Tu dois **commencer** G20. Il n’existe **aucun** draft domaine Limit
commité : pas de `core/limit_*`, pas de codec `K_RENZOKUKEN` /
`K_DUEL` / `K_BLUE_MAGIC_*`, pas de bit suite, pas de témoin
snapshot. Le champ `crisis_level` existe déjà dans l’ABI et
l’import ; ne le réinvente pas.

Prépare ensuite toute l’instrumentation manquante, puis conduis la
validation live **minimale** avec l’opérateur. Travaille de façon
autonome jusqu’au premier geste réellement nécessaire dans FF8. À ce
moment-là, demande une action courte, précise et unique.

Ne committe et ne pousse rien sans demande explicite.

G19 est **live-promoted**. Ne le rouvre pas. Ne commence pas G21.
Le gate milestone « P2 GameplayDomain / six personnages / zéro appel
domaine natif » **n’est pas** le contrat de ce batch.

## Résultat attendu

À la fin de **ce** batch :

- les unités U20.1 à U20.8 sont soit implémentées et testées, soit
  explicitement fail-closed avec une `SQ-G20-xxx` nommée ;
- aucun `COMMAND_TYPE_ID` Limit-adjacent n’entre dans un défaut
  silencieux — y compris les follow-ups **237 / 238 / 241 / 250**
  encore `Unsupported` dans `classify_command` ;
- les tables kernel Limit **trouvées dans le `kernel.bin`
  authentifié** sont décodées ; une table absente ou un stride
  non prouvé = pas de rangée inventée ;
- la crise `BATTLE_SLOT_DATA+0xCA` est clampée `0..4` si et seulement
  si la formule IDA est fermée ; sinon observe-only + SQ ;
- l’overlay menu bit `0x04` n’est **pas** un write HUD G06 ;
- Quistis (U20.5) est le premier candidat replacement-owned si le
  select `spell_id * 4 + crisis_level - 1` est prouvé ;
- Squall (U20.2) décode `K_RENZOKUKEN_FINISHER` et encode auto vs
  trigger ; les fenêtres slash et la pondération crise→finisher
  restent SQ tant que le CFG n’est pas fermé ;
- Zell / Irvine / Selphie reroll / temp chars restent fail-closed
  tant que l’input ou le weighting n’est pas prouvé ;
- Angel Wing encode `status_2 & 0x02000000` et le `*5` Magic comme
  contrainte G11 ; consume vs no-consume et set/clear restent SQ
  (conflit ledger / staging) ;
- Angelo auto `240` / Odin-Gilgamesh `245` restent G17/G18 ;
- une campagne live unique, sous **P1**, prouve **une** ancre
  (crise et/ou une famille table-driven et/ou un dump U20.8) plus
  un refuse représentatif ;
- rollback exact, `Detached`, processus vivant ;
- README, contrats, ownership, address map, ABI ledger et wiki
  Oxygen à jour ;
- `[promotion.G20].satisfied` reste `false` jusqu’à la clôture live.

G20 ne possède pas Attack (G09), Magic (G11), Item (G12), Draw (G13),
Enemy attack (G16), GF (G18), les command abilities G19, ni la
caméra Renzokuken (G14). Slot et Angel Wing **réutilisent** G11 ;
les hits finisher **réutilisent** G09. Ne les réimplémente pas.

Ce batch **ne clôt pas** P2. `content-matrix.toml` a
`[P2] blocked_until = ["G13..G20"]`. Reste sur le profil **P1**.

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
qmd get ff8-wiki/projects/re-ff8/references/battle-iso-migration-milestones.md:787:20 --no-line-numbers
qmd get ff8-wiki/projects/re-ff8/references/g11-g20-static-readiness-ledger.md:643:30 --no-line-numbers
qmd get ff8-wiki/projects/re-ff8/references/g11-g20-static-open-questions.md:462:20 --no-line-numbers
qmd get ff8-wiki/projects/re-ff8/concepts/limit-break-architecture.md --no-line-numbers
qmd get ff8-wiki/projects/re-ff8/concepts/renzokuken.md --no-line-numbers
qmd get ff8-wiki/projects/re-ff8/concepts/command-action-pipeline.md --no-line-numbers
qmd get ff8-wiki/projects/re-ff8/concepts/input-configuration.md --no-line-numbers
qmd get ff8-wiki/projects/re-ff8/skills/ff8-live-validation-operations.md --no-line-numbers
qmd get ff8-wiki/projects/final-fantasy-viii-reimaginated/references/p1-g19-command-abilities-validation.md --no-line-numbers
```

Lis aussi directement :

```text
ai-prompt/todo/g19-command-abilities-new-chat.md
obsidian-docs/projects/re-ff8/concepts/limit-break-architecture.md
obsidian-docs/projects/re-ff8/concepts/renzokuken.md
obsidian-docs/_staging/investigations/limit_breaks.md
docs/tech/systems/command_menu.md
docs/tech/reference/command_id_table.md
docs/tech/reference/battle_slot_layout.md
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
machines certifiées :

| Symbole | EA | Rôle |
| --- | ---: | --- |
| `BattleLimit_ComputeCrisisAndToggleAttackSlot` | `0x4941F0` | formule menu + clamp + overlay |
| `Battle_ComputeCrisisLevelFromHP` | `0x494360` | HP-ratio (init) |
| `BattleCommandMenu_InitCommandSetAndLimitState` | `0x4BB910` | rebuild menu / Limit |
| `BattlePendingAction_Write` | `0x484D20` | entrée pending **ordinaire** |
| `BattleLimitRenzokuken_SetFinisherAndComputeTargetMask` | `0x48F270` | index finisher + mask |
| `ComputeRenzokukenDamage` | `0x48F350` | boucle hits `0xF9` — **interdit** depuis core |
| `getRenzokukenFinisherText` | `0x47E5F0` | nom finisher |
| `RelatedToShotIrvineLimit` | `0x48D1A0` | callback Shot |
| `BattleLimitAngelWing_SelectAutoCast` | `0x483D60` | rewrite Magic/Attack |
| `K_WEAPON` | `0x1CF7400` | bitmask finishers |
| `K_RENZOKUKEN_FINISHER` | `0x1CF758C` | 12 o / entrée |
| `K_BLUE_MAGIC` | `0x1CF8340` | famille sort |
| `K_BLUE_MAGIC_PARAM` | `0x1CF8440` | 4 rangées / sort |
| `K_SHOT` | `0x1CF8640` | ammo / targetInfo |
| `K_DUEL` | `0x1CF8700` | moves Zell |
| `K_DUEL_PARAM` | `0x1CF8840` | opener crise |
| `K_RINOA_LIMIT_PART_2` | `0x1CF88B4` | Angelo manuel |
| `SG_RENZOKUKEN_AUTO` | `0x1CFE978` | bit 0 = auto |
| `SG_RENZOKUKEN_INDICATOR` | `0x1CFE979` | prompt timing |
| `byte_1D28E2E` | `0x1D28E2E` | index finisher |
| `SHOT_INDEX` | `0x1D28E24` | ammo_id − 101 |
| `SG_LIMIT_BREAK_IRVINE` | `0x1CFE770` | état Shot |
| `SG_LIMIT_BREAK_SELPHIE` | `0x1CFE771` | Slot id `>= 0x33` |

Ces EA sont des **miroirs BSS** runtime. Les valeurs expédiées
viennent du `kernel.bin` authentifié. Calcule les offsets fichier
depuis le header de section, comme G19 (`0xE4` / `0x4020` /
`0x4C0C`). N’invente pas un stride.

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

`Invoke-IsoGroup` **n’existe pas**. Le test injecté du milestone G20
(« `Invoke-IsoGroup -Group G20 -Profile P2` ») est **obsolète**.
Flux live réel — identique à G15–G19 :

```text
tools\make_bootstrap_payload.py
tools\make_suite_payload.py
app_injector.exe  (FF8Iso_Bootstrap / FF8Iso_RunInProcessSuite / FF8Iso_Shutdown)
tools\capture_runtime_evidence.py
tools\capture_live_canaries.py
```

État observé le 2026-08-28, **à revalider** :

- G18 et G19 sont `live-promoted`. `[promotion.G19].satisfied = true`
  (Session P, PID **51944**, DLL
  `ec7c5bc32f856fed938d2faf74ae9bdd02f2df2757e09cefc7406fe90580859a`) ;
- le travail G19 (schéma **23**, snapshot **3832**, témoin 256 o à
  **3576**, bit `1u << 19`, `[P1.G19]`) peut être **encore
  uncommitted** dans l’un des deux worktrees ;
- si le worktree impl n’a **pas** le schéma 23 / `promotion.G19` /
  `g19_command_abilities` : **arrête et rapporte**. G20 dépend de
  G19. Ne rebase pas, ne reset pas, ne réécris pas G19 ;
- pas de domaine Limit, pas de `FF8ISO_SUITE_G20_*`, pas de témoin
  G20, pas de `G20.suite.toml` ;
- `make_suite_payload.py` s’arrête à G19 / P1 ;
- `REQUIRED_SUITES` s’arrête à G19 ;
- `crisis_level` existe déjà : `BattleSlotPod+0xCA`,
  `core::BattleState`, import/export `legacy_state_codec.cpp` ;
- `update_crisis_bits` dans G09/G11/G12 = bits HP% de `status_1`
  (`<50%` / `<25%`). **Ce n’est pas** U20.1 ;
- `classify_command` marque 14–22 et `0xF9` comme `LimitG20` ;
  `resolve_command_action` les refuse `OwnedByOtherGate` ;
- 237 / 238 / 241 / 250 tombent encore dans `Unsupported` ;
- `kernel.bin` fixture SHA-256
  `e378fb8f198ede3dae858f0ded6670f9ba423aa79abfff7237e701dfc7f9e7f6`
  (37 992 octets).

Revalide `git status`, `git log -5`, `validate_contracts.py` et le
binaire de tests au début. Préserve le travail utilisateur et G19.
Ne lance pas de link si `FF8_EN.exe` tourne.

## Contrats précédents à préserver

### G19 — clos

`[promotion.G19].satisfied = true`. Ne réécris aucune enveloppe
hash-bound :

| Fichier | SHA-256 |
| --- | --- |
| `evidence/battle-iso/p1-g19-state-post-suite-2026-08-28.json` | `5bb1b9e8dbb3f4856013558fa47037ec0c6f758091456ba766cb00c22ac00fb9` |
| `evidence/battle-iso/p1-g19-post-shutdown-2026-08-28.json` | `464d74133f1c6f5239fbf466450a2b01e36ef5721ac4f3722d82d44d93c387de` |

SQ-G19-001 (Card / Devour / Mug persist) **reste ouvert**. Ne le
ferme pas depuis G20. Ne change pas `classify_command` pour les IDs
G19-owned. Quand tu prends 14–22 / `0xF9` / follow-ups, c’est
`resolve` G20 qui cesse de renvoyer `OwnedByOtherGate` **uniquement**
pour les familles que tu possèdes vraiment.

### G18 / G17 / G09 / G11

- G18 : ne touche pas les enveloppes, le seed laboratoire `12`,
  Zantetsuken, `BattleGF_FinalizeSummonExit`.
- G17 : Angelo auto `240`, Odin/Gilgamesh `245`, rolls auto-special.
  Ce n’est **pas** U20.7 manuel (`Combine` 19 /
  `K_RINOA_LIMIT_PART_2`).
- G09 : hits physiques / finisher. G20 ne rappelle pas
  `BattleAction_ResolveAndApplyDamage` ni `ComputeRenzokukenDamage`.
- G11 : Slot et Angel Wing-as-Magic. Le `*5` Angel Wing est une
  contrainte d’entrée G11, pas un second resolver Magic.

### G06 / G07 / G08 / G14

- G06 possède HUD / overlay menu. Ne pose pas de write natif sur le
  bit `0x04` du slot Attack « pour voir le Limit ».
- G07 possède pending / exec / arbitration. L’entrée Limit **est**
  un pending ordinaire (`limit-break-architecture.md`). Consomme
  `ActionRequest` ; ne réécris pas le spine.
- G08 possède le `TargetPlan`. G20 pose des contraintes
  (`targetInfo` finisher / Blue Magic / Shot), pas un second walker.
- G14 possède caméra et NCOMP. La caméra Renzokuken (takeover
  `0x8000` / overlay slashes) **n’est pas** G20. Pas de
  `TemporaryG20NcompAdapter` pour du gameplay.

## Contrat G20 autoritatif

G20 dépend de G19 et porte les unités du milestone. Confiance ledger
**0.40 `mapped`**. Les noms de fonctions **ne sont pas** des state
machines certifiées.

| Unité | Contenu | État 2026-08-28 | Trou |
| --- | --- | --- | --- |
| **U20.1** | Crise `+0xCA` clamp 0..4 ; overlay ; pending ordinaire ; cleanup partagé | champ ABI seulement | formule menu vs HP-ratio ; overlay vs G06 |
| **U20.2** | Squall : trigger idx 5, auto, slashes, finishers, mask, `0xF9` | adresses nommées | fenêtres live ; pondération crise→finisher |
| **U20.3** | Zell : opener, `K_DUEL` / `K_DUEL_PARAM`, timeout | tables EA | séquence input live |
| **U20.4** | Irvine : ammo, Shot 14/237/238, timeout, callback | tables EA | timing live |
| **U20.5** | Quistis : Blue Magic + `K_BLUE_MAGIC_PARAM` 4 rangées | formule index documentée | select crise à prouver sur kernel.bin |
| **U20.6** | Selphie : Slot 16 → `K_MAGIC` | reuse G11 clair | reroll crise **ambiguous** |
| **U20.7** | Rinoa : Combine 19 + Angel Wing `0x02000000` `*5` | bit + multiplier documentés | consume vs no-consume ; set/clear |
| **U20.8** | pending/current bytes par famille | **live-required** | SQ-G20-001 confiance 0.30 |

Le gate milestone *all claimed gameplay-domain routes work from
imported post-init state with deterministic input and no original
battle-domain call* s’applique **aux routes que tu claims**. Une
famille fail-closed n’est pas claim. Six Limits live en une session
est **hors contrat**.

## Ce qui existe déjà — audite, ne réécris pas

```text
abi/include/ff8iso/abi/layout.hpp          BattleSlotPod.crisis_level @ 0xCA
core/include/ff8iso/core/battle_state.hpp  crisis_level
runtime-x86/src/legacy_state_codec.cpp     import / export crisis_level
core/include/ff8iso/core/command_ability.hpp
core/src/command_ability.cpp               LimitG20 + OwnedByOtherGate
tests/offline/test_g19.cpp                 matrice 256 IDs (ne casse pas)
contracts/include/ff8iso/launch_contract.h schéma 23, snapshot 3832
```

N’ajoute **pas** `crisis_level` une seconde fois. N’étends pas
`command_ability.cpp` en fourre-tout Limit : nouveau module
`core/limit_*` (ou nom équivalent), session `application/limit_*`,
codec `runtime-x86` séparé. `classify_command` reste l’inventaire
unique des 256 IDs — étends-le, ne le fork pas.

## État de confiance — ne pas le maquiller

| Unité | État | Confiance | Plafond sans preuve |
| --- | --- | ---: | --- |
| U20.1 | recognition | 0.45 | 0.70 sans formule IDA fermée ; 0.80 sans ancre live `+0xCA` |
| U20.2 | mapped | 0.40 | 0.55 sans fenêtres ; 0.70 si table+auto seulement |
| U20.3 | mapped | 0.35 | 0.50 tant que l’input n’est pas dumpé |
| U20.4 | mapped | 0.35 | 0.50 tant que le timer/ammo n’est pas dumpé |
| U20.5 | static-partial | 0.50 | 0.75 si index 4-rangées + kernel prouvés hors-ligne |
| U20.6 | ambiguous | 0.30 | 0.45 tant que le reroll est ouvert ; Slot-as-Magic peut être 0.65 |
| U20.7 | static-partial | 0.40 | 0.55 tant que consume/set-clear sont en conflit |
| U20.8 | live-required | 0.30 | 0.60 pour **une** famille dumpée ; pas 0.80 global |

Une ancre live crise ou Blue Magic **ne certifie pas** Renzokuken
manuel, Duel, Shot, ni Slot reroll.

## Premier incrément — ordre de fermeture

G20 n’est pas « terminer un draft ». Ferme dans cet ordre. N’avance
pas à l’étape suivante en inventant l’étape courante.

### 1. Inventaire (U20.1 / U20.8 reconnaissance)

Étends `classify_command` pour que **chaque** byte Limit-adjacent
ait un owner. Minimum déjà vu en statique :

| ID | Famille | Notes |
| ---: | --- | --- |
| 14 | Shot launch | U20.4 |
| 15 | Blue Magic | U20.5 |
| 16 | Slot | U20.6 → G11 |
| 17–18, 20–22 | Temp / `K_TEMP_CHAR` | G20-adjacent, fail-closed |
| 19 | Combine | U20.7 manuel |
| 237 | Shot on-hit | U20.4 follow-up |
| 238 | Shot timeout | U20.4 follow-up |
| 241 (`0xF1`) | Duel | U20.3 |
| 249 (`0xF9`) | Renzokuken hits | U20.2 resolve |
| 250 (`0xFA`) | Renzokuken schedule | U20.2 follow-up, **≠** `0xF9` |

Sentinelles Duel `0xFFFA` / `0xFFFC` : ne les documente pas comme
moves ordinaires. Toute nouvelle ID va dans `classify_command`,
jamais dans un `default` mute.

### 2. Crise (U20.1)

Deux helpers distincts :

- `0x494360` — HP-ratio (init) ;
- `0x4941F0` — menu : statuts, party-down, terme
  `-10 * multiplier * currentHP / maxHP`, RNG
  `GetRandomInt() + 160`, clamp `0..4`, overlay si `> 0`.

Ferme le CFG IDA **avant** d’encoder la formule. Le paragraphe
`command_menu.md` est un fragment, pas une spec. Si le CFG reste
ouvert : encode uniquement le clamp + un `CrisisComputeUnsupported`,
et le live se limite à observer `+0xCA` natif.

Domain : `crisis_level` sémantique. Overlay eligible = flag domain,
pas un write menu. Ne touche pas `update_crisis_bits`.

RNG crise : seed laboratoire déterministe, comme G18. Pas de
`GetRandomInt` hôte depuis core.

### 3. Codecs kernel

Pour chaque table que tu claims, prouve sur le fixture :

- numéro de section + offset fichier + taille + stride × rangées ;
- hash de rangée dans les tests ;
- symbole address map seulement après IDB.

Candidats, par facilité statique :

1. `K_BLUE_MAGIC` + `K_BLUE_MAGIC_PARAM` (U20.5) ;
2. `K_RENZOKUKEN_FINISHER` 12 o (U20.2) ;
3. `K_WEAPON` bitmask finishers (U20.2 gate, pas la formule slash) ;
4. `K_RINOA_LIMIT_PART_2` (U20.7) ;
5. `K_SHOT` / `K_DUEL` / `K_DUEL_PARAM` — decode OK, apply fail-closed
   tant que l’input n’est pas fermé ;
6. `K_MISC` lookups crise (Zell opener, Irvine timer) — decode si
   trouvé, n’invente pas l’index.

`K_MAGIC` est déjà G11. Slot lit, ne recopie pas.

### 4. Famille table-driven — Quistis d’abord (U20.5)

Invariant staging : index param =
`spell_id * 4 + crisis_level - 1`. Crise `0` = pas de Limit, donc
pas de rangée. Porte ça hors-ligne si le kernel le confirme.

Resolve Blue Magic = metadata `K_BLUE_MAGIC` + payload crise
`K_BLUE_MAGIC_PARAM`, puis **G09/G10/G11 selon attack_type**, pas un
troisième apply. Miss / `target_info` = contrainte G08.

Si l’index ou le stride casse sur le fixture : refuse typé, pas une
rangée « à peu près ».

### 5. Squall sans fenêtres (U20.2)

Autorisé hors-ligne :

- decoder `K_RENZOKUKEN_FINISHER` `{ textIndex, targetInfo, hitCount }` ;
- gate bitmask `K_WEAPON[weapon].renzokukenFinishers` si le champ
  est prouvé ;
- encode `SG_RENZOKUKEN_AUTO` bit 0 = tous les slashes automatiques ;
- follow-up `0xFA` (schedule) vs resolve `0xF9` (hits) comme deux
  états, pas un seul ID ;
- mask : garder le caller sauf `targetInfo` demande `0x8000`.

Interdit sans preuve CFG/live :

- state machine des fenêtres trigger (input logique index 5) ;
- pondération crise → index `byte_1D28E2E` ;
- appeler `ComputeRenzokukenDamage` / resolver natif ;
- scripts MAG_160 / Lion Heart / caméra.

Hits finisher owned = boucle domain vers l’apply G09, `hitCount`
fois, même contrat cible que G08.

### 6. Fail-closed explicite

| Famille | Erreur / SQ | Pourquoi |
| --- | --- | --- |
| Zell input / timeout | `LimitInputUnsupported` + SQ | séquence live |
| Irvine timer / ammo persist | idem | timing + `RelatedToItemAmount` |
| Selphie reroll | `LimitRerollUnsupported` | weighting ambiguous |
| Temp 17–18, 20–22 | `OwnedByOtherGate` ou unsupported | `K_TEMP_CHAR` non porté |
| Angel Wing consume / clear | SQ nouvelle si tu claims le set | conflit ledger « no consume » vs staging MutateStock |
| Fenêtres Renzokuken | SQ-G20-001 / SQ dédiée | pas byte-tracé |
| Overlay HUD bit `0x04` | hors scope G06 | ne pas « tester » en écrivant le menu |

SQ-G20-001 **existe** (authentic records, 0.30, live-required).
N’ouvre une `SQ-G20-00x` que pour un refuse nommé. Ne recycle pas
SQ-G19-001.

### 7. Rinoa (U20.7) — encode, ne confonds pas

- Manuel : command **19** + `K_RINOA_LIMIT_PART_2`.
- Auto Angelo **240** = G17. Ne le route pas ici.
- Angel Wing = `status_2 |= 0x02000000`. Rewrite tour → Magic
  (`defaultTarget & 0x40`, 32 slots stock) sinon Attack. `*5` si
  attaquant Angel Wing **et** `COMMAND_TYPE_ID == Magic`.
- Ledger dit **no consume**. Staging dit MutateStock du chemin
  Magic. **Ne tranche pas** sans IDA ou dump. Fail-closed sur le
  stock jusqu’à preuve.
- Clear timing : unresolved. Ne l’invente pas.

## Hors scope strict

- P2, `Invoke-IsoGroup`, six Limits en une session ;
- caméra / scripts MAG Renzokuken (G14) ;
- HUD overlay / NCOMP « pour voir le Limit » (G06/G14) ;
- persist Card/Devour/Mug (SQ-G19-001) ;
- MiniMog, types G19 13/16/18 ;
- réouverture G18 (cinématique, HP=0 Zantetsuken) ;
- `BattleAction_ResolveAndApplyDamage`, `ComputeRenzokukenDamage`,
  `BattleLimitAngelWing_SelectAutoCast` depuis core/application ;
- insertion hôte `0x71` ;
- Cover/Regen/Return Damage G17 ;
- G21 readers / G22 init.

Une capacité hors scope = erreur typée ou `SQ-G20-xxx`, jamais un
fallback natif.

## Loi de couches

### `core`

Possède inventaire Limit, crise, familles, formules fermées,
transaction, rollback. Réutilise G09/G10/G11 (`apply` hits, status,
Magic). Pas de RVA, POD natif, `find_symbol`.

### `application`

`run_limit_action` (nom à aligner sur `run_command_action`) : une
copie, un commit, ou rollback.

### `abi`

POD / address map seulement. `crisis_level` est déjà posé. Ajoute
les symboles kernel **après** IDB.

### `runtime-x86`

Codec octets + seam live. Pas de `TemporaryG20NcompAdapter` pour du
gameplay. G14 scellé reste la seule unité NCOMP de présentation.

Snapshot : **append-only**. Témoin G20 = schéma **24**, **après**
3832. Tailles actuelles à ne pas bouger :

| Témoin | Intervalle | Schéma |
| --- | --- | ---: |
| G15 | `[2520:2776]` | 19+ |
| G16 | `[2776:3032]` | 20+ |
| G17 | `[3032:3288]` | 21+ |
| détail G17 | `[3288:3320]` | 21+ |
| G18 | `[3320:3576]` | 22+ |
| G19 | `[3576:3832]` | 23 |

Vérifie `sizeof(FF8IsoRuntimeEvidenceSnapshot)` dans
`launch_contract.h` avant d’étendre. Un témoin 256 o (comme G19)
donne 4088 si tu n’as pas besoin de plus. `static_assert` obligatoire.

## Protocole runtime G20 — à créer

Avant FF8 :

- bit `FF8ISO_SUITE_G20_LIMIT_FAMILIES = 1u << 20` ;
- evidence `FF8ISO_EVIDENCE_G20_LIMIT_FAMILIES = 32` ;
- protocole versionné `g20-limit-families-v1` ;
- témoin append-only (scénario, command_id, follow-up id, crise
  avant/après, table row hash, HP/status, error, rollback,
  forbidden calls, pending/current digest si U20.8) ;
- `tools/make_suite_payload.py --group G20 --profile P1` ;
- `tests/in-process/G20.suite.toml` ;
- `tests/offline/test_g20.cpp` + `test_g20_payload.py` ;
- decodeur evidence + `validate_evidence_envelope.py` ;
- `[P1.G20]` dans `ownership-matrix.toml` ;
- `[promotion.G20]` dans `evidence-policy.toml` **sans**
  `satisfied = true`.

`validate_contracts.py` n’ajoute G20 à `REQUIRED_SUITES` que lorsque
le protocole existe, et le bloc promotion reste `false` jusqu’au
live.

Scénarios payload minimaux (réarmables sans rebuild) :

1. `crisis` — compute ou observe `+0xCA` sur un slot party ; **pas**
   de write overlay menu ;
2. `blue` — Blue Magic table-driven si U20.5 est owned ; sinon
   skip et documente ;
3. `refuse` — Duel / Shot / Slot-reroll / temp char : error typé +
   rollback ;
4. `record` — optionnel U20.8 : digest pending/current d’un Limit
   **natif** joué par l’opérateur, zero write ISO.

Ne crée pas de scénario « six personnages ». Ne crée pas de profil
P2.

## Audit des appels et écritures

Interdis depuis `core` / `application` et le seam G20 :

- `BattleAction_ResolveAndApplyDamage` ;
- `ComputeRenzokukenDamage` ;
- `BattleLimitAngelWing_SelectAutoCast` (porte la règle, n’appelle
  pas le natif) ;
- `getMugObjectIdAndQuantity`, `Devour_ApplyPermanentStatBonuses`,
  `computeCardCommandDrop`, `sub_494AA0` ;
- tout helper GF déjà interdit à G18.

Allowlist live minimale, **si** tu commits :

- `crisis_level` du slot party owned (U20.1) ;
- HP / `status_1` / `status_1_copy` / `status_2` / `status_2_copy`
  déjà used par G09–G12 **uniquement** pour une famille owned
  (typiquement Blue Magic) ;
- pending/current **seulement** si le seam G20 les remplace et que
  U20.8 a un digest authentique pour cette famille.

Tout autre octet est terminal. Le bit menu `0x04` n’est pas
allowlisté. `SG_RENZOKUKEN_*` / `byte_1D28E2E` / `SHOT_INDEX` ne
sont allowlistés que si tu owns le follow-up **et** que le live le
demande.

## Politique live

Même discipline que G16–G19 :

- CTest cumulatif vert, contrats verts, DLL PE32, hash calculé,
  payloads prêts ;
- jeu fermé avant build, relancé par l’opérateur ;
- bootstrap → préimage → watch → **une** action → verdict machine →
  `FF8Iso_Shutdown` → `Detached` + survie ;
- un `BUSY` : une frontière de frame, une seule tentative ;
- ne reconstruis jamais une DLL chargée ;
- ne réécris aucune enveloppe G18 / G19.

Bootstrap : mêmes flags que Session P G19 (`0x47` — frame seam +
garde Odin/Gilgamesh, **pas** HUD/ATB/Director) sauf preuve contraire.
Ne lève pas la garde spéciale « pour forcer un Limit ».

Ifrit n’est **pas** obligatoire. Combat authentique en pause, party
vivante, ennemi slot 3 suffit — comme G19. Junction / compétence
Limit **non requises** : le seam injecte. Ne demande pas à
l’opérateur de farmer une crise « pour de vrai » si tu injectes
`crisis` ou `blue`.

## Stratégie live minimale — une session, un combat

Une ancre représentative suffit. **Pas** Squall+Zell+Irvine+Quistis+
Selphie+Rinoa.

Ordre recommandé, **un seul PID** si stable :

1. **Crise** — si U20.1 owned : suite `crisis` écrit `+0xCA` clampé
   sur un slot party, 0 helper natif crise, allowlist respectée.
   Si U20.1 observe-only : dump le `crisis_level` natif, zero write.
2. **Famille table-driven** — si U20.5 owned : suite `blue` (command
   15) sur une rangée kernel connue. Assertions HP/status G09/G10,
   row hash, crise utilisée pour l’index, rollback shutdown.
   Sinon saute.
3. **Refuse** — injecte Duel `241` ou Shot `14` ou temp `17` :
   error typé, 0 write, préimage intacte.
4. **U20.8 optionnel** — seulement si l’opérateur peut jouer **un**
   Limit natif sans casser la préimage. Observe pending/current,
   ne remplace pas. Une famille dumpée abaisse SQ-G20-001 pour
   **cette** famille seulement.

Pas de campagne fenêtres Renzokuken. Pas de Duel input. Pas de Shot
ammo réel. Pas d’Angel Wing persist. Pas de P2.

Revive G19 / Card persist ne font pas partie de cette session.

## Instructions à l’opérateur

- français ;
- une action à la fois (lancer le jeu, pause, cible, Limit natif
  optionnel, fermer) ;
- aucune mutation mémoire non annoncée ;
- fermer FF8 avant tout link ;
- si l’opérateur redémarre, abandonne l’ancien PID.

Ne lui demande pas de lire les HP ou la jauge crise à l’œil.
Ne lui demande pas d’équiper une compétence Limit ni de descendre
un personnage à 1 HP **sauf** si tu as choisi l’ancre observe-only
U20.8 et que tu expliques pourquoi.

## Vérifications avant promotion

```powershell
python .\tools\validate_contracts.py
cmake --build --preset debug-x86 --parallel --target battle_iso_tests
.\build\debug-x86\bin\Debug\battle_iso_tests.exe G19
.\build\debug-x86\bin\Debug\battle_iso_tests.exe G20
ctest --preset debug-x86 --output-on-failure
```

Puis payloads G20 une fois le protocole posé. DLL PE32 + SHA-256.

La promotion est interdite si :

- un ID Limit-adjacent tombe dans un défaut silencieux ;
- une famille claimée n’a pas de fixture hors-ligne ;
- une fenêtre / un reroll / un consume Angel Wing est inventé ;
- overlay menu ou caméra passent par G20 ;
- Attack/Magic/Item/Draw/GF/G19 passent par le resolve G20 ;
- un helper natif interdit est appelé ;
- rollback incomplet ;
- G00–G19 régressent, ou une enveloppe G18/G19 change de hash ;
- le hash DLL de preuve ≠ candidat final ;
- le live a utilisé le profil P2 ou `Invoke-IsoGroup`.

Une promotion **avec** SQ-G20-001 ouvert est licite **si** le live
prouve crise et/ou Blue Magic et/ou refuse, et que les familles
input restent refusées. C’est le même pattern que G19 + SQ-G19-001.

## Manifestes et documentation

Minimum :

- `manifests/ownership-matrix.toml` `[P1.G20]` (`offline-draft`
  jusqu’au live, puis `live-promoted` **seulement** après l’ancre) ;
- `manifests/evidence-policy.toml` `[promotion.G20]` ;
- address map / ABI ledger si un symbole nouveau est prouvé ;
- CMake, suite G20, README ;
- `obsidian-docs/projects/re-ff8/references/battle-iso-migration-milestones.md`
  unités U20.x — corrige le test injecté `Invoke-IsoGroup` / P2 ;
- ledger G20 + SQ-G20-001 (+ SQ nouvelles nommées) ;
- page
  `obsidian-docs/projects/final-fantasy-viii-reimaginated/references/p1-g20-limit-families-validation.md` ;
- journal du jour.

Preuves attendues :

```text
evidence/g20-limit-families-offline-draft-YYYY-MM-DD.md
evidence/g20-limit-families-offline-validation-YYYY-MM-DD.md
evidence/g20-limit-families-live-promotion-YYYY-MM-DD.md
evidence/battle-iso/p1-g20-*-post-suite-*.json
evidence/battle-iso/p1-g20-*-post-shutdown-*.json
```

Ingest `ff8-evidence-wiki-ingest`, puis compile QMD.

## Stop conditions

Arrête et rapporte le diagnostic si :

- G19 n’est pas présent (schéma ≠ 23, pas de promotion G19) ;
- le kernel authentifié ne valide plus une table que tu claims ;
- une fenêtre input ou un reroll « à peu près » serait nécessaire
  pour un test vert ;
- tu dois écrire le bit overlay HUD pour que le test passe ;
- le jeu tourne au moment d’un link ;
- PID ou hash DLL change en session ;
- write guard / call audit faute ;
- le resolver natif ou `ComputeRenzokukenDamage` doit être appelé
  pour le résultat ;
- rollback non byte-for-byte ;
- G18/G19 promotion ou enveloppes sont menacées.

Ne promeus pas « avec dette » une violation de frontière. Des SQ
ouvertes n’empêchent pas une promotion **si** le live prouve
l’owned et le refuse, pas l’inventé.

## Rapport final attendu

1. fichiers créés / modifiés (diff vs worktree G19, pas vs un
   draft G20 inexistant) ;
2. frontières de couches ;
3. matrice IDs Limit-adjacent (14–22, 237, 238, 241, 249, 250, et
   toute découverte) + tables kernel décodées ;
4. CTest / contrats / nouveau total ;
5. hash DLL, schéma snapshot, bit suite ;
6. résultat live (crise / blue / refuse / record) ;
7. appels natifs et écritures ;
8. rollback / `Detached` / survie ;
9. confiance U20.1–U20.8 ;
10. SQ restantes ;
11. statut `[promotion.G20].satisfied` ;
12. pages Oxygen + QMD.

Ne conclus jamais « G20 terminé » ni « P2 ouvert » si le rapport ne
distingue pas : prouvé hors-ligne, prouvé live représentatif, encore
seulement inventorié et refusé.
