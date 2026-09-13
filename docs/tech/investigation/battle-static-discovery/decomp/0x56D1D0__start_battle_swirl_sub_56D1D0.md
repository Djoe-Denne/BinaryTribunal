# start_battle_swirl_sub_56D1D0 @ 0x56D1D0

- Instr (live): 41
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=246
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=490
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=534
- A==B: non
- Push IDB: non (tag glm-triple 2026-09-13 déjà présent ; SAVE True)
- SetType: int __cdecl start_battle_swirl_sub_56D1D0(int, int, int, int, int, int)
- Notes parent: ADE8==0 → Alloc, jnz ret EAX. Capture 4 args. BYTE color 0x55FFFFFF sur slot arg_C, ESI original. Submit 7 args. add esp,2Ch. Occupancy absente.

## C réconcilié

```c
/* start_battle_swirl_sub_56D1D0 @ 0x56D1D0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 41 instr, size 0x62, end 0x56D232. cdecl, 6 DWORD args. Saved EBX EBP ESI EDI. retn C3.
 * Callees: AllocCaptureResources @ 0x56D240 int() 0 args; CaptureFrame @ 0x56D390
 * void __cdecl(int,int,int,int); SubmitOverlayQuad @ 0x56D5F0 int __cdecl(int x7).
 * add esp,2Ch once = 16 leftover Capture + 28 Submit.
 * dword_209ADE8 @ 0x209ADE8 DWORD A1. Occupancy / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No domain:: / main:: / presentation::.
 */

extern int dword_209ADE8;
int BattleSwirl_AllocCaptureResources(void);
void __cdecl BattleSwirl_CaptureFrame(int, int, int, int);
int __cdecl BattleSwirl_SubmitOverlayQuad(int, int, int, int, int, int, int);

int __cdecl start_battle_swirl_sub_56D1D0(int arg_0, int arg_4, int arg_8, int arg_C, int arg_10, int arg_14)
{
    int orig_arg_C;
    int z;
    int expand;

    if (dword_209ADE8 == 0)
    {
        int alloc_eax = BattleSwirl_AllocCaptureResources();
        if (alloc_eax != 0)
            return alloc_eax;
    }

    orig_arg_C = arg_C; /* ESI: original arg_C survives BYTE stores into the stack slot */
    BattleSwirl_CaptureFrame(arg_0, arg_4, arg_8, orig_arg_C);

    z = arg_10; /* EDX snapshot before color stores */
    *((unsigned char *)&arg_C + 2) = 0xFF; /* 88 BYTE */
    *((unsigned char *)&arg_C + 1) = 0xFF;
    *((unsigned char *)&arg_C + 0) = 0xFF;
    expand = arg_14; /* EAX = arg_14, interleaved */
    *((unsigned char *)&arg_C + 3) = 0x55; /* C6 BYTE → DWORD LE 0x55FFFFFF */
    /* 8B reload ecx = arg_C after the four BYTE stores */

    return BattleSwirl_SubmitOverlayQuad(
        arg_0, arg_4, arg_8, orig_arg_C, z, arg_C, expand);
}
```
