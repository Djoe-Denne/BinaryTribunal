# 93. Contrat natif : invariants retenus, jonction encore à préciser

## Objectif et état

Relier réellement les préparations RMS à une exécution native attribuable, puis aux résultats et à la publication, sans confondre données observées et autorité. Le candidat de contrat est reçu. Les règles de sûreté sont retenues, mais le contrat n'est pas encore fermé : le propriétaire de génération/budget v3, sa jonction avec l'exécution et la projection restent renvoyés au futur auteur.

Le superviseur poursuit cette fermeture dans la même tâche de recherche, sans nouvelle étude générale, session redondante ou GO utilisateur. Aucun code de raccord ni effet natif n'est autorisé par ce constat.

## Constats corroborés par le superviseur

- Les méthodes runtime du client refusent toujours l'exécution et l'observation.
- Le binding v3 existant est une préparation DATA : références de qualification et de politique de projection nulles ; la vérification exige son image exacte. Il ne peut être activé en remplissant arbitrairement ces références.
- L'observateur au repos exige une admission PREPARED jamais émise, sans reçu ni témoin terminal, et refuse actuellement un travail obsolète. Il ne peut donc pas être renommé ou réemployé tel quel comme observateur d'une exécution envoyée ou d'un résultat tardif.
- Le serveur courant annonce2.2.1. Les références natives au repos figées sur2.1.4 restent des preuves historiques, pas une qualification de ce serveur.

## Invariants retenus pour la fermeture

Préretenir les identités, profils, Model.Ref, droits/localisation, images et jointures exactes avant effet. Séparer les digests de payload, admission, body client et octets réseau. Une future route REST doit avoir une référence wire explicitement versionnée ; `rpcBodySha256:null` du contrat historique ne devient pas un digest REST.

Une réponse perdue entraîne uniquement un rapprochement des mêmes identités ; ni second prompt, nouvel essai ou nouvelle origine implicite. Une absence instantanée ne prouve pas un rejet définitif. Notifications facultatives ordonnées avec mode de non-réveil explicite et reçus distincts : reçu RMS, admission native, lecture/application de l'agent ne sont pas interchangeables.

L'observation tardive doit rester possible sous ownership conservé, sans réautoriser le résultat. Une fin légitime exige des témoins positifs attribués au bon travail et intervalle ; l'obsolescence seule suffit à interdire l'usage, pas à libérer une ressource physique.

## Complément demandé dans la tâche actuelle

1. Mapping exact des propriétaires et API de génération/budget/fences/exécution v3 et leur relation au stockage existant, sans promotion de handles fixture en autorités natives.
2. Types et versions persistés nécessaires, références de qualification/projection : qui les produit, sur quelles preuves, qui les consomme, et quelles refusantes restent fermées tant que la preuve manque.
3. Observateur runtime distinct du v1 au repos, avec conditions d'observation envoyée/obsolète séparées des conditions d'utilisation scientifique.
4. Découpage sans dépendance circulaire : le petit couplage natif peut être qualifié avant les nouveaux contenus v3 seulement si sa portée et ses inputs sont explicitement distincts ; sinon préciser la dépendance réellement indispensable, pas contourner l'ordre.
5. Plan de fichiers, objets versionnés et tests exacts avant toute réalisation.

Le complément est en lecture seule et reste dans le mandat approuvé. Les permissions et preuves natives manquantes ne sont pas remplacées par une décision de conception ; les arrêts historiques restent maintenus. Les recherches peuvent fermer les contrats, pas prouver le comportement du serveur.

## Traçabilité

- Contrat récupéré par lecture native bornée : session `ses_e76fe00c8ffecFIDm69GY1zfH9`, finale détaillée `msg_189076820001aCXmOref9RmfS4` ; accusé outil `result_mvtwtalj_0003_8xuf6o` ne contenait que la confirmation de version.
- Lectures parent : `graph-runtime-binding.ts:22–29,49–72`, `client.ts:58–81`, `graph-store.ts:370–392` sur le commit intégré `9c1b6aa`.
- [Intégration précédente et conditions de version](92-commandes-obsolescence-integrees-et-recues.md).
