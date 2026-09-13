# BattleAction_LockActionLatch @ 0x4876D0

- Instr (live): 5
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=10
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=10
- A==B: oui
- Push IDB: oui
- SetType: char BattleAction_LockActionLatch(void)
- Notes parent: 3 stores BYTE (C6 r/m8 + 2× A2 moffs8). Pas de préfixe 66. Hosts DWORD `ATTACKER_SLOT_ID_0` / `TARGET_SLOT_ID`, overlay +1. AL leftover = 1. GLM A/B `[1]` rejeté (stride DWORD). Pas de Hex-Rays.

## C réconcilié

```c
/* BattleAction_LockActionLatch @ 0x4876D0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 5 instr, size 0x14. IDA type char(). No callees, no add esp. No domain::.
 * Stores: C6 r/m8 (flag=0), then B0 01 / A2 moffs8 / A2 moffs8. No 66 prefix.
 */

extern unsigned char  AI_BATTLE_ACTIVE_FLAG; /* 0x1D280C2 BYTE C6 */
extern unsigned int    ATTACKER_SLOT_ID_0;   /* 0x1D28DF8 DWORD; BYTE at +1 */
extern unsigned int    TARGET_SLOT_ID;      /* 0x1D28DFC DWORD; BYTE at +1 */

char BattleAction_LockActionLatch(void)
{
    /* c6 05 c2 80 d2 01 00 */
    AI_BATTLE_ACTIVE_FLAG = 0;

    /* b0 01 ; a2 f9 8d d2 01 ; a2 fd 8d d2 01 */
    *((unsigned char *)&ATTACKER_SLOT_ID_0 + 1) = 1;
    *((unsigned char *)&TARGET_SLOT_ID + 1) = 1;

    /* leftover AL = 1 */
    return 1;
}
```
