# BattleAction_TickScript_IfByte4lt10 @ 0x509C80

- Instr (live): 30
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=47 (effort_used=high)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=33 (effort_used=high)
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=76 (effort_used=high)
- A==B: non
- Push IDB: oui
- SetType: void __cdecl BattleAction_TickScript_IfByte4lt10(int actor)
- Notes parent: jnb UNSIGNED [actor+4]>=0x10 skip. ClassFromScriptBits add esp,4; pair=DWORD [actor+74h]. pair[3]!=0 → sbb-dl idiom BYTE [pair+3]=(pair[0]!=cls)?(BYTE)cls:0. pair[3]==0 → cmp 32-bit zero-ext pair[0] vs EAX, else sub_505CB0(actor,cls) add esp,8. Occupancy 1+2 / bone 0x30 / 0xD0 absents. 505CB0 opaque.

## C réconcilié

```c
/* BattleAction_TickScript_IfByte4lt10 @ 0x509C80
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes. 30 instr, size 0x43.
 * cdecl; 1 arg; no ebp; saves esi; retn C3. IDA type void (EAX leftover unused).
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / bone stride 0x30 absent.
 */

int __cdecl BattleAction_ClassFromScriptBits(int actor); /* 0x509c10; add esp,4 */
void __cdecl sub_505CB0(int actor, int class_id);       /* 0x505cb0; add esp,8; opaque */

void __cdecl BattleAction_TickScript_IfByte4lt10(int actor)
{
    unsigned char *pair;
    int cls;

    /* 807E0410 7336: jnb = unsigned CF=0, not jg */
    if (*(unsigned char *)(actor + 4) >= 0x10u)
        return;

    cls = BattleAction_ClassFromScriptBits(actor); /* 56 E8; 83C404 */
    pair = *(unsigned char **)(actor + 0x74);       /* 8B4E74 DWORD; no null check */

    if (pair[3] != 0) /* 8A5103 84D2 7411 TEST DL,DL jz loc_509CAF */
    {
        /* 33D2 8A11 2BD0 F7DA 1AD2 23D0 885103
         * EDX = BYTE pair[0] zero-ext; sub/neg/sbb-dl/and EAX; store BYTE [pair+3].
         * NEG CF=0 iff pair[0]==cls. Net: (pair[0] != cls) ? (BYTE)cls : 0. */
        pair[3] = ((unsigned int)pair[0] != (unsigned int)cls)
            ? (unsigned char)cls
            : 0;
        return; /* 5E before the idiom in ASM; retn 0x509CAE, no second pop */
    }

    /* loc_509CAF: pair[3]==0 */
    if ((unsigned int)pair[0] == (unsigned int)cls) /* 33D2 8A11 3BD0 740A */
        return; /* loc_509CC1 pop esi; retn */

    sub_505CB0(actor, cls); /* 50 56 E8; cdecl (actor, class); 83C408 */
}
```
