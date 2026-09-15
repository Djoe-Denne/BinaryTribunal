# Gfx_ShadowSetRenderState_DDraw @ 0x43B50C

- Confiance: CERTAIN
- Nom catalogue: confirme
- Mode: 1+P
- A==V: n/a (1+P)
- Push IDB: oui
- Preuves:
  - Diff byte-exact 38/38 avec jumeau GL `Gfx_ShadowSetRenderState` @ 0x438599 (mêmes opcodes, seules adresses diffèrent : store `mov ecx, [eax+0A84h]` @ 0x43B513 vs 0x4385A0 ; `mov [eax+edx*4], ecx` @ 0x43B52B vs 0x4385B8 ; jz guards 0x43B520 vs 0x4385AD).
  - Résolution table : `mov ecx, [eax+0A84h]` @ 0x43B513 (`8B 88 84 0A 00 00`) — table shadow = `*(engine+0xA84)` (engine+2692), champ direct.
  - NULL-guard : `cmp [ebp+var_4], 0` + `jz short loc_43B52E` @ 0x43B51C/0x43B520 — zero-check, aucune gate de bornes locale (borne [0,25] dans wrapper 0x41E650 uniquement).
  - Store indexé : `mov [eax+edx*4], ecx` @ 0x43B52B (`89 0C 90`) — `shadow_table[type] = value`, DWORD, stride `*4`.
  - Leaf pure : zéro `call`, zéro `add esp`, `retn` C3 @ 0x43B531 — aucun appel DDraw/D3D.
  - Install vtable : `mov dword ptr [eax+74h], offset Gfx_ShadowSetRenderState_DDraw` @ 0x42560C dans `presentation::RenderBackend_Construct_DDraw` — slot 29 ; xref unique = data.
  - Wrapper appelant `Gfx_SetRenderState` @ 0x41E650 : gate signée `jl`/`jge` [0,25] @ 0x41E667/0x41E66D, pushes droite→gauche, `call dword ptr [ecx+74h]` @ 0x41E67E, `add esp, 0Ch` @ 0x41E681 — cdecl `(type, value, engine)`.
  - Consommateur DDraw (commit slot 30) : `mov dword ptr [ecx+78h], offset sub_43B57F` @ 0x425616 (voisin du slot 29 dans même construct) ; `sub_43B57F` lit `mov eax, [edx+0A84h]` @ 0x43B59B + dirty-mask `*(arg_0+0xC)` @ 0x43B58F-voisinage, symétrique exact de `RenderGL_CommitRenderState` @ 0x438682 (slot 30 GL installé @ 0x425386).
  - Wiki QMD (`battle-address-catalog`, re-récupéré CLI) : 26 render states, GL/DDraw shadow `*(engine+2692)[type]`, commit GPU slot 30 — aligné (2692 = 0xA84).
- Notes parent: 15 instr, 1+P. §5.6 vert : diff byte-exact vérifié A, install slot 29 + consommateur slot 30 DDraw (sub_43B57F @ 0x425616, lecture `engine+0xA84` @ 0x43B59B) vérifiés parent live. Découverte session : commit DDraw = `sub_43B57F` (candidat `RenderDDraw_CommitRenderState`, markdown seul) ; son wrapper 2-args `sub_43B532` @ 0x425620 slot 31 (+0x7C) à qualifier plus tard. `wiki.md`/`hexrays.c` pack cassés → re-récupérés live par A (wiki OK, confiance non plafonnée).

## Analyse réconciliée

Handler DDraw du slot 29 de la vtable gfx-driver (+0x74, installé @ 0x42560C) : setter d'état de rendu en shadow software — `*(engine+0xA84)[type] = value` (26 entrées DWORD, stride `*4`), NULL-guard silencieux — sans toucher au GPU. Jumeau byte-exact du GL `Gfx_ShadowSetRenderState` @ 0x438599. Commit GPU différé au slot 30 (+0x78) : `sub_43B57F` (candidat nom `RenderDDraw_CommitRenderState`, markdown seul) qui lit la même table `engine+0xA84` et applique les états par bits `1<<type` — symétrique de `RenderGL_CommitRenderState` @ 0x438682 côté GL.

In (cdecl, depuis wrapper 0x41E650) : `type` (index, borné [0,25] par le wrapper), `value` (DWORD), `engine` (ptr ctx gfx). Out : aucun retour contractuel (EAX résiduel — `engine` sur path NULL, table sur path store ; personne ne consomme le retour, wrapper void).

Le backend DDrawAlt n'utilise PAS ce shadow : switch D3D immédiat séparé (`RenderDDrawAlt_SetRenderState`, installé @ 0x4258C4).

Divergence Hex-Rays vs ASM : aucune. Divergence GLM A vs ASM : EAX résiduel path NULL (`engine` arg_8) — GLM A l'ignorait (aurait retourné 0 sur NULL), rejeté ; retour non contractuel de toute façon.

Questions ouvertes :
1. `sub_43B57F` (commit DDraw slot 30) sans nom catalogue — candidat `RenderDDraw_CommitRenderState` (markdown seul, jamais l'IDB).
2. Wrapper 2-args `sub_43B532` @ 0x43B532 installé slot 31 (+0x7C) @ 0x425620 — à qualifier.
3. EAX résiduel path NULL : académique (retour non consommé).
