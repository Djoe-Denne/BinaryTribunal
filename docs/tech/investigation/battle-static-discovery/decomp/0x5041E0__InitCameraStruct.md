# InitCameraStruct @ 0x5041E0

- Instr (live): 29
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=16
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=62
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=15
- A==B: non
- Push IDB: oui
- SetType: int InitCameraStruct(void)
- Notes parent: BS_Memset(head, unk_1D97738, 0x10, 2) add esp 10h. Pool do-while BYTE[eax]=FF, add 524h, jl signé vs offset dword_1D981F0 (2 records). WORD 1E=1000h. BYTE2 flags+2=1 puis WORD flags+0=0 (pas dword). A3 DWORD id/2C/30/34/ptr. 66 WORD mask/pan/A2. A2 BYTE AAA/B95. xor eax,eax ret 0. Occupancy 1+2 absente.

## C réconcilié

```c
/* InitCameraStruct @ 0x5041E0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 29 instr, size 0x89, end 0x504269. IDA type int(). cdecl, no args.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 unused. GetRandomInt absent.
 * One SIGNED jl (7C) vs offset dword_1D981F0 after add eax,524h. No ja/jg/setcc/jpt.
 * add esp,10h after BS_Memset (4 dwords). Return xor eax,eax then retn.
 * BYTE2 C6 at g_BattleCameraFlags+2 then WORD 66 A3 at +0 (not one dword).
 * No Hex-Rays. No domain::.
 */

void BS_NULLCameraSettingPointer(void);
int __cdecl BS_Memset(int, unsigned short *, unsigned int, int);

extern unsigned char cameraStruct[];        /* 0x1D977A8 ; two records stride 0x524 */
extern int dword_1D981F0;                   /* 0x1D981F0 ; bound = offset, not value */
extern unsigned short word_1D9771E;         /* 0x1D9771E WORD 66 C7 */
extern int CameraID_Maybe;                  /* 0x1D97728 DWORD A3 */
extern unsigned char g_BattleCameraFlags[]; /* 0x1D97718 */
extern int dword_1D9772C;                   /* 0x1D9772C DWORD A3 */
extern int dword_1D97730;                   /* 0x1D97730 */
extern int dword_1D97734;                   /* 0x1D97734 */
extern int cameraStructPointer;             /* 0x1D97798 DWORD A3 */
extern unsigned short mask;                 /* 0x1D99A9C WORD 66 A3 */
extern unsigned char byte_1D99AAA;          /* 0x1D99AAA BYTE A2 */
extern unsigned char byte_1D99B95;          /* 0x1D99B95 BYTE A2 */
extern unsigned short word_1D97714;         /* 0x1D97714 WORD 66 A3 */
extern unsigned short word_1D97712;         /* 0x1D97712 */
extern unsigned short word_1D97710;         /* 0x1D97710 */
extern unsigned short word_1D977A2;         /* 0x1D977A2 */
extern int g_BattleCameraTaskListHead;      /* 0x1D97768 */
extern unsigned short unk_1D97738[];        /* 0x1D97738 node arena */

int InitCameraStruct(void)
{
    unsigned char *p;

    BS_NULLCameraSettingPointer();
    BS_Memset((int)&g_BattleCameraTaskListHead, unk_1D97738, 0x10u, 2);

    p = cameraStruct;
    do {
        *p = 0xFFu;
        p += 0x524;
    } while ((int)p < (int)&dword_1D981F0);

    word_1D9771E = 0x1000;
    CameraID_Maybe = 0;
    g_BattleCameraFlags[2] = 1;
    dword_1D9772C = 0;
    dword_1D97730 = 0;
    dword_1D97734 = 0;
    *(unsigned short *)g_BattleCameraFlags = 0;
    cameraStructPointer = 0;
    mask = 0;
    byte_1D99AAA = 0;
    byte_1D99B95 = 0;
    word_1D97714 = 0;
    word_1D97712 = 0;
    word_1D97710 = 0;
    word_1D977A2 = 0;
    return 0;
}
```
