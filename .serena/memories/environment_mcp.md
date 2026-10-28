# Environnement (Windows)

- Serena via runtime 1MCP partagé http://127.0.0.1:3050 — pool de backends par racine projet.
  Proxy stdio : C:/Users/djden/.config/1mcp/serena-proxy.ps1 (OpenCode, Codex et Cursor l'utilisent).
  Si runtime mort : renommer background-runtime.json / runtime.owner / background-launch.json
  dans C:/Users/djden/.config/1mcp, puis : 1mcp serve --background --config-dir
  C:/Users/djden/.config/1mcp --host 127.0.0.1 --port 3050 --template-context-trust verified --enable-config-reload
  (bug vu 2026-10-01 : réclamation orpheline sur PID recyclé bloquait tout redémarrage).
- GrepAI : index observé du parent retro-eng partagé entre re-ff8 et FinalFantasy_VIII_Reimaginated.
  re-ff8/.grepai n'existait pas lors du contrôle lot21. Le MCP natif depuis re-ff8 fonctionnait;
  vérifier la config actuelle et les chemins des résultats sans changer arbitrairement la racine.
- QMD : MCP local, 741 docs (collections ff8-wiki, wiki...). glm-decompile : tools/glm_decompile_mcp.py (gateway LiteLLM GLM).
- Configs en couches : opencode.jsonc (repo) miroir de .cursor/mcp.json (repo) et .codex/config.toml
  (global + repo, fusionnés par Codex — la config repo gagne).
- Python C:/Python313 ; uvx serena-agent (cache uv) ; PowerShell avec -NoProfile.

## Observations et garde de routage (discussion lot21, consolidée 2026-10-02)
- Readiness Serena revérifiée le 2026-10-02 : projet re-ff8, contexte codex, LSP ready; ne jamais activate_project sur l'instance 1MCP partagée.
- Les procédures de réparation ci-dessus sont un historique de configuration, pas une autorisation de renommer des claims/locks ou redémarrer les MCP dans un chat de travail. En échec Serena/context-mode, appliquer le skill serena-context-mode-repair et les instructions actuelles de l'opérateur.
- Dans le chat lot21, 1MCP avait d'abord une claim runtime-owner PID3996 et des erreurs de lancement/connexion; le retest ultérieur a réussi via outils MCP natifs. Ce chat n'a pas démontré lui-même un correctif de cache ni le recyclage du PID.
- GrepAI a été testé avec succès via le MCP natif depuis re-ff8. L'index observé se trouvait sous retro-eng (pas de re-ff8/.grepai). La config locale lançait mcp-serve avec re-ff8 : ne pas transformer l'emplacement actuel de l'index en obligation de changer la racine MCP. Toujours vérifier le périmètre et les chemins des résultats; ne pas réutiliser des résultats d'un autre projet.
- Headroom a été abandonné explicitement par l'opérateur dans ce chat après health inaccessible et exécutable prescrit absent. Cette décision est propre à la session, pas une suppression permanente des règles du projet.
- QMD : le rôle orchestrator interdit actuellement update/embed; le lot21 a seulement exécuté un smoke sur l'index existant. Les nouveaux docs peuvent donc ne pas être recherchables tant qu'un rebuild autorisé n'a pas été fait.
