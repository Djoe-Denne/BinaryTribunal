# Gfx_CopyDescFields92_68 @ 0x40763D

- Confiance: CERTAIN
- Nom catalogue: confirme
- Mode: 1+P
- A==V: n/a (1+P)
- Push IDB: oui (`[semantic-triple 2026-09-15]`, append, save_database=True)
- Preuves:
  - Feuille 16 instr ; 2 xrefs (`TIMrelated_0`, `sub_414A40`)
  - `src+0x5C` → `dest+0xC4` ; `src+0x44` → `dest+0xC8`
  - `src+0x44` = blend TIM, pas GF Exists
  - Nom 92/68 = offsets source ; Hex-Rays index DWORD
- Notes parent: §5.6 vert sur dump live du pack (disasm / xrefs / callees, même session). Occupancy absente. LIKELY → CERTAIN. Tag IDA poussé 2026-09-15 après réparation MCP.

## Analyse réconciliée

# Sémantique Gfx_CopyDescFields92_68 @ 0x40763D (réconciliation 1+P = A)

- Rôle (1 phrase) : Si dest et src sont non nuls, copie deux DWORD du desc TIM source (`src+0x5C` puis `src+0x44`) vers l’objet tex dest (`dest+0xC4` puis `dest+0xC8`) et ne fait rien d’autre — feuille, pas d’upload, pas OpenGL/D3D.
- Confiance : CERTAIN
- Nom catalogue : confirme
- In / Out / Effets : `void __cdecl(_DWORD *dest, _DWORD *src)` ; `retn C3` @ `0x40766B` ; EAX leftover. `dest==0` puis `src==0` → no-op. Sinon DWORD `dest+0xC4 = src+0x5C` puis `dest+0xC8 = src+0x44`. Occupancy 1+2 / TIM queue `0x10` / slot `0xD0` / `F_CHAR 0x1D0` / GF Exists `0x44` absents (`src+0x44` = champ blend du TIM desc).
- Preuves (3–8) :
  1. 16 instr, size `0x2F`. `8B 51 5C` / `89 90 C4 00 00 00` ; `8B 51 44` / `89 90 C8 00 00 00`. Deux `jz` ; 0 callee.
  2. 2 xrefs code : `TIMrelated_0` @ `0x407783` (dest=tex, src=blob) ; `sub_414A40` @ `0x414ABD`. Tous deux enchaînent `TextureRelated2`.
  3. Nom catalogue 92/68 = `0x5C`/`0x44`. Wiki « copy +92/+68→+196/+200 ».
  4. Hex-Rays `a1[49]=a2[23]` / `a1[50]=a2[17]` = index DWORD (`×4` = `+0xC4`/`+0x5C`/`+0xC8`/`+0x44`). GLM = ASM.
- Questions ouvertes : lecteurs de `tex+0xC4` / `tex+0xC8` ; `sub_414A40` anonyme.
