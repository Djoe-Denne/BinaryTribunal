# Journal de campagne — décompilation+sémantisation rendu & battle loop (2026-10-08)

> Agent racine campagne : orchestrator sub (plan de contrôle). Binaire `FF8_EN.exe` `064d466b…`, base `0x400000`, IDB live via MCP `ida-pro-mcp` (namespace `ida-pro-mcp`).
> Protocole : `semantic-triple-pipeline.md` (1+V défaut ; 1+P ≤80 instr. + CERTAIN ; 2+1 sur escalade). Ground truth = ASM live.
> Moteurs : C dual-gen GLM Flash (`fireworks/glm-5p3-flash`) + second moteur (GLM Max / fallback 6.1 "hi" ou Sol). Sémantique A = `semantic-analyste-sol`, V = `semantic-reviewer`, 2+1 B = `semantic-analyste-astra`/Sol-variant, R = `semantic-reconciler`.
> Journal append-only, une ligne par événement. Format fonction close : `EA | mode | confiance | nom | A==V | note`.

## État initial (2026-10-08, établi par inventaire)

- `decomp/` : 555 fichiers existants (hérités, ne pas refaire). `semantic/` : 24 livrables.
- Lot A : decomp manquants pour **A2 0x45D310, A3 0x45CEE0, A15 0x510680** ; 12/15 ont un C réconcilié déjà committé. Aucun semantic/ pour le lot A.
- Packs préexistants : `0x45d080` (avec semantic_a.md 09-17 CERTAIN + semantic_v.md 09-17 CORRIGÉ jamais poussés), `0x4617f0`, `0x461a90`, `0x460f20`, `0x45c870` (semantic_a.md 09-17 CERTAIN, propose rename `OT_AllocNode_HeadInsert`).
- Packs générés ce jour via `pack_semantic.py 0x<EA>` : `0x45d310` (144), `0x45cee0` (95), `0x595aa0` (56), `0x5bd460` (56), `0x5e48a0` (60), `0x5ef910` (56), `0x60a290` (56), `0x649740` (60), `0x7040b0` (37), `0x510680` (35).
- Mode par fonction lot A : A1 1+V (A+V hérités, harvest parent) ; A4, A6 1+V ; A5 (243 instr.) 2+1 ; A7, A9, A13, A14, A15 1+P (≤80 instr.) ; A8/A10/A11/A12 famille clones → reps A7+A9, dups par diff ASM (parent) ; A2, A3 1+V après decomp.

## Journal

- START campagne. Tentative wave 1 (5 workers background) : **ÉCHEC — subagent depth limit** : les sous-agents ne peuvent pas spawn (cette session est déjà un subagent). Adaptation : exécution solo séquentielle par le parent — rôle decomp = Hex-Rays + GLM Flash (glm-decompile MCP) réconcilié contre l'ASM live ; « second moteur » indisponible (pas de spawn GLM Max/6.1/Sol) → dégradation notée par fonction, jamais bloquante. Sémantique A/V : parent solo, dérivation indépendante depuis asm.asm du pack, §5.6 en live avant chaque push.
