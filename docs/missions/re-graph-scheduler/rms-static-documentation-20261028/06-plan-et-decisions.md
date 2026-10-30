# 6. Plan de réalisation et dossier de décision

Date : 28 octobre 2026. **Plan documentaire accepté après revue indépendante
et validation parent. Ce n’est pas un ordre logiciel.**

## 1. Finalité et base du plan

Préparer une réalisation utilisable du parcours faits gelés → graphe → groupes
→ plan → sessions → revue/réconciliation → connaissance durable → prochain
travail. Les fiches ci-dessous traitent seulement les manques établis par D1–D4 ;
elles n’ordonnent pas de recommencer les lots historiques.

Sources : [preuves et versions](01-preuves-et-versions.md),
[parcours](02-parcours-et-frontieres.md),
[remplacement](03-remplacement-options-et-arbitrages.md),
[contrat public](04-contrat-public-et-observations.md),
[matrice des oracles et scénario final](05-verification-et-scenario-final.md).
Les critères futurs ci-dessous consomment cette matrice sans exécuter ses scénarios.

Conventions : `H` = `tools/ff8-harness` ;
`C` = `.tmp/m2-s1-integration-r2/tools/ff8-harness` ;
`M` = `.opencode/missions/team_mvnxgnse_0000_39vpc8`.
Les noms de chantiers sont des labels documentaires, **pas des IDs natifs**.
La future mission devra présenter son contrat et créer sa file une seule fois.
Les onze tâches de l’ancienne préparation sont archivées, non réalisées et non réactivées.

### Socle de preuves non rejoué par défaut

- M1 accepté/A09 clos ; pas de port automatique des 57 familles archivées.
- 450 paires et neuf régressions avec RAW/oracles et identités conservés, sans
  nouvelle invocation scientifique ; planner 415 tests/17 077 assertions dans
  son gel, jamais additionné aux suites S1/S2.
- S1 qualifié DATA/pures hors ligne, pas intégré ou natif général ; `codecBytes`
  opaques épinglés/type/UTF-8/empreinte.
- Preuves fixture locales, refus et rollback à réutiliser seulement hors impact.
- Source176 et diagnostic rouge conservés ; aucun correctif de performance choisi.

Le code des autres maillons existe dans les versions cartographiées ; le plan
ne demande pas de le réécrire par principe. Une réutilisation exige une fermeture
de ses consommateurs et versions, pas la simple existence du fichier.

## 2. Règles communes d’un futur travail autorisé

Avant admission d’un travail : paquet borné, version/pins des entrées, propriétaire,
fichiers d’écriture et résultat attendu. Pas d’archive intégrale des auteurs ;
revues indépendantes en tâche fresh et session distincte. Les profils et modèles
seront ceux de la future politique, pas une migration automatique de celle-ci.

Un seul propriétaire d’intégration des interfaces centrales `engine.ts`,
`domain.ts`, `adapter.ts`, `client.ts`, `cli.ts`, `runtime.ts`, `validation.ts`
et `store.ts` ; pas de merges concurrents. Références historiques : ordre initial
§16 et `contract/ADR-010-file-ownership-l2-l8.md:10–24`. Le périmètre effectif de
chaque writer sera fixé pour le candidat retenu, incluant les modules `graph-*`.

Les essais temporaires exigent un worktree dédié et une autorisation propre.
Aucun code expérimental, base, actif ou golden ne doit polluer les sources
existantes. Un worktree neuf ne prouve ni l’innocuité d’un test interdit, ni un
compteur nul, ni une nouvelle permission scientifique.

## 3. Préparer la base candidate et son transfert exact

**Objectif :** rendre le prochain paquet reproductible sans perdre les sources
non intégrées et overlays. **Responsable :** superviseur/intégrateur. Ce travail
précède tout writer ou validation sur une copie et n’autorise aucun test.

**Entrées :** D1, manifeste de composition, source176, source113, receipt de
composition et contrôles conservés ; dernière version décidée explicitement.
**Actions à prévoir sous futur contrat :**

1. Préserver les originaux en place et identifier la destination possédée. Distinguer
   code identique, chemin changé, source nouvelle et artefact hors scope.
2. Reprendre les 308 lignes de composition inchangées, l’exception codec exacte,
   les 14 sources176 et les quatre fichiers protégés de source113.
3. Fermer les extras et contrôles, pas seulement ces quatorze fichiers :
   `M/evidence/check-s2-measure-176-runtime.mjs:18–62` décrit les extras, dix entrées
   contractuelles, contrôles hérités et quatre configs courantes. Ce script a été
   **lu**, pas exécuté dans la mission documentaire.
4. Préserver le codec qualifié original comme preuve distincte de l’overlay
   diagnostic. Documenter toute nouvelle exception au lieu de modifier un ancien pin.
5. Produire une correspondance ancien/nouveau chemin et un manifeste de transfert
   nouveau, référencé aux empreintes anciennes. Les chemins absolus participent
   au sourceSet : ne pas transférer silencieusement le même digest à une autre copie.

**Sortie attendue :** candidat et entrées possédés, manifeste de composition et
de transfert, écarts expliqués, liste de preuves hors impact/affectées/inconnues.
**Acceptation future :** zéro manque dans les entrées réellement requises,
comparaisons explicites, aucune qualification élargie sur une égalité partielle.
**Arrêt :** pin inexpliqué, autorisation absente, entrée indispensable non retrouvée.
Ne transférer aucune base, actif, origine ou autorité par simple copie de sources.

Les chemins précis des fixtures et configs sont des entrées à reprendre du reçu,
pas des ressources à créer maintenant. Les compteurs métier gardent leurs propres
preuves ; la préparation d’un worktree ne remet pas une lignée à zéro.

## 4. Chantier : décider le trajet de remplacement avant correction

**Manque prouvé :** dernier test hors délai, pas un coût racine identifié ni une
impossibilité architecturale démontrée. **Entrées :** D3, source176 et mesures
conservées. **Fichiers concernés :** dans C, `graph-trusted-authority.ts`,
`graph-generation-store.ts`, `graph-generation-replacement.ts`,
`graph-generation-activation.ts`, `graph-final-inventory.ts` et tests concernés.

**Actions :**

- Reprendre les optimisations déjà présentes pour ne pas reproposer mémo153,
  clés164 ou suppression d’audits immédiatement doublés.
- Déterminer si les preuves existantes permettent une décision locale. À défaut,
  soumettre une question discriminante et un mandat d’investigation minimal,
  utilisant l’existant si adapté, avant instrumentation/exécution.
- Comparer conformité pure dans une invocation et représentation persistée,
  sans supposer leur coût ou bénéfice. La seconde change stockage/identités/
  lecteurs historiques et requiert un arbitrage architectural.

**Sortie :** correction justifiée et bornée, ou décision expérimentale précise
encore bloquée ; pas une promesse de gain. **Critères :** mêmes lectures LIVE et
refus, revocations/HOST/epoch/versions, avant/après append, même ownership des
preuves consommées ; quinze secondes conservées pour toute future acceptation.
**Alternative rejetée :** cache de permission/verdict inter-appels ou suppression
prioritaire de la copie ciblée. **Dépendances :** base candidate et autorisation
des changements/exécutions. **Arrêt :** coût encore inconnu ou élargissement de
contrat non arbitré. Aucun nouveau diagnostic n’est autorisé par cette fiche.

## 5. Chantier : fermer les seuls écarts de persistance et activation affectés

**Manque :** le trajet final et les comportements affectés par la correction
future ne sont pas acceptés ; les primitives déjà qualifiées ne sont pas à refaire.
**Entrées :** base retenue, décision précédente, D1/D3 et contrat précis de delta.
**Owner :** writer stockage/génération exclusif, puis intégration parent.
**Fichiers :** C `graph-generation-store.ts`, modules de remplacement/activation/
transition/inventaire concernés et `test/s2-author/replacement.test.ts`, sous scope ratifié.

**Actions :** corriger uniquement l’impact établi ; garder préparation durable
non autorisante, CAS, compteur et résultat retiré séparés ; réutiliser refus et
rollback valides ; préserver la lecture historique sans restaurer d’autorité.
**Sortie :** delta minimal, preuve d’impact et résultats réellement autorisés.
**Critères :** OLD ABORTED/NEW PENDING_DRAIN atomiques, aucun RUNNING intermédiaire,
pré/postimages et barrières intactes, absence de double effet, de succès tardif,
de provenance fabriquée ou d’effet scientifique d’un résultat retiré.

**Contrôles affectés :** OLD final périmé/NEW lié, retry exact après réponse perdue,
changement de contenu sous même ref, révocation et mutation pendant append,
plafonds préparation/remplacement/activation distincts. Source158 et source164
ne prouvent que leurs contrôles locaux ; réutilisation selon impact explicite.
**Permissions/arrêt :** pas de threads ou cas quatre origines sous l’autorisation
actuelle ; pas de hausse de seuil ou de nouveaux scénarios substitués.

## 6. Chantier : choisir la jonction runtime v2/v3 et le contrat public

**Manque :** moteur fixture v2, préparation/admission administrative v3 et
transport public ne forment pas encore une preuve d’un chemin natif unifié.
**Entrées :** D2/D4, sources autorisées du handler RPC et paquet/version retenus,
contrats body/admission/observation/permissions ratifiés.
**Owner :** intégrateur unique des interfaces et writer ports/contrats disjoints.

**Fichiers/consommateurs :** H/C `client.ts`, `adapter.ts`, `graph-adapter.ts`,
`graph-engine.ts`, `graph-store.ts`, `engine.ts`, `cli.ts` ; C préparation/enveloppe
v3 ; `test/client.test.ts` et tests protocole existants. Le choix H/C dépend de
la base et des quatre modules différents, pas d’une préférence implicite pour HEAD.

**Actions :**

1. Décider la frontière compatible qui relie préparation, admission et exécution
   sans nouvelle autorité d’ordonnancement et sans migration d’un cycle existant.
2. Rapprocher Admission → body persisté → entrée RPC émise ; distinguer digest
   client du payload et digest upstream complet, octets émis et projection DATA.
3. Spécifier comment les observations natives satisfont les joins exacts et
   terminalProof/admissionObservation des ports existants, et qui en est l’owner.
4. Conserver erreurs d’infrastructure/refus typés/verdicts scientifiques distincts,
   ainsi que réponse perdue, ambiguïté et récupération explicite.

**Sortie :** contrat ratifié, raccord minimal, refus et critères de preuve
observable, sans déclarer natif un port fixture. **Critères :** identités/versions/
droits/Model.Ref réels, body/idempotence/CAS conservés, aucune autorité injectée par
l’auteur, absence après envoi non assimilée à une fin/repermission.

**Décisions architecturales :** jonction v2/v3, contrat public ou nouveau port natif
doivent être explicitement acceptés avant réalisation. Retirer un garde de version,
caster un type ou renommer une commande ne constitue pas leur solution.
**Permissions/arrêt :** aucune démonstration native tant que sources et garanties
indispensables manquent ou que l’autorisation applicable n’est pas obtenue.
G5–G7 restent exclus ; ne pas traiter un autre nom de canary comme une dérogation.

## 7. Chantier : publication durable et acquisition du prochain contexte

**Manque :** le chemin fixture de publication/readback ne prouve pas une
publication générale ; un receipt débloquant ne matérialise pas automatiquement
les nouveaux octets dans `cycleKnowledge` gelé.
**Entrées :** résultats exacts revus/réconciliés, attestation parent, contrats de
publication et de projection, identité et révision des connaissances, D2/D4/D5.
**Owner :** stockage/interop et intégration parent, sans autorité de publication worker.
**Fichiers :** `graph-engine.ts`, `graph-store.ts`, `graph-adapter.ts`, contrats,
consommateurs de connaissances, tests durabilité/recovery existants.

**Actions :** fermer résultat retenu → attestation → pending → readback exact →
KnowledgeCommit → receipt, puis définir la matérialisation/approbation/projection
des nouveaux artefacts dans une révision appropriée. Ne pas muter le contexte du
cycle gelé ni contourner les règles des auteurs aveugles.
**Sortie :** passage durable attribuable et reproductible jusqu’au prochain travail.
**Critères :** un seul effet publié, retry identique même provenance, sortie=entrée+1,
niveau/readback/effet requis ; ancien/non accepté/retiré ne publie rien. Le prochain
travail reçoit seulement les données autorisées et leur provenance exacte.

**Contrôles affectés :** réponse perdue avant/après écriture/readback/commit,
réouverture, résultat tardif/fencing, double commit divergent, readback mismatch,
publication manquante, artefact non approuvé pour le contexte suivant.
`test/simulator/graph-interop-durability.test.ts` et les tests graph-integration
existants sont à rapprocher, pas déclarés rejoués.
**Architecture/arrêt :** contrat de nouvelle projection/révision à arbitrer ; pas
de deuxième store/ordonnanceur ni de publication scientifique déduite de Git,
d’une notification ou d’un état Ensemble completed.

## 8. Vérification future, revue et intégration parent

Ce chantier reprend les oracles indépendants et la matrice D5, sans reproduire
un oracle depuis le produit. Avant toute commande : version candidate exacte,
oracle, risques affectés, sélection, ressources OWN neuves, bornes de processus
et conditions d’arrêt nommés dans le contrat logiciel approuvé.

Les commandes consolidées initialement requises restent :

```text
Depuis tools/ff8-harness du candidat retenu :
bun run typecheck
bun run test:q1-primitives
bun test
```

**Toutes NON EXÉCUTÉES ici.** Une commande globale pouvant atteindre les trois
chemins threads interdits reste interdite. Un filtre éventuellement autorisé
prouve sa sélection, jamais la suite complète. Une obligation complète encore
impossible laisse l’acceptation concernée partielle/bloquée.

Quinze secondes par test ; aucun plafond de processus historique transféré comme
permission actuelle ou tolérance d’un test trop lent. Aucun SKIP compté PASS,
cas supprimé ou oracle affaibli. Les contrôles ciblés découlent de l’impact ;
les 450 paires/neuf régressions et les grandes traces planner ne sont pas rejouées
par changement de worker ou de session.

Prévoir une revue indépendante L9 des risques requis sur le candidat final,
puis L10 parent : diff, preuves, commandes effectivement exécutées ou non, limites
et bilan. Pas de chaîne fixe de spécialistes ; reprises sur bloquants et impacts,
pas pour maximiser un taux de couverture. La validation consolidée d’un candidat
inchangé n’est pas répétée sans invalidation pertinente.

## 9. Registre des décisions et permissions manquantes

- **Délai :** rouge conservé ; option locale non sélectionnée, architecture non
  démontrée indispensable. Une investigation nouvelle nécessite son mandat précis.
- **Threads :** fin native sans orphelin non prouvée ; timeout/terminate insuffisant.
  Permission et garantie spécifiques indispensables avant les trois chemins.
- **Origines :** bootstrap+OLD+deux NEW exige quatre sous plafond trois. Aucun reset,
  remboursement, autre racine ou SAME NEW comme substitut ; arbitrage explicite
  requis si cette preuve reste obligatoire. Le dossier ne recommande pas de hausse.
- **Runtime/public :** source/versions/handler et sémantique des événements à
  établir, jonction v2/v3 et droits effectifs à ratifier avant raccordement natif.
- **Connaissance :** passage nouveau contenu→projection versionnée à décider,
  sans rafraîchissement silencieux des barrières ou du cycle.
- **Quarantaine :** la procédure explicite de libération reste à définir si elle
  est requise ; ne pas inventer un retour automatique vers READY ou un bypass SQL
  (`M/inputs/l7-scenarios-r2/PLAN_PHASE1.md:44`, CONTRAT:515–517).
- **Mesures/comparaisons historiques :** rapprocher les obligations encore
  applicables et leurs preuves DTO/produit, ou arbitrer le manque précisément
  (L7:12,46). Ni le diagnostic source176 ni une mesure synthétique ne qualifie
  à lui seul une performance produit ; aucune campagne supplémentaire implicite.

Les choix de nommage privé, découpage de helper compatible et corrections locales
sans effet sur les frontières pourront relever du futur auteur dans son contrat.
Les changements de stockage/identités/autorité/contrats publics ne sont pas de
simples choix locaux. Aucun arbitrage expérimental ou logiciel n’est demandé
pour achever le présent dossier documentaire.

## 10. Clôture documentaire et limites actuelles

La mission documentaire s’arrête après six livrables et index cohérents, références
essentielles recevables, revue indépendante requise et acceptation parent. Un
blocage logiciel peut être une conclusion documentaire utile ; une source ou
revue documentaire indispensable absente laisse le dossier lui-même partiel.

La revue globale et l’acceptation parent sont obtenues dans leur portée documentaire. Aucun travail logiciel,
mesure, module produit, base, scénario natif, IDA/live ou commande de test exécuté.
Ce plan n’accorde aucune permission et ne crée aucun second ordre d’implémentation.
