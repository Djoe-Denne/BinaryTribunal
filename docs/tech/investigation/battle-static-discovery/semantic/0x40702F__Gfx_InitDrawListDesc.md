# Gfx_InitDrawListDesc @ 0x40702F

- Confiance: CERTAIN
- Nom catalogue: confirme
- Mode: 1+P
- A==V: n/a (1+P)
- Push IDB: oui
- Preuves:
  - 21 xrefs / 12 funcs ; `add esp,8`
  - `push 84h` + `memset_0` ; `+20h=filter` ; `+40h=0x3F800000` ; `+44h=1`
  - Getters `sub_406F7E`/`sub_406F50` → `+7Ch`/`+8`
  - Sibling `Gfx_SetDescFilterMode` @ `0x4070B0` ; ≠ `GfxDrawList` `0xEC`
- Notes parent: §5.6 vert (bytes live, 34 instr, size `0x81`). Occupancy / GF Exists `0x44` absents. LIKELY → CERTAIN. Questions ouvertes (globaux, flags `1`) hors rôle.

## Analyse réconciliée

# Sémantique Gfx_InitDrawListDesc @ 0x40702F (réconciliation 1+P = A)

- Rôle (1 phrase) : Si `desc ≠ 0`, zéro-remplit un descripteur Square de **0x84** octets puis y pose les DWORD par défaut (filtre `arg_0` à `+20h`, bits `1.0f` à `+40h`, blend-mode `1` à `+44h`, deux globaux via getters) — sans allouer un `GfxDrawList` `0xEC` et sans appeler OpenGL/D3D.
- Confiance : CERTAIN
- Nom catalogue : confirme
- In / Out / Effets : `void __cdecl(int filter, void *desc)` ; `retn C3` ; EAX leftover = `desc` (dernier `mov eax,[ebp+desc]` avant `C7 40 44`), ignoré. `desc==0` → no-op (`cmp [ebp+0Ch],0` / `jz` `74 76` @ `0x407036`). Sinon `memset_0(0x84, desc)` 2-arg interne (`push desc` ; `push 84h` ; `add esp,8`), puis stores DWORD uniquement : `+7Ch=sub_406F7E()` (`dword_B6FB38`), `+4=1`, `+8=sub_406F50()` (`dword_B6FB30`), `+0Ch=1`, `+14h=1`, `+20h=filter`, `+1Ch=1`, `+3Ch=0` (explicite après memset), `+40h=0x3F800000`, `+44h=1`. Pas de clamp 0–4 ici ; pas de type de liste 0–19 ; occupancy 1+2 / TIM `0x10` / slot `0xD0` / `F_CHAR 0x1D0` / GF Exists `0x44` absents.
- Preuves (3–8) :
  1. 34 instr, size `0x81`, `C3` @ `0x4070AF`. Octets : `83 7D 0C 00 74 76` ; `68 84 00 00 00` ; `83 C4 08` ; `89 41 7C` ; `C7 42 04 01…` ; `89 41 08` ; `89 51 20` ; `C7 42 40 00 00 80 3F` ; `C7 40 44 01…`. Un seul JCC (`jz`) ; pas de `66` / `ja` / `jg` / jpt.
  2. 21 xrefs **code** / 12 funcs : CreateDrawList Type1, InitTexturePageDrawLists ×7, UploadCLUTSlot ×2, AllocTexturePageSlot, menus, BattleTransition, BattleSwirl.
  3. Callees : `memset_0` `0x40A75F` ; `sub_406F7E` `0x406F7E` ; `sub_406F50` `0x406F50`. Aucun `gl*` / `GfxDriver_*`.
  4. Sibling `Gfx_SetDescFilterMode` `0x4070B0` écrit `+20h`. `Gfx_SetPrimBlendMode` lit `+44h` comme blend-mode.
  5. Wiki : catalogue « Init desc 0x84 ; arg0 = filtre 0–4, pas type liste ». Hex-Rays index DWORD = piège ; GLM = ASM.
- Questions ouvertes : globaux `dword_B6FB30` / `dword_B6FB38` ; flags `1` à `+4`/`+0Ch`/`+14h`/`+1Ch` ; plage filtre 0–4 = convention callers.
