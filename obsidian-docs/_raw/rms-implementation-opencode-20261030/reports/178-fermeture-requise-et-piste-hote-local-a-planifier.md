# 178. Fermeture requise ; piste d'hôte local à planifier

## Décision après revue

La revue indépendante confirme le critère bloquant : fermer la tranche du tour contre les inputs concurrents et les mutations pertinentes depuis sa baseline. Un témoin d'epoch natif universel, une défense contre tout acteur OS ou une quiescence permanente ne sont pas imposés.

La provenance des commandes parent et le deny-all de l'enfant ne prouvent pas à eux seuls cette fermeture sur le serveur desktop partagé. Le parent ne les transforme pas en garantie d'exclusion des autres clients. Le témoin par projections reste donc non ratifié ; aucune attestation ou publication ne peut s'appuyer sur lui à ce stade.

## Vérifications supplémentaires sans installation

Le parent a testé la résolution de @opencode/sdk et @opencode/server/process depuis quatre racines connues : le candidat harness, la configuration OpenCode, ses données locales et la racine source commune. Les deux packages ne sont pas résolus dans ces périmètres. Aucun module applicatif n'a été importé ; ce n'est pas une preuve d'absence globale sur le disque.

Les métadonnées publiques npm montrent cependant des distributions exactes2.2.1 pour les deux packages. Le parent a aussi relu l'export source ServerProcess.start : il accepte ServerOptions, exige un mot de passe et peut ouvrir un listener local. Cela établit une surface publique à planifier, **pas un lanceur installé, testé ou déjà autorisé à démarrer**.

## Suite retenue

Préparer le plan minimal d'un hôte possédé à accès limité, avec base distincte et journal retenu, en réutilisant cette surface publique plutôt qu'un changement global du desktop. Avant réalisation, le plan doit fermer les dépendances exactes, la provenance, les permissions, le cycle de vie et les critères de vérification. Le coût et l'ampleur ne sont pas encore établis.

**Aucun téléchargement de package, installation, script de dépendance, serveur, port ou requête fournisseur n'est engagé.** Une installation réseau ne sera pas faite implicitement. Le parent vérifiera le plan et ses limites avant de décider un delta exécutable dans le mandat, ou de constater la limite précise restante. Aucun nouveau GO de routine n'est demandé.

Cette préparation ne réactive pas les droits expirés et ne remet pas les compteurs à zéro. Une future opération garderait sa comptabilité d'origines et ses prérequis propres. L'ACK170 et ses limites restent inchangés ; les scénarios interdits restent hors périmètre.

## Preuves

- Revue result_mvv04j9s_004i_3qxho2, message msg_18cf58de1001fIJw5aCKF7hEMv ; lecture source/contrat et corroborations176 réutilisées, sans nouvelle exécution.
- Archive157, packages/server/src/process.ts49–61 : ServerProcess.start(options:ServerOptions), mot de passe obligatoire, listener ; package/server/package.json exporte process. Corroboré parent.
- Registre public : @opencode/sdk2.2.1 et @opencode/server2.2.1, réponses HTTP200. Métadonnées seules, aucun tarball récupéré.
- Le SDK exige notamment effect4.0.1 et les packages @opencode2.2.1 ; le serveur ajoute @effect/platform-node/shared4.0.1. Résolution et isolation de leur graphe restent à fermer.
- Contrôles acquis, sources et runtime340 inchangés ; aucune origine supplémentaire et aucun M2 accepté.
