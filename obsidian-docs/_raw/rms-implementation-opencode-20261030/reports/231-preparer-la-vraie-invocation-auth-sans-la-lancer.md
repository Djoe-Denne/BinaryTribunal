# 231. Préparer la vraie invocation Auth sans la lancer

## Objectif et acquis réutilisés

La fenêtre a passé les deux essais factices230. La connexion OpenAI réelle n'a toujours pas été tentée. Le parent prépare maintenant les actes nécessaires pour la réaliser avec les droits courants, un dossier Windows réellement privé et une réception extérieure exacte. Ce raccord sert le petit essai IDA ; il n'autorise pas encore l'envoi de travail.

Le code produit corrigé226, le relais225 et les essais230 conservent leurs preuves versionnées. Aucun nouveau scan ou test général n'est requis par la seule préparation de ces actes.

## Trois candidats d'actes parent

Trois fichiers nouveaux, sous `auth-parent-231/`, sont proposés à la réalisation après un plan court soumis au superviseur :

1. `auth-parent-native-v1.ps1` : phases fermées Prepare/Connect, vérification des pins et marqueurs CreateNew, préparation native du seul dossier Auth neuf et lecture de ses ACL, déploiement CreateNew des deux scripts Auth déjà revus sans toucher193/219, puis lancement séparé des actes Bun par ProcessStartInfo à environnement fermé.
2. `prepare-auth-controller-v1.mjs` : préparation prospective sous même propriétaire et même compte RMS, contrôles de continuité de la base existante et acquisition explicite d'un nouveau fence. Aucune nouvelle identité parent, origine, acquisition de slot, grant ou réactivation170. Émission de la seule requête Auth fermée liée au UUID de dossier préalloué.
3. `receive-auth-parent-v1.mjs` : fenêtre privée prête avant lancement, possession directe du véritable enfant RMS Bun, liaison IPC immédiate, réception asynchrone bornée et FINALOUTCOME extérieur. Aucun credential lu, copié ou hashé.

La génération de ces candidats peut être déléguée au constructeur existant, sans lui déléguer leur exécution. Le superviseur seul les ratifie, déploie et lance. Les scripts parent historiques restent intacts. Aucun nouveau service, store, moteur ou framework de test.

## Contrôles d'autorité et confidentialité à préserver

Avant effet, vérifier les pins du produit et de l'interface, le vrai fichier RMS, les décisions parent immuables et le contrôleur courant. La préparation doit prouver que seul le bail change ; son token n'est pas une origine. Le dossier privé neuf doit être réel, vide, non lié et créé atomiquement avec une ACL Windows protégée pour utilisateur courant, SYSTEM et administrateurs. Lire les droits réels avant lancement et après exécution ; ne pas remplacer cette preuve par un drapeau JSON ou chmod0700. Aucun changement de droits du reste de180.

La requête a une échéance réelle au plus240secondes après sa préparation. La réception conserve cette échéance et mesure la durée entière ; ni UI, import, boucle de statut ou fermeture ne la réinitialisent. Chaque invocation native reste sous dix minutes. Sans interface vivante ou autorité valide, pas de CONNECT ; réponse perdue ou état engagé ambigu, pas de second POST automatique.

Le receiver ne persiste jamais les messages IPC privés, challenge, réponse HTTP Auth brute, headers ou erreurs importées. Sa sortie publique est strictement validée avant conservation. La base Auth n'est inspectée que par métadonnées de fichier, jamais par SQL, copie ou hash intégral. Les logs Auth jetés ne deviennent pas des preuves de contenu.

## Réception et continuité

Le résultat exige une fin réelle de l'invocation, exit0, délai entier respecté et aucun message d'invalidation, ainsi que les empreintes exactes du candidat public et de son reçu provisoire. L'identité native du processus est rapprochée de l'intention durable, de son programme, de son scope et du contrôleur. Le provisoire seul n'est pas adoptable.

Les mutations Auth autorisées de la base RMS sont limitées aux événements propres à l'intention et à leur curseur. Les préfixes historiques doivent être intacts ; schéma, autres tables, roots, débits, origines, grants et autorité parent inchangés. Source EventLog actuelle relue : append ne modifie que ff8_events et ff8_graph_streams. Les nouveaux événements sont rapprochés exactement de cette invocation et de leurs digests, pas simplement comptés.

COMPLETE ne signifie que connexion persistée par le runtime. Cela ne confère aucun modèle disponible, financement, droit d'envoi, auteur ou publication. Un état expiré ou perdu peut avoir engagé un effet ; conserver ce fait sans rollback fictif ou adoption tardive.

## Gates et suite

Le constructeur commence par un plan compact de fichiers/consommateurs/permissions et limites, sans code avant ratification du superviseur. Ensuite seulement candidats gelés, inspection des imports et sélection fermée, vérifications ciblées et revue indépendante avant toute exécution. Aucun OAuth, fenêtre supplémentaire, ACL, base réelle, déploiement ou acquisition de bail par l'auteur.

Ce contrat ne lance pas de connexion et ne réclame pas de GO intermédiaire à l'utilisateur. Si la validation du compte par l'utilisateur devient nécessaire au lancement réel, elle se fera sur la page officielle depuis la fenêtre privée, sans transmission de mot de passe ou token à l'agent. Le scénario IDA et M2 restent ouverts.

## Plan reçu et ratification de réalisation

Le plan10points du constructeur respecte les trois fichiers, la séparation Prepare/Connect, les contrôles de continuité et la réception sans secrets. Le parent le ratifie pour l'écriture seule des trois nouveaux candidats. Aucun fichier produit, interface225 ou ancien acte parent ne peut être modifié. Le constructeur livre ensuite les pins et s'arrête ; il ne lance ni syntaxcheck, test, interface, API, base, opération ACL ou déploiement.

Pour le seul root Auth neuf, une création Windows exclusive portant la DACL protégée dès la création est retenue. Un petit appel natif CreateDirectoryW/SECURITY_ATTRIBUTES intégré au PS est admis si l'overload .NET ne garantit pas le refus d'une cible préexistante ; aucun DLL ou helper externe, installation, changement global ou privilège supplémentaire. L'implémentation et sa permission effective seront revues avant toute exécution. Le booléen de lecture ACL dans un reçu ne remplace pas la lecture native réelle ; une erreur ou un refus bloque l'acte concerné sans réparation ou autre chemin implicite.

Le fence courant reste une précondition native explicite à vérifier ; le dernier observé5 n'est pas présumé encore valide. La préparation du bail ne peut se transformer en reprise automatique si une précondition manque. Les erreurs du nouveau lanceur doivent toutes maintenir HOLD : les contrôles de pins, fin et drains sont acquis seulement après leur exécution complète, selon le correctif229 déjà reçu.

La version actuelle du helper UI et le bootstrap Auth sont épinglés ; leur réussite factice n'autorise aucune nouvelle réponse opaque ni capture de message privé. Les sélections de QA seront fermées après livraison et lecture des imports/effets, sans suite globale implicite.
