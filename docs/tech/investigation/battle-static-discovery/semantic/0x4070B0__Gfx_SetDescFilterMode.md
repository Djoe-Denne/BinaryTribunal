# Gfx_SetDescFilterMode @ 0x4070B0

- Confiance: CERTAIN
- Nom catalogue: confirme
- Mode: 1+P
- A==V: n/a (1+P)
- Push IDB: oui
- Preuves:
  - Feuille 9 instr ; 6 xrefs / 3 funcs
  - `89 48 20` : `desc+20h = filter` ; `jz` si `desc==0`
  - Même champ que `Gfx_InitDrawListDesc` ; Hex-Rays `a2[8]` = `+20h`
  - Pas `glTexParameteri` ; void leftover EAX
- Notes parent: §5.6 vert (bytes live `…89 48 20 5D C3`). Occupancy / GF Exists absents. LIKELY → CERTAIN. Questions ouvertes (valeurs 0–7) hors rôle.

## Analyse réconciliée

# Sémantique Gfx_SetDescFilterMode @ 0x4070B0 (réconciliation 1+P = A)

- Rôle (1 phrase) : Si le descripteur Square `arg_4` est non nul, y écrit le DWORD `arg_0` à `+20h` (même champ filtre que `Gfx_InitDrawListDesc`) et ne fait rien d’autre — pas de clamp, pas de callee, pas OpenGL/D3D.
- Confiance : CERTAIN
- Nom catalogue : confirme
- In / Out / Effets : `void __cdecl(int filterMode, _DWORD *desc)` ; `retn C3` @ `0x4070C3` ; EAX leftover. `desc==0` → no-op. Sinon `desc+20h = filterMode` (`89 48 20`). Occupancy 1+2 / TIM `0x10` / slot `0xD0` / `F_CHAR 0x1D0` / GF Exists `0x44` absents.
- Preuves (3–8) :
  1. 9 instr, size `0x14`. Octets `55 8B EC 83 7D 0C 00 74 09 8B 45 0C 8B 4D 08 89 48 20 5D C3`. Un `jz` ; 0 callee.
  2. 6 xrefs / 3 funcs : `Gfx_CreatePsxPrimitiveObject`, `Gfx_AllocTexturePageSlot` ×4, `BattleSwirl_AllocCaptureResources`.
  3. Sibling `Gfx_InitDrawListDesc` écrit `+20h` à l’init. Catalogue « setter +32 » = `+20h`. Hex-Rays `a2[8]` = index DWORD.
- Questions ouvertes : lecteurs de `desc+20h` ; sémantique 0–4 vs `& 7` chez CreatePsx.
