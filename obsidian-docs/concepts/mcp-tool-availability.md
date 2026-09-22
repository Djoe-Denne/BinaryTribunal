---
title: MCP Tool Availability
category: concepts
tags: [reverse-engineering, concept, testing]
aliases: [1mcp, serena unavailable, unsupported call, ida-pro-mcp, mcp debugging]
sources:
  - C:/Users/djden/.codex/sessions/2026/09/18/rollout-2026-09-18T18-51-09-01a0b56d-d511-78e1-beb1-18eba8113d19.jsonl
  - C:/Users/djden/.codex/sessions/2026/09/18/rollout-2026-09-18T20-19-28-01a0b56d-d511-78e1-beb1-18eba8113d19_01a0b5be-b129-7521-83df-f651d7da88b3.jsonl
  - C:/Users/djden/.codex/sessions/2026/09/18/rollout-2026-09-18T20-29-19-01a0b5c7-b483-7bf1-b197-4ed4ecc62c3b.jsonl
  - C:/Users/djden/.codex/sessions/2026/09/18/rollout-2026-09-18T20-30-08-01a0b5c8-7439-7ef2-ab96-727c9e2dc548.jsonl
  - C:/Users/djden/.codex/sessions/2026/09/18/rollout-2026-09-18T20-30-22-01a0b5c8-aaec-7d00-82dc-bad16e768da9.jsonl
  - C:/Users/djden/.codex/sessions/2026/09/18/rollout-2026-09-18T20-11-37-01a0b5b6-81f5-7721-9990-e286cdc0e061_01a0b5b7-80c0-7833-b14c-9136ee81c231.jsonl
summary: Diagnostic durable des MCP locaux : syndrome schema-visible/unsupported-call (blocage client, pas serveur), 1MCP tags, serena/ida-pro-mcp config, GrepAI watch, arrets silencieux.
provenance:
  extracted: 0.70
  inferred: 0.28
  ambiguous: 0.02
created: 2026-09-22T11:40:00+02:00
updated: 2026-09-22T11:40:00+02:00
---

# MCP Tool Availability

Comment distinguer « le MCP est en panne » de « le client ne remonte pas les outils », d'après les sessions de debug du 2026-09-18 sur le poste. Les endpoints vérifiés ce jour-là : 1MCP `http://127.0.0.1:3050/health` (v0.37.0, 4/4 serveurs), IDA `http://127.0.0.1:13337/mcp`, 9Router `http://127.0.0.1:20128`.

## Le syndrome « schema visible, unsupported call » ^[extracted]

Symptôme : les outils du MCP (ex. `serena_1mcp_find_symbol`, `serena_1mcp_get_current_config`) apparaissent dans la liste d'outils de la session, mais **tout appel échoue immédiatement** avec `unsupported call`. Deux cas radicalement différents constatés le même jour à une minute d'écart :

- **Cas blocage client/harnais** (le vrai problème persistant) : le backend répond pourtant. Diagnostic discriminant : lancer le proxy en stdio direct (`1mcp proxy --url …/mcp --tags serena`) — si les 23 outils répondent là (projet actif `re-ff8`, LSP ready, Serena 1.7.0) pendant qu'un autre client (Cursor) les utilise en parallèle, alors le serveur est sain et c'est la session cliente qui ne monte pas les outils. `ListToolsRequest` OK dans les logs 1MCP confirme l'interprétation.
- **Cas serveur réellement monté** (session suivante) : mêmes outils appelables, `get_current_config` répond, projet `re-ff8` routé, aucune activation nécessaire. Le basculement entre les deux états peut se produire d'une session à l'autre sans changement serveur — re-tester à chaque session avant de conclure.

Leçon : **ne jamais conclure « serveur down » sans le test stdio direct**. La santé du proxy (`/health`) ne prouve pas la montée des outils dans la session courante. ^[inferred]

## Serena spécifique

- Serena expose ses capacités comme **outils**, pas comme resources MCP (`list_mcp_resources(server:"serena")` → vide) ; vouloir « lire des resources » est un angle mort.
- Config via `.codex/config.toml` : `-ProjectPath` et `cwd` pointés sur le dépôt cible (ex. re-ff8). Piège réel : Serena peut rester actif sur le répertoire **parent** (`retro-eng`) pendant qu'on travaille sur `re-ff8` — vérifier le projet actif (`get_current_config`) avant les opérations symboliques, sinon les artifacts partent au mauvais endroit. ^[extracted]

## ida-pro-mcp spécifique

- Serveur HTTP local : `/mcp` (streamable) + `/sse`, config sur `/config.html`. Un 404 sur `/health` est normal ; la lecture de metadata IDA est le vrai test de santé. ^[extracted]
- Override de config en cas d'argument bloquant : dans `.codex/config.toml`, `args` sans `--ida-rpc`. Fallback scripté : `tools/_tmp_wave_review/glm_triple/ida_rpc.py` quand le MCP ne répond pas (voir [[projects/re-ff8/references/semantic-triple-pipeline]]). ^[extracted]

## GrepAI watch

Après reprise de machine ou changement de worktree, relancer le watch : le daemon re-indexe les fichiers modifiés ; le log par worktree est `C:\Users\djden\AppData\Local\grepai\logs\grepai-worktree-<hash>.log`. Un index périmé donne des résultats faussement vides, souvent confondus avec une panne. ^[extracted]

## Arrêts silencieux de session (sans réponse finale) ^[extracted]

Trois causes indépendantes observées : (1) **provider down** — `codex doctor` montre l'URL d'inférence en échec (`…/v1/... connect failed`) ; la génération s'arrête sans message final ; (2) un appel MCP laissé en dernier (« read » traité comme état final) sans texte final généré ; (3) un hook/tool qui coupe avant la réponse. Procédure : `codex doctor` d'abord, puis santé des endpoints, puis relecture du dernier événement du rollout avant de relancer — et **vérifier le delta disque** (un tour avorté peut avoir partiellement exécuté). ^[inferred]

## Liens

- [[projects/re-ff8/concepts/ff8re-hypothesis-runner]] — workflow IDA MCP consommateur de ces endpoints.
- [[projects/re-ff8/skills/ff8-live-validation-operations]] — règles transversales IDA MCP / injection.
- [[concepts/codex-agent-orchestration]] — la couche au-dessus (spawn d'agents) qui hérite de ces pannes.
- [[projects/re-ff8/skills/model-assisted-decompile-bench]] — bench GLM qui dépend du routage et des MCP.
