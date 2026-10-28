# M2 — 15 : diagnostic d'inactivité et correction du pilotage

## Question utilisateur et constat observé

L'utilisateur demande pourquoi aucun worker ne travaille. Contrôle ponctuel `team_status` : les trois chercheurs sont arrêtés ; numeric-candidate-r1 est idle depuis environ 14 minutes, tâche toujours in_progress, plan approuvé et état ready. Politique nouvelle en draft ; mission effective supervised/running, classification manuelle. Aucune panne fournisseur démontrée.

Le même contrôle précise explicitement : nouvelles admissions bloquées en code, mais les tâches déjà admises conservent leur révision de politique. La tâche numeric reste admise sous révision 1 ; sa poursuite ne nécessite pas de migrer silencieusement vers long_run ou de créer un autre worker.

## Cause et responsabilité

Erreur de pilotage du superviseur : avoir traité la réouverture de configuration comme une attente globale, alors que du travail utile sur la tâche admise pouvait continuer ; des messages envoyés au worker terminé sans force étaient stockés mais ne le réveillaient pas. Les réponses répétées aux notifications sans contenu n'ont pas apporté de progression et auraient dû être remplacées par ce diagnostic explicite plus tôt.

Deux messages de consignes du lead ont été retrouvés stockés dans le suivi : autorisation L2 et réserve UTF-8, pas de nouveaux résultats worker. Aucun succès d'exécution ne peut en être déduit. Pas de cause réseau/provider/runtime attribuée sans preuve et pas de campagne de réparation globale.

## Correction décidée

- Réactiver la même session numeric, même tâche/révision/modèle, sans nouvelle admission, spawn, override ou commande start à la place de l'utilisateur. Si le harness refuse, conserver le refus exact et ne pas contourner.
- Consigne locale `L1_AUTHORIZATION.md` mise à jour : défaut bytes invalides/UTF-8 canonique à corriger à la vraie frontière, sans changer les 450 cas ou oracles. Deux invocations ciblées supplémentaires autorisées pour ce nouveau risque distinct (total L1 cinq, dont trois déjà utilisées), 30 s chacune ; rouge comportemental puis vert, pas de rejeu inchangé.
- Poursuivre ensuite fermeture/adaptation L2 déjà autorisée par l'utilisateur. Maintenir les gates QA indépendante et validation parent avant la seule invocation scientifique inspectée autorisable ; aucun PASS ni preuve publique/G5–G7 implicite.
- Le brouillon long_run reste à présenter/approuver par les commandes utilisateur. Ne pas attendre cette migration pour les actes encore autorisés sous l'admission existante.

## Preuves réutilisées

Conserver les 98 tests verts dans leur portée et les onze pins/logs vérifiés (rapport 14). Le défaut de décodage est un risque concret distinct, pas une invalidation due à un nouveau modèle ou reviewer. Les checks globaux et les 450/neuf régressions restent non exécutés. Aucun nettoyage, Git final ou redémarrage de backend demandé.

## Résultat de la reprise et travail parent effectué

`team_message force:true` a confirmé l'envoi de la reprise au même worker ; `team_view` confirme ensuite la session native `ses_e8be6ee3bffeljmJoaQzS3bV02` en **busy**, agent general. Il ne s'agit donc plus seulement d'une consigne stockée pour un membre idle. Aucun nouveau worker admis ni politique long_run appliquée par détour.

En parallèle, le parent a préparé les inputs locaux L2 manquants : 77 pins R4/1 315 076 octets vérifiés sous leur manifeste reçu, quatre fichiers support conformes à GO et les deux contraintes natives historiques. Aucun C#/DLL/EXE, WIP ou node_modules en bloc ; aucun fichier de travail L1 écrasé. Reçu : `../evidence/numeric-l2-input-projection.json`, copie locale `W/inputs/L2_INPUT_RECEIPT.json`. Les scripts historiques restent des entrées à lire/adopter, pas des permissions de run ou une preuve actuelle.

La tâche peut avancer sur le correctif et la fermeture L2 sans attendre ces dépendances ou l'approbation du nouveau mode. Les futures admissions distinctes (notamment QA fraîche) restent gouvernées par config/start ; aucune substitution de la revue parent aux obligations indépendantes.
