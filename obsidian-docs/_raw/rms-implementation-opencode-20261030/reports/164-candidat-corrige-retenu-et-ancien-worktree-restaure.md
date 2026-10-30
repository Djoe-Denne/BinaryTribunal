# 164. Candidat corrigé retenu, ancien worktree restauré

## Résultat et décision

Le parent retient le correctif d'adresse du candidat séparé : revue favorable, compilation et28tests ciblés réussis, mêmes empreintes après QA. Les trois fichiers ont été enregistrés dans un commit local dédié. Cela ne constitue pas une activation native ou une acceptation complète de M2.

Le chevauchement de l'ancien worktree est réconcilié. Le constructeur a livré et gelé sa variante à deux fichiers, correspondant à la consigne antérieure. Le parent en a conservé les deux fichiers complets et leurs empreintes, puis a restauré exactement les deux fichiers historiques depuis782. Une relecture confirme **18fichiers historiques conformes**, **deux archives conformes** et les **trois pins du candidat testé toujours inchangés**. Aucun test n'a été rejoué pour cette restauration.

## Ce qui reste distinct

La variante du constructeur est conservée mais non retenue et non testée. Elle n'est pas mélangée au candidat du parent. Les sourcesV3 et leur référence historique782 restent intactes ; le nouveau runtime corrigé a sa propre révision. Copier du code ou restaurer des sources ne crée aucune autorité, origine ou ressource.

L'incident de coordination est donc clos dans ce périmètre de fichiers. Les premiers lanceurs d'archivage ont refusé avant toute écriture à cause de l'environnement Git du sous-processus ; aucune restauration n'avait alors eu lieu. L'opération de mutation a ensuite été exécutée avec l'outil shell natif, après vérification des deux empreintes exactes et préservation préalable. Aucun refus de permission n'a été contourné.

## Suite autorisée

Le constructeur termine seulement le petit correctif de délai après fermeture du raccord local. Ce raccord devra ensuite utiliser le même helper et le nouveau pin retenu, dans le candidat séparé. Le parent vérifiera ce delta et exécutera la QA locale ciblée sur un espace de test neuf, explicitement non adoptable.

La possession opérationnelle et les actes privés restent à exécuter après ces prérequis. Aucune session de travail ou origine RMS n'a encore été engagée. Les preuves non affectées restent réutilisées.

## Annexe technique

- [Composition et rétention exactes du candidat](../evidence/native-address-bridge-retained-164.json),19entrées :18historiques dont16inchangées, deux corrigées et un helper nouveau.
- Révision locale :340386a9926f8afafc6dab6fe08f9a237afb2c75, base782ec396a2a7866d30645c32ca8ab864dcca5960 ; branche rms-native-address-bridge-160-candidate. Aucun push ou merge dans le worktree principal.
- Avant commit : aucun hook Git actif et index vide ; seuls les trois chemins approuvés ont été ajoutés. Après commit : worktree propre.
- [Variante préservée avant restauration](../evidence/overlap-163/variant.json), non retenue ; les deux fichiers ont été copiés byte-exactement puis revérifiés avant le restore ciblé.
- QA réutilisée : typecheck4,695s,28tests129ms/89assertions,87tests hors sélection non exécutés. Aucun contrôle au-delà de dix minutes.

## Livraison suivante du raccord local

Le correctif de délai après fermeture est livré : module39032octets/SHA200a8e9eeea2625b9055c6c9391ab0988eb99bb5dd49051a46ccd36dada0e6a0 ; manifeste40809/SHA60e187e1308ab6edc7a3d48a24f89b9e4cafe4f414e5fe88870cf22f98ac2c3d. Le parent confirme les empreintes et l'ordre du contrôle après finally. La revue du seul delta est engagée ; aucune branche de fermeture ou expiration n'est déclarée testée.

Le raccord doit encore consommer le matcher interne retenu340 et vérifier la composition réelle19fichiers à partir du manifeste164. Ce delta local est autorisé sans nouvel émetteur ou import du client privé. Son exécution future sera uniquement dans le nouveau candidat après copie byte-exacte des modules nécessaires, jamais sur l'ancien worktree restauré.
