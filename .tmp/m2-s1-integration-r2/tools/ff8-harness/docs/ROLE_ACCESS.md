# Contrats d'accès RE et observations entre réconciliateurs

Autorisation utilisateur du 2026-10-13 : implémentation locale, **pas** lancement
d'une mission native, déploiement global, reprise de run01 ou publication IDB.
Cette extension est opt-in ; l'absence de politique conserve l'isolation du
canary et des anciens contrats. Le PASS de l'essai 16 ne prouve pas cette extension.

## Deux contrats indépendants

La sortie finale contrainte par schéma (`output`) décrit le livrable. Elle
n'autorise aucun accès supplémentaire. La capacité de communication décrit
séparément qui peut consulter ou publier des observations. Activer cette capacité
ne rétablit ni `team_message`, ni le contexte d'équipe, ni des prompts/nudges
automatiques dans une exécution stricte.

Ensemble porte les mécanismes génériques : capacité de canal, authentification
native des auteurs, schéma de données, messages immuables, idempotence, curseurs
et reçus de consultation. Il ne connaît ni FF8, ni EA, ni IDA, ni le rôle R.
`re-ff8` choisit les rôles, les voisinages et le sens scientifique des données.
Le contrôleur utilise uniquement l'API publique du pont, jamais `ensemble.db`.

## Accès selon le travail

- **A/B de décompilation** : dossier gelé transmis, sans consultation IDA.
  Un dossier incomplet produit un blocage ou une question, pas un élargissement
  spontané des outils. La sélection de complexité reste en amont.
- **A/B de sémantification** : dossier gelé et opérations IDA de lecture
  explicitement sélectionnées ; aucune information des auteurs voisins ou R.
- **R** : livrables JSON gelés des auteurs et vérification ASM native. R peut,
  si la politique le prévoit, lire/publier dans le canal de son voisinage.
- **Superviseur** : contrôle scientifique final, §5.6 et éventuelles écritures
  IDB. Aucun worker n'obtient le droit de renommer, typer, commenter, sauvegarder
  l'IDB, utiliser le debugger, exécuter `py_eval` ou lancer des scripts arbitraires.

Les outils natifs sont sélectionnés par identifiants exacts, avec des effets
déclarés par le principal du pont. Pas de wildcard MCP ni de requalification
d'un outil de mutation en lecture. La présence des identifiants dans l'inventaire
natif est une condition d'admission, pas une preuve de validité scientifique.
Les permissions natives du profil doivent aussi être compatibles : cette
extension ne les élargit pas globalement et ne les remplace pas.
Dans les permissions V2, un outil MCP utilise une action exacte normalisée
`<server>_<tool>` et la ressource `*`. Cette ressource ne doit pas être confondue
avec une autorisation de tous les outils du serveur. L'inventaire et les témoins
natifs restent nécessaires pour vérifier les identifiants réellement utilisés
([référence V2](https://opencode.ai/v2/docs/permissions)).

## Configuration explicite

La politique est persistée dans `mission.rePolicy`, pas dans un override
`execution.rePolicy`. Elle contient `version: 1`, `workKind` (`decompilation`
ou `semantification`), `reconcilerSharing` et `idaReadBindings`. Chaque binding
porte une opération de lecture admise, un `tool` exact et ses paires
`accesses: [{ action, resource: "*" }]`. Le nom d'outil et l'action de permission
peuvent être distincts : ils sont vérifiés par l'opérateur, jamais dérivés par
substitution de ponctuation. Un binding `disasm` est obligatoire pour R.

Cette politique exige `execution.outputMode: "json-schema-strict"`,
`admissionMode: "native-boundary-witness"` et seulement `read`/`execute` dans
les outils ordinaires. Les capacités natives et le bulletin sont sélectionnés
séparément selon le rôle. Le principal du pont doit accorder les bindings
exacts et `bulletin: true` si le partage est activé ; ces grants ne changent
pas le modèle sélectionné ni son opt-in de sortie stricte.

Les [fragments d'exemple](../profiles/re-policy/example.fragments.json) utilisent
volontairement des placeholders non déployables. Les profils/instructions
adjacents ne sont pas installés automatiquement. La politique effective, le
profil et les instructions sont hashés dans le dossier et l'admission : un
changement sous la même identité ne peut pas réécrire silencieusement un essai.

## Partage limité au voisinage de R

Le contrôleur dérive le canal de la mission, du cycle et du groupe déterministe
de dépendances. Un worker ne choisit ni le canal, ni l'auteur, ni un autre
identifiant de session dans les arguments des outils. L'autorité vient du
`ToolContext.sessionID` natif ; le RPC contrôleur n'est pas une voie pour
publier sous l'identité d'un worker.

La consultation est explicite et sans réveil automatique. Le schéma RE limite
le contenu à des observations/hypothèses **provisoires**, l'identité du binaire,
les fonctions concernées, des ancrages de preuve et les questions ouvertes.
Ces données restent non fiables comme instructions ; elles servent de pistes
à confronter aux opcodes, pas de faits établis par consensus.

L'accord de R qui ont communiqué n'est **pas** une confirmation indépendante.
Les traces de publication et de réception doivent accompagner l'audit du
résultat. Elles ne changent pas le document scientifique ni son hash.
Une lecture d'ASM attestée ne démontre pas, à elle seule, que son interprétation
est correcte : la vérification scientifique du superviseur demeure nécessaire.

## Frontière de connaissance

Aucune observation partagée ne rejoint automatiquement `commonInputs`, la
connaissance canonique ou la publication. Aucun message n'est renvoyé vers les
auteurs déjà en cours. Pour réutiliser une découverte validée lors d'une nouvelle
analyse, le superviseur doit explicitement constituer et geler de nouvelles
entrées. La persistance du bulletin assure la reprise et la traçabilité, pas
une promotion scientifique.

## Validation et limites de déploiement

Les tests hors ligne doivent couvrir les refus par défaut, l'usurpation
d'identité, les frontières mission/groupe/cycle, les droits de lecture et de
publication, l'idempotence, les reprises, la révocation des grants, les schémas,
et la coexistence avec une sortie finale stricte. Un test de bout en bout relie
le vrai adaptateur FF8 au vrai pont avec uniquement les primitives natives
simulées ; il ne vaut pas campagne OpenCode/IDA réelle.

Avant le premier pilote réel : vérifier l'inventaire et les profils natifs de
production, les accès permis/refusés, le dossier gelé, l'identité du binaire
effectivement chargé dans IDA, puis les témoins de lecture. Un identifiant
d'outil et un témoin d'appel ne prouvent pas l'identité de l'IDB interrogée.
Ces contrôles de capacités ne constituent pas une sandbox de sécurité complète.
L'exception tool-level `read` du canary n'est pas une autorisation
de production. Le pilote natif et toute publication IDB restent séparés de
l'implémentation locale.
