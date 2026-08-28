# Nouveau batch — G19 inventaire de commandes et abilities kernel

Tu dois **terminer** G19 à partir du draft hors-ligne déjà commité, pas le
réécrire. Prépare ensuite toute l’instrumentation manquante, puis conduis la
validation live minimale avec l’opérateur. Travaille de façon autonome jusqu’au
premier geste réellement nécessaire dans FF8. À ce moment-là, demande une
action courte, précise et unique.

Ne committe et ne pousse rien sans demande explicite.

G18 est **live-promoted**. Ne le rouvre pas. Ne commence pas G20.

## Résultat attendu

À la fin :

- les unités U19.1 à U19.6 sont soit implémentées et testées, soit
  explicitement fail-closed avec une `SQ-G19-xxx` nommée ;
- aucun `COMMAND_TYPE_ID` n’entre dans un défaut silencieux ;
- les 39 lignes `K_BATTLE_COMMAND`, les 12 lignes
  `K_BATTLE_COMMAND_ABILITY` et les 16 lignes `K_DEVOUR` restent décodées
  depuis le `kernel.bin` authentifié ;
- Defend, Treatment, Recover, Revive, Mad Rush, Doom et les args command-0
  prouvés restent replacement-owned ;
- Card / Devour / Mug **ne persistent pas** tant que leurs writers ne sont
  pas portés ; le refuse typé est la preuve, pas un persist inventé ;
- MiniMog, Absorb Drain, Lv Up/Down, Kamikaze type 18 restent fail-closed ;
- Darkside ×3 reste encodé ; le chemin Attack reste G09 ;
- une campagne live unique, préparée à l’avance, prouve au moins une
  commande G19-owned et les refuses représentatifs ;
- rollback exact, `Detached`, processus vivant ;
- README, contrats, ownership, address map, ABI ledger et wiki Oxygen à jour ;
- `[promotion.G19].satisfied` reste `false` jusqu’à la clôture live.

G19 ne possède pas Attack (G09), Magic (G11), Item (G12), Draw (G13),
Enemy attack (G16), GF (G18), les Limits (G20), ni la cinématique GF.

## Préambule outillage — vérifie une fois, puis travaille

Lis `ai-prompt/todo/_gate-layer-preamble.md` et
`.agents/skills/implementing-iso-layer-boundary/SKILL.md` avant tout code.

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
qmd get ff8-wiki/projects/re-ff8/references/battle-iso-migration-milestones.md:765:25 --no-line-numbers
qmd get ff8-wiki/projects/re-ff8/references/g11-g20-static-readiness-ledger.md:619:30 --no-line-numbers
qmd get ff8-wiki/projects/re-ff8/references/g11-g20-static-open-questions.md:448:20 --no-line-numbers
qmd get ff8-wiki/projects/re-ff8/concepts/command-action-pipeline.md --no-line-numbers
qmd get ff8-wiki/projects/re-ff8/skills/ff8-live-validation-operations.md --no-line-numbers
qmd get ff8-wiki/projects/final-fantasy-viii-reimaginated/references/p1-g18-gf-gameplay-validation.md --no-line-numbers
qmd get ff8-wiki/projects/final-fantasy-viii-reimaginated/references/p1-g19-command-abilities-validation.md --no-line-numbers
```

Lis aussi directement :

```text
ai-prompt/todo/g18-gf-gameplay-domain-new-chat.md
C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g19-command-abilities-offline-draft-2026-08-28.md
C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g18-gf-gameplay-static-debts-2026-08-28.md
```

Si le reranker CUDA échoue : `qmd search` ou `qmd query --no-gpu --no-rerank`.

### Context Mode

Le MCP workspace a `CONTEXT_MODE_PROJECT_DIR` = racine `re-ff8`. Pour le
code d’implémentation, utilise les outils locaux / Serena sur
`FinalFantasy_VIII_Reimaginated`. Ne mets pas ce chemin dans le
`mcp.json` utilisateur.

### IDA MCP

IDB autoritative :

```text
D:\Modding\ff8\retro-exe\FF8_EN.exe.i64
```

EXE Steam 2013 SHA-256
`064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.

N’ouvre IDA que pour une ambiguïté encore ouverte. Racines déjà nommées :

- resolver `BattleAction_ResolveAndApplyDamage` `0x48FE20` ;
- jumptable command 0 `0x49045B` ;
- `GetReviveHP` `0x491940` ;
- `K_BATTLE_COMMAND` EA `0x1CF3F2C` / RVA `0x018F3F2C` (39×8) ;
- `K_BATTLE_COMMAND_ABILITY` EA `0x1CF7E68` / RVA `0x018F7E68` (12×16) ;
- `K_DEVOUR` EA `0x1CF8A54` / RVA `0x018F8A54` (16×12) ;
- MiniMog `sub_494AA0` (interdit d’appeler) ;
- persist : `getMugObjectIdAndQuantity`,
  `Devour_ApplyPermanentStatBonuses`, `computeCardCommandDrop`.

Une découverte va d’abord dans l’IDB (nom, type, commentaire), ensuite
seulement address map / ABI ledger.

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

`Invoke-IsoGroup` **n’existe pas**. Flux live réel :

```text
tools\make_bootstrap_payload.py
tools\make_suite_payload.py
app_injector.exe  (FF8Iso_Bootstrap / FF8Iso_RunInProcessSuite / FF8Iso_Shutdown)
tools\capture_runtime_evidence.py
tools\capture_live_canaries.py
```

État observé le 2026-08-28, à revalider :

- implémentation `HEAD` `10bc7a15517de6237f4bef5be06ff665a053768b`
  (« Add G18 GF gameplay mechanics and related enhancements ») ;
  ce commit contient **aussi** le draft G19 (`command_ability`,
  `test_g19`, codec kernel) ;
- docs `HEAD` `3e5d8dec743069a6c9cc845afcbe62f27f4ab223` ;
- G18 live-promoted, Session P DLL
  `34204e438904b8982e55f2d4f92af6c9a47cef063406f46367d4cb40b14055b3`,
  pack après-midi DLL
  `b6db8a89dfe14a63e6ce3409f6444c60bb86caac6f1c4f566a984a6a3b006695` ;
- `[P1.G19] = offline-draft` ;
- pas de `[promotion.G19]` ;
- pas de `FF8ISO_SUITE_G19_*`, pas de témoin snapshot G19, pas de
  `tests/in-process/G19.suite.toml` ;
- schéma evidence encore **22** (G18) ;
- `kernel.bin` fixture SHA-256
  `e378fb8f198ede3dae858f0ded6670f9ba423aa79abfff7237e701dfc7f9e7f6`
  (37 992 octets) ;
- `battle_iso_tests G18` et `G19` passaient après le draft.

Revalide `git status`, `git log -5`, `validate_contracts.py` et le
binaire de tests au début. Si le worktree a changé, préserve le travail
utilisateur. Ne lance pas de link si `FF8_EN.exe` tourne.

## Contrats précédents à préserver

### G18 — clos

`[promotion.G18].satisfied = true`. Ne réécris aucune enveloppe
hash-bound. Ne change pas le seed laboratoire `12` en writer hôte GetText
sauf campagne live explicitement demandée. Zantetsuken reste MAG/SPR+Vit0,
sans HP=0. Pas d’appel `BattleGF_FinalizeSummonExit`.

Le draft G19 a déjà porté dans `core/` : formule de charge
`4*compat*(speed+1)/35`, Boko `FlagInfo`/`BokoAttack+2`, Phoenix
`GetReviveHP`, cancel Darkness/Silence/Eject/Confuse. Ne les retire pas.

### G09 / G11 / G12 / G13 / G16 / G17

Ces IDs restent `OwnedByOtherGate` depuis `resolve_command_action`.
G19 ne réimplémente pas Attack, Magic, Item, Draw, enemy attack, ni les
rolls G17.

### G14

G19 n’émet pas d’intents G14 dans le draft. N’ajoute une présentation
que si une preuve native le demande. L’adaptateur scellé reste G14.

### Interdiction G20

IDs 14–22 et `0xF9` sont inventoriés comme `LimitG20` et refusés. Ne
construis aucune state machine Limit.

## Contrat G19 autoritatif

G19 dépend de G18 et porte exactement les unités du milestone :

| Unité | Contenu | État 2026-08-28 |
| --- | --- | --- |
| **U19.1** | Inventaire 256 IDs : handler ou unsupported explicite | **fait** (`classify_command`) |
| **U19.2** | Codec `K_BATTLE_COMMAND` + `K_BATTLE_COMMAND_ABILITY` ; route des familles prouvées | **fait** pour les 12 rangées ; Absorb/Lv/Kamikaze refusés |
| **U19.3** | State-only : Defend, Treatment, Recover, Revive, Mad Rush, Doom | **fait** |
| **U19.4** | Card / Devour / Mug persist | **fail-closed** (SQ-G19-001). Formule Devour encodée, pas commitée |
| **U19.5** | Exceptions de cible / éligibilité | **partiel** : miss Revive vivant, miss Recover/Treatment mort/Petrify ; `target_info` décodé, plan G08 |
| **U19.6** | Fixture déterministe par rangée supportée | **partiel** : `test_g19` couvre l’inventaire, kernel, Treatment/Recover/Revive/Defend/Doom, command-0, refuses ; Mad Rush à renforcer |

Le gate milestone : *no supported command enters a default fall-through
with unknown semantics.* Le draft satisfait ce gate **hors-ligne**. La
promotion live n’est pas commencée.

## Ce qui existe déjà — audite, ne réécris pas

```text
core/include/ff8iso/core/command_ability.hpp
core/src/command_ability.cpp
application/include/ff8iso/application/command_ability.hpp
application/src/command_ability.cpp
runtime-x86/include/ff8iso/runtime/kernel_command_ability_codec.hpp
runtime-x86/src/kernel_command_ability_codec.cpp
tests/offline/test_g19.cpp
evidence/g19-command-abilities-offline-draft-2026-08-28.md
```

Offsets codec, déjà tesés sur le kernel authentifié :

| Section | Offset fichier | Taille | Rangées |
| --- | ---: | ---: | ---: |
| 1 `K_BATTLE_COMMAND` | `0xE4` | 312 | 39×8 |
| 11 `K_BATTLE_COMMAND_ABILITY` | `0x4020` | 192 | 12×16 |
| 29 `K_DEVOUR` | `0x4C0C` | 192 | 16×12 |

Champ commande `abilityDataID` à +4. Layout ability : `magic_id` +0,
`animation` +3, `attack_type` +4, `attack_power` +5, `attack_flags` +6,
`hit_count` +7, `element` +8, `status_enabler` +9, `hit_status_1` +0x0A,
`hit_status_2` +0x0C.

Rangées authentifiées :

| Row | Cmd | Type | Power | Enabler | Famille domain |
| ---: | ---: | ---: | ---: | ---: | --- |
| 0 | Recover 26 | 32 | 16 | 0 | `power * max_hp / 16` |
| 1 | Revive 27 | 6 | 0 | 254 | full HP |
| 2 | Treatment 25 | 3 | 0 | 254 | clear `0x007E` / `0x0100560D` |
| 3 | Mad Rush 24 | 2 | 0 | 255 | G10 Berserk+Haste/Protect |
| 4 | Doom 30 | 2 | 0 | 254 | G10 Doom `0x400` |
| 5 | Absorb 32 | 2 | 14 | 200 | refuse Drain `0x8000` |
| 6 | Lv Down 33 | 13 | 4 | 255 | refuse |
| 7 | Lv Up 34 | 16 | 16 | 255 | refuse |
| 8 | Kamikaze 31 | 18 | 1 | 0 | refuse |
| 9 | Devour 7 | 19 | 0 | 0 | reward refuse ; Eject |
| 10 | Card 29 | 17 | 0 | 0 | reward refuse ; Eject |
| 11 | Defend 23 | 2 | 0 | 255 | `status_2 \|= MagicHalf 0x00080000` |

Command 0 jumptable `0x49045B` déjà portée :

| Arg | Effet |
| ---: | --- |
| 2 | heal `(rng%5+5)*max_hp/100` |
| 4 | dégât `max_hp/20` |
| 5 | heal `damage_accumulator>>2` puis clear |
| 6 | dégât `max_hp/10` |
| 7 | `status_2 \|= Eject` |
| 8 | `GetReviveHP` `max_hp/8` (1 si 0) |
| 9 | fail rewrite, pas de HP |
| 10 | Devour depuis `K_DEVOUR[DEVOUR_RESULT]` — refuse persist |
| autre | `UnsupportedCommand` + rollback |

Darkside : `apply_darkside_multiplier(raw) = raw * 3`. Resolve G19
retourne `OwnedByOtherGate`. Ne recâble G09 que si une preuve native
dit exactement *où* `ReviveHP *= 3` s’applique (après raw, vs Protect).

## État de confiance — ne pas le maquiller

| Unité | État | Confiance | Trou |
| --- | --- | ---: | --- |
| U19.1 | confirmed-offline | 0.86 | aucun ID silencieux |
| U19.2 | confirmed-offline | 0.84 | types 13/16/18 non portés |
| U19.3 | confirmed-offline | 0.84 | Mad Rush fixture à étoffer |
| U19.4 | fail-closed | 0.62 | persist writers (SQ-G19-001) |
| U19.5 | static-partial | 0.58 | `target_info` → G08, pas un second targeter |
| U19.6 | static-partial | 0.70 | rapport de couverture + live |

Plafonds :

- pas plus de `0.70` sur U19.4 sans writer persist prouvé ;
- pas plus de `0.75` sur U19.5 sans table `target_info` ↔ éligibilité
  sourcée IDA ou kernel ;
- pas plus de `0.80` global sans ancre live ;
- une ancre live Defend/Recover ne certifie pas Card/Devour/Mug.

## Fermeture statique encore ouverte

Avant d’ajouter du runtime live, ferme seulement ce qui manque vraiment :

1. **U19.6** — une fixture par rangée *supportée* (ajouter Mad Rush ;
   command-0 args 2 et 6 s’ils manquent). Produis un rapport : 256 IDs,
   12 abilities, 16 Devour, args command-0.
2. **U19.5** — ne réimplémente pas G08. Documente et teste les misses
   déjà dans `resolve_ability_row` / `apply_revive`. Si `target_info`
   kernel change l’éligibilité native d’une commande G19-owned, porte
   ça comme contrainte de plan, pas comme second resolver.
3. **U19.4** — IDA sur les trois persist helpers. Si le CFG n’est pas
   fermable, **laisse le refuse**. N’invente pas un drop item/card/stat.
4. **Darkside** — seulement si le point d’application sur le raw G09
   est prouvé. Sinon le formule reste encodée.

Ne « complète » pas MiniMog en appelant `sub_494AA0`.

## Hors scope strict

- Limits G20 et crisis ;
- persist savemap Card/Devour/Mug tant que SQ-G19-001 est ouvert ;
- MiniMog natif ;
- types 13/16/18 tant qu’ils n’ont pas de formule domain prouvée ;
- réouverture G18 (cinématique, HP=0 Zantetsuken, writer hôte timer) ;
- `BattleAction_ResolveAndApplyDamage` depuis le domaine ;
- insertion hôte `0x71` ;
- Cover/Regen/Return Damage G17.

Une capacité hors scope = erreur typée ou `SQ-G19-xxx`, jamais un
fallback natif.

## Loi de couches

### `core`

Possède inventaire, familles, formules, transaction, rollback.
Réutilise G09/G10/G11 (`apply_hit_status`, `clear_hit_status`,
`kStatus2MagicHalf`). Pas de RVA, POD natif, `find_symbol`.

### `application`

`run_command_action` : une copie, un commit, ou rollback.

### `abi`

POD / address map seulement. Symboles déjà posés :
`K_BATTLE_COMMAND`, `K_BATTLE_COMMAND_ABILITY`, `K_DEVOUR`.

### `runtime-x86`

Codec octets. Le seam live G19 **n’existe pas encore** : à ajouter
sans domaine. Pas de `TemporaryG19NcompAdapter` pour du gameplay.
G14 scellé reste la seule unité NCOMP de présentation.

Snapshot : append-only. Si tu ajoutes un témoin G19, schéma **23**,
témoins G15 `[2520:2776]`, G16 `[2776:3032]`, G17 `[3032:3288]`,
G18 `[3288:3576]` inchangés. Vérifie les tailles réelles dans
`launch_contract.h` avant d’étendre.

## Travail restant par unité

### U19.1 — inventaire

Déjà fait. Toute nouvelle ID découverte va dans `classify_command`,
jamais dans un `default` mute.

### U19.2 — table

Déjà faite. `family_for_ability_row` doit rester exhaustif pour les
12 types kernel. Un type nouveau = `Unsupported` + test.

### U19.3 — state-only

Déjà faite. Complète la fixture Mad Rush (Berserk + Haste/Protect,
enabler 255). Ne passe pas par un apply mental aléatoire : l’enabler
kernel est 255.

### U19.4 — rewards

Reste refuse. `K_DEVOUR` se décode ; `compute_devour_hp_delta` est
`qty * max_hp / 16`. Ne l’applique pas. Le live doit prouver le
refuse + rollback, pas un faux drop.

### U19.5 — targeting

G08 reste propriétaire du `TargetPlan`. G19 consomme
`plan.resolved[]` et applique les misses de famille (Revive vivant,
curative mort/Petrify). Si tu portes `target_info`, c’est une
contrainte d’entrée de plan, pas un walk de slots.

### U19.6 — couverture

Étends `test_g19` jusqu’à : chaque rangée supportée, chaque arg
command-0 connu, chaque refuse nommé, rollback d’un arg inconnu.
Ajoute `test_g19_payload.py` quand le protocole live existe.

## Protocole runtime G19 — à créer

Le draft n’a **aucun** fil live. Avant FF8 :

- bit `FF8ISO_SUITE_G19_COMMAND_ABILITIES` ;
- protocole versionné `g19-command-abilities-v1` ;
- témoin append-only (scénario, command_id, arg, ability row hash,
  HP/status avant/après, error, rollback, forbidden calls) ;
- `tools/make_suite_payload.py --group G19 --profile P1` ;
- `tests/in-process/G19.suite.toml` ;
- decodeur evidence + `validate_evidence_envelope.py` ;
- `[promotion.G19]` dans `evidence-policy.toml` **sans**
  `satisfied = true`.

`validate_contracts.py` ne doit exiger un bloc promotion G19 que
lorsque tu l’ajoutes, et ce bloc reste `false` jusqu’au live.

Scénarios payload minimaux (réarmables sans rebuild) :

1. `state` — Recover ou Treatment sur un allié vivant ;
2. `defend` — Defend → MagicHalf ;
3. `revive` — command 0 arg 8 ou Revive 27 sur un mort préparé ;
4. `refuse` — Card ou Devour : error persist + rollback.

## Audit des appels et écritures

Interdis depuis `core`/`application` et le futur seam G19 :

- `BattleAction_ResolveAndApplyDamage` ;
- `getMugObjectIdAndQuantity` ;
- `Devour_ApplyPermanentStatBonuses` ;
- `computeCardCommandDrop` ;
- `sub_494AA0` ;
- tout helper GF natif déjà interdit à G18.

Allowlist live minimale, si tu commits de l’HP/status G19-owned :
slots cibles `current_hp` / `status_1` / `status_2` déjà utilisés par
G09–G12, plus pending/current si le seam le requiert. Tout autre octet
est terminal.

## Politique live

Même discipline que G16–G18 :

- CTest cumulatif vert, contrats verts, DLL PE32, hash calculé,
  payloads prêts ;
- jeu fermé avant build, relancé par l’opérateur ;
- bootstrap → préimage → watch → **une** action → verdict machine →
  `FF8Iso_Shutdown` → `Detached` + survie ;
- un `BUSY` : une frontière de frame, une seule tentative ;
- ne reconstruis jamais une DLL chargée ;
- ne réécris aucune enveloppe G18.

Garde Odin/Gilgamesh et reset crise : conserve les gardes déjà
propriétaires. Ne les étends pas « pour tester G19 ».

## Stratégie live minimale — une session, un combat

Une ancre représentative suffit. Combat Ifrit / Balamb déjà utilisé
pour G18, party vivante, pause.

1. **Session P** — Treatment ou Recover sur un allié blessé (ou Defend
   si la fixture HP est trop propre). Assertions : HP/status exacts,
   zéro helper natif G19, rollback shutdown.
2. **Même PID si stable** — command 0 arg 8 seulement si tu peux
   préparer un KO sans casser la préimage. Sinon reste offline.
3. **Refuse** — Card ou Devour injecté au seam : error persist,
   préimage intacte. Ne joue pas Card « pour de vrai » tant que
   SQ-G19-001 est ouvert.

Pas de campagne Mug/Devour persist. Pas de Limit. Pas de MiniMog.

## Instructions à l’opérateur

- français ;
- une action à la fois (commande menu, cible, pause/reprise) ;
- aucune mutation mémoire non annoncée ;
- fermer FF8 avant tout link ;
- si l’opérateur redémarre, abandonne l’ancien PID.

Ne lui demande pas de lire les HP à l’œil.

## Vérifications avant promotion

```powershell
python .\tools\validate_contracts.py
cmake --build --preset debug-x86 --parallel --target battle_iso_tests
.\build\debug-x86\bin\Debug\battle_iso_tests.exe G18
.\build\debug-x86\bin\Debug\battle_iso_tests.exe G19
ctest --preset debug-x86 --output-on-failure
```

Puis payloads G19 une fois le protocole posé. DLL PE32 + SHA-256.

La promotion est interdite si :

- un ID tombe dans un défaut silencieux ;
- une rangée supportée n’a pas de fixture ;
- Card/Devour/Mug committent un persist inventé ;
- MiniMog ou un type 13/16/18 s’exécute sans preuve ;
- Attack/Magic/Item/Draw/GF/Limit passent par G19 ;
- un helper natif interdit est appelé ;
- rollback incomplet ;
- G00–G18 régressent ;
- le hash DLL de preuve ≠ candidat final.

## Manifestes et documentation

Minimum :

- `manifests/ownership-matrix.toml` `[P1.G19]` (déjà `offline-draft` ;
  passe à live-promoted **seulement** après Session P) ;
- `manifests/evidence-policy.toml` `[promotion.G19]` ;
- address map / ABI ledger si un symbole nouveau est prouvé ;
- CMake, suite G19, README ;
- `obsidian-docs/projects/re-ff8/references/battle-iso-migration-milestones.md`
  unités U19.x ;
- ledger + SQ-G19-001 ;
- journal du jour.

Preuves attendues :

```text
evidence/g19-command-abilities-offline-draft-2026-08-28.md   (déjà là ; mets à jour)
evidence/g19-command-abilities-offline-validation-YYYY-MM-DD.md
evidence/g19-command-abilities-live-promotion-YYYY-MM-DD.md
evidence/battle-iso/p1-g19-*-post-suite-*.json
evidence/battle-iso/p1-g19-*-post-shutdown-*.json
```

Ingest `ff8-evidence-wiki-ingest`, puis compile QMD.

## Stop conditions

Arrête et rapporte le diagnostic si :

- le kernel authentifié ne décode plus 39/12/16 ;
- un persist « à peu près » serait nécessaire pour un test vert ;
- le jeu tourne au moment d’un link ;
- PID ou hash DLL change en session ;
- write guard / call audit faute ;
- le resolver natif doit être appelé pour le résultat ;
- rollback non byte-for-byte ;
- G18 promotion ou enveloppes sont menacées.

Ne promeus pas « avec dette » une violation de frontière. SQ-G19-001
ouvert n’empêche pas une promotion **si** le live prouve le refuse,
pas le persist.

## Rapport final attendu

1. fichiers modifiés (diff vs draft déjà commité) ;
2. frontières de couches ;
3. matrice 256 IDs / 12 abilities / 16 Devour / args command-0 ;
4. CTest / contrats / nouveau total ;
5. hash DLL, schéma snapshot, bit suite ;
6. résultat live ;
7. appels natifs et écritures ;
8. rollback / `Detached` / survie ;
9. confiance U19.1–U19.6 ;
10. SQ restantes ;
11. statut `[promotion.G19].satisfied` ;
12. pages Oxygen + QMD.

Ne conclus jamais « G19 terminé » si le rapport ne distingue pas :
prouvé hors-ligne, prouvé live représentatif, encore seulement
inventorié et refusé.
