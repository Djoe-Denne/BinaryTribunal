---
title: 9Router Model Routing
category: concepts
tags: [reverse-engineering, concept, testing]
aliases: [9router, glm routing, combo ocg glm fireworks, model fallback chain]
sources:
  - C:/Users/djden/.codex/sessions/2026/09/16/rollout-2026-09-16T18-32-34-01a0ab10-1b9a-7d10-926b-75534b15a363.jsonl
  - C:/Users/djden/.codex/sessions/2026/09/17/rollout-2026-09-17T14-20-34-01a0af4f-be50-7f63-8789-986d582b9fdc.jsonl
  - C:/Users/djden/.codex/sessions/2026/09/18/rollout-2026-09-18T16-12-52-01a0b4dc-ed20-75e2-a841-4903e56adcd2.jsonl
  - C:/Users/djden/.codex/sessions/2026/09/18/rollout-2026-09-18T18-41-51-01a0b532-9e20-7d21-aaa3-950cc029c6ae_01a0b565-53be-70d2-b14b-b108cb801e23.jsonl
  - C:/Users/djden/.codex/sessions/2026/09/18/rollout-2026-09-18T17-46-28-01a0b532-9e20-7d21-aaa3-950cc029c6ae.jsonl
summary: Routage modele via 9Router (combo OCG/Z.AI/Fireworks), compatibilite champ thinking, reasoning effort verifie dans la DB sqlite, patch traducteur OCG 0.5.81, conventions de sauvegarde.
provenance:
  extracted: 0.74
  inferred: 0.24
  ambiguous: 0.02
created: 2026-09-22T11:20:00+02:00
updated: 2026-09-22T11:20:00+02:00
---

# 9Router Model Routing

9Router est le proxy local (`http://127.0.0.1:20128/v1`) entre les clients (Codex, Cursor…) et les providers LLM. Ce qui suit est la mécanique stable constatée sur ce poste entre le 2026-09-16 et le 2026-09-18.

## Combo et cascade de fallback

- Le combo `glm-5.3-flash` du poste est une chaîne : `ocg/glm-5.3-flash` (OpenCode Go, préféré), puis `glm/glm-5.3-flash` (Z.ai Coding, endpoint `/api/coding/paas/v4/chat/completions`), puis `fireworks/accounts/fireworks/models/glm-5p3-flash`. ^[extracted]
- La cascade se vérifie dans les logs du dashboard (`/dashboard/console-log`) : ocg échoue → glm essaie → fireworks en **dernier recours**. Un appel Fireworks isolé peut être une requête distincte, pas la cascade. ^[extracted]
- La sélection « Flash · Fireworks » dans le sélecteur de modèle sert bien Fireworks (Z.ai n'est pas utilisé) ; les routes directes et le combo sont des choses distinctes. ^[extracted]

## Compatibilité du champ `thinking` (piège majeur)

- OpenCode Go **rejette** le payload contenant `thinking: {"type":"enabled"}` (`unknown field "thinking"`) alors que Z.ai et Fireworks l'acceptent. Le traducteur doit donc retirer le champ pour OCG et le conserver pour les deux autres. ^[extracted]
- Symptôme visible côté utilisateur : le combo « tombe » silencieusement sur le provider suivant, ou la sortie perd ses phases d'outils (phases `commentary` avalées dans la traduction vers Responses). ^[extracted]

## Reasoning effort : comment le vérifier (pas le deviner)

- Réglages : `~/.codex/config.toml` (`model`, `model_reasoning_effort`) ; côté 9Router, `providerThinking` force le mode par provider (ex. `{"fireworks":{"mode":"max"}}`). GLM Flash : contexte 1 000 000, compactage 900 000, effort max. ^[extracted]
- Vérification par la DB : `C:\Users\djden\.9router\db\data.sqlite`, table `requestDetails`, champ `request._preview`/`providerRequest` — copier le WAL d'abord, lire en Python (sqlite3 absent du PATH). Le corps sortant contient `"reasoning":{"effort":...}` tel qu'envoyé au provider ; l'effort observé peut différer du config tant que le correctif n'est pas redémarré. ^[extracted]

## Patch traducteur OCG (9Router 0.5.81) ^[extracted]

- Fichier : `open-sse/translator/response/openai-responses.js` du clone source 9Router ; tests ciblés ajoutés (`openai-responses-message-phases.test.js`, tests A–D ; 19/19 + traducteur Codex Responses). La suite générale garde des échecs préexistants hors périmètre.
- Bundle actif patché chirurgicalement avec convention de backup `<fichier>.bak-<sujet>-<timestamp>`, puis redémarrage via `C:\Users\djden\9router-tools\restart-9router.ps1`. Validation réelle : 10 appels d'outils séquentiels → 10 messages `commentary` → `final_answer`.
- Les outils namespace sont aplatis puis reconstruits (`spawn_agent`, `wait_agent`, `list_agents`) ; le catalogue OCG passe en `direct/v1` pour que les consignes de sous-agents circulent en clair. Voir [[concepts/codex-agent-orchestration]].
- Risque : un `update npm` de 9Router **écrase** les patchs du bundle. Après chaque mise à jour : re-vérifier santé (`/health` HTTP 200), re-jouer la sonde d'outils, re-patcher si besoin.

## Conventions de gestion du poste ^[extracted]

- Dossier d'outils et scripts : `C:\Users\djden\9router-tools\` (contient le script de redémarrage et les notes). Le résumé du fix GLM Flash est consigné dans `C:\Users\djden\9router-tools\GLM53-FLASH-ROUTING-FIX.md`.
- Backups avant modification : `C:\Users\djden\.codex\backups\<sujet>-<timestamp>\` (et `*-before-<sujet>.json` pour le catalogue de modèles). À créer avant toute édition de config.
- Catalogue de modèles : l'ajout de `cu/cursor-grok-4.6-xhigh` (Grok 4.6 · Cursor XHigh, reasoning `xhigh`) s'est soldé par HTTP 200 mais **contenu vide** — modèle présent ≠ modèle fonctionnel ; tester le contenu, pas seulement le statut. ^[extracted]

## Liens

- [[concepts/codex-agent-orchestration]] — ce que le routage conditionne (spawn d'agents).
- [[projects/re-ff8/skills/model-assisted-decompile-bench]] — bench qui consomme les réglages d'effort GLM.
- [[projects/re-ff8/skills/static-reverse-triplet-protocol]] — campagnes multi-modèles historiques.
- [[projects/re-ff8/re-ff8]] — projet principal qui utilise ces routes.
