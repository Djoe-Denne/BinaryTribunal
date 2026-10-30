# 163. Correctif testé, chevauchement de worktree à réconcilier

## Résultat vérifié

Le candidat correctif séparé passe sa compilation en **4,695 s**, puis les **28 tests ciblés en129ms** : zéro échec,89assertions. Les87tests hors sélection n'ont pas été exécutés et ne sont pas comptés comme succès.

La revue indépendante est favorable. Après QA, les trois empreintes retenues sont inchangées ; les16autres fichiers de la composition protégée sont identiques à la base782. L'objet Git immuable782 correspond toujours aux18fichiers du manifeste historique. Aucun effet natif, session ou origine RMS n'est créé par ces contrôles.

## Échec de préservation distinct

Le contrôle de l'ancien worktree sur disque échoue : son client et son fichier de tests ont aussi été modifiés, tandis que son HEAD reste782. Cela est compatible avec une application tardive de la consigne antérieure de correction dans ce worktree ; la cause de livraison reste à confirmer. Il ne faut pas affirmer que ces fichiers de travail sont restés gelés.

Le nouveau candidat testé est dans un autre répertoire et ses bytes ne sont pas affectés. Sa QA reste valide. Les sourcesV3 et documents153/155 ne sont pas remis à zéro ni adoptés comme autorité.

## Réconciliation décidée

Le parent demande au constructeur de geler les écritures produit et de décrire exactement son delta. Les modifications seront conservées avant toute restauration des fichiers historiques. Le parent ne supprimera ni n'écrasera silencieusement cette variante ; elle ne sera pas intégrée implicitement au candidat testé.

La prise de possession opérationnelle reste non lancée. Les contrôles du raccord local et le correctif de délai continuent dans leur périmètre ; aucune nouvelle admission produit ou activation ne sera fondée sur un worktree ambigu. Aucun test n'est rejoué seulement pour remplir ce bilan.

## Preuves

- [Reçu QA et constat d'échec de préservation](../evidence/native-address-bridge-qa-163.json).
- Revue : result_mvuuuj8n_000j_atodq6, msg_18c6f8da4001g0Q7rwRvSYbCzq.
- Nouveau candidat : worktree rms-native-address-bridge-160, trois pins du rapport162 confirmés après QA ; git diff --check réussi.
- Ancien worktree : client64373/SHA497038644f642cee8dbd19056e85ee7dcf8c4fb8df47b2f8b657cbc743889c5d ; test110824/SHA6b0705fb799b64e7413803458b5e7dee73df8ed0f5f832b5c2fb9c4057c70cac. Ce constat est conservé comme échec, pas comme PASS.
- Suggestion de revue différée : isoler un cas de hashes tous deux majuscules ; le refus est déjà explicite dans le code, aucun élargissement QA nécessaire pour l'acceptation approuvée.
