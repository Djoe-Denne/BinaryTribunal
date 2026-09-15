# BattleSkeleton_BuildHierarchicalFK @ 0x508C90

- Instr (live): 227
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=6865
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=20416
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=10927
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleSkeleton_BuildHierarchicalFK(int)
- Notes parent: H1 FK. [arg+4] deref. Bit0 [ebx+1] flag (pas occupancy 1+2). Count BYTE jbe unsigned / jl signed. Stride os 0x30 present. Parent 0xFFFF (66) vs -1 (movsx). Tampons SET 80 os (0x20 / 0x10). EAX=Unwind(0x58). Pas de Hex-Rays.

## C réconcilié

```c
/* BattleSkeleton_BuildHierarchicalFK @ 0x508C90
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 227 instr, size 0x2C2, end 0x508F52. cdecl, 1 arg. sub esp,0F10h; push ebx,ebp,esi,edi; retn C3.
 * Arg: 8B8424280F0000; 8B4804; 8B19. ecx=[arg+4]; ebx=[ecx] = H1 skeleton. No packed ctx struct.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * Bone pose stride 0x30 present (83 C6 30 both loops; parent lea+shl = *0x30).
 * BYTE [ebx] count (xor ecx,ecx / 8A CB). BYTE [ebx+1] bit0: F6 43 01 01; 0F85 loc_508D98.
 * jbe 0F86 UNSIGNED (test al,al → empty). jl 0F8C SIGNED vs zero-extended count. No ja/jg.
 * CLEAR parent WORD: 66 8B / 66 3D FFFF. SET parent: 0F BF / 83 F8 FF (s32 -1).
 * ROOT xyz: 0F BF header+8/A/C * scale, C1 F8 08, 89 DWORD at bone+24/28/2C.
 * SET ROOT vec: 0F BF bone+0A/0C/0E; C1 E0 02. SET PARENT: 0FAF * var_F00[parent]; C1 F8 0A.
 * 66 stores at ebp+50/52/54 on SET parent. rep movsd ecx=8 CLEAR root (ebp → bone+10h).
 * add esp: 4 (modulo/unwind), 8 (56CE30 / ScaleByVec12), 0Ch (Compose), 18h (two ScaleColumns),
 * 24h (ToI32x3+Copy5+Scale leftover), 0F10h epilogue. No setcc. No jpt_.
 * EAX = BattleScratch_Unwind(0x58) leftover (AND AL size). No mov/xor eax before ret.
 * Stack SET path: var_A00 stride 0x20 (80 slots, 0xA00), var_F00 stride 0x10 (80 slots, 0x500).
 * No domain::.
 */

extern int __cdecl bs_modulo(int nbytes); /* 0x5082B0 */
extern int __cdecl BattleScratch_Unwind(int nbytes); /* 0x5082D0 */
extern int *__cdecl sub_56CE30(short *rot, int *scratch); /* 0x56CE30 */
extern short *__cdecl Mat3S16_ScaleByVec12(short *mat, int *vec); /* 0x56BEF0 */
extern void *__cdecl Mat_ComposeTwoThenCopy8(unsigned int *parent_mat, int scratch, void *dst); /* 0x56C2F0 */
extern unsigned short *__cdecl Mat3S16_ScaleColumnsQ12(int mat, int *vec, unsigned short *dst); /* 0x508C30 */
extern unsigned int *__cdecl Mat3S16_MulQ12_ToI32x3(short *a, short *b, unsigned int *dst); /* 0x56C3D0 */
extern unsigned int *__cdecl Mat3S16_MulQ12_Copy5(int src, short *mat, unsigned int *dst); /* 0x56C090 */

int __cdecl BattleSkeleton_BuildHierarchicalFK(int arg_0)
{
    unsigned char mat_stk[0xA00]; /* var_A00, stride 0x20, 80 slots */
    int vec_stk[320];             /* var_F00, stride 0x10, 80 slots */
    unsigned char *sp;            /* ebp: bs_modulo 0x58 */
    unsigned char *skel;          /* ebx: H1 */
    unsigned char *bone;          /* bone base = skel+10h + i*30h; esi was bone+24h */
    unsigned char *pb;
    unsigned char *mat_cur;       /* var_F10 SET path */
    int *vec_cur;                 /* var_F08 / edi SET path */
    int idx;                      /* var_F0C */
    int parent;                   /* var_F04 SET; CLEAR uses AX */
    int scale;
    int n;
    int *d;
    int *s;

    sp = (unsigned char *)bs_modulo(0x58);
    skel = *(unsigned char **)(*(void **)((char *)arg_0 + 4));

    if (skel[1] & 1) {
        /* loc_508D98: flag bit0 SET — column-Q12 + stack scratch */
        if (skel[0] != 0) { /* test al,al; jbe UNSIGNED */
            mat_cur = mat_stk;
            vec_cur = vec_stk;
            bone = skel + 0x10;
            idx = 0;
            do { /* loc_508DC0 */
                sub_56CE30((short *)(bone + 4), (int *)sp);
                parent = *(short *)bone; /* movsx [esi-24h] */
                if (parent == -1) { /* cmp eax, 0FFFFFFFFh */
                    scale = *(short *)(skel + 2);
                    *(int *)(sp + 0x48) = scale;
                    *(int *)(sp + 0x44) = scale;
                    *(int *)(sp + 0x40) = scale;
                    Mat3S16_ScaleColumnsQ12((int)sp, (int *)(sp + 0x40), (unsigned short *)mat_cur);
                    vec_cur[0] = (int)*(short *)(bone + 0x0A) << 2;
                    vec_cur[1] = (int)*(short *)(bone + 0x0C) << 2;
                    vec_cur[2] = (int)*(short *)(bone + 0x0E) << 2;
                    Mat3S16_ScaleColumnsQ12((int)mat_cur, vec_cur, (unsigned short *)(bone + 0x10));
                    *(int *)(bone + 0x24) = ((int)*(short *)(skel + 8) * scale) >> 8;
                    *(int *)(bone + 0x28) = ((int)*(short *)(skel + 0x0A) * scale) >> 8;
                    *(int *)(bone + 0x2C) = ((int)*(short *)(skel + 0x0C) * scale) >> 8;
                    /* add esp,18h */
                } else {
                    /* loc_508E5F */
                    pb = skel + 0x10 + parent * 0x30;
                    *(short *)(sp + 0x50) = 0;
                    *(short *)(sp + 0x52) = 0;
                    *(short *)(sp + 0x54) = *(short *)(pb + 2); /* 66 */
                    Mat3S16_MulQ12_ToI32x3((short *)(pb + 0x10), (short *)(sp + 0x50),
                                           (unsigned int *)(sp + 0x40));
                    *(int *)(bone + 0x24) = *(int *)(pb + 0x24) + *(int *)(sp + 0x40);
                    *(int *)(bone + 0x28) = *(int *)(pb + 0x28) + *(int *)(sp + 0x44);
                    *(int *)(bone + 0x2C) = *(int *)(pb + 0x2C) + *(int *)(sp + 0x48);
                    Mat3S16_MulQ12_Copy5((int)(mat_stk + parent * 0x20), (short *)sp,
                                         (unsigned int *)mat_cur);
                    vec_cur[0] = ((int)*(short *)(bone + 0x0A) * vec_stk[parent * 4 + 0]) >> 10;
                    vec_cur[1] = ((int)*(short *)(bone + 0x0C) * vec_stk[parent * 4 + 1]) >> 10;
                    vec_cur[2] = ((int)*(short *)(bone + 0x0E) * vec_stk[parent * 4 + 2]) >> 10;
                    Mat3S16_ScaleColumnsQ12((int)mat_cur, vec_cur, (unsigned short *)(bone + 0x10));
                    /* add esp,24h */
                }
                /* loc_508F13 */
                mat_cur += 0x20;
                idx++;
                bone += 0x30;
                vec_cur += 4;
            } while (idx < (int)skel[0]); /* jl SIGNED */
        }
    } else {
        /* loc_508CBC: flag bit0 CLEAR — ScaleByVec12 / Compose */
        if (skel[0] != 0) { /* test al,al; jbe UNSIGNED */
            bone = skel + 0x10;
            idx = 0;
            /* xor edi,edi at 508CBE; Compose 0x56C2F0 and sub_56CE30 push/pop edi → always 0 */
            do { /* loc_508CD3 */
                sub_56CE30((short *)(bone + 4), (int *)sp);
                if (*(unsigned short *)bone == 0xFFFFu) { /* 66 cmp ax,0FFFFh */
                    scale = *(short *)(skel + 2);
                    *(int *)(sp + 0x48) = scale;
                    *(int *)(sp + 0x44) = scale;
                    *(int *)(sp + 0x40) = scale;
                    Mat3S16_ScaleByVec12((short *)sp, (int *)(sp + 0x40));
                    d = (int *)(bone + 0x10);
                    s = (int *)sp;
                    n = 8;
                    while (n--)
                        *d++ = *s++; /* rep movsd ecx=8 */
                    *(int *)(bone + 0x24) = ((int)*(short *)(skel + 8) * scale) >> 8;
                    *(int *)(bone + 0x28) = ((int)*(short *)(skel + 0x0A) * scale) >> 8;
                    *(int *)(bone + 0x2C) = ((int)*(short *)(skel + 0x0C) * scale) >> 8;
                    /* xor edi,edi; add esp,8 after first xyz store */
                } else {
                    /* loc_508D4B */
                    parent = *(short *)bone; /* movsx ax */
                    pb = skel + 0x10 + parent * 0x30;
                    *(int *)(sp + 0x14) = 0; /* EDI, kept 0 */
                    *(int *)(sp + 0x18) = 0;
                    *(int *)(sp + 0x1C) = (int)*(short *)(pb + 2);
                    Mat_ComposeTwoThenCopy8((unsigned int *)(pb + 0x10), (int)sp, bone + 0x10);
                    /* add esp,0Ch */
                }
                idx++;
                bone += 0x30;
            } while (idx < (int)skel[0]); /* jl SIGNED */
        }
    }

    /* loc_508F3D */
    return BattleScratch_Unwind(0x58);
}
```
