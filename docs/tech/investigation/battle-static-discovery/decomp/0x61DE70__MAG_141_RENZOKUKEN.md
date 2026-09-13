# MAG_141_RENZOKUKEN @ 0x61DE70

- Instr (live): 61
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=86
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=702
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=21
- A==B: non
- Push IDB: oui
- SetType: void *__cdecl MAG_141_RENZOKUKEN(unsigned __int8 *)
- Notes parent: Init MAG Renzokuken 5-hit. Deux BdLink (0x10x1 + 0x24x100). WORD node+0Ch=0. Loops WORD 0xFFFF stride 0x0C/0x14/0x10 jl signe. TIM dword_24C31B0. Cam unk_EA8010. BYTE [[payload+4]+8] et payload[0]. setz WORD inner+4==0xFFFE. dword_24C3244=4. EAX=&unk_24C1E40. Occupancy 1+2 absente. add esp 30h/8.

## C réconcilié

```c
/* MAG_141_RENZOKUKEN @ 0x61DE70
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 61 instr, size 0xFD, end 0x61DF6D. cdecl, 1 arg, retn C3. FRSIZE 0.
 * add esp,30h (12 dword pushes: 2x BS_Memset 4 + 2x BdLink 2).
 * add esp,8 (camera + TIM). EAX return = offset unk_24C1E40 (list1 head).
 * Occupancy 1+2 / 0xD0 / 0x1D0 / GF+0x44 / K_GF 0x84 / actor 0x9C: absent.
 * Widths: BYTE payload[0] and [[payload+4]+8]; WORD 66 node+0Ch twice; WORD cmp 0xFFFE + setz;
 * WORD 0xFFFF stores on three signed-jl address loops (stride 0x0C / 0x14 / 0x10).
 * No ja/jg, no jpt, no domain::.
 */

void *Magic_GetFileArena(void);
int __cdecl BS_Memset(int list_head, unsigned short *node_array, unsigned int stride, int count);
int __cdecl BdLinkTask_Register(int list_head, int callback);
void *__cdecl BattleCamera_BindResource(void *resource);
unsigned __int8 *__cdecl BattleTimQueue_EnqueueType1(unsigned __int8 *tim);
int sub_61F710(void);
int __cdecl sub_61DF70(int (*)());

extern unsigned __int8 *dword_24C324C;
extern unsigned __int8 *dword_24C31A8;
extern unsigned short word_24C1E30[8];
extern unsigned char unk_24C1E40;
extern int dword_24C1138;
extern int dword_24C31AC;
extern unsigned short word_24C2398[];
extern int dword_24C2388;
extern int dword_24C3244;
extern int dword_24C3248;
extern unsigned short word_24C1140[];
extern unsigned short word_24C1320[];
extern unsigned short word_24C1E50[];
extern unsigned short word_24C2170;
extern int dword_24C16E0[];
extern unsigned char unk_EA8010;
extern unsigned __int8 *dword_24C31B0;

void *__cdecl MAG_141_RENZOKUKEN(unsigned __int8 *payload)
{
    unsigned char *inner;
    int node;
    unsigned int p;

    dword_24C324C = (unsigned __int8 *)Magic_GetFileArena();
    dword_24C31A8 = payload;
    inner = *(unsigned char **)(payload + 4);
    dword_24C1138 = *(unsigned char *)(*(unsigned int *)(inner + 8));
    dword_24C31AC = payload[0];

    BS_Memset((int)&unk_24C1E40, word_24C1E30, 0x10, 1);
    node = BdLinkTask_Register((int)&unk_24C1E40, (int)sub_61F710);
    *(unsigned short *)(node + 0x0C) = 0;

    BS_Memset((int)&dword_24C2388, word_24C2398, 0x24, 0x64);
    node = BdLinkTask_Register((int)&dword_24C2388, (int)sub_61DF70);
    *(unsigned short *)(node + 0x0C) = 0;

    payload = dword_24C31A8;
    inner = *(unsigned char **)(payload + 4);
    dword_24C3244 = 4;
    dword_24C3248 = (*(unsigned short *)(inner + 4) == 0xFFFE);

    p = (unsigned int)word_24C1140;
    do {
        *(unsigned short *)p = 0xFFFF;
        p += 0x0C;
    } while ((int)p < (int)word_24C1320);

    p = (unsigned int)word_24C1E50;
    do {
        *(unsigned short *)p = 0xFFFF;
        p += 0x14;
    } while ((int)p < (int)&word_24C2170);

    p = (unsigned int)word_24C1320;
    do {
        *(unsigned short *)p = 0xFFFF;
        p += 0x10;
    } while ((int)p < (int)dword_24C16E0);

    BattleCamera_BindResource(&unk_EA8010);
    BattleTimQueue_EnqueueType1(dword_24C31B0);
    return &unk_24C1E40;
}
```
