# Gilgamesh_BattleInit_TriggerCheck @ 0x4831F0

- Instr (live): 35
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=45
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=57
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=63
- A==B: non
- Push IDB: oui
- SetType: void Gilgamesh_BattleInit_TriggerCheck(void)
- Notes parent: `test BYTE SG,8` / jz loc_48325F ; `isRandomProbaNumDen255(8,255)` `add esp,8` ; `Battle_GetRandomInt` AL puis `and eax,0FFh` ; quartile `jge`/`setnl` → RELATED BYTE 7..10 (`add al,7`) ; `EnqueueSpecialAction(FindFirstAliveParty, 7, 0)` `add esp,0Ch` ; BYTE `GILGAMESH_TRIGGERED_FLAG` 1 succès / 0 no-own ou roll fail ; **pas** de scan slot 0xD0.

## C réconcilié

```c
/* Gilgamesh_BattleInit_TriggerCheck @ 0x4831F0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 35 instr, size 0x77. IDA type void() — no EAX write before retn.
 */

typedef struct FF8BattleExecQueueCell FF8BattleExecQueueCell;

extern unsigned char SG_ODIN_ANGEL_GILGA_FLAG; /* 0x1CFE97A BYTE ; test imm 8 */
extern unsigned char RELATED_ODIN_SUMMONED;   /* 0x1D28E14 BYTE ; A2 store AL */
extern unsigned char GILGAMESH_TRIGGERED_FLAG; /* 0x1D28E1D BYTE ; C6 05 */

extern int __cdecl isRandomProbaNumDen255(int numerator, int denominator); /* add esp, 8 */
extern unsigned char Battle_GetRandomInt(void); /* AL only */
extern int Battle_FindFirstAlivePartySlot(void); /* no args */
extern FF8BattleExecQueueCell *__cdecl Battle_EnqueueSpecialAction(int slot, short special_id, int group); /* add esp, 0Ch */

void Gilgamesh_BattleInit_TriggerCheck(void)
{
    int ecx;
    int eax;
    int slot;

    /* f6 05 ... 08 / jz loc_48325F — BYTE bit3 (value 8) */
    if ((SG_ODIN_ANGEL_GILGA_FLAG & 8) == 0)
        goto loc_48325F;

    /* push 0FFh ; push 8 ; call ; add esp, 8 ; test eax, eax ; jz loc_48325F */
    if (isRandomProbaNumDen255(8, 0xFF) == 0)
        goto loc_48325F;

    /* call Battle_GetRandomInt (AL only) ; and eax, 0FFh ; mov ecx, eax */
    ecx = (int)Battle_GetRandomInt() & 0xFF;

    /* cmp ecx, 40h ; jge loc_483221 (signed; ecx 0..255 => same as unsigned) */
    if (ecx < 0x40) {
        eax = 0;
    } else if (ecx < 0x80) {
        /* loc_483221: cmp ecx, 80h ; jge loc_483230 */
        eax = 1;
    } else {
        /* loc_483230: xor eax, eax ; cmp ecx, 0C0h ; setnl al ; add eax, 2 */
        eax = 0;
        if (ecx >= 0xC0)
            eax = 1;
        eax += 2;
    }

    /* loc_48323E: add al, 7 (BYTE) ; push 0 ; push 7 ; mov RELATED, al */
    RELATED_ODIN_SUMMONED = (unsigned char)(eax + 7);

    /* call FindFirst ; push eax ; call Enqueue ; add esp, 0Ch */
    slot = Battle_FindFirstAlivePartySlot();
    Battle_EnqueueSpecialAction(slot, 7, 0);

    GILGAMESH_TRIGGERED_FLAG = 1;
    return;

loc_48325F:
    /* C6 05 ... 00 — no-own OR roll fail */
    GILGAMESH_TRIGGERED_FLAG = 0;
}
```
