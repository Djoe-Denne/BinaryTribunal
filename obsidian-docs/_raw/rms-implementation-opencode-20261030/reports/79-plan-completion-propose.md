# 79. Plan proposé pour compléter la mission RMS

## Recommandation de conduite

**Amender la mission actuelle plutôt qu’en ouvrir une autre.** L’objectif reste le parcours RMS de bout en bout ; la directive utilisateur corrige une exigence d’annulation trop forte. Les livraisons, sources, revues et preuves sont déjà rattachées à cette mission. Les conserver évite une reprise administrative et une réinterprétation inutile.

Autre possibilité : clôturer la mission actuelle **en livraison partielle acceptée**, puis ouvrir une mission de complétion depuis une base épinglée. Cela donne une séparation historique plus nette, mais demande préparation, transfert des preuves et approbation initiale de la nouvelle mission. Cela ne réduit ni le travail ni les garanties manquantes. Une telle clôture ne doit pas être présentée comme réussite complète M2.

Le présent document est un **plan proposé**, pas un lancement, une modification silencieuse de la politique approuvée ou une nouvelle permission native. Aucun commit produit, test, clôture de mission ou nouvelle mission n’est déclenché par sa rédaction.

## But fonctionnel fermé

RMS doit pouvoir préparer un travail, l’admettre et observer son exécution, recevoir un résultat attribuable, le faire vérifier, publier les octets acceptés et les fournir au travail suivant. Le superviseur doit pouvoir rendre un travail obsolète sans exiger son arrêt instantané : ordres correctement ordonnés, aucun retry automatique de ce travail, aucun usage d’un résultat devenu obsolète.

La fin logique et l’occupation physique restent distinctes. La décision doit préserver les budgets, les effets partagés et l’historique ; elle ne fabrique pas de preuve de quiescence.

## Acquis à ne pas refaire

Base intégrée : `e1a58997b6d0fe4e145aa844382f9ce1c637d0e2`. Les raccords statiques, publication, projection GraphRunV2, admission au repos et lecteur DATA sont reçus dans leurs portées. Manifestes et readbacks :371 sources,3493 dépendances, onze modifications utilisateur préservées.

Les preuves existantes restent liées à leurs versions, entrées et oracles :47 cas de projection,11 cas ciblés de remplacement,55 primitives, publication et raccord statique,26 cas d’admission et33 cas du lecteur DATA. Ne pas additionner ces compteurs en suite globale ; revalider seulement les risques affectés par le code ou les conditions modifiées.

## Étape 1 — Mettre à jour le contrat et le journal des obligations

Formaliser les directives76 et la synthèse78 :

- portée de l’obsolescence : tâche/exécution/génération ; décision durable du superviseur ; état irréversible pour le travail visé, sans empêcher une nouvelle demande explicite distincte ;
- portée de l’ordre : file par destinataire utile, pas ordre global gratuit ; distinction émission, réception/admission et application par l’agent ;
- message d’annulation distinct de l’invalidation RMS ; résultat tardif identifiable même si le message n’est jamais lu ;
- arrêt volontaire sans retry, contrairement à certaines pannes récupérables ; reprise/redémarrage ne ressuscitant pas le travail ;
- publication engagée ou déjà committée : effet physique et retrait futur explicitement traités, pas annulation rétroactive fictive ;
- coûts et ressources encore consommés conservés selon leur risque réel.

Réexaminer les obligations anciennes à la lumière de cette règle, sans conserver une garantie native plus forte par automatisme. Le catalogue et la QA reinforced restent inchangés. Toute révision nécessaire du contrat de mission persistant doit être présentée selon le mécanisme de révision prévu, pas appliquée en modifiant son JSON approuvé à la main. Aucun nouveau GO de routine à chaque étape.

**Sortie :** avenant exact et liste fermée d’obligations, avec preuve attendue, preuve héritée et vérification manquante. Un blocage résiduel doit nommer la propriété et la permission nécessaires, pas seulement une catégorie d’opération.

## Étape 2 — Réaliser l’obsolescence et l’ordre côté RMS

Un propriétaire de code unique sur les modules de journal/états partagés prépare un plan borné puis réalise :

- commande durable identifiée et séquencée, reçu stable et refus des doublons divergents ;
- une livraison en vol par file ; rapprochement d’identité/récupération du reçu après réponse perdue, sans nouvelle tentative de travail ;
- marqueur d’obsolescence autoritaire, consulté au dispatch, aux reprises, à la réconciliation, à la sélection des résultats et aux décisions de validation/publication ;
- notification native facultative, sans réveil involontaire ; aucun mélange de canaux prétendu ordonné sans preuve ;
- maintien des identités et octets tardifs avec admissibilité recalculée, y compris pour un résultat déjà retenu ;
- séparation entre retrait logique et libération effective des ressources.

Pas de nouveau store ou ordonnanceur. Aucun type ou événement actuel n’est renommé pour simuler une garantie absente. Un résultat de notification n’est pas un receipt de travail ou une preuve terminale.

**Acceptation :** annulation avant départ, en transit, en cours et après arrivée ; réponse perdue/doublons/trou d’ordre ; redémarrage sans retry ; résultat tardif et déjà sélectionné inutilisables ; coûts/claims non effacés artificiellement. Tests hors ligne ciblés avant qualification native.

## Étape 3 — Fermer et qualifier le parcours natif réellement utilisé

Relier progressivement l’admission retenue à l’exécution et aux observations réellement émises :

- corps et identités exacts, profil, Model.Ref et permissions demandés puis observations attribuables ;
- provenance du service et qualification comportementale du composant effectivement ciblé, sans prétendre une correspondance source/binaire non établie ;
- réponse perdue rapprochée sans nouvelle identité ni émission aveugle ;
- notification/annulation ordonnée et absence de retry RMS après obsolescence ;
- résultat lié au bon travail et comportement des consommateurs ;
- témoins de fin et de ressources nécessaires aux travaux encore légitimes, sans exiger une quiescence universelle pour la seule obsolescence logique.

Le contrat doit être fermé avant activation des méthodes aujourd’hui refusantes. Si l’API actuelle suffit au besoin redéfini, ne pas créer de modification de noyau inutile. Si une propriété indispensable manque encore, l’identifier et traiter son accès/déploiement exact sans contourner les restrictions globales.

**Acceptation :** observations natives positives et négatives sur les frontières requises, version/entrées/oracles rattachés, aucune fixture promue en preuve native. Aucun test ne lève implicitement les arrêts G5–G7 ou les autres interdits.

## Étape 4 — Raccorder la projection au parcours DATA v3 consommé

Étendre prospectivement la jointure de publication vers les nouveaux contenus sur le parcours v3 réellement retenu : policy, provenance, droits/rôles, identités et octets exacts. Ne pas remplir une référence aujourd’hui nulle par simple cast, migrer un cycle gelé ou réexposer A et B l’un à l’autre.

Cette étape doit être cohérente avec le contrat natif arrêté ; une image DATA isolée n’est pas présentée comme la preuve d’un parcours exécuté. Les parties indépendantes peuvent être préparées en parallèle seulement avec propriétaires et fichiers disjoints.

**Acceptation :** nouveaux octets réellement acquis par les consommateurs du parcours v3, permissions et aveuglement préservés, reprise et ancien cycle inchangés. Rejouer seulement les contrôles de projection affectés.

## Étape 5 — Prouver le scénario final de bout en bout

Sur le candidat gelé et dans les droits explicitement établis, exécuter le scénario final reliant :

1. préparation et admission dont une réponse perdue ;
2. rapprochement exact sans second travail ;
3. résultat normal et cas d’obsolescence avec résultat tardif sans retry ;
4. revue/réconciliation et décision du superviseur ;
5. publication unique et readback exact ;
6. acquisition des nouveaux contenus par le travail suivant ;
7. reprise/replay sans réutilisation d’une autorité périmée.

Les preuves distinctes restent distinctes : le trajet natif unique n’est pas fabriqué par addition des tests hors ligne. Aucune nouvelle étude scientifique ou nouveau golden RE.

## Étape 6 — Intégrer et rendre l’acceptation consolidée

Revue indépendante fresh des frontières modifiées, puis corrections des seuls bloquants et impacts. Fusion/intégration parent, comparaison des sources/dépendances et préservation des modifications utilisateur, validation consolidée des seuls contrôles affectés.

Commandes de référence : `bun run typecheck`, primitives si affectées et sélections ciblées inspectées ; dix minutes par test. `bun test` global reste interdit tant qu’il atteint un arrêt explicite. Une sélection filtrée ou un SKIP n’est pas une suite complète.

**Clôture complète seulement si** les livrables retenus sont intégrés, chaque obligation requise dispose d’une preuve pertinente, aucun bloquant ne subsiste et le parent accepte le bilan. Sinon : résultat partiel/bloqué explicite, sans supprimer une obligation inaccessible.

## Points empêchant de promettre dès maintenant une « dernière mission »

Les arrêts HOLD125/anti-orphelin, diagnostic gelé et scénario nécessitant quatre origines sous plafond trois ne sont pas levés par l’obsolescence logique ou par une nouvelle mission. Il faut, pour chaque obligation concernée, établir si elle demeure requise sous le contrat utilisateur redéfini, si une preuve existante répond réellement à cette propriété ou si un arbitrage explicite reste nécessaire. Aucun cas interdit n’est exécuté pour remplir ce plan.

Les permissions et accès natifs indispensables doivent être disponibles avant leurs vérifications. Ouvrir une mission différente ne les crée pas. Le nettoyage des worktrees conservés reste différable et ne se confond pas avec les fonctionnalités.

## Organisation proposée et état administratif

Workers build pour préparation/réalisation, pas de profil architecte imposé. Propriétaire unique des fichiers d’état partagés ; parallélisme seulement sur tâches réellement indépendantes. Revue indépendante choisie pour les risques requis, pas de pipeline universel. Parent seul : arbitrage technique, qualification permise, intégration et acceptation.

Ce plan peut devenir soit un avenant de la mission actuelle (**option recommandée**), soit le mandat d’une mission de complétion avec les mêmes preuves héritées. Aucune durée/coût global fiable n’est encore établi ; ne pas annoncer un nombre de jours ou garantir qu’aucun nouvel obstacle réel ne sera découvert.

## Références de reprise

Rapport72 : livraison intégrée et preuves. Rapport76 : directive utilisateur. Rapport78 : deux recommandations build et ancrages code. Rapport74 reste historique et partiellement supersédé par76/78. Le journal `../OBLIGATIONS.md` doit conserver ces changements d’exigence et les manques encore réels.
