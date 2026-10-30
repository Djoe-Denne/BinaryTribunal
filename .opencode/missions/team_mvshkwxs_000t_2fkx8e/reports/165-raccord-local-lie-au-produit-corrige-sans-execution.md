# 165. Raccord local lié au produit corrigé, sans exécution

## Avancement concret

Le constructeur confirme le gel de toutes ses écritures. Le parent a repris le dernier raccord local dans le nouveau candidat retenu, avec copie byte-exacte des deux modules déjà vérifiés dont il dépend. L'ancien worktree restauré n'est plus modifié.

Le raccord utilise maintenant **le même matcher d'identité que le produit corrigé**, sans réécrire les sources ou désactiver la garde. Avant toute possession, il doit charger le manifeste164 exact, vérifier qu'il s'exécute depuis le bon candidat et contrôler les empreintes des19fichiers réels. Ce contrôle n'appelle pas Git ou un sous-processus.

La preuve de version du runtime est ajoutée aux références existantes et au checkpoint. Elle reste distincte de l'archive source du serveur et des donnéesV3 historiquement liées à782. Copier ces modules n'adopte aucune base QA, autorité ou origine.

## Vérification et prochaine étape

La syntaxe du raccord parent passe sans évaluation. Les empreintes des modules copiés et du code courant sont vérifiées. La revue ciblée porte sur ce raccordement et le correctif de délai après fermeture ; les autres preuves de lecture sont réutilisées.

Après avis, la QA prévue utilisera un espace local neuf, explicitement non adoptable comme possession opérationnelle : refus des entrées incorrectes avant stage, un stage réel de test avec relecture et images exactes, puis refus du namespace existant et d'un second appel. Aucun appel au service ou à l'émetteur d'autorité n'est ajouté au raccord. Les branches dynamiques non exécutées resteront déclarées telles.

À ce stade, **aucun import du nouveau raccord, base, bail ou effet natif n'a été lancé**. Le correctif produit et ses28tests restent acquis, non rejoués.

## Annexe technique

- Nouveau root de runtime : rms-native-address-bridge-160, commit340386a9926f8afafc6dab6fe08f9a237afb2c75.
- Raccord courant parent : stage-materialize-native-inputs.mjs40336octets/SHAd42c617aa4f12eb6a9f1d92a93aefa8c2f2ecc523c5bb9ea57a1a459559bdb0a ; manifeste3835/SHA1a017affab2510cb936fde1afb92864a59982e19acc2cc46781ef9a59741912e, sous preparation-candidates du nouveau root.
- Base du correctif post-close : module39032/SHA200a8e9eeea2625b9055c6c9391ab0988eb99bb5dd49051a46ccd36dada0e6a0 ; son manifeste41934/SHA16c04260771f79f2d050cc1c66b978373028658a68ba74a5c2257b85fbf0237c est copié et renommé baseline-161 pour éviter d'en faire une instruction active.
- Copies inchangées : stage-local-reservation.mjs25729/SHA5bbea4d5bd9e88f36bbdbabebcbc8973577fe3d7d8a3c0c1a68f0022d4a09a72 ; enumerator16452/SHA2d5f8335fc4a9190bf0075648c146875d6154879a674a42c58943971d85b8d8e.
- Pin produit consommé : manifeste1644222/SHA63625a81b5e0f9e63c2858e0c57da4415627b18a19f073caf9bafc141b4d3da9 ; vérification de chemins, version et19code pins avant stage.
- Aucune exposition du client privé, nouvel issuer, schéma persistant, connexion réseau ou prolongation de bail.
