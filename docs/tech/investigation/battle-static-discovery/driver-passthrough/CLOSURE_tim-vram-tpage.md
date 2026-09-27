# CLOSURE — chaîne texture battle FF8 : DAT → TIM → VRAM → TPage/CLUT → lookup UV final

> Ground truth = IDB live FF8_EN.exe (base 0x400000), disasm + Hex-Rays relués contre l'ASM.
> Fermeture 2026-09-27. Aucun rename / patch / SetType effectué (worker read-only).
> Chaque maillon est EA-cité (disasm live de ce run ou decomp committé antérieur).
> Complète `CLOSURE_walkdirect-texture-chain.md` (lot 15, chemin sprites F_CHAR) — les deux
> pipelines coexistent ; ce document ferme le chemin **modèles battle** (c0m/dXcYYY/dXwYYY).

## 0. La chaîne en une ligne

```
DAT c0m/dX* → TIMs 8bpp (container {count, offset})
  → 0x507400 BattleModel_AllocateTexturePagesAndPatchTPage      [allocation slots + RELOCATION VRAM clut.y/img.x/img.y + stage CLUT byte_1D98B60]
  → 0x507550 BattleMesh_RemapPrimitiveTPageBits                 [patch refs CLUT/TPage des primitives mesh]
  → ring BattleTimQueue (0x505E30 type-1) → 0x505D20 FlushToVram → 0x45BD30 copyblockToVRAM
  → miroir VRAM PSX 0x1B47818 (1024×512 u16, stride 0x800)
  + par frame : 0x509E00 bande CLUT acteur (byte_1D98B60 + 1024*g → rangées 0xE0+2g/0xE1+2g)
  → draw : 0x502D40 BattleActor_DrawBodyAndWeapon → RenderGeometry → packets OT (g_BattlePacketCursor)
  → dispatch Gpu (g_GpuPrimDispatchOpaque) → 0x4617F0 Gpu_EmitPolyFT3 / 0x461A90 Gpu_EmitPolyFT4
      UV : u8 × (1/W, 1/H) du window packet (sub_45BC60) — fallback LUT clamp(u,1,254)/256
  → 0x461A30 sub_461A30 → 0x465CE0 Gfx_SelectTexturePageDrawList (slot par mode+txbase+window)
  → Gfx draw lists → 0x4178D7 Gfx_WalkDrawList → backend 0x43E24A DIP FVF (ou 0x437177 GL)
      (+ bias additif sub_409C6E, gated ctx+0xBF4, défaut OFF)
```

## 1. Q1 — sub_507400 : qu'écrit-elle exactement ?

Fichier : `decomp/0x507400__BattleModel_AllocateTexturePagesAndPatchTPage.md` (C réconcilié
complet, 107 instr live). Résumé EA-cité :

| Action | Preuves |
|---|---|
| Container TIMs = `{u32 count @+0, u32 offset @+4}` ; itération signée | @0x507410-419 (`jle` SIGNED) |
| Garde CLUT 8bpp : `clut.x (u16 @tim+0xC) < 0x100` halfwords ET `clut.y (u16 @tim+0xE) ∈ [0xE0,0xF0)` | @0x507426 / @0x507435-449 |
| Allocation slot = premier bit libre de `occupancy \| prevMask` (15 bits) | @0x507462-484 |
| **RELOCATION VRAM CLUT : `clut.y := 0xE0 + slot`** (x inchangé) | @0x50748B-49B |
| **Stage CLUT** : 0x200 octets (256 entrées u16) de `tim+0x14` → `byte_1D98B60 + slot*0x200` (slots 0..5 seulement) | @0x5074A9-B6 (`BS_CopyGeometry`, `add esp,0Ch` @0x5074BB) |
| `tpage_map[y-0xE0] = slot` (QUIRK ASM : y≥0xE8 écrit hors des 8 octets → clobber arg_0/occupancy, bénin si y≤0xE7) | @0x507494 (`88 9C 0C 34FFFFFF`) |
| **RELOCATION VRAM image** (après `esi += *(u32*)(tim+8)` = len CLUT, @0x5074BE-C0) : slot<12 : `x := (x&0x3F) + (slot/2+10)*64` halfwords, `y := (y&0x7F) + (slot&1)*128` ; slot 12..14 : `x := (x&0x3F) + (slot-2)*64`, `y := (y&0x7F) + 0x80` | @0x5074DF/0x5074EE / @0x50750E/0x507512 |
| Enqueue type-1 par TIM → FlushToVram uploadera CLUT puis image aux coords patchées | @0x507517 (`BattleTimQueue_EnqueueType1` 0x505E30) |
| Patch des primitives mesh (refs CLUT/TPage) via `BattleMesh_RemapPrimitiveTPageBits` | @0x50753B-D |

- **Largeur source** : le bloc CLUT est copié en **mots 16 bits** (256 entrées u16 = 512 B) ;
  le bloc IMAGE 8bpp du TIM fichier est en **2 texels/mot** (format TIM PSX standard) — preuve
  indirecte mais ferme : `copyblockToVRAM` (0x45BD30) copie `w*2` octets par ligne, où `w` est le
  champ largeur TIM **en halfwords** (@0x45BD54 `v6 = 2*v4`, qmemcpy ligne @0x45BD82).
- **bpp moteur** : le miroir VRAM est en 16 bits/halfword PSX (1024×512 u16) ; les textures 8bpp
  y sont **packées 2 texels/halfword** ; le dépaquetage 1 texel/octet n'existe que dans les
  buffers objets du chemin sprite (§3).
- **Relation buffer pixels@T+0xD8 ↔ VRAM** : AUCUNE pour les modèles battle. T+0xD8 appartient au
  chemin sprites F_CHAR (lot 15 : sub_421C41 remap → sub_421F9A create @0x422043). Le chemin
  battle modèles lit la VRAM miroir 0x1B47818 via les page-slots Gfx (§2-3).

## 2. Q2 — le lookup final des UV au draw

### 2.1 Conversion UV (le facteur existe, et il est 1/W — PAS 1/256 fixe)

Émetteurs de primitives (dispatch GPU du stream battle) — `Gpu_EmitPolyFT3` @0x4617F0 (161
instr, decomp committé) et jumeaux `Gpu_EmitPolyFT4` @0x461A90, sub_461E00, sub_462030
(xrefs des deux globals ci-dessous) :

```c
/* ASM live @0x461891-0x4618E4 (FT3), motif identique FT4/461E00/462030 : */
v[i].u = (float)u8_packed * dword_1CB603C;   /* fild u8 ; fmul 1CB603C ; fstp [vert+18h/38h/58h] */
v[i].v = (float)v8_packed * dword_1CB6038;   /* fild u8 ; fmul 1CB6038 ; fstp [vert+1Ch/3Ch/5Ch] */
/* sinon (latch dword_1CA8848 == 0) — @0x4618E9-0x461940 : */
v[i].u = dword_1CA9EB0[u8];  v[i].v = dword_1CA9EB0[v8];   /* LUT = clamp(idx,1,254)/256 */
```

- `dword_1CB603C` = `*(slot_page+0x18) = 1.0f/W`, `dword_1CB6038` = `*(slot+0x1C) = 1.0f/H`
  — `Gfx_AllocTexturePageSlot` @0x464F70 (`fild W ; fdivr 1.0 @0xB69544`), copie dans
  `Gfx_SelectTexturePageDrawList` @0x465FC5/0x465FCB.
- W/H viennent du **packet texture-window** décodé par `sub_45BC60` (decomp :
  `0x45BC60__Gpu_SetTextureWindow_PageRectScales.md`), appelé depuis les handlers Gpu
  0x462EC5 / 0x463225 :
  `x = ((v>>10)&0x1F)*8`, `y = ((v>>15)&0x1F)*8`, `W = 256 - (v&0x1F)*8` (0→256),
  `H = 256 - ((v>>5)&0x1F)*8` (0→256), clamp `x+W ≤ 256`, `y+H ≤ 256` (@0x45BCF4/0x45BD12).
- LUT fallback : init sub_45B460 @0x460BB1 — `LUT[0]=0x3B800000 (1/256)`, step
  `flt_B695FC = 0x3B800000 (1/256)` pour i=1..254, `LUT[255]=0x3F7E0000 (254/256)`.

### 2.2 Le bias additif (optionnel, défaut OFF)

`RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4` @0x43E24A (decomp committé) :
gate `[ctx+0xBF4] != 0` (@0x43E278) puis `sub_409C6E(texinfo_u, texinfo_v, vcount, verts)` avec
`u = *(float*)(texinfo+0x28) * *(float*)(ctx+0xBF8)` (@0x43E29C-A5), `v = *(texinfo+0x2C) * *(ctx+0xBFC)`
(@0x43E2AE-B7). `sub_409C6E` @0x409C6E (30 instr live) = **pur additif**, stride 0x20 :
`*(float*)(vert+0x18) += a1; *(float*)(vert+0x1C) += a2` par vertex (@0x409C9A-0x409CAF).
`ctx+0xBF4` n'est initialisé qu'à 0 par Create_AppLog @0x40A00A ; **aucun writer statique trouvé
pour 0xBF8/0xBFC dans 0x409000-0x446000** (scan py_eval, 15 hits = tous les readers/cmp+fmul).
Même motif dans la variante OpenGL sub_437177 (@0x4371CD-0x437225, ctx+0xA84/0xA88/0xA8C).

### 2.3 Réponse à la question

- **Pas d'offset TPage ajouté aux UV.** L'origine (x,y) de la page/fenêtre sert au blit VRAM
  (`TexStaging_BlitRows` dst = `dword_1CB602C + vramOff*2` avec `vramOff = ((((tpage>>4)&1)<<8 + y) << 10) + ((tpage&0xF)<<6) + (x>>(2-mode))`,
  pitch 0x800 — decomp committé 0x464F70, branche `arg_24 == 0`) et à la sélection de texture
  (slot par `mode = (tpage>>7)&3` et `txbase = tpage&0x1F`, ctx stride 0x44C @0x465CE0), pas à U/V.
- **Un scale page existe** : `u_final = u8 * (1/W_window)`, `v_final = v8 * (1/H_window)`.
  Pour une fenêtre 256×256 → /256 ; pour une fenêtre 128 → /128 → **u8 > 127 donne u_final > 1.0**.
- FVF : stride 0x20, U@+0x18, V@+0x1C (D3DVERTEX XYZ+NORMAL+TEX1, FVF 0x1C4 @0x43E2F8).

## 3. Q3 — layout du buffer pixels@T+0xD8

- Write à +0xD8 : **sub_421F9A** @0x422043 (`[new+0xD8] = [E_slot+0x30]`) — decomp committée
  `0x4221E6__sub_4221E6_slot_E_cache.md` §4 / lot 15 §5.
- Le buffer `[E_slot+0x30]` est produit par **sub_421C41** @0x421C41 (decomp committée
  `0x421C41__sub_421C41_TIM_remap.md`) : source `*(a4+0xD8)` @0x421E97, taille `w*h` @0x421EA8,
  allocation @0x421EC8, boucle de remap **octet par octet** `dst[i] = remap[src[i]]`
  (@0x421F0A-0D). **Aucun réarrangement, aucun entrelacement, 1 octet/texel linéaire.**
- Verdict : l'hypothèse « 2 texels/mot » est **fausse pour le buffer objet T+0xD8** (chemin
  sprites F_CHAR) mais **vraie pour le flux fichier→VRAM** du chemin modèles (§1 : TIM 8bpp
  packé 2 texels/halfword, copié tel quel dans le miroir par copyblockToVRAM). Les deux
  formats coexistent dans deux pipelines distincts ; le mapping UV déformé ne vient pas de là
  (voir §5).

## 4. Q4 — CLUT système ↔ ids[g]

Fichiers : `decomp/0x509E00__BattleActor_StageUploadCLUTBand.md` + §1.

| Maillon | Preuves |
|---|---|
| stage par slot : `byte_1D98B60[s*0x200] ← 256 entrées u16` | 0x5074AE-B6 |
| bande acteur g : `byte_1D98B60 + 1024*g`, `g = (ptr - g_BattlePresentationActors)/156` | 0x509E38-3F / 0x509EFA-01 / 0x509FCC-EB |
| rangée VRAM : `y = 0xE0 + 2g` (2 palettes : 0xE0+2g et 0xE1+2g), rect statique `{x=0, y=0xE0, w=0x100 hw, h=2}` | HIWORD(off_B8BA38) 0x509EAA/0x509F92/0x509FDE ; get_bytes 0xB8BA38 = `00 00 E0 00 00 01 02 00` |
| upload : ring 32×16B (0x505DF0 type-0) → **BattleTimQueue_FlushToVram 0x505D20** case 0 → copyblockToVRAM(rect, ptr) → miroir 0x1B47818 + tex_vram_rectangle dirty | 0x505D47 / 0x45BD61-DBA |
| effets palette : flash blanc (`a2&0x10`, moyenne (R+B+2G)/5+5 @0x509E76) et assombrissement sin (`a2&0x400`, Fixed_Sin4096_Q12 @0x509F6B) | 0x509E25-EC / 0x509ED4-FA |
| **encodage ref CLUT** : `ptr = 0x1B47818 + 2048*(clut>>6) + 32*(clut&0x3F)` ⇒ `clut_word = (y<<6) \| (x>>4)` | sub_45B920 @0x45B929-4A |
| patch des primitives : mot @+0xA (prim 16B, stride 0x10) / @+0 (prim 20B, stride 0x14) = `(y<<6)\|(x>>4)` avec y∈[0xE0,0xF0) remap → `((0xE0+slot)<<6) \| (w & 0x803F)` ; mot TPage @+0xE / @+4 = `txbase/64` (`slot/2+10` ou `slot-2`) ; bits 7 de 3-4 octets/prim = `(slot&1)<<7` | 0x507550 (0x507570-0x507715) |

**Formule fermeture Q4** : `palette(g) = byte_1D98B60 + id*0x200` avec `id = 2g` (première
palette) — **les ids {0,2,4} du footer ND08 = les numéros de slot des acteurs 0,1,2**, Δ fixe
= 2 slots = 0x400 octets entre acteurs ; rangée VRAM = `0xE0 + id` ; ref primitive =
`((0xE0+id)<<6) | (clut_x>>4)`. La « région cid 0x1DA0-0x1E02 » de l'outil offline correspond
à cette bande (rangées 0xE0.. de 0x1B47818) ; la correspondance byte-exacte cid↔miroir reste
à confirmer par sonde live (cf. §6).

## 5. Verdict (a)/(b)/(c) sur le mapping UV déformé

- **(a) VRAI (reformulé).** Pour les modèles battle, la texture échantillonnée au draw n'est
  **ni** `pixels@T+0xD8` **ni** une « TPage relocée de l'objet T » : c'est le **miroir VRAM
  0x1B47818** via les page-slots Gfx (AllocTexturePageSlot / SelectTexturePageDrawList), alimenté
  par copyblockToVRAM depuis les TIM patchés par 0x507400. T+0xD8 est le buffer du chemin
  sprites F_CHAR (lot 15) — pipeline parallèle, non impliqué dans les draws mesh battle.
- **(b) PARTIELLEMENT VRAI.** Le **fichier** TIM 8bpp est bien en 2 texels/mot (w TIM en
  halfwords ; copyblockToVRAM copie w*2 octets/ligne @0x45BD54-82). Mais le buffer T+0xD8 est
  1 octet/texel (§3). Si le décodeur lisait le flux DAT comme 1 o/texel, il lisait deux fois
  trop court par ligne — corriger au niveau du décodage TIM fichier.
- **(c) FAUX en tant qu'« offset ajouté aux UV », VRAI en tant que fenêtre.** Aucun offset de
  page n'entre dans U/V ; en revanche **le facteur de normalisation est 1/W_window** et non un
  1/256 fixe, et W_window peut être < 256 (sub_45BC60). C'est l'explication des « UV bruts
  > 1.0 sur les bords » : `u_final = u8 * (1/W)` avec W < 256 (p. ex. W=128 → u8 ∈ [128,255]
  donne u ∈ (1.0, 1.99]) ; le rendu offline qui normalisait par 256 (ou tronquait) repliait la
  moitié droite de la texture → lames/quadris. Le motif d'indices `(3k+2, 3k+1, 3k)` est
  indépendant (ordre d'index PSX) et n'est pas en cause.

## 6. Formule exacte pour le décodeur

```
# UV — chemin multiply (window packet présent, latch dword_1CA8848 != 0) :
v   = window_word_24bits                              # *(u32*)(pkt+4) dans sub_45BC60 @0x45BC65
x   = ((v >> 10) & 0x1F) * 8                          # @0x45BC90
y   = ((v >> 15) & 0x1F) * 8                          # @0x45BC8A
W   = 256 - (v & 0x1F) * 8        ; si 0 -> 256       # @0x45BCAC / @0x45BCD8
H   = 256 - ((v >> 5) & 0x1F) * 8 ; si 0 -> 256       # @0x45BCA4 / @0x45BCC8
W   = min(W, 256 - x) ; H = min(H, 256 - y)           # clamp @0x45BCF4 / @0x45BD12
u_final = u8 * (1.0/W)          ; v_final = v8 * (1.0/H)   # Gpu_EmitPolyFT3/FT4 @0x461891-0x4618E4

# UV — fallback (pas de window packet, latch == 0) :
u_final = LUT[u8] ; v_final = LUT[v8] ;  LUT[i] = clamp(i, 1, 254) / 256   # init @0x460BB1

# puis bias additif optionnel (défaut OFF, ctx+0xBF4==0 @0x40A00A) :
u_final += *(float*)(texinfo+0x28) * *(float*)(ctx+0xBF8)   # 0x43E29C-2D0
v_final += *(float*)(texinfo+0x2C) * *(float*)(ctx+0xBFC)

# échantillonnage : sous-rect VRAM [x, x+W) × [y, y+H) du miroir 0x1B47818
# (8bpp = 2 texels/halfword ; texture D3D = la fenêtre, pas la page complète)

# CLUT : clut_word = (yclut << 6) | (xclut >> 4)  ;  ptr = 0x1B47818 + 2048*yclut + 32*(xclut&0x3F)
#        battle acteurs : xclut=0, yclut = 0xE0 + id, id = slot = 2*acteur
#        palette bytes = byte_1D98B60 + id*0x200 (256 entrées BGR555 u16, byte3/high bit = STP côté lot 15)
```

En pratique pour battle13 : si la capture montre des u_raw ∈ (1.0, 1.99], le window packet
vaut W=128 (v & 0x1F = 16) et la formule attendue est `u_final = u8/128, v_final = v8/H`.
À confirmer par lecture du window word dans le stream (sonde live — §7).

## 7. UNPROVEN / restants (sonde ou données live)

1. **W_window effectif de battle13** (dépend des données du stream) : lire le word passé à
   sub_45BC60 (@0x45BC65, callers 0x462EC5/0x463225) pendant un draw battle — attendu
   `v & 0x1F = 16` (W=128) pour expliquer u_raw > 1.0. Statique non tranchable.
2. **Correspondance byte-exacte région cid 0x1DA0-0x1E02 ↔ rangées 0xE0+ du miroir 0x1B47818** :
   les EAs prouvent le contenu (2 palettes/acteur à `byte_1D98B60 + 1024*g`, y VRAM 0xE0+2g) ;
   la numérotation « cid » est un artefact de l'outil offline — mapping 1:1 à valider par sonde.
3. **Writers runtime de ctx+0xBF8/0xBFC** (facteurs du bias) : aucun writer statique trouvé dans
   0x409000-0x446000 (scan) ; hors périmètre si le bias reste OFF par défaut.
4. **Quel backend actif** (DDrawAlt 0x43E24A vs GL 0x437177) pendant la campagne live : les deux
   consomment les mêmes floats UV (formule identique), donc sans impact sur la formule.
5. La valeur `x` (LOWORD) de off_B8BA38 est 0 dans l'init statique et jamais réécrite par
   sub_509E00 — un éventuel re-x runtime (autre writer d'off_B8BA38 hors xrefs listées) n'est
   pas exclu (xrefs_to 0xB8BA38 : uniquement les 3 sites de sub_509E00).

## 8. Livrables associés

- `decomp/0x507400__BattleModel_AllocateTexturePagesAndPatchTPage.md` (nouveau)
- `decomp/0x45BC60__Gpu_SetTextureWindow_PageRectScales.md` (nouveau)
- `decomp/0x509E00__BattleActor_StageUploadCLUTBand.md` (nouveau)
- Pack contexte : `tools/_tmp_semantic_triple/0x507400/` (asm.asm, meta.json, callees.txt,
  callers.txt, globals.txt)
- Déjà committés et cités : 0x43E24A, 0x4178D7, 0x464F70, 0x465CE0, 0x4617F0, 0x4623A0,
  0x421C41, 0x4221E6, 0x407EB4 (lot 14/15).
