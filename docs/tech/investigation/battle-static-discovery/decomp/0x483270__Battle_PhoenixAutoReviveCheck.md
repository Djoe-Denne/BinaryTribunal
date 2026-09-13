# Battle_PhoenixAutoReviveCheck @ 0x483270

- Instr (live): 32
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=48
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=52
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=48
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Battle_PhoenixAutoReviveCheck(void)
- Notes parent: `CountAlive==0xFF` / jz fail (pas un compteur) ; scan party slots 0–2 stride `0xD0` (cursor `status_1` 0x1D27B90, borne 0x1D27E00 `jl`) ; occupancy BYTE `flag_data+0x7C` bit0 ; Petrify BYTE `status_1` bit2 CLEAR → Phoenix (Death non testé) ; `test BYTE SG,4` bit2 / jz ; WORD `COMBAT_SCENE_ID==0x13D` (66) / jz ; `isRandomProbaNumDen255(64,255)` `add esp,8` ; BYTE `RELATED=1` ; `EnqueueSpecialAction(FindFirstAliveParty, 7, 0)` `add esp,0Ch` ; EAX 0/1. F_CHAR 0x1D0 absent.

## C réconcilié

```c
/* Battle_PhoenixAutoReviveCheck @ 0x483270
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 32 instr, size 0x71. IDA type int __cdecl() — EAX 0 fail / 1 queued.
 */

typedef struct FF8BattleExecQueueCell FF8BattleExecQueueCell;

extern unsigned char SG_ODIN_ANGEL_GILGA_FLAG; /* 0x1CFE97A BYTE ; test imm 4 */
extern unsigned char RELATED_ODIN_SUMMONED;   /* 0x1D28E14 BYTE ; C6 05 ... 01 */
extern unsigned short COMBAT_SCENE_ID;        /* 0x1CFF6E0 WORD ; 66-prefix cmp */

extern int EnemyAI_CountAliveMonsters(void); /* no args ; EAX first live monster slot 3..6 or 0xFF */
extern int __cdecl isRandomProbaNumDen255(int numerator, int denominator); /* add esp, 8 */
extern int Battle_FindFirstAlivePartySlot(void); /* no args */
extern FF8BattleExecQueueCell *__cdecl Battle_EnqueueSpecialAction(int slot, short special_id, int group); /* add esp, 0Ch */

int __cdecl Battle_PhoenixAutoReviveCheck(void)
{
    unsigned char *p; /* EAX cursor: slot+0x80 status_1 */
    int slot;

    /* call CountAlive ; cmp eax, 0FFh ; jz loc_483298
     * 0xFF = no monster with (status_1 & 5)==0 (Death|Petrify both clear). */
    if (EnemyAI_CountAliveMonsters() == 0xFF)
        return 0;

    /* mov eax, 1D27B90h
     * loc_483281: test byte [eax-4], 1 ; jz loc_48328C
     *             test byte [eax], 4 ; jz loc_48329B
     * loc_48328C: add eax, 0D0h ; cmp eax, 1D27E00h ; jl loc_483281
     * slots 0,1,2 (party). 0x1D27B90=slot0+0x80 ; bound slot3+0x80.
     * [eax-4] = slot+0x7C flag_data low BYTE bit0 occupancy.
     * [eax] = status_1 BYTE bit2 Petrify (4). Death (1) not tested here.
     * F_CHAR 0x1D0 not used. */
    p = (unsigned char *)0x1D27B90;
    while ((int)p < (int)0x1D27E00) {
        if ((p[-4] & 1) != 0) {
            if ((p[0] & 4) == 0)
                goto loc_48329B;
        }
        p += 0xD0;
    }

    /* loc_483298: xor eax, eax ; retn */
    return 0;

loc_48329B:
    /* f6 05 ... 04 / jz loc_483298 — BYTE bit2 (value 4), not "bit 4" */
    if ((SG_ODIN_ANGEL_GILGA_FLAG & 4) == 0)
        return 0;

    /* 66 81 3D ... 3D 01 — WORD COMBAT_SCENE_ID == 317 (0x13D) */
    if (COMBAT_SCENE_ID == 0x13D)
        return 0;

    /* push 0FFh ; push 40h ; call ; add esp, 8 ; test eax, eax ; jz loc_483298 */
    if (isRandomProbaNumDen255(0x40, 0xFF) == 0)
        return 0;

    /* push 0 (group) ; push 7 (special_id) ; BYTE RELATED=1 ; FindFirst ; push eax (slot) */
    RELATED_ODIN_SUMMONED = 1;
    slot = Battle_FindFirstAlivePartySlot();
    Battle_EnqueueSpecialAction(slot, 7, 0);
    return 1;
}
```
