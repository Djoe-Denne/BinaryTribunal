# Gfx_TPageDescribePixelFormat @ 0x463FC0

- Confiance: CERTAIN
- Nom catalogue: confirme (trop étroit pour la moitié aval : proposition `Gfx_TPage_InitPixelFormatAndAllocBuffer`, markdown seul)
- Mode: 1+V
- A==V: oui (ACCEPTE, 2 précisions mineures fusionnées)
- Push IDB: oui
- Preuves:
  - Desc 0xF0 octets @ `slot+0x54` : `mov esi,[eax+54h]` @ 0x463FC7 + `rep stosd ecx=3Ch` @ 0x463FDA (60 DWORD zéroés) ; caller @ 0x465020 `push 0F0h` cohérent.
  - Table de décision exhaustive, 4 cmp sur `arg_8`/ecx uniquement : `jge` **signed** @ 0x463FF1 (mode≥2 → desc+8=0), `jz` @ 0x464029, `cmp ecx,2`+`jnz` @ 0x464043/0x464064, `cmp ecx,1`+`jnz` @ 0x4640CD/0x4640DB. Aucune branche 32bpp.
  - Mode 2 = RGB555 : `Graphics_FillBitfieldLayout(16, 0x7C00, 0x3E0, 0x1F, 0, layout)` @ 0x464083 (6 args, `add esp,18h`), pitch `shl ecx,1` @ 0x46408D (`layout[0]<<1`).
  - Mode 1/0 = paletted : `FillBitfieldLayout(8, 0x7C00, 0x3E0, 0x1F, 0x8000, layout)` @ 0x4640BA ; mode 1 → `desc+0x30=0x10, desc+0x34=0x100, layout+0x20=0x100, layout+0x1C=0x2000` (CLUT8 256×16 shorts) @ 0x4640DD–0x4640EF ; mode 0 → `0x80, 0x10, 0x10, 0x1000` (CLUT4 16) @ 0x4640F8–0x46410A. 0x8000 = STP PS1 sur CLUT.
  - Mode ≥3 code mort garanti par caller : `Gfx_SelectTexturePageDrawList` @ 0x465D13 `cmp edx,3; jl` + early-return → mode ∈ {0,1,2} ; World sites mode 0/2.
  - Globals = capability flags : writers uniques `Gfx_InitTexturePageDrawLists` — `dword_1CCFD80=1` @ 0x46428A (gated bit 0x80 caps vcall `[driver+0xC]` @ 0x46427D), `dword_1CCFD84=1` @ 0x4642B2 (bit 4). Lecteurs : 1CCFD80 → `setIndexedColours_VRAMGPU_2` @ 0x4674B1 ; 1CCFD84 → `sub_461100` @ 0x4611B3, `Gfx_SubmitTexturePageLists` @ 0x465AB3/0x465BC6.
  - Alloc buffer pixel : `slot+0x58` lazy — `imul edx,[edi+4]` @ 0x46412A (pitch×height) → pool `Gfx_Psx2Lookup_OrPoolAlloc_B7E018` @ 0x467160 (code pas 0xB7E018 = table data tailles {0x20000, 0x10000, 0x4000, 0x8000}), bind `desc+0xD8` @ 0x46414A, retour 0 succès / −1 échec (`or eax,0FFFFFFFFh` @ 0x464141) — **ignoré** par caller @ 0x4650BC (pas de `test eax`, enchaîne `Gfx_InitDrawListDesc`).
  - Caller unique `Gfx_AllocTexturePageSlot` @ 0x4650B7 (5 args cdecl droite→gauche @ 0x4650B2–0x4650B6) ; staging CLUT `ctx+0x444` copié layout+0x24 @ 0x46411B chemin paletted seulement, alloué par caller mode<2 (`sub_4653A0(0x4000/0x8000)`).
  - Wiki QMD (`battle-address-catalog` ligne 144) : « TPage 8 vs 16 bpp » — convergent.
- Notes parent: 126 instr → 1+V. §5.6 vert : spot-checks parent live (early-return mode≥3 @ 0x465D10 `and eax,3; cmp edx,3; jl` ; `jge` signed @ 0x463FF1 ; pushes 5 args caller). Précisions V fusionnées : slot+0x18/+0x1C = réciproques float 1/w, 1/h (pas width/height entiers — args par valeur) ; −1 retourné mais ignoré par caller. Piège contourné : `Gfx_Psx2Lookup_OrPoolAlloc_B7E018` vit @ 0x467160, 0xB7E018 est sa table data — résolu via `callees`. V readonly n'a pas pu écrire `semantic_v.md` — persisté par parent.

## Analyse réconciliée

Init du descripteur de pixel format (0xF0 octets : 0x3C header zéro + 0x3C layout bitfield) d'un slot TPage selon le mode `arg_8` : **2 = 16bpp RGB555** (masks 0x7C00/0x3E0/0x1F, pitch width<<1), **1 = 8bpp CLUT 256 entrées** (0x2000 octets), **0 = 8bpp CLUT 16 entrées** (0x1000) — paletted reçoit STP 0x8000 et la copie du staging CLUT `ctx+0x444` dans layout+0x24. Remplit le layout via `Graphics_FillBitfieldLayout` (6 args cdecl, popcounts/masks/shifts/(1<<n)−1). Puis allocation paresseuse du pixel buffer `slot+0x58` (taille pitch×height) via le pool PSX2 à tailles fixes {0x4000, 0x8000, 0x10000, 0x20000} (fallback `AllocateMemory`), pointeur publié dans `desc+0xD8`. Retour 0 succès, −1 si alloc échoue (ignoré par le caller).

In : `arg_0` ctx graphique (champ +0x444 = staging CLUT partagé), `arg_4` slot TPage (desc @ +0x54, buffer @ +0x58), `arg_8` mode (0/1/2), `arg_C` width, `arg_10` height. Mode ≥3 tombe paletted-16 par cascade — code mort (caller borne edx∈{0,1,2}).

Globals `dword_1CCFD80`/`dword_1CCFD84` : capability flags matériels (pas résolution display), écrits une fois par `Gfx_InitTexturePageDrawLists` depuis les caps du driver, lus pour gater alpha-scaling PS1 (0x80) et render-states dithering/stipple CLUT (0x4). Paire exclusive desc+0x08/desc+0x1C = sélecteur famille de format selon caps+mode (sémantique exacte ouverte).

Layout pas DDPIXELFORMAT standard DirectDraw — format interne SSI étendu (géométrie + CLUT intégrées).

Divergence Hex-Rays vs ASM : aucune (pitch width<<1 vs width, +0x444 skip 16bpp, `jge` signed, `imul` pitch×height — conformes).

Questions ouvertes :
1. Sémantique exacte de la paire exclusive desc+0x08 / desc+0x1C (gated caps/mode) — sélecteur famille stockage, LIKELY.
2. Libellés exacts des bits caps 0x80/0x40/0x4 dans le struct caps driver — flags prouvés, noms inconnus.
3. `sub_4653A0` (alloc staging CLUT 0x4000/0x8000 dans ctx+0x444) — wrapper non ouvert ; harmonisation tailles vs count 16/256 à trancher.
4. Constantes desc+0x14=4 / +0x18=8 / +0x20=8 / +0x24=8 / +0x28=0x20 et desc+0x30 (0x80 vs 0x10) — non identifiées.
