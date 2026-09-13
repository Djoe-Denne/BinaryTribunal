# MAG_163_ROUGH_DIVIDE @ 0x5F5B80

- Instr (live): 67
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=196
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=49
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=47
- A==B: non
- Push IDB: oui
- SetType: void *__cdecl MAG_163_ROUGH_DIVIDE(unsigned __int8 *)
- Notes parent: add esp 30h puis 8. WORD 66 [node+0Ch] x2. Nested byte *[*(arg+4)+8]. slot=arg[0] DWORD. 3 jl signes 0x18/0x20/0x20 (100/150/150). Camera D9AC04 + TIM dword_23CE278. slot*0x9C depuis 0x1D97300, rep movsd 8. EAX=&unk_23CA1C8. Occupancy/0xD0/0x1D0/0x44 absents. Pas de Hex-Rays.

## C réconcilié

```c
/* MAG_163_ROUGH_DIVIDE @ 0x5F5B80
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 67 instr, size 0xF3, end 0x5F5C73. IDA type void *__cdecl(unsigned __int8 *).
 * cdecl, 1 arg. No sub esp. Saved ESI then EDI. IDA FRSIZE 0x8. retn C3.
 * add esp: 30h (12 pushes: Memset4 + Register2 + Memset4 + Register2), then 8
 * (Camera1 + TIM1). Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 /
 * K_GF 0x84: absent. Actor copy uses presentation stride 0x9C from 0x1D97300.
 * WORD 66 [node+0Ch] twice. Signed jl on three address loops. No packed struct.
 */

extern int dword_23CE580;
extern unsigned short word_23CA1A8[16];
extern unsigned char unk_23CA1C8;
extern int dword_23CE270;
extern int dword_23CA1A0;
extern int dword_23CE274;
extern unsigned short word_23CD358[1800];
extern int dword_23CD348;
extern int dword_23CA1D8[];
extern int dword_23CAB38[];
extern int dword_23CBDF8[];
extern int dword_23CD0B8;
extern unsigned char unk_D9AC04;
extern unsigned char *dword_23CE278;
extern unsigned char unk_23CD0D8;
extern unsigned char unk_1D97300;

extern void *Magic_GetFileArena(void);
extern int __cdecl BS_Memset(int list_head, unsigned short *node_array, unsigned int stride, int count);
extern int __cdecl BdLinkTask_Register(int list_head, int callback);
extern void *__cdecl BattleCamera_BindResource(void *resource);
extern unsigned char *__cdecl BattleTimQueue_EnqueueType1(unsigned char *tim);
extern int sub_5F9020(void);
extern int sub_5F5C80(void);

void *__cdecl MAG_163_ROUGH_DIVIDE(unsigned __int8 *arg_0)
{
    int node;
    int *p;
    unsigned int slot;
    unsigned int *src;
    unsigned int *dst;
    unsigned int n;

    dword_23CE580 = (int)Magic_GetFileArena();

    dword_23CE270 = (int)arg_0;
    dword_23CA1A0 = *(unsigned char *)*(int *)(*(int *)(arg_0 + 4) + 8);
    dword_23CE274 = arg_0[0];

    BS_Memset((int)&unk_23CA1C8, word_23CA1A8, 0x10u, 2);
    node = BdLinkTask_Register((int)&unk_23CA1C8, (int)sub_5F9020);
    *(unsigned short *)(node + 0x0C) = 0;

    BS_Memset((int)&dword_23CD348, word_23CD358, 0x24u, 0x64);
    node = BdLinkTask_Register((int)&dword_23CD348, (int)sub_5F5C80);
    *(unsigned short *)(node + 0x0C) = 0;

    p = dword_23CA1D8;
    do {
        *p = 0;
        p = (int *)((char *)p + 0x18);
    } while (p < dword_23CAB38);

    p = dword_23CAB38;
    do {
        *p = 0;
        p = (int *)((char *)p + 0x20);
    } while (p < dword_23CBDF8);

    p = dword_23CBDF8;
    do {
        *p = 0;
        p = (int *)((char *)p + 0x20);
    } while (p < &dword_23CD0B8);

    BattleCamera_BindResource(&unk_D9AC04);
    BattleTimQueue_EnqueueType1(dword_23CE278);

    slot = (unsigned int)dword_23CE274;
    dst = (unsigned int *)&unk_23CD0D8;
    src = (unsigned int *)((char *)&unk_1D97300 + slot * 0x9C);
    n = 8;
    while (n) {
        *dst++ = *src++;
        n--;
    }

    return &unk_23CA1C8;
}
```
