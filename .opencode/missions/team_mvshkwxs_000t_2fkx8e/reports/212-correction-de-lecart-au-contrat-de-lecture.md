# 212. Correction de l'écart au contrat de lecture

## Livrable reçu, pas encore recevable

Le constructeur livre trois fichiers gelés avec vérification par lots et progression. Le parent vérifie leurs empreintes et lit le chemin de lecture : il contient un nouveau lecteur par descripteur, avec open, fstat, lectures partielles et sonde EOF.

Ce chemin ne correspond pas à l'arbitrage211, qui conserve readFile et annonce explicitement une borne d'admission nominale, sans nouvelle garantie stricte d'allocation. Le lecteur ajouté introduit des API et obligations de vérification supplémentaires dont la correction locale n'a pas besoin. Il n'est donc pas accepté au seul motif qu'il est déjà réalisé. Un décalage de livraison des instructions reste possible ; il n'est pas traité comme une nouvelle décision à demander à l'utilisateur.

## Correction bornée décidée

Le parent demande uniquement de remplacer ce nouveau lecteur par readFileAsync avec le signal d'annulation, entre les mêmes contrôles asynchrones BigInt et de chemin avant/après lecture. Le hash de tous les octets, la longueur réelle, l'identité, les horodatages et les refus doivent être conservés. Les lots, les gardes d'autorité/délai et le suivi des lectures en vol restent requis.

Les commentaires et compteurs doivent distinguer les tailles déclarées réservées des allocations réelles. Les deux oracles proposés restent dans le fichier existant ; leurs assertions propres aux descripteurs, EOF et garantie mémoire stricte sont retirées, pas les contrôles de contenu, d'identité ou de HOLD après une fin tardive.

La correction est limitée aux trois mêmes fichiers. Le constructeur ne lance aucun contrôle. Le parent vérifiera le nouveau gel avant toute QA ; aucune revue générale, nouvel essai natif ou nouvelle étude n'est nécessaire pour décider ce seul écart.

## Conservation des preuves

Les trois pins de cette livraison ont été recalculés et correspondent au retour du constructeur. Les sources sont préservées dans `evidence/rejected-fd-delivery-211` avant correction, sans base ou autorité copiée : client2978e5a1, binding7c8ee20f, tests9cb1af76 (empreintes complètes dans le retour source).

**Aucun typecheck, test, import applicatif, scan, serveur ou effet natif n'a été exécuté sur ce gel.** Aucun PASS n'en est revendiqué. Les preuves203 et les HOLD207/209 restent inchangés ; la qualification directe et M2 restent ouverts.
