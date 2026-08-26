# Nouveau batch — G14 callbacks, barrières et propriétaire de présentation scellé

Tu travailles jusqu'à obtenir une implémentation G14 offline complète, des
artefacts live prêts, puis les preuves live minimales nécessaires à la
promotion. Sois interactif dès qu'une action in-game est nécessaire. Ne
suppose jamais qu'une instance de FF8 existe encore : demande explicitement
son état, et demande sa fermeture avant tout rebuild qui remplacerait le DLL.

## Résultat attendu

Implémenter puis promouvoir **G14 — Own domain callbacks and a minimal barrier
scheduler** sans réouvrir G11–G13 et sans créer une nouvelle moitié de moteur
graphique. À la fin :

- U14.1–U14.7 sont implémentés et testés ;
- les callbacks sont des intentions typées, sans pointeur natif dans `core/`
  ou `application/` ;
- les attentes de présentation utilisent des prédicats typés, jamais des
  délais fixes pour décider qu'une action est terminée ;
- le runtime possède un seul propriétaire natif scellé pour HUD, callbacks de
  fichiers, BdLink, séquences, caméra, effets, popups et relays conservés en
  NCOMP ;
- aucun contexte, allocateur ou pointeur replacement n'entre dans une liste
  native ;
- le détecteur de demi-propriété rejette avant mutation ou dispatch ;
- G11 Magic, G12 Item et G13 Draw peuvent terminer leur présentation via cette
  frontière, sans remettre leurs règles domaine dans le runtime ;
- une preuve positive et une preuve négative terminale, hash-bound, ferment
  G14 ;
- le wiki Obsidian et QMD sont à jour.

## Préambule outillage — une vérification, puis travaille

### RTK

RTK n'est pas un MCP. Vérifie une seule fois :

```powershell
Get-Command rtk
rtk --version
Select-String -Path "$env:USERPROFILE\.cursor\hooks.json" `
  -Pattern "rtk hook cursor|preToolUse" -Context 1,1
```

L'installation connue est RTK `0.42.4`. Si le hook `preToolUse` Shell est
présent, note `rtk=pass` et n'y reviens plus. Ne préfixe pas manuellement les
commandes par `rtk` et ne cherche pas un serveur MCP RTK.

### QMD

QMD est une commande locale, pas un prérequis MCP. Cible toujours la collection
`ff8-wiki` :

```powershell
qmd status
qmd search "G14 U14 callbacks barriers presentation" -c ff8-wiki -n 10 --files
qmd search "SQ-G14-001 SQ-G14-002" -c ff8-wiki -n 10 --line-numbers
qmd get qmd://ff8-wiki/projects/re-ff8/references/battle-iso-migration-milestones.md:648:45
```

Utilise `qmd get` sur des sections, pas des lectures massives du vault. QMD sert
à trouver les sources et contradictions ; le code, l'IDB et les preuves brutes
restent les autorités techniques.

### Context Mode

Context Mode sert à comprimer les gros outputs du dépôt d'implémentation :

- `ctx_batch_execute` pour plusieurs recherches indépendantes ;
- `ctx_execute` / `ctx_execute_file` pour dériver une synthèse ;
- `ctx_search` pour rappeler une décision déjà indexée.

Ne lui demande pas de lire le vault : le vault passe par QMD. Ne contourne pas
Context Mode si un gros output risque de consommer le contexte.

### IDA MCP

Utilise directement `user-ida-pro-mcp-*`; jamais `curl`, HTTP ou un script
Shell vers IDA. Toute découverte statique doit être poussée dans l'IDB : noms,
commentaires, types, structures et variables. L'EXE supporté est lié au SHA-256
`064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.

### Fail-closed réel

Arrête-toi seulement si RTK ou son hook est réellement absent, si Context Mode
refuse le dépôt cible, si QMD CLI échoue, ou si l'identité de l'EXE n'est pas
supportée. Après ces contrôles, n'utilise pas ces outils comme prétexte pour
redemander plusieurs fois les mêmes vérifications.

## Dépôts et état de départ

Implémentation :
`C:\Users\djden\source\repos\FinalFantasy_VIII_ReImaginated`

Documentation et prompts :
`C:\Users\djden\source\repos\retro-eng\re-ff8`

État audité le 2026-08-26 :

- branche `main`, HEAD `80e85e316368e419f493a2ebcbda9bea253f0cb4` ;
- worktree d'implémentation propre ;
- `python .\tools\validate_contracts.py` : PASS ;
- preset `debug-x86` : build PASS, DLL PE32/I386 ;
- CTest : **35/35 PASS** ;
- G11, G12 semantic Item et G13 Draw Cast/Stock sont promus ;
- aucune suite, witness ni section de promotion G14 n'existe encore ;
- `application::PresentationSignals` existe déjà mais le runtime ne l'alimente
  pas ;
- `TemporaryG06NcompAdapter`, `TemporaryG07NcompAdapter` et
  `TemporaryG09NcompAdapter` ont tous `Removal target: U14.6` ;
- `TemporaryG09NcompAdapter` utilise encore des seuils `8/12/90` ticks. Ils
  sont des heuristiques de compatibilité G09, pas les règles G14 ;
- le guard laboratoire Odin/Gilgamesh est déjà implémenté par
  `FF8ISO_BOOTSTRAP_SUPPRESS_RANDOM_SPECIAL_GFS`. Préserve-le et laisse-le actif
  par défaut pendant les tests G14.

Si HEAD a changé, ré-audite au lieu de réappliquer aveuglément ce snapshot.
Ne remets jamais G11–G13 à `false` et ne modifie pas leurs enveloppes brutes.

## Sources QMD autoritatives à lire par sections

Au minimum :

- `projects/re-ff8/references/battle-iso-migration-milestones` — G14 ;
- `projects/re-ff8/references/g11-g20-static-readiness-ledger` — U14.1–U14.7 ;
- `projects/re-ff8/references/g11-g20-static-open-questions` — SQ-G14-001/002 ;
- `projects/re-ff8/skills/implementing-iso-battle-migration` — scheduler et
  frontière presentation ;
- `projects/re-ff8/skills/ff8-live-validation-operations` — autorité des
  preuves, shutdown et rollback ;
- `projects/final-fantasy-viii-reimaginated/skills/g14-live-barrier-session-plan` ;
- `projects/final-fantasy-viii-reimaginated/skills/g14-live-half-ownership-fault-session-plan` ;
- `projects/final-fantasy-viii-reimaginated/references/p0-g13-draw-validation`.

Ordre de confiance : preuve brute / IDB / bytes / code et tests actuels, puis
pages de validation actuelles, puis ledger, puis anciens drafts. Une phrase
historique disant que G12 ou G13 n'est pas promu ne doit pas écraser les
manifestes actuels.

## Politique de preuve et économie de live

Applique la règle introduite pour G13 : une connaissance statique déjà
confirmée ne doit pas être revalidée live par routine.

Avant tout test live, classe chaque claim :

- `confirmed-static` : IDB + callers/bytes suffisants ;
- `confirmed-offline` : comportement replacement déterministe ;
- `live-required` : signal temporel, ABI ou contexte réellement observable
  seulement dans le processus ;
- `unknown` : bloque uniquement l'unité qui en dépend.

G14 possède deux vrais résidus live :

1. **SQ-G14-001** — cadence/predicat idle des relays `0x70`, `0x71`, `0x74` ;
2. **SQ-G14-002** — layout Magic de `BATTLE_ACTION_SEQUENCE_CONTEXT` et
   consommation/handback ATB après Magic.

Ne rejoue pas G11–G13 pour leurs calculs, stocks, HP, EQUAL ou Draw. Pour Item
et Draw, détermine statiquement si le même codec/contexte de présentation est
partagé. Programme un représentant live supplémentaire seulement si un chemin
divergent reste réellement indécidable après IDA.

Un signal opérateur coordonne une action, il ne décide jamais le verdict. Le
verdict vient du witness runtime, des canaris, de l'audit d'appels, du write
guard, des hashes et du cleanup.

## Loi de couches obligatoire

```text
ff8iso_core -> ff8iso_application -> ff8iso_runtime -> ff8_battle_iso
ff8iso_abi  -> ff8iso_runtime
```

- `core/` : intentions, identifiants, états et règles sémantiques seulement ;
- `application/` : orchestration `BattleSession` et scheduler déterministe ;
- `abi/` : POD natifs et address map ;
- `runtime-x86/` : codecs, lecture des signaux, appels NCOMP et synchronisation.

Interdits dans `core/` et `application/` :

- `ff8iso/abi/`, `abi::`, `find_symbol`, RVA et noms de globals natifs ;
- `LegacyBattleImage`, pointeurs de tâches, allocateurs BdLink ;
- contexte natif 20 octets, records natifs 24 octets, write ranges ;
- appel direct à `BattleTaskQueue_Dispatch` ou à un worker `0x70/71/74`.

Le scheduler canonique doit rester pointer-free et snapshotable. Représente un
callback par un type/id/payload, jamais par un pointeur de fonction ou un
contexte natif. Les codecs natifs restent dans `runtime-x86`.

## Architecture cible G14

### Core — intentions et états valeurs

Ajoute des types sémantiques cohérents, par exemple dans
`core/include/ff8iso/core/presentation.hpp` et `core/src/presentation.cpp` :

- `PresentationBarrierKind` : action, actor-ready, camera/summon, escape ;
- `PresentationIntent` : type, acteur, cible, action/event id, paramètres
  bornés ;
- `ActionCallbackKind` : GetText, ability, GF-finalize, completion/cancel ;
- `DeferredCallbackId` / `BarrierToken` avec génération ;
- états explicites `Pending`, `Waiting`, `Completed`, `Cancelled`, `Faulted` ;
- résultat de tick typé, sans frame count canonique.

Les noms exacts peuvent différer, mais les invariants ne doivent pas être
dilués. Aucun type canonique ne doit exposer `0x70`, `0x71`, `0x74` comme API
métier : ces octets sont un codec/runtime discriminator.

### Application — callbacks et scheduler minimal

Implémente dans `ff8iso_application` un scheduler à capacité bornée :

- insertion déterministe et identifiant unique par génération de combat ;
- callback exécuté exactement une fois ;
- nœud différé conservé tant que son prédicat n'est pas satisfait ;
- unlink exactement une fois après completion ;
- cancellation : callback de cancel optionnel une fois, jamais le callback de
  succès ensuite ;
- idempotence des événements `(battle_generation, event_id)` ;
- un timeout de sécurité provoque `Faulted`, jamais un faux completion ;
- aucune dépendance à un nombre fixe de frames ;
- headless : signaux immédiats ou scriptés fournis par les tests ;
- in-process : les mêmes prédicats consomment les `PresentationSignals` du
  runtime.

Intègre-le à `BattleSession` sans casser G05–G13. Le `PresentationSignals`
existant peut être conservé ou déplacé si le déplacement respecte la loi de
couches. Ajoute une API claire `request / cancel / tick / inspect`; n'ajoute
pas de logique native à `BattleSession`.

### Prédicats de barrière

Modélise au minimum :

- action : présentation de l'action terminée et latch action libérable ;
- actor-ready : acteur demandé idle/ready, sans utiliser l'idle d'un autre
  slot ;
- camera/summon (`0x70` runtime) : tous les signaux déclarés caméra,
  fichier/effet et tâche sont idle ;
- escape (`0x74` runtime) : completion de la séquence puis ordre explicite
  parent/result latch ; ne confonds jamais `BYTE1(TARGET_SLOT_ID)` action latch
  et `BYTE2(TARGET_SLOT_ID)` result latch.

Le mapping exact des bytes natifs vers ces signaux appartient au runtime. Les
tests headless vérifient les prédicats indépendamment de l'EXE.

### Runtime — un seul propriétaire natif scellé

Atteindre U14.6 signifie retirer le morcellement temporaire. Crée un adapter
unique, par exemple `SealedNativePresentationAdapter`, qui possède seul :

- `BattleUI_RenderHud` et phase HUD ;
- `Battle_RunFileLoadingCallbacks` ;
- `Battle_BdLinkPresentation` ;
- activation des relays/séquences autorisés ;
- popup et lock/unlock ;
- lecture typée des busy/idle natifs ;
- capture/restauration de toutes ses préimages.

Il peut encapsuler transitoirement l'ancien code pendant le refactor, mais G14
ne peut pas être déclaré terminé tant que les trois types
`TemporaryG06/G07/G09NcompAdapter` restent des propriétaires concurrents. Mets
à jour `validate_contracts.py` pour imposer l'exclusivité du nouvel adapter.

Le nouvel adapter accepte des intentions sémantiques et produit des POD natifs
par codec. Il n'accepte jamais `void* context` venu du domaine. Si un relay
requiert un payload natif, celui-ci doit provenir d'un buffer/global natif
authentifié et être encodé avec un layout prouvé.

### Magic, Item et Draw

- Ne réintroduis jamais `enqueue_magic` dans `TemporaryG09NcompAdapter`.
- Capture/valide d'abord le contexte vanilla Fire demandé par SQ-G14-002.
- Écris un codec runtime dédié au contexte de séquence ; ne construis pas un
  tableau de 20 octets dans `BattleSession`.
- Vérifie par xrefs si Item et Draw Cast convergent vers le même writer/layout.
  Si oui, couvre-les par fixtures statiques et un test live partagé. Si non,
  ajoute un codec typé par variante prouvée et un seul représentant live par
  layout divergent.
- Draw Stock est un résultat texte/stock, pas une fausse animation de dégâts.
- Les intents Boko/Phoenix/Moomba de G12 restent des intents vers leurs moteurs
  futurs ; G14 peut présenter/attendre une barrière, mais ne doit pas inventer
  le gameplay G17.
- L'icône de statut G10/list 117 appartient au propriétaire de présentation.
  Ne déplace aucun statut domaine dans le runtime pour la rafraîchir.

### U14.7 — détecteur de demi-propriété

Avant insertion, allocation, dispatch ou écriture de busy flag, vérifie :

- provenance du pointeur/contexte ;
- propriétaire de l'allocateur et de la liste ;
- propriétaire de chaque busy flag ;
- génération et état du nœud ;
- absence de contexte replacement dans une liste native.

Trois fixtures offline :

1. pointeur replacement offert à une liste native ;
2. allocateur et liste de propriétaires différents ;
3. writer replacement sur busy flag natif.

Le live négatif n'arme qu'une variante à la fois et doit rejeter **avant** la
mutation. Le runtime passe à `Faulted` une seule fois, sans fallback natif.

## Investigation statique obligatoire avant code natif

Avec IDA MCP, confirme et documente :

- dispatcher de tâches et codes retour `8`/`15` ;
- layout `battle_task_2_stru` : marqueurs `+1`, id `+2`, payload `+4`, acteur
  `+8`, parent/enfant et unlink `0xFF` ;
- workers candidats `0x502E90`, `0x502F30`, `0x502F90` ;
- LOCK/UNLOCK `0x4876D0` / `0x4876B0` ;
- `0x70` : `byte_1D96A88`, `sub_508580(24,64)`, pointeur caméra et
  `dword_1D97704 & 0x8000` ;
- `0x71` : slot acteur, enfant, callback payload, condition exacte idle ;
- `0x74` : étapes, `sub_508580(4122,64)`, son 21, hide acteurs, parent
  completion et result latch ;
- tous les writers/xrefs de `BATTLE_ACTION_SEQUENCE_CONTEXT` pour Attack,
  Magic, Item et Draw ;
- ordre action callback/GetText/ability/GF-finalize et règles de cancellation.

Ces noms/adresses issus du wiki sont des pistes tant qu'ils ne sont pas dans
l'address map actuel. N'ajoute un symbole/global `proven` au TOML et à
`abi-ledger.yaml` qu'après bytes, preimage, ABI et xrefs. Pousse chaque
découverte dans l'IDB.

À la fin de cette phase, produis une petite matrice `claim / preuve / confiance
/ live requis`. N'implémente pas un codec natif resté `unknown`.

## Tests offline obligatoires

Ajoute `tests/offline/test_g14.cpp` et les tests de contrat/payload nécessaires.
Le pack couvre au minimum :

- ordre de callbacks et exactly-once ;
- nœud différé conservé pendant busy puis unlink après completion ;
- cancel avant completion et absence de callback tardif ;
- barrières action, actor-ready, camera/summon, escape ;
- chaque combinaison busy/idle utile, sans dépendre du nombre de ticks ;
- payloads et child state `0x70/0x71/0x74` via codec runtime ;
- distinction action latch/result latch ;
- headless immediate et scripted ;
- idempotence/stale generation ;
- timeout -> Faulted ;
- trois fautes de demi-propriété rejetées avant mutation ;
- codecs de contexte Magic/Item/Draw selon la partition prouvée ;
- régressions Attack popup/unlock, HUD, file callbacks et BdLink ;
- aucune dépendance ABI dans `core/` ou `application/`.

Ajoute `G14.presentation-barriers` à CTest et conserve tous les 35 tests
existants. Les tests nouveaux augmentent le total ; n'ajuste pas les anciens
pour faire disparaître une régression.

## Contrat live et artefacts

Étends de façon versionnée :

- `contracts/include/ff8iso/launch_contract.h` ;
- snapshot/witness G14 ;
- `tools/make_suite_payload.py` et test wire ;
- `tools/capture_runtime_evidence.py` ;
- schéma JSON et validateur ;
- `tests/in-process/G14-observe.suite.toml` ;
- `tests/in-process/G14.suite.toml` ;
- `tests/in-process/G14-half-ownership.suite.toml`.

Scénarios recommandés :

- `observe-native-signals` : read-only, seulement pour SQ-G14-001/002 ;
- `positive-barrier-matrix` : callbacks/barrières owned, propriétaire natif
  scellé ;
- `half-ownership-fault` : terminal, une variante contrôlée.

Le witness positif enregistre par tick, sous forme bornée :

- relay/barrier kind et event/node id ;
- génération, parent/enfant, payload sémantique ;
- callback count, completion/cancel/unlink ;
- camera busy, actor idle, file/effect busy, task complete ;
- action latch et result latch séparés ;
- contexte natif hash/provenance sans exporter un pointeur replacement ;
- appels NCOMP, appels interdits, write-guard, restore flags ;
- guard Odin/Gilgamesh actif, checks et corrections ;
- hashes EXE/DLL/address map et préimages.

Ne borne pas la réussite par « 12 frames ». Un budget maximum est un watchdog ;
atteindre le budget produit un fail/timeout.

## Manifestes avant live

Ajoute `[P0.G14]` dans `ownership-matrix.toml` avec scope, activation,
présentation, host writes, exclusions, fallback et rollback exacts.

Ajoute `[promotion.G14]` dans `evidence-policy.toml` avec au minimum :

- G13 dependency reviewed ;
- callbacks/deferred scheduler offline ;
- typed barrier predicates offline ;
- sealed single native presentation owner ;
- Magic sequence discriminator resolved ;
- representative positive live envelope ;
- required terminal half-ownership negative envelope ;
- exact cleanup and process survival recorded separately.

Avant les preuves : `satisfied = false`. Ne le passe à `true` qu'après revue
des enveloppes finales. Une capture `BattleActive` sans shutdown exact n'est
pas une enveloppe promotionnelle positive.

## Vérifications avant le premier live

Depuis Reimaginated :

```powershell
python .\tools\validate_contracts.py
cmake --preset debug-x86
cmake --build --preset debug-x86
ctest --preset debug-x86 --output-on-failure

cmake --preset relwithdebinfo-x86
cmake --build --preset relwithdebinfo-x86
```

Vérifie PE32/I386, calcule SHA-256 et taille du DLL, bootstrap et payloads. Le
DLL Debug audité avant G14 (`dda0ea3f…00db6cb`) n'est pas un futur candidat
live. Le live utilise le nouveau RelWithDebInfo construit après G14.

Ne reconstruis jamais par-dessus un DLL chargé. Avant tout rebuild après une
observation, demande :

> Ferme complètement FF8 et réponds « jeu fermé ».

Attends la réponse. Ne déduis pas la fermeture d'un ancien message.

## Stratégie live minimale

Le plan par défaut utilise **trois processus au maximum**. Il peut tomber à
deux si IDA ferme SQ-G14-002 sans observation supplémentaire. Il ne doit pas
s'élargir sans une divergence nommée.

### Session O — observation native ciblée

But : fermer uniquement les discriminateurs restés `live-required`.

- processus FF8 neuf, DLL d'observation read-only ;
- bootstrap depuis Open World/menu avec guard Odin/Gilgamesh ;
- un combat idle ;
- capture vanilla du contexte Fire et de l'ATB handback ;
- capture des transitions nécessaires à `0x70`, `0x71`, puis `0x74` ;
- escape toujours en dernier puisqu'il termine le combat ;
- aucun suppress/replace du domaine G11–G13 ;
- shutdown/restauration exacte.

Essaie de grouper Fire, actor-ready et escape dans le même combat. Si le
trigger `0x71` exact nécessite une situation différente, explique la raison
technique avant de demander un deuxième combat.

Demande une action courte à la fois, par exemple :

> Combat en pause et idle ? Réponds « prêt ».

puis :

> Lance Feu avec le personnage indiqué, attends la fin visible, remets en pause
> et réponds « Feu terminé ».

N'enchaîne pas une autre demande tant que la capture précédente n'est pas
validée par le runtime.

Après Session O, si le codec doit changer, demande la fermeture du jeu, rebuild
le candidat final et recalcule tous les hashes.

### Session P — preuve positive G14

Processus neuf, candidat final, même hash pour toutes les captures positives.

Dans un combat adapté :

1. bootstrap et canaris ;
2. callback order + deferred completion/cancel injectés sans geste inutile ;
3. une action ordinaire représentative — Fire par défaut — avec animation,
   caméra/HUD/3D et ATB handback visibles ;
4. barrière actor-ready `0x71` ;
5. escape `0x74` en dernier ;
6. retour field/menu si possible, shutdown puis canari restored.

Le runtime doit prouver :

- callback/unlink exactly-once ;
- wait puis completion selon les signaux, pas selon un délai ;
- aucun contexte replacement dans une liste native ;
- propriétaire/allocateur natif unique ;
- aucune règle G11–G13 réexécutée nativement après engagement ;
- HUD, acteurs, caméra et 3D restent visibles et reviennent idle ;
- action et result latches dans l'ordre ;
- guard Odin/Gilgamesh actif ;
- `PASS`, `Detached`, rollback exact et processus vivant.

Si Item/Draw partagent statiquement le même codec Fire, ne demande pas une
matrice live répétitive. S'ils divergent réellement, ajoute seulement un
représentant par layout distinct.

### Session N — preuve négative terminale

Nouveau processus obligatoire, même DLL final que Session P. Aucun geste de
combat après l'entrée idle.

- arme une seule faute, en priorité le pointeur replacement offert à une liste
  native ;
- le detector doit trip avant insertion/dispatch/mutation ;
- exporte le witness ;
- verdict externe `FAIL_EXPECTED`, jamais renommé `PASS` ;
- tente le shutdown seulement si la politique de recovery l'autorise ;
- vérifie hook preimages et survie du processus séparément ;
- termine le processus et ne le réutilise jamais.

Les deux autres variantes restent offline sauf si la première ne couvre pas
une branche du detector ou si une divergence est explicitement observée.

## Règles de sécurité live

- Après `Faulted`, le runtime et le processus de test sont terminaux.
- Un `BUSY` autorise une seule nouvelle tentative après exactement une
  frontière de frame, pause et canari stable ; un second `BUSY` impose stop.
- Ne tue pas FF8 pour fabriquer un cleanup PASS.
- Écran noir, acteur/ATB figé, latch non libéré ou 3D absente = preuve négative,
  même si les compteurs mémoire sont verts.
- Aucun nouveau command pendant qu'un cas relay est armé.
- Le guard laboratoire doit masquer uniquement Odin `0x02` et Gilgamesh
  `0x08`, jamais Phoenix/Angelo/Witch, et restaurer les bits au shutdown.
- Ne modifie pas la mémoire gameplay de l'opérateur sauf fixture explicitement
  documentée, bornée et restaurable.
- N'attache pas IDA pendant le candidat replacement. Les breakpoints
  d'observation sont retirés et IDA détaché avant injection.

## Critères de promotion G14

Promotion seulement si :

1. contrats et loi de couches passent ;
2. build RelWithDebInfo PE32/I386 ;
3. CTest complet vert, G00–G13 inchangés ;
4. U14.1–U14.7 couverts offline ;
5. SQ-G14-001 fermé par transitions live typées ;
6. SQ-G14-002 fermé par un codec Magic prouvé et un handback ATB observé ;
7. enveloppe positive `PASS` / `Detached` / cleanup exact ;
8. enveloppe négative `FAIL_EXPECTED` rejetée avant mutation ;
9. zéro pointeur/context replacement dans les listes natives ;
10. aucune moitié de propriétaire entre anciens adaptateurs et nouvel owner ;
11. visibilité HUD/3D/caméra et retour idle confirmés ;
12. hashes EXE, DLL, preuves et rapports vérifiés.

G14 ne prétend pas :

- remplacer le backend graphique complet ;
- implémenter l'AI G15/G16, les GF G17, Angel Wing ou les rewards ;
- obtenir la parité visuelle moderne ;
- certifier live chaque Magic/Item ;
- exécuter Boko/Phoenix/Moomba hors de leurs futurs moteurs ;
- persister SG/EQUAL/Magic au-delà des contrats déjà promus.

## Documentation et wiki

Produis dans Reimaginated :

- un rapport offline G14 avec partition des claims ;
- le ou les rapports d'observation nécessaires ;
- un rapport de promotion G14 citant les SHA complets ;
- les enveloppes JSON positives, diagnostics et négative terminale ;
- README/manifests/address map/ABI ledger alignés.

Puis utilise le skill `ff8-evidence-wiki-ingest` : audit, sélection des nouvelles
sources, mise à jour du manifest, vérification, compilation QMD et smoke
queries. Préserve les sources brutes. Ne réécris pas un ancien FAIL pour le
faire disparaître ; classe-le comme diagnostic ou negative evidence.

Deux checkpoints QMD suffisent : après la fermeture statique si elle change
l'IDB/ledger, puis après la promotion finale. Ne recompile pas le wiki après
chaque petite modification.

## Stop conditions

Stoppe et demande une action précise si :

- l'EXE ou le DLL ne correspond plus au hash annoncé ;
- un champ/ABI nécessaire reste `unknown` après IDA ;
- la Session O contredit la topologie statique ;
- un owner natif et replacement écrivent le même range ;
- le detector ne peut pas rejeter avant mutation ;
- un test live nécessite un état de sauvegarde ou de combat non disponible ;
- FF8 doit être fermé avant rebuild ;
- runtime `Faulted`, cleanup partiel, écran noir ou acteur figé.

Ne pose pas de question si une fixture offline ou une preuve statique permet de
continuer sans changer le résultat.

## Rapport final attendu

Donne :

- fichiers modifiés ;
- choix d'architecture et propriétaire de chaque couche ;
- claims statiques/offline/live et confiance ;
- tests exécutés et compte final ;
- SHA EXE/DLL/enveloppes ;
- résultat positif et `FAIL_EXPECTED` négatif séparés ;
- état de `[promotion.G14]` ;
- dettes restantes explicitement bornées à G15+ ou au futur backend graphique ;
- pages wiki mises à jour et smoke queries QMD.

Ne committe et ne pousse rien sans demande explicite.
