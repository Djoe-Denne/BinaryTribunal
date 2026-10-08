# Gpu_EmitPolyFT3 @ 0x4617F0

- Confiance: CERTAIN (structure) / LIKELY (détails flags & LUT) — solo parent, dérivation ASM + §5.6 live, pas de V adversariale (subagent depth limit)
- Nom catalogue: IDA conservé
- Mode: 1+V solo (spawn impossible — A+P dans une passe, caveat noté)
- Push IDB: oui, [semantic-triple 2026-10-08], pas de rename
- Preuves §5.6 parent (live IDB 2026-10-08):
  - Callees: `sub_461A30` (461812), dispatch indirect `funcs_461842[eax*4]` (46183b/461842), `sub_461220` (46184e)
  - Table dispatch entrée: idx 36/37 (`0x24/0x25`) @0xB7CF08 et 38/39 @0xB7D308 → 0x4617F0 — famille GP0 FT3
  - Slots per-vertex stride 0x20 (edi = [record+74h]) : texcoords flottants +18/1C/38/3C/58/5C ; couleurs +10/30/50 ; verts transformés +0/4/+20/24/+40/44
  - Transform: `fmul dword_B7CC00` / `fadd flt_1CA89E0` (x) ; `fmul dword_B7CC04` / `fadd flt_1CA89E4` (y) — idem A6 (0x460F20)
  - 2 chemins texcoords : `dword_1CA8848 != 0` → fmul `dword_1CB603C`(u)/`dword_1CB6038`(v) ; sinon copies LUT `dword_1CA9EB0[byte]` (4618f3..46193)
  - bit0 `[esi+7]` set → couleur forcée 0xFFFFFF (461949-461957, stores 461963/461978/461993)
  - `cmp dword_1B4780C, 2` puis `jz loc_461A24` aux 461a0f (flags conservés via FPU/pops) — skip la fin
  - Tail : `edx=[ebp+7Ch]; [edx]=al(var_8); [ebp+80h]=ecx(dword var_8)` (461a11-461a1e)
  - cdecl 1 arg, `add esp,8` épilogue, 4 pushes ebx/ebp/esi/edi symétriques

## Analyse réconciliée

# Sémantique Gpu_EmitPolyFT3 @ 0x4617F0 (1+V solo)

- Rôle (1 phrase) : entrée dispatcher du triangle texturé FT3 (GP0 0x24/0x25 et 0x22/0x23 bas-bits) : résout l'enregistrement d'état par code (`sub_461A30(code, u16 @+0xE, u16 @+0x16, &var_8)`), dispatch une fonction de combiné couleur (`funcs_461842[(dword_1CA8884*2 + (code>>1&1))*4]`, arg `pkt+4`), attache le target `[rec+74h]`, écrit les slots per-vertex (stride 0x20) : texcoords (2 chemins : float via LUT mult `dword_1CB603C/0x38` si `dword_1CA8848` posé, sinon copies LUT `dword_1CA9EB0[uByte]`), couleur (override 0xFFFFFF si bit0) et verts transformés (scale B7CC00/B7CC04 + offsets), puis backwrite `var_8` vers `[rec+7Ch]/[rec+80h]` si `dword_1B4780C != 2`.
- Confiance : CERTAIN (structure + math) / LIKELY (sémantique exacte de bit0, `1CA9EB0`, `1CB603C/38`, `1B4780C=2`, var_8)
- In / Out / Effets : cdecl, 1 arg stack `pkt` (FT3 : header +0..7, verts S16 +8..+0x13, u/v bytes +0xC..0x1D). Retour non défini par l'ASM.
- Preuves (3-8, adresses ASM) :
  1. `461804-461812` : args de `sub_461A30` = code byte + mots `[esi+0xE]/[esi+0x16]` + pointeur local var_8.
  2. `461817-46182d` : ebp = record; skip si 0 ; mode/blend key = `dword_1CA8884` + bit1 du code.
  3. `46183b-461842` : call indirect `funcs_461842[...]` (arg pkt+4 résultat → ebx couleur).
  4. `4618e9-46193` : chemin LUT `dword_1CA9EB0[uByte]*4` des coordonnées ; cf. 46188e-4618e4 le chemin fmul (1CA8848≠0).
  5. `461943-461957` : bit0 code set → force 0xFFFFFF.
  6. `46195b-461a0a` : transform 3 sommets (idem A6) stores slots +0/4/+20/24/+40/44 ; couleurs +10/30/50.
  7. `4619cc-4619d4` + `461a0f` : cmp `dword_1B4780C,2` (flags) → jz épilogue.
  8. `461a11-461a1e` : `[rec+7Ch]` = byte var_8, `[rec+80h]` = dword var_8.
- Questions ouvertes : sémantique LUT 0x1CA9EB0 (prob conversion u/v → offset vers CLUT/texpage), var_8 (retour sub_461A30 → probable index CLUT/rot), mode `1B4780C==2` (skip backwrite) — à caler aux lots C/B.
