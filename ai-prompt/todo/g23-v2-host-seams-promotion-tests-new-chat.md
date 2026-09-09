# G23 v2 — seams hôte et campagne de promotion (nouveau chat)

Tu es un **nouvel agent**. Ce fichier est ton brief autoritatif pour
continuer G23 après le smoke `g23-battle-end-v1`.

Ton objectif n’est pas de rejouer v1 ni de déclarer G23 terminé. Tu dois :

1. préserver et revalider tout ce que v1 a déjà fermé ;
2. implémenter les seams hôte manquants (latch, persist, handoff) ;
3. fermer tous les tests offline et fautes injectées ;
4. préparer la campagne live promotionnelle ;
5. t’arrêter au premier geste opérateur réellement nécessaire ;
6. conduire ensuite une seule action utilisateur à la fois, en français.

Ne committe, ne pousse et ne réinitialise aucun worktree sans demande
explicite.

## État de départ vérifié le 2026-09-09

### Verrou d’entrée

- G22 est `live-promoted` sur v19 / protocole v5.
- `[promotion.G22].satisfied = true`.
- Les cinq enveloppes G22 canoniques ont `refused_mask=0`.
- G23 est donc autorisé.

### Ce que G23 v1 a réellement prouvé

Le worktree d’implémentation contient un protocole v1 non commité basé sur
`main@6021931`. Préserve ces changements ; **n’utilise jamais
`git reset --hard` ou `git checkout --` pour les effacer**.

Le smoke live v1 a été fermé le 2026-09-03 :

- PID `49024` ;
- EXE SHA-256
  `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570` ;
- DLL SHA-256
  `ed35cb368f66478aed9cbfaae7f5f2b1e95a60fabb80abf7412a3d4616a4503f` ;
- L23-A `scripted-end` : collector `PASS`, scénario 1, result 1,
  end type 3, first-wins, zéro write et zéro helper natif ;
- L23-B `refuse-result5` : collector `PASS`, erreur 2, persist 0,
  zéro write ;
- L23-C : `PASS`, `Detached`, préimage frame restaurée, processus vivant.

Ce smoke n’a observé qu’un `BattleState` synthétique. L’allowlist hôte v1
est vide. Il ne prouve ni terminal réel, ni persist, ni callback de handoff.

Statut formel à conserver :

```text
[P3.G23].status = offline-protocol
[promotion.G23].satisfied = false
P3 non claimé
```

### Blocages promotionnels actuels

- `five-terminal-families-live`
- `phoenix-intercept-live`
- `persist-deltas-live`
- `typed-handoff-live`
- `repeat-install-live`
- `exact-cleanup-and-process-survival` sur les nouveaux seams hôte

Les inconnues suivantes restent fail-closed :

- `SQ-G23-001` : writers scripted-end autres que l’opcode `0x39` ;
- `SQ-G23-002` : résultat 5 comme outcome supporté ;
- `SQ-G23-003` : application menu XP/GF `0x496CB0` / `0x496F30` ;
- `SQ-G23-005` : installation du callback de handoff typé.

## Dépôts et autorités

Documentation :

```text
C:\Users\djden\source\repos\retro-eng\re-ff8
```

Implémentation :

```text
C:\Users\djden\source\repos\retro-eng\FinalFantasy_VIII_Reimaginated
```

Avant de travailler, vérifie la racine Git effective. S’il existe une autre
copie de `FinalFantasy_VIII_Reimaginated`, ne fusionne pas leurs états et ne
copie pas leurs preuves. Les sources, le candidat DLL et les tests doivent
provenir d’un seul worktree identifié.

Autorités :

1. IDB authentifiée `D:\Modding\ff8\retro-exe\FF8_EN.exe.i64` ;
2. fixtures/save/kernel authentifiés ;
3. enveloppes live liées aux hashes EXE et DLL ;
4. tests et code du worktree d’implémentation ;
5. documentation compilée.

Lis au minimum :

```text
.agents/skills/implementing-iso-layer-boundary/SKILL.md
.agents/skills/ff8-live-necessity-filter/SKILL.md
obsidian-docs/projects/re-ff8/skills/ff8-live-validation-operations.md
obsidian-docs/projects/final-fantasy-viii-reimaginated/references/p1-g23-battle-end-validation.md
ai-prompt/todo/g23-battle-end-cleanup-handoff-new-chat.md
```

Dans l’implémentation :

```text
manifests/evidence-policy.toml
manifests/ownership-matrix.toml
tests/offline/test_g23.cpp
tests/offline/test_g23_payload.py
tests/in-process/G23.suite.toml
core/include/ff8iso/core/battle_end.hpp
core/include/ff8iso/core/battle_persist.hpp
core/include/ff8iso/core/battle_handoff.hpp
core/include/ff8iso/core/battle_repeat.hpp
application/include/ff8iso/application/battle_session.hpp
runtime-x86/include/ff8iso/runtime/g23_battle_end.hpp
runtime-x86/include/ff8iso/runtime/temporary_g23_ncomp_adapter.hpp
```

## Lois non négociables

### Frontières

```text
core -> application -> runtime
abi ---------------> runtime
```

- `core/` : règles terminales, plans et deltas sémantiques seulement.
- `application/` : orchestration `BattleSession`, transaction et handoff typé.
- `abi/` : POD et carte d’adresses seulement.
- `runtime-x86/` : codecs, writes/readbacks, hooks et services hôte.
- Aucun `ff8iso/abi`, RVA, `find_symbol`, POD natif ou `import_legacy`
  dans `core/` ou `application/`.
- Aucun calcul XP/AP/drop ou prédicat terminal dans runtime.
- `TemporaryG23NcompAdapter` ne contient que les endpoints hôte de sortie,
  SFX et installation de callback prouvés.

### Interdictions

Le replacement ne doit jamais appeler :

- les cinq `BattleTick_Check*` natifs ;
- `Battle_PhoenixAutoReviveCheck` ;
- `Battle_EndSetTransitionTimer` ;
- `Battle_EndCleanupAndTransition` ;
- `BattleEnd_DistributeXpAp` ;
- les writers natifs HP/magic/GF/item/Card/Devour/Mug ;
- un helper G22 d’initialisation ;
- un helper natif pour fabriquer l’oracle attendu.

Le résultat 5 reste refusé. G24 (UI/HUD/input/caméra/rendu) reste hors scope.

## Checklist de fermeture

```text
G23 v2 / promotion:
- [ ] 1. Auditer et préserver le worktree v1
- [ ] 2. Revalider la baseline v1 et G00–G22
- [ ] 3. Geler le contrat v2 et le ledger de nécessité live
- [ ] 4. Fermer la matrice core des cinq familles
- [ ] 5. Fermer l’ordre same-frame et first-wins
- [ ] 6. Fermer le seam de latch hôte
- [ ] 7. Fermer la transaction persist hôte
- [ ] 8. Fermer le handoff typé et le callback Director case 5
- [ ] 9. Fermer fautes, rollback et répétitions offline
- [ ] 10. Fermer protocole, collecteur et compatibilité v1
- [ ] 11. Passer contrats, build x86 et régressions cumulatives
- [ ] 12. Préparer les cinq cartes live par famille
- [ ] 13. Exécuter la campagne live, une action opérateur à la fois
- [ ] 14. Revoir toutes les preuves avant toute promotion
```

## T23-00 — audit et baseline

Avant toute modification :

1. enregistrer HEAD, `git status --short` et la liste des fichiers v1 sales ;
2. confirmer que la policy G22 est toujours satisfaite ;
3. confirmer que G23 est toujours `offline-protocol` / `satisfied=false` ;
4. valider les trois enveloppes v1 canoniques sans les réécrire ;
5. exécuter la baseline complète et consigner le total réel.

Commandes minimales :

```powershell
python .\tools\validate_contracts.py
cmake --preset debug-x86
cmake --build --preset debug-x86 --parallel --target battle_iso_tests
.\build\debug-x86\bin\Debug\battle_iso_tests.exe G22
.\build\debug-x86\bin\Debug\battle_iso_tests.exe G23
ctest --preset debug-x86 --output-on-failure
```

Vérifie également :

- DLL PE32/I386 ;
- tests payload G23 ;
- tests décodeur/collecteur ;
- validation des enveloppes v1 ;
- décodage historique G22 schémas 26/27 et G23 v1 schéma 28.

Stop si la baseline est rouge. Ne répare pas une régression ancienne sans
l’isoler et la faire confirmer.

## T23-10 — matrice core des cinq familles

Ces tests restent obligatoires même s’ils étaient verts sous v1. Ils protègent
le domaine contre les changements imposés par les seams hôte.

### Scripted end

Tester :

- requête absente ;
- requête présente via la source supportée ;
- action active ;
- résultat déjà latché ;
- collision avec wipe, timer, victoire et escape ;
- opcode/source inconnue -> refus typé ;
- mapping attendu : result `1`, end type `3`, countdown `60`.

### Wipe et Phoenix

Tester :

- aucun membre party valide ;
- au moins un survivant ;
- tous les membres éligibles morts ;
- bit Phoenix absent ;
- scène 317 : interception interdite ;
- rolls bornes `63`, `64`, `254` selon l’oracle canonique ;
- Phoenix réussi : revive intent, résultat toujours `0`, aucun persist de fin ;
- Phoenix échoué : result `1`, end type `3`, countdown `60` ;
- résultat déjà latché -> aucune seconde mutation.

### Timer

Tester :

- flag encounter timer absent ;
- timer `1` puis `0` ;
- scène 317 ;
- action active ;
- collision avec une famille plus prioritaire ;
- mapping attendu : result `3`, end type `3`, countdown `60`.

Le decrement reste propriété G10 ; G23 ne le duplique pas.

### Victoire

Tester :

- ennemi vivant ;
- combinaisons mort/pétrifié/éjecté ;
- slots ennemis inexistants ;
- liste ennemie vide -> ne pas inventer une victoire ;
- variante normale et `NO_EXP_SCREEN` ;
- caps XP/AP et ordre multi-ennemis ;
- mapping result `4`, end type `0` ou `1`, countdown `60` ou `30` ;
- construction déterministe du `RewardPlan`.

### Escape

Tester :

- escape non réussi ;
- escape réussi fourni par G06 ;
- blocage encounter ;
- résultat déjà latché ;
- aucun repoll input dans G23 ;
- mapping result `2`, end type `2`, countdown `40` ;
- compteur escape et handoff attendus.

### Priorité globale

Construire des collisions déterministes et prouver l’ordre :

```text
scripted -> wipe/Phoenix -> timer -> victoire -> escape
```

Le premier résultat vrai gagne et ne peut plus être écrasé.

Le résultat 5 doit produire `UnsupportedImmediateExit5` (ou l’erreur typée
existante), zéro write, zéro persist et zéro handoff.

## T23-20 — ordre same-frame

Pour chaque famille terminale, vérifier une trace ordonnée :

1. latch du résultat ;
2. exactement un dernier transfert pending ;
3. reset G07 des groupes `1`, `2`, `0` ;
4. aucun tick status/special après résultat non nul ;
5. callbacks puis file/BdLink selon le contrat G14 ;
6. countdown ;
7. cleanup seulement au tick suivant.

Assertions négatives :

- aucun second check terminal n’écrase le premier ;
- aucun double transfert pending ;
- aucun blanket-zero de pending/exec/latches ;
- aucun tick périodique post-latch ;
- aucun cleanup dans la fenêtre du latch ;
- aucun compteur « réussi » simplement estampillé par la suite.

Le témoin doit compter des effets observés au seam, pas des drapeaux
auto-déclarés.

## T23-30 — seam de latch hôte

Le runtime doit appliquer uniquement les champs hôte prouvés par le résultat
sémantique. Avant de coder un offset absent de l’address map, stoppe et ouvre
une SQ ; ne l’invente pas.

Tests d’intégration :

- result/end/countdown/phase écrits avec préimage complète ;
- chaque write est dans l’allowlist, compté puis relu immédiatement ;
- valeurs hôte après readback égales au plan core ;
- already-latched -> zéro write ;
- result 5 -> zéro write ;
- erreur avant le premier write -> préimage intacte ;
- erreur après chaque position possible -> rollback complet ;
- readback volontairement faux -> `Faulted` et rollback ;
- octet adjacent tenté -> violation détectée et session invalidée ;
- zéro helper terminal natif et zéro `import_legacy` source.

Le test doit distinguer :

- mutation sémantique du combat ;
- écriture mécanique hôte ;
- restauration de sécurité du harness.

## T23-40 — transaction persist

La transaction doit produire une liste de deltas
`offset/adresse/avant/après`, pas seulement un hash global.

### Surfaces à couvrir offline

- HP party et statut persistant corrigé ;
- stocks magie et known-magic ;
- flush des deux octets transients `+0xB8/+0xB9`, sans leur inventer un nom ;
- merge EQUAL vers l’inventaire puis remise à zéro des transients ;
- état GF et AP ;
- compteurs victory/escape/non-reward ;
- XP/AP/drop/item/card ;
- exceptions Card/Devour/Mug issues des intents supportés ;
- caps, overflow, ressource absente et delta vide.

### Chemins outcome

- victoire normale : reward et persist attendus ;
- victoire no-exp : aucun XP/GF non autorisé ;
- escape : deltas et compteur exacts ;
- scripted/wipe/timer : chemin non-reward exact ;
- Phoenix intercepté : aucun commit de fin tant que le combat continue.

### Atomicité et fautes

Injecter :

- faute avant préparation ;
- faute avant commit ;
- faute après chaque write N ;
- readback mismatch ;
- writer indisponible ;
- overflow/cap invalide ;
- delta non allowlisté ;
- rollback lui-même incomplet.

Attendus :

- aucun commit partiel ;
- rollback byte-for-byte ;
- audit de chaque write ;
- zéro writer persist natif ;
- état logique `Faulted` après une faute post-engagement ;
- processus fauté non réutilisé pour une preuve positive.

`SQ-G23-003` reste fail-closed tant que les chemins menu XP/GF ne sont pas
prouvés. Ne l’éteins pas pour faire passer un test.

## T23-50 — handoff typé

Tester la destination sémantique :

- victoire reward -> mode reward, puis terrain ;
- escape -> chemin reward/transition prouvé, puis terrain ;
- scripted/wipe/timer -> chemin non-reward exact ;
- erreur -> destination sûre et rollback ;
- destination ou module inconnus -> refus typé.

Le mapping callback/module vit dans runtime, pas dans core/application.

Tests runtime obligatoires :

- trace Director case 5 et callback effectivement installé ;
- callback reward versus field/non-reward ;
- arrêt SFX et reset animation attendus ;
- aucune adresse callback dans `ModuleHandoff` sémantique ;
- aucun pointeur replacement injecté dans une liste native ;
- détecteur de half-ownership ;
- échec d’installation callback ;
- callback actif au shutdown ;
- désinstallation et préimage exactes.

`TemporaryG23NcompAdapter` peut appeler uniquement les services hôte
explicitement prouvés et allowlistés. Il ne calcule aucun outcome ou delta.

## T23-60 — répétitions et générations

Offline, pour chacune des cinq familles :

1. initialiser via G22 ;
2. terminer le combat ;
3. persister et handoff ;
4. initialiser une nouvelle génération ;
5. terminer à nouveau par la même famille.

Prouver :

- `source_generation` change ;
- aucun latch, queue, reward, delta, callback ou pointeur obsolète ;
- le second G22 init n’est pas remplacé par une remise à zéro G23 inventée ;
- le résultat et le handoff sont corrects deux fois ;
- une faute du premier combat ne peut pas contaminer un candidat positif.

`inspect_repeat_install` v1 est une preuve offline utile, pas la preuve
promotionnelle de deux combats hôte.

## T23-70 — protocole, témoin et collecteur

Le protocole suivant doit être versionné. Ne réinterprète aucun champ v1.

Si le témoin doit changer :

- conserver le décodage G22 `[4344:4600]` schémas 26/27 ;
- conserver le décodage G23 v1 `[4600:4856]` schéma 28 ;
- ajouter de façon append-only ou introduire un nouveau bloc/version ;
- mettre à jour `static_assert` C et C++ ;
- attribuer toute nouvelle taille/schema/evidence kind sans collision.

Le témoin promotionnel doit porter au minimum :

- protocole/scénario/error/runtime state/génération ;
- famille/result/end/countdown/first-wins ;
- ordre same-frame réellement observé ;
- Phoenix attempted/eligible/roll/intercepted ;
- plan reward et deltas persistants attendus/réels ;
- destination et callback de handoff ;
- appels natifs/interdits ;
- allowlist, writes, readbacks et fautes ;
- préimages et restore ;
- seconde génération et compteurs stale.

Négatifs collecteur :

- schéma/version inconnus ;
- témoin tronqué ;
- scénario incompatible avec le payload ;
- write-count sans delta ;
- write sans readback ;
- preimage mask incomplet ;
- `PASS` avec `Faulted` ;
- `PASS` avec appel interdit ;
- `PASS` avec negative runtime evidence ;
- `Detached` absent au shutdown ;
- mélange EXE/DLL/PID/candidat ;
- résultat estampillé sans observation same-frame.

## T23-80 — régressions cumulatives

Après chaque tranche substantielle :

```powershell
python .\tools\validate_contracts.py
cmake --build --preset debug-x86 --parallel --target battle_iso_tests
.\build\debug-x86\bin\Debug\battle_iso_tests.exe G22
.\build\debug-x86\bin\Debug\battle_iso_tests.exe G23
ctest --preset debug-x86 --output-on-failure
```

Avant live :

- build `relwithdebinfo-x86` ;
- CTest complet Debug et RelWithDebInfo si disponible ;
- validation PE32/I386 ;
- SHA-256 DLL calculé après le dernier link ;
- aucune DLL chargée au moment du link ;
- payloads et schémas validés contre ce hash exact.

Toute régression G00–G22 bloque la campagne.

## Ledger de nécessité live v2

Écris un nouveau ledger avant toute injection. Le ledger v1 ne s’applique
pas automatiquement aux nouveaux seams.

### LIVE-REQUIRED

Toujours live :

- processus frais, aucun debugger ;
- hashes EXE/DLL, aucune fusion entre candidats ;
- contrats, build x86 et PE32 ;
- zéro helper domaine / zéro `import_legacy` source ;
- allowlist, préimages, readbacks et octets adjacents ;
- observation same-frame directe ;
- cinq familles terminales sur le replacement hôte ;
- Phoenix authentique sur le replacement ;
- deltas persistants byte-exacts ;
- callback/handoff typé réellement installé ;
- répétition de chaque famille ;
- restore exact, `Detached`, processus vivant ;
- collecteur fail-closed.

### SET-ASIDE-VERIFIED

Peuvent rester set-aside si le même source/oracle n’a pas changé :

- dépendance G22 promue ;
- formules core pures déjà fermées ;
- mappings déterministes result/end/countdown ;
- négatifs de schéma ne touchant pas le nouveau témoin.

Toute preuve v1 qui touchait latch hôte, persist, handoff, hook ou codec doit
être **reclassée** : le couplage hôte a changé.

### SET-ASIDE-CERTAIN-UNKNOWN

Maintenir, avec SQ et refuse explicites :

- résultat 5 ;
- writers scripted-end non prouvés ;
- menu XP/GF non prouvé ;
- tout offset/callback non authentifié ;
- toute dette G22 de catégorie 3.

Le fail-closed correspondant reste LIVE-REQUIRED et doit prouver zéro write.

## Campagne live promotionnelle minimale

La campagne commence seulement lorsque T23-00 à T23-80 sont verts et que
l’opérateur a accepté le nouveau ledger.

Utiliser **un processus frais par famille**, puis deux combats consécutifs
dans ce même processus. Le candidat DLL reste identique pour toute la
campagne. Cela donne cinq paires, donc dix combats terminés.

### Carte S — scripted end

Deux combats consécutifs :

- déclencher uniquement la source scripted supportée ;
- result `1`, end `3`, countdown `60` ;
- first-wins et trace same-frame ;
- non-reward, persist autorisé exact, handoff exact ;
- génération 2 sans résidu.

### Carte W — wipe et Phoenix

Deux combats consécutifs terminés par wipe :

- dans le premier combat, provoquer d’abord une interception Phoenix
  authentique sur une scène autorisée ;
- vérifier revive, résultat toujours `0`, aucun commit de fin ;
- épuiser/désarmer ensuite la condition Phoenix selon le plan préparé ;
- terminer le combat par wipe réel ;
- second combat : nouveau wipe réel ;
- result `1`, end `3`, countdown `60`, non-reward ;
- aucune fuite Phoenix/latch entre générations.

L’exclusion scène 317 reste offline sauf si la policy finale l’exige
explicitement live ; ne rajoute pas un combat « pour voir ».

### Carte T — timer

Deux combats consécutifs :

- expiration authentique du timer préparé ;
- result `3`, end `3`, countdown `60` ;
- aucun decrement G10 dupliqué ;
- non-reward et handoff exact ;
- génération 2 propre.

### Carte V — victoire

Deux combats consécutifs :

- victoire normale replacement ;
- result `4`, end `0` ou `1` selon le cas préparé ;
- countdown `60` ou `30` ;
- RewardPlan et deltas field-by-field ;
- callback reward puis sortie terrain ;
- seconde victoire sans reward/delta/callback stale.

La variante no-exp reste offline si la carte normale suffit au contrat live.

### Carte E — escape

Deux combats consécutifs :

- consommer un succès escape G06 authentique ;
- result `2`, end `2`, countdown `40` ;
- compteur/deltas exacts ;
- callback et retour terrain exacts ;
- seconde génération sans latch ou delta stale.

### Captures obligatoires pour chaque combat

1. canari terrain et préimages avant injection ;
2. état après bootstrap ;
3. état immédiatement après latch/same-frame ;
4. liste des deltas persistants avant/après commit ;
5. callback/module après handoff ;
6. canari terrain/reward après sortie ;
7. génération suivante pour le second combat ;
8. shutdown final avec toutes les préimages ;
9. `Detached` et processus vivant.

Un delta gameplay correct et la restauration du harness sont deux preuves
différentes. Enregistre les deux.

## Règle opérateur

Une seule consigne par message, par exemple :

- « Ferme FF8 ; je finalise et hash la DLL. »
- « Lance FF8 avec le save indiqué et reste sur le terrain. »
- « Entre dans la rencontre indiquée puis réponds “en combat”. »
- « N’appuie plus sur rien pendant la capture. »
- « La capture est finie ; attends le verdict avant la suite. »

N’injecte jamais avant le canari. Ne reconstruis jamais une DLL chargée.
Après `Faulted`, ferme le processus : aucun retry positif dans ce PID.

## Stop immédiat

Arrête la campagne et rapporte si :

- HEAD/worktree ne correspond plus au candidat préparé ;
- le hash DLL change ;
- un debugger est attaché ;
- un helper natif interdit est appelé ;
- une écriture sort de l’allowlist ;
- un readback, une préimage ou un rollback manque ;
- le callback Director case 5 est deviné ;
- un résultat est estampillé sans observation ;
- un delta persistant est seulement hashé et non détaillé ;
- un second check écrase le premier ;
- un tick périodique survit au latch ;
- un état de génération précédent apparaît ;
- le shutdown n’atteint pas `Detached` ;
- le processus meurt ;
- une régression G22 ou antérieure apparaît.

Ne promeus pas « avec dette » une famille manquante, Phoenix non authentique,
un persist incomplet, un handoff inféré ou une répétition absente.

## Preuves et rapport final

Produire sans réécrire les preuves v1 :

```text
evidence/g23-battle-end-offline-validation-YYYY-MM-DD.md
evidence/g23-live-necessity-waiver-v2-YYYY-MM-DD.md
evidence/g23-battle-end-live-promotion-YYYY-MM-DD.md
evidence/battle-iso/g23-v2/<captures>.json
```

Le rapport final distingue explicitement :

- prouvé offline ;
- prouvé live sur le replacement ;
- observé seulement sur le natif ;
- set-aside vérifié ;
- inconnu/refusé.

Il contient :

1. HEAD, worktree, hashes EXE/DLL et PID par carte ;
2. matrice T23-00 à T23-80 ;
3. cinq familles et deux générations chacune ;
4. Phoenix positif ;
5. traces same-frame ;
6. deltas persistants field-by-field ;
7. callbacks/handoffs ;
8. audits d’appels et writes ;
9. fautes/rollback ;
10. tests cumulés et total CTest ;
11. ledger de nécessité ;
12. enveloppes canoniques proposées ;
13. SQ restantes ;
14. verdict promotionnel.

Ne mets `[promotion.G23].satisfied = true` et ne claim P3 qu’après une revue
finale séparée ayant confirmé **toutes** les lignes requises. Un collector
`PASS` isolé ne suffit jamais.
