# Gfx_UploadCLUTSlot @ 0x464DB0

- Confiance: CERTAIN
- Nom catalogue: confirme (précision : la CLUT n'est pas « uploadée », elle est consommée pour dériver l'alpha ; l'upload réel = création des draw-lists 6/0xE. Proposition `Gfx_UploadSlotTexture_CLUTAlphaAndDrawLists` acceptable, markdown seul)
- Mode: 1+V
- A==V: non (CORRIGE — 4 corrections de fond)
- Push IDB: oui
- Preuves:
  - Early-return cache : `mov eax,[esi+44h]; test eax,eax; jnz 0x464F65` @ 0x464DC0-0x464DC5 — EAX=`slot+0x44` au retour. Writers `slot+0x44` dans le module TPage : Upload seul (0x464EBB, 0x464F45) ; reset uniquement via zero-fill slot de `Gfx_AllocTexturePageSlot` (`rep stosd` 0x19 dwords @ 0x464F8E-0x464F97) → re-bake seulement sur (re)alloc.
  - Bake **masque alpha 4-bit** (correction V centrale) : `TexStaging_BlitCLUTAlpha` 8 args @ 0x464E9C — pour chaque pixel lookup CLUT `mov dx,[ebx+eax*2]` @ 0x467823, luminance (r5+g5+b5) clampée `cmp eax,0Fh; jle` @ 0x467840, puis `shl eax,0Ch` @ 0x46784A + `mov [edi],ax` @ 0x46784D — **bits 0-11 toujours 0**, le blit n'écrit QUE l'alpha. Buffer `slot+0x60`, surface ARGB4444 (masques 0xF000/0xF00/0xF0/0xF, `sub_464160` @ 0x464185-0x4641A1). Générique 3 modes : 4bpp 2 nibbles/octet @ 0x4678CE-0x46793A, 8bpp octet complet, 16bpp direct sans CLUT @ 0x4679A0-0x4679CB.
  - Source staging : `dword_1CB602C + 2*((slot+8+Y)<<10 + X + slot+4>>(2−mode))` @ 0x464E98 `lea edx,[eax+ecx*2]`, pitch 0x800 @ 0x464E8A. Décodage TPAGE PS1 standard : `sar eax,4; and eax,1; shl eax,8` (bit 4 → Y=0|256) + `and edi,0Fh; shl edi,6` (bits 0-3 → X×64 halfwords) @ 0x464DEF-0x464E02. CLUT : `mov ax,[edx+448h]` @ 0x464E40, décodage `((w>>6)<<6)+(w&0x3F)` puis `shl ebp,5`.
  - Gate `dword_1CCFD88` @ 0x464DD2/0x464DD9 `jz 0x464EF8` : unique writer 0x4643ED dans `Gfx_InitTexturePageDrawLists`, atteint si [ctx+0xBA8]==0, caps&0x80 absent (FD80==0), `Texture_FindTexture` @ 0x4643A8 trouvé ET 4 champs +0x40/+0x44/+0x48/+0x4C égaux @ 0x4643BF-0x4643EB → FD88 = « backend supporte nativement CLUT 4bpp 16 entrées ».
  - Draw-lists : type 6 → `slot+0x44` (`Gfx_CreateDrawList(1,6,desc,0,drv+0xA50)` @ 0x464EB3, store @ 0x464EBB), type 0xE → `slot+0x48` (@ 0x464EE2, store @ 0x464EEA). Desc stack 0x84 : +0x28=pool (0x464E61), +0x2C=1 (0x464EBE), +0x30=nested via `Gfx_GetNested_Plus10_14` @ 0x464EC7 (lit `[[arg+0x10]+0x14]` ou 0, vérifié @ 0x417FA6-0x417FD2). Comptabilité `add esp,40h` @ 0x464EB8 = 0x20 blit + 8 InitDrawListDesc + 4 sub_464160 + 0x14 CreateDrawList ✓.
  - Path dégradé 0x464EF8-0x464F62 (FD88==0) : sans blit/pool/TPAGE/sub_464160 ; filter `2`/`0` selon `dword_1CA8A00` @ 0x464EF8/0x464F06/0x464F0F ; desc+0x30 = nested(`slot+0x24`) @ 0x464F16/0x464F24 — `slot+0x24` = **retour `Gfx_CreateDrawList`** de `Gfx_AllocTexturePageSlot` @ 0x46524F-0x465255 (correction V, pas le probe FindTexture) ; mêmes listes 6/0xE.
  - Callers 3 args cdecl (`add esp,0Ch`) : `World_loadTextureVRAM_updateAnim` @ 0x464CC5-0x464CD3 (ebx = **index TPage 0..31** de la boucle `inc ebx; cmp ebx,20h` @ 0x464D03-0x464D0A — correction V, pas 0 constant) ; `Gfx_SelectTexturePageDrawList` @ 0x465F95-0x465FB4 (ebx = tpage&0x1F, gated `(a2&0x60)==0x40` @ 0x465F84). arg_8 = contexte TPage stride 0x44C (base `unk_1CB6040`), +0x448 = mot position CLUT.
  - Wiki QMD (`battle-address-catalog`, `battle-render-pipeline-entrypoints`) : chaîne Select → GfxDrawList → SubmitTexturePageLists → WalkDrawList, blit CLUT-alpha — aligné, aucune divergence.
- Notes parent: 147 instr → 1+V. §5.6 vert : 4 corrections V spot-checkées live parent (alpha clamp+shl @ 0x467840-0x46784A ; boucle World `inc ebx; cmp ebx,20h` + stride 0x44C @ 0x464D00 ; `slot+0x24` = retour CreateDrawList @ 0x46424F→0x46524F ; CLUT lookup octet complet `[ebx+eax*2]` @ 0x467817-0x467823). A avait raison contre 2 hints parent faux (blit 8 args pas 2 ; ordre source/pitch/dest). `asm.asm` pack corrompu (zones annotées) → travail sur ASM live. V readonly n'a pas écrit `semantic_v.md` (Ask mode) — persisté par parent après reprise du contenu.

## Analyse réconciliée

Bake le masque alpha 4-bit de la texture CLUT d'un slot TPage, puis crée ses deux draw-lists. Cdecl `(slot, tpage_idx, ctx_tpage)` depuis `World_loadTextureVRAM_updateAnim` et `Gfx_SelectTexturePageDrawList`.

Full path (gate `dword_1CCFD88` = backend supporte CLUT 4bpp natif, writer unique 0x4643ED) : lazy-alloc pool 0xF0 (`slot+0x5C`) + init via `sub_464160` (layout ARGB4444, buffer `slot+0x60`) ; pour chaque pixel de la source staging VRAM (`dword_1CB602C`, TPAGE décodé PS1 standard), lookup CLUT (position à `ctx+0x448`), luminance clampée 0..15, **alpha seul** écrit `<<12` (bits 0-11 = 0) — le buffer est un masque alpha, PAS une texture 15bpp+alpha (correction V). Puis `Gfx_CreateDrawList` type 6 → `slot+0x44`, type 0xE → `slot+0x48` (desc 0x84 : pool/+1/nested), retour EAX = liste 0xE.

Path dégradé (FD88==0) : sans blit ni pool — filter 2/0 selon `dword_1CA8A00`, nested sur la draw-list d'Alloc `slot+0x24` (retour CreateDrawList, correction V), mêmes listes 6/0xE.

Early-return si `slot+0x44` déjà écrit (cache par slot ; reset seulement au realloc slot). Échec alloc pool 0xF0 → retour 0.

Divergences A→V tranchées (opcode gagne) : (1) blit alpha-only, pas 15bpp+alpha ; (2) World pousse index TPage 0..31, pas 0 constant ; (3) `slot+0x24` = retour CreateDrawList, pas le probe FindTexture ; (4) CLUT 16 entrées seulement en 4bpp (256 en 8bpp, aucune en 16bpp) ; (5) arg_8 = contexte TPage stride 0x44C, pas un TIM.

Questions ouvertes :
1. Scaling X position CLUT : `and eax,3Fh` ajouté brut en offset octet — si `ctx+0x448` suit le format registre GPU (X en unités 16 halfwords), ×32 manquant. Non tranchable statiquement.
2. Rôle GPU exact des types 6 vs 0xE — non dérivable sans `Gfx_WalkDrawList`.
3. Où est la couleur finale si `slot+0x60` ne porte que l'alpha ? Hypothèse : draw-lists d'Alloc (`slot+0x24`..+0x3C) référent le staging/pool Alloc — pas prouvé ici.
4. `dword_1CA8A00` : flag qualité/filtrage LIKELY.
