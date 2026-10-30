# 3. Remplacement : options, invariants et arbitrages

Date : 28 octobre 2026. **Étude acceptée après revue documentaire indépendante
et validation parent ; aucun correctif sélectionné ou exécuté, aucune qualification produit.**

## Référentiel et conclusion

Chemins relatifs à `re-ff8` : `C` = `.tmp/m2-s1-integration-r2/tools/ff8-harness` ;
`M` = `.opencode/missions/team_mvnxgnse_0000_39vpc8` ; `E` = `M/evidence` ;
`R` = `M/reports` ; `Z` = `.tmp/m2-s1-integration-r2/evidence/s2-measure-176-runtime` ;
`D` = `docs/missions/re-graph-scheduler`.

Entrées : [D1](01-preuves-et-versions.md), [D2](02-parcours-et-frontieres.md),
[D4](04-contrat-public-et-observations.md), ordre documentaire:180–211.
Fait = source/reçu lu ; inférence = conséquence statique ; proposition = non
autorisante ; inconnu = preuve non établie.

**Le remplacement reste bloqué. Aucune nouvelle optimisation n’est sélectionnée.**
Les sources localisent des répétitions et responsabilités, mais ne prouvent pas
le bénéfice d’un correctif supplémentaire. L’impossibilité d’atteindre quinze
secondes sans changement architectural n’est pas davantage démontrée
(`R/180-bilan-copie-negligeable-arret-convenu.md:15–17`).

Le délai, la garantie de fin native des trois chemins threads et deux NEW
distincts sous plafond trois sont **trois problèmes indépendants**. Aucun n’est
résolu par ce dossier. Version concernée : C, source176, 308 lignes baseline +
exception codec, extras/contrôles/entrées à reprendre selon D1, pas HEAD seul.
SourceSet exécuté historique :
`ef5e7588f723b1a8f72ad91e47c02645b57a96730446f0703308e5d1ddc8aa99`.

## 1. Mesures conservées : ce qu’elles disent et ne disent pas

`Z/resources.result.json:64–110` et rapport180:7 conservent une invocation,
0 PASS/1 FAIL/7 assertions, processus 111 168 ms, test 110 956,53 ms contre
quinze secondes. Trois chemins threads et 62 autres cas non sélectionnés restent
non exécutés dans ce run. Diagnostic complet, `productTestAccepted:false`, puis
arrêt des nouvelles exécutions.

Les sept phases de `Z/diagnostic.json` sont :

- `fixture-oldFinal-and-NEW` : 3 022,1122 ms (`:6–8`).
- `stageNEW` : 2 270,2737 ms (`:92–94`).
- `swap` : 9 426,167 ms (`:178–180`).
- `oldActivate` : 111,9386 ms (`:264–266`).
- `freshCollect` : 54 079,8367 ms (`:350–352`).
- `freshActivate` : 40 665,7543 ms (`:436–438`).
- `assertions-close` : 1 379,9655 ms (`:522–524`).

Les sites instrumentés sont rapprochés au rapport180:5,13–17 : stage,
185 appels/41 713,75 ms inclusifs ; replacementExact, 2 214/29 441,07 ms ;
finalDocument, 537/10 450,76 ms ; bind, 280/10 118,34 ms ; ownCategoryCompare,
50/2 402,84 ms. La copie ciblée de preuve prend quatre appels/4,2234 ms,
environ 0,00446 % des deux phases fraîches.

**Conclusion bornée :** cette copie précise n’est pas une priorité dans ce run,
sans généralisation aux copies internes de tous les validateurs. Les inclusifs
imbriqués ne s’additionnent pas causalement. Parse, conformité, reconstruction
canonique, empreinte et autres copies ne sont pas isolés suffisamment pour
choisir un nouveau correctif. Pas d’attribution du reste à SQL/GC ni de gain
quinze secondes promis. Le tri historique170 reste inconclusif, sans seuil abaissé.

## 2. Répétitions et responsabilités réellement lues

### Consommation LIVE de l’autorité de remplacement

`C/src/graph-trusted-authority.ts:42–58`, `currentReplacementHost120`, contrôle
connexion, epoch éventuelle, HOST, allocation retenue, énumérations complètes
sources/capacités, pointeur courant, digest et révocation.
`consumeReplacementActivation124`, même fichier:74–93, relit HOST et documents
requis LIVE, rejoint preuve/capacité/source, construit une copie possédée de la
frame consommée, vérifie son histoire puis son égalité avec l’attendu s’il existe.

**Inférence vérifiée par lecture parent :** remplacer cette consommation par
« déjà validé » retirerait des contrôles d’autorité courante, pas seulement du parsing.

### Validation finale et append de tentative

`C/src/graph-generation-store.ts:442–490`, `validateFinalCase`, rapproche histoire,
candidate/staging, coupe T1, fichier courant, inventaire OWN, connaissance,
fences, budgets, sources, droits et contrôleur enfant. Il consomme ensuite le
remplacement courant et sa preuve LIVE (`:486–489`) ; sa disparition n’est pas ignorée.

`appendActivationAttempt:494–502` valide avant append, persiste, puis recontrôle
head, autorité, final et compteur. Les deux validations sont séparées par un
effet durable, contrairement à un doublon strictement adjacent. Le parent a relu
ce corps et les deux appels à `validateFinalCase`.
`graph-generation-activation.ts:164–196`, `appendAttemptV1`, ajoute les joins
historiques, identité déterministe et CAS du compteur. Retry exact ≠ nouvelle tentative.

### Activation et remplacement atomique

`graph-generation-store.ts:504–567`, `activateA`, contrôle tentative, final courant,
compteur et préimage ; un ancien final peut produire un refus durable sans activer
NEW. La validation précède les mutations CAS (`:523–542`). Après append, une
nouvelle consommation LIVE intervient (`:544–547`), puis contrôles externes,
journaux/coupes, fichier, inventaire, compteur, slots et histoire (`:548–565`).
Le postcontrôle ne compare pas l’ancien snapshot OWN au postimage légitimement
activé et ne rafraîchit pas les preuves pour faire réussir la comparaison.

`replaceCandidateA:631–686` distingue retry exact historique et remplacement
nouveau. Le nouveau contrôle préimage/autorité/staging/plafond puis effectue
OLD→ABORTED et NEW→PENDING_DRAIN dans la transaction immédiate ; barrière et
contrôles HOST/LIVE/postimage après append sont conservés.

Consommateurs retrouvés : `C/test/s2-author/replacement-fixtures.ts:96–127`,
`replacement-contender.ts:38`, `t2-fixtures.ts:185–219`. Le cas mesuré traverse
ces helpers (`replacement.test.ts:86–102`). Aucune route publique native n’en découle.
L’outcome d’activation appelé COMMITTED n’est pas la WorkUnit scientifique COMMITTED
après KnowledgeCommit/readback (`D/contract/CONTRAT.md:465–502`).

## 3. Optimisations déjà présentes : ne pas les reproposer

- **Audits immédiatement doublés déjà retirés.** `captureOperationalV1` inclut
  l’audit strict (`graph-generation-transition.ts:182–197`). Le store le conserve
  avant/après remplacement sans le répéter immédiatement
  (`graph-generation-store.ts:646,684–685`). Les audits séparés par append ne
  sont pas cette duplication déjà supprimée.
- **Mémo153 existant.** `graph-generation-replacement.ts:71–105,186–199` réutilise
  fingerprint/décodage purs dans un seul appel stage, clé chaîne SQL complète
  exacte, une entrée, métadonnées réellement relues ; purge avant bind,
  source-current, preuves et phase suivante.
- **Clés164 et décodage catégories existants.** `graph-final-inventory.ts:454–502`
  utilise le document complet exact du snapshot acquis. Les deux index sont
  renouvelés avant lecture terminale et purgés avant contrôle du journal.
  Aucun verdict HOST, SQL ou permission n’est mémorisé.

Ces corrections ne prouvent pas un gain net :
`R/153-reutiliser-decodage-stage-dans-un-seul-appel.md:5–21`,
`164-reutiliser-cles-categories-dans-une-phase.md:5–17`,
`169-delai-inchange-cibler-preuve-manquante.md:5–19`.

## 4. Options examinées et décision documentaire

### Option locale examinée, non sélectionnée

Réutiliser davantage de conformité pure sur les mêmes documents possédés, dans
une seule invocation synchrone de consommation. Des décodages répétés sont
visibles (`graph-generation-replacement.ts:128–152`), mais coût évitable et coût
du contexte supplémentaire ne sont pas isolés. Conserver toutes les lectures
et comparaisons actuelles serait obligatoire.

Ne pas étendre cette option indistinctement au validateur historique, également
consommé par `activationAttemptV1` et `appendAttemptV1`
(`graph-generation-activation.ts:148–168`). Le comptage ne justifie pas un patch.

### Alternatives rejetées

1. **Cache de verdict entre appels/phases :** confond octets historiques et
   permission actuelle ; peut masquer révocation, HOST/epoch, métadonnées ou
   mutation pendant append. Rejet de sûreté, pas simple préférence de style.
2. **Suppression prioritaire de la copie ciblée :** son poids mesuré ne justifie
   pas d’affaiblir ownership ou preuve consommée. Cela ne rend pas toutes les
   autres copies négligeables.

### Frontière architecturale éventuelle, non choisie

Normaliser une représentation persistée pour éviter la réimbrication de documents
complets dans les frames/preuves changerait stockage, identités et lecteurs
historiques. Ce n’est pas une simple factorisation privée. Nécessité, compatibilité
et bénéfice restent inconnus ; arbitrage préalable à toute réalisation.

**Décision recommandée :** conserver source176 et son verdict rouge. Les données
actuelles ne justifient ni microcorrectif supplémentaire ni refactor de stockage.
Le dossier documente la frontière à décider, sans prétendre choisir un remède prouvé.

## 5. Invariants et contrôles affectés, sans exécution

- **Fraîcheur/autorité :** HOST/current, epoch, TTL, contrôleurs et fences aux
  frontières pré/postappend ; succès passé ≠ permission actuelle.
- **Histoire/révocation :** une preuve consommée reste lisible historiquement
  sans accorder une nouvelle autorité (`graph-generation-replacement.ts:126–152`).
- **Contenu/version :** octets/ref/version/kind/digest et joins complets ; une ref
  seule ne remplace pas le contenu (`:85–105,116–152`).
- **Barrières :** coupes originales inchangées, pas de RUNNING intermédiaire
  (`graph-generation-store.ts:665–685`).
- **Plafonds/provenance :** trois origines bootstrap compris, commit +1/retry exact
  +0/rollback +0, sans remboursement/reset ; plafonds préparation/remplacement/
  activation distincts ; provenance manquante ≠ zéro.
- **Ressources :** worker-a seul passe vrai→faux ; worker-b, compte partagé,
  modèle et droits racine inchangés (ordre documentaire:337–352).

Contrôles d’impact à rattacher au futur delta :

- Conformité pure : refus précis, contenu changé sous même ref, digest/révision/
  révocation, ownership ; cinq mutations source158 réutilisables hors impact,
  5 PASS/129 assertions (`R/162-mutations-vertes-mesurer-trajet-final.md:5`).
- Catégories OWN : inventaire/head/current/révocation/Q et postappend ; sept
  refus source164, 7 PASS/35 assertions (`R/168-refus-verts-diagnostic-cles-locales.md:3`),
  pas de transfert général de qualification.
- Consommation LIVE : changement après collecte/pendant append, rollback des
  effets OWN, preuve effectivement consommée ; scénarios sources
  `C/test/s2-author/replacement.test.ts:200–233`, pas des PASS nouveaux.
- Activation/remplacement : OLD périmé, NEW lié, retry exact, CAS/postimage,
  barrières et compteurs distincts ; diagnostic final toujours FAIL.
- Stockage changé : histoire/reopen, preuves, digests et consommateurs ; impact
  architectural à établir avant toute réutilisation de preuve.

Les futurs oracles indépendants restent ceux repris par D5/L7 ; les attentes
du produit ou des tests auteur ne les remplacent pas.

## 6. Threads et deux NEW : arbitrages séparés du délai

**Threads bloqués :** SAME NEW et deux chemins de faute
(`replacement.test.ts:112–113,235–237`). Le helper distingue sortie observée/non
observée et borne l’attente (`replacement-fixtures.ts:142–220`), sans démontrer
une garantie native anti-orphelin (`R/125-sortie-thread-limite-avant-execution.md:5–19`).
Timeout, fin du test ou demande de terminaison ne suffisent pas. Aucun lancement,
nouveau runner ou confinement externe autorisé par cette étude.

**Deux NEW distincts bloqués :** bootstrap + OLD + NEW-A + NEW-B exigent quatre
origines durables sous plafond trois. SAME NEW3 n’est pas équivalent. Pas de
reset, remboursement, nouvelle racine, hausse de plafond ou scénario substitué
silencieusement. Conserver ce conflit même si la garantie threads est résolue.

## 7. Besoin éventuel d’un mandat ultérieur et limites

Si une décision de correction devient nécessaire, proposer séparément une
investigation bornée distinguant conformité exacte et autres reconstructions,
avant de choisir local ou architectural. Réutiliser le collecteur existant si
adapté ; ne pas proposer un nouveau framework. Sites, question discriminante,
overhead inconnu, interprétation et arrêt seraient à approuver **avant** toute
instrumentation/exécution. Quinze secondes restent inchangées, sans résultat garanti.
Ce besoin conditionnel n’autorise rien dans la mission documentaire.

L’auteur a lu corps, consommateurs et mesures conservées avec Serena/Context Mode,
sans réactiver le projet. Le parent a relu la consommation LIVE et l’append
pré/postvalidation. La revue indépendante globale doit attaquer ces frontières,
les alternatives, coûts et blocages ; les revues historiques ne la remplacent
que dans leur portée encore valide.

**NON EXÉCUTÉS :** `bun run typecheck`, `bun run test:q1-primitives`, `bun test`.
Aucun module produit évalué, base ouverte, mesure, instrumentation, patch, source
écrite, Git, processus cible, live/IDA ou démonstration native. M1/A09 et les
qualifications numeric/planner/S1 restent dans leur portée. Blocages non levés.
