# BattleAction_ClassFromScriptBits @ 0x509C10

- Instr (live): 34
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0 (effort_used=high)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0 (effort_used=high)
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0 (effort_used=high)
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleAction_ClassFromScriptBits(int actor)
- Notes parent: Occupancy 1+2 ABSENTE. jnb unsigned [actor+4]>=0x10 → BYTE [[actor+74h]+2] zero-extend, pas de null check. Sinon DWORD [actor+8] first-match: CL&2→3, CH&10h→2, 0x01000000→10h, 0x00800000→13h, 0x00200000→1Dh, 0x41021→2, défaut 1. Masques IDA (VIT_0_STATUS_MASK) ignorés. 0 callee. Pas 66 / 0xD0 / 0x9C. Caller OR AH,10h hors fonction.

## C réconcilié

```c
/* BattleAction_ClassFromScriptBits @ 0x509C10
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes. 34 instr, size 0x6b.
 * cdecl; 1 arg; no saved regs; retn C3. 0 callees.
 * EAX = action class / animId (callers feed BattlePresentation_StartActorAnimation).
 * Occupancy 1+2 ABSENT (no AND 0xFC / OR 1|2 on [actor+6Dh]).
 * Slot 0xD0 / stride 0x9C / F_CHAR 0x1D0 / GF Exists 0x44 absent from THIS listing.
 * No 66 prefix. TEST imm32 from live bytes (IDA VIT_0_STATUS_MASK names ignored).
 */

int __cdecl BattleAction_ClassFromScriptBits(int actor)
{
    unsigned int bits;
    unsigned char *pair;

    if (*(unsigned char *)(actor + 4) >= 0x10u) { /* 80 79 04 10; 73 jnb unsigned */
        pair = *(unsigned char **)(actor + 0x74); /* 8B 41 74; no null check */
        return pair[2]; /* 33 C9; 8A 48 02; 8B C1 zero-extend BYTE */
    }

    bits = *(unsigned int *)(actor + 8); /* 8B 49 08; EAX default 1 then first TEST wins */
    if (bits & 0x02u) /* F6 C1 02 */
        return 3;
    if (bits & 0x1000u) /* F6 C5 10 = CH bit4 */
        return 2;
    if (bits & 0x01000000u) /* F7 C1 00 00 00 01 */
        return 0x10;
    if (bits & 0x00800000u) /* F7 C1 00 00 80 00 */
        return 0x13;
    if (bits & 0x00200000u) /* F7 C1 00 00 20 00 */
        return 0x1D;
    if (bits & 0x00041021u) /* F7 C1 21 10 04 00 */
        return 2;
    return 1; /* jz locret_509C7A; EAX already 1 */
}
```
