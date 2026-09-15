# Gpu_DrawOTagCurrent @ 0x45D610

- Confiance: CERTAIN
- Nom catalogue: trop large — proposition `Gpu_DrawOTagThunk`
- Mode: 2+1
- A==V: n/a (2+1 ; A==B rôle/nom ; R corrige EAX + 11 callers)
- Push IDB: oui
- Preuves:
  - Thunk 5 instr `8B 44 24 04 50 E8 66 FA FF FF 59 C3` → `Gpu_DrawOTag` @ `0x45D080`
  - `xrefs_to(0x45D080)` unique = `0x45D615`
  - 18 xrefs code / 11 fonctions ; têtes poussées par l’appelant (`6A FF` ou calculée)
  - `EAX` = retour du callee (`call` écrase) ; `pop ecx` cdecl +4
  - Wiki : thunk, pas un upload texture
- Notes parent: §5.6 vert. 1+P refusé (A trop large). Escalade 2+1. Occupancy / tag 07 / code 24 absents. `8B 44 24 04` = `[esp+4]`, pas champ `+44h`. Skip rename IDA. SKIP_NODECOMP → CERTAIN. Questions ouvertes (retour DrawOTag, remap `-1` dans `0x45D080`) hors rôle.

## Analyse réconciliée

# Sémantique Gpu_DrawOTagCurrent @ 0x45D610 (réconciliation R)

- Rôle (1 phrase) : thunk cdecl de 5 instructions qui relit `ot_head` depuis `[esp+4]` et le transmet à `Gpu_DrawOTag` @ `0x45D080`, unique entrée code du walker d’ordering table PS1.
- Confiance : CERTAIN
- Nom catalogue : trop large — proposition (markdown seul) `Gpu_DrawOTagThunk` (le corps ne choisit aucun OT « courant » ; l’appelant pousse la tête, souvent `0xFFFFFFFF`)
- In / Out / Effets : cdecl, 1 DWORD `ot_head` à `[esp+4]`. `EAX` = valeur de retour de `Gpu_DrawOTag` (`call` écrase `EAX` ; ce n’est ni `ot_head` conservé ni « EAX inchangé »). Aucun global lu/écrit dans ces 5 instructions. `pop ecx` (`59`) = cleanup cdecl de l’argument poussé vers DrawOTag, pas stdcall ; l’appelant nettoie encore son propre push (`add esp,4` ou batch). Effets GPU / tables / VRAM = callee uniquement (hors rôle). Occupancy 1+2 / `TEST AL,2` / disp struct `+44h` / `0xD0` / `0x1D0` / tag OT 07 / code 24 : absents (le `44` de `8B 44 24 04` est le ModR/M + SIB `[esp+4]`).
- Preuves (3–8) :
  1. Opcodes live `8B 44 24 04 50 E8 66 FA FF FF 59 C3` → `Gpu_DrawOTag` @ `0x45D080`. 5 instr, size `0xC`.
  2. Callee unique ; `xrefs_to(0x45D080)` = call @ `0x45D615`.
  3. 18 xrefs code / 11 fonctions (`get_func().start_ea`). Têtes fournies par l’appelant (`6A FF` ou calculée).
  4. Wiki thunk / pas upload TIM ; chaîne BdLink → ce thunk → DrawOTag.
  5. Hex-Rays = GLM = `return Gpu_DrawOTag(ot_head)`.
  6. cdecl : `pop ecx` + `retn C3`, pas `retn 4`.
- Questions ouvertes : signification de l’`int` renvoyé par `Gpu_DrawOTag` ; politique `ot_head=0xFFFFFFFF` dans `0x45D080` ; identité `sub_52EF80` / `sub_52FE80` / `sub_537F30` / `sub_559240`.

## Divergences A/B

- Callers 11 vs 12 : **11** (A). B/pack off-by-one (`fn.addr` = site d’appel).
- EAX : B gagne — retour du callee, pas « inchangé ».
- HiddenDebug 3 têtes : A gagne (4074/406C/4070).
- BdLink : xref = call `0x5006DF` ; stride `0x4488` chez l’appelant.
- Sentinelle `-1` : remap dans DrawOTag hors rôle.
- Nom : trop large + `Gpu_DrawOTagThunk` (A=B=R). Pas mensonger.
