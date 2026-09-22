---
title: Codex Agent Orchestration
category: concepts
tags: [reverse-engineering, concept, testing]
aliases: [orchestrator, spawn_agent, multi-agent, subagent pool, parallelisation d'agents]
sources:
  - C:/Users/djden/.codex/sessions/2026/09/17/rollout-2026-09-17T20-26-50-01a0b09f-1372-7ca2-a042-a929f2073125.jsonl
  - C:/Users/djden/.codex/sessions/2026/09/17/rollout-2026-09-17T20-41-37-01a0b0ac-9b72-70f3-8093-2f69c3c95249.jsonl
  - C:/Users/djden/.codex/sessions/2026/09/17/rollout-2026-09-17T21-13-59-01a0b0ca-3ffe-7a82-84f4-298f2fa82087.jsonl
  - C:/Users/djden/.codex/sessions/2026/09/17/rollout-2026-09-17T21-15-47-01a0b0cb-e600-7293-bf67-4901af1c8d06.jsonl
  - C:/Users/djden/.codex/sessions/2026/09/17/rollout-2026-09-17T21-20-25-01a0b0d0-209b-7b03-be48-a91fb05f6ac1.jsonl
  - C:/Users/djden/.codex/sessions/2026/09/17/rollout-2026-09-17T21-21-53-01a0b0d1-7b0c-7330-adc0-749de19d758d.jsonl
  - C:/Users/djden/.codex/sessions/2026/09/18/rollout-2026-09-18T17-42-50-01a0b0d0-209b-7b03-be48-a91fb05f6ac1_01a0b52f-4924-76b3-99e9-c1ab102163b5.jsonl
  - C:/Users/djden/.codex/sessions/2026/09/18/rollout-2026-09-18T17-46-28-01a0b532-9e20-7d21-aaa3-950cc029c6ae.jsonl
  - C:/Users/djden/.codex/sessions/2026/09/17/rollout-2026-09-17T12-44-24-01a0aef7-b3ae-70f3-b84b-38e1a08e86c9.jsonl
summary: Mecanique d'orchestration multi-agents Codex : definitions toml/md, spawn_agent/wait_agent/send_input, pools paralleles par defaut 5, roles nommes, modes de defaillance observes.
provenance:
  extracted: 0.72
  inferred: 0.26
  ambiguous: 0.02
created: 2026-09-22T11:00:00+02:00
updated: 2026-09-22T11:00:00+02:00
---

# Codex Agent Orchestration

Comment l'environnement Codex de ce poste lance et supervise des sous-agents (applicable à re-ff8 comme aux autres dépôts). L'exemple grandeur nature est la campagne de décompilation re-ff8 : [[projects/re-ff8/references/semantic-triple-pipeline]].

## Définitions et invocation

- Un agent est défini deux fois : `.codex/agents/<nom>.toml` (exécutable par Codex) et `.cursor/agents/<nom>.md` (mentionnable depuis Cursor). re-ff8 définit : `orchestrator` (superviseur obligatoire), `decompileur` (constructeur de pack IDA + C réconcilié), `semantic-analyste` (analyse A), `semantic-reviewer` (review V), `semantic-reconciler` (réconciliation R), `live-validator`, `evidence-curator`, `wiki-scribe`, `mechanical-worker`. ^[extracted]
- Invocation : `spawn_agent` avec `agent_type: "<nom>"` depuis un agent parent, ou mention `@<nom>` depuis Cursor/Codex. Les notifications de fin arrivent au parent en `subagent_notification` avec `agent_path` et statut `completed`/`errored`. ^[extracted]
- Le suivi inter-session se fait par `send_input` sur l'agent vivant, et par lecture directe des rollouts JSONL de `~/.codex/sessions/...` quand l'outil de threads n'est pas disponible. ^[extracted]

## Règles de parallélisme (orchestrator.toml, durcies le 2026-09-17)

- Plusieurs **instances du même sous-agent** sont autorisées ; l'orchestrator reste unique. ^[extracted]
- Parallélisme conditionné : tâches indépendantes, entrées/sorties disjointes, instance ID, collecte séparée. Défaut **5 workers**, l'utilisateur peut monter (testé jusqu'à 15) ou descendre. ^[extracted]
- Sections **toujours sérielles** : pipelines par fonction, push IDB, git commit. Un pool de 5 traite une fonction chacun, et un nouveau worker est attribué dès qu'une fonction finit. ^[extracted]
- Convention de nommage des workers en pool : noms de savants (Dirac, Bernoulli, Pasteur, Tesla, Einstein), un rôle par agent (A workers, un V central, un R en escalade). ^[extracted]
- L'orchestrator dérive s'il n'a pas de mission explicite : la première ligne du message doit pointer le document d'exécution (ex. « Lis et exécute HANDOFF_x.md »). ^[extracted]

## Modes de défaillance observés ^[extracted]

| Symptôme | Cause | Correctif/leçon |
| --- | --- | --- |
| `spawn_agent` refusé, « unsupported call: multi_agent_v1 » | routage 9Router du modèle vers un provider sans le chemin multi-agent v2 actif | fix côté 9Router (`multi_agent_version = "v2"`, outils `collaboration` exposés en outils réels) ; voir [[concepts/9router-model-routing]] |
| Sous-agent `errored` 412 « Account suspended » | quota provider épuisé (Fireworks) | basculer de provider, ou reprendre en exécution locale |
| Sous-agents `errored` 429 `[1302]` reset après 2-4 s | rate limit sur `glm-5.3-flash` quand le pool attaque en parallèle | espacer, réduire le pool, ou sérialiser les appels LLM |
| Worker créé mais rend « aucun contenu final » (probe `OUTILS_OK` non retournée, code `OCG_V1_TOOLS_FAIL`) | le worker n'a pas reçu d'instructions exploitables via ce chemin de routage | tester d'abord avec une consigne minimale ; si échec, ne pas lancer de pool |
| Parent aborte, workers survivent | interruption utilisateur du tour parent | chaque sous-agent doit être arrêtable proprement et rapporter « aucun fichier modifié » ; le parent doit vérifier le delta avant de continuer |
| Workers en échec silencieux répétés (09-18) | chaîne de routage OCG défaillante sur les phases de sortie | le diagnostic applicatif passe par les logs 9Router ; voir [[concepts/9router-model-routing]] |

## Sonde de capacité (à refaire après tout changement d'infra) ^[inferred]

Test minimal en deux temps, éprouvé sur ce poste :

1. Probe « supposer un agent » : demander au modèle courant d'instancier `@orchestrator` et de rendre un marqueur fixe. Si l'appel renvoie `unsupported call`, la capacité est **non opérationnelle** dans ce contexte (constaté le 2026-09-17 avant le fix 9Router).
2. Probe chaîne complète après fix : `spawn_agent → @orchestrator → ORCH_OK → PARENT_OK`, puis `send_input` follow-up → `AGENT_FOLLOWUP_OK`, puis fermeture propre. Tout le reste du parallélisme peut être lancé seulement après ce double OK.

## Limites persistantes ^[extracted]

- Un `update npm` de 9Router peut écraser les patchs qui rendent les outils agents disponibles : re-vérifier la sonde après chaque mise à jour.
- La persistance du patch multi-agent et l'auth 401 après redémarrage 9Router étaient encore non garantie au 2026-09-17.

## Liens

- [[concepts/9router-model-routing]] — la couche de routage modèle sous les agents.
- [[projects/re-ff8/references/semantic-triple-pipeline]] — protocole qui consomme ces pools.
- [[projects/re-ff8/references/semantic-pipeline-sessions-2026-09]] — exemple concret : fan-out prévu et échecs rencontrés.
- [[projects/re-ff8/skills/static-reverse-triplet-protocol]] — méthode multi-agents historique côté RE.
