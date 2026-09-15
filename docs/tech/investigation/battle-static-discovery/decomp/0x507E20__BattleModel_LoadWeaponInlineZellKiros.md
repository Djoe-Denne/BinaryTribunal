# BattleModel_LoadWeaponInlineZellKiros @ 0x507E20

- Instr (live): 125
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=5040 (retry after length/empty; first rt=6455 fence=false)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=4499
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=5363
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleModel_LoadWeaponInlineZellKiros(unsigned __int8 *)
- Notes parent: Phase BYTE [ctx+0Dh] 0/1/2. Actor stride 0x9C phase 0 only (byte_1D97340 = row+0x80). Record stride 0x34 type-1 scan. Occupancy 1+2 / slot 0xD0 absents. jl signes. xorEAX_0 stub 33C0 C3. Return 2 phase 2 sans inc phase. Mask ~(1<<(slot+12)). TIM BS+[14h] mesh BS+[4]. BYTE [edi+24h] DWORD [H2+8]/[+18h]/[+28h]. Pas de 66/setcc/jpt. Pas de Hex-Rays. Pas de struct packee.

## C réconcilié

```c
/* BattleModel_LoadWeaponInlineZellKiros @ 0x507E20
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 125 instr, size 0x15C, end 0x507F7C. IDA TYPE int __cdecl(unsigned __int8 *).
 * cdecl, 1 arg, retn C3. push ebx,esi always; push edi only on phase 2.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * Actor stride 0x9C present (phase 0, byte_1D97340 = row+0x80).
 * Record stride 0x34 present (type-1 scan). Type byte [+1]==1 is body, not occupancy.
 * Widths: BYTE phase/id/type/slot/+24h/row+0x80; WORD movsx file_id; DWORD ptr/size/mask.
 * No 66, no setcc, no jpt_. jl SIGNED (7C / 0F8C). No packed struct.
 * xorEAX_0 @ 0x46C040 is 33C0 C3 (always 0): 0-arg gate on phase 2; 3-arg stub on phase 1.
 */

extern unsigned char g_BattleResourceRecords[11][0x34]; /* 0x1D99768 */
extern unsigned char unk_1D999A4;                       /* 0x1D999A4 exclusive scan bound */
extern unsigned char byte_1D97340[];                    /* 0x1D97340 = actors+0x80 */
extern unsigned __int16 *PartyWeaponsArray[11];         /* 0xB8B940 */
extern unsigned char *BS_Location_4;                    /* 0xB6D08C A1 DWORD */
extern int BATTLE_PRESENTATION_FILE_RESULT;             /* 0x1D999C8 A1 signed */

int __cdecl xorEAX_0(); /* unspecified args: () at 0x507E42, (src,slot,0) at 0x507F2A */
void __cdecl BS_CopyGeometry(unsigned char *dst, unsigned char *src, unsigned int size);
__int16 __cdecl BattleModel_AllocateTexturePagesAndPatchTPage(int *tim, int mesh, unsigned __int16 mask);
int __cdecl BattleFile_CharacterLoad(int file_id, int dest);

int __cdecl BattleModel_LoadWeaponInlineZellKiros(unsigned __int8 *ctx)
{
    unsigned int phase;
    unsigned int slot;
    unsigned char *bs;
    unsigned char *rec;
    unsigned char *dst;
    unsigned char *h2;
    unsigned int off4;
    unsigned int off8;
    unsigned int offC;
    unsigned int mask;
    unsigned int weapon_sel;
    int file_id;

    phase = ctx[0x0D];                    /* xor eax,eax ; mov al,[ebx+0Dh] */
    if (phase == 0)                       /* sub eax,0 ; jz loc_507F3F */
        goto loc_507F3F;
    phase--;
    if (phase == 0)                       /* dec eax ; jz loc_507EDA */
        goto loc_507EDA;
    phase--;
    if (phase != 0)                       /* dec eax ; jnz loc_507F77 */
        goto loc_507F77;

    /* phase 2 @ 0x507E42 */
    if (xorEAX_0() != 0)                  /* test eax,eax ; jnz loc_507F77 */
        goto loc_507F77;

    rec = &g_BattleResourceRecords[0][0]; /* B8 offset, esi index unused in C (equiv walk) */

loc_507E59:
    if (rec[1] != 1)                      /* cmp [eax+1], cl (cl=1) ; jnz loc_507E65 */
        goto loc_507E65;
    if (rec[0] == ctx[0x0C])              /* mov dl,[eax] ; cmp dl,[ebx+0Ch] ; jz loc_507E76 */
        goto loc_507E76;

loc_507E65:
    rec += 0x34;
    if ((int)rec < (int)&unk_1D999A4)     /* cmp eax, offset unk_1D999A4 ; jl SIGNED */
        goto loc_507E59;
    rec = ctx;                            /* miss: mov edi,[esp+10h] = arg_0 */
    goto loc_507E83;

loc_507E76:
    /* lea esi*0x34 + 0x1D99768 — rec already points at the hit row */

loc_507E83:
    bs = BS_Location_4;                   /* A1 */
    dst = *(unsigned char **)(rec + 8);   /* [edi+8] */
    off4 = *(unsigned int *)(bs + 4);
    BS_CopyGeometry(dst, bs + off4, *(unsigned int *)(bs + 0x10) - off4);

    h2 = *(unsigned char **)(rec + 0x10); /* [edi+10h] */
    rec[0x24] = ctx[0x0F];                /* BYTE 88 57 24 */
    *(unsigned int *)(h2 + 8) = (unsigned int)(dst - h2) + 8; /* DWORD [H2+8], not record+8 */

    bs = BS_Location_4;                   /* A1 reload ; add esp,0Ch */
    off8 = *(unsigned int *)(bs + 8);
    off4 = *(unsigned int *)(bs + 4);     /* mov ebx,[eax+4] — overwrites ctx in ebx */
    offC = *(unsigned int *)(bs + 0x0C);
    dst += off8 - off4;
    *(unsigned int *)(rec + 0x18) = (unsigned int)dst;
    *(unsigned int *)(rec + 0x28) = (unsigned int)dst + (offC - off8);
    return 2;                             /* phase BYTE NOT incremented */

loc_507EDA:
    if (BATTLE_PRESENTATION_FILE_RESULT < 0) /* A1 ; test ; jl SIGNED 0F8C */
        goto loc_507F77;                  /* phase NOT incremented */
    bs = BS_Location_4;
    slot = ctx[0x0F];                     /* mov cl,[ebx+0Fh] (not movzx) */
    mask = ~(1u << ((slot + 12) & 0xFF)); /* add ecx,0Ch ; shl edx,cl ; not edx */
    BattleModel_AllocateTexturePagesAndPatchTPage(
        (int *)(bs + *(unsigned int *)(bs + 0x14)), /* tim  = BS+[14h] */
        (int)(bs + *(unsigned int *)(bs + 4)),      /* mesh = BS+[4] */
        (unsigned __int16)mask);                    /* full DWORD pushed */
    bs = BS_Location_4;                   /* A1 reload */
    if (*(unsigned int *)(bs + 0x14) != *(unsigned int *)(bs + 0x10)) {
        xorEAX_0((int)(bs + *(unsigned int *)(bs + 0x10)), (int)slot, 0);
        ctx[0x0D] = (unsigned char)(ctx[0x0D] + 1); /* inc al ; mov [ebx+0Dh], al */
        return 0;
    }

loc_507F74:
    ctx[0x0D] = (unsigned char)(ctx[0x0D] + 1); /* inc byte ptr [ebx+0Dh] */
    goto loc_507F77;

loc_507F3F:
    bs = BS_Location_4;
    slot = ctx[0x0F];                     /* xor eax,eax ; mov al */
    /* lea ecx,[eax+eax*4]; shl ecx,3; sub ecx,eax; dl = byte_1D97340[ecx*4] */
    weapon_sel = byte_1D97340[0x9C * slot];
    file_id = (int)(__int16)PartyWeaponsArray[ctx[0x0C]][weapon_sel]; /* movsx WORD */
    BattleFile_CharacterLoad(file_id, (int)bs); /* EAX unused */
    goto loc_507F74;

loc_507F77:
    return 0;
}
```
