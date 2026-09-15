# Gfx_WalkDrawList @ 0x4178D7

- Confiance: CERTAIN
- Nom catalogue: confirme
- Mode: 1+P
- A==V: n/a (1+P)
- Push IDB: oui
- Preuves:
  - 30 xrefs code / 0 data ; callers exclusivement scene-submit (`Gfx_SubmitTexturePageLists` ×8, `Gfx_SubmitDisplayLists` ×9, `Gfx_SubmitViewportLists` ×3, transitions, `sub_4B3690`)
  - Opcodes gardes live : `cmp [list],0` jz ; `mov ecx,[eax+34h]` / `mov ecx,[edx+58h]` / `3B 08` jnz — égalité stricte stamp génération
  - `call [edx+9Ch]` @ 0x417963 + `add esp,0Ch` (cdecl 3 args) une fois ; do-while `call [eax+0A0h]` + `add esp,0Ch` @ 0x41796C
  - Head `list+0x94` (0x148) ; `mov eax,[edx+94h]` ; next = DWORD @ node+0 (`8B 11`), NULL-terminé, `jnz 0x41796C`
  - Caller `sub_4B3690` @ 0x4B36AE : `push ebx` (retour `FFGetBufferAddress`) puis `push eax` (list), `add esp,8` → cdecl (list, cookie), EAX non consommé
  - Binder `Gfx_BindDrawListBackendCallbacks` @ 0x41619A = unique writer `+0x9C/+0xA0` par paires → invariant « les deux ou aucun »
  - Wiki QMD `battle-render-pipeline-entrypoints` : struct GfxDrawList 0xEC (+52 gen, +88 stamp, +148 head, +156 setup, +160 walk) = offsets ASM 0x34/0x58/0x94/0x9C/0xA0
  - Cmt IDA préexistant (glm-triple) = même sémantique ; proto Hex-Rays `usercall@eax` rejeté (EAX jamais consommé)
- Notes parent: §5.6 vert (30 code xrefs, offsets live confirmés, add esp cohérent). 65 instr ≤80, A CERTAIN confirme → 1+P. Pack `asm.asm` tronqué — A a récupéré ASM live via MCP IDA. `var_10` morte (code mort compilateur).

## Analyse réconciliée

- Rôle (1 phrase) : Traversée gardée d'une `GfxDrawList236` — valide le stamp de génération (`list+0x58 == *(list+0x34)`), appelle le callback backend setup (`list+0x9C`) une fois, puis le callback walk (`list+0xA0`) pour chaque nœud de la liste chaînée simple depuis `list+0x94`, jusqu'à NULL.
- Confiance : CERTAIN
- Nom catalogue : confirme (« walk » = itération nœud par nœud, « DrawList » = GfxDrawList236 confirmé wiki + binder).
- In / Out / Effets :
  - In : `list` (`_DWORD*`, arg_0) ; `cookie` (int, arg_4, observé = retour `FFGetBufferAddress()` chez `sub_4B3690`, handle buffer/frame opaque passé aux callbacks).
  - Out : `void` (EAX = résidu dernier callback, jamais consommé).
  - Effets : rendu de tous les nœuds de la draw list via callbacks backend du driver (GL / DDraw / Alt selon wiki). Aucun global touché. Garde : exit silencieux si `list==0`, stamp mismatch, head `+0x94==0`, ou setup `+0x9C==0`.
- Preuves : cf. liste ci-dessus (8 preuves A, toutes vérifiées parent live).
- Questions ouvertes :
  - `var_10` (ctx+0x38/+0x3C/+0x68) : sélection écrite jamais lue — code mort, sémantique d'origine non récupérable depuis cette fonction seule.
  - Nature exacte du `cookie` : probable handle buffer frame, rôle interne aux callbacks backend non prouvé.
  - Cas partiel binder (setup non-null + walk null) jamais observé : invariant déduit des paires jpt, pas prouvé exhaustivement.
