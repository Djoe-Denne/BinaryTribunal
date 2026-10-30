# 162. Candidat d'adresse isolé, prêt pour revue

## Réalisation et isolation

Le parent a créé un worktree possédé distinct, basé exactement sur782, et y a appliqué la petite correction préparée à partir du plan reçu. L'ancien worktree et ses fichiers gelés restent intacts. Aucun code corrigé n'a encore été compilé ou exécuté.

La correction porte sur trois fichiers : un petit matcher interne pur, les deux appels concernés du client et les régressions dans le fichier de tests existant. Le fichier interne est retenu plutôt qu'un nouvel export du client : le test peut appeler le même code que la production sans exposer l'émetteur ou le compositeur privés. Il ne crée pas de schéma ou contrat persistant.

## Garantie de comparaison conservée

Le matcher valide l'identité source, contrôle les bornes exactes de l'adresse avant conversion et exige une adresse native numérique entière sûre, positive,32 bits. Il compare ensuite les **objets originaux complets**, en changeant seulement l'adresse dans une copie temporaire de la source. La validation ne sert pas à supprimer les champs supplémentaires avant comparaison.

Les hashes et versions restent stricts ; aucun objet fourni n'est modifié. Les contrôles de racine, rôle, passe, cap et débit autour du matcher ne changent pas. Le matcher est partagé par les deux passages source→natif ; les autres domaines ne sont pas modifiés.

## Vérification fermée

Une revue indépendante ciblée des bytes et oracles est engagée. Après avis, les commandes prévues depuis ce même candidat sont :

1. bun run typecheck.
2. bun test ./test/client.test.ts --test-name-pattern 'RMSN-ADDRESSBRIDGE|RMSN- parent library import exposes no issuer/composer'.

La sélection contient27cas RAM d'identité et le contrôle existant des exports privés. Les tests ne reproduisent pas la formule du matcher pour calculer leurs attentes : les positifs et négatifs sont littéraux, et les entrées sont comparées à leur copie après contrôle. Aucun corps sélectionné n'appelle une base, le service ou un transport. Les imports acquis sont conservés ; seul le module pur interne est ajouté.

Les dépendances déjà installées sont réutilisées par une jonction locale du nouveau node_modules vers le cache existant du candidat gelé. Aucune installation réseau ou modification globale. Chaque commande sera bornée à dix minutes. Les autres preuves restent réutilisées selon leur impact.

## Annexe technique et état

- Worktree : C:/Users/djden/.local/share/opencode/worktree/68ae5f/rms-native-address-bridge-160 ; branche rms-native-address-bridge-160-candidate, base782ec396a2a7866d30645c32ca8ab864dcca5960.
- Préimages vérifiées : client62336/SHA2116b8e1638126f2b5a21f1aa4c5ba22dac07c903f2ffb0f9a970d63f6178a7c ; test105926/SHAfc489e7e2f34235d4c60d89991814689802c4e53bcdc5f8541cca07863f9dd79.
- Matcher interne :1052octets, SHA256 c4c8693c4441173f6101902bc2b1cdae4fdfcaab8ffbc4ac7439d56871812678.
- Client corrigé62318/SHA7c4ccbea23a41f3c99d7bafc4e6486268553f66e189c6501314d04cdc7cb329f.
- Test109669/SHA87ed14412b51ad9432a483d83d032c4e12519d5afb7055a7c4de55401bea4931.
- Statut Git : deux fichiers modifiés et un nouveau, exactement le périmètre ; aucun commit ou merge effectué. Le parent possède l'intégration après QA.
- Le constructeur continue uniquement les deux candidats locaux et le correctif de délai161 dans son worktree original. Aucun stage ou effet natif nouveau.
