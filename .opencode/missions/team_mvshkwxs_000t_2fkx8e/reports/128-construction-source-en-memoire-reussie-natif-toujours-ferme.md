# 128. Construction de source réussie en mémoire, natif toujours fermé

## Objectif et résultat vérifié

Produire une source fixture cohérente avec les contrats, sans inventer des faits natifs. Le parent confirme les nouvelles empreintes et le delta exact d'une ligne sur la version de politique ; l'assembleur est inchangé. Les syntaxes du constructeur et du runner passent sans évaluation.

Le troisième calcul de source réussit en168ms. Il lie les29champs de pins avec27blobs distincts, la fonction-modèle déclarée, les deux contrats et la règle de contrôle de241octets. Son statut final est explicitement **SOURCE_FIXTURE_DATA_ONLY_NATIVE_HOLD**. Aucun fichier opérationnel n'est produit.

Les refus antérieurs139ms et149ms restent conservés. Le contrôle réussi n'affaiblit ni la règle de couverture ni l'espace de noms du codec : seules les données incorrectes ont changé. Aucun produit, test ou budget de source supplémentaire n'est modifié.

## Revue et preuves réutilisées

La fermeture de31modules/assets de la revue précédente demeure valable pour les dépendances inchangées. Une reprise indépendante limitée aux deux petits deltas de données et à leurs impacts est demandée. Le résultat d'exécution vient du parent ; le reviewer n'exécute pas de contrôle supplémentaire.

Les cent tests du produit782 ne sont pas rejoués. Ils restent une preuve différente, et ne servent pas de substitut à la vérification des nouveaux documents.

## Suite et obligations ouvertes

La source a seulement existé en mémoire. Il faut la matérialiser dans un namespace neuf, vérifier les octets et recharger les documents séparément avant de revendiquer leur liaison indépendante. La future admission doit embarquer les deux textes exacts et le prompt fixé, avec mesure de son wire complet.

Fences opérationnels, acquisitions authentiques, inventaire, attribution du canary et droits effectifs ne sont pas remplis par les zéros, comptes ou grants de la source fixture. Ces propriétés restent HOLD. Aucun mode direct, session, appel service, travail ou octroi natif lancé ; D5 et réception M2 restent ouverts.

## Preuves

- [Reçu du troisième calcul](../evidence/preparation-source-memory-attempt-3.json).
- Constructeur : SHA2569e97ed7ae3627817d4a79fc5c2292a40695560bc2bf8fd0ed2a58cab7c518b06.
- Manifeste préparatoire : SHA2569163b04d50ccd5a7879e608221272a2e57eeae3f50c9bec1fdfed96958c87d1a.
- Contrôles de syntaxe node --check exit0 ; calcul Bun exit0, sans writer/base/réseau.
