# Battle_ReadAnimation @ 0x508F90

- Instr (live): 284
- Palier: low
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=13698
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=12660
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=10182
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Battle_ReadAnimation(int, unsigned __int8 *)
- Notes parent: jb/jnb/jbe unsigned; jl/jle signed. Stride 0x30 (add ebx,30h). Occupancy 1+2 absente. Rewind UNLESS (bit0 && bits 2-3). Half = movsx/cdq/sub/sar. Reader = esi pas &rd. WORD movsx clip+2/+4. Return 1 si frame>=end, 0 apres FK+Unwind.

## C réconcilié

```c
/* Battle_ReadAnimation @ 0x508F90
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 284 instr, size 0x30B, end 0x50929B. cdecl, 2 args. retn C3.
 * Frame: sub esp,8; ebx; esi/edi after loc_508FAC; ebp only if npasses jle not taken.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 unused.
 * Bone pose stride 0x30 IS present (83 C3 30). Widths: BYTE flags/frame/count;
 * WORD 66 pos/rot/rewind/au_re; DWORD pointers/reader. No setcc / jpt.
 * ja/jb/jnb/jbe unsigned; jl/jle signed. No domain::.
 */

extern int __cdecl bs_modulo(int nbytes); /* 0x5082B0 add esp,4 */
extern int __cdecl Battle__ReadPositionType(unsigned __int16 **rd); /* 0x509320 AX */
extern __int16 __cdecl Battle__ReadRotationType(unsigned __int8 **rd); /* 0x509370 */
extern __int16 __cdecl bitReader(unsigned __int8 **rd, __int16 nbits); /* 0x5092A0 */
extern __int16 __cdecl au_re_bitReader(unsigned __int8 **rd); /* 0x5093F0 */
extern int __cdecl BattleSkeleton_BuildHierarchicalFK(int owner); /* 0x508C90 */
extern int __cdecl BattleScratch_Unwind(int nbytes); /* 0x5082D0 */

int __cdecl Battle_ReadAnimation(int arg_0, unsigned __int8 *clip)
{
    unsigned __int8 *rd;   /* esi: 8-byte scratch; [0]=cursor DWORD, [4]=extra DWORD */
    unsigned __int8 *h1;    /* edi: H1 skeleton */
    unsigned __int8 *hdr;
    unsigned __int8 *h3;
    unsigned __int8 *bone;
    int clip_base;          /* var_4 */
    int pass;              /* var_8 */
    int npasses;
    int i;
    unsigned __int8 oldf;
    unsigned __int8 nf;
    unsigned __int8 fl;
    __int16 ax;

    /* cmp BYTE [ebx+6],[ebx+7]; jb loc_508FAC UNSIGNED */
    if (clip[6] >= clip[7])
        return 1;

    rd = (unsigned __int8 *)bs_modulo(8); /* push 8; add esp,4; EAX = old cursor */

    hdr = *(unsigned __int8 **)(arg_0 + 4); /* [ecx+4] */
    h1 = *(unsigned __int8 **)hdr;           /* [eax] H1 */
    h3 = *(unsigned __int8 **)(hdr + 8);   /* [eax+8] H3 */
    /* xor edx,edx; mov dl,[ebx]; eax = [h3+edx*4+4] + h3 */
    clip_base = (int)(h3 + *(unsigned int *)(h3 + (unsigned int)clip[0] * 4 + 4));

    /* 0F BF WORD movsx -> DWORD stores */
    *(int *)(rd + 4) = (int)(short)(*(unsigned short *)(clip + 4));
    *(int *)rd = clip_base + (int)(short)(*(unsigned short *)(clip + 2));

    pass = 0; /* var_8 = 0 */
    /* edx = ((clip[1]>>1)&1)+1; test edx,edx; jle loc_50923B SIGNED */
    npasses = ((clip[1] >> 1) & 1) + 1;
    if (npasses > 0) {
        /* loc_508FFF — ebp live here */
        for (;;) {
            /* half path: test cl,1; jz loc_509136; test [ebx+6]; jz loc_509136 */
            if ((clip[1] & 1) && clip[6] != 0) {
                /* loc_509013: ReadPositionType then movsx/cdq/sub/sar /2; add WORD */
                ax = (short)Battle__ReadPositionType((unsigned __int16 **)rd);
                *(short *)(h1 + 8) += (short)(ax / 2);
                ax = (short)Battle__ReadPositionType((unsigned __int16 **)rd);
                *(short *)(h1 + 0x0A) += (short)(ax / 2);
                ax = (short)Battle__ReadPositionType((unsigned __int16 **)rd);
                *(short *)(h1 + 0x0C) += (short)(ax / 2);
                /* bitReader(esi,1); add esp,14h; insert AL bit0 into [edi+1] */
                oldf = h1[1];
                nf = (unsigned __int8)(((oldf ^ (unsigned __int8)bitReader((unsigned __int8 **)rd, 1)) & 1) ^ oldf);
                h1[1] = nf;
                if (nf & 1) {
                    /* loc_5090C0 scale: 3 rot half + 3 au_re WORD; add esp,18h; add ebx,30h; jl */
                    if (h1[0] != 0) { /* test al,al; jbe UNSIGNED */
                        bone = h1 + 0x16;
                        for (i = 0; i < (int)h1[0]; i++) { /* cmp ebp,count; jl SIGNED */
                            ax = Battle__ReadRotationType((unsigned __int8 **)rd);
                            *(short *)(bone - 2) += (short)(ax / 2);
                            ax = Battle__ReadRotationType((unsigned __int8 **)rd);
                            *(short *)bone += (short)(ax / 2);
                            ax = Battle__ReadRotationType((unsigned __int8 **)rd);
                            *(short *)(bone + 2) += (short)(ax / 2);
                            *(short *)(bone + 4) = au_re_bitReader((unsigned __int8 **)rd);
                            *(short *)(bone + 6) = au_re_bitReader((unsigned __int8 **)rd);
                            *(short *)(bone + 8) = au_re_bitReader((unsigned __int8 **)rd);
                            bone += 0x30;
                        }
                    }
                } else {
                    /* loc_509068 no scale: 3 rot half; add esp,0Ch */
                    if (h1[0] != 0) {
                        bone = h1 + 0x16;
                        for (i = 0; i < (int)h1[0]; i++) {
                            ax = Battle__ReadRotationType((unsigned __int8 **)rd);
                            *(short *)(bone - 2) += (short)(ax / 2);
                            ax = Battle__ReadRotationType((unsigned __int8 **)rd);
                            *(short *)bone += (short)(ax / 2);
                            ax = Battle__ReadRotationType((unsigned __int8 **)rd);
                            *(short *)(bone + 2) += (short)(ax / 2);
                            bone += 0x30;
                        }
                    }
                }
            } else {
                /* loc_509136 full AX add, no /2 */
                *(short *)(h1 + 8) += (short)Battle__ReadPositionType((unsigned __int16 **)rd);
                *(short *)(h1 + 0x0A) += (short)Battle__ReadPositionType((unsigned __int16 **)rd);
                *(short *)(h1 + 0x0C) += (short)Battle__ReadPositionType((unsigned __int16 **)rd);
                oldf = h1[1];
                nf = (unsigned __int8)(((oldf ^ (unsigned __int8)bitReader((unsigned __int8 **)rd, 1)) & 1) ^ oldf);
                h1[1] = nf;
                if (nf & 1) {
                    /* loc_5091B0 */
                    if (h1[0] != 0) {
                        bone = h1 + 0x16;
                        for (i = 0; i < (int)h1[0]; i++) {
                            *(short *)(bone - 2) += Battle__ReadRotationType((unsigned __int8 **)rd);
                            *(short *)bone += Battle__ReadRotationType((unsigned __int8 **)rd);
                            *(short *)(bone + 2) += Battle__ReadRotationType((unsigned __int8 **)rd);
                            *(short *)(bone + 4) = au_re_bitReader((unsigned __int8 **)rd);
                            *(short *)(bone + 6) = au_re_bitReader((unsigned __int8 **)rd);
                            *(short *)(bone + 8) = au_re_bitReader((unsigned __int8 **)rd);
                            bone += 0x30;
                        }
                    }
                } else {
                    /* loc_509173 */
                    if (h1[0] != 0) {
                        bone = h1 + 0x16;
                        for (i = 0; i < (int)h1[0]; i++) {
                            *(short *)(bone - 2) += Battle__ReadRotationType((unsigned __int8 **)rd);
                            *(short *)bone += Battle__ReadRotationType((unsigned __int8 **)rd);
                            *(short *)(bone + 2) += Battle__ReadRotationType((unsigned __int8 **)rd);
                            bone += 0x30;
                        }
                    }
                }
            }

            /* loc_509205 reloads ebx=arg_4; loc_509209 inc frame */
            clip[6] = (unsigned __int8)(clip[6] + 1);
            if (clip[6] >= clip[7]) /* jnb UNSIGNED */
                break;
            pass++;
            /* re-read clip[1]; edx=((cl>>1)&1)+1; cmp ebp,edx; jl loc_508FFF SIGNED */
            npasses = ((clip[1] >> 1) & 1) + 1;
            if (pass < npasses)
                continue;
            break;
        }
    }

    /* loc_50923B: EAX = var_4. test cl,1; jz loc_509248 REWIND;
     * test cl,0Ch; jnz loc_50925A SKIP. Rewind unless (bit0 && bits 2-3). */
    fl = clip[1];
    if (!(fl & 1) || (fl & 0x0C) == 0) {
        /* WORD 66: dx=[esi]-ax; [clip+2]=dx; [clip+4]=[esi+4] */
        *(unsigned short *)(clip + 2) =
            (unsigned short)(*(unsigned short *)rd - (unsigned short)clip_base);
        *(unsigned short *)(clip + 4) = *(unsigned short *)(rd + 4);
    }

    /* loc_50925A: edx=((cl>>2)&3)+1; and 80000001h signed %2; and dl,3; shl 2;
     * and cl,0F3h; or; store [ebx+1] */
    {
        int t = ((fl >> 2) & 3) + 1;
        t %= 2;
        clip[1] = (unsigned __int8)((fl & 0xF3) | ((t & 3) << 2));
    }

    BattleSkeleton_BuildHierarchicalFK(arg_0); /* push arg_0; EAX discarded */
    BattleScratch_Unwind(8);                 /* push 8; add esp,8 with FK */
    return 0; /* xor eax,eax */
}
```
