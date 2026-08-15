# Nouveau batch — clôture G09 « physical AttackSlice »

## Préambule outillage — une vérification, puis travaille

Ne dépense pas de contexte à chercher ces outils dans le dépôt :

1. **RTK n'est pas un MCP.** Exécute une seule fois
   `Get-Command rtk; rtk --version`, puis vérifie dans
   `$env:USERPROFILE\.cursor\hooks.json` la commande `rtk hook cursor` sous
   `preToolUse` pour `Shell`. L'installation actuelle est RTK `0.42.4`. Si le
   hook est présent et la commande fonctionne, il réécrit automatiquement les
   commandes Shell : ne préfixe jamais toi-même une commande par `rtk`, ne
   cherche pas de serveur RTK et passe immédiatement à la suite. Si RTK gêne
   une commande composée, sépare simplement les commandes.
2. **QMD est le moteur du vault.** Dans Codex, utilise directement
   `mcp__qmd__status`, `mcp__qmd__query`, `mcp__qmd__get` et
   `mcp__qmd__multi_get`; dans Cursor, ce sont les outils `status/query/get`
   du serveur `qmd` exposés par `GetMcpTools`/`CallMcpTool`. Cible toujours la
   collection `ff8-wiki`, combine `lex` et `vec` dans le même appel, puis ne
   récupère que les sections utiles. Si le MCP QMD échoue une fois, utilise le
   CLI déjà installé — `qmd status`, `qmd search ... -c ff8-wiki`,
   `qmd vsearch ... -c ff8-wiki`, `qmd get <page>:<ligne> -l <n>` — sans passer
   plusieurs tours à redécouvrir le serveur.
3. **Context Mode sert à comprimer les gros outputs du dépôt cible, pas à
   interroger le wiki.** Appelle d'abord le MCP
   `mcp__context_mode__ctx_doctor` (outil `ctx_doctor` dans Cursor), puis teste
   la racine en appelant `ctx_execute_file` sur le `README.md` absolu de
   `C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated` et en
   n'affichant que son premier titre. Si les deux passent, emploie ensuite
   `ctx_execute_file` pour filtrer un gros fichier,
   `ctx_batch_execute` pour grouper plusieurs commandes avec leurs requêtes et
   `ctx_search` pour ne rappeler que les passages pertinents. Pour une petite
   sortie, utilise le Shell normal. Le refus éventuel d'un fichier du vault
   `re-ff8` n'est pas une panne : ce vault doit passer par QMD.

Arrête-toi seulement si RTK ou son hook est réellement absent, si Context Mode
refuse le dépôt d'implémentation, ou si QMD échoue à la fois par MCP et par CLI.
Donne alors le diagnostic exact, sans réinstallation improvisée.

Après ces trois contrôles, lis les instructions `AGENT(S).md` applicables,
vérifie le MCP IDA et pousse dans l'IDB les noms, types et commentaires que tu
prouves. Ne refais pas la découverte d'outillage plus tard dans le batch.

Travaille principalement dans :

`C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated`

Sources de recherche et vault Obsidian :

`C:\Users\djden\source\repos\retro-eng\re-ff8`

Intégration/injection si nécessaire :

`C:\Users\djden\source\repos\FFScriptLoader`

## Mission

Fermer définitivement **G09 — physical AttackSlice** et déverrouiller le
premier profil **P1** réellement fonctionnel : une commande joueur Attack
authentique (`pending command_id = 0x01`) doit traverser les ownership G06,
G07 et G08, consommer le `TargetPlan` pointer-free, résoudre hit/evade/crit et
les dégâts physiques dans l’ordre natif, committer le résultat autorisé,
produire un événement de dégâts exact, terminer sa présentation puis rendre le
latch d’action à l’état idle.

Le chemin promu ne doit appeler aucun resolver, helper de dégâts, writer HP,
status, réaction ou récompense natif appartenant au domaine remplacé. Aucun
fallback silencieux n’est permis après engagement.

G09 est le premier jalon qui produit volontairement un effet de gameplay
persistant. Distingue donc explicitement :

- **avant commit** : toute erreur restaure byte-for-byte les préimages et rend
  la main seulement après vérification complète ;
- **après commit** : le coup accepté doit être mené jusqu’à un état cohérent et
  idle. Si cela devient impossible, reste en fail-stop ; ne rends jamais la main
  au natif avec HP, événement, latch ou présentation partiellement commités.

Ne fais pas de commit sans demande explicite.

## Pourquoi ce batch vient maintenant

G08 est fermé. Une commande Magic/Meteor authentique a traversé G07 et produit
un `TargetPlan` ordonné, déterministe et pointer-free sans appeler G09. Le plan
a été publié une fois, tenu sans nouveau tirage RNG, complété puis supprimé avec
rollback exact.

G09 consomme désormais cette interface gelée. Il ne doit pas refaire le
ciblage, ne doit pas reroller une cible déjà résolue et ne doit pas reconstruire
un contexte depuis les globals natifs. Pour le premier slice, la commande
supportée est **Attack joueur `0x01`**, avec un plan direct à un hit. Les autres
familles physiques restent fail-closed jusqu’à leur jalon ou à une promotion
explicite.

G10 portera l’application générale des statuts, timers et périodiques. G17
portera la décision/exécution des réactions et contre-attaques. Les rewards,
scripts de mort, AI et terminal battle flow ne doivent pas entrer furtivement
dans G09 parce que le helper natif de commit les mélange.

## État confirmé à reprendre

- Au moment de la rédaction, le dépôt d’implémentation est propre sur `main`,
  commit `d4ae3ca3b672943e0b0d571ce6c2d0b4d0424bb3` (`Implement G08 targeting
  mechanics and update related structures`). Vérifie l’état réel au démarrage
  et préserve toute modification ultérieure de l’utilisateur.
- G05 à G08 sont strictement fermés pour leurs frontières promues.
- EXE supporté SHA-256 :
  `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.
- Candidat G08 final DLL SHA-256 :
  `01df050581a4ff003b51df00d57e80e8ba45731baa6b91707466f51df74d6194`.
- Preuve canonique G08 :
  `C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated\evidence\battle-iso\p0-g08-live-pending-post-shutdown-2026-08-11.json`.
- SHA-256 de cette enveloppe :
  `35993960479f7c3e156d6f9fec2738414e9c3d5f0589fd36cce02e257bef9505`.
- G08 protocol v2/scenario 2 a capturé le pending authentique
  `07a0020210000001`, produit la séquence `0x08000002`, normalisé
  `0xA007 → 0x2007 → 0x0007`, publié dix cibles et consommé dix draws RNG sur
  la lane 3 (`68 → 78`).
- Le witness final contient une publication, un hold, une completion, zéro
  helper natif de ciblage, zéro resolver G09, zéro G17, zéro violation et
  restauration G07 `0x1ff`, état final `Detached`.
- Le verrou d’acteur observé après la capture Meteor était attendu : G08 ne
  résout ni dégâts ni completion physique. G09 doit précisément fermer ce
  manque pour son Attack supportée.
- `core/target_plan.hpp` fournit `TargetPlan`, `ResolvedTarget` et
  `RedirectIntent`, capacités 32 hits/64 draws. Ne change pas cette interface
  sans raison démontrée et tests de compatibilité.
- L’activation G08 actuelle utilise la seam authentifiée
  `BattlePendingAction_Write`. Pour G09, adapte-la à Attack `0x01` plutôt que
  d’ajouter par défaut un hook intérieur au resolver.
- Les cinq seams historiques frame/HUD/ATB/switch/Director et la seam pending
  doivent retrouver leurs préimages exactes au shutdown.
- Le HUD, le pump `Battle_RunFileLoadingCallbacks` et le bridge BdLink restent
  des unités natives de présentation scellées. Ils ne deviennent pas de la
  logique de dégâts ni une ownership graphique.
- `content-matrix.toml` garde actuellement P1 bloqué par `G08` et `G09`. Ne
  retire ce verrou qu’après la preuve G09 finale.
- Dette documentaire concrète à fermer dès le début : l’address map contient
  les symboles G08, mais `abi-ledger.yaml` ne les reflète pas encore. Synchronise
  le ledger avant d’étendre G09 ; ne reporte pas cette dette à la clôture.
- Le layout complet et la capacité du record de dégâts 24 octets sont encore
  `blocked-evidence`. C’est un bloqueur G09.7, pas un détail facultatif.

## Ordre de découverte — QMD puis sections utiles

Utilise QMD `ff8-wiki` avant de lire des pages entières. Pour chaque thème,
combine la passe lexicale et la passe sémantique dans un seul appel sur :

1. `G09 AttackSlice hit evade crit physical damage HP commit DamageEvent`
2. `BattleAction ResolveAndApplyDamage Damage_ComputeRawDelta Attack metadata`
3. `Battle_UpdateDamage 24 byte result buffer capacity hit count consumer`
4. `physical Protect element drain Zombie Sleep Confuse KO last attacker`
5. `G08 final TargetPlan G09 zero calls actor latch unlock presentation`

Lis ensuite seulement les sections nécessaires, dans cet ordre :

1. `obsidian-docs/projects/re-ff8/references/battle-iso-migration-milestones.md`
   — G09, puis frontières G10/G17/P1 ;
2. `obsidian-docs/projects/final-fantasy-viii-reimaginated/references/p0-g08-target-plan-validation.md` ;
3. `obsidian-docs/projects/re-ff8/references/battle-formulas.md` — accuracy,
   crit, physical, element, HP commit et function map ;
4. `obsidian-docs/projects/re-ff8/concepts/damage-status-pipeline.md` ;
5. `obsidian-docs/projects/re-ff8/concepts/elemental-resolution.md` — physical
   carrier et lowest-set-element behavior ;
6. `obsidian-docs/projects/re-ff8/concepts/battle-state-model.md` — slots et RNG ;
7. `obsidian-docs/projects/re-ff8/references/battle-slot-and-command-layouts.md` ;
8. `obsidian-docs/projects/re-ff8/concepts/battle-lifecycle.md` — latch,
   présentation et handback ;
9. `obsidian-docs/projects/re-ff8/concepts/command-action-pipeline.md` — G07/G08 ;
10. `obsidian-docs/projects/re-ff8/skills/implementing-iso-battle-migration.md`
    — DamageEvent bloqué et contrat P1 ;
11. `docs/tech/reference/battle_action_resolve.h`,
    `docs/tech/systems/damage_pipeline.md`, `docs/tech/systems/render_bridge.md`
    et `docs/tech/test/test_damage_pipeline.md` ;
12. les anciennes investigations damage/element seulement comme pistes, jamais
    comme autorité supérieure à l’EXE hashé ou à une capture finale.

Priorité : enveloppe live finale hash-bound → page canonique actuelle → IDA
exacte de l’EXE → documentation technique → staging/ancien prompt/transcript.

Avant toute modification, inspecte au minimum :

- `README.md`, `CMakeLists.txt`, `core/`, `application/`, `abi/`, `runtime-x86/` ;
- `core/target_plan.*`, `application/battle_session.*` et les fixtures G08 ;
- `contracts/include/ff8iso/launch_contract.h` ;
- les quatre manifests, `closure/port-manifest.yaml`,
  `closure/unresolved-edges.report.md`, `lift/call-audit-spec.md` et
  `lift/host-allowlist.yaml` ;
- tout `address-map/ff8_en_064d466b5fe2ba90/`, notamment `abi-ledger.yaml` ;
- `tests/offline/`, `tests/in-process/G08.suite.toml`, payload, décodeur,
  capture, canaris et validation d’enveloppe ;
- la preuve G08 finale et le commit qui l’a produite.

Fais un état des lieux bref et un plan concret, puis poursuis sans attendre une
validation intermédiaire sauf bloqueur réel ou action in-game nécessaire.

## Politique de preuve — statique d’abord, live seulement où discriminant

N’utilise pas le live comme substitut à une lecture IDA que l’EXE permet de
fermer presque exactement.

Peuvent être promus principalement par preuve statique exhaustive + fixtures :

- ordre et largeur des opérations arithmétiques ;
- divisions/troncatures, signedness, caps et overflow ;
- branches Protect/Zombie/element/crit ;
- lecture exacte des tables metadata ;
- layout d’un record si tous ses writers/readers/xrefs sont fermés ;
- liste complète des globals lus/écrits et des appels directs ;
- comportement de capacité/overflow si toutes les branches sont visibles.

Le live est requis lorsqu’il tranche une ambiguïté dynamique réellement utile :

- ABI/préimage d’une seam ou d’un consumer retenu ;
- ordre inter-call des draws RNG hit/crit/variance ;
- contenu authentique Attack metadata/action globals ;
- moment exact du commit HP/event et durée de consommation du record ;
- transition présentation/latch vers idle ;
- vérification finale intégrée sur le hash candidat.

Ne fais pas une matrice live exhaustive pour revalider chaque entier déjà prouvé
statiquement. Une capture native bien instrumentée doit enregistrer plusieurs
faits indépendants. Une seule campagne finale suffit pour un hash inchangé ;
rejoue uniquement après changement du candidat ou capture invalide/ambiguë.

### Gate anti-retry live

Avant de choisir une nouvelle seam ou un watcher, établis statiquement la
chaîne `writer → durée de visibilité → consumer/clear → première boundary
owned`. Si la valeur est produite et consommée avant cette boundary, le polling
de frame et la pause manuelle sont interdits : intercepte le writer/consumer
prouvé. Sépare aussi dans le préflight la préimage **stock avant hook** de l'état
**detour installé**, et définis l'idle par les champs natifs réellement
invalidés, jamais par l'exigence qu'un blob entier soit zéro.

Après un échec live, lis d'abord le witness. Ne rejoue pas le même protocole
sans changement discriminant de seam, d'instrumentation ou de candidat. Ces
règles auraient évité les deux watchers G08 trop tardifs et le rejet `0x177`.

## Ambiguïtés bloquantes — ne rien coder par intuition

1. **Metadata Attack joueur.** Retrouve la source exacte de power, hit%,
   élément, pourcentage élémentaire, flags, status payload, animation et bonus
   crit pour `command_id=0x01`. Distingue `K_WEAPON`, données junctionnées du
   slot et globals transitoires. Ne recycle pas la table enemy attack.
2. **Deux resolver layers.** Classe précisément
   `BattleAction_ResolveSpecialActionAndUpdateDamage` `0x485160` et
   `BattleAction_ResolveAndApplyDamage` `0x48FE20`. G09 doit les remplacer, pas
   appeler l’un pour éviter de porter l’autre.
3. **Ordre RNG.** Ferme l’ordre exact, conditionnel, des tirages hit, crit et
   variance : miss, auto-hit, crit impossible, crit possible, null/absorb et
   cap. Après l’incident Meteor/crisis, aucun delta large ne vaut attribution
   par call site.
4. **Champ `+0xC2`.** La doc le décrit à la fois comme `luck` et comme
   `crit_byte`. Vérifie le vrai contrat de `computeCrit`, les noms de champs et
   l’addition avec `RELATED_TO_CRIT_BONUS`.
5. **Hit/miss flags.** Ferme les bits exacts de `HIT_TYPE_2`, hit flags,
   animation, crit, miss et leur sérialisation dans le record 24 octets.
6. **Arithmétique physique.** Prouve widths/signedness et troncature à chaque
   étape de `str + str²/16`, VIT, power, spread `240..272`, post-modifiers,
   clamp `9999/60000`, négatif/absorb et drain. Un résultat final égal ne prouve
   pas l’ordre intermédiaire.
7. **Statuts intrinsèques au hit.** Distingue les clears obligatoires
   Sleep/Confuse, les miroirs de statut et l’application générale d’un payload
   status. G10 reste owner de l’application/timers. Si Attack porte un payload
   non nul que G09 ne sait pas traiter sans G10, fail-close ce cas.
8. **HP/KO et historiques.** Ferme tous les writers de `current_hp`, Death,
   crisis bits, status copies, `last_attacker_*`, reaction type, damage
   accumulator, GF absorb et compteurs. Sépare le commit G09 des réactions AI,
   rewards et scripts de mort.
9. **DamageEvent 24 octets.** Établis chaque offset, type, valeur miss/crit/heal,
   compteur, base `0x1D28344`, capacité réelle, overflow, incrément et consumer
   lifetime. G09 ne peut être promu avec un blob opaque supposé.
10. **Présentation et unlock.** Identifie le contrat minimal qui permet au NCOMP
    de consommer l’événement, finir l’animation et signaler idle lorsque le
    resolver natif est supprimé. Ne garde pas un callback domaine caché sous
    l’étiquette présentation.
11. **KO sans U17/rewards.** Définis des `ReactionIntent`/`RewardIntent` DLL-only
    si nécessaire, mais n’exécute pas `EnemyAI_DispatchSection`, drop/mug/AP,
    Angelo ou terminal checks. Si un KO live cohérent exige ces jalons, garde
    le KO en fixture et promeus un Attack non létal ; documente précisément la
    limite sans prétendre avoir fermé un profil plus large.
12. **Transaction après commit.** Prouve quelle image peut être restaurée avant
    publication et quel état doit persister après un coup accepté. Un shutdown
    P1 ne doit pas annuler silencieusement un dégât légitime ni laisser un event
    consommable deux fois.

Tout point non fermé reste `blocked-evidence`, désactive le scénario concerné et
interdit la promotion. Un test offline inventé ne prouve ni ABI ni ordre RNG.

## Usage ciblé du MCP IDA

Ancres connues à revérifier sur l’EXE exact :

- pending Attack authentique : `BattlePendingAction_Write` `0x484D20`,
  `command_id=0x01` ;
- commande/plan : `BattleAction_ResolveTargetAndHitCount` `0x48E830` ;
- bridge natif large : `BattleAction_ResolveSpecialActionAndUpdateDamage`
  `0x485160` ;
- resolver metadata/damage : `BattleAction_ResolveAndApplyDamage` `0x48FE20` ;
- raw dispatcher : `Damage_ComputeRawDeltaFromAttackType` `0x4922B0` ;
- auto-hit pre-gate : `ShouldSkipPhysicalHitCheck` `0x492B00` ;
- crit : `computeCrit` `0x492B30` ;
- accuracy : `IsTargetHit_HitPercentComputed` `0x492BA0` ;
- raw physical : `ComputeWithDamageSTRFormula` `0x492C40` ;
- autres physical modes : `computeAttackPhysical` `0x492E10` ;
- gunblade/physical carrier : `ContainPhysicalDamageFormula` `0x48F480` ;
- post-processing physical : `HpModifierComputationForPhysical` `0x48F600` ;
- status gate seulement si nécessaire : `BattleStatus_CanApplyHitStatus`
  `0x492AC0`, `DoesMentalStatusHit` `0x48F9F0` ;
- authoritative HP commit : `Battle_ApplyDamageOrHeal` `0x494410` ;
- status mirror helper : `BattleStatus_UpdateSlotStatusCopy` `0x47E2D0` ;
- crisis update cluster : `BattleLimit_ComputeCrisisAndToggleAttackSlot`
  `0x4941F0` ;
- damage-result writer : `Battle_UpdateDamage` `0x48EF80` ;
- damage-result base : `0x1D28344 + 24 * hit_index` ;
- RNG primitive/state : `Battle_GetRandomInt` `0x48F020`,
  `0x1D2A228..0x1D2A230` ;
- slot array : `0x1D27B10`, stride `0xD0`, onze slots ;
- action latch lock/unlock : `0x4876D0` / `0x4876B0`, host latch
  `0x1D28DFD` ;
- action execution lock distinct : `0x1D27B00`.

Les bases `K_WEAPON`, métadonnées player Attack, globals `HIT_*`,
`DAMAGE_DEAL`, hit counter/capacity, event consumer et toute seam de
présentation G09 sont à retrouver par xrefs ; ne leur attribue aucune adresse
par analogie.

Pour chaque fonction réellement requise :

- vérifie start/end, tous les exits, désassemblage, pseudocode, xrefs, ABI,
  pile/registres et préimage ;
- note les widths/signedness à chaque opération ;
- cartographie chaque global/table/slot lu et écrit ;
- énumère tous les callers et writers concurrents pendant l’ownership ;
- sépare calcul pur, commit gameplay, intents aval et présentation ;
- pousse noms/types/commentaires prouvés dans l’IDB.

## Interaction avec l’utilisateur

Sois interactif dès qu’une capture native ou le run final exige une action.
Demande un geste court et non ambigu, par exemple :

- « entre dans un combat avec un ennemi robuste, sans Protect ni statut, puis
  mets le jeu en pause » ;
- « sélectionne Attack, choisis l’ennemi de gauche une seule fois, puis ne
  touche plus à rien » ;
- « équipe/déséquipe l’élément ou la capacité indiquée, puis confirme » ;
- « confirme si l’animation, le nombre de dégâts et le retour du menu sont
  visibles ».

Avant chaque action, indique ce qui est armé, ce qui sera observé et ce que
l’utilisateur ne doit pas faire. Si la composition ou le statut demandé n’est
pas disponible, choisis une capture différente ou une fixture réversible
explicitement étiquetée ; ne la présente jamais comme authentique.

## Périmètre d’implémentation G09

Implémente toutes les unités :

- **U09.1 `ActionProfile`** : transforme l’Attack joueur/weapon metadata en un
  POD borné, pointer-free, avec provenance des champs.
- **U09.2 Hit/evade** : auto-hit, accuracy, Blind, luck/eva, comparaison exacte,
  flags de miss et consommation RNG conditionnelle.
- **U09.3 Critical** : bonus metadata + champ slot prouvé, ordre RNG, flag crit
  et absence de draw lorsque la branche l’interdit.
- **U09.4 Physical raw** : mode Attack normal, fixed-width arithmetic, variance,
  VIT/VIT-0 seulement si prouvé et cap intermédiaire exact.
- **U09.5 Post-processing** : Protect, multiplicateurs prouvés, crit, Zombie,
  élément carrier, null/absorb, drain/sign flip et cap final. Toute branche non
  prouvée doit refuser son input plutôt qu’utiliser une valeur par défaut.
- **U09.6 Commit** : HP clamp, KO/Death de base, historiques prouvés, crisis,
  mirrors et intents aval, sans exécuter G10/G17/rewards.
- **U09.7 DamageEvent** : record exact 24 octets, hit index, capacité, flags,
  writer/consumer lifetime et overflow fail-closed.
- **U09.8 In-process slice** : Attack authentique de ready → pending → G07 →
  TargetPlan G08 → resolve G09 → commit/event → présentation → idle.

Introduis des types canoniques tels que :

- `ActionProfile` ;
- `HitResolution` / `CriticalResolution` ;
- `PhysicalDamageResult` ;
- `DamageCommit` avec intents aval séparés ;
- `DamageEvent` 24-byte ABI et une représentation métier distincte si besoin ;
- `AttackTransaction` avec phase precommit/committed/presenting/completed.

Le nom exact est libre. Tous les types core sont déterministes, POD si
sérialisés, pointer-free et indépendants de la mémoire FF8. `runtime-x86` seul
importe/exporte les plages host. Ajoute `static_assert(sizeof/offsetof)` pour
chaque layout ABI et une politique explicite de capacité/overflow.

Ne stocke pas l’autorité dans les anciens globals `HIT_*`. Les valeurs peuvent
être exportées dans un adapter de compatibilité uniquement si un consumer NCOMP
prouvé les exige, avec allowlist exacte et lifetime borné.

## Ownership P1 transactionnelle G06+G07+G08+G09

Réutilise la seam `BattlePendingAction_Write` et le gateway Director validés.
N’ajoute pas de detour sur chaque helper de damage si la suppression atomique du
Director rend ces helpers inatteignables.

Hors transaction Attack supportée, le jeu peut rester natif. Dès qu’un pending
Attack authentifié est capturé :

1. vérifie hash EXE, protocole, préimages et identité exacte du pending ;
2. attends une frontière post-init cohérente, action-idle, non pausée, non
   terminale, sans AI/callback/résultat concurrent ;
3. importe slots, RNG, G07 ranges, latches, event buffer/counters et toutes les
   plages G09 nécessaires ;
4. capture une préimage transactionnelle complète ;
5. arme G06+G07+G08+G09 en une seule transition ;
6. supprime native HUD-domain writers, Director et tout resolver/writer G09 ;
7. seulement ensuite, exécute la chaîne replacement.

Une nouvelle current action doit produire exactement un TargetPlan puis une
seule résolution G09. Les ticks de hold/presentation ne refont ni targeting,
ni hit, ni crit, ni variance, ni commit HP/event.

La durée ne doit pas être forcée à quatre ticks si la présentation Attack
authentique exige davantage. Versionne le budget et définis des phases :

- capture/arm ;
- planification G07/G08 ;
- precommit G09 ;
- commit atomique HP/event ;
- présentation/hold ;
- completion/unlock ;
- handback au tick suivant seulement après idle et vérification.

Pendant ownership :

- G06 garde quatre pulses HUD/ATB par frame ;
- G07 n’arbitre qu’une fois et garde sa cohérence ;
- G08 ne publie qu’un plan et un Attack direct ne consomme aucun RNG de
  ciblage ;
- G09 est l’unique owner des draws hit/crit/variance et du commit supporté ;
- les appels NCOMP HUD/file-callback/BdLink/présentation restent strictement
  ceux prouvés, à cadence auditée ;
- les helpers natifs targeting, damage, status, HP, event, AI, rewards et
  resolver sont interdits ;
- chaque appel NCOMP est suivi d’une vérification des ranges owned ;
- drift, overflow, mauvais sequence id, plan mismatch, extra draw, extra event,
  double commit, writer/appel inconnu ou rollback incomplet provoque fail-stop.

L’allowlist doit nommer chaque champ : n’autorise jamais les onze slots entiers,
le buffer damage entier ou le cluster `HIT_*` par commodité.

## Hors périmètre strict

- **G10** : pas d’application générale de status payload, timers, Regen, Doom
  ou revive. Les clears/mirrors intrinsèques au hit ne sont admis que s’ils sont
  explicitement classés G09 et prouvés.
- **G11–G16/G19/G20** : pas de Magic, Item, GF, Draw, command abilities,
  Limit, enemy attack ou famille spéciale complète.
- **G17** : aucun choix/exécution Cover, counter, return-damage, Angelo,
  `EnemyAI_DispatchSection` ou réaction on-hit/death.
- **Rewards/terminal** : aucun drop, mug, AP, reward packaging, battle-end check
  ou module cleanup caché dans le commit.
- Aucun resolver/damage helper natif comme raccourci.
- Aucun remplacement graphique. La présentation native reste un adapter NCOMP
  borné, pas une permission d’appeler le domaine natif.
- Aucun élargissement opportuniste à tous les attacks physiques. Le premier
  profil supporte l’Attack joueur explicitement certifiée.

## Tests offline à ajouter

Couvre au minimum :

1. layouts, offsets, POD et sérialisation `ActionProfile`, transaction et
   DamageEvent 24 octets ;
2. extraction exacte de metadata Attack/weapon et refus des familles non
   supportées ;
3. hit : auto-hit, limite accuracy, Blind, luck/eva, hit/miss et draw/no-draw ;
4. crit : impossible, seuils, égalité, flag et draw/no-draw ;
5. ordre RNG hit/crit/variance, wrap cursor, replay exact et rollback sur erreur ;
6. raw physical avec vecteurs fixed-width et troncature intermédiaire ;
7. Protect, crit, Zombie, élément carrier, weak/resist/null/absorb, drain,
   heal-flip et caps `9999/60000` selon metadata prouvée ;
8. invulnerability/VIT-0/status-doubling : résultat exact si prouvé, sinon
   rejet fail-closed explicite ;
9. commit HP heal/damage, clamp, nonlethal, KO de base, crisis/mirrors/history
   et génération d’intents sans G17/reward ;
10. event hit/miss/crit/heal, index/capacité, full buffer, overflow, lifetime et
    double-consumption interdite ;
11. transaction : erreur avant commit restaure tout ; erreur après commit ne
    handback jamais un état partiel ; completion unique retourne idle ;
12. exactly-once : aucun reroll/recompute/recommit pendant hold ;
13. host drift, plan/sequence mismatch, ABI/protocole/hash/préimage incorrects,
    préimage stock versus detour installé, cellule native invalidée avec octets
    résiduels, call/write interdit et rollback partiel ;
14. régressions G06/G07/G08 avec le nouveau hash : cadence, queues, plan,
    présentation, RNG, hooks et zéro fallback ;
15. compatibilité wire G00–G08 lorsque le witness G09 est absent.

Étiquette les fixtures `static reconstruction`, `native capture` ou
`synthetic reversible fixture`. Une fixture exécutée dans FF8 n’est pas une
observation native si son état ou son résultat a été injecté.

Pendant le développement, exécute seulement les tests ciblés. Une fois le
candidat stable, exécute une seule gate offline complète :

```powershell
python .\tools\validate_contracts.py
cmake --preset debug-x86
cmake --build --preset debug-x86 --parallel
ctest --preset debug-x86
```

Valide aussi PE32/I386, payload G09, suite TOML, schéma, décodeur/capture,
canaris, rollback et FFScriptLoader. Ne répète la gate complète qu’après une
modification réelle ou un échec.

## Contrat, ABI, manifests et preuve

Ajoute une extension versionnée et backward-compatible :

- flag de suite `G09` et protocole/scénario explicites ;
- `FF8IsoG09AttackWitness` pointer-free, zéro dans G00–G08 ;
- compteurs plan/resolution/commit/event/presentation/unlock ;
- metadata, slots, HP before/after, hit/crit/miss flags, damage raw/final ;
- RNG before/after, bytes et attribution par phase ;
- event bytes exacts, index/capacité/consumer ack ;
- transaction phase, commit id, idle/handback et rollback flags ;
- compteurs appels/writes interdits et appels NCOMP autorisés ;
- snapshot/schema/envelope versionnés avec lecteurs legacy conservés.

Étends `ownership-matrix.toml`, `fallback-policy.toml`, `content-matrix.toml`,
`evidence-policy.toml`, port manifest, unresolved edges, call audit, host
allowlist, address map et **ABI ledger**. Aucune source de vérité ne doit dire
G09/P1 fermé avant le run final.

Le validator doit recalculer le verdict depuis les faits bruts. Un champ
`PASS` fourni par le runtime n’est jamais suffisant.

## Captures natives minimales avant activation

Consolide autant que possible en une capture instrumentée d’un Attack joueur
authentique :

- pending bytes et TargetPlan direct ;
- metadata source exacte ;
- stats attacker/target au moment du hit ;
- ordre/callsites et bytes RNG ;
- hit/crit/variance ;
- raw/final damage et HP before/after ;
- record 24 octets, compteur et consumer ;
- latch/presentation/unlock.

Ajoute une seconde capture uniquement si la première ne peut pas distinguer une
branche obligatoire (par exemple miss ou crit). Les cas Protect, élément,
absorb, KO et full-buffer peuvent rester des fixtures statiques exactes lorsque
leur branche et leur layout sont exhaustivement prouvés ; ne multiplie pas les
runs live pour obtenir une confiance décorative.

Ne laisse jamais le debugger attaché au run final de promotion.

## Validation live finale

Ne lance aucun live de promotion avant gate offline verte, ledger synchronisé,
event ABI fermé et liste des writers/appels exhaustive.

Utilise un processus FF8 entièrement frais, IDA détaché, bootstrap depuis
Open World/menu, puis suite G09 versionnée. Demande à l’utilisateur un ennemi
robuste, sans statut/réaction problématique, et une seule confirmation Attack.

Le test doit montrer une vraie commande supportée : animation/HUD/3D visibles,
un résultat de hit ou miss cohérent, un nombre de dégâts si hit, HP exactement
modifié, puis retour du système d’action à idle. Une scène noire, un actor lock,
un double nombre, une réaction native inattendue ou un handback partiel est un
échec.

Le gate G09/P1 passe seulement si :

- pending Attack authentique `0x01` traverse G07 puis un TargetPlan G08 direct ;
- G08 ne consomme aucun draw de ciblage pour ce plan direct ;
- G09 résout exactement une fois hit/crit/variance dans l’ordre prouvé ;
- raw/final damage, flags et HP delta correspondent aux fixtures/native trace ;
- exactement un DamageEvent 24-byte valide est publié et consommé une fois ;
- le commit autorisé est atomique et la présentation finit avant unlock ;
- le latch/current action/TargetPlan/transaction retournent tous idle ;
- G06 conserve quatre pulses par frame et G07/G08 ne doublent aucune étape ;
- aucun helper targeting/damage/status/HP/event/resolver/AI/reward natif ne
  s’exécute ;
- aucun write hors allowlist, fallback, overflow, état `Faulted` ou drift ;
- HUD, 3D, callback pump et BdLink restent stables à leur cadence prouvée ;
- shutdown restaure tous les hooks et états temporaires sans annuler le dégât
  légitime déjà accepté ; FF8 reste vivant et cohérent après handback.

Une campagne finale suffit pour le hash candidat. Rejoue seulement si le code
change ou si la capture est invalide.

## Livrables et clôture documentaire

Livre :

- core/application/ABI/runtime G09 et interface stable depuis `TargetPlan` ;
- layouts, address map, **ABI ledger**, préimages, writers, event consumer,
  closure report, call audit et allowlist ;
- manifests, contrat, payload, suite, schéma, outils, tests et CMake ;
- captures natives minimales et enveloppe finale hash-bound EXE/DLL ;
- comparaison G08→G09 : ranges, RNG, transaction, commit, présentation,
  limites et handback ;
- mise à jour de `README.md`, matrices, roadmap et docs damage/render bridge ;
- décision explicite sur le déverrouillage P1 et les cas encore fail-closed.

Après la preuve finale, utilise le skill `ff8-evidence-wiki-ingest` : lis son
`SKILL.md`, ingère les preuves sans modifier les sources brutes, mets à jour le
manifest et recompile QMD/MDC `ff8-wiki`. Vérifie que QMD retrouve la clôture
G09, que P1 est marqué déverrouillé, et que G10 est le prochain jalon sans être
présenté comme déjà implémenté.

Ne déclare G09 fermé que si une Attack authentique replacement produit un effet
HP/event exact, termine sa présentation et rend la main idle sans appel domaine
natif ni état partiel. Si event layout/capacité, RNG order, metadata, writers,
commit ou unlock reste inconnu, documente le bloqueur, garde G09/P1 fail-closed
et ne transforme pas une réussite offline ou un nombre de dégâts visible en
preuve de clôture.
