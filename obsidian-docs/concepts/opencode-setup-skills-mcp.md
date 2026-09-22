---
title: OpenCode Setup Skills MCP
category: concepts
tags: [concept, reverse-engineering, testing]
aliases: [opencode setup, default_agent orchestrator, opencode.jsonc, opencode mcp, skills opencode]
sources:
  - opencode://ses_f47402b9affeYvfIRi7C1ElhL9
  - ~/.local/share/opencode/opencode.db (DB des sessions OpenCode ; sessions subagents non distillées ici)
  - opencode.jsonc (racine du dépôt re-ff8)
summary: Infra OpenCode V2 durable du projet — agents/skills portés depuis Codex/Cursor, default_agent=orchestrator (mode all), MCP context-mode/RTK/QMD/serena-1MCP/ida-pro-mcp, priorités providers glm-5.3-flash.
provenance:
  extracted: 0.85
  inferred: 0.13
  ambiguous: 0.02
created: 2026-09-22T12:00:00+02:00
updated: 2026-09-22T12:00:00+02:00
---

# OpenCode Setup Skills MCP

Infrastructure OpenCode V2 installée le 2026-09-19 sur ce poste pour le projet re-ff8 : les agents et skills existants (Codex, Cursor) ont été portés dans OpenCode, les MCP génériques ajoutés, et la config projet réglée pour que l'orchestrator prenne la main. Les sessions orchestrator qui ont exécuté la campagne gfx en découlent : [[projects/re-ff8/references/gfx-decomp-campaign-2026-09-19-22]].

## Agents et modèles ^[extracted]

- Les agents Codex (`.codex/agents/*.toml`) et Cursor (`.cursor/agents/*.md`) ont été copiés comme agents OpenCode ; chaque agent est réglé sur **GLM 5.3 Flash** avec priorité providers **OpenCode (opencode-go) → ZAI Coding (zai-coding-plan) → Fireworks**, dans cet ordre.
- L'agent `orchestrator` a été porté en `mode: all` (primary **et** subagent) — condition requise par OpenCode pour qu'il soit éligible comme agent par défaut ; s'il n'était qu'en `subagent`, la config serait ignorée silencieusement au profit de `build`.

## Session par défaut ^[extracted]

- `opencode.jsonc` du projet porte `"default_agent": "orchestrator"` : toute **nouvelle** session re-ff8 démarre sur l'orchestrator, le sélecteur d'agent de l'UI restant utilisable à la volée.
- Le champ est **scopé au projet** ; le global (`~/.config/opencode/opencode.json`) a été volontairement évité car l'orchestrator est spécialisé re-ff8. Les sessions existantes gardent leur agent (stocké par session, la config ne s'applique qu'à la création). Revenir en arrière = supprimer la ligne.
- `orchestrator` n'a pas de permissions restrictives : héritage des défauts (tout autorisé, lectures `.env` et accès hors workspace en `ask`) — comportement attendu d'un superviseur racine qui valide et commit lui-même.

## MCP installés ^[extracted]

| MCP | Rôle | Note opérationnelle |
| --- | --- | --- |
| context-mode | gestion du contexte | installé via 1MCP |
| RTK | outils génériques | — |
| QMD | recherche locale indexée | CLI uniquement ; jamais `qmd update/embed` en campagne |
| serena | code symbolique | passé par le proxy **1MCP** |
| ida-pro-mcp | IDA remote | `127.0.0.1:13337` ; cache ~120 000 strings au boot ; à vérifier avant toute campagne (port fermé → opérateur) |
| glm-decompile | décompilation LLM | installé puis **déclaré mort et interdit** dès le 2026-09-19 — ne pas utiliser |

## Contraintes providers observées (durable) ^[extracted]

- `zai-coding-plan` plafonne à ~**2 voix simultanées** au-delà desquelles des 429 apparaissent ; le quota journalier s'est signalé à 91 % avec reset à heure fixe (21h57) — bascule temporaire sur opencode-go seul puis retour possible.
- Mode de lancement adaptatif éprouvé : créer autant de sous-agents que possible et **s'arrêter au premier rate limit**, plutôt qu'un pool fixe.
- Quand ida-pro-mcp répond de façon inattendue (surcharge), insérer un **sleep aléatoire 10–120 s** (pas de skip).
- Les proxys 1MCP tournent comme des processus `node.exe` de longue durée : ils peuvent verrouiller un binaire pendant une mise à jour d'éditeur (voir l'incident os error 5 dans [[projects/re-ff8/references/gfx-decomp-campaign-2026-09-19-22]]).

## Liens

- [[concepts/codex-agent-orchestration]] — mécanique de pools/subagents (côté Codex, généralisable).
- [[concepts/mcp-tool-availability]] — diagnostic « MCP en panne » vs « outils non montés ».
- [[concepts/9router-model-routing]] — couche de routage modèle sous-jacente.
- [[projects/re-ff8/references/gfx-decomp-campaign-2026-09-19-22]] — première campagne exécutée avec cette infra.
