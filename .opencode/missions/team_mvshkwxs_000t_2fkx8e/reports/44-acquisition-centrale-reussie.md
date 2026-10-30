# 44. Acquisition centrale réussie ; vérifications de sûreté en continuation

## Résultat vérifié

Le test central normal termine en **183,105 secondes de processus**, soit environ3 min03 s : **1 PASS, zéro échec,66 assertions**. Les365 fichiers restent identiques au manifeste r6. Aucun préchargeur, agent réel ou appel natif n'intervient : le moteur traite des exécutions simulées et de vrais fichiers/basesOWN.

Ce cas vérifie les nouveaux octets bruts après publication, le contenu complet des commandes du consommateur, leurs fichiers/permissions/empreintes, les pins et l'outbox, puis une reprise sans changement de contenu et sans modifier le cycle gelé. Il lève le manque de preuve de ce scénario central, pas l'ensemble des négatifs ni les garanties natives.

Le résultat montre que l'ancien seuil de quinze secondes était insuffisant pour ce scénario sur cet environnement. Il ne démontre pas la cause de sa lenteur ni qu'aucune optimisation ne serait utile ; cette question reste au bilan final, sans bloquer les validations actuelles.

## Suite autonome

Le cas positif de séparation A/B et d'union exacte explicitement autorisée pour R est lancé avec la même borne de dix minutes. À sa fin, poursuivre les autres scénarios du même fichier autorisé, en réutilisant les deux cas déjà prouvés plutôt qu'en les répétant. Arrêter la sélection au premier échec pour traiter un défaut concret, pas pour demander un GO intermédiaire.

Les contrôles restants ne lancent pas la suite globale. Les injections négatives SQL, révocations et altérations visent exclusivement les fixtures neuves possédées et conservées. Les tests exécutés et leurs durées seront recensés ; aucun scénario non exécuté n'est compté PASS.

## Preuves et limites

- `../evidence/projection-core-ten-minutes-r6.execution.json` et captures associées : exit0,183105 ms,66 assertions, sourceDrift vide.
- Manifeste r6 SHA256 `2c2fd2893e6b8482eb17cd774c5108ba1a52a17f001078d86840336ca9689545`.
- Cas union en cours : handle `sh_186c06ee8001e0zPIqESe9y606`, reçus attendus sous projection-union-ten-minutes-r6 ; aucun résultat anticipé.
- Aide locale Bun test consultée : timeout défini par test, option bail disponible pour arrêter au premier échec. Pas d'exécution produit lors de cette lecture d'aide.

Impact : manque central levé sous la limite autorisée, poursuite des vérifications sur les autres risques. Limites : projection non encore intégrée, vérifications complémentaires et consolidation à venir ; v3/natif, D5final/L9/L10 et clôture complète ne sont pas acquis par ce seul succès.
