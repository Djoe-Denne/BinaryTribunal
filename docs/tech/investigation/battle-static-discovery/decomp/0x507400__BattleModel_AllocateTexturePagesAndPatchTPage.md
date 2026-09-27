# BattleModel_AllocateTexturePagesAndPatchTPage @ 0x507400

- Instr (live): 107
- Palier: high
- Push IDB: non (lecture seule, glm-triple header déjà présent dans l'IDB du 2026-09-15/09-25)
- IDA type: `__int16 __cdecl BattleModel_AllocateTexturePagesAndPatchTPage(int *container, int p_mesh, unsigned __int16 prevMask)`
- Notes parent: call-site unique type « patch TPage à la construction » ; 5 callers loaders battle ;
  ASM quirk : l'index de tpage_map déborde du buffer 8 octets si clut.y ≥ 0xE8 (voir §quirk).

## C réconcilié

```c
/* BattleModel_AllocateTexturePagesAndPatchTPage @ 0x507400
 * Ground truth = live ASM (asm.asm, 107 instr, disasm IDB FF8_EN.exe base 0x400000) +
 * get_bytes, pas Hex-Rays. Taille 0x14F, fin exclusive 0x50754F. cdecl, retn C3.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 absents. Largeurs : WORD 66 clut/img x,y,
 * TPage, AX ; BYTE map ; DWORD count/len/mask.
 * Frame : sub esp,0Ch ; pushes edi,ebx,ebp,esi. Store map : 88 9C 0C 34FFFFFF.
 */

extern unsigned char byte_1D98B60[];   /* 6 slots × 0x200 = staging CLUT système (§globals.txt) */
void __cdecl BS_CopyGeometry(unsigned char *dst, const unsigned char *src, unsigned int n);
unsigned char *__cdecl BattleTimQueue_EnqueueType1(unsigned char *tim);            /* 0x505E30 */
int __cdecl BattleMesh_RemapPrimitiveTPageBits(int *p_mesh, const char *tpage_map);/* 0x507550 */

__int16 __cdecl BattleModel_AllocateTexturePagesAndPatchTPage(int *container, int p_mesh, unsigned __int16 prevMask)
{
    unsigned int occupancy = 0;         /* @0x507408 — réutilise le slot arg_0 */
    unsigned char *tim = (unsigned char *)container + container[1]; /* @0x507410-15 : [c]+4=[c+1] offset */
    int remaining = container[0];       /* @0x507413 : [c+0] count ; jle SIGNED @0x507419 */
    char tpage_map[8];                  /* @frame 0xE0 ; l'ASM indexe y-0xE0 ∈ [0,15] → débordement si y≥0xE8 */

    if (remaining > 0) {
        do {
            /* @0x507426 : clut.x (u16 @tim+0xC, halfwords) < 0x100 requis
             * @0x507435-49 : clut.y (u16 @tim+0xE) ∈ [0xE0, 0xF0) requis (SIGNED jl/jge) */
            if (*(short *)(tim + 0xC) < 0x100) {
                short clut_y = *(short *)(tim + 0xE);
                if (clut_y >= 0xE0 && clut_y < 0xF0) {
                    int slot = 0;
                    /* @0x507466-79 : premier bit libre de (occupancy | prevMask), 15 bits, SIGNED jl */
                    while (slot < 15 && ((1u << slot) & ((prevMask & 0xFFFF) | (occupancy & 0xFFFF))))
                        slot++;
                    if (slot < 15)                         /* @0x507484 */
                        occupancy |= 1u << slot;

                    tpage_map[clut_y - 0xE0] = (char)slot; /* @0x507494 — QUIRK : y≥0xE8 écrit hors des 8 octets
                                                              (clobber arg_0/occupancy) ; bénin si y≤0xE7 */
                    *(unsigned short *)(tim + 0xE) = (unsigned short)(slot + 0xE0); /* @0x50749B :
                              RELOCATION VRAM CLUT : y := 0xE0 + slot (rangée 224..238, x inchangé) */

                    if (slot < 6)                          /* @0x507491, jge SIGNED */
                        /* @0x5074A9-B6 : stage 512 octets = 256 entrées u16 (CLUT 8bpp complet),
                         * src = tim+0x14 = entries CLUT (après magic 4 + flag 4 + len 4 + x 2 + y 2) */
                        BS_CopyGeometry(byte_1D98B60 + (slot << 9), tim + 0x14, 0x200);

                    /* @0x5074BE-C0 : esi += *(u32*)(tim+8) = len bloc CLUT → esi = bloc image
                     * (bloc image : len u32@+0, x u16@+4, y u16@+6, w u16@+8, h u16@+A, data@+0xC) */
                    unsigned char *img = tim + 8 + *(unsigned int *)(tim + 8);

                    if (slot < 12) {                       /* @0x5074C2, jge SIGNED */
                        /* @0x5074DF : img VRAM x := (img.x & 0x3F) + ((slot/2 signé) + 0xA) << 6
                         *   = colonne 64 halfwords n°(10+slot/2) — fenêtre 8bpp de 128 texels
                         * @0x5074EE : img VRAM y := (img.y & 0x7F) + (slot & 1) << 7
                         *   = bande 128 rangées, slot pair → y 0..127, impair → y 128..255 */
                        *(unsigned short *)(img + 4) = (unsigned short)(((img[4] & 0x3F)) + (((slot/2) + 0xA) << 6));
                        *(unsigned short *)(img + 6) = (unsigned short)(((img[6] & 0x7F)) + ((slot & 1) << 7));
                    } else {                               /* slots 12..14 */
                        /* @0x50750E : x := (img.x & 0x3F) + (slot-2) << 6 ; @0x507512 : y := (img.y & 0x7F) + 0x80 */
                        *(unsigned short *)(img + 4) = (unsigned short)((img[4] & 0x3F) + ((slot - 2) << 6));
                        *(unsigned short *)(img + 6) = (unsigned short)((img[6] & 0x7F) + 0x80);
                    }
                }
            }
            /* @0x507517 : enqueue type-1 (TIM complet) — FlushToVram (0x505D20) fera
             * copyblockToVRAM du bloc CLUT PUIS du bloc image aux coords patchées ci-dessus */
            tim = BattleTimQueue_EnqueueType1(tim);
        } while (--remaining != 0);                         /* @0x50752A jnz */
    }

    /* @0x50753B-D : patch des primitives du mesh : refs CLUT/TPage y∈[0xE0,0xF0) → slot alloué */
    BattleMesh_RemapPrimitiveTPageBits(p_mesh, tpage_map);
    return (__int16)(unsigned short)occupancy;              /* @0x507542 : AX = occupancy, prevMask NON re-OR */
}
```

## Layout VRAM résultant (déduit des stores, chaque formule EA-citée)

- CLUT (256 entrées u16 = 512 B) : rangée VRAM `0xE0 + slot`, x = x fichier (< 0x100 halfwords).
- Image 8bpp (slot 0..11) : x = `(x&0x3F) + (10 + slot/2)*64` halfwords, y = `(y&0x7F) + (slot&1)*128`
  → 12 fenêtres de 128×128 texels dans les colonnes 10..15 (= 640..1023 halfwords), 2 rangées de 128.
- Image (slot 12..14) : x = `(x&0x3F) + (slot-2)*64`, y = `(y&0x7F) + 0x80`.
- Slots ≥ 6 : PAS de stage dans byte_1D98B60 (seule la relocation VRAM est faite).
