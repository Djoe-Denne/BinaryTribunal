# 242. Terminer l'archivage natif sans accepter le prototype

## Demande et protection

L'utilisateur demande explicitement de clôturer et archiver proprement la mission. Le bilan technique reste partiel/non réussi. Aucun nouveau travail de modèle, OAuth, test produit ou acte IDA.

Le premier appel normal team_cleanup a refusé d'agir car sept worktrees contiennent des fichiers non committés. L'inventaire montre 95 inputs publics à conserver et 20 copies de profils dont les octets sont identiques aux fichiers canoniques de l'utilisateur. Ces profils ne sont ni importés ni modifiés ; leur copie canonique reste intacte.

Les 95 inputs sont sauvegardés dans docs/missions/rms-plugin-recovery-20261030/native-cleanup/worker-inputs, avec hashes dans before.json. Les branches seront aussi retenues sous des références d'archive propres avant retrait des worktrees. Aucun magasin natif, secret, cache ou dépendance n'est copié.

## Fusion mécanique éventuelle : pas une acceptation

L'outil natif peut proposer dans le répertoire courant la fusion de la branche restée non intégrée. Les 42 chemins concernés ont été fermés, vérifiés sans modification préalable et leurs préimages épinglées. Si l'outil les matérialise, le parent rejettera exactement ces modifications avant tout commit. Aucun import, chargement, test, déploiement ou exécution n'est prévu entre ces opérations. Le prototype ne devient ni produit accepté ni plugin activé par un nettoyage.

Le retrait des worktrees n'est autorisé qu'après conservation des inputs et branches. Ne pas utiliser purge ; ne pas modifier directement la base de l'équipe ou sa configuration globale. Une erreur native de retrait reste à rapporter et diagnostiquer sans forcer un chemin étranger.

## Réception finale requise

Exiger une confirmation native d'archivage, la conservation de toutes les références et copies épinglées, le retour exact des 42 chemins à leur état antérieur et la préservation des changements utilisateur. Mettre le reçu d'archivage et les mises à jour documentaires dans main, sans push. Le rapport ne prétend pas que l'archivage a réussi avant ce readback.
