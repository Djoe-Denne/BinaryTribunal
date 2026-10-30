# 160. Correction compatible du pont d'adresse autorisée

## Décision

La revue indépendante confirme le défaut de comparaison et localise un second passage immédiat entre les mêmes représentations. Le parent ratifie une correction limitée à **client.ts et son fichier de tests existant**. Le constructeur peut produire un candidat corrigé distinct ; il n'exécute aucun test, appel natif ou commande Git.

Le produit782 reste conservé comme base gelée et ses preuves gardent leur portée historique. Les sourcesV3, documents de première acquisition et permissions ne seront pas réécrits pour faire passer le contrôle. Le nouveau candidat recevra ses propres empreintes et vérifications avant tout usage.

## Contrat de correction

Le pont compare exactement une adresse hexadécimale source à une adresse numérique native. Les deux doivent représenter un entier strictement positif dans le domaine32 bits. La borne source est contrôlée avant toute conversion numérique ; aucune troncature, approximation ou conversion permissive de chaîne native.

La comparaison des identités complètes conserve strictement le hash de module, la version et les champs ; seule la représentation temporaire d'adresse change. Aucun objet fourni n'est modifié. Les contrôles de racine, rôle, passe, cap et débit restent actifs. Les comparaisons déjà effectuées dans un même domaine ne changent pas.

Une petite garde pure testable est permise, mais ni l'émetteur d'autorité ni le compositeur privé ne doivent devenir accessibles par import. La régression devra appeler la garde réellement consommée par la route, pas recopier sa logique dans un test.

## Vérification affectée prévue

Après inspection des nouveaux bytes et revue ciblée : compilation TypeScript depuis le candidat possédé, sélection exacte des nouvelles régressions et contrôle existant de non-exposition des fonctions privées. Les cas couvrent l'égalité réelle observée, les mauvaises adresses ou identités, les types invalides, fractions, valeurs hors borne, invariance des entrées et maintien des refus de limites.

Les tests acquis non affectés sont réutilisés ; pas de rejeu automatique des100cas, des primitives ou des clusterisations. Pas de suite globale, chemin threads, diagnostic gelé ou cas à quatre origines. Les tests autorisés restent bornés à dix minutes chacun. Le plan sera resserré sur les noms exacts livrés avant exécution.

## Preuves et état

- Avis indépendant : result_mvuu17en_003f_bzr7kf, msg_18c5c0fa2001xDZtrAzK3S5SpE.
- Défaut principal client636–638 ; passage immédiat supplémentaire458–459. Comparaisons numériques GraphStore822,860–861 et hexadécimales prepare inchangées.
- Source : domain.ts7, validation.ts45–53 ; natif : graph-store481,541–543.
- Les tests actuels client.test.ts291–320 passent directement par GraphStore et ne couvraient pas la garde637. Le test278–289 vérifie déjà les frontières d'import privées et sera pertinent pour l'impact d'un helper pur.
- Recherche exacte des usages dans le worktree : compositeur privé défini et appelé uniquement dans client.ts ; test existant exige son absence des exports. Limite Serena : le worktree candidat non intégré n'est pas présumé reflété dans l'index canonique.
- Réalisation du raccord local et ajustement source158 continuent en parallèle, sans possession ou activation. Aucun correctif déclaré validé avant ses résultats.

## Réception parallèle du raccord local

Le candidat local intégrant le référent source158 est reçu et ses empreintes sont contrôlées par le parent : module37378octets/SHA5094911410706b55458215630071724fdf785d1e5d7f4f3b8fbfeb445688ac8f, manifeste21234/SHA8ce8dd5bb076e6649e81fa408929cc7c99c28981b2340f127fece0da8de5aa07. Il est en revue statique, sans import ni exécution.

Le libellé local distribution-associated-source-archive est accepté pour désigner exactement le sens ratifié158. Le lecteur d'archive est borné à son fichier réel et ne renvoie que son empreinte, pas ses82Mo de données ; la limite des documents JSON et le plafond REST demeurent distincts. La décision158 elle-même est relue :2106octets/SHA11426276ab3a23714e615947529c47979a92cd73a6c716a0cef4ff18e82b1675.

Ce candidat conserve encore le refus lié au défaut d'adresse du produit782. Sa garde et ses pins devront être raccordés au candidat corrigé accepté, pas désactivés pour faire fonctionner l'ancien. La livraison locale n'est donc pas une preuve d'activation possible.
