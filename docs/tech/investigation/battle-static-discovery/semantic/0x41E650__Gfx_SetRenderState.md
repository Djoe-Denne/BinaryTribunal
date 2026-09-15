# Gfx_SetRenderState @ 0x41E650

- Confiance: CERTAIN
- Nom catalogue: confirme (précision possible `Gfx_SetRenderState_ValidateAndDispatchSlot29`, markdown seul)
- Mode: 1+P
- A==V: n/a (1+P)
- Push IDB: oui
- Preuves:
  - `GetBufApp_0xA74` @ 0x4098EE = `mov eax,[eax+0xA74h]; retn` — retourne `*(engine+0xA74)`, vtable-backend à 0xA74 ; callee direct @ 0x41E658 (`add esp,4` → 1 arg).
  - Dispatch `call dword ptr [ecx+74h]` @ 0x41E67E (`FF 51 74`), `add esp,0Ch` @ 0x41E681 → 3 args cdecl, ordre push droite→gauche (engine/value/type) → slot 29 `(type, value, engine)` même signature que le wrapper.
  - Bornes signées : `cmp [ebp+arg_0],0` + `jl` @ 0x41E667, `cmp [ebp+arg_0],1Ah` + `jge` @ 0x41E66D → plage valide 0..0x19 (26 types). Cohérent avec switch Alt `cmp var_1C,19h; ja` (26 cases) @ 0x441072-0x441076.
  - Writers slot 29 (+0x74) : `RenderBackend_Construct_OpenGL` `mov [eax+74h], offset Gfx_ShadowSetRenderState` @ 0x42537C ; DDraw `mov [eax+74h], offset Gfx_ShadowSetRenderState_DDraw` @ 0x42560C ; DDrawAlt `mov [ecx+74h], offset RenderDDrawAlt_SetRenderState` @ 0x4258C4.
  - Impl GL `Gfx_ShadowSetRenderState` @ 0x438599 : `mov ecx,[eax+0A84h]` @ 0x4385A0 (shadow table `engine+0xA84`), NULL-check, `mov [eax+edx*4],ecx` @ 0x4385B8 → écriture shadow `shadow_table[type]=value`, aucun appel GL/D3D (deferred). DDraw @ 0x43B50C identique.
  - Commit différé slot 30 (+0x78) : `mov [ecx+78h], offset RenderGL_CommitRenderState` @ 0x425386, `RenderGL_CommitRenderState` @ 0x438682 lit shadow `engine+0xA84` @ 0x43869E et applique bits `1<<type` ; type 14 = cull `and eax,4000h` @ 0x438831 → `glDisable(GL_CULL_FACE=0xB44)` ; type 16 = ZWRITE bit `0x10000` @ 0x438917 → `glDepthMask` @ 0x438951.
  - Fan-in graphique pur : `sub_407EB4`, `sub_408E90` (16 types), `Gfx_SubmitTexturePageLists` 0x465953, `Gfx_SubmitDisplayLists` 0x4980FD, `Gfx_SubmitViewportLists` 0x499F31, `NormalTransition_*`/`BossTransition_Phase` 0x559C40+, `BattleSwirl_SubmitOverlayQuad` 0x56D6F5 (types 14/16), `sub_460C90`/`sub_461100` (types 0x17/0x1A). 0 data xref.
  - Wiki aligné (`battle-render-pipeline-entrypoints` via QMD CLI, re-récupéré par A car `wiki.md` pack cassé) : 26 render states, shadow `*(engine+2692)[type]` GL/DDraw, commit GPU par bits.
- Notes parent: 28 instr, 1+P éligible. §5.6 vert : callee unique direct vérifié (`GetBufApp_0xA74` = load +0xA74 exact), 3 writers +0x74 + slot 30 +0x78 vérifiés live, polarité jl/jge signée OK, fan-in 100% pipeline graphique. Pack pièges (wiki.md KO, hexrays.c stub, globals.txt vide) contournés par re-récupération MCP par A. Wiki qmd opératoire en CLI sur cette machine.

## Analyse réconciliée

Wrapper cdecl générique `Gfx_SetRenderState(type, value, engine)` : valide le type signé dans [0, 25] (26 types de render state) puis délègue au **slot 29 (+0x74)** de la vtable du backend de rendu retourné par `GetBufApp_0xA74(engine)` = `*(engine+0xA74)` ; hors plage → `OutputDebugString_1("ERROR: INVALID RENDER STATE TYPE \n")`. Retour void.

Sur backends GL/DDraw, le slot 29 (`Gfx_ShadowSetRenderState` 0x438599 / `_DDraw` 0x43B50C) écrit uniquement la table shadow `engine+0xA84[type]` — aucun appel GPU immédiat ; le commit GPU est différé au slot 30 (+0x78) `RenderGL_CommitRenderState` (0x438682) qui applique les états modifiés par bits `1<<type`. Le backend DDrawAlt (`RenderDDrawAlt_SetRenderState`, installé @ 0x4258C4) a un switch D3D immédiat séparé (type 14 → D3DRS_CULLMODE).

Types observés chez les callers : 0, 2, 3, 4, 5, 6, 8, 9, 10, 12, 13, 14 (cull, bit 0x4000), 15, 16 (ZWRITE, bit 0x10000), 18, 23, 0x17, 0x1A. Types 1, 7, 11, 17, 19–22 sans usage identifié (cases vides du switch Alt). Type 16 (ZWRITE/glDepthMask) est distinct de la « liste-16 » morte évoquée ailleurs.

Questions ouvertes : sémantique exacte des types non observés (1, 7, 11, 17, 19–22) ; paire globale `dword_1CA9A88`/`dword_1CA9A8C` (sub_460C90/sub_461100) non typée ; layout complet de la struct engine (+0xA74 vtable vs +0xA84 shadow table) non documenté.
