# MAG_159_RENZOKUKEN_VS_XATM092 @ 0x600BC0

- Instr (live): 61
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1272
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=137
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=28
- A==B: non
- Push IDB: oui
- SetType: void *__cdecl MAG_159_RENZOKUKEN_VS_XATM092(unsigned __int8 *)
- Notes parent: BYTE 8A [edx] apres DWORD [inner+8] (pas BYTE a inner+8). 2x WORD 66 [node+0Ch]. list_head2 = &dword_23D6C38. setz WORD==0xFFFE. 3 loops WORD 0xFFFF jl signe 40/80/60. EAX=&unk_23D63D0. add esp 30h/8. Occupancy/0xD0/0x1D0/0x44 absents.

## C réconcilié

```c
/* MAG_159_RENZOKUKEN_VS_XATM092 @ 0x600BC0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 61 instr, size 0xFD, end 0x600CBD. IDA type void *__cdecl(unsigned __int8 *).
 * cdecl, 1 arg [esp+4]. FRSIZE=0, no saved regs. retn C3.
 * add esp,30h after 4+2+4+2 pushes; add esp,8 after Bind+Enqueue.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / GetRandomInt: unused.
 * Widths: BYTE 8A ids; WORD 66 node+0Ch and 0xFFFF fills; DWORD globals.
 * setz dl after cmp WORD [ecx+4],0FFFEh. jl signed (7C) exclusive-end loops.
 * Three sentinel loops only (40 / 80 / 60). EAX return = &unk_23D63D0.
 * No packed struct. No domain::.
 */

extern void *Magic_GetFileArena(void);
extern int __cdecl BS_Memset(int dest, unsigned short *fill, unsigned int stride, int count);
extern int __cdecl BdLinkTask_Register(int list_head, int callback);
extern void *__cdecl BattleCamera_BindResource(void *resource);
extern unsigned __int8 *__cdecl BattleTimQueue_EnqueueType1(unsigned __int8 *tim);
extern void sub_602C40(void);
extern void sub_600CC0(void);

extern void *dword_23D7AFC;                 /* 0x23D7AFC SIZE 4 arena ptr */
extern unsigned __int8 *dword_23D7A58;      /* 0x23D7A58 SIZE 4 copy of arg_0 */
extern unsigned int dword_23D56C8;          /* 0x23D56C8 SIZE 4 zero-ext BYTE */
extern unsigned int dword_23D7A5C;          /* 0x23D7A5C SIZE 4 zero-ext BYTE */
extern unsigned int dword_23D7AF4;          /* 0x23D7AF4 SIZE 4 written 4 */
extern unsigned int dword_23D7AF8;          /* 0x23D7AF8 SIZE 4 setz 0/1 */
extern unsigned short word_23D63C0[8];     /* 0x23D63C0 SIZE 16 memset1 fill */
extern unsigned char unk_23D63D0;           /* 0x23D63D0 SIZE 1 list_head1 + return */
extern unsigned short word_23D6C48[1800];   /* 0x23D6C48 SIZE 3600 = 0x64*0x24 */
extern int dword_23D6C38;                    /* 0x23D6C38 SIZE 4 list_head2 */
extern unsigned __int8 *dword_23D7A60;     /* 0x23D7A60 SIZE 4 TIM ptr */
extern unsigned char unk_EA3468;            /* 0xEA3468 SIZE 1 camera resource */
extern unsigned char word_23D56D0[];       /* 0x23D56D0 loop1 start */
extern unsigned char word_23D58B0[];       /* 0x23D58B0 loop1 end / loop3 start */
extern unsigned char word_23D63E0[];       /* 0x23D63E0 loop2 start */
extern unsigned char word_23D6A20[];       /* 0x23D6A20 loop2 exclusive end */
extern unsigned char dword_23D5C70[];      /* 0x23D5C70 loop3 exclusive end */

void *__cdecl MAG_159_RENZOKUKEN_VS_XATM092(unsigned __int8 *arg_0)
{
    unsigned __int8 *p;
    unsigned int inner;
    unsigned int ptr8;
    int node1;
    int node2;
    unsigned char *it;

    dword_23D7AFC = Magic_GetFileArena();

    p = arg_0;
    inner = *(unsigned int *)(p + 4);
    dword_23D7A58 = p;
    ptr8 = *(unsigned int *)(inner + 8);
    dword_23D56C8 = *(unsigned char *)ptr8;   /* 8A 0A after 8B 51 08; not BYTE at inner+8 */
    dword_23D7A5C = *p;                       /* 8A 10 */

    BS_Memset((int)&unk_23D63D0, word_23D63C0, 0x10u, 1);
    node1 = BdLinkTask_Register((int)&unk_23D63D0, (int)sub_602C40);
    *(unsigned short *)(node1 + 0x0C) = 0;   /* 66 C7 40 0C 0000 */

    BS_Memset((int)&dword_23D6C38, word_23D6C48, 0x24u, 0x64);
    node2 = BdLinkTask_Register((int)&dword_23D6C38, (int)sub_600CC0);
    *(unsigned short *)(node2 + 0x0C) = 0;   /* 66 C7 40 0C 0000 */

    p = dword_23D7A58;
    inner = *(unsigned int *)(p + 4);
    dword_23D7AF4 = 4;
    dword_23D7AF8 = (*(unsigned short *)(inner + 4) == 0xFFFEu) ? 1u : 0u;

    /* loc_600C68: WORD 0xFFFF, stride 0x0C, 40 iters, jl signed exclusive end */
    it = word_23D56D0;
    do {
        *(unsigned short *)it = 0xFFFFu;
        it += 0x0C;
    } while ((int)it < (int)word_23D58B0);

    /* loc_600C7C: stride 0x14, 80 iters */
    it = word_23D63E0;
    do {
        *(unsigned short *)it = 0xFFFFu;
        it += 0x14;
    } while ((int)it < (int)word_23D6A20);

    /* loc_600C90: stride 0x10, 60 iters */
    it = word_23D58B0;
    do {
        *(unsigned short *)it = 0xFFFFu;
        it += 0x10;
    } while ((int)it < (int)dword_23D5C70);

    BattleCamera_BindResource((void *)&unk_EA3468);
    BattleTimQueue_EnqueueType1(dword_23D7A60);
    return &unk_23D63D0;
}
```
