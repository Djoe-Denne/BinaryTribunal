# 218. Contrôle du seul correctif de chemin Windows

Le correctif217 est reçu sous forme de trois fichiers gelés. Le parent a recalculé les cinq empreintes et comparé le delta à la copie214 : un petit matcher de chemin complet, son appel dans la garde READY réelle et un test dans le fichier existant. Aucun autre comportement du client n'est modifié par ce delta.

Le matcher accepte uniquement les chemins Windows absolus complets et compare casse/séparateurs. Il refuse les formes relatives, URL, autre disque/répertoire/exécutable et formes ambiguës. Il ne lit aucun fichier et ne prétend pas prouver une identité OS ; les contrôles privés de handle et d'octets restent inchangés.

## Contrôles fermés autorisés

Depuis le candidat198 :

- `bun run typecheck` ;
- `bun test test/runtime-binding.test.ts --test-name-pattern '^RMSN-OWNED-RO READY executable matches only equivalent full absolute Windows paths$'`.

Un seul test est attendu, sans échec ou timeout, avec vérification des cinq pins avant/après chaque commande et reçus dans `qa-owned-runtime-218`. Le test n'appelle ni chemin réel, base, processus ou réseau. Aucun nouveau module n'est importé : seul le helper DATA du module déjà chargé est ajouté. Borne dix minutes par invocation, sans retry automatique, aucun test global.

Les dix tests214 et le contrôle complet de fichiers216 restent des preuves versionnées des parties inchangées, non rejouées pour ce delta lexical. Un nouvel essai réel conservera néanmoins sa propre vérification fraîche des fichiers avant tout enfant. La revue indépendante reprend uniquement cette correction et son impact. Aucun hôte, modèle, origine ou accès IDA supplémentaire n'est autorisé par cette QA.

## Pins courants

- client97884/SHA `ee73236466ebb0ecec0ce591db9b3d9166e63b97262069d7e48d76865bc6d9b8`.
- binding29490/SHA `22a14a1de33afb6fc47bc07d9e6b250839e0afc0b68321f7323541e2e0e364a5`.
- tests binding23011/SHA `d887a38517e8d09726f52dd2a976dcb57b06a21a874cbc5d357dc87194eeacdc`.
- transport54d35747 et tests client35d881db inchangés ; valeurs complètes dans les reçus.

L'essai216 reste HOLD ; le petit essai complet avec IDA et M2 restent ouverts.

## Résultats réels

Le typecheck réussit en4004ms. L'unique test de chemin réussit :69assertions,103ms de collecte parent (78ms Bun), zéro échec ou timeout. Treize autres cas sont filtrés et non exécutés.

Les cinq pins sont identiques avant/après chaque commande. Les deux reçus et logs sont conservés dans `qa-owned-runtime-218`. La revue limitée reçoit ces preuves sans les rejouer ; son avis reste attendu avant réception du correctif. Aucun scan complet ou nouvel hôte n'est lancé par cette étape.
