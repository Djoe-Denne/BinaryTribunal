# 73. Qualification ciblée du point d’admission natif avant activation

## Problème concret et prochaine étape

Les incréments au repos et observations DATA sont intégrés ; les retester ne fournira pas le rejet d’une commande périmée déjà en transit, ni un témoin de clôture native attribuable. La prochaine étape porte donc sur le propriétaire natif, conformément à l’avis architectural déjà reçu, pas sur un nouveau lecteur ou une nouvelle étude générale.

Le parent demande au rôle de qualification initial une vérification de source ciblée : une primitive ou un hook existant peut-il appliquer durablement owner/fence **au point d’admission**, et attribuer la clôture à son lifecycle ? Ou cela nécessite-t-il une modification du noyau et un déploiement distinct, au lieu d’un simple wrapper HTTP ou metadata ?

## Contrat de cette recherche

Sources officielles2.1.4 déjà épinglées et contrats possédés réutilisés. Examiner uniquement les points de transaction/commit de Bus.publish, de l’admission Inbox et du lifecycle, et les interfaces publiques pertinentes. Donner les preuves exactes et distinguer ce qui existe dans le serveur courant d’une capacité seulement réalisable en modifiant la source.

Aucun code, test, modèle, base, mutation native, déploiement ou changement global. Pas de second architecte, store, watcher, neuf handlers ou contournement de refus. Un import public manquant peut être recherché au commit immuable sans données privées. Les garanties natives demeurent non acquises durant cette vérification.

## Décision attendue du parent

À réception des preuves : choisir le plus petit raccord conforme réellement disponible, ou consigner précisément la capacité/provenance/droit de déploiement manquant. Ne pas remplacer une propriété serveur par un contrôle client, ajouter une exigence universelle d’exactly-once ou transformer une tâche terminée en clôture M2. Aucun GO de routine n’est demandé à l’utilisateur.

Les sources, tests et revues valides des livraisons précédentes restent acquis. Rapport72 est le bilan intégré courant ; la recherche est une suite de qualification, pas une nouvelle autorisation d’exécution.
