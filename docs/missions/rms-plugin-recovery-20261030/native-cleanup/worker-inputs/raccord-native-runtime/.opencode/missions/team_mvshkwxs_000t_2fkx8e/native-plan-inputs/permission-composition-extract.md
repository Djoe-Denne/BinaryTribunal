# Composition des permissions — sources publiques épinglées 2.2.1

Commit public : `3ebcf9a32c7b28f658cfee80775448929361727a`. Fichiers et hashes : `public-native-rights-2.2.1/manifest.json`. Lecture statique seulement ; aucune équivalence avec le binaire courant ni permission réellement exercée prouvée.

## Chemins vérifiés

`packages/core/src/session.ts:27` importe `SessionRunner` depuis `./session/runner/index.js`. Cet index ne contient que le contrat du service, pas l'implémentation de l'évaluation des permissions.

`packages/core/src/session/runner/step.ts:16` importe `Permission` depuis `../../permission.js` ; le runner LLM avertit qu'un appel d'outil pendant reload lit l'agent de session (`runner/llm.ts:291–292`). Une ancienne lecture du profil n'est donc pas une garantie universelle de droits futurs.

## Ordre de composition constaté dans core/src/permission.ts

- Ligne19 : agent introuvable → règle `*/* deny`.
- Lignes74–83 : `evaluate(action,resource,...rulesets)` aplatit les listes, prend la **dernière** règle correspondant par `Wildcard.match` aux deux champs ; défaut `ask`.
- Lignes86–87 : `merge` est une concaténation, pas une intersection ou un OR.
- Lignes137–145 : les permissions sauvegardées du projet sont projetées en règles `allow`.
- Lignes147–152 : charger la session, résoudre l'agent explicite ou celui de session, puis concaténer permissions agent et permissions session.
- Lignes154–167 : si l'évaluation des règles configurées donne deny pour une ressource, retourner deny immédiatement. Sinon ajouter les règles saved ; une ressource ask donne ask globalement, sinon allow.
- Lignes168–177 : déclencher ensuite le hook plugin `permission/evaluate`, qui reçoit l'effet et peut retourner `event.effect` et un message. Il n'est pas appelé sur la branche deny anticipée ci-dessus.
- Lignes216–221 : `ask` traite l'effet ; une demande est créée pour ask. La liste des demandes n'est pas l'évaluation des règles.
- Lignes225–232 : le chemin assert redemande evaluateInput et bloque deny.

## Conséquences de preuve

Ne pas écrire un évaluateur produit prétendument équivalent depuis les seuls DTO profil/session/saved : wildcard, plugins, changements d'agent et règles non capturées doivent être couverts. Les sources publiques expliquent la composition mais ne prouvent ni le code chargé du serveur, ni son état courant, ni les hooks réellement actifs.

Pour la qualification, conserver les décisions parent locales, faits authentifiés du service et preuves d'actions réellement permises/refusées comme domaines distincts. Un enabled de catalogue, une liste pending vide, le time.updated d'une session ou un fichier JSON ne remplace aucun de ces domaines.

Aucun appel service, injection de permission, réveil de canary ou modification de configuration effectué pour cette extraction.
