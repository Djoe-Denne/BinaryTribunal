# 176. Témoin de tour positif, mais liaison causale non fermée

## Décision

La proposition initiale « transcript à un input et session succeeded » n'est pas suffisante. Le message persisté idle/succeeded apporte un vrai fait positif de fin de tour, mais ne ferme pas à lui seul la liaison historique input→assistant.

Le parent **ne ratifie pas encore le témoin prospectif pour ouvrir une attestation ou une publication**. Les primitives sont identifiées ; leurs prérequis restent à prouver. Aucun code ou effet n'est engagé et aucune preuve170 n'est convertie rétroactivement.

## Éléments positifs

Les sources décrivent une projection du message utilisateur lors de la livraison de l'input exact, puis une projection terminale de tour. Les projecteurs et la séquence sont modifiés dans la même transaction. Le marqueur de tour n'est pas produit par un simple shutdown et n'est pas assimilé à une quiescence permanente ou à une libération de ressources.

Une pagination exhaustive devrait conserver les curseurs natifs opaques et continuer jusqu'à une page vide. Une page plus courte que la limite ne suffit pas : le handler source renvoie next pour toute page non vide. Ces contraintes seraient propres au futur collecteur borné, pas une invitation à refaire des GET maintenant.

## Manques précis et corroboration parent

L'assistant source ne porte pas de champ causal direct inputID/inReplyTo. L'invariant d'un tour à un seul input doit donc être réellement fermé, pas déduit du seul état final.

Le parent a relu transfer.ts64–72 : l'import refuse un identifiant de session déjà existant. Cela renforce une création fraîche observée ; cela ne prouve pas l'absence de suppression/recréation ultérieure. L'import peut aussi restaurer le temps de création d'origine, donc ce timestamp n'est pas, seul, une identité d'epoch infalsifiable.

Le parent a aussi relu projector.ts807–842 : le revert committé supprime une fin de messages et de file, puis remet revert à null. Un indicateur final absent n'établit donc pas l'absence d'une réécriture passée. Deux marqueurs égaux autour d'une lecture bornent les commits de cette lecture, pas toute l'histoire antérieure.

Ces points sont des limites concrètes du contrat proposé, pas une exigence nouvelle de quiescence universelle. Une route future devra fournir une fermeture indépendante de sa provenance et des mutations pertinentes, ou employer d'autres témoins disponibles et prouvés. Pas de garde supprimée ni de champ JSON déclaré autorisant.

## Preuves et périmètre

- Finding SOURCE_ONLY_PROJECTION_TURN_WITNESS_CONDITIONALLY_DESIGNABLE_NOT_ACCEPTED_AS_STATED ; aucun appel, édition, test ou ouverture de base par le constructeur.
- Archive157 : packages/core/src/session/transfer.ts64–72,89–125 ; projector.ts807–842, corroborés parent.
- Marqueur de tour : packages/schema/src/session-message.ts291–302 corroboré parent et message réel déjà capturé170 ; autres chemins source détaillés dans le finding, non comptés comme exécution.
- Proposition de nouveaux champs witness et delta de fichiers : non approuvée pour réalisation. Runtime340 et raccord40336 restent inchangés. Origine1, invocation expirée, qualification-only veto et protections des auteurs conservés ; M2 ouvert.

## Prochain arbitrage préparé, sans effet

Une revue indépendante examine la fermeture réellement requise pour une future session de campagne à producteur parent unique : distinguer une hypothèse opérationnelle explicite d'une preuve native, sans imposer par défaut la défense contre tout acteur OS malveillant ou une modification du noyau. Aucun verdict positif n'est présumé.

En parallèle, le constructeur vérifie seulement si la version installée expose un lancement supporté d'instance locale possédée avec journal retenu, sans modifier le serveur desktop ou une configuration globale. Un simple paramètre interne dans les sources n'est pas une commande supportée. Aucun serveur, port, infrastructure ou harnais n'est créé ; si cette voie exige une extension importante, elle ne sera pas engagée implicitement.

## Clôture de l'attaque source initiale

Le retour FINAL_SOURCE_CAUSAL_ATTACK_SCOPED_CORRECTIONS_AND_CONDITIONAL_TURN_LINK précise les limites nécessaires, sans les généraliser : l'import ne remplace pas normalement une session existante, et la liste complète de messages ne filtre pas les messages derrière un revert seulement staged. Le risque destructif porte sur le revert committé déjà identifié, ou sur une rupture d'identité de session, pas sur toute utilisation d'OpenCode.

Un nouveau champ natif replyTo/executionID universel n'est donc pas posé comme exigence. Une corrélation par l'invariant source d'un tour à un seul input peut être recevable si une preuve indépendante ferme réellement la création fraîche et l'absence de réécriture de cette tranche. Le nombre visible de messages et l'absence de flag revert ne suffisent toujours pas. La garde à ratifier reste cette fermeture précise, pas une preuve d'histoire universelle.

Ce retour termine l'analyse causale précédente ; il n'autorise ni le collecteur proposé ni une opération native. La revue de la fermeture minimale et la vérification distincte d'un lancement supporté restent en cours. Aucun test, code ou appel n'est relancé sur cette livraison.
