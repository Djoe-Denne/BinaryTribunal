# Odin_BattleInit_ZantetsukenCheck @ 0x482E00

- Instr (live): 25
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=26
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=87
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=85
- A==B: non
- Push IDB: oui
- SetType: void Odin_BattleInit_ZantetsukenCheck(void)
- Notes parent: `test BYTE SG,2` / jz ; scan slots 3–6 stride `0xD0` (cursor slot+0xA8, borne `byte_1D28168`) ; occupancy `status_1` bit0 SET skip (`test [eax-28h],1` / jnz) ; BYTE `[+0xA8] >= 0xC8` unsigned `jnb` abort ; `isRandomProbaNumDen255(32,255)` `add esp,8` (pas GetRandomInt) ; BYTE `RELATED_ODIN_SUMMONED=0` ; `EnqueueSpecialAction(FindFirstAliveParty, 7, 0)` `add esp,0Ch` ; `retn` void.

## C réconcilié

```c
/* Odin_BattleInit_ZantetsukenCheck @ 0x482E00
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 25 instr, size 0x53. IDA type void() — no EAX write before retn.
 */

typedef struct FF8BattleExecQueueCell FF8BattleExecQueueCell;

extern unsigned char SG_ODIN_ANGEL_GILGA_FLAG; /* 0x1CFE97A BYTE ; test imm 2 */
extern unsigned char RELATED_ODIN_SUMMONED;   /* 0x1D28E14 BYTE ; C6 05 */

extern int __cdecl isRandomProbaNumDen255(int numerator, int denominator); /* add esp, 8 */
extern int Battle_FindFirstAlivePartySlot(void); /* no args */
extern FF8BattleExecQueueCell *__cdecl Battle_EnqueueSpecialAction(int slot, short special_id, int group); /* add esp, 0Ch */

void Odin_BattleInit_ZantetsukenCheck(void)
{
    unsigned char *p; /* EAX cursor: slot+0xA8 */
    int slot;

    /* f6 05 ... 02 / jz locret — BYTE bit1 (value 2) */
    if ((SG_ODIN_ANGEL_GILGA_FLAG & 2) == 0)
        return;

    /* mov eax, 1D27E28h ; mov cl, 1
     * loc_482E10: test [eax-28h], cl ; jnz loc_482E1A
     *             cmp byte ptr [eax], 0C8h ; jnb locret
     * loc_482E1A: add eax, 0D0h ; cmp eax, byte_1D28168 ; jl loc_482E10
     * slots 3,4,5,6 (enemy groups 1+2). 0x1D27E28=slot3+0xA8 ; bound slot7+0xA8.
     * [eax-0x28] = slot+0x80 status_1 low BYTE bit0 STATUS1_DEATH (not flag_data +0x7C).
     * [eax] = BYTE at +0xA8 (not level +0xBC). GetRandomInt not present (no AL). */
    p = (unsigned char *)0x1D27E28;
    while ((int)p < (int)0x1D28168) {
        if ((p[-0x28] & 1) == 0) {
            if (*p >= 0xC8u)
                return;
        }
        p += 0xD0;
    }

    /* push 0FFh ; push 20h ; call ; add esp, 8 ; test eax, eax ; jz locret */
    if (isRandomProbaNumDen255(0x20, 0xFF) == 0)
        return;

    /* push 0 (group) ; push 7 (special_id) ; BYTE RELATED=0 ; FindFirst ; push eax (slot) */
    RELATED_ODIN_SUMMONED = 0;
    slot = Battle_FindFirstAlivePartySlot();
    Battle_EnqueueSpecialAction(slot, 7, 0);
}
```
