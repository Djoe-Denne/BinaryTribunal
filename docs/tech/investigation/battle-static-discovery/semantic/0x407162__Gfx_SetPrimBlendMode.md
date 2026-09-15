# Gfx_SetPrimBlendMode @ 0x407162

- Confiance: CERTAIN
- Nom catalogue: confirme
- Mode: 1+V
- A==V: non (V=CORRIGE rôle ; nom confirme)
- Push IDB: oui
- Preuves:
  - 9 xrefs / 9 funcs ; `add esp,0Ch` ; sibling `Gfx_SetTIMDescFlags`
  - `89 48 44` / `8B 42 44` ; `80 CE 04` = `0x400` ; `77 3D` ja unsigned ; `+5C` 80/FF/FF/40
  - Lookup **appelé**, pas inliné : `sub_4187F7` / `sub_4187B0` (xrefs uniques)
  - `push 84h` = `Gfx_InitDrawListDesc` @ `0x40703C` ; `FF 50 6C` @ `0x418815` ≠ `[buf+6Ch]`
  - ≠ driver `0x41E752` ; void EAX leftover
- Notes parent: §5.6 vert. 1+P refusé (86>80). V corrige le rôle trop large de A (callees). Occupancy / GF Exists `0x44` absents (`+44h` = blend-mode). SKIP_NODECOMP → CERTAIN. Questions ouvertes (`+5C`, bit `0x400`, sentinel 6) hors rôle.

## Analyse réconciliée

# Sémantique Gfx_SetPrimBlendMode @ 0x407162 (réconciliation 1+V = V, CORRIGE)

- Rôle (1 phrase) : Si le desc Square (arg2) est non nul, y pose le blend interne (`+0x44` sauf sentinel 6 qui relit, bit `0x400` sur `+8`/`+0xC`, constante `+0x5C` via `ja` 0..3) puis, si applyLookup≠0, **appelle** `sub_4187F7` / `sub_4187B0` — sans memset 0x84, sans `call [eax+6Ch]`, sans copies cinq DWORD dans **ce** corps, et sans le driver `0x41E752`.
- Confiance : CERTAIN
- Nom catalogue : confirme
- In / Out / Effets : `void __cdecl(int applyLookup, int mode, _DWORD *prim)` ; `retn C3` ; EAX leftover ignoré. `prim==0` → no-op. `mode≠6` : `prim+0x44=mode` (`89 48 44`) ; `mode==6` : relire `mode=[prim+44h]` (`8B 42 44`) puis OR `0x400` et switch. Switch unsigned `mode>3u` (`77 3D` ja) : `+5C` = `0x80`/`0xFF`/`0xFF`/`0x40` ; défaut : AND `~0x400` (`80 E6 FB`) après l’OR, `+5C=0xFF`. `applyLookup==0` saute lookup. Occupancy 1+2 / TIM `0x10` / slot `0xD0` / `F_CHAR 0x1D0` / GF Exists `0x44` absents.
- Preuves (3–8) :
  1. 86 instr, size `0x129`, `C3` @ `0x40728A`. `89 48 44` / `8B 42 44` ; `80 CE 04` ×2 ; `77 3D` ja ; jpt `0x4071CC/1D8/1E4/1F0` ; `80 E6 FB` défaut.
  2. 9 xrefs code / 9 funcs ; `add esp,0Ch`. `Gfx_SetTIMDescFlags` @ `0x407631` ; `push 0` @ `0x42CA5D`.
  3. Callees : `FFGetBufferAddress`, `sub_4187F7` +8, `sub_4187B0` +8, `_sprintf` +0Ch, `OutputDebugString_1` +4. Pas `0x41E752`. Helpers lookup : xrefs uniques `0x407234` / `0x407256`.
  4. `push 84h` / memset = `Gfx_InitDrawListDesc` @ `0x40703C`. `FF 50 6C` = `call [eax+6Ch]` @ `0x418815` après `GetBufApp_0xA74`, pas `[buf+6Ch]`.
  5. Hex-Rays `a3[17]`/`[23]` = `+0x44`/`+0x5C`. Wiki E3c interne ≠ driver slot 33.
- Questions ouvertes : constantes `+5C` ; bit `0x400` ; slot `GetBufApp+6Ch` (hors corps) ; sentinel 6 à l’exécution.

## Divergences A/V

- Rôle memset 0x84 / `call [eax+6Ch]` / cinq copies DWORD : **V gagne** (opcodes des callees / sibling, absents de `0x407162`–`0x40728A`).
- `[buf+0x6C]` : **V gagne** (`FF 50 6C` sur EAX de `GetBufApp_0xA74`).
- Nom : **A==V confirme**.
