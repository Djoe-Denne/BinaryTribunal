# updateBattleCamera @ 0x504060

- Instr (live): 86
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1196
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=3350
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=2108
- A==B: non
- Push IDB: oui
- SetType: __int16 __cdecl updateBattleCamera(void)
- Notes parent: test DWORD 0x101 bits 0+8 gate init 0-arg. Pump list + add esp,4. test CX puis AH.80h (0x8000) skip sub_4A7120; ==1 snap. blend==0: flags u16 & ~0x2000 sinon DWORD cam+14/18/1C/20. jge signe 0x1000. 2x Thunk_56CB50 5 cdecl add esp,28h. FOV Q12 [cam+6]. Snap cache WORD FOV/1D977A2 clear blend. Occupancy/0xD0/0x1D0 absents.

## C réconcilié

```c
/* updateBattleCamera @ 0x504060
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 86 instr, size 0x17B, end 0x5041DB. IDA type __int16().
 * cdecl, 0 args, no saved regs, no locals.
 * F7 05 test DWORD flags, 101h (bits 0+8); jnz skip BS_CameraSettingInit2 (0-arg site).
 * BdLinkTask_Pump(&g_BattleCameraTaskListHead) add esp,4.
 * 66 85 C9 test CX,CX; F6 C4 80 test AH,80h = dword_1D97704 bit 0x8000.
 * sub_4A7120()==1 -> snap. Else reload ECX flags (5040A1).
 * Join 5040A7: AX=word_1D9771E (66 A1).
 * blend==0: AND ECX,0xFFFF; test 0xFFFFDFFF (exclude bit 0x2000); jz ret AX=0.
 * Else DWORD copy cam+14/18/1C/20 -> world_* + 1D981F0/F4 + Battle_Camera_*.
 * 66 3D 00 10 / 7D jge SIGNED s16 >= 0x1000 -> snap.
 * Blend: two Thunk_56CB50 cdecl 5-arg, add esp,28h.
 *   (cam+14h, &B8B800, 0x1000-t, t, &Battle_Camera_world_XZ_s16)
 *   (cam+1Ch, &B8B808, 0x1000-t, t, &Battle_Camera_LookAt_XZ_s16)
 * FOV: movsx 1D977A0, 66 8B 40 06 [cam+6], sub, imul t, sar 0Ch, add edx,eax, 66 store DX -> 1D8E038.
 * Snap: DWORD B8B800/04/08/0C -> Battle_Camera_*; WORD 1D977A0->1D8E038, 1D9771C->1D977A2, 1D9771E=0.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / GetRandomInt: absent.
 * No Hex-Rays. No domain::.
 */

extern unsigned int battle_to_update_flags_dword_1D96A9C; /* 0x1D96A9C DWORD */
extern int g_BattleCameraTaskListHead; /* 0x1D97768 */
extern unsigned int g_BattleCameraFlags; /* 0x1D97718 DWORD */
extern unsigned int dword_1D97704; /* 0x1D97704; bit 0x8000 = AH.80h */
extern unsigned short word_1D9771E; /* 0x1D9771E blend Q12 */
extern unsigned int cameraStructPointer; /* 0x1D97798 */
extern unsigned int battle_camera_world_xz_ecx; /* 0x1D97720 */
extern unsigned int battle_camera_world_y_edx; /* 0x1D97724 */
extern unsigned int Battle_Camera_world_XZ_s16; /* 0xB8B7F0 DWORD */
extern unsigned int Battle_Camera_world_Y; /* 0xB8B7F4 */
extern unsigned int Battle_Camera_LookAt_XZ_s16; /* 0xB8B7F8 */
extern unsigned int Battle_Camera_LookAt_Y; /* 0xB8B7FC */
extern unsigned int dword_1D981F0; /* 0x1D981F0 */
extern unsigned int dword_1D981F4; /* 0x1D981F4 */
extern unsigned int dword_B8B800; /* 0xB8B800 cache world XZ */
extern unsigned int dword_B8B804;
extern unsigned int dword_B8B808;
extern unsigned int dword_B8B80C;
extern unsigned short word_1D977A0; /* 0x1D977A0 */
extern unsigned short word_1D9771C; /* 0x1D9771C */
extern unsigned short word_1D977A2; /* 0x1D977A2 */
extern unsigned short word_1D8E038; /* 0x1D8E038 FOV */

int __cdecl BS_CameraSettingInit2(void);
int __cdecl BdLinkTask_Pump(int *list_head);
int __cdecl sub_4A7120(void);
int __cdecl Thunk_56CB50(int src, int cache, int w0, int t, int dst);

__int16 __cdecl updateBattleCamera(void)
{
    unsigned int flags;
    unsigned int cam;
    unsigned int w_xz;
    unsigned int w_y;
    unsigned int l_xz;
    unsigned int l_y;
    __int16 blend;
    int t;
    int orig;
    int delta;

    if ((battle_to_update_flags_dword_1D96A9C & 0x101) == 0)
        BS_CameraSettingInit2();

    BdLinkTask_Pump(&g_BattleCameraTaskListHead);

    flags = g_BattleCameraFlags;
    if ((unsigned short)flags != 0) {
        if ((dword_1D97704 & 0x8000) == 0) {
            if (sub_4A7120() == 1)
                goto snap;
            flags = g_BattleCameraFlags;
        }
    }

    blend = (__int16)word_1D9771E;
    if (blend == 0) {
        if ((flags & 0xFFFF & 0xFFFFDFFF) == 0)
            return 0;
        cam = cameraStructPointer;
        w_xz = *(unsigned int *)(cam + 0x14);
        w_y = *(unsigned int *)(cam + 0x18);
        battle_camera_world_xz_ecx = w_xz;
        battle_camera_world_y_edx = w_y;
        Battle_Camera_world_XZ_s16 = w_xz;
        l_xz = *(unsigned int *)(cam + 0x1C);
        Battle_Camera_world_Y = w_y;
        l_y = *(unsigned int *)(cam + 0x20);
        dword_1D981F0 = l_xz;
        dword_1D981F4 = l_y;
        Battle_Camera_LookAt_XZ_s16 = l_xz;
        Battle_Camera_LookAt_Y = l_y;
        return (__int16)cam;
    }

    if (blend >= 0x1000)
        goto snap;

    t = (int)(__int16)word_1D9771E;
    cam = cameraStructPointer;
    Thunk_56CB50(
        (int)(cam + 0x14),
        (int)&dword_B8B800,
        0x1000 - t,
        t,
        (int)&Battle_Camera_world_XZ_s16);
    t = (int)(__int16)word_1D9771E;
    cam = cameraStructPointer;
    Thunk_56CB50(
        (int)(cam + 0x1C),
        (int)&dword_B8B808,
        0x1000 - t,
        t,
        (int)&Battle_Camera_LookAt_XZ_s16);

    cam = cameraStructPointer;
    orig = (int)(__int16)*(unsigned short *)(cam + 6);
    delta = (int)(__int16)word_1D977A0 - orig;
    delta *= (int)(__int16)word_1D9771E;
    delta >>= 12;
    word_1D8E038 = (__int16)(orig + delta);
    return (__int16)orig;

snap:
    Battle_Camera_world_XZ_s16 = dword_B8B800;
    Battle_Camera_world_Y = dword_B8B804;
    Battle_Camera_LookAt_XZ_s16 = dword_B8B808;
    Battle_Camera_LookAt_Y = dword_B8B80C;
    word_1D8E038 = word_1D977A0;
    word_1D977A2 = word_1D9771C;
    word_1D9771E = 0;
    return (__int16)word_1D977A0;
}
```
