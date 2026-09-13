# MAG_161_RENZOKUKEN_VS_ELNOYLE_ELVORET @ 0x5FD100

- Instr (live): 71
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=194
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=194
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=164
- A==B: non
- Push IDB: oui
- SetType: void *__cdecl(unsigned __int8 *)
- Notes parent: BYTE id via `ecx=[arg_0+4]; edx=[ecx+8]; cl=[edx]` (2 hops). WORD [node+0Ch]=0. Fills WORD 0xFFFF jl 40/40/40/30/60 strides 0x0C/0x14/0x14/0x14/0x10. setz WORD[inner+4]==0xFFFE. add esp 30h/8. Retour `&unk_23D1B18`. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents.

## C réconcilié

```c
/* MAG_161_RENZOKUKEN_VS_ELNOYLE_ELVORET @ 0x5FD100
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 71 instr, size 0x125, end 0x5FD225. cdecl, 1 arg, FRSIZE=0, retn C3.
 * Callees cdecl: Magic_GetFileArena (0 args); BS_Memset x2; BdLinkTask_Register x2
 *   (batched add esp,30h = 4+4+2+2 dwords); BattleCamera_BindResource +
 *   BattleTimQueue_EnqueueType1 (add esp,8). Enqueue EAX discarded.
 * BYTE 8A: xor-ecx/edx then mov cl,[edx] / mov dl,[eax] → DWORD stores.
 *   edx = *(*(arg_0+4)+8) then BYTE at [edx] — two pointer hops, not BYTE at +8.
 * WORD 66: [node+0Ch]=0 after each Register; five 0xFFFF fills; cmp [inner+4],0FFFEh.
 * setz dl → dword_23D3498 0/1. jl signed exclusive-end fills (40/40/40/30/60).
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * Return EAX = offset unk_23D1B18. No domain::. No packed struct.
 */

void *Magic_GetFileArena(void);
int __cdecl BS_Memset(int dest, unsigned short *fill, unsigned int stride, int count);
int __cdecl BdLinkTask_Register(int list_head, int callback);
void *__cdecl BattleCamera_BindResource(void *resource);
unsigned char *__cdecl BattleTimQueue_EnqueueType1(unsigned char *tim);
int __cdecl sub_5FEC10(int node);
int __cdecl sub_5FD230(int node);

extern void *dword_23D349C;
extern unsigned char *dword_23D33F8;
extern unsigned int dword_23D0E10;
extern unsigned int dword_23D33FC;
extern unsigned int dword_23D3494;
extern unsigned int dword_23D3498;
extern unsigned short word_23D1B08[8];
extern unsigned char unk_23D1B18;
extern unsigned short word_23D25E8[1800];
extern int dword_23D25D8;
extern unsigned char *dword_23D3400;
extern unsigned char unk_E9AEC0;
extern unsigned short word_23D0E18[];
extern unsigned short word_23D0FF8[];
extern unsigned short word_23D20A0[];
extern unsigned short word_23D23C0[];
extern unsigned short word_23D1B28[];
extern unsigned short word_23D1E48[];
extern unsigned short word_23D13B8[];

void *__cdecl MAG_161_RENZOKUKEN_VS_ELNOYLE_ELVORET(unsigned char *arg_0)
{
    unsigned char *inner;
    unsigned char *byte_src;
    unsigned char *p;
    int node;

    dword_23D349C = Magic_GetFileArena();

    inner = *(unsigned char **)(arg_0 + 4);
    dword_23D33F8 = arg_0;
    byte_src = *(unsigned char **)(inner + 8);
    dword_23D0E10 = *byte_src;
    dword_23D33FC = *arg_0;

    BS_Memset((int)&unk_23D1B18, word_23D1B08, 0x10u, 1);
    node = BdLinkTask_Register((int)&unk_23D1B18, (int)sub_5FEC10);
    *(unsigned short *)(node + 0x0C) = 0;

    BS_Memset((int)&dword_23D25D8, word_23D25E8, 0x24u, 0x64);
    node = BdLinkTask_Register((int)&dword_23D25D8, (int)sub_5FD230);
    *(unsigned short *)(node + 0x0C) = 0;

    inner = *(unsigned char **)(dword_23D33F8 + 4);
    dword_23D3494 = 4;
    dword_23D3498 = (*(unsigned short *)(inner + 4) == 0xFFFE);

    p = (unsigned char *)word_23D0E18;
    do {
        *(unsigned short *)p = 0xFFFF;
        p += 0x0C;
    } while ((int)p < (int)word_23D0FF8);

    p = (unsigned char *)word_23D20A0;
    do {
        *(unsigned short *)p = 0xFFFF;
        p += 0x14;
    } while ((int)p < (int)word_23D23C0);

    p = (unsigned char *)word_23D1B28;
    do {
        *(unsigned short *)p = 0xFFFF;
        p += 0x14;
    } while ((int)p < (int)word_23D1E48);

    p = (unsigned char *)word_23D1E48;
    do {
        *(unsigned short *)p = 0xFFFF;
        p += 0x14;
    } while ((int)p < (int)word_23D20A0);

    p = (unsigned char *)word_23D0FF8;
    do {
        *(unsigned short *)p = 0xFFFF;
        p += 0x10;
    } while ((int)p < (int)word_23D13B8);

    BattleCamera_BindResource(&unk_E9AEC0);
    BattleTimQueue_EnqueueType1(dword_23D3400);

    return &unk_23D1B18;
}
```
