# GF_325Diablos_InitSummonContext @ 0x654210

- Instr (live): 93
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1760
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=995
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=1881
- A==B: non
- Push IDB: oui
- SetType: _DWORD *__cdecl GF_325Diablos_InitSummonContext(unsigned __int8 *)
- Notes parent: Init Diablos 325. TIM dword_250517C puis LCG=0. Arena. payload[0] BYTE caster → actor *0x9C @ 1D972C0. BdLink 0x10x1 + FillDwords DWORD node+0Ch. BYTE [inner+10h] count ; events [inner+8] stride 0x18. movsx WORD Y +0x20 puis X +0x1C. jle signé. idiv ebp toujours (+0xFA0/+0x7D0 cam). EAX=&off_25051B0. Occupancy 1+2 absente. add esp 28h.

## C réconcilié

```c
/* GF_325Diablos_InitSummonContext @ 0x654210
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 93 instr, size 0x132, end 0x654342. cdecl, 1 arg, retn C3. No sub esp.
 * add esp,28h once (10 dword pushes: TIM 1 + BS_Memset 4 + BdLink 2 + FillDwords 3).
 * EAX return = offset off_25051B0 (list head).
 * Actor presentation stride 0x9C (lea/shl/sub *4), not slot 0xD0.
 * Occupancy 1+2 / 0xD0 / 0x1D0 / GF+0x44 / K_GF 0x84: absent.
 * Widths: BYTE payload[0], [inner+10h], [event+cursor-18h] twice; WORD movsx actor+0x20 / +0x1C;
 * DWORD FillDwords node+0Ch count 1. jle signed (7E). idiv ebp always (div0 if count==0).
 * add ecx,7D0h is +2000, not occupancy. No ja/jg, no jpt, no setcc, no domain::.
 */

unsigned __int8 *__cdecl BattleTimQueue_EnqueueType1(unsigned __int8 *);
void *Magic_GetFileArena(void);
int __cdecl BS_Memset(int list_head, _WORD *node_array, unsigned int stride, int count);
int __cdecl BdLinkTask_Register(int list_head, int callback);
int __cdecl FillDwords(void *dst, int val, unsigned int count);
int GF_Diablo_SummonScript_TaskDriver(void);

extern unsigned __int8 *dword_250517C;
extern int gfDiablo_noiseLcgState;
extern void *gfDiablo_textureBasePtr;
extern int dword_2505180;
extern unsigned __int8 *gfDiablo_sequenceContextPtr;
extern unsigned __int8 *gfDiablo_actorSlotPtr;
extern _DWORD off_25051B0[4];
extern unsigned __int8 unk_25051C0;
extern int g_BattlePresentationActors[];
extern int dword_1D972DC[];
extern int dword_1D972E0[];
extern int gfDiablo_targetAverageY;
extern int gfDiablo_targetAverageX;
extern int gfDiablo_cameraBaseYHigh;
extern int gfDiablo_cameraBaseYMid;

_DWORD *__cdecl GF_325Diablos_InitSummonContext(unsigned __int8 *payload)
{
    unsigned __int8 *tim;
    unsigned int casterSlot;
    int node;
    unsigned __int8 *inner;
    unsigned int groupCount;
    int sumY;
    int sumX;
    int avgY;
    int avgX;
    unsigned int cursor;
    unsigned int remaining;
    unsigned int actorId;

    tim = dword_250517C;
    gfDiablo_noiseLcgState = 0;
    BattleTimQueue_EnqueueType1(tim);
    gfDiablo_textureBasePtr = Magic_GetFileArena();

    dword_2505180 = 0;
    gfDiablo_sequenceContextPtr = payload;
    casterSlot = (unsigned int)payload[0];
    gfDiablo_actorSlotPtr =
        (unsigned __int8 *)((char *)g_BattlePresentationActors + casterSlot * 0x9C);

    BS_Memset((int)off_25051B0, (_WORD *)&unk_25051C0, 0x10, 1);
    node = BdLinkTask_Register((int)off_25051B0, (int)GF_Diablo_SummonScript_TaskDriver);
    FillDwords((void *)(node + 0x0C), 0, 1);

    inner = *(unsigned __int8 **)(gfDiablo_sequenceContextPtr + 4);
    groupCount = (unsigned int)inner[0x10];
    sumY = 0;
    sumX = 0;
    gfDiablo_targetAverageY = 0;
    gfDiablo_targetAverageX = 0;

    if ((int)groupCount > 0) {
        cursor = 0;
        remaining = groupCount;
        do {
            cursor += 0x18;
            actorId = (unsigned int)(*(unsigned __int8 **)(inner + 8))[cursor - 0x18];
            sumY += (int)*(__int16 *)((char *)dword_1D972E0 + actorId * 0x9C);
            gfDiablo_targetAverageY = sumY;

            actorId = (unsigned int)(*(unsigned __int8 **)(inner + 8))[cursor - 0x18];
            sumX += (int)*(__int16 *)((char *)dword_1D972DC + actorId * 0x9C);
            gfDiablo_targetAverageX = sumX;

            remaining--;
        } while (remaining != 0);
    }

    avgY = sumY / (int)groupCount;
    avgX = sumX / (int)groupCount;
    gfDiablo_targetAverageY = avgY;
    gfDiablo_cameraBaseYHigh = avgY + 0xFA0;
    gfDiablo_cameraBaseYMid = avgY + 0x7D0;
    gfDiablo_targetAverageX = avgX;

    return (_DWORD *)off_25051B0;
}
```
