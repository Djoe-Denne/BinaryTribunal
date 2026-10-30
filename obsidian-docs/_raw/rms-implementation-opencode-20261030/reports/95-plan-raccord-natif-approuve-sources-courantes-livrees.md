# 95. Plan du raccord natif approuvé, sources courantes livrées

## Objectif et décision

Le superviseur approuve le plan de réalisation du raccord natif dans l'espace isolé, avec les précisions ci-dessous. Le plan concrétise le contrat94 : autorité native distincte des données fixture, propriétaire opérationnel unique, images avant effet, refus des renvois ambigus et observation tardive sans promotion.

Cette approbation autorise l'écriture du candidat et des tests. Elle n'autorise à l'auteur aucun test, import produit exécuté, réseau, appel natif, installation ou activation. Le superviseur conserve la qualification réelle, la revue et la réception.

## Plan fermé et contrôles de sûreté

Le provider parent optionnel vérifie une autorité native actuelle, les sources indépendantes et la continuité complète du root/head/slots/origines. Absence ou refus avant tout token/transport. Les documents persistés et événements n'accordent pas seuls l'autorité ; aucune factory publique ou handle fixture ne l'accorde.

Migration privée8→9 avec exactement trois tables natives, DDL/colonnes/index/triggers contrôlés. Détection de perte/corruption avant réparation permissive, maintien des protections de l'autorité d'obsolescence. Les préparations composent les primitives existantes dans une transaction IMMEDIATE avec contrôles avant/après append ; aucune reconstruction de plan à chaque retry.

Les phases de session/prompt retiennent leur engagement avant chaque POST. Une phase déjà engagée n'est pas réémise après réponse perdue,404 ou redémarrage : rapprochement GET des mêmes identités et images seulement. Taille et débit incluent tous les bodies REST ; aucune exemption pour qualification, origine, bootstrap ou ressource.

Précision de réalisation ratifiée : le permis exact de qualification est référencé par l'opération privée, plutôt que par le binding, afin d'éviter un cycle binding→body→permis exact→binding. Le graphe des empreintes doit rester explicitement acyclique : le permis couvre l'image wire et son scope, pas un hash contenant sa propre référence. Cette localisation ne change ni le producteur parent vérifié, ni la relecture actuelle, ni la comptabilité, et n'accorde aucune autorité par une simple référence texte. Les grants stables et révisions opérationnelles de comparaison atomique restent distincts ; les mutations légitimes de la transaction ne permettent pas de désactiver les contrôles.

Le port natif consomme réellement submit/observe, via un encodeur/décodeur commun avec le mode qualification-only ; pas de RPC legacy ou fallback fixture. L'observateur runtime distinct accepte envoyé/ambigu/obsolète sous ownership physique, mais ne fabrique ni résultat courant, témoin de fin ou libération. Les usages restent soumis à l'admissibilité courante et à la vraie preuve positive requise.

La route de qualification comme la route produit restent refusantes sans autorité, continuité, permis/qualification et droits effectivement prouvés. Un provider de test ou des sources publiques ne sont jamais leur preuve native. La production doit exposer une véritable frontière d'intégration du provider host, pas présenter une route inactivable ou un faux provider comme réalisation opérationnelle complète. La tâche de réalisation/qualification ne sera reçue qu'après ses preuves requises ; un candidat inerte utile peut être livré sans prétendre cette réception.

## Fichiers et extension minimale motivée

Les neuf fichiers produit du contrat94 et les six fichiers de tests proposés sont autorisés. Handoff et manifeste locaux autorisés comme preuves. Pas de changement des modules génération/autorité/ressources fixture, SDK/packages, driver de fixtures, schémas publics ou configuration globale.

**Extension locale autorisée :** `test/graph-integration/next-context.test.ts`, seulement les attentes de version privée et le négatif de version future affectés par8→9. Le superviseur a retrouvé des attentes8 et une injection9 dans ce fichier ; laisser ce négatif inchangé reproduirait le défaut de revue précédent. Le refus d'une version future et tous ses oracles doivent rester intacts, avec une version réellement supérieure à la nouvelle version supportée. Même contrôle dans eventlog déjà au périmètre. Pas d'ajout de nouvelle fonctionnalité de projection ou modification d'autres tests de contexte par cette extension.

Le parent ratifie ainsi une adaptation déterministe de compatibilité déjà requise, pas un élargissement de mission ou un nouveau harnais. Toute autre extension doit être motivée avant écriture.

## Sources actuelles fournies, limites inchangées

Le schéma OpenAPI courant2.2.1 capturé par GET parent était déjà livré comme entrée locale. En complément, le tag public officiel `v2.2.1` a été résolu au commit `3ebcf9a32c7b28f658cfee80775448929361727a`. Huit fichiers utiles de session, inbox, exécution/reprise, messages, événements et protocole ont été conservés et copiés à l'identique dans l'espace auteur, avec manifeste de tailles et empreintes.

Ces sources permettent de fermer les formes et modes au lieu d'inventer un décodeur. Elles restent des données de contrat statique : aucune équivalence entre source et binaire courant, droit réellement exercé ou sémantique de fin native n'est prouvée par leur téléchargement. Les champs non qualifiés restent refusants, sans remplacement par des valeurs attendues.

## Vérification prévue

Tests `RMSN-` ciblés : fausses autorités/copies, continuité/CAS/rollback, perte/corruption, caps exacts, engagement avant effets, réponses perdues CREATE/PROMPT sans second POST, changement d'identité/body/modèle/droits/version, révocation/obsolescence à travers awaits et reprise, DATA tardive non consommable, attribution des témoins et notifications ordonnées. Oracles indépendants d'octets et de traces factices, jamais présentés natifs.

Après candidat épinglé : compilation, réutilisation des primitives si toujours valides, sélections fermées après inspection des imports/branches, dix minutes par test, et régressions affectées incluant les versions privées. Revue indépendante fraîche du raccord. Aucun test global, HOLD125/thread, quatrième origine, diagnostic gelé ou campagne scientifique. Les qualifications natives seront décidées et exécutées par le superviseur après leurs gates, sans nouvelle autorisation de routine ni dispense d'une permission réellement manquante.

## État et traçabilité

Le superviseur a confirmé dans le worktree la base `9c1b6aaf5288445c06d82978b122091111c2bc8f`, la branche possédée et l'absence de diff suivi/index avant approbation. Les entrées préparatoires restent hors produit et hors commit.

Le Context Mode partagé de l'auteur reste borné à la racine canonique `retro-eng` et a refusé son fichier worktree. Ce refus n'est pas une panne MCP et aucun rattachement global n'a été modifié. Le superviseur a extrait depuis l'original canonique déjà retenu les huit routes utiles et leurs schémas référencés, puis livré ces extraits bornés par message : création/session, prompt, message exact/liste, inbox, journal SSE et info. Notamment le prompt renvoie une entrée inbox, pas un assistant ; delivery est la chaîne steer/queue et resume un booléen ; l'inbox ne représente que les éléments en attente. Les attributs optionnels dans le schéma général doivent être refusés s'ils sont nécessaires à la preuve mais absents, jamais synthétisés. Ces données statiques n'activent aucun décodeur qualifié.

Pour rendre cette livraison indépendante de la file de messages, l'extraction a ensuite été matérialisée en [document borné de42lignes](../evidence/native-wire-openapi-2.2.1-extract.md), copié à l'identique dans les entrées locales de l'auteur. Il précise l'absence des noms de composants PromptInput.Prompt/PublicSessionInfo dans cette capture, et la différence parentID facultatif non nullable dans Session.Info contre nullable dans le body de création. La copie est une donnée préparatoire distincte, pas une nouvelle tentative de lire le gros fichier refusé.

L'état natif confirme le plan approuvé. L'auteur est invité à effectuer la transition normale vers l'implémentation pour ses outils de build ; une éventuelle limite persistante doit être signalée, sans édition canonique via Serena ni autre contournement. Les branches privées natives des gardes de réservation/inputs et de résolution de session sont admises dans les fichiers déjà autorisés, sans assouplir les interprétations historiques ou traiter une ancre inconnue comme legacy.

- Session auteur : `ses_e76e72b8dffebLfY5TjAf4xFI5`, tâche `task_mvtsy9v2_0008_2n3fue`.
- Branche : `ensemble-0c66ae1b-3cb3-456d-9756-fb77a82aa1be`.
- Sources publiques : `evidence/public-core-v2.2.1-native-plan/manifest.json` ; copie auteur `native-plan-inputs/public-core-v2.2.1/`.
- Tag vérifié par `https://api.github.com/repos/anomalyco/opencode/git/ref/tags/v2.2.1` ; aucun contenu privé envoyé au service public.
- Aucun code candidat, test ou effet natif n'est réputé exécuté à cette étape.
