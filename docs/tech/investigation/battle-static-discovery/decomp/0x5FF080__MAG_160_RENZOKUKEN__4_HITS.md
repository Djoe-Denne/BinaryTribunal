# MAG_160_RENZOKUKEN__4_HITS @ 0x5FF080

- Instr (live): 61
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=79
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=386
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=155
- A==B: non
- Push IDB: oui
- SetType: void *__cdecl MAG_160_RENZOKUKEN__4_HITS(unsigned __int8 *)
- Notes parent: Family MAG two-list (BS_Memset 0x10x1 + BdLink sub_600930, BS_Memset 0x24x100 + BdLink sub_5FF180). WORD node+0Ch. dword_23D5634=4 immediate. setz word[*(arg0+4)+4]==0xFFFE. BYTE *(*(arg0+4)+8) then [arg0]. Fill WORD 0xFFFF jl signed 40x0xC / 40x0x14 / 60x0x10. add esp 30h then 8. EAX=&unk_23D4230. Occupancy/0xD0/0x1D0/0x44 absents.

## C réconcilié

```c
/* MAG_160_RENZOKUKEN__4_HITS @ 0x5FF080
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 61 instr, size 0xFD, end 0x5FF17D. IDA type void *__cdecl(unsigned __int8 *).
 * cdecl, 1 arg, no locals, no saved regs, retn C3.
 * add esp,30h after BS_Memset+BdLink+BS_Memset+BdLink (12 dwords);
 * add esp,8 after Camera+TIM (2 dwords).
 * BYTE 8A: [arg0], then *(*(arg0+4)+8). WORD 66: [node+0Ch]=0 twice;
 * [eax]=0xFFFF in three fill loops. DWORD A3/89/C7: arena, arg0, two
 * zero-ext bytes, hit count 4, setz result.
 * setz after cmp word [ecx+4], 0FFFEh (edx xor'd). Three jl (7C) signed.
 * EAX return = &unk_23D4230. Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 /
 * GF Exists 0x44: absent. No jpt. No domain::.
 */

extern void *dword_23D563C;                 /* 0x23D563C Magic_GetFileArena result */
extern unsigned __int8 *dword_23D5598;     /* 0x23D5598 saved arg0 */
extern int dword_23D3528;                   /* 0x23D3528 zero-ext byte *(*(arg0+4)+8) */
extern int dword_23D559C;                   /* 0x23D559C zero-ext byte [arg0] */
extern int dword_23D5634;                   /* 0x23D5634 hit count, immediate 4 */
extern int dword_23D5638;                   /* 0x23D5638 setz word[ecx+4]==0xFFFE */
extern _WORD word_23D4220[8];              /* 0x23D4220 16-byte BS_Memset template */
extern unsigned char unk_23D4230[];        /* 0x23D4230 first BdLink list head (returned) */
extern int dword_23D4778;                   /* 0x23D4778 second BdLink list head */
extern _WORD word_23D4788[];                /* 0x23D4788 3600-byte template (100*0x24) */
extern __int16 word_23D3530[];              /* 0x23D3530 fill1 start, stride 0xC */
extern __int16 word_23D3710[];              /* 0x23D3710 fill1 end / fill3 start */
extern __int16 word_23D4240[];              /* 0x23D4240 fill2 start, stride 0x14 */
extern __int16 word_23D4560;                /* 0x23D4560 fill2 end sentinel (scalar) */
extern int dword_23D3AD0[];                 /* 0x23D3AD0 fill3 end sentinel */
extern unsigned char unk_EA1168;           /* 0xEA1168 camera resource blob */
extern unsigned __int8 *dword_23D55A0;     /* 0x23D55A0 TIM queue src */

extern int sub_600930(void);                /* 0x600930 callback, size 79 */
extern int __cdecl sub_5FF180(int (*)());    /* 0x5FF180 callback, size 853 */

extern void *__cdecl Magic_GetFileArena(void);
extern int __cdecl BS_Memset(int, _WORD *, unsigned int, int);
extern int __cdecl BdLinkTask_Register(int list_head, int callback);
extern void *__cdecl BattleCamera_BindResource(void *resource);
extern unsigned __int8 *__cdecl BattleTimQueue_EnqueueType1(unsigned __int8 *);

void *__cdecl MAG_160_RENZOKUKEN__4_HITS(unsigned __int8 *arg0)
{
    unsigned __int8 *arg;
    unsigned char *ecx;
    unsigned char *edx;
    int node;
    unsigned char *p;

    dword_23D563C = Magic_GetFileArena();

    arg = arg0;
    ecx = *(unsigned char **)(arg + 4);
    dword_23D5598 = arg;
    edx = *(unsigned char **)(ecx + 8);
    dword_23D3528 = *edx;
    dword_23D559C = *arg;
    BS_Memset((int)unk_23D4230, word_23D4220, 0x10u, 1);

    node = BdLinkTask_Register((int)unk_23D4230, (int)sub_600930);
    *(unsigned __int16 *)(node + 0xC) = 0;
    BS_Memset((int)&dword_23D4778, word_23D4788, 0x24u, 0x64);

    node = BdLinkTask_Register((int)&dword_23D4778, (int)sub_5FF180);
    *(unsigned __int16 *)(node + 0xC) = 0;

    arg = dword_23D5598;
    ecx = *(unsigned char **)(arg + 4);
    dword_23D5634 = 4;
    p = (unsigned char *)word_23D3530;
    dword_23D5638 = (*(unsigned __int16 *)(ecx + 4) == 0xFFFE) ? 1 : 0;

    do {
        *(unsigned __int16 *)p = 0xFFFF;
        p += 0xC;
    } while ((int)p < (int)&word_23D3710);

    p = (unsigned char *)word_23D4240;
    do {
        *(unsigned __int16 *)p = 0xFFFF;
        p += 0x14;
    } while ((int)p < (int)&word_23D4560);

    p = (unsigned char *)word_23D3710;
    do {
        *(unsigned __int16 *)p = 0xFFFF;
        p += 0x10;
    } while ((int)p < (int)dword_23D3AD0);

    BattleCamera_BindResource(&unk_EA1168);
    BattleTimQueue_EnqueueType1(dword_23D55A0);
    return unk_23D4230;
}
```
