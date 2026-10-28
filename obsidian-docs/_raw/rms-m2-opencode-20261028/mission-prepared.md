# Nouvelle mission — Terminer le pipeline statique RMS à partir des acquis M2

Date : 28 octobre 2026.
Identifiant documentaire : `rms-static-closure-20261028`.
Statut : **mission préparée, non lancée ; politique native à présenter puis à approuver**.

## 1. Résultat attendu

Livrer une chaîne statique utilisable dans OpenCode V2 :

`faits d'un exécutable → graphe → groupes → plan → sessions d'auteurs → revue/réconciliation → connaissance durable → prochain travail`.

Partir du travail réellement accompli, et non relancer l'ancien plan depuis son début. Le calcul déterministe appartient au moteur RMS ; OpenCode possède les sessions, outils et permissions ; Ensemble coordonne. Ne pas ajouter un second ordonnanceur d'agents ni une dépendance obligatoire au jeu ou au helper Windows archivé.

La nouvelle mission est distincte de l'équipe M2 existante. Elle ne réécrit ni son journal, ni ses acceptations, ni ses compteurs persistants. Elle ne doit pas être importée dans l'équipe existante comme une seconde préparation après démarrage. Un nouveau contexte de supervision et une nouvelle présentation de politique sont nécessaires pour son lancement.

Le présent document est le préplan à fournir à la préparation de cette nouvelle mission. Il ne constitue ni un `start`, ni une autorisation de relancer les tests arrêtés.

## 2. Sources d'autorité et état de départ

Lire dans cet ordre :

1. `docs/missions/re-graph-scheduler/ORDRE_MISSION_02_REPRISE_RMS_APRES_M1_20261020.md`, en particulier les garanties, le §7.1 et la condition d'arrêt du §8 ; puis les définitions nécessaires de l'ordre initial `ORDRE_MISSION.md`.
2. `.opencode/missions/team_mvnxgnse_0000_39vpc8/REPRISE_JOURNAL.md`, comme carte des décisions et liens de preuve, pas comme autorisation de rejouer chaque ancienne commande.
3. Les rapports `180-bilan-copie-negligeable-arret-convenu.md` et `181-historique-ensemble-messages-recuperation.md` de cette mission.
4. Les seuls contrats, gels et reçus nécessaires au prochain paquet de travail. La prose d'un auteur n'est pas une preuve de qualification.

### Acquis à reprendre, sans les refaire par défaut

- M1 est `ACCEPTED_INTEGRATED`. L'arbitrage A09 est clos. Les 57 familles BLOCKED archivées ne sont pas un backlog de portage obligatoire.
- Les 450 paires numeric/context et les neuf régressions ont été réellement exécutées et qualifiées. Préserver leurs identités, oracles et provenance RAW ; aucune nouvelle invocation scientifique n'est accordée par ce document.
- La qualification historique du planificateur porte sur 415 tests et 17 077 assertions. Sa réutilisation exige de rapprocher les versions, pas d'additionner ses compteurs à ceux d'autres suites.
- Le contrat et la qualification S1 acquis portent sur les données hors ligne et les fonctions pures, pas sur une authenticité native générale. Les `codecBytes` restent des octets opaques épinglés avec leurs contrôles de type, UTF-8 et empreinte.
- Les preuves partielles de persistance, quotas, transitions et refus conservent leur périmètre exact. Les échecs historiques restent conservés.

### Manques établis

- Le trajet final de remplacement est trop lent : dernière exécution environ 111 secondes pour une limite de quinze secondes. Le remplacement n'est pas accepté.
- La copie ciblée mesurée ne représente que 4,2234 ms pour quatre appels dans cette exécution. Ce résultat ne justifie ni une optimisation de copie ni une attribution du coût restant au ramasse-miettes, à SQL ou à un autre composant non mesuré.
- Trois scénarios qui lancent des threads restent sous interdiction explicite, faute de garantie native de fin sans processus orphelin. Une attente bornée ou `Worker.terminate()` ne lève pas cette interdiction.
- Deux nouveaux candidats distincts exigeraient quatre origines alors que la limite persistante est trois. Une concurrence sur le même candidat n'est pas une preuve équivalente. Cette incompatibilité reste une décision ouverte, pas une dérogation implicite.
- Le raccordement réel des règles RMS aux événements de sessions et de fournisseurs OpenCode n'est pas démontré ; les scénarios de remplacement actuels simulent une indisponibilité.
- Le parcours public, la publication scientifique de connaissance, la reprise/relecture déterministe complète, la couverture globale de la machine d'état, les revues finales indépendantes et l'intégration canonique ne sont pas clos.

## 3. Garanties à conserver

- Aucun C# réintroduit ; aucune dépendance au helper Windows pour le fonctionnement statique ordinaire.
- Aucun jeu, processus cible, live, IDA, reprise run01, G5–G7 ou exécution du code reconstruit.
- Aucun seuil abaissé, cas supprimé, oracle recopié depuis l'implémentation ou SKIP compté comme PASS.
- Sources, snapshots, bases, actifs et tentatives rouges existants restent à leur place. Aucun nettoyage ou écrasement d'archive.
- Au plus trois origines durables par racine/lignée, bootstrap compris ; commit +1, nouvelle tentative strictement identique +0, rollback +0, sans remboursement ni remise à zéro.
- Les plafonds persistants de préparation, de remplacement et d'activation restent distincts. Une provenance manquante n'implique jamais un compteur nul.
- Préparation durable non autorisante, puis remplacement atomique par comparaison de version : OLD devient ABORTED, NEW devient PENDING_DRAIN, jamais RUNNING intermédiaire. Les coupes temporelles et barrières originales ne sont pas rafraîchies pour faire passer un contrôle.
- Le changement concret de ressource reste celui ratifié : disponibilité du seul worker-a de vrai à faux. Ne pas modifier worker-b, le compte partagé, le modèle racine ou les droits racine pour fabriquer un succès.
- La commande administrative de fixture ne devient pas, par renommage, un contrat public agent ou un appel distant. Les exclusions d'authentification et de corps public non ratifiées restent des propositions.
- La validation et la publication appartiennent au superviseur ; notification, récupération, lecture et acceptation sont des états distincts.

## 4. Organisation et traitement des messages manquants

Conserver un seul superviseur par mission. Choisir la concurrence utile selon les dépendances, les capacités réellement partagées et les permissions ; ne pas maintenir artificiellement un nombre d'agents.

Avant de remplacer un auteur jugé silencieux : rechercher son résultat conservé, examiner si nécessaire sa session native et vérifier ses fichiers. Établir une interruption, un échec de fournisseur, une capacité occupée ou un défaut de permission précis. Une boîte de résultats vide ou un état inactif ne prouve pas l'absence de travail.

La version d'Ensemble vérifiée le 28 octobre peut récupérer des réponses finales et réveiller conditionnellement le superviseur. Ces fonctions sont des aides de coordination, pas une garantie de transport ni une preuve de raccordement du produit RMS. Ne pas ajouter un système concurrent de réveil ou de récupération sans manque établi.

Les revues indépendantes utilisent une tâche explicitement marquée `context: { mode: "fresh" }` avant son admission, puis une session distincte. Les projections autorisées restent bornées : l'archive intégrale de cette conversation et des auteurs ne doit pas être donnée aux futurs auteurs ou reviewers aveugles.

Les profils et modèles doivent être disponibles nativement, sélectionnés par le contrat présenté et vérifiés dans `Model.Ref`. Proposer la continuité avec la politique M2 approuvée, sans la migrer ou la réapprouver implicitement pour la nouvelle mission. Pas de score de classification inventé, de changement de modèle par message ou de repli payant implicite.

## 5. Paquets de travail et dépendances

Les noms ci-dessous sont des paquets documentaires, pas des identifiants natifs de tâches. La préparation doit produire les vrais identifiants et des critères fermés.

### A. Reprendre les preuves et récupérer les livraisons existantes

Rapprocher sources canoniques, candidat isolé, overlays et preuves conservées. Rechercher les livrables des auteurs déjà lancés, notamment le plan de scénarios de machine d'état et le raccordement public, avant toute réaffectation. Produire une carte « acquis réutilisable / changé / absent / bloqué », avec une justification par preuve.

Acceptation : aucun travail terminé relancé ; aucune preuve transférée à une version différente sans analyse d'impact ; aucun compteur réinitialisé ; les obligations réellement restantes sont identifiées.

### B. Définir une voie de clôture du remplacement, avant de modifier son code

Dépend de A. Étudier la validation répétée du trajet final à partir des mesures déjà acquises. Proposer une correction minimale compatible avec les contrôles de fraîcheur et d'autorité, ou démontrer précisément pourquoi une frontière de stockage, de contrat ou de responsabilité doit changer.

Comparer au moins une alternative rejetée. Ne pas sélectionner une optimisation sur un simple comptage d'appels et ne pas recommencer la mesure terminée. Une modification architecturale ou un nouveau harnais important exige un arbitrage avant implémentation. L'étude doit aussi isoler les deux décisions bloquantes : preuve de fin native des threads et couverture de deux candidats distincts sous la limite des origines.

Acceptation : proposition liée au coût observé, invariants et risques explicites, contrôles affectés définis ; aucune dérogation silencieuse. L'implémentation et les exécutions restent conditionnées à l'approbation du nouveau contrat applicable.

### C. Compléter persistance, acquisition et remplacement autorisés

Dépend de A et de la décision applicable à B. Compléter uniquement les manques établis de transactions, contrôles de version, générations périmées, quotas, retrait des anciens résultats et activation du candidat autorisé. Réutiliser les preuves valides de refus et rollback ; refaire seulement celles affectées.

Acceptation : pas de double publication, de succès après délai, d'effet scientifique d'un résultat retiré ou de compteur dérivé d'une absence de provenance. Les chemins toujours interdits restent explicitement non exécutés et bloquants pour l'acceptation concernée.

### D. Raccorder le parcours public et les observations OpenCode

Le contrat peut être étudié après A, indépendamment de l'étude B si les écritures et entrées sont disjointes. L'implémentation dépend du contrat public ratifié et des prérequis C qu'elle consomme réellement.

Identifier le point public exact, les sessions, outils et permissions nécessaires. Distinguer disponibilité réelle, résultat achevé mal transmis, refus d'infrastructure et résultat scientifique. Toute preuve native exige un préflight borné, des fixtures possédées et une permission explicite ; pas de supposition d'autorité à partir d'une commande administrative.

Acceptation : route publique observable et refus précis, droits préservés, absence de publication implicite ; pas d'affirmation d'intégration native sur la seule réussite d'une fixture.

### E. Terminer consolidation, publication et reprise déterministe

Dépend des contrats et chemins C/D requis. Raccorder résultats revus, réconciliation, provenance et connaissance durable. Vérifier conflits, retrait, échec/reprise, replay et identité des effets publiés. Garder les refus d'infrastructure distincts des verdicts scientifiques.

Acceptation : même entrée et même historique qualifié donnent le même résultat observable ; un résultat ancien ou non accepté ne publie rien ; aucune connaissance seulement annoncée ne devient un fait accepté.

### F. Compléter les scénarios indépendants de machine d'état

Le plan d'oracles peut être repris dès A ; les exécutions dépendent des implémentations et autorisations concernées. Couvrir transitions autorisées et interdites, préconditions, versions périmées, concurrence permise, absence de double effet et échec/reprise. Ne pas réécrire un oracle pour s'aligner sur un défaut.

Acceptation : matrice obligation → source/oracle → preuve/version → statut ; toute preuve indispensable absente reste visible comme blocage, pas remplacée par un cas plus faible.

### G. Review indépendante de sûreté et intégration finale parent

Dépend de C à F selon les frontières effectivement livrées. Obtenir la revue finale indépendante (L9), puis l'intégration et la validation finale du parent (L10). Pas de pipeline fixe de spécialistes : une preuve distincte par risque obligatoire, sans revue répétée seulement parce qu'un reviewer est nouveau.

Acceptation : aucun bloquant ouvert ; parcours statique maîtrisé de bout en bout, avec échec/reprise et connaissance durable ; commandes convenues exécutées ou explicitement non exécutées ; bilan final accepté. Un état partiel reste partiel.

## 6. Vérification proposée

Niveau : **reinforced**, en continuité avec l'ordre M2 amendé. Présenter les commandes, bornes et critères dans `/ensemble-mission config` ; seul le `start` utilisateur approuve le contrat de la nouvelle mission.

Commandes consolidées à conserver dans le contrat, depuis `tools/ff8-harness` :

- `bun run typecheck` ;
- `bun run test:q1-primitives` ;
- `bun test`.

Elles restent non exécutées au point de départ de cette mission. Leur présence dans le plan n'autorise pas leur lancement maintenant. Définir les bornes et exclusions non levées avant l'exécution ; ne pas présenter une suite filtrée comme la suite complète.

La limite par test de quinze secondes ne change pas. Le précédent plafond de processus de 300 secondes n'est pas une permission de faire réussir un test de 111 secondes. Les trois chemins interdits ne doivent pas être lancés par une commande globale.

Conserver les 450 paires et neuf régressions sans nouvelle invocation par défaut ; évaluer le besoin de rejeu uniquement si leurs sources, entrées, oracles ou conditions pertinentes changent. Les preuves S1 et autres qualifications restent réutilisables hors impact.

Chaque décision importante doit relier objectif, défaut ou risque, correction permise et preuve attendue. Réparer les défauts bloquants du périmètre, séparer les suggestions différables et arrêter une fois les critères approuvés satisfaits et le bilan accepté.

## 7. Frontières de décision avant lancement

- Le gel du diagnostic précédent reste appliqué. Aucun nouvel essai, instrumentation ou optimisation n'est permis par la seule rédaction de cette mission.
- Une autorisation nouvelle doit nommer les modifications et exécutions concernées. Elle ne lève pas automatiquement l'interdiction de threads ou la limite des origines.
- Les modifications architecturales non déjà approuvées sont présentées avec leur impact avant réalisation.
- Si une preuve obligatoire demeure impossible sous les contraintes conservées, rendre un bilan partiel et demander l'arbitrage précis ; ne pas chercher une acceptation par changement de vocabulaire.
- L'autorisation utilisateur du 28 octobre de préparer, ingérer et publier le dépôt concerne cette opération documentaire et Git. Elle ne vaut pas `start` de la mission logicielle.

## 8. Livrables de préparation et condition de clôture

La préparation native devra produire une file dépendante et traçable, une politique de modèles et variantes explicitement présentée, le contrat de vérification, les projections de contexte et les décisions réellement nécessaires avant exécution. Ne pas inventer d'identifiants de tâches ou prétendre que cette préparation a déjà été importée.

La mission logicielle ne sera close qu'après satisfaction des critères approuvés, vérification indépendante requise et acceptation du bilan parent. Tant que le remplacement, les preuves de concurrence exigées, le parcours public ou les autres obligations indispensables restent ouverts, le statut demeure partiel ou bloqué.

L'archive de la conversation et de ses sous-agents doit préserver les échecs, les corrections et la provenance, avec un inventaire de couverture. QMD est un moyen de recherche dans ces sources, pas une autorité supérieure aux contrats et reçus primaires. Exclure les raisonnements privés et les secrets de toute archive publiée.
