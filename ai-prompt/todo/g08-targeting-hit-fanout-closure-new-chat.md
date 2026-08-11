# Nouveau batch — clôture G08 « targeting and hit fan-out »

Travaille principalement dans :

`C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated`

Sources de recherche et vault Obsidian :

`C:\Users\djden\source\repos\retro-eng\re-ff8`

Intégration/injection si nécessaire :

`C:\Users\djden\source\repos\FFScriptLoader`

## Mission

Fermer définitivement **G08 — targeting and hit fan-out** : consommer le
`CurrentAction` pointer-free fermé par G07, normaliser son `target_mask`,
appliquer les règles d’éligibilité et les tirages RNG dans l’ordre natif, puis
produire un plan de cibles concrètes, ordonné et déterministe pour chaque passe
ou hit.

G08 couvre les masques directs, self/ally/enemy, groupes, random, revive,
Double/Triple, hit-count, application d’un redirect déjà décidé et historique
de cible strictement prouvé. Il ne calcule ni hit/evade/crit, ni dégâts, ni
statuts, ni HP/KO, et n’émet aucun `DamageEvent`.

G08 doit prolonger atomiquement les ownership G06+G07 déjà fermées. Après
engagement, aucun helper natif de ciblage, resolver ou writer concurrent ne
peut s’exécuter, et aucun fallback silencieux n’est permis.

Ne fais pas de commit sans demande explicite.

## Prérequis outillage — fail-closed

Avant toute recherche ou modification :

1. lis `AGENT.md` dans `re-ff8` et respecte son obligation de pousser dans l’IDB
   les noms, types et commentaires nouvellement prouvés ;
2. vérifie que Context Mode démarre et que sa racine/allowlist couvre au minimum
   le dépôt d’implémentation `FinalFantasy_VIII_Reimaginated`, pas le répertoire
   d’installation de Cursor. Le vault `re-ff8` peut rester consulté par QMD ;
   exige son ajout à Context Mode seulement si tu comptes lui faire lire ces
   fichiers directement ;
3. vérifie RTK et son hook. Si le hook est présent et valide, considère qu’il
   s’applique automatiquement et passe à la suite ;
4. vérifie l’accès au MCP IDA natif et à la collection QMD `ff8-wiki` ;
5. si un prérequis échoue réellement, arrête-toi avec le diagnostic exact. Ne
   contourne pas un échec de module natif, d’ABI Node, de hook ou de racine en
   installant/recompilant des dépendances au hasard.

Pour Context Mode, distingue un serveur qui démarre d’un serveur correctement
rooté sur le dépôt cible. Un `doctor` vert sur SQLite ne suffit pas si `Read(...)`
refuse `FinalFantasy_VIII_Reimaginated`. Ne traite pas le recours normal à QMD
pour le vault comme une panne de Context Mode. Pour RTK, ne double-wrappe pas
les commandes lorsque le hook est déjà opérationnel.

## Pourquoi ce batch vient maintenant

G07 est fermé : pending triplets, trois groupes d’exec queues, allocation,
arbitration, consommation, `CurrentAction` et latch sont sous ownership
replacement bornée. Le `CurrentAction` conserve encore ses target masks comme
des valeurs opaques. G07 ne les normalise pas et ne consomme aucun RNG de
ciblage.

G08 transforme cette valeur opaque en un `TargetPlan` canonique utilisable par
G09. G09 prendra ensuite le premier chemin Attack et possédera hit/evade/crit,
formules, commit HP/KO/statut et événements de dégâts. Tant que le plan de
ciblage n’est pas byte-/order-faithful et validé live, G09 ne doit pas être
activé.

## État confirmé à reprendre

- Le dépôt d’implémentation était propre sur `main == origin/main`, commit
  `be1653c` (`Enhance G07 command spine and battle execution mechanics`) lors de
  la rédaction de ce prompt. Vérifie l’état réel au démarrage et préserve toute
  modification ultérieure de l’utilisateur.
- G05, G06 et G07 sont strictement fermés.
- EXE supporté SHA-256 :
  `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.
- Candidat G07 final DLL SHA-256 :
  `868d74e6cf18ddcef26466e183cf329f89051084273012068a6a05e84e0fe64a`.
- Preuve canonique :
  `C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated\evidence\battle-iso\p0-g07-command-spine-closure-v2-final-live.json`.
- G07 protocol v2/schema 10 a passé quatre Director ticks et seize pulses HUD,
  avec exactement une current action, un start/hold/completion du latch, zéro
  double arbitration et rollback exact.
- Les hashes restaurés G07 sont pending `0x6aefde65`, links `0xe19e2f15`, heads
  `0x8f6284d4`, cells `0x40bfc715`; les cinq hooks ont retrouvé leur préimage.
- Le renderer HUD, le pump `Battle_RunFileLoadingCallbacks` et le bridge BdLink
  restent des unités natives de présentation scellées, exécutées une fois par
  replacement Director tick. Ne les transforme pas en ownership graphique.
- `CurrentAction` est un état transitoire DLL-only et pointer-free. Le cluster de
  globals natifs autour de `0x1D27AD8` reste `blocked-evidence`; G08 ne doit pas
  l’exporter par commodité.
- `BATTLE_RNG_LANES` est un état de neuf octets : huit curseurs à
  `0x1D2A228`, puis le lane actif à `0x1D2A230`. La table RNG est statique.
- La preuve G07 compte explicitement zéro appel G08, G09, G17 ou resolver.
  Cette exclusion est la baseline de régression.
- Une ancienne note RNG évoque un mélange CRT `_rand()` et une ancienne note de
  ciblage garde slot 7 ambigu. La clôture live/statique du 2026-06-13 les
  corrige : le RNG de bataille est local aux neuf octets et le random-monster
  choisit seulement `{3,4,5,6}`, alors que les masques AoE explicites peuvent
  inclure le bit 7.

## Ordre de découverte — aller vite sans relire tout le vault

Utilise la collection QMD `ff8-wiki` avant d’ouvrir des fichiers entiers. Fais
une passe lexicale puis une passe sémantique sur :

1. `G08 targeting normalization eligibility RNG fan-out Double Triple history`
2. `BattleAction ResolveTargetAndHitCount computeTargetChoosen target masks`
3. `random party monster slot 7 revive 0x4000 eligibility Angel Wing`
4. `Cover redirect intent U08.6 U17.3 target history last attacker`
5. `G07 final current action latch rollback G08 zero calls`

Lis ensuite, dans cet ordre, seulement les sections utiles :

1. `obsidian-docs/projects/re-ff8/references/battle-iso-migration-milestones.md`
   — G08 puis les frontières G09/U17 ;
2. `obsidian-docs/projects/re-ff8/concepts/targeting-system.md` ;
3. `obsidian-docs/projects/re-ff8/concepts/command-action-pipeline.md` — clôture
   G07 et contrat partagé du mask ;
4. `obsidian-docs/projects/re-ff8/concepts/battle-state-model.md` et
   `obsidian-docs/_staging/investigations/battle_rng_storage.md` ;
5. `obsidian-docs/_staging/investigations/live_static_closure_2026-06-13.md`
   — corrections RNG/slot 7/Cover ;
6. `obsidian-docs/_staging/investigations/targeting_system_2026-06-09.md`, en
   gardant ses éléments non live au niveau de confiance approprié ;
7. `obsidian-docs/projects/re-ff8/references/battle-slot-and-command-layouts.md` ;
8. `obsidian-docs/projects/re-ff8/concepts/battle-lifecycle.md` ;
9. `obsidian-docs/projects/re-ff8/concepts/damage-status-pipeline.md`, seulement
   pour fixer la frontière G08/G09 ;
10. `obsidian-docs/projects/final-fantasy-viii-reimaginated/references/p0-g07-command-spine-validation.md` ;
11. `obsidian-docs/projects/re-ff8/skills/ff8-live-validation-operations.md` ;
12. `ai-prompt/completed/ai_investigation_on_targeting_system.md` et
    `ai-prompt/completed/ai_investigation_live_targeting_slot7_and_mask_bits.md`
    comme pistes de capture, jamais comme autorité supérieure à la doc
    canonique ou à une preuve hash-bound.

Priorité des sources : preuve live finale liée au bon hash → page canonique
actuelle → analyse IDA exacte de l’EXE → staging → ancien prompt/transcript.

Avant toute modification, inspecte au minimum :

- `README.md`, `CMakeLists.txt`, `core/`, `application/`, `abi/`, `runtime-x86/` ;
- `contracts/include/ff8iso/launch_contract.h` ;
- `manifests/ownership-matrix.toml`, `content-matrix.toml`,
  `evidence-policy.toml` et `fallback-policy.toml` ;
- `address-map/ff8_en_064d466b5fe2ba90/`, y compris `abi-ledger.yaml` ;
- `closure/unresolved-edges.report.md` et `lift/call-audit-spec.md` ;
- `tests/offline/`, `tests/in-process/G07.suite.toml` et les outils de payload,
  capture, canaris et validation d’enveloppe ;
- la preuve G07 finale et le dernier commit qui l’a produite.

Fais un état des lieux bref et un plan concret, puis poursuis sans attendre une
validation intermédiaire sauf bloqueur réel ou action in-game nécessaire.

## Ambiguïtés à fermer — ne pas les coder par intuition

G08 ne peut être promu tant que ces points ne sont pas résolus dans IDA et, là
où indiqué, live :

1. **Domaine des bits bas** : la synthèse parle souvent de `0x00FF`, tandis que
   le fan-out décompile `mask & 0x1FFF`. Détermine le rôle exact des bits 8–12,
   la plage de slots valide et le comportement des bits sans slot hôte.
2. **Bit `0x4000`** : il est un paramètre de direction/sélection associé aux
   chemins revive/dead-target, pas une preuve suffisante de sémantique complète.
   Ferme l’ordre des filtres, le fallback et au moins un cas live authentique.
3. **Empty/hidden/dead/petrified/invincible** : ne confonds pas « peut être
   ciblé » et « recevra des dégâts ». En particulier `status_2 & 0x180800` est
   documenté comme barrière damage/status, pas automatiquement comme exclusion
   G08. Prouve chaque filtre et chaque famille.
4. **Cover** : le helper natif agrège sélection du cover, tirage 50/50,
   réécriture et suite resolver. Le jalon actuel place la **sélection du trigger
   et l’insertion de réaction en U17.3**. G08 consomme un `RedirectIntent` déjà
   décidé et applique seulement la cible finale. Ne porte pas U17 en copiant le
   helper entier.
5. **Target history** : distingue les champs nécessaires au ciblage/follow-up
   des `last_attacker_*` écrits après hit/commit. Tout champ produit seulement
   par le damage commit reste G09, même si l’AI le lit plus tard.
6. **Double/Triple** : ferme la provenance du nombre de passes, la relation entre
   les deux subrecords/trois masks G07 et les casts, les conditions d’arrêt après
   la première/deuxième passe et le hit-count mirror.
7. **Entrée réelle du fan-out** : les notes citent `0x48E830`, tandis que
   `0x48EA93` apparaît aussi comme boucle/entrée intérieure. Retrouve la vraie
   frontière de fonction et son ABI ; ne hooke et n’appelle jamais une adresse
   intérieure supposée.
8. **Aucun candidat éligible** : ferme le nombre de tirages, les boucles de
   reroll et les valeurs de repli pour chaque camp, y compris le fallback
   random-monster statiquement vu vers `0x0008`.

Si un de ces points reste inconnu, laisse le scénario concerné explicitement
non promu et garde l’activation G08 fail-closed. Un test offline inventé ne ferme
pas une ABI ou une politique native.

## Usage ciblé du MCP IDA

Le wiki donne la carte ; IDA doit établir la vérité exacte pour l’EXE hashé.
Revérifie avant emploi les ancres suivantes :

- `BattleTarget_ComputeMaskFromDefaultTarget` : `0x483860` ;
- `BattleTarget_GetMaskFromInfoField` : `0x483880` ;
- `EnemyAI_GetTargetMaskFromMask` : `0x4838C0` ;
- `BattleTarget_FindByCondition` : `0x483940` ;
- `BattleAction_ResolveConfusionTarget` : `0x483E00` ;
- `BattleTarget_GetRandomPartyMask` : `0x486DC0` ;
- `BattleTarget_GetRandomMonsterMask` : `0x486E00` ;
- `BattleTarget_SelectByStatusOrStat` : `0x486E70` ;
- `BattleTarget_IsEligibleByStatus` : `0x4877B0` ;
- `BattleAction_ResolveTargetAndHitCount` : candidat `0x48E830`, avec
  `0x48EA93` à classifier ;
- helper hit-count actuellement `sub_48EB40` ;
- `computeTargetChoosen1` : `0x48EB90` ;
- `BattleTarget_IsEligibleByStatusMask` : `0x48EDA0` ;
- `computeTargetChoosen` : `0x48EE50` ;
- `computeTargetChoosen0` : `0x48EEB0` ;
- `Battle_GetRandomInt` : `0x48F020` ;
- resolver/damage strictement hors G08 : `0x485160` et `0x48FE20` ;
- RNG : `0x1D2A228..0x1D2A230` ;
- slot array : `0x1D27B10`, stride `0xD0`, onze slots ;
- native current-action cluster candidat : `0x1D27AD8` et globals adjacents,
  encore `blocked-evidence`.

Pour chaque fonction réellement requise comme preuve :

- vérifie start/end, désassemblage, pseudocode, xrefs, ABI, registres, pile,
  préimage et tous les exits ;
- cartographie chaque global lu/écrit, y compris target arrays, compteurs par
  slot, source/final mask, RNG cursors et historiques ;
- identifie tous les writers concurrents atteignables pendant la seam Director ;
- sépare les effets de ciblage de l’appel aval à G09 ;
- pousse les noms/types/commentaires nouvellement établis dans l’IDB.

Effectue des captures live natives hash-bound avant de coder les règles encore
ambiguës. Au minimum, capture les entrées/sorties de ciblage et les deltas RNG
pour : direct, groupe, random party, random monster, aucun candidat, revive,
redirect et Double/Triple. Ne laisse jamais le debugger attaché au run final de
promotion.

## Interaction avec l’utilisateur

Sois interactif. Dès qu’une capture exige une situation réelle, demande une
action courte et précise, par exemple :

- « mets le combat en pause et confirme quand deux ennemis sont visibles » ;
- « sélectionne cette commande et arrête-toi sur l’écran de choix de cible » ;
- « confirme Attack sur l’ennemi de gauche une seule fois » ;
- « équipe Double/Triple ou Cover, puis dis-moi quand le statut est actif ».

Explique toujours ce qui est armé, ce qui va être observé et ce qui ne doit pas
être fait. Si le save, le sort, le statut ou la composition requis ne sont pas
disponibles, demande une autre action ou prépare un scénario de fixture
réversible prouvé ; ne simule pas silencieusement une capture authentique.

## Périmètre d’implémentation G08

Implémente les unités suivantes :

- **U08.1 Mask normalization** : direct, self, ally, enemy, all-party,
  all-enemy, everyone, reused-target et contrôle des bits réservés/inconnus.
- **U08.2 Eligibility** : empty, hidden/untargetable, alive/dead, Petrify et
  règles family-specific. Représente séparément coarse issuability, per-hit
  eligibility et damage immunity.
- **U08.3 Random selection** : RNG battle-local, ordre exact des draws, retry,
  wrap des curseurs, fallback, party `{0,1,2}`, random-monster `{3,4,5,6}` et
  distinction du bit 7 explicite/AoE.
- **U08.4 Multi-target expansion** : produire les slots concrets dans l’ordre
  natif déterministe, sans pointer vers la mémoire FF8.
- **U08.5 Double/Triple et hit-count fan-out** : préserver source mask, cast,
  pass/hit index, cible avant redirect, cible finale et compte par slot.
- **U08.6 Redirect application** : consommer un `RedirectIntent` typé, validé et
  déjà sélectionné ; appliquer la réécriture/fan-out sans déclencher Cover,
  choisir un protecteur ou insérer une réaction U17.
- **U08.7 Target history** : maintenir seulement les historiques dont le timing
  G08 est prouvé. Les écritures post-hit/post-damage restent G09.

Introduis un résultat canonique tel que `TargetPlan`/`ResolvedTarget` contenant
au minimum : séquence d’action, source mask, normalized/candidate/final masks,
source slot, final slot, cast/pass/hit index, redirect provenance, compte par
slot et nombre/ordre des draws RNG. Le nom exact est libre, mais le type doit
être POD, borné, pointer-free et sérialisable dans l’évidence.

Le core reste déterministe et indépendant de l’hôte. `runtime-x86` seul importe
les slots/RNG et exporte les octets host strictement prouvés. Les données
transitoires de plan peuvent rester DLL-only, comme `CurrentAction` G07.

Ajoute des `static_assert(sizeof/offsetof)` sur chaque layout ABI. Toute table
ou capacité doit avoir une politique explicite d’overflow : jamais de
troncature silencieuse.

## Ownership live atomique G06+G07+G08

Réutilise prioritairement le gateway Director déjà validé par G07. N’ajoute pas
un hook sur le fan-out ou ses helpers si le même résultat peut être obtenu dans
le tick replacement.

À la frontière active-idle :

1. importe l’image complète nécessaire ;
2. vérifie EXE, protocole, préimages, phase, pause, résultat, action/AI locks,
   G07 idle/cohérent et writers concurrents ;
3. capture les préimages G07 et G08, y compris RNG et tout octet d’historique ou
   hit-count qui sera réellement écrit ;
4. arme G06+G07+G08 en une seule transition ;
5. seulement après cela, supprime le Director natif et exécute le replacement.

Cadence attendue par frame admissible : trois pulses G06, un Director tick,
G07 transfer/arbitration, puis G08 **une seule fois pour une nouvelle current
action**, ensuite les unités de présentation scellées, puis le quatrième pulse
G06. Un current action tenu au tick suivant ne doit pas refaire le ciblage ni
consommer un RNG supplémentaire.

Pour la première clôture, conserve de préférence le protocole borné à quatre
Director ticks / seize pulses utilisé par G07 :

- tick 1 : staging G07, sélection d’une current action, résolution G08 unique et
  vérification de la matrice de fixtures ;
- tick 2 : hold, preuve no-double/no-retarget/no-extra-RNG ;
- tick 3 : consommation contrôlée du `TargetPlan`, completion sans G09 ;
- tick 4 : vérification et rollback exact avant désarmement ;
- handback natif seulement au tick suivant, après restauration confirmée.

Si la preuve exige un autre budget, versionne explicitement le protocole, le
payload, la suite et le schéma ; ne modifie pas implicitement la cadence G07.

Pendant ownership :

- G06 conserve exactement quatre pulses par frame ;
- G07 conserve transfer/arbitration/current/latch sans fallback ;
- G08 est l’unique consommateur du target mask et l’unique owner des draws RNG
  de ciblage ;
- une éventuelle consommation RNG G06 (par exemple escape) doit être exclue par
  scénario ou ordonnée dans un contrat unique, jamais courir concurremment ;
- les helpers natifs `BattleTarget_*`, `computeTargetChoosen*`, le resolver G09,
  damage/status et AI sont interdits ;
- les callbacks/BdLink NCOMP restent une fois par tick et sont suivis d’une
  comparaison des owned ranges ;
- toute dérive, overflow, target bit inconnu, writer/call interdit, mismatch de
  séquence, protocole ou RNG provoque un fail-stop avant la prochaine écriture ;
- un rollback partiel maintient les hooks en fail-stop et interdit le handback.

L’allowlist doit nommer les champs exacts. Ne rends pas les onze `BattleSlotPod`
entièrement writable pour faciliter les fixtures. Les champs de slot servant à
l’éligibilité sont normalement read-only ; si une suite live les stage, utilise
une sous-plage test-only prouvée, capture/restaure chaque octet et sépare cette
capacité de l’ownership production.

## Hors périmètre strict

- **G09** : aucun hit/evade/crit, formule, variance de dégâts, élément, status
  chance, HP/KO, drain, reward, réaction on-hit ou `DamageEvent`.
- **U17.3/G17** : aucune décision de trigger Cover, aucun choix autonome du
  protecteur, aucune insertion de contre/réaction et aucune exécution d’AI.
- **G10+** : aucun timer/status application, Regen, Doom ou résurrection
  complète. G08 ne fait que sélectionner une cible morte/éligible quand le
  contrat revive le demande.
- **G11/G12/G13/G14/G20** : pas de logique complète Magic/Item/GF/Draw/Limit ;
  ces familles peuvent fournir des fixtures de masque au service partagé.
- Aucun resolver natif, aucune animation d’action nouvelle et aucun
  remplacement HUD/3D/caméra/effet.
- Aucun export opportuniste vers le cluster natif current-action tant que son
  layout et ses writers restent `blocked-evidence`.

Il est permis d’étendre proprement `CurrentAction` ou d’ajouter une interface
consommable par G09. N’implémente pas le vertical slice Attack dans ce batch.

## Contrat, ABI, manifests et outillage

Étends de façon cohérente :

- le payload de suite versionné G08 et son validateur ;
- `FF8Iso_EvidenceSnapshot` avec un witness G08 borné et backward-compatible ;
- le décodeur/capture d’évidence et le JSON schema ;
- `tests/in-process/G08.suite.toml` ;
- l’address map générée, `abi-ledger.yaml`, les préimages et le rapport
  d’unresolved edges ;
- l’ownership matrix, content matrix, evidence policy et fallback policy ;
- le write guard et le call audit avec compteurs G08/G09/G17 explicites ;
- `README.md` et `CMakeLists.txt`, y compris l’enregistrement réel des nouveaux
  tests Python/C++ dans CTest.

Un witness G08 doit rester entièrement nul pour les suites G00–G07. Ne casse ni
le décodage des anciens snapshots ni les payloads 64 octets si une extension
compatible suffit ; sinon versionne clairement taille, schema et transport.

Le witness doit permettre de vérifier sans interprétation au minimum : budget
et cadence, nombre de plans, absence de retarget, classes de masks, candidats
rejetés par raison, slots ordonnés, counts par slot, redirects appliqués, RNG
lane/cursor/draws avant-après-attendus, histories écrits/restaurés, appels
natifs interdits, allowlist, hashes et rollback.

## Tests offline à ajouter

Couvre au minimum :

1. layouts, capacités, offsets, POD et sérialisation exacte du `TargetPlan` ;
2. direct/self/ally/enemy et reused-target ;
3. `0x8007`, `0x80F8`, `0x80FF`, ordre concret et slot 7 explicite ;
4. bits 8–12, valeurs réservées et masks invalides fail-closed ;
5. empty, hidden/untargetable, dead, Petrify, coarse versus strict eligibility,
   Angel Wing et séparation de l’invulnérabilité damage-only ;
6. chemin `0x4000` revive/dead-target avec candidats mixtes et aucun candidat ;
7. random party/monster, retries, fallback, slot-7 exclusion, curseur wrap et
   séquence exacte de bytes RNG ;
8. group expansion stable, multi-hit, compte par slot et overflow ;
9. Double/Triple 1/2/3 passes, arrêt sur statut et relation aux masks G07 ;
10. application d’un redirect valide/invalide sans sélection U17 ni draw caché ;
11. historique prouvé, rollback et rejet des écritures G09 prématurées ;
12. exactement un targeting par nouvelle current action, zéro retarget au hold,
    completion sans G09 et mismatch de séquence transactionnel ;
13. drift host, target bit inconnu, RNG inattendu, writer/appel interdit,
    mauvais EXE/protocole/préimage et rollback partiel ;
14. régression G06/G07 : quatre pulses, présentation scellée, command spine,
    current/latch, hashes restaurés et zéro fallback inchangés ;
15. compatibilité payload/snapshot/capture G00–G07 avec witness G08 absent.

Utilise des fixtures byte-/draw-exactes. Étiquette séparément reconstruction
statique, capture live authentique et fixture synthétique. Une fixture exécutée
dans un processus live n’est pas automatiquement une observation native.

Pendant le développement, lance les tests ciblés. Quand le candidat est prêt,
exécute une seule gate offline complète :

```powershell
python .\tools\validate_contracts.py
cmake --preset debug-x86
cmake --build --preset debug-x86 --parallel
ctest --preset debug-x86
```

La validation PE32/I386 doit passer. Valide aussi payload G08, suite TOML,
schéma, canaris, décodeur/capture et injecteur. Ne répète la gate complète
qu’après une modification du candidat ou un échec réel.

## Validation live finale

Ne lance aucun live de promotion tant que la gate offline n’est pas verte et
que les captures IDA requises ne sont pas classées.

Pour le candidat final : processus FF8 entièrement frais, IDA détaché, état
Open World/menu, bootstrap avec les cinq préimages stock, puis suite versionnée
G08. Les watches et le verdict sont automatiques ; demande seulement à
l’utilisateur les gestes nécessaires pour entrer/sortir d’un combat et observer
la fenêtre.

Explique avant le run que **G08 ne résout aucune Attack et ne doit infliger
aucun dégât**. Le HUD et la scène 3D doivent rester visibles. La suite peut
sélectionner puis tenir une action et publier un plan interne de cibles, mais ne
doit pas produire d’animation de hit, de nombre de dégâts ou de réaction.

Le gate live G08 passe seulement si :

- G06 conserve quatre pulses par frame et G07 une current action/latch exacts ;
- une nouvelle current action produit exactement un `TargetPlan` et un hold ne
  le recalcule pas ;
- toutes les fixtures direct/group/random/revive/redirect/Double-Triple passent
  avec cibles concrètes ordonnées ;
- source mask, normalized mask, final masks, slots, counts et history prouvée
  correspondent aux fixtures ;
- le RNG part du snapshot attendu, consomme exactement les bytes attendus dans
  le bon lane et atteint les curseurs attendus ;
- slot 7 est absent du random-monster mais présent dans les masques explicites
  pertinents ;
- aucun resolver G09, hit/damage/status/HP/event, choix U17, AI ou target helper
  natif ne s’exécute ;
- aucune mutation de slot hors fixture test-only/allowlist, aucun writer inconnu,
  aucun fallback, aucune violation write/call guard et aucun état `Faulted` ;
- HUD, callbacks et BdLink gardent la cadence validée G07 sans blink noir ;
- le shutdown restaure byte-for-byte G06, G07, RNG, histories/hit mirrors et
  toute fixture temporaire, puis restaure les cinq hooks et laisse FF8 vivant.

Une campagne finale suffit pour un hash inchangé. Rejoue seulement si le code
change ou si la capture est invalide/ambiguë. L’observation visuelle de
l’utilisateur est une assertion de présentation, jamais une preuve de
sémantique de ciblage à elle seule.

## Livrables et clôture documentaire

Livre :

- core/application/ABI/runtime G08 et interfaces pointer-free vers G09 ;
- address map, ABI ledger, préimages, writers, closure report et call audit ;
- manifests, contrat, payload, suite, schéma, outils, tests et CMake ;
- enveloppe live finale liée aux hashes EXE/DLL et note de validation ;
- comparaison précise avec G07 : unités conservées, nouvelles owned ranges,
  RNG consommé, ABI prouvées, limites et résultat du rollback ;
- mise à jour de `README.md`, des matrices et de `abi-ledger.yaml` — ne reporte
  pas ces documents comme un suivi facultatif ;
- mise à jour des pages canoniques du vault et du catalogue d’évidence.

Après la preuve finale, utilise le skill `ff8-evidence-wiki-ingest` pour ingérer
les nouvelles preuves, préserver les sources brutes, mettre à jour le manifest
et recompiler la collection QMD/MDC `ff8-wiki`. Lis son `SKILL.md` avant de
l’utiliser. Vérifie ensuite que QMD retrouve la décision de clôture G08 et que
le roadmap déverrouille G09 sans prétendre que G09 est déjà implémenté.

Ne déclare G08 fermé que si le service partagé mask → cibles concrètes est
exclusif, déterministe, validé live, et utilisable par player/AI/GF/Limit/forced
sans appeler le ciblage natif. Si une ABI, une classe de masque, un writer, une
politique RNG ou la seam reste inconnue, documente le bloqueur, conserve
l’activation fail-closed et ne transforme pas une réussite offline en promotion
live.
