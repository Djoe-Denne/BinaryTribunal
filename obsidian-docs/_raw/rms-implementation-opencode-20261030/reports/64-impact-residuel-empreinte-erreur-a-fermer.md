# 64. Dernier impact de correction identifié : valider l’empreinte d’erreur

## Verdict et décision

La reprise indépendante confirme que les trois défauts initiaux sont corrigés dans le code. Elle découvre toutefois un impact direct du nouveau chemin de réponse reçue mais refusée : la classe d’erreur publique accepte une chaîne quelconque, ensuite persistée comme empreinte sans validation.

Un transport injecté peut ainsi fournir `SECRET-demo` au lieu d’un SHA-256. Le parent retient ce défaut comme bloquant : le contrat interdit de journaliser une erreur distante brute. Le candidat reste non intégré.

## Correction fermée

Au point de consommation, capturer la valeur une seule fois et n’accepter qu’une chaîne SHA-256 hexadécimale de64 caractères. Toute autre valeur devient une observation inconnue avec empreinte nulle, sans journalisation brute. Une validation du seul constructeur ne suffit pas pour les objets injectés ou modifiés.

Une régression ciblée doit vérifier l’absence de la chaîne malformée dans le journal, en conservant le cas légitime à empreinte valide. Pas de nouveau harnais ni révision d’architecture. Même auteur, puis contrôles affectés parent et reprise de la même revue sur ce défaut et son impact seulement.

## Preuves conservées

Les22 tests/251 assertions et quatre régressions historiques/24 assertions restent valides dans leur portée ; ils ne couvrent pas cette entrée malformée. Les55 primitives inchangées restent réutilisées. Aucun test ou réseau exécuté par le reviewer, aucune preuve d’exécution native nouvelle.

Avis récupéré : `../evidence/ses_e782236a4ffeQSg60nGCm9uyn6-native-finals-bundle-r2.json`, message `msg_187f230840011Dr3SFAQFzfLsC`, SHA256 texte `a3481b5a339d493445005e277571aac82ff00ecd0d70f90deecbb3f6fcfe24d5`. Références : `graph-native-at-rest.ts:31,88–90` au pin `0c6d228a`.

## Correctif vérifié, préservation contrôlée avant intégration

Le pin `1a09039d4cc2a5c50151f9dcdda691c204a060a8` corrige seulement le module et ses tests. Le parent a lu la capture unique et la validation stricte sous try/catch. Quatre régressions couvrent chaîne malformée, getter hostile, prototype hostile et HTTP403 simulé à empreinte calculée.

Compilation sortie0/3420ms ; **26 PASS,295 assertions**,2034ms. Les sources restent intactes, aucun réseau natif. Primitives et quatre régressions historiques inchangées sont réutilisées. La reprise indépendante est demandée sur ce seul défaut et ses impacts, pas une nouvelle revue générale.

Prémerge parent :368 sources épinglées identiques, exactement quatre fichiers de delta, onze modifications utilisateur préexistantes identiques à leurs empreintes antérieures, aucun chevauchement, index vide. Le candidat reste non intégré tant que le verdict n’est pas reçu. Preuves : reçus r7 et `at-rest-premerge-r7.json`.
