# 02 — Corrections utilisateur du catalogue et maintien QA

Date : 2026-10-23. Mission : `team_mvko9wic_0000_1n06ie`.
**État : brouillon corrigé ; exécution toujours en pause, non approuvée.**

## Objectif et changements depuis le rapport 01

Appliquer les corrections utilisateur à la seule politique locale de cette mission, sans changer les réglages globaux ni lancer M2. Le [plan borné du rapport 01](01-preparation-et-contrat-propose.md) reste proposé ; ce rapport remplace sa section catalogue, pas ses garanties ou ses livrables.

Dans [model-policy.json](../model-policy.json), le catalogue passe de 27 à **quatre couples modèle/variante**, suivant l'interprétation « Sol high, conserver GLM Go/ZAI et Grok » :

- `openai/gpt-6.1-sol` / `high` : intelligence 50, coût/tâche 0.32 inchangé ; retiré des réserves et placé en premier pour le démarrage demandé.
- `opencode-go/glm-5.3-flash` / `max` : intelligence 42, coût/tâche 0.25, inchangés.
- `zai-coding-plan/glm-5.3-flash` / `max` : intelligence 42, coût/tâche 0.25, inchangés.
- `cursor/grok-4.7` / `Grok 4.7 Extra High` : intelligence 46 inchangée ; `averageCostPerTask` et `amortizedCostPerTask` fixés à **0.30**, coût partagé indiqué par l'utilisateur. Les benchmarks historiques 3.74 et Cursor 6.01 sont conservés dans leurs champs distincts, pas présentés comme coût partagé.

**Astra est entièrement exclu**, sans route de réserve. Luna, Haiku, DeepSeek, Gemini et les autres variantes Sol ne sont plus proposés dans cette grille restreinte. Les providers correspondent exactement aux quatre routes restantes ; `opencode` est retiré. Le seuil initial reste **50** : Sol high est le seul couple conservé qui l'atteint. Aucun score de tâche, classifieur ou override de modèle n'est ajouté.

La QA **reinforced**, ses trois commandes et neuf critères sont conservés strictement à l'identique. Leur acceptation dans le chat est enregistrée ici ; elle **ne constitue pas le GO d'exécution** de la politique de mission. Pas de nouvelle question QA ni de pipeline de profils imposé.

## Résultats vérifiés

Readback et assertions locales sur le JSON après modification :

- JSON parseable ; seules les six clés de politique autorisées sont présentes.
- Quatre modèles, providers cohérents, identifiants/variantes repris du catalogue précédemment présenté ; aucun Astra ; Sol high non réservé ; seuil 50 inchangé.
- Coût partagé Grok 0.30 et benchmarks historiques distincts vérifiés.
- Empreinte de `JSON.stringify(verification)` identique avant/après : `8c4a1227bdeb6af3cab91eee210f59a9cc8dea275d9cf4fb3912ac21972cf400`.

Ces contrôles vérifient l'édition locale, **pas** la disponibilité actuelle des providers, le Model.Ref effectif d'une future session ou la validation native du plugin. Aucun test produit, worker, classifieur, commit ou appel start exécuté. Aucun réglage global modifié.

## Limites, options et recommandation

Le coût 0.30 est une donnée de politique fournie par l'utilisateur, pas une facture observée ni un plafond global. Les limites d'accès/coût et de permissions du rapport 01 restent applicables. Le modèle réel et la politique routée devront correspondre à la présentation native ; aucun fallback silencieux, notamment vers Astra.

Recommandation : présenter cette grille restreinte avec la QA déjà acceptée. Alternative : corriger dans le chat les modèles/variantes conservés ou les métriques avant toute admission. Le découpage et la concurrence proposés dans le rapport 01 ne changent pas.

## Décision demandée

Veuillez lancer **`/ensemble-mission config`** pour afficher la politique corrigée et son nouveau hash. Le hash précédent `ba4dad01f7422c5ae32e0d2a1f42349095e6d1237b7e38f39fa5643d56239a53` correspond à l'ancienne présentation et ne vaut pas approbation de ces corrections.

Après examen, vous pourrez seul lancer **`/ensemble-mission start`** ; sinon, indiquez les corrections souhaitées. Aucun start ne sera invoqué à votre place.
