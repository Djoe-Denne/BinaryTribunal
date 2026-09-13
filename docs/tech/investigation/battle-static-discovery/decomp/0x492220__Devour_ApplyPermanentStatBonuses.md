# Devour_ApplyPermanentStatBonuses @ 0x492220

- Instr (live): 54
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=6
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Devour_ApplyPermanentStatBonuses(int p_target_slot_id, int devour_result)
- Notes parent: K_DEVOUR stride 0xC (lea*3/shl2) @ 0x1CF8A54; flag BYTE +0xA bits 1..20h → increaseCharaStatBy1(slot,0..5); HP BYTE +0xB always sub_495F50; occupancy / slot 0xD0 / F_CHAR 0x1D0 / GetRandomInt absents; EAX leftover sub_495F50; pas de setcc; pas de ja/jg; pas de 66.

## C réconcilié

```c
/* Devour_ApplyPermanentStatBonuses @ 0x492220
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 54 instr, size 0x8D. End 0x4922AC. IDA type int __cdecl(int,int). No domain::.
 * K_DEVOUR stride 0xC (lea [eax+eax*2]; shl 2). Occupancy unused. Slot 0xD0 unused.
 * F_CHAR 0x1D0 unused. GetRandomInt unused.
 * BYTE: RaisedStatFlag +0xA, RaisedStatHPQuantity +0xB. No WORD / no 66.
 * Six TEST/JZ on BL; always call sub_495F50. No setcc. No ja/jg.
 * Return EAX leftover from sub_495F50.
 */

extern unsigned char K_DEVOUR[]; /* 0x1CF8A54, kernel devour rows, stride 0xC */

int __cdecl increaseCharaStatBy1(int p_target_slot_id, int a2); /* add esp 8 */
int __cdecl sub_495F50(int p_target_slot_id, int a2);           /* add esp 8 */

int __cdecl Devour_ApplyPermanentStatBonuses(int p_target_slot_id, int devour_result)
{
    unsigned char flag;     /* BL, loaded once, never reloaded */
    unsigned int rec;       /* ESI = devour_result * 12 */

    /* 492220 mov eax,[esp+devour_result]
     * 492227 lea esi,[eax+eax*2]; 49222e shl esi,2 */
    rec = (unsigned int)devour_result * 12u;

    /* 49222a mov edi,[esp+0Ch+p_target_slot_id] after push ebx/esi/edi */

    /* 492231 mov bl,[esi+0x1CF8A5E]  8A 9E 5E 8A CF 01 */
    flag = K_DEVOUR[rec + 0xA];

    /* 492237 test bl,1; jz loc_492247 */
    if (flag & 1)
        increaseCharaStatBy1(p_target_slot_id, 0);
    /* 492247 test bl,2; jz loc_492257 */
    if (flag & 2)
        increaseCharaStatBy1(p_target_slot_id, 1);
    /* 492257 test bl,4; jz loc_492267 */
    if (flag & 4)
        increaseCharaStatBy1(p_target_slot_id, 2);
    /* 492267 test bl,8; jz loc_492277 */
    if (flag & 8)
        increaseCharaStatBy1(p_target_slot_id, 3);
    /* 492277 test bl,10h; jz loc_492287 */
    if (flag & 0x10)
        increaseCharaStatBy1(p_target_slot_id, 4);
    /* 492287 test bl,20h; jz loc_492297 */
    if (flag & 0x20)
        increaseCharaStatBy1(p_target_slot_id, 5);

    /* loc_492297: xor eax,eax; mov al,[esi+0x1CF8A5F]  8A 86 5F 8A CF 01
     * always called, even if flag==0 and qty==0 */
    return sub_495F50(p_target_slot_id, (int)K_DEVOUR[rec + 0xB]);
}
```
