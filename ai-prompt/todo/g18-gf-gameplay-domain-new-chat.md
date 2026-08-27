# Nouveau batch — G18 domaine gameplay des G-Forces

Tu dois implémenter G18 complètement hors-ligne, préparer toute son
instrumentation, puis conduire sa validation live minimale avec l’opérateur.
Travaille de façon autonome jusqu’au premier geste réellement nécessaire dans
FF8. À ce moment-là, demande une action courte, précise et unique.

Ne committe et ne pousse rien sans demande explicite.

## Résultat attendu

À la fin :

- les unités U18.1 à U18.8 sont implémentées et testées ;
- les 16 lignes junctionables `0x40..0x4F` sont extraites du `kernel.bin`
  authentifié et couvertes par un traitement déterministe ;
- les lignes et profils GF non junctionables nécessaires au contrat G18 sont
  recensés et ne tombent jamais dans un défaut silencieux ;
- la charge, Haste/Slow, l’annulation, Boost, les dégâts, les statuts, le pool
  d’absorption, la persistance et les appels répétés sont replacement-owned ;
- G18 consomme les `ActionRequest` spéciaux produits par G17 sans rejouer les
  tirages ni la planification Odin/Phoenix/Gilgamesh/Angelo ;
- G18 émet uniquement des intentions de présentation typées vers l’adaptateur
  G14 déjà scellé ; aucun helper gameplay GF natif n’est appelé ;
- une seule campagne live logique, préparée à l’avance et réarmable sans
  recompilation, couvre les ancres représentatives nécessaires ;
- toutes les preuves sont machine-validées, le rollback est exact et le jeu
  reste vivant après `Detached` ;
- README, contrats, manifestes, matrice d’ownership, address map, ABI ledger et
  wiki Oxygen sont à jour ;
- `[promotion.G18].satisfied` reste `false` jusqu’à la clôture live, puis ne
  devient `true` que si tous les critères promotionnels ci-dessous passent.

G18 ne possède pas les tirages spéciaux de G17, les récompenses de G19, les
Limits de G20, les readers de démarrage G21 ni le moteur graphique P2. Il ne
doit pas non plus rouvrir Cover, Regen, Return Damage ou les autres dettes
résiduelles de G17.

## Préambule outillage — vérifie une fois, puis travaille

### RTK

RTK est installé globalement et son hook Codex est déjà configuré. Vérifie une
seule fois :

```powershell
rtk --version
```

La version historiquement observée est `0.42.4`. Si le hook est présent, ne
cherche pas à l’invoquer manuellement : il agit seul.

### QMD / Oxygen

Utilise la commande `qmd`, pas le MCP QMD. Commence par :

```powershell
qmd status
qmd get ff8-wiki/index.md --no-line-numbers
qmd get ff8-wiki/projects/re-ff8/references/battle-iso-migration-milestones.md:730:105 --no-line-numbers
qmd get ff8-wiki/projects/re-ff8/references/g11-g20-static-readiness-ledger.md:575:55 --no-line-numbers
qmd get ff8-wiki/projects/re-ff8/concepts/gforce-cinematic-architecture.md --no-line-numbers
qmd get ff8-wiki/projects/re-ff8/concepts/gforce-catalog-and-families.md --no-line-numbers
qmd get ff8-wiki/projects/re-ff8/references/gf-asset-loading-and-authoring.md --no-line-numbers
qmd get ff8-wiki/projects/re-ff8/references/battle-formulas.md:90:85 --no-line-numbers
qmd get ff8-wiki/projects/re-ff8/skills/ff8-live-validation-operations.md --no-line-numbers
qmd get ff8-wiki/projects/final-fantasy-viii-reimaginated/references/p1-g17-reactions-validation.md --no-line-numbers
```

Lis aussi, seulement si le point correspondant n’est pas déjà fermé par les
pages canoniques :

```powershell
qmd get ff8-wiki/_staging/investigations/2026-06-09_prompt20_bulk_kernel_gf_id_confirmation.md --no-line-numbers
qmd get ff8-wiki/_staging/investigations/gf_charge_absorption.md --no-line-numbers
qmd get ff8-wiki/_staging/investigations/gf_chain_completion_and_support_assertions.md --no-line-numbers
```

Si le reranker échoue avec CUDA, recommence avec `qmd search` ou
`qmd query --no-gpu --no-rerank`. Une panne du reranker ne signifie pas que
l’index ou les pages sont indisponibles.

À la fin de la fermeture statique et à la fin du live, ingère les nouvelles
preuves avec le skill `ff8-evidence-wiki-ingest`, puis compile l’index QMD.
N’attends pas la fin du batch pour mémoriser une découverte qui modifie le
contrat.

### Context Mode

Utilise Context Mode pour filtrer les gros `rg`, sorties de tests, dumps de
tables, diffs et rapports. La racine de travail principale doit être :

```text
C:\Users\djden\source\repos\FinalFantasy_VIII_ReImaginated
```

Si Context Mode refuse un fichier situé dans l’autre dépôt, exécute une
commande locale ciblée depuis le bon dépôt. Ne contourne pas le garde de
périmètre et ne traite pas ce refus comme une panne de G18.

### IDA MCP

L’IDB autoritative est :

```text
D:\Modding\ff8\retro-exe\FF8_EN.exe.i64
```

N’utilise IDA que pour fermer une ambiguïté réellement nécessaire. Les racines
déjà connues incluent :

- `BattleAction_ResolveAndApplyDamage` `0x48FE20` ;
- `ComputeMagicAndGFDamage` `0x491AD0` ;
- `Battle_ApplyDamageOrHeal` `0x494410` ;
- `BattleGF_FinalizeSummonExit` `0x48E620` ;
- `BattleGF_LoadCallbackByMagicID` `0x50AF20` ;
- `Battle_EnqueueSpecialAction` `0x484720` ;
- `AngeloOdin_SpecialActionTick` `0x482F80` ;
- `K_GF_JUNCTIONABLE` `0x1CF4DC0` ;
- `F_CHAR_ACTIVE_SUMMON_CHARGE_TIMER` `0x18FF014`.

Une découverte doit être renommée, typée et commentée dans l’IDB avant d’être
reportée dans l’address map et l’ABI ledger. Un nom Hex-Rays ou une intuition
ne devient jamais un contrat. N’effectue aucune mutation IDB sans conserver la
preuve statique qui la justifie.

Si RTK, QMD, Context Mode ou le MCP IDA nécessaire à un point bloquant est
réellement indisponible, arrête-toi et donne l’erreur exacte. Ne remplace pas
une source manquante par une supposition.

## Dépôts et état de départ audité

Documentation et prompt :

```text
C:\Users\djden\source\repos\retro-eng\re-ff8
```

Implémentation :

```text
C:\Users\djden\source\repos\FinalFantasy_VIII_ReImaginated
```

État observé le 2026-08-27 :

- dépôt d’implémentation propre ;
- `HEAD` : `3057a7fd9fb0d3765bca9078898abe8a659c62d2` ;
- dernier commit : `3057a7f Add G17 reactions mechanics and integrate into battle system` ;
- G17 live-promu sur DLL
  `6326950ae7b195a7fbd53b3e7dba3d5e2c18c1731130df17d0e3e28c408746e6` ;
- CTest Debug x86 : `45/45` ;
- snapshot G17 : schéma 21, taille 3320 octets ;
- le témoin G15 `[2520:2776]` et le témoin G16 `[2776:3032]` doivent rester
  byte-for-byte compatibles.

Revalide ces faits au début. Si le worktree a changé, ne l’écrase pas : audite
les différences, préserve tout travail utilisateur et adapte le guide à la
nouvelle baseline.

Avant toute édition :

```powershell
git status --short
git log -5 --oneline
python .\tools\validate_contracts.py
ctest --preset debug-x86 --output-on-failure
```

Ne lance pas de link sur une DLL chargée. Si `FF8_EN.exe` tourne, poursuis les
lectures et la conception statique, mais demande explicitement à l’opérateur de
fermer le jeu avant la première compilation/link. Ne déduis jamais qu’il est
fermé d’un silence ou d’un PID historique.

## Contrats précédents à préserver

### G17

G17 est promu uniquement pour la preuve live party Counter. Les routes 5 à 8
sont synthétiques ; il n’existe pas de neuvième blob IA. G18 consomme leurs
`ActionRequest`, mais ne rejoue ni les rolls init/runtime ni la planification.

Repères actuels :

- command ID spécial Odin/Gilgamesh/Phoenix : `245` ;
- command ID Angelo : `240` ;
- Phoenix : variant `1` ;
- Gilgamesh : variants `7..10` ;
- Angelo : variants `11..13` ;
- la provenance reste `ActionSource::EngineForced` ;
- les tirages init Odin/Gilgamesh restent U22.7 ;
- SQ-G17-005 Return Damage et SQ-G17-006 magnitude Regen/Doom restent
  fail-closed et hors G18.

Ne crée pas une seconde file, un second pending writer ou un second moteur de
réactions.

### G14

La présentation reste la responsabilité du `SealedNativePresentationAdapter`.
G18 produit des intentions typées et des barrières ; il ne porte ni RVA, ni
octet de relay, ni pointeur natif dans `core` ou `application`.

La cadence `0x71` est confirmée statiquement, mais l’insertion hôte reste une
dette de campagne ultérieure. Ne la réattribue ni à G16 ni à G18 et ne la
marque pas fermée par opportunisme.

### G12 — intentions spéciales à ne pas orpheliner

`BattleState` contient déjà une file `SpecialActionIntent` pour Boko, Phoenix
et Moomba issue des objets G12. Avant de coder, produis une petite table
d’ownership qui répond explicitement :

- quel résolveur exécute chaque intention ;
- si elle relève d’une ligne GF non junctionable de G18 ;
- quelle preuve existe pour son payload ;
- quelle dette nommée subsiste si le contrat G18 autoritatif ne la couvre pas.

Ne duplique pas ce moteur dans `item_slice` et ne laisse aucune intention
acceptée finir en rejet générique. Si aucune milestone future n’en est
propriétaire, implémente le profil non junctionable dans le même moteur G18 ou
documente le conflit de roadmap avant de poursuivre.

## Contrat G18 autoritatif

G18 dépend de G17 et comprend exactement :

- **U18.1 — métadonnées GF** : `K_GF_JUNCTIONABLE`, lignes non
  junctionables, effect ID, modificateurs level/power et payload de statuts ;
- **U18.2 — routage summon** : sémantique pending, groupe et current action ;
- **U18.3 — charge** : début, cadence Haste/Slow, annulation et état acteur ;
- **U18.4 — dégâts** : famille MAG/SPR, niveau, puissance, Boost, éléments,
  familles fixes et pourcentage ;
- **U18.5 — absorption** : pool `target_info_mask`, interaction HP,
  épuisement, compteur KO et persistance ;
- **U18.6 — GF de soutien** : payload de statuts et achèvement sans dégâts ;
- **U18.7 — profils spéciaux** : résolution Odin, Phoenix, Gilgamesh et
  Angelo depuis les `ActionRequest` G17, sans posséder les triggers ;
- **U18.8 — présentation** : intentions effet/caméra/audio/barrières sans
  logique GF native.

Le test pack autoritatif contient : GF offensive, GF de soutien, charge et
absorption, bornes Boost, GF spéciale fixe, annulation et invocation répétée.

Le gate est atteint lorsque les résultats GF et les latches gameplay sont
replacement-owned, même si la présentation reste une unité de compatibilité
native scellée jusqu’à P2.

## État de confiance initial — ne pas le maquiller

| Unité | État QMD initial | Confiance | Trou principal |
| --- | --- | ---: | --- |
| U18.1 | `static-strong` | 0.80 | dump authentique des 16 lignes |
| U18.2 | `static-partial` | 0.55 | frontière de réécriture/routage |
| U18.3 | `mapped` | 0.50 | durée de vie et annulation |
| U18.4 | `static-partial` | 0.65 | multiplicateur Boost live |
| U18.5 | `mapped` | 0.55 | épuisement, KO et persistance |
| U18.6 | `mapped` | 0.55 | fixture de soutien exacte |
| U18.7 | `mapped` | 0.50 | payload gameplay vs cinématique |
| U18.8 | `static-partial` | 0.62 | fin domaine vs barrière présentation |

Ces valeurs sont des indices de maturité documentaire, pas des probabilités.
Après chaque phase, publie pour chaque unité : sources indépendantes, tests
passés, preuve live éventuelle, dette restante et nouveau plafond de
confiance. Interdictions :

- pas plus de `0.70` sans ligne kernel authentique pour une famille data-driven ;
- pas plus de `0.75` pour U18.2/U18.3 sans témoin live de la frontière ;
- pas plus de `0.80` pour U18.5 sans épuisement + KO + writeback observés ;
- pas plus de `0.80` pour U18.8 sans retour acteur/caméra/BdLink idle ;
- une ancre live représentative ne certifie jamais toutes les GF à elle seule.

## Fermeture statique obligatoire avant code gameplay

### 1. Dump authentique des 16 lignes

Le `kernel.bin` authentifié disponible sous
`tests/fixtures/g12/kernel.bin` est le premier candidat. Vérifie son hash et sa
provenance avant usage. Implémente un extracteur reproductible pour les 16
lignes `0x40..0x4F`, stride `0x84`, et génère une fixture binaire/JSON
machine-validée.

Mapping attendu des command args :

| Arg | GF |
| --- | --- |
| `0x40` | Quezacotl |
| `0x41` | Shiva |
| `0x42` | Ifrit |
| `0x43` | Siren |
| `0x44` | Brothers |
| `0x45` | Diablos |
| `0x46` | Carbuncle |
| `0x47` | Leviathan |
| `0x48` | Pandemona |
| `0x49` | Cerberus |
| `0x4A` | Alexander |
| `0x4B` | Doomtrain |
| `0x4C` | Bahamut |
| `0x4D` | Cactuar |
| `0x4E` | Tonberry |
| `0x4F` | Eden |

Structure native connue, à coder uniquement dans `runtime-x86`/`abi` :

| Offset | Champ |
| --- | --- |
| `+0x00` | nom |
| `+0x02` | description |
| `+0x04` | `magicID`, effect ID 1-based |
| `+0x06` | `attackType` |
| `+0x07` | `gfPower` |
| `+0x0A` | `attackFlags` |
| `+0x0B` | animation cible |
| `+0x0D` | élément |
| `+0x0E` | `statuses0` |
| `+0x10` | `statuses1` |
| `+0x1B` | `statusAttackEnabler` |
| `+0x1C..0x6F` | `abilityData[21]` |
| `+0x70..0x7F` | compatibilités GF |
| `+0x82` | `powerMod` |
| `+0x83` | `levelMod` |

Le codec doit refuser section tronquée, stride invalide, arg hors plage,
effect ID nul/invalide et overflow. Aucune lecture directe de
`0x1CF4DC0` ne doit être nécessaire aux tests offline.

### 2. Routage `0x03` / `0xFE`

Ne reproduis pas l’ancien overclaim :

- le pending `command_id=0x03` transfère par le cas par défaut du **groupe 2** ;
- plus tard, le résolveur observe `COMMAND_TYPE_ID=0xFE` ;
- pris isolément, le cas de transfert brut `0xFE` correspondrait au groupe 1 ;
- la réécriture arrive après le transfert et ne permet pas de conclure que le
  pending GF est un groupe-1.

Reconstitue la frontière exacte. Dans le modèle canonique, exprime la phase et
la provenance ; ne transforme pas `0x03` ou `0xFE` en enum métier universel.
Les octets restent dans le codec runtime.

### 3. Profils spéciaux

Avant d’implémenter U18.7, construis une matrice exhaustive :

| Famille | Variants à fermer | Propriétaire du trigger | Propriétaire du payload |
| --- | --- | --- | --- |
| Odin | variantes réellement émises | G17/U22.7 | G18 |
| Phoenix | `1` | G17 | G18 |
| Gilgamesh | `7..10` | G17 | G18 |
| Angelo | `11..13` | G17 | G18 |

Pour chaque variant : cibles admissibles, formule/fixe/%, statuses, RNG
consommé par le payload, effets HP/KO, achèvement sans dégâts éventuel,
persistance et intention de présentation. Si une ligne ne peut pas être fermée
statiquement, crée une question `SQ-G18-xxx` et un scénario live discriminant.
Ne code jamais « ce que fait normalement FF8 » à partir de mémoire.

## Hors scope strict

- tirages et scheduling Odin/Phoenix/Gilgamesh/Angelo de G17 ;
- init-rolls de G22 ;
- récompenses, Card, Devour, Mug/steal de G19 ;
- Limits de G20 ;
- décodage du format visuel `.00/.01` et nouveau renderer P2 ;
- animations, caméra et audio réimplémentés ;
- insertion hôte `0x71` ;
- Cover/Regen/Return Damage résiduels de G17 ;
- appel d’un resolver, calculateur, commit HP/status ou state machine GF natif
  depuis le domaine de remplacement.

Une capacité hors scope doit devenir une intention typée ou une dette nommée,
jamais un fallback implicite.

## Loi de couches obligatoire

Applique le skill `implementing-iso-layer-boundary`.

### `core`

Contient uniquement le domaine portable :

- identités et profils GF canoniques ;
- charge, Boost, niveau, puissance, absorption et persistance ;
- résultat de dégâts/statuts ;
- profils spéciaux et intentions de présentation ;
- transitions déterministes et erreurs typées.

Il ne contient aucun RVA, pointeur, offset, `__thiscall`, POD natif, command ID
brut, relay byte ni appel hôte.

Réutilise `BattleState`, `SlotState`, `GfChargeState`, `ActionRequest`, les
formules G09-G11, l’application G10 des statuts et les types G14 au lieu de
créer une deuxième représentation. Étends les structures uniquement avec les
champs canoniques nécessaires.

### `application`

Orchestre une transaction GF sur copie :

1. valider demande, acteur, cibles et profil ;
2. démarrer ou avancer la charge ;
3. appliquer cadence et annulation ;
4. résoudre dégâts/statuts ou profil spécial ;
5. appliquer absorption et persistance ;
6. émettre présentation et barrières ;
7. committer une fois ou rollback intégralement.

`BattleSession` coordonne les services existants ; il ne lit jamais la mémoire
hôte et ne connaît aucun offset.

### `abi`

Ajoute seulement les POD de frontière indispensables, avec
`static_assert(sizeof/offsetof)` pour chaque champ live. Le snapshot est
append-only : le schéma G18 attendu est 22 et tous les schémas 9..21 restent
décodables.

### `runtime-x86`

Possède exclusivement :

- codec `K_GF_JUNCTIONABLE` et profils non junctionables ;
- import/export de charge, HP GF, KO, listes junctionnées et latches ;
- conversion pending/current-action ;
- seam G18 borné, write guard et témoins ;
- encodage des intentions vers le `SealedNativePresentationAdapter`.

Toutes les adresses passent par `find_symbol` et l’address map. Aucun RVA
magique dans le code. N’ajoute pas de `TemporaryG18NcompAdapter` : la seule
unité de compatibilité autorisée est l’adaptateur G14 scellé.

## Architecture cible recommandée

Adapte les noms à la topologie existante, sans déplacer les anciennes couches
inutilement :

- `core/include/ff8iso/core/gf_gameplay.hpp` ;
- `core/src/gf_gameplay.cpp` ;
- `application/include/ff8iso/application/gf_action.hpp` ;
- `application/src/gf_action.cpp` ;
- `runtime-x86/include/ff8iso/runtime_x86/kernel_gf_codec.hpp` ;
- `runtime-x86/src/kernel_gf_codec.cpp` ;
- `runtime-x86/src/g18_gf_gameplay.cpp` ;
- `tests/offline/test_g18.cpp` ;
- `tests/offline/test_g18_payload.py` ;
- `tests/in-process/G18.suite.toml` ;
- `tests/fixtures/g18/` pour le dump authentique et ses métadonnées.

Les types métier minimaux devraient couvrir :

- `GfId` / `GfFamily` ;
- `GfProfile` ;
- `GfChargeTransaction` ;
- `GfPersistentState` ;
- `GfResolveOptions` ;
- `GfOutcome` / `GfResolveError` ;
- `SpecialGfProfile` ;
- `GfPresentationIntent` ou réutilisation directe des intentions G14.

Évite un mega-struct miroir de `F_CHAR_DATA`. Le codec traduit vers quelques
champs canoniques explicites.

## Sémantique gameplay à implémenter

### U18.1 — métadonnées

- couverture machine-validée 16/16 ;
- effect ID 1-based, nom de fichier visuel `mag<effect_id-1>_b.*` uniquement
  dans la couche présentation ;
- support de `gfPower == 0` sans transformer automatiquement l’action en miss ;
- payloads statuts exacts ;
- compatibilités GF appliquées au bon acteur si elles appartiennent bien au
  resolve ordinaire ;
- profils non junctionables explicites, jamais index négatif ou wraparound.

### U18.2 — routage

- phase pending GF `0x03`, transfert groupe 2, état résolveur `0xFE` ;
- conservation acteur, arg, target mask, séquence et provenance ;
- consommation exactement une fois ;
- aucun second pending writer ;
- aucun appel au dispatcher natif ;
- refus typé en cas de transition ou arg incohérent.

### U18.3 — charge

- démarrage depuis une demande GF valide ;
- décrément lié aux pulses G06 existants ;
- cadence Haste/Slow conforme aux mêmes règles que l’ATB ;
- gel sous pause et latches appropriés ;
- transition à zéro exactement une fois ;
- annulation sur état acteur réellement prouvé ;
- nettoyage de tous les latches et capacité à invoquer de nouveau ;
- aucun état stale après rollback, annulation ou seconde invocation.

### U18.4 — dégâts, Boost et familles spéciales

Respecte l’ordre des opérations entières natif :

```text
dmg = spread
    * ((GF_SUMMON_MAG_BONUS + 100)
      * (GF_BOOST
        * (power * ((265 - spr)
          * (GF_LEVEL_MOD * GF_LEVEL / 10 + power + GF_POWER_MOD)
          / 8) / 256)
        / 100)
      / 100)
    / 256
```

Puis, dans l’ordre confirmé : Shell si applicable, demi-dégâts du bit
`status_2 0x00080000`, élément `dmg*(900-elem_def)/100`, drain éventuel,
puis gates Float/Earth, KO et Invincible. Réutilise les primitives déjà
portées ; ne copie pas une variante divergente.

Ferme et teste aussi :

- Diablos `% max HP` :
  `GF_LEVEL * target.max_hp / (GF_POWER_MOD - GF_LEVEL_MOD + 100)` ;
- Cactuar et autres dégâts fixes ;
- caps, signe, absorption élémentaire et arrondis intermédiaires ;
- Boost minimal, normal et borne haute ;
- GF de puissance nulle avec statuts ;
- RNG exact par cible lorsque le profil en consomme.

### U18.5 — absorption

Le pool live est `party_slot.target_info_mask`, pas les slots 8..10.
L’absorption intervient au commit final après calcul normal et seulement si les
préconditions confirmées sont vraies : acteur party, état mid-summon, timer
actif, pool non nul et hit non normal admissible.

Le test doit prouver :

- le pool baisse et `current_hp` du summoner ne baisse pas ;
- un hit non admissible touche le HP normal ;
- l’épuisement arrive sans underflow ;
- le compteur `NumberOfKOs` n’augmente qu’une fois ;
- l’entrée junctionnée est marquée KO ;
- le HP actif se répercute dans la table GF persistante ;
- la sortie nettoie timer/flags/ID actif ;
- aucune écriture n’atteint les slots 8..10 ;
- rollback pré-commit et restauration de la sauvegarde de test sont exacts.

La synchronisation exacte entre `target_info_mask`, le miroir
`F_CHAR_DATA+0x18` et la table persistante est une dette statique connue :
ferme-la par IDA ou par un témoin live ciblé avant de promouvoir U18.5.

### U18.6 — soutien/statuts

Une GF de soutien s’achève normalement sans dégâts. Assertions minimales :

- Carbuncle : Reflect sur les alliés ;
- Cerberus : Double + Triple, payload `status_2=0x00060000` ;
- Siren : Silence sur les ennemis ;
- Doomtrain : payload confirmé `status_1=0x003A`,
  `status_2=0x0100540D` ;
- Alexander : payload vide et dégâts Holy, témoin négatif des statuts.

Ajoute une assertion « tous les bits attendus ajoutés » plutôt que le trop
faible « au moins un statut ajouté ». Une immunité individuelle doit être
rapportée comme résultat typé, sans changer le verdict de la résolution globale
si les autres cibles continuent.

### U18.7 — profils spéciaux

Consomme l’`ActionRequest` G17 authentique ou une copie synthétique strictement
identique. Le profil doit résoudre son payload gameplay et émettre sa
présentation, sans relancer les rolls G17.

Exige une table exhaustive et des fixtures déterministes pour Odin, Phoenix,
les quatre variantes Gilgamesh et les trois variantes Angelo. Toute variante
non fermée reste `UnsupportedEvidenceGap`, avec `SQ-G18-xxx`, et bloque la
promotion globale ; elle ne tombe jamais dans une attaque générique.

Réconcilie ici les intentions G12 Boko/Phoenix/Moomba si l’audit d’ownership
confirme que G18 est leur seul moteur futur.

### U18.8 — présentation

Émets des intentions pour :

- effet/effect ID ;
- côté et masque de cibles ;
- propriétaire caméra ;
- audio ;
- barrière de début, resolve, fin et retour idle.

Le `SealedNativePresentationAdapter` peut exécuter une cinématique native
strictement visuelle. L’audit doit distinguer ses appels autorisés des appels
gameplay interdits. La fin n’est validée que lorsque acteur, caméra, BdLink,
relay `0x70`, action latch et pending sont revenus dans l’état attendu.

## Tests offline obligatoires

Ajoute au minimum :

1. dump et décodage 16/16 des lignes GF authentiques ;
2. bounds, section tronquée, effect ID invalide, arg hors plage ;
3. matrice de couverture : chaque ligne a un handler ou profil explicite ;
4. routage `0x03` groupe 2 vers état resolve `0xFE` sans confusion globale ;
5. formule GF avec ordre d’arrondi, niveau, power/level mods et Boost ;
6. élément faible/neutre/résist/null/absorb, Shell et demi-dégâts ;
7. Diablos %, Cactuar fixe et caps ;
8. charge normale, Haste, Slow, pause, zéro et double tick ;
9. annulation avant commit, après début et appel répété ;
10. absorption positive et tous les témoins négatifs ;
11. épuisement, KO une fois, persistance et nettoyage ;
12. Carbuncle, Cerberus, Siren, Doomtrain et Alexander ;
13. exact-all-status, immunité par cible et poursuite multi-cible ;
14. Odin/Phoenix/Gilgamesh `7..10`/Angelo `11..13` ;
15. intentions G12 non orphelines ;
16. intentions de présentation et barrières sans helper gameplay natif ;
17. rollback exact à chaque faute pré-commit ;
18. compatibilité snapshot schémas 9..21 et nouveau schéma 22 ;
19. validation de contrats et audit d’appels interdits ;
20. régression cumulative G00..G17.

Le rapport offline doit donner le nombre exact de lignes, profils, variantes et
branches testés. « Tests passés » sans matrice de couverture n’est pas une
preuve d’exhaustivité.

## Protocole runtime G18

Ajoute un protocole versionné `g18-gf-gameplay-v1`, un bit d’activation G18 et
un témoin append-only au snapshot schéma 22. Préserve intégralement les offsets
des témoins antérieurs.

Le témoin G18 doit enregistrer au minimum :

- profil et scénario ;
- PID, hash EXE, hash DLL, address-map ID ;
- command pending, groupe, current action et réécriture observée ;
- acteur, GF ID, command arg, effect ID et hash de ligne kernel ;
- timers des 11 slots avant/après et nombre de pulses ;
- états Haste/Slow/pause/annulation ;
- GF level, power, mods, Boost et résultat numérique ;
- HP/statuts avant/après par cible ;
- pool `target_info_mask`, miroir actif, HP GF persistant et KO count ;
- RNG lane/draws ;
- profils/variants spéciaux consommés ;
- intentions et transitions de barrières G14 ;
- pending writes, commits, rollbacks et restore status ;
- forbidden calls, native gameplay calls et write-guard violations ;
- préimages/hashes avant armement, après suite et après shutdown.

Étends :

- `tools/make_suite_payload.py` avec `--group G18 --profile P1` et un
  `--g18-scenario` explicite ;
- `tools/capture_runtime_evidence.py` et son décodeur ;
- `tools/validate_evidence_envelope.py` ;
- `tools/validate_contracts.py` ;
- `tests/in-process/G18.suite.toml` ;
- `Invoke-IsoGroup -Group G18 -Profile P1`.

Prépare tous les payloads avant de lancer FF8. Aucun changement de scénario ne
doit nécessiter une recompilation.

## Audit des appels et écritures

Interdis depuis `core`/`application` et le seam gameplay G18 :

- `BattleAction_ResolveAndApplyDamage` ;
- `Damage_ComputeRawDeltaFromAttackType` ;
- `ComputeMagicAndGFDamage` ;
- `Battle_ApplyDamageOrHeal` ;
- `BattleGF_FinalizeSummonExit` ;
- tout dispatcher ou writer GF natif.

Un callback visuel appelé uniquement derrière le
`SealedNativePresentationAdapter` est compté séparément. Il n’autorise aucune
mutation gameplay. Les plages d’écriture G18 doivent être nommées et minimales :
pending/current action autorisés, timer/flags GF, pool/miroir/HP persistant/KO,
HP/statuts cibles et latches de présentation nécessaires. Tout autre octet est
une violation terminale.

## Politique live

Le live n’est lancé qu’après :

- fermeture statique terminée ;
- CTest cumulatif vert ;
- contrats verts ;
- DLL PE32 construite ;
- hash DLL calculé ;
- payloads de tous les scénarios générés ;
- jeu explicitement fermé avant build, puis relancé par l’opérateur ;
- vérification Open World/menu et canari de préimage.

Sur chaque nouveau PID :

1. bootstrap d’abord ;
2. vérifie préimage et address map ;
3. arme le watch avant l’action ;
4. demande une action opérateur unique ;
5. laisse le runtime décider le verdict ;
6. attends le rollback/désarmement à une frontière de frame ;
7. appelle explicitement `FF8Iso_Shutdown` ;
8. vérifie `Detached`, préimages restaurées et processus vivant.

Une observation opérateur coordonne et valide l’aspect visuel, mais ne remplace
jamais le verdict machine.

Ne reconstruis jamais une DLL chargée. Sur `BUSY`, franchis une seule frontière
de frame, remets en pause, recapture un canari et autorise une seule tentative.
Un second `BUSY`, un autre statut, un écran noir, un acteur bloqué ou une
restauration partielle impose l’arrêt et un nouveau processus après correction.

## Garde anti-interférences

Pendant toute la campagne :

- conserve le garde Odin/Gilgamesh aléatoire ;
- remets périodiquement le compteur de crise à zéro depuis le hook fréquent
  déjà propriétaire de cette maintenance ;
- identifie ces écritures par feature tag et compteur de témoin ;
- restaure leurs préimages au shutdown ;
- ne modifie jamais les aptitudes équipées du joueur à son insu.

Même pour tester U18.7, ne réactive pas les triggers aléatoires. Injecte une
copie déterministe de l’`ActionRequest` que G17 émettrait, avec provenance et
variant enregistrés. Ainsi le test prouve le résolveur G18, pas le hasard G17.

## Stratégie live minimale — une session logique, trois combats

Une seule session suffit techniquement : même processus, même DLL, même hash,
trois scénarios précompilés et réarmables. Chaque combat a sa propre enveloppe
et sa propre préimage. Une faute terminale, un redémarrage du jeu ou un rebuild
crée une nouvelle session et invalide la continuité du PID précédent.

### Combat A — offensive, charge, Boost et appel répété

Préconditions :

- ennemi robuste, sans absorption/immunité à l’élément choisi ;
- party vivante, pas Invincible, pas KO/Petrify/Silence ;
- une GF offensive disponible sur l’acteur ;
- de préférence Alexander ou Ifrit comme ancre simple ;
- support Cerberus disponible sur un autre acteur si le combat le permet.

Sous-scénarios :

1. invocation offensive avec Boost de base ;
2. invocation offensive avec Boost contrôlé et supérieur ;
3. invocation répétée après retour complet idle ;
4. Cerberus ou autre soutien, si la durée du combat le permet.

Assertions : exactitude charge/timers, transition pending/résolveur, magnitude,
statuses, consommation unique, retour ATB/acteur, absence d’état stale,
barrières et présentation visuellement cohérente.

### Combat B — absorption, épuisement et annulation

Le runner doit préparer un pool bas et des hits déterministes ; ne dépends pas
du choix aléatoire d’un ennemi. Isole trois cas :

1. hit admissible pendant charge : pool baisse, HP acteur stable ;
2. hit qui épuise : KO GF une fois et writeback persistant ;
3. nouvelle charge annulée : timer/flags/pending nettoyés, acteur libéré.

Restaure ensuite la préimage de sauvegarde/HP GF du laboratoire. Ne laisse pas
la GF de l’utilisateur durablement KO.

### Combat C — soutien et profils spéciaux

Exécute :

1. Cerberus sur la party : Double + Triple sur tous les alliés admissibles,
   zéro dégât ;
2. un profil spécial fixe offensif, de préférence Odin ou une variante
   Gilgamesh statiquement fermée ;
3. un profil spécial de résurrection, Phoenix, si la fixture peut préparer des
   alliés KO sans ambiguïté.

Les requêtes spéciales sont injectées au seam G18 comme copies exactes des
requêtes G17 ; aucun roll n’est rejoué. Les autres variants restent couverts
exhaustivement offline. Si Phoenix rend la séance fragile, il peut être le
seul scénario reporté dans une Session O, mais uniquement avec une question
discriminante nommée ; n’ouvre pas une campagne d’observation générale.

## Instructions à l’opérateur

Pendant le live :

- parle en français ;
- demande une seule action à la fois ;
- précise combat, personnage, GF, cible, pause/reprise et signal attendu ;
- n’effectue aucune mutation mémoire non annoncée ;
- si une valeur doit être stagée, indique adresse logique/champ, ancienne
  valeur, nouvelle valeur, raison et rollback prévu ;
- demande explicitement de fermer le jeu avant toute recompilation ;
- si l’opérateur dit avoir fermé ou redémarré le jeu, abandonne immédiatement
  l’ancien PID et recommence bootstrap/canari sur le nouveau.

Ne demande pas à l’opérateur d’évaluer les HP/statuts à l’œil si le collector
peut les lire. Demande seulement ce qui n’est pas machine-observable : écran
noir, animation, UI, modèle bloqué, reprise de contrôle.

## Vérifications avant promotion

Exécute au minimum :

```powershell
python .\tools\validate_contracts.py
cmake --build --preset debug-x86
ctest --preset debug-x86 --output-on-failure
python .\tools\make_suite_payload.py --group G18 --profile P1 --g18-scenario offensive --output .\suite-G18-offensive.bin
```

Ajoute les payloads `absorption`, `support` et `special` selon l’interface
réellement implémentée. Vérifie que la DLL est PE32 et calcule son SHA-256.

La promotion est interdite si :

- une des 16 lignes n’a pas de traitement explicite ;
- un variant spécial autoritatif reste inconnu ;
- un helper gameplay natif est appelé ;
- pending/groupe/resolve ne sont pas distingués ;
- charge, annulation ou appel répété laissent un latch ;
- l’absorption touche le HP acteur ou les slots 8..10 à tort ;
- KO/persistance/rollback ne sont pas prouvés ;
- un support GF est validé par HP au lieu des statuts exacts ;
- la présentation finit avant le retour réel acteur/caméra/BdLink idle ;
- le collector rapporte `Faulted`, violation d’allowlist ou restauration
  partielle ;
- la DLL/hash de preuve ne correspond pas au candidat final ;
- G00..G17 régressent.

## Manifestes et documentation

Met à jour au minimum :

- `manifests/ownership-matrix.toml` avec `[P1.G18]` ;
- `manifests/evidence-policy.toml` avec `[promotion.G18]` ;
- `manifests/content-matrix.toml` ;
- `manifests/fallback-policy.toml` si une politique nommée change ;
- address map et ABI ledger pour les nouveaux symboles/structures prouvés ;
- `README.md` ;
- CMake et suite G18 ;
- documentation de protocole/snapshot ;
- matrice de couverture GF authentique ;
- journal des `SQ-G18-xxx`.

Produis au moins :

```text
evidence/g18-gf-gameplay-static-closure-2026-08-27.md
evidence/g18-gf-gameplay-offline-validation-2026-08-27.md
evidence/g18-gf-gameplay-live-promotion-2026-08-27.md
evidence/battle-iso/p1-g18-*-post-suite-2026-08-27.json
evidence/battle-iso/p1-g18-*-post-shutdown-2026-08-27.json
```

Chaque rapport cite hashes, commandes, résultats, appels interdits, écritures,
rollback, limites exactes du claim et dettes reportées. Ingest ensuite avec
`ff8-evidence-wiki-ingest` et compile QMD.

## Stop conditions

Arrête-toi immédiatement et rapporte le diagnostic si :

- le `kernel.bin` authentique ne permet pas le dump 16/16 ;
- une préimage ou un ABI nécessaire reste ambigu ;
- le jeu tourne au moment d’un link ;
- le PID ou le hash DLL change en cours de session ;
- le write guard ou l’audit d’appels faute ;
- un resolver natif doit être appelé pour obtenir le résultat ;
- un état moitié natif/moitié replacement est détecté ;
- l’écran devient noir ou l’acteur reste verrouillé ;
- le rollback n’est pas byte-for-byte ;
- les mêmes conditions de blocage se répètent après la seule tentative
  contrôlée autorisée.

Ne promeus pas « avec dette » une violation de frontière. Une dette de preuve
live peut être nommée ; une dépendance gameplay native non scellée bloque G18.

## Rapport final attendu

Le rapport final doit donner :

1. fichiers modifiés ;
2. architecture et frontières de couches ;
3. matrice 16/16 et profils spéciaux ;
4. résultats CTest/contrats/build et nouveau nombre total de tests ;
5. hash DLL et protocole/schéma snapshot ;
6. résultat de chaque combat live ;
7. appels natifs et écritures observés ;
8. rollback/shutdown et survie du processus ;
9. confiance par U18.1..U18.8 avec preuves et plafond justifié ;
10. questions ouvertes/debt ledger ;
11. statut de `[promotion.G18].satisfied` ;
12. pages Oxygen ingérées et résultat de compilation QMD.

Ne conclus jamais « G18 terminé » si le rapport ne permet pas de distinguer ce
qui est exhaustivement prouvé offline, représentativement prouvé live et
encore seulement inféré.
