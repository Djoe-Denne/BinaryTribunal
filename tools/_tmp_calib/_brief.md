# Brief calibration v2 — corps commun aux trois bras

Contexte : calibration cross-model du pipeline sémantique re-ff8. Tu produis une analyse A standard §5.3 à l'aveugle sur un pack de contexte, en contexte de calibration — le livrable sert de jauge comparative entre moteurs (modèles), pas de décision pipeline.

## Paquet

- Pack calib : `tools/_tmp_calib/0x45c0f0/` (10 fichiers canoniques : asm.asm, meta.json, callees.txt, callers.txt, callgraph.json, globals.txt, wiki.md, hexrays.c, grepai.txt, qmd_search.txt). EA 0x45C0F0, nom IDA Gpu_PackDrawEnvPacket.
- **Blindfold par isolation de répertoire** : lis UNIQUEMENT ce pack. **Interdiction absolue** d'accéder au pack source `tools/_tmp_semantic_triple/0x45c0f0/` (contient des analyses pré-existantes — l'accéder biaiserait l'aveugle).
- Sources vivantes autorisées : IDB read-only via ida-pro-mcp (disasm, xrefs_to, callees, decompile, py_eval lecture). **QMD vivant : DÉSACTIVÉ.** **MCP grepai vivant : DÉSACTIVÉ** (les deux peuvent faire remonter le decomp committé de 0x45C0F0 = fuite de prior art). Les fichiers `qmd_search.txt` et `wiki.md` DANS le pack restent lisibles — c'est la recherche vivante qui est coupée, pas les fichiers du pack.

## Invariants

- Ground truth = ASM. Le nom catalogue n'est pas une preuve. Pas d'invention de library calls. Args cdecl poussés droite→gauche. ja/jb unsigned vs jg/jl signed.
- Jamais de rename, jamais d'écriture IDB, jamais git, pas de spawn. Worker feuille.
- Barème : CERTAIN seulement si callers + callees + wiki alignés ET opcodes cités. Hypothèse incertaine = LIKELY/UNCERTAIN, jamais déguisée en fait.

## Contrat de sortie

Format §5.3 standard (Rôle / Confiance / Nom catalogue / In-Out-Effets / Preuves 3–8 / Questions ouvertes). Fichier : `tools/_tmp_calib/<moteur>/semantic.md` avec en-tête `# Sémantique Gpu_PackDrawEnvPacket @ 0x45C0F0 (analyse calibration <moteur>)`. `<moteur>` est donné par l'orchestrator (ex. `glm2`, `sol`, `astra`).

## Réponse au parent (caveman full)

Livrable fichier complet ; réponse = chemin + confiance + verdict nom + 1 phrase rôle + risques. Pas l'analyse inline. Pas de dump ASM.
