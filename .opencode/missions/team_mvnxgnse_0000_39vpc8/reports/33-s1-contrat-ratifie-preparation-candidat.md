# M2 — 33 : contrat S1 ratifié, préparation du candidat exact

## Décision parent

La reprise de revue indépendante conclut **ACCEPTABLE** : B1/B2 fermés par l'amendement 06, aucun bloquant contractuel restant dans la portée documentaire. Les autres conclusions favorables sont réutilisées ; aucun test ou code produit exécuté pour cette revue.

**Le parent ratifie le contrat S1 constitué des parties 01–05 et de l'amendement 06.** Priorités : correction 05 remplace le statut des huit inputs dans 04 ; amendement 06 précise les refus d'indépendance et les comparaisons worker/account, ainsi que le placement contextSources/common. Pas d'acquisition/authentification/CAS ou autorité de publication établie par cohérence S1.

Vérification parent de version : les cinq documents d'origine sont inchangés face à `COMPLETE_RECEIPT.json` (SHA `b553e8e7f25dd227961ec4fc2f28d856b736bbd5385d6203a36858c70ea43097`). Amendement 06 : 5374 octets, SHA `57b0ec08d21c1d5c915d0d057080cc5030e62814f20adb370f77f99ab4e08ea9`. Sources dans [proposal](../inputs/s1-contract-r2/proposal/).

## Prochaine étape utile et périmètre

Admettre la tâche d'implémentation S1 prévue, d'abord en préparation lecture seule : propriétaire isolé, inventaire exact des sources/versions/imports nécessaires, références/consommateurs et négatifs affectés. Cette préparation doit produire un plan exécutable et une sélection fermée du candidat, pas une nouvelle conception du contrat ou une restauration générale des gels.

Le candidat sera isolé ; les cinq cibles proposées, les dépendances numeric/planner qualifiées et les huit suppléments ne sont pas encore un build/closure typé. Ne pas partir du HEAD seul en supposant le WIP scientifique présent dans le worktree. Identifier ce qui provient du commit, du WIP ou du gel ; pas d'écrasement ni intégration globale du WIP canonique.

Avant écriture/tests : le parent vérifie les entrées et l'ownership, borne les commandes ciblées et valide le plan. Le passage natif du worker en implémentation reste soumis à ses permissions/politique ; pas de contournement d'un profil lecture seule. Les tests unitaires auteur restent distincts de la future QA API indépendante ; ne pas lui exposer les futurs oracles QA.

## Préparation effectivement admise

`s1-implementation-r2` admis sur tâche prévue `task_mvo1ayx4_0009_px5bo2`, fresh, worktree demandé et plan_approval actif ; branche annoncée `ensemble-c85e787d-f1ec-4bf1-a5d2-20c781254422`. Session `ses_e8681b156ffeQ5mA4t51Jg6fjc`, busy observé. Sélection autonome gouvernée : GET natif confirme `Model.Ref={providerID:openai,id:gpt-6.1-sol,variant:xhigh}`, variante du catalogue approuvé, aucun override au spawn.

Le readback location.directory affiche encore la racine canonique : le chemin effectif isolé doit être précisé et vérifié dans le plan avant toute écriture, sans reconfigurer les MCP ni supposer l'isolation de la destination. Ce point ne bloque pas les lectures de préparation ; consigne transmise au worker. Aucun plan n'est encore approuvé et aucun code/tests autorisés à ce stade.

### Destination isolée désormais confirmée

Le worker confirme que ses outils relatifs lisent R canonique ; aucune écriture effectuée. Parent a localisé le worktree existant via `opencode.worktree_list`, puis directement lu son fichier `.git` et le HEAD administratif :

- W = `C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-793e3f62-39vpc8-s1-implementation-r2`.
- `.git` pointe sur `R/.git/worktrees/ensemble-793e3f62-39vpc8-s1-implementation-r2` ; HEAD = `refs/heads/ensemble-c85e787d-f1ec-4bf1-a5d2-20c781254422`, conforme à la branche annoncée.

W absolu transmis pour le plan de projection et les futurs cwd ; R reste source de lecture seulement. Pas de modification de session, permission ou racine MCP pour résoudre ce décalage ; aucune commande Git exécutée. La sélection exacte du candidat et l'approbation du plan demeurent requises avant écriture.

## Critères de préparation

- Closure source/type/schema et liste d'écriture minimales ; types-only versus imports value explicités. Aucun import producteur DB/client/planning/clustering pour certifier les choix au parse/bind/export.
- Mapping des clauses ratifiées aux fonctions/API et scénarios nominaux/refus/limites à éprouver ; B1/B2 de l'amendement inclus.
- Version des schémas et consommateurs anciens v1/v2 préservés ; pas de migration implicite lors de cette étape.
- Commandes/tests existants pertinents réutilisés selon impact, typing ciblé puis consolidation ultérieure sur le candidat intégré. Aucun nouveau framework, trace FULL ou run numeric.
- Tout besoin hors cinq cibles/dépendances nécessaires est expliqué avant édition ; un nouveau harnais important exige arbitrage, pas simple ajout autonome.

## Limites

Ratifié ne signifie pas implémenté, qualifié ou intégré. Numeric450+9 reste accepté sans rejeu ; les trois checks consolidés M2 restent NON EXÉCUTÉS. QA S1, S2–S4, L7/L9/L10 et preuve publique OpenCode restent ouvertes. Aucun commit/merge/push, nettoyage, C#, jeu/live/IDA ou nouveau run inspecté autorisé.
