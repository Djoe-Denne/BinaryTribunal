# Conventions re-ff8

- Cdecl : args poussés droite→gauche. ja/jb = comparaisons unsigned, jg/jl = signed.
- Interdits IDA : rename, patch/patch_asm, SetType. Commentaires : set_func_cmt uniquement,
  tag [semantic-triple YYYY-MM-DD], puis idc.save_database(idc.get_idb_path()). IDB hors git.
- Git : uniquement semantic/ + decomp/ (+ ledger si classe change). JAMAIS tools/_tmp_*,
  configs MCP (.cursor/mcp.json, .codex/config.toml, opencode.jsonc), obsidian-docs, fichiers utilisateur.
- Message commit : semantic(battle): <EA> <nom-court> — via PowerShell here-string.
  Pas de --no-verify, pas de push remote, pas d'amend.
- QMD : lecture MCP autorisée ; update/embed uniquement en CLI.
- Parallélisme : max 5 workers ; à l'intérieur d'un pipeline sérialiser
  pack → A → V → §5.6 → push IDB → commit. Aucun §5.6/push/commit concurrent.