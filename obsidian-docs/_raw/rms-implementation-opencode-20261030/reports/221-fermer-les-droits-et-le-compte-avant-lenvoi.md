# 221. Fermer les droits et le compte avant l'envoi

## Étape actuelle

Le lanceur en lecture seule est acquis220. Le constructeur propose maintenant le raccord d'envoi, de résultat et de publication. Le parent en reçoit le plan, mais ne ratifie pas encore globalement les sept fichiers : deux points concrets doivent être corrigés avant le code, pour ne pas fabriquer des droits ou réutiliser un compte hors de sa portée.

Le cap reste le petit essai avec les données IDA retenues. Ce contrôle porte sur les préconditions nécessaires à cet essai, pas sur une nouvelle étude générale ou une demande de GO intermédiaire.

## 1. Compte historique et nouvelle entrée IDA

La lecture du code actuel montre que l'acquisition root ne peut pas être remplacée lorsqu'une décision existe déjà. Un permis exige aussi une acquisition non expirée et la même fonction/le même rôle. Le plan ne peut donc pas annoncer qu'une nouvelle entrée IDA utilisera simplement les droits actuels : le seul slot acquis concerne l'ancienne fonction construite pour la qualification, pas FF8.

Le parent demande le contrat additif minimal séparant les faits d'acquisition immuables et une nouvelle délégation courante. Il devra préserver les débits et l'origine déjà comptée, sans réactiver170, rembourser un slot consommé, réécrire la qualification ou créer artificiellement un autre root pour esquiver le plafond. Les deux origines restantes ne sont toujours ni démontrées insuffisantes ni automatiquement financées.

## 2. Accès OpenAI de l'hôte isolé

Les sources offrent des mécanismes de connexion, mais l'hôte isolé n'a pas encore de canal d'authentification OpenAI établi dans la portée autorisée. Un modèle déclaré disponible ne suffit pas. Les API qui listent ou créent des credentials peuvent renvoyer leur valeur : elles ne sont pas appelées pour diagnostiquer ce point.

Le type « External » ne prouve pas à lui seul qu'OpenAI propose une connexion sans secret transféré. Le parent demande une vérification des mécanismes publics effectivement disponibles et de leur éventuelle action humaine nécessaire, sans lecture/copie de token, fichier d'authentification, variable secrète ou modification globale. Aucune connexion ou demande de modèle n'est lancée.

## Autres points corroborés et suite bornée

Le parent a vérifié dans les sources publiées que l'événement durable session.created peut contenir agent, modèle, emplacement, permissions et métadonnées. La preuve positive après création reste donc à construire et tester : une option events.persist seule n'en tient pas lieu.

L'option publique simulation a également été regardée, sans l'exécuter. Sans un environnement Drive supplémentaire, elle ne remplace que la réponse au catalogue des modèles ; avec Drive, elle dépend d'un backend simulé. Elle n'est ni une preuve de droits OpenAI ni un raccourci autorisé vers une qualification native. Aucun service de simulation supplémentaire n'est créé.

Le constructeur complète seulement ces deux points du contrat en lecture seule. Aucun fichier produit, bootstrap, base, compte, serveur, modèle ou IDA n'est modifié par cette préparation. Les acquis220 ne sont pas rejoués. Les autres parties du plan restent des propositions, non une activation de l'envoi.

## Références techniques ciblées

- Candidat198 `graph-store.ts:837–865` : acquisition existante et fonction/rôle/expiration exigés avant permis.
- Sources180 `@opencode/schema/dist/session-event.js:27–53` ; `@opencode/server/dist/options.d.ts:13–39`.
- Handlers credential `media-uri-be53s2qz.js:10–22,36–43` : réponses comportant value ; schéma credential:22–55.
- Plugin OpenAI `credential-1hayz8ad.js:169–184` : résolution de connexion et méthodes OAuth enregistrées.
- Source serveur `media-uri-3t6z87e1.js:147–150` et simulation/backend/index.js:11–26 : portée réelle de simulationReplacements.

Les lectures sont statiques, non secrètes ; aucun import, appel d'API, effet ou nouveau test. La mission et M2 restent ouverts, sans déclaration de blocage global ou d'impossibilité prématurée.
