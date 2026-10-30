# Ordre de mission — Découverte et documentation de la clôture statique RMS

Date : 28 octobre 2026. Identifiant documentaire : `rms-static-documentation-20261028`.

**Statut : ordre documentaire livré ; mission à préparer et à autoriser dans un
nouveau contexte. Ce document ne lance aucun worker, test ou développement.**

## 1. Objectif et résultat attendu

Préparer une réalisation maîtrisée de la chaîne statique RMS :

`faits d’un exécutable → graphe → groupes → plan → sessions d’auteurs → revue/réconciliation → connaissance durable → prochain travail`.

La présente mission porte **uniquement sur la découverte statique et la
documentation**. Elle doit établir ce qui existe, ce qui est réutilisable, ce qui
manque réellement et les décisions nécessaires à une future mission logicielle.
Elle ne réalise ni ne qualifie le produit.

Livrer un dossier autonome, sourcé et suffisamment concret pour qu’un futur
auteur sache quoi lire, quoi modifier si cela est ensuite autorisé, quel résultat
produire, comment il sera vérifié et où il devra s’arrêter. Ne pas remplacer une
incertitude par une solution inventée pour donner l’apparence d’un plan complet.

Réutiliser au maximum le plugin Ensemble : RMS possède le calcul déterministe,
OpenCode les sessions, outils et permissions, Ensemble leur coordination. Aucun
second ordonnanceur, système de réveil ou récupérateur concurrent par défaut.
Privilégier un code futur propre, lisible et maintenable à l’échelle humaine,
ainsi qu’une QA solide mais sans suringénierie.

## 2. Autorités et lecture initiale

Lire les sources suivantes dans cet ordre ; elles sont des contrats et cartes
de preuves, pas des autorisations de rejouer des commandes anciennes :

1. `docs/missions/re-graph-scheduler/ORDRE_MISSION_02_REPRISE_RMS_APRES_M1_20261020.md`,
   en particulier les garanties, le §7.1 et la condition d’arrêt §8 ; puis les
   définitions nécessaires de `ORDRE_MISSION.md` dans le même répertoire.
2. `.opencode/missions/team_mvnxgnse_0000_39vpc8/REPRISE_JOURNAL.md` : privilégier
   l’état récent ; distinguer les paragraphes historiques devenus périmés.
3. Dans les rapports de cette mission M2 :
   `180-bilan-copie-negligeable-arret-convenu.md` et
   `181-historique-ensemble-messages-recuperation.md`.
4. Le rapprochement de la préparation désormais arrêtée :
   `.opencode/missions/team_mvsc5dqf_0000_cctpvf/reports/003-reutiliser-la-file-native-sans-double-import.md`,
   son reçu `../evidence/queue-reconciliation.json`, puis les rapports 004 et 005
   du même répertoire de rapports. Leurs propositions de lancement ne valent
   plus autorisation après la clôture administrative de cette préparation.
5. Les seules sources, contrats, gels, livraisons et reçus primaires nécessaires
   à chaque étude ci-dessous. La prose d’un auteur ne qualifie pas son résultat.

La finale détaillée du PM `msg_1836e8b04001qvDbpR5YgmDGTl`, dans la session
`ses_e7c960e08ffedHMLFaxorVahbm`, fournit des critères, sources et projections déjà
recherchés. Sa finale révisée `msg_183776210001SOb3kFt02vjaV4` référence la file
existante sans nouvelle création. Réutiliser ces livraisons visibles si utiles ;
ne pas transmettre l’historique intégral, les raisonnements privés ou des secrets.

## 3. État de départ à préserver

### Acquis dans leur portée exacte

- M1 est `ACCEPTED_INTEGRATED`, A09 clos. Les 57 familles BLOCKED archivées ne
  deviennent pas un backlog obligatoire de portage.
- Les 450 paires numeric/context et neuf régressions ont été exécutées et
  qualifiées : conserver identités, oracles et provenance RAW, sans nouvelle
  invocation scientifique.
- Le planificateur possède une qualification historique de 415 tests et
  17 077 assertions. Rapprocher les versions avant de réutiliser ses preuves ;
  ne pas additionner ses compteurs à d’autres suites.
- S1 qualifie des données hors ligne et fonctions pures, pas une authenticité
  native générale. Les `codecBytes` restent des octets opaques épinglés avec
  leurs contrôles de type, UTF-8 et empreinte.
- Les preuves partielles de persistance, quotas, transitions, refus et rollback
  restent dans leurs versions et conditions propres. Conserver les échecs.

### Blocages non levés

- Le dernier trajet final de remplacement prend environ 111 secondes pour une
  limite par test de quinze secondes. Le remplacement n’est pas accepté.
- La copie ciblée mesurée prend 4,2234 ms pour quatre appels : cela ne justifie
  ni son optimisation comme priorité ni une attribution du reste à GC, SQL ou
  un autre coût non mesuré.
- Trois scénarios avec threads restent interdits faute de garantie native de
  fin sans processus orphelin. Timeout ou `Worker.terminate()` ne suffit pas.
- Deux nouveaux candidats distincts exigeraient quatre origines alors que le
  plafond persistant est trois. Une concurrence sur un même candidat ne remplace
  pas cette preuve et aucun compteur ne peut être réinitialisé.
- Le raccordement réel RMS aux événements de sessions et fournisseurs OpenCode,
  le parcours public, la publication de connaissance, la reprise complète, les
  scénarios globaux et les validations finales ne sont pas clos.

Une conclusion documentaire peut expliquer précisément un blocage ; elle ne
constitue pas sa résolution expérimentale ou une dérogation.

## 4. Périmètre de découverte et permissions

### Travail autorisable après approbation de cette mission documentaire

- Lecture ciblée des contrats, sources, tests et oracles existants, sans les
  importer ou les exécuter ; navigation symbolique et analyse des consommateurs.
- Comparaison documentaire des versions, empreintes, manifestes et reçus.
  Lire les artefacts nécessaires sans ouvrir de base historique ni la modifier.
- Recherche de livraisons conservées. En cas de message manquant, le superviseur
  peut consulter les seules métadonnées et réponses finales natives utiles avant
  toute réaffectation ; pas de reprise des sessions M2 ni de démonstration native.
- Rédaction des livrables dans le périmètre possédé de cette nouvelle mission.

### Hors périmètre

Aucun code produit ou oracle exécutable nouveau ; aucun patch, instrumentation,
profilage, benchmark, essai de transport, fixture ou test produit. Ne pas lancer
`bun run typecheck`, `bun run test:q1-primitives` ou `bun test` : ces commandes
appartiennent au futur contrat logiciel et restent non exécutées ici.

Aucun jeu, processus cible, live, IDA, run01, G5–G7, exécution de code reconstruit,
C# réintroduit ou dépendance obligatoire au helper Windows archivé. Aucun
changement global, achat ou repli payant implicite. Aucun nettoyage, déplacement
ou écrasement de source, snapshot, base, actif, archive ou tentative rouge.

Les vérifications de documents et calculs d’empreintes ne sont pas des tests
du produit. Toute expérimentation temporaire ultérieure exigerait son autorisation
et un worktree dédié ; elle n’est pas accordée par cette mission de lecture.

## 5. Livrables et travaux actionnables

Répertoire de sortie proposé :
`docs/missions/re-graph-scheduler/rms-static-documentation-20261028/`.
Le superviseur possède la publication. Un lecteur sans permission d’écriture
rend son livrable dans sa réponse ; ne pas élargir ses droits pour le faire écrire.

Les six noms ci-dessous sont des **paquets documentaires, pas des identifiants
natifs de tâches**. Une préparation future devra réconcilier les archives avant
de créer sa propre file. Ne pas réimporter automatiquement les onze anciennes
tâches, ni prétendre que leurs identifiants appartiennent à une nouvelle équipe.

### D1 — Rapprocher les acquis, versions et livraisons

**Entrées :** autorités du §2, reçus qualifiés et manifestes utiles, sources
canoniques, candidat `.tmp/m2-s1-integration-r2/` et overlays. Rechercher notamment
le plan existant
`.opencode/missions/team_mvnxgnse_0000_39vpc8/inputs/l7-scenarios-r2/PLAN_PHASE1.md`
et la préparation publique référencée par le rapport M2 57.

**Actions :** distinguer source présente, livrée, revue, qualifiée et intégrée ;
relier chaque acquis à sa version, ses entrées, son oracle et ses conditions ;
retrouver les travaux achevés avant toute proposition de réaffectation.

**Sortie :** `01-preuves-et-versions.md`, matrice
obligation → source/version/entrées → preuve/oracle → état → manque → décision.
États : acquis réutilisable, changé, absent ou bloqué ; signaler séparément une
information non retrouvée et une preuve d’absence.

**Acceptation :** aucune qualification transférée sans analyse d’impact, aucun
compteur additionné ou réinitialisé, aucun travail retrouvé proposé à refaire.
Les divergences de version et leur conséquence sont explicites.

**Validation :** contrôle ciblé des références et empreintes nécessaires par le
superviseur. Pas d’architecte préalable : c’est un inventaire de faits et de limites.

### D2 — Cartographier le parcours statique complet et ses responsabilités

**Dépend de :** D1 pour l’état des preuves. **Entrées :** sources existantes de
graphe, regroupement, planification, client, moteur, stockage et publication.

**Actions :** pour chaque passage de la chaîne du §1, identifier l’entrée, la
sortie observable, le composant propriétaire, le consommateur, l’identité/version
transportée et la preuve disponible. Séparer calcul RMS, autorité OpenCode et
coordination Ensemble. Examiner les contrats réellement consommés, pas seulement
un diagramme ou le nom d’un composant.

**Sortie :** `02-parcours-et-frontieres.md`, carte de bout en bout et lacunes
localisées. Inclure le déblocage du prochain travail après publication durable.

**Acceptation :** aucun maillon omis ou déclaré intégré sur la seule existence
de son code ; chaque lacune possède un responsable et une preuve à obtenir.
Les dépendances scientifiques et les signaux d’infrastructure restent distincts.

**Validation :** références aux interfaces et consommateurs. Une frontière à
modifier devient une proposition motivée, pas une nouvelle architecture réalisée.

### D3 — Étudier la clôture du remplacement et ses arbitrages

**Dépend de :** D1 ; utilise D2 pour les frontières concernées. **Entrées :**
rapport 180, reçu conservé
`.tmp/m2-s1-integration-r2/evidence/s2-measure-176-runtime/resources.result.json`,
sources `graph-trusted-authority.ts`, `graph-generation-store.ts` et
`graph-generation-replacement.ts` du candidat isolé.

**Actions :** examiner les validations répétées autour de
`consumeReplacementActivation124`, `GraphGenerationStoreV1.validateFinalCase`
et `activateA`, leurs données et leurs frontières de fraîcheur. Distinguer coût
mesuré, répétition statique et coût inconnu. Comparer une correction minimale
possible à au moins une alternative rejetée, avec preuves et risques.

Traiter séparément : garantie de fin native des trois chemins threads ; preuve
de deux candidats distincts sous le plafond trois ; éventuel besoin d’un nouveau
diagnostic précisément borné, **proposé seulement**, si les mesures existantes
ne permettent pas de choisir honnêtement une correction.

**Sortie :** `03-remplacement-options-et-arbitrages.md`, propositions, alternative
rejetée, invariants, impacts, inconnues et décisions demandées. Ne promettre aucun
gain temporel non démontré et ne refaire aucune mesure.

**Acceptation :** les contrôles courants d’autorité, révocation, contenu exact,
version et barrières temporelles restent explicites. Aucun cache d’autorisation,
rafraîchissement artificiel de barrière ou affaiblissement de test implicite.
Les trois blocages sont conservés s’ils ne sont pas résolus par une preuve valable.

**Validation / architecture :** l’auteur de l’étude peut porter le raisonnement
architectural ; pas de spécialiste supplémentaire obligatoire. Tout changement
de stockage, contrat public ou responsabilité est présenté au parent avec son
impact avant une future implémentation.

### D4 — Préciser le contrat public et les observations OpenCode

**Dépend de :** D1 ; peut avancer indépendamment de D3 sur entrées et sorties
disjointes. **Entrées :** préparation publique existante, `tools/ff8-harness/src/`
`client.ts`, `graph-adapter.ts`, `graph-engine.ts` et les tests client existants.

**Actions :** reprendre `connectPublic`, `ExecutionClient.submit` et le RPC
`ensemble.execution.v1` comme points de code à étudier, pas comme preuve native
acquise. Documenter corps et identité de requête, idempotence, versions, droits,
réponse perdue, admission ambiguë et refus typés. Rapprocher les besoins de
`GraphEngine.observe` avec les événements et preuves terminales réellement requis.

**Sortie :** `04-contrat-public-et-observations.md`, contrat acquis versus proposé,
consommateurs, lacunes, critères de futur préflight borné et permissions nécessaires.

**Acceptation :** aucune commande administrative renommée en contrat agent ;
aucune erreur générique transformée en verdict scientifique ; disponibilité,
résultat achevé mal transmis, refus d’infrastructure et acceptation restent
distincts. Les fonctions de récupération d’Ensemble ne qualifient pas RMS.

**Validation / architecture :** références de source et de contrat, alternative
rejetée pour toute nouvelle frontière proposée. Aucun appel de démonstration,
nouveau service, canary ou test de transport pendant cette mission.

### D5 — Reprendre les oracles et construire le contrat de vérification futur

**Dépend de :** D1 ; utilise progressivement les frontières D2/D3/D4.
**Entrées :** plan indépendant L7 retrouvé, rapport M2 47, contrat commun et
preuves déjà qualifiées. Examiner les tests existants avant de proposer un ajout.

**Actions :** conserver les oracles indépendants et leurs attentes privées hors
des projections publiques d’auteurs. Cartographier transitions autorisées et
interdites, préconditions, versions périmées, CAS, réponse perdue, résultat tardif,
quotas, publication/readback uniques et reprise/replay.

Décrire un scénario final maîtrisé : entrée identifiée, effets attendus à chaque
frontière du parcours, échec et reprise, un seul effet durable et déblocage du
prochain travail. Distinguer fixture, transport contrôlé et observation native.

**Sortie :** `05-verification-et-scenario-final.md`, matrice
risque/obligation → oracle indépendant → preuve/version réutilisable → contrôle
affecté → condition d’autorisation → statut. Nommer les tests existants pertinents
et les bornes futures à ratifier, sans fabriquer un nom de test ou une commande
prétendument validée.

**Acceptation :** quinze secondes par test conservées, aucun seuil abaissé,
oracle recopié depuis le produit ou SKIP compté PASS. Les trois commandes
consolidées sont proposées au futur contrat logiciel, non exécutées ici ; une
suite filtrée ne remplace jamais la suite complète. Un contrôle impossible sous
les contraintes reste bloquant pour l’acceptation logicielle concernée.

**Validation :** rapprochement documentaire avec les contrats et preuves ; aucune
création d’oracle exécutable, de base, de driver ou d’infrastructure de tests.

### D6 — Livrer le plan d’implémentation détaillé et le dossier de décision

**Dépend de :** D1 à D5 dans leurs périmètres utiles. **Responsable :** superviseur,
avec consolidation documentaire possible ; validation et publication restent parent.

**Sortie :** `06-plan-et-decisions.md` et un index de lecture du dossier.
Pour chaque travail logiciel réellement restant, fournir une fiche :

- objectif observable et raison pour laquelle le travail est encore nécessaire ;
- entrées, historique minimal, versions et preuves à réutiliser ;
- composants et fichiers concernés, ownership et limites d’écriture ;
- actions et livrable attendus, exclusions et conditions d’arrêt ;
- dépendances et parallélisme réellement utile ;
- décision architecturale préalable, ou justification d’un simple choix local ;
- critères d’acceptation observables, négatifs essentiels, contrôles affectés ;
- isolation des essais et méthode de transfert du candidat/overlays au worktree ;
- permissions manquantes et arbitrages encore requis, sans les présenter comme
  accordés. Les identifiants natifs seront ceux d’une future file autorisée.

**Acceptation :** le dossier distingue faits vérifiés, inférences, propositions
et inconnues ; toute décision importante relie objectif, défaut/risque, correction
permise et preuve attendue. Il permet de choisir le prochain travail ou de
demander un arbitrage précis, sans lancer le logiciel ni annoncer sa clôture.

## 6. Organisation et projections de contexte

Un seul superviseur. D1 précède les études dépendantes ; D2 à D5 peuvent se
chevaucher uniquement si leurs entrées et sorties sont disjointes. Ne pas créer
un auteur supplémentaire quand les livrables existants suffisent.

Pas de nombre permanent d’agents, de classifier obligatoire ou de pipeline fixe
de spécialistes. Choisir les profils nativement disponibles et adaptés aux
droits de lecture ; ne pas lire leur définition pour contourner leurs permissions.

Modèles OpenAI exclusivement. La nouvelle mission doit présenter puis faire
approuver sa propre politique native, ses variantes, son autonomie long run et
son contrat QA. La politique non approuvée de la préparation clôturée ne se
migre pas automatiquement. Vérifier les références natives `Model.Ref` avant
utilisation ; aucun achat, nouveau fournisseur ou repli implicite.

Les auteurs reçoivent des projections bornées, pas l’archive intégrale des
conversations. Une revue indépendante exigée porte `context: { mode: "fresh" }`
sur sa tâche avant admission et utilise une session distincte. Le superviseur
fournit les éléments manquants et contrôle les livraisons ; il ne remplace pas
un auteur sur la seule absence de notification.

## 7. Vérification documentaire, proportionnée aux risques

Proposer un contrat `verification.level: reinforced` pour cette mission
documentaire : critères explicites et revue indépendante bornée des décisions
et affirmations critiques, sans chaîne fixe d’agents ni campagne logicielle.
Le contrat exact sera présenté dans `/ensemble-mission config` puis approuvé
par le `start` utilisateur de cette nouvelle mission.

Contrôles attendus :

- existence et pertinence des références nécessaires ; empreintes et versions
  uniquement lorsqu’elles conditionnent une réutilisation de preuve ;
- cohérence entre carte des acquis, parcours, options, oracles et fiches de travail ;
- absence de transformation d’une proposition en contrat ratifié, d’un reçu
  historique en nouveau PASS, ou d’une capacité native en preuve produit ;
- respect des frontières de contexte et conservation des échecs et blocages ;
- revue indépendante ciblée des affirmations critiques, puis acceptation parent
  des livrables documentaires. Réutiliser toute revue encore valide ; une reprise
  porte sur les bloquants et l’impact de leurs corrections.

Ne pas lancer une suite logicielle pour prouver qu’un document est bien écrit.
Un besoin de mesure ou de preuve expérimentale découvert devient une proposition
précise pour un mandat ultérieur, pas une extension automatique de celui-ci.

## 8. Garanties persistantes à reporter sans les modifier

Au plus trois origines durables par racine/lignée, bootstrap compris : commit +1,
retry strictement identique +0, rollback +0, aucun remboursement ni reset.
Préparation, remplacement et activation conservent leurs plafonds distincts ;
provenance manquante ne signifie jamais compteur nul.

Préparation durable non autorisante ; remplacement atomique par comparaison de
version : OLD devient ABORTED, NEW devient PENDING_DRAIN, jamais RUNNING
intermédiaire. Coupes temporelles et barrières originales non rafraîchies.
Le seul changement de ressource ratifié reste la disponibilité de worker-a de
vrai à faux, sans changer worker-b, le compte partagé, le modèle ou les droits racine.

Validation et publication appartiennent au superviseur. Notification, récupération,
lecture et acceptation sont des états distincts. Journaux, acceptations, compteurs,
sources, bases, actifs et échecs M2 restent préservés.

## 9. Condition de clôture de la mission documentaire

Clore cette future mission lorsque les six livrables utiles et leur index sont
sourcés, cohérents, relus dans le périmètre convenu et acceptés par le parent ;
chaque question indispensable possède soit une réponse étayée, soit un blocage
circonscrit avec la décision ou la preuve qui manque.

Les incertitudes logicielles peuvent rester ouvertes dans ce bilan si elles
sont honnêtement documentées. Elles ne disparaissent pas du futur contrat.
Un dossier incomplet, sans source essentielle ou sans revue obligatoire reste
documentairement partiel ; ne pas chercher une acceptation par changement de mots.

Le bilan indique ce qui a été lu, réutilisé, vérifié et non exécuté, les limites,
les prochaines décisions et le statut logiciel encore partiel ou bloqué. Préserver
provenance, corrections et échecs dans les archives, sans secrets ni raisonnements
privés. QMD reste un outil de recherche, pas une autorité supérieure aux reçus.

**Arrêter après acceptation du dossier. Aucun basculement automatique vers
l’implémentation.** Une mission logicielle ultérieure exigera son propre périmètre,
les arbitrages applicables et une approbation explicite de sa politique et de ses
exécutions. Ce document ne fournit pas ce second ordre de mission.
