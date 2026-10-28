# Compaction OpenCode : correction du cadrage de la décision

## Réponse à l'objection utilisateur

L'utilisateur rappelle que les sous-agents OpenCode peuvent compacter leur historique. Il conteste donc la nécessité d'une décision produit sur la saturation progressive du contexte. Ce point est juste : le superviseur a déplacé à tort l'explication du budget d'admission vers un choix de gestion du contexte.

## Source vérifiée

Skill OpenCode chargé ; documentation officielle V2 consultée : https://opencode.ai/v2/docs/compaction/ (index V2 llms.txt pour localisation). Elle décrit compaction automatique activée par défaut près de la limite, résumé de la conversation avec conservation d'une partie récente, et récupération bornée après rejet pour taille. La compaction est pilotée par OpenCode/provider ; ce n'est pas seulement une décision spontanée du modèle.

Limites documentées : la compaction est avec perte et ne réduit pas arbitrairement instructions/outils fixes ; un premier envoi démesuré ne bénéficie pas magiquement d'un historique ancien à remplacer. **Aucun premier message trop grand n'a été observé dans cette mission** et aucune panne de compaction n'est établie. La documentation par défaut n'est pas une vérification de configuration effective de chaque session ; aucune inspection/configuration/runtime native n'est lancée pour cette discussion.

## Décision de supervision corrigée

- Retirer la demande d'un nouveau choix de stratégie de remplissage/compaction du contexte introduite au61. Réutiliser les capacités OpenCode existantes ; aucun gestionnaire de contexte, framework, campagne de tests de compaction ou budget de lectures supplémentaire imposé.
- Le débat réseau/body59 ne doit pas être justifié par un risque hypothétique de saturation au premier message. L'envoi actuel reste hybride (références fichiers et certains contenus inline), pas un dump intégral imposé.
- Conserver la vraie obligation du contrat : image scientifique finale et limites d'admission, lien entre ce qui est autorisé/persisté/envoyé, retry exact et absence de double débit/effet. Ces obligations ne sont pas la fenêtre de contexte du modèle ; la compaction ne les remplace pas et leurs seuils ne sont pas supprimés.
- Les choix de définition body et de stockage proposés59 ne sont pas ratifiés par cette objection ; ils restent à résoudre dans le mandat et les frontières de contrat, sans faire approuver à l'utilisateur un faux problème de compaction. Pas de nouveau GO code/test/native sous couvert de clarification.

## État préservé

S1 qualifié offline DATA/pures55 et preuves450+9/planner réutilisées, aucune répétition. Plans S2/public56/62 conservés. WIP et TDD antérieur58 inchangés/non exécutés. Aucune opération produit/DB/service/Git/native/config globale ou question de permission ajoutée. Les trois commandes consolidées M2 restent NON EXÉCUTÉES.
