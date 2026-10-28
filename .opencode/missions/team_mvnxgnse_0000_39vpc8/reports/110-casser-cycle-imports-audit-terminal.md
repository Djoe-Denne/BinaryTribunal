# M2 — 110 : casser la boucle d'imports sans changer l'autorité

## Verdict et décision

La revue109 rend **À_CORRIGER** pour le cycle VALUE transition→terminal-history→trusted-authority→transition, avec aussi un retour par activation/inventory. Aucun crash d'initialisation n'a été observé : aucun import/test exécuté. Les autres contrôles fonctionnels inspectés sont jugés cohérents statiquement et restent réutilisables, pas des preuves runtime.

Parent recoupe imports et fonctions authority142–152/191–229. Refuser l'exception contractuelle proposée : supprimer le cycle par un petit refactor privé, sans service, changement de responsabilité, APIpublique, schéma ou trustboundary. Les mêmes validateurs doivent rester l'unique implémentation, pas être recopiés en versions divergentes.

## Correctif source autorisé

Après snapshot des neuf sources109 et de l'authority protégée, autoriser **trois fichiers seulement** :

- modifier src/graph-trusted-authority.ts ;
- modifier src/graph-terminal-history.ts ;
- créer src/graph-fixture-records.ts, module bas niveau des lecteurs/validations de records.

Extraire les implémentations de readFixtureResourceCurrentV1 et assertFixtureRecordCurrentV1, avec le validateur de forme checked et les dépendances strictement nécessaires, dans le nouveau module qui **n'importe en VALUE aucun authority/transition/activation/inventory/store/terminal-history**. Types-only effacés possibles si requis ; privilégier dépendances primitives déjà qualifiées (eventlog/validation/envelope/resource-ledger) et vérifier leurs arêtes transitives. Types et fonctions de l'authority existante restent disponibles par imports/réexports compatibles ; aucun wrapper caller ou callback de validation dans une transaction.

Le moduleterminal consomme directement ce basniveau, non le modulehighlevelauthority. L'authority consomme la même implémentation pour registration/resolve/current et conserve ses WeakMap/handles, provenance et ports actuels. Pas de duplication du checked, cast, shape moins stricte, SQL/ref/digest/révocation/closedfields/immutabilité modifiés. Une extraction de types est un choix local si elle préserve exactement les signatures et n'entraîne pas de fichiers supplémentaires.

Avant édition, examiner refs/implémentations des symboles extraits avecSerena ; garder leurs consommateurs sans changement ou signaler un besoin précis. Le refactor ne peut exiger de modifier tous les imports consommateur si les réexports internes restent compatibles. Aucun nouveau contrat externe S1 ou privilège d'issuer.

## Validation proportionnée et limites

Livrer trois hashes, comparaison des fonctions déplacées et liste des arêtes VALUE/TYPE affectées. Vérifier statiquement que le cycle introduit est réellement cassé, y compris les retours via authority→activation→inventory, plutôt que seulement renommer un import. Un simple import réussi ne démontrerait pas la conformité de dépendances. Ne pas inventer un nouveauharnais de graphe ou ajouter une règle globale.

Reprise par le même reviewer sur le seul refactor et ses impacts de currentQ/currentresource ; constats109:2–6 fonctionnels réutilisés hors impact. Ne pas rouvrir les15tests, plafonds ou chemin scientifique sans cause nouvelle. Anciennes sources106 et quota3 restent acquis à leur version ; crossEpoch reste requis/non obtenu.

SOURCE ONLY : aucun importévalué/seal/bind/typing/test/SQL/DB/opener/asset/provider/native/Git/délégation. Les huit autres sources109, tests, inputs, bases/assets106, resource-ledger/budget et types publics restent protégés. Après livraison/gel aucune retouche sansGO. Future compilation/runtime seulement après revue et gateOWN/budget distinct.

000bownerlead/S2global/M2 ouverts. Aucun waiver de dépendances, pipeline supplémentaire, framework ou élargissement vers envoyé/publication/S3.

Préservation effectuée : les neuf sources109 et SOURCE_MANIFEST8e8a1f8b… ainsi que l'authority34209B/SHA5020c387… sont conservés byte-exacts readonly dans snapshots/s2-cross-epoch-109. Seuls authority/terminal courants dégelés ; nouveau module vérifié absent. GO110 transmis à l'auteur retenu, reviewer informé d'attendre le prochain manifeste. Aucun import/DB/asset exécuté.

## Précision du périmètre des dépendances

Pendant l'extraction, l'auteur signale un cycle préexistant validation↔re-policy dans la fermeture des primitives (18modules examinés statiquement). Son existence/provenance sera corroborée dans la livraison/revue ; aucune panne runtime n'est alléguée. La gate110 vise les cycles **introduits par108 et le nouveau raccord**, non une propriétéDAG de tout le dépôt. Ne pas modifier les primitives horsallowlist ni promettre l'absence globale de cycles. Ce n'est pas un waiver du défaut109 : le retour terminal→authority et toute nouvelle boucle vers records/terminal/authority/transition/activation/inventory/store doivent être éliminés. Réutiliser les preuvesbaseline au lieu d'ouvrir un refactor général.
