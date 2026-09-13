# GF_291Pandemona_InitSummonContext @ 0x6ED260

- Instr (live): 71
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=103
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=1864
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=150
- A==B: non
- Push IDB: oui
- SetType: _DWORD *__cdecl GF_291Pandemona_InitSummonContext(unsigned __int8 *)
- Notes parent: Init Pandemona 291 (pas 200). LoadStageState DWORD 0 puis 2 TIM (13BBBEC, 13ED20C). Arena. payload[0] BYTE caster → actor *0x9C @ 1D972C0. BS_Memset stride 0x14. BdLink SequenceTick. FillDwords count 2 node+0Ch. BYTE [inner+10h]; events [inner+8] stride 0x18. Y only movsx WORD +0x20. jle signé. idiv edi toujours. Camera avgY+0xFA0. EAX=&TaskRoot. Occupancy 1+2 absente. add esp 2Ch.

## C réconcilié

```c
/* GF_291Pandemona_InitSummonContext @ 0x6ED260
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 71 instr, size 0xE7, end 0x6ED347. cdecl, 1 arg, retn C3. FLAGS 0x5400.
 * Saved esi/edi; ebx/ebp only on count>0. No sub esp.
 * add esp,2Ch once (11 dword pushes: TIM 2 + BS_Memset 4 + BdLink 2 + FillDwords 3).
 * LoadStageState DWORD 0 is stored before the first Enqueue call.
 * Two TIM heads: byte_13BBBEC then byte_13ED20C.
 * payload[0] BYTE caster -> actor *0x9C @ g_BattlePresentationActors 0x1D972C0.
 * BS_Memset stride 0x14 count 1. FillDwords DWORD count 2 at node+0Ch.
 * BYTE [inner+10h] count; events [inner+8] stride 0x18; BYTE actorId.
 * Y only: movsx WORD dword_1D972E0 (actor+0x20). X / dword_1D972DC unused.
 * jle signed (7E). cdq;idiv edi always (div0 if count==0). Camera = avgY+0xFA0.
 * EAX return = &GF_291Pandemona_TaskRoot.
 * Actor presentation stride 0x9C, not slot 0xD0.
 * Occupancy 1+2 / 0xD0 / 0x1D0 / GF+0x44 / K_GF 0x84: absent.
 * Widths: BYTE payload[0], [inner+10h], [event]; WORD movsx Y; DWORD stores.
 * No 66 prefix, no ja/jg, no jpt, no setcc, no domain::.
 */

unsigned __int8 *__cdecl BattleTimQueue_EnqueueType1(unsigned __int8 *);
void *Magic_GetFileArena(void);
int __cdecl BS_Memset(int list_head, _WORD *node_array, unsigned int stride, int count);
int __cdecl BdLinkTask_Register(int list_head, int callback);
int __cdecl FillDwords(void *dst, int val, unsigned int count);
int GF_291Pandemona_SequenceTick(void);

extern unsigned __int8 byte_13BBBEC;
extern unsigned __int8 byte_13ED20C;
extern int GF_291Pandemona_LoadStageState;
extern void *GF_291Pandemona_TexturePayloadPtr;
extern unsigned __int8 *GF_291Pandemona_ActionCtxPtr;
extern unsigned __int8 GF_291Pandemona_TaskSeed;
extern _DWORD GF_291Pandemona_TaskRoot[4];
extern unsigned __int8 *GF_291Pandemona_TargetStatTablePtr;
extern int GF_291Pandemona_AvgTargetY;
extern int GF_291Pandemona_CameraBaseY;
extern int g_BattlePresentationActors[];
extern int dword_1D972E0[];

_DWORD *__cdecl GF_291Pandemona_InitSummonContext(unsigned __int8 *payload)
{
    unsigned int casterSlot;
    int node;
    unsigned __int8 *inner;
    unsigned int groupCount;
    int sumY;
    unsigned int cursor;
    unsigned int remaining;
    unsigned int actorId;

    GF_291Pandemona_LoadStageState = 0;
    BattleTimQueue_EnqueueType1(&byte_13BBBEC);
    BattleTimQueue_EnqueueType1(&byte_13ED20C);
    GF_291Pandemona_TexturePayloadPtr = Magic_GetFileArena();

    GF_291Pandemona_ActionCtxPtr = payload;
    casterSlot = (unsigned int)payload[0];
    GF_291Pandemona_TargetStatTablePtr =
        (unsigned __int8 *)((char *)g_BattlePresentationActors + casterSlot * 0x9C);

    BS_Memset((int)GF_291Pandemona_TaskRoot, (_WORD *)&GF_291Pandemona_TaskSeed, 0x14, 1);
    node = BdLinkTask_Register((int)GF_291Pandemona_TaskRoot, (int)GF_291Pandemona_SequenceTick);
    FillDwords((void *)(node + 0x0C), 0, 2);

    inner = *(unsigned __int8 **)(GF_291Pandemona_ActionCtxPtr + 4);
    groupCount = (unsigned int)inner[0x10];
    sumY = 0;
    GF_291Pandemona_AvgTargetY = 0;

    if ((int)groupCount > 0) {
        cursor = 0;
        remaining = groupCount;
        do {
            cursor += 0x18;
            actorId = (unsigned int)(*(unsigned __int8 **)(inner + 8))[cursor - 0x18];
            sumY += (int)*(__int16 *)((char *)dword_1D972E0 + actorId * 0x9C);
            GF_291Pandemona_AvgTargetY = sumY;
            remaining--;
        } while (remaining != 0);
    }

    sumY = sumY / (int)groupCount;
    GF_291Pandemona_AvgTargetY = sumY;
    GF_291Pandemona_CameraBaseY = sumY + 0xFA0;

    return (_DWORD *)GF_291Pandemona_TaskRoot;
}
```
