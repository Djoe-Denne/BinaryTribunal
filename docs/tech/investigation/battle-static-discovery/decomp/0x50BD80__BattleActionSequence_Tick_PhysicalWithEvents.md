# BattleActionSequence_Tick_PhysicalWithEvents @ 0x50BD80

- Instr (live): 27
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=6
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleActionSequence_Tick_PhysicalWithEvents(int)
- Notes parent: cascade sub eax,0 / dec, pas de jpt. ja/jg absents. Phase0: sub_50AE20 jnz return 0 sinon inc BYTE [esi+0Dh] fallthrough loc_50BDAA. Phase1: ApplyEventGroup0, BYTE [edi+1]=FF, return 2 (phase non incremente). Unknown: EAX leftover phase-1, pas de xor. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. Pas de Hex-Rays.

## C réconcilié

```c
/* BattleActionSequence_Tick_PhysicalWithEvents @ 0x50BD80
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 27 instr, size 0x3B, end 0x50BDBB. cdecl, 1 arg. Saved ESI+EDI. retn C3.
 * BYTE [node+0Dh] phase, DWORD [node+10h] task. Cascade sub eax,0 / dec (no jpt).
 * Phase 0 fallthrough into loc_50BDAA after inc. Phase !=0 && !=1: leftover EAX = phase-1, no xor.
 * BYTE [edi+1]=0xFF. No add esp in this body.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No ja/jg. No setcc. No 66 prefix. No domain::.
 */

int sub_50AE20(void); /* 0x50AE20; 0 args */
int __cdecl BattleAction_ApplyEventGroup0(void); /* 0x50A670; 0 stack args here */

int __cdecl BattleActionSequence_Tick_PhysicalWithEvents(int node)
{
    unsigned char *esi;
    unsigned char *edi;
    unsigned int eax;

    esi = (unsigned char *)node;
    eax = 0;
    edi = *(unsigned char **)(esi + 0x10);
    eax = esi[0x0D]; /* 33 C0; 8A 46 0D */

    if (eax == 0) /* 83 E8 00 / 74 jz loc_50BD99 */
        goto loc_50BD99;
    eax -= 1; /* 48 */
    if (eax == 0) /* 74 jz loc_50BDAA */
        goto loc_50BDAA;
    return (int)eax; /* leftover phase-1; 5F 5E C3; no xor */

loc_50BD99: /* phase == 0 */
    if (sub_50AE20() != 0) /* 85 C0 / 74 jz loc_50BDA7; else 5F 33 C0 5E C3 */
        return 0;
    ++esi[0x0D]; /* FE 46 0D loc_50BDA7; fall through loc_50BDAA */

loc_50BDAA: /* phase == 1, or fallthrough from phase 0 */
    BattleAction_ApplyEventGroup0();
    edi[1] = 0xFF; /* C6 47 01 FF */
    return 2; /* B8 02; phase not incremented on phase-1 entry */
}
```
