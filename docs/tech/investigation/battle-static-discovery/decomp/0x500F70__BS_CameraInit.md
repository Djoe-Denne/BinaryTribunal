# BS_CameraInit @ 0x500F70

- Instr (live): 14
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=24
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=34
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=48
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BS_CameraInit(void *resource)
- Notes parent: BYTE movzx main_camera[+eax] eax=GetRandom&1. WORD CameraID_Maybe (66). Encounter DWORD==0x21 force BYTE +2. pop ecx=4. Return EAX Bind. Occupancy/0xD0/0x1D0/0x44/GetRandomInt absents.

## C réconcilié

```c
/* BS_CameraInit @ 0x500F70
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 14 instr, size 0x3B, end 0x500FAB. IDA type int __cdecl(int).
 * FF8SceneOut 128 @ 0x1D287DC: BYTE +2 main_camera, BYTE +3 second_camera.
 * CameraID_Maybe WORD stores (66 A3 / 66 89 0D) @ 0x1D97728.
 * Encounter DWORD A1 @ 0x1D96DA8 cmp 0x21; jnz loc_500F9F skips override.
 * pop ecx = add esp,4 after Bind. Return EAX leftover from Bind.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / GetRandomInt: unused.
 * No Hex-Rays. No domain::.
 */

extern unsigned char CURRENT_ENCOUNTER_DATA_SCENE_OUT[]; /* 0x1D287DC, FF8SceneOut 128 */
extern unsigned short CameraID_Maybe; /* 0x1D97728, WORD only */
extern unsigned int CURRENT_ENCOUNTER_ID; /* 0x1D96DA8 */

unsigned int BS_GetRandomCamera_Probably(void);
void *__cdecl BattleCamera_BindResourceSections(void *resource);

int __cdecl BS_CameraInit(void *resource)
{
    unsigned int idx;

    idx = BS_GetRandomCamera_Probably() & 1; /* 83 E0 01 */
    /* 66 0F B6 80 : movzx ax, BYTE [eax+0x1D287DE] */
    CameraID_Maybe = CURRENT_ENCOUNTER_DATA_SCENE_OUT[2 + idx];

    if (CURRENT_ENCOUNTER_ID == 0x21) { /* 83 F8 21 ; 75 0F jnz loc_500F9F */
        /* 66 0F B6 0D : movzx cx, BYTE main_camera */
        CameraID_Maybe = CURRENT_ENCOUNTER_DATA_SCENE_OUT[2];
    }

    return (int)BattleCamera_BindResourceSections(resource); /* push edx; call; pop ecx */
}
```
