# Nouveau batch — clôture G07 « command spine »

Travaille principalement dans :

`C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated`

Sources de recherche et vault Obsidian :

`C:\Users\djden\source\repos\retro-eng\re-ff8`

Intégration/injection si nécessaire :

`C:\Users\djden\source\repos\FFScriptLoader`

## Mission

Fermer définitivement **G07 — command spine** : transformer des `ActionRequest`
scriptées en pending records, les transférer dans les trois groupes de files
d’exécution, arbitrer une action courante déterministe et maintenir son latch,
sans résolution de cible, de dégâts, de statut, d’IA ou de présentation.

G07 doit être une ownership atomique et fail-closed. Une activation live ne
peut pas mélanger un tick natif et un tick replacement, ni retomber
silencieusement sur un writer natif.

Ne fais pas de commit sans demande explicite.

## Pourquoi ce batch vient maintenant

G06 est fermé : le replacement possède l’input normalisé, les quatre pulses
ATB par frame, la charge GF, l’escape et les événements actor-ready. En revanche,
un actor-ready ne devient pas encore une action déterministe : pending records,
exec queues, arbitration, current action et latch restent hors ownership.

G07 fournit précisément ce pont. G08 consommera ensuite l’action courante pour
produire des cibles concrètes, et G09 réalisera le premier chemin Attack jusqu’à
la résolution et au commit HP. Tant que G07 n’est pas fermé, ces deux gates ne
doivent pas être activés.

## État confirmé à reprendre

- G05 et G06 sont strictement fermés.
- Décision de clôture G06 : DLL SHA-256
  `66c17d81b406e653444d85b52441ae2d24839805de43339eec3349dded6c5289`.
- Preuve finale :
  `C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated\evidence\battle-iso\p0-9-g06-closure-v3-final-live.json`.
- G06 conserve exactement quatre pulses logiques ATB par frame de
  `FFBattleModule`, avec pause/action locks, GF, ready, escape et RNG validés.
- `BattleUI_RenderHud` reste la seule unité native de présentation scellée
  `NCOMP`. Ne touche pas aux graphismes, à la caméra, aux effets ou à la
  construction du HUD.
- G07 est volontairement absent du candidat G06 : pending hash inchangé, aucune
  command queue synthétisée, aucun current action et aucune résolution.
- L’activation reste désactivée par défaut et seulement armée par une requête de
  suite versionnée.
- La dette G04 de wrappers ABI ne doit pas être élargie. Ajoute un wrapper
  uniquement si G07 prouve qu’il est indispensable, après capture de son ABI et
  de sa préimage.
- Certaines pages de synthèse contiennent encore des paragraphes historiques
  disant que la promotion G06 est ouverte, ou citent le témoin intermédiaire
  `20624485…a7648cf4`. La décision de clôture et l’enveloppe finale ci-dessus
  font autorité ; ne régresse pas vers un candidat intermédiaire.

## Ordre de découverte — aller vite sans relire tout le vault

Commence par lire `AGENT.md` dans `re-ff8`. Utilise ensuite la collection QMD
`ff8-wiki` avant d’ouvrir des fichiers entiers. Fais une passe lexicale et une
passe sémantique sur ces requêtes :

1. `G07 ActionRequest pending triplets exec pools arbitration action latch`
2. `BattlePendingAction_Write TransferToExecQueue AllocNode SelectNextAction`
3. `three groups eleven cells two subrecords node 0 saturation FIFO`
4. `Draw command_id 0x06 0x04 authentic pending bytes`
5. `G08 targeting fan-out RNG depends on G07`

Lis ensuite, dans cet ordre, uniquement les sections utiles :

1. `obsidian-docs/projects/re-ff8/references/battle-iso-migration-milestones.md`
   — G07, puis les frontières G08/G09 ;
2. `obsidian-docs/projects/re-ff8/concepts/command-action-pipeline.md` ;
3. `obsidian-docs/projects/re-ff8/references/battle-slot-and-command-layouts.md` ;
4. `obsidian-docs/projects/re-ff8/concepts/battle-lifecycle.md` — active-tick
   order et les trois latches à ne pas confondre ;
5. `obsidian-docs/projects/final-fantasy-viii-reimaginated/references/p0-9-g06-ownership-validation.md` ;
6. `obsidian-docs/projects/re-ff8/skills/ff8-live-validation-operations.md` ;
7. `_staging/investigations/exec_queue_layout_2026-06-09.md` et
   `_staging/investigations/command_id_draw_item_confirmation.md`, en respectant
   leurs niveaux de confiance ;
8. `ai-prompt/todo/ai_investigation_live_pending_exec_authentic_bytes.md` pour
   les captures encore utiles, sans répéter celles qui sont déjà hash-bound.

Priorité des sources : preuve live finale liée au bon hash → page canonique
actuelle → analyse IDA statique → staging → ancien prompt/transcript. Un ancien
texte sert de piste, jamais d’autorité supérieure à une enveloppe finale.

Avant toute modification, inspecte le worktree, le code, les tests et :

- `core/`, `application/`, `abi/`, `runtime-x86/` ;
- `manifests/ownership-matrix.toml` et `manifests/fallback-policy.toml` ;
- `address-map/ff8_en_064d466b5fe2ba90/` ;
- `lift/call-audit-spec.md` ;
- `tests/offline/` et `tests/in-process/G06.suite.toml`.

Fais d’abord un état des lieux bref et un découpage concret, puis continue
l’implémentation sans attendre une validation intermédiaire, sauf bloqueur réel.

## Usage ciblé du MCP IDA

Le wiki décrit le contrat attendu ; IDA doit seulement fermer les ABI, adresses,
writers et préimages encore incertains pour l’exécutable supporté. Ne devine
jamais une adresse ou une convention d’appel.

Ancres connues à **revérifier pour l’EXE exact** avant emploi :

- pending blocks : `0x1D28D44`, `0x1D28D5C`, `0x1D28D74` ;
- link tables : `0x1D28864`, `0x1D28890`, `0x1D288BC` ;
- group heads : `0x1D28C00..0x1D28C02` ;
- cell groups : `0x1D288E8`, `0x1D289F0`, `0x1D28AF8` ;
- `BattleExecQueue_AllocNode` : `0x482BD0` ;
- `Battle_EnqueueSpecialAction` : `0x484720` ;
- `BattlePendingAction_TransferToExecQueue` : `0x4847F0` ;
- `BattlePendingAction_Write` : `0x484D20` ;
- `BattleArbitration_SelectNextAction` : `0x485460` ;
- resolver natif hors périmètre G07 : `0x485160` ;
- action-in-progress latch : `BYTE1(TARGET_SLOT_ID)` à `0x1D28DFD` ;
- action-execution lock distinct : `0x1D27B00`.

Avec le MCP IDA, vérifie les fonctions, désassemblages, xrefs, structures et
octets de préimage. Cartographie tous les writers natifs qui pourraient toucher
pending, links, heads, cells, current-action globals ou latch pendant le mode
G07. Recherche le helper de consommation par ses xrefs au lieu de lui attribuer
une adresse supposée.

Si tu apprends quelque chose de nouveau en reverse engineering, pousse le nom,
le type et/ou le commentaire dans l’IDB conformément à `AGENT.md`.

L’ambiguïté Draw (`0x06` actuel contre ancien fixture `0x04`) ne doit pas être
cachée dans un enum. Soit une capture authentique à
`BattlePendingAction_Write` la ferme pour cet EXE, soit Draw reste explicitement
non promu/fail-closed. G07 peut tester le groupe direct avec Attack sans inventer
Draw.

## Périmètre d’implémentation G07

Implémente toutes les unités suivantes :

- **U07.1 `ActionRequest`** : attacker, famille/argument, target mask,
  auxiliaires et métadonnées de source ; POD, typé et sans pointeur hôte.
- **U07.2 Pending triplets** : trois blocs de 24 octets, entrées de 8 octets,
  préfixe dense, durée de `active`, politique de remplacement et sérialisation
  byte-exacte.
- **U07.3 Pending transfer** : chaque entrée active est consommée une seule fois,
  son bit est effacé au moment exact, puis elle est routée selon sa famille.
- **U07.4 Exec pools** : trois groupes, onze cellules par groupe, liens, heads,
  deux sous-enregistrements et trois target masks par sous-enregistrement.
- **U07.5 Allocation fallback** : première cellule libre selon la signature
  native et comportement de saturation avec fallback node 0.
- **U07.6 Group routing** : groupe 2 direct, groupe 1 cinématique/spécial,
  groupe 0 engine-forced. Ne confonds pas les réactions IA avec les actions
  forcées groupe 0.
- **U07.7 Arbitration** : priorité `0 → 1 → 2`, FIFO, skips Petrify/Sleep/Stop
  pour groupes 1/2 et exemption groupe 0.
- **U07.8 Current action** : consommer/délier la cellule avant résolution et
  construire un contexte transitoire pointer-free.
- **U07.9 Action latch** : start, hold, completion contrôlée et prévention de
  toute double arbitration.

Sépare le modèle déterministe du miroir ABI : `core` ne voit jamais de pointeur
FF8 ; seul `runtime-x86` lit ou écrit la mémoire hôte. Ajoute des assertions
`sizeof`/`offsetof` sur chaque layout sérialisé.

## Ownership live atomique

Le mode G07 doit s’armer uniquement à une frontière sûre, après import complet
et vérification de dérive. Dès qu’il est actif :

- les writers natifs pending/transfer/alloc/arbitration/current-action/latch
  couverts par G07 sont supprimés ou rendus inaccessibles ;
- le replacement exécute transfert et arbitration **une fois par active Director
  tick admissible**, pas quatre fois par frame ;
- G06 continue séparément à produire exactement quatre pulses ATB par frame ;
- pause, résultat terminal et action latch bloquent les étapes appropriées ;
- aucun fallback natif silencieux n’est autorisé ;
- toute dérive, ABI manquante, writer inconnu ou appel interdit provoque un
  fail-stop explicite avant écriture supplémentaire ;
- l’allowlist couvre seulement les octets G07 prouvés, jamais une plage large par
  commodité.

Choisis la seam live la plus étroite qui permette réellement d’empêcher tous les
writers concurrents. Si cela exige un nouveau wrapper Director ou intérieur non
prouvé, capture d’abord ABI, préimage, registres et pile. Si cette preuve manque,
arrête avant activation live et laisse G07 désactivé.

## Hors périmètre strict

- **G08** : aucune normalisation de cible, éligibilité, sélection aléatoire,
  fan-out, redirect ou target history mutable.
- **G09** : aucun hit/evade/crit, calcul de dégâts, commit HP/KO/statut ou
  DamageEvent.
- **G17/G20/G24** : pas d’IA complète, de familles spéciales complètes, de vraie
  command UI ou de sous-menu. Les `ActionRequest` G07 sont scriptées.
- Aucune action native de résolution, aucune animation de combat nouvelle et
  aucun remplacement graphique/caméra/effet.

Il est permis de donner au `CurrentAction` une interface propre que G08 pourra
consommer. N’implémente pas G08 dans ce batch. La dépendance, le RNG et la
nouvelle surface d’écriture justifient une promotion live séparée.

## Tests offline à ajouter

Couvre au minimum :

1. layouts, tailles, offsets et sérialisation exacte des pending/cells/links ;
2. insertion dans chaque position du triplet, préfixe dense, remplacement et
   triplet plein ;
3. transfert répété idempotent et clear de `active` exactement une fois ;
4. routing des trois groupes et packing des deux sous-records/trois masks ;
5. allocation libre, chaînage FIFO, heads et saturation node 0 ;
6. priorité `0→1→2`, FIFO intra-groupe, skips de statut et exemption groupe 0 ;
7. consommation avant current action, hold/completion du latch et absence de
   double arbitration ;
8. erreurs fail-closed : EXE/layout/version incompatibles, drift, writer/appel
   interdit, activation hors frontière ;
9. régression G06 : quatre pulses, pause/action lock, NCOMP HUD et allowlist
   inchangés.

Utilise des fixtures byte-exactes. Si une fixture provient seulement d’une
reconstruction statique, étiquette-la comme telle ; ne la présente pas comme une
capture authentique.

Pendant le développement, lance seulement les tests ciblés utiles. Quand le
candidat est prêt, exécute **une seule gate offline complète** :

```powershell
python .\tools\validate_contracts.py
cmake --preset debug-x86
cmake --build --preset debug-x86 --parallel
ctest --preset debug-x86
```

La validation PE32/I386 doit passer dans le build. Valide aussi le payload, le
schéma d’évidence et l’injecteur. Ne répète la gate complète qu’après une
modification du candidat ou un échec réel.

## Validation live finale

Ne lance aucun live tant que la gate offline n’est pas verte.

Pour le candidat final : processus FF8 entièrement frais, IDA détaché,
Open World/menu, bootstrap préalable, hashes EXE/DLL enregistrés, puis suite
versionnée G07. Les watches et le verdict doivent être automatiques ; les gestes
de l’utilisateur ne servent qu’à coordonner l’entrée/sortie de combat.

Avant le run, explique clairement à l’utilisateur ce qu’il doit voir : ce test
ne résout aucune Attack et ne doit infliger aucun dégât. Le HUD doit rester
visible via NCOMP ; une action scriptée peut être sélectionnée et tenue sans
animation de résolution. Toute disparition durable du HUD, action ennemie
inattendue ou blocage hors fenêtre bornée est un défaut, pas un succès visuel.

Le gate live G07 passe seulement si :

- les quatre pulses G06 par frame sont conservés ;
- chaque active Director tick transfère/arbitre au plus une fois côté
  replacement et zéro fois côté natif ;
- les pending bytes, clears, links, heads, cells, subrecords et masks sont exacts ;
- les trois groupes, transfert répété et saturation node 0 correspondent aux
  fixtures ;
- priorité/FIFO/skips/exemption correspondent aux fixtures ;
- exactement une action courante est consommée, avec latch sans double
  arbitration ;
- aucun resolver G08/G09, writer hors allowlist, appel battle-native interdit ou
  fallback ne s’exécute ;
- les compteurs d’audit sont cohérents et le runtime n’est pas `Faulted` ;
- le shutdown restaure toutes les préimages de hooks byte-for-byte, désarme G07,
  restaure l’état temporaire prévu par le protocole et laisse FF8 vivant.

Une campagne live finale suffit pour un hash inchangé. Ne rejoue que si le code
change ou si la capture est invalide/ambiguë.

## Livrables

- code, manifests, address map/ABI ledger et suites G07 ;
- fixtures offline et enveloppes d’évidence live liées aux hashes ;
- audit explicite des appels et écritures interdits ;
- synthèse précise : unités fermées, ABI nouvellement prouvées, limites,
  tests exécutés, hash candidat et résultat du rollback ;
- mise à jour de la documentation canonique et ingestion des nouvelles preuves
  avec le skill `ff8-evidence-wiki-ingest`, puis recompilation de la collection
  QMD/MDC `ff8-wiki`.

Ne déclare G07 fermé que si l’ownership pending→exec→arbitration→current action
est réellement exclusive et validée live sur le hash final. Si un writer, une
ABI ou une seam reste inconnue, documente le bloqueur avec preuves, conserve
l’activation fail-closed et ne transforme pas un succès offline en clôture live.
