# M2 — 124 : fermer trois défauts avant de tester le remplacement

## Objectif et résultat de revue

Le remplacement doit conserver une histoire complète, n'activer que des sources encore valides et terminer proprement son test de concurrence. La revue123 rend **À_CORRIGER** sur trois points. Le parent recoupe les sources gelées : final-inventory420–426 omet la nouvelle observation de préparation ; store520–522 et546–551 ne relisent pas le port HOST de remplacement à T2 ; replacement-fixtures149/155–158 attend reply/exit/terminate sans échéance globale.

Aucun runtime n'a été exécuté : ni commit dangereux ni thread orphelin n'est observé. Le premier défaut bloquerait le final nominal et masque la trajectoire du second. Les protections source/autorité, compteurs, swap, dépendances et ouverture deny-only examinées par le reviewer restent réutilisables hors impact. Les 28 cas sont écrits, non qualifiés.

## Décision et ownership

Après snapshot des douze sources120 et du manifeste, autoriser les corrections source dans **huit fichiers existants au maximum** :

- src/graph-final-inventory.ts, graph-generation-store.ts, graph-trusted-authority.ts, graph-generation-replacement.ts, graph-generation-activation.ts ;
- test/s2-author/replacement-fixtures.ts, replacement.test.ts, replacement-contender.ts.

Ne modifier que les fichiers nécessaires et signaler ceux inchangés. Pas de nouveau module, contrat public, schéma, framework, service ou entrée à cette étape. Les autres sources120, 131 tests historiques, inputs122, basrecords, budget/ledger, configurations et sources116 restent protégés. Besoin précis d'un autre fichier à escalader avant édition. Les références et consommateurs des lecteurs modifiés doivent être examinés selon la politique Serena, sans prétendre à une couverture universelle.

## Trois corrections requises

### 1. Expliquer positivement l'observation NEW

Le scan final doit joindre la référence d'observation du stage réellement validé avec son document, son événement et ses sources/préimages exactes. Réutiliser l'audit de stage existant ; le simple kind replacement-stage ou la présence d'une ref caller ne prouve pas sa légitimité. Garder le scan anti-orphelin : une observation supplémentaire, un stage falsifié/révoqué ou un lien événement/source incorrect doivent refuser. Ni filtrage de la nouvelle observation, ni acceptation générale des transition-source, ni suppression de lignes.

Le nominal stage→swap→final frais doit devenir statiquement atteignable avant les nouveaux négatifs LIVE. Les gardes d'historique, préparation et T1 restent obligatoires ; aucune réécriture de l'observation ou des cuts.

### 2. Consommer et revérifier le courant HOST à T2

Pour un nouveau final/attempt lié à un remplacement, retenir les preuves et l'identité/version courantes du port HOST réellement consommé, avec les joins source/case/capability attendus, et relire ce même port avant activation puis après le vrai append. Vérifier aussi les mutations externes sans register DB : current absent, révocation, changement de révision/epoch ou remplacement des bytes. La seule histoire DB ou une nouvelle ref caller ne prouve pas l'actualité.

Les frames/contrôles privés peuvent être étendus localement dans les modules autorisés ; pas de nouveau type public ni d'IO/callback caller dans la transaction. Le point d'autorité reste le port indépendant déjà acquis, pas une reconstruction depuis la demande ou un cache sérialisé. Un epoch ne peut donner une autorité absente. Après append, comparer les preuves effectivement consommées et refaire leurs gardes LIVE ; ne pas rafraîchir le final ou l'expected head pour sauver la tentative.

Préserver la séparation historique : les anciens commits restent auditables avec leurs preuves consommées immuables, sans exiger une nouvelle autorité pour simplement les lire ; ils ne peuvent autoriser une consommation fraîche. Le rejet OLD/STALE_CONTROL_PREIMAGE et la branche sans remplacement gardent leurs comportements. Révocation/invalidation en cours de vrai append doit annuler atomiquement les effets OWN de l'activation.

Écrire les attentes manuelles précises : source invalidée après collecte avant T2 sans mutation DB ; source invalidée après son vrai append ; état/head/counters/slots/activation inchangés après refus/rollback, preuve que le hook est atteint et que le refus n'est pas masqué par l'observation orpheline. Inclure current inconnu et révocation/epoch dans les cas finis existants ou leurs variantes nécessaires, sans campagne supplémentaire.

### 3. Borner toute la vie du contendeur

Ajouter des échéances explicites aux attentes reply, exit, terminate et à la collecte de fin. Un rendez-vous Atomics ou le timeout Bun ne suffit pas. Chaque échec doit conduire à la libération des signaux et du spy, à une demande de terminaison si nécessaire et à une collecte bornée des erreurs/sorties. Conserver erreur primaire et erreur de nettoyage distinctement ; pas de promesse rejetée orpheline ou d'échec secondaire qui efface la cause initiale.

Un timeout de join n'est pas une preuve de sortie : ne jamais annoncer «thread joined» sans exit observé. Si le runtime ne peut garantir l'absence d'orphelin par le mécanisme local autorisé, remonter ce blocage avant exécution, sans créer de runner général ni infrastructure nouvelle. Préserver le vrai SQLITE_BUSY, les identités distinctes et l'ordre commit/retour : une deadline ne remplace pas la preuve de contention.

Couvrir en source les fins anormales après handshake avant reply, et après reply avant exit, avec les points de faute locaux minimaux si nécessaires. Aucun thread ne doit être lancé maintenant. Les délais restent bornés conformément au mandat120 ; pas de hausse silencieuse du timeout de test. Une impossibilité précise est escaladée plutôt que masquée.

## Validation et livraison

Livrer hashes/deltas/API privées/préconditions/refus et preuves statiques des trois corrections. Re-gel puis même reviewer sur ces défauts et leur impact ; les constats123 valides hors impact sont réutilisés. Pas de relecture des oracles QA S1/L7, pas de nouveau pipeline ni recherche de couverture maximale.

Autorisation **source seulement** : zéro import évalué/replan/seal/bind/typing/test/thread/SQL/DB/opener/asset/provider/native/Git/commit/merge/délégation. Aucune base ou asset115 rouvert. Aucun futur gate, OWN, budget ou exécution autorisé par cette correction. La compilation et les tests seront définis séparément après revue.

S2/M2 restent ouvertes, tâche globale propriété du lead. Remplacement, replan S1 concret et concurrence sont non obtenus ; les trois commandes consolidées restent non exécutées. La limite de deux NEW distincts sous plafond3 reste explicite et non waived.

Préservation effectuée : douze sources120 et manifeste vérifiés byte-exacts readonly dans `snapshots/s2-replacement-123/`. Huit fichiers autorisés seuls dégelés. Correctif124 transmis à l'auteur retenu, reviewer informé d'attendre le prochain gel/manifeste. Aucune exécution produit, thread, SQL, asset ou opération Git pendant cette préparation.
