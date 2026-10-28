# 03 — Grok Extra High éligible à la planification

Date : 2026-10-23. Mission : `team_mvko9wic_0000_1n06ie`.
**État : proposition corrigée, exécution toujours en pause et non approuvée.**

## Objectif et changement depuis le rapport 02

Permettre l'utilisation de Cursor Grok pour la planification de certaines tâches, conformément à la nouvelle correction utilisateur. Le [plan borné](01-preparation-et-contrat-propose.md) et les [restrictions du catalogue](02-corrections-catalogue-et-qa.md) restent proposés.

Seule modification au [brouillon local](../model-policy.json) : **`startingIntelligence: 50 → 46`**. Le score Grok reste 46 : aucune métrique gonflée pour le rendre admissible. Son modèle/variant natif reste `cursor/grok-4.7` / `Grok 4.7 Extra High`, coût partagé 0.30/tâche. Sol high reste au catalogue avec score 50 et coût 0.32 ; GLM Go/ZAI max restent à 42 ; Astra reste exclu.

## Résultats vérifiés et limites

- Readback : JSON valide, seulement les six clés autorisées ; quatre modèles et providers cohérents ; aucun champ global ni classification ajouté.
- Au seuil 46, les couples du catalogue qui atteignent le seuil sont **Sol high et Grok Extra High**. GLM demeure conservé, mais n'atteint pas ce seuil initial.
- QA reinforced, commandes et critères strictement inchangés : empreinte de `JSON.stringify(verification)` toujours `8c4a1227bdeb6af3cab91eee210f59a9cc8dea275d9cf4fb3912ac21972cf400`.
- Aucun worker, classifieur, test produit ou start lancé ; aucun réglage global, source produit ou protocole de campagne modifié. La disponibilité native et le routage effectif ne sont pas vérifiés par ce contrôle JSON.

**Limite importante :** ce seuil est commun, pas une règle d'affectation par tâche. La correction rend Grok éligible par défaut ; elle ne garantit pas « Sol pour la première tâche, Grok seulement pour quelques autres ». Grok étant moins coûteux selon les métriques de la politique, il peut devenir le choix initial du routage. L'ordre des entrées du catalogue n'est pas une preuve de priorité. Aucune pseudo-règle dans un champ libre, aucun override ou classifieur n'est ajouté pour prétendre garantir un routage sélectif.

## Options, recommandation et décision demandée

Recommandation : présenter le seuil 46 pour ouvrir réellement la planification à Grok sans changer ses scores. Compromis : l'éligibilité s'élargit, et le démarrage strictement Sol high précédemment souhaité n'est plus garanti. Si cette priorité stricte reste impérative, le signaler avant start ; il faudra un mécanisme de routage sélectif réellement pris en charge, pas un contournement de politique.

Veuillez lancer **`/ensemble-mission config`** pour examiner le brouillon corrigé et son nouveau hash. Le hash précédent `1743d230c76abc21d6f4c1252a9f305ed8a1963402c361fb5c05d245e0e8e0ac` ne vaut pas approbation de cette édition. Après lecture, vous seul pourrez lancer **`/ensemble-mission start`**, ou fournir une nouvelle correction. La QA renforcée déjà acceptée n'est pas remise en question.
