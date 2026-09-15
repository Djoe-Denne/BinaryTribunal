# Gte_LZCS @ 0x45DCA0

- Instr (live): 23
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=30
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=30
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=9
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Gte_LZCS(int)
- Notes parent: TEST bit31 + jz zeros / else ones. jge (7D) signé vs 32, pas ja. SHL+inc puis TEST; stores DWORD 1CA8A88=src et 1CA8A8C=count; EAX=count. Occupancy 1+2 / TEST AL,2 / +44h / 0xD0 / 0x1D0 / OT 07/24 absents.

## C réconcilié

```c
/* Gte_LZCS @ 0x45DCA0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 23 instr, size 0x48, end 0x45DCE8. cdecl, 1 arg, retn C3, no EBP.
 * TEST edx,80000000h / jz (74) -> leading-zero loop. Else leading-one loop.
 * cmp eax,20h / jge (7D) SIGNED >= 32, not unsigned jae. EAX starts 0 (33 C0).
 * shl ecx,1 + inc eax then TEST bit31; ones: jnz (75) continue; zeros: jz (74) continue.
 * DWORD 89 15 -> dword_1CA8A88 = edx (src). A3 -> dword_1CA8A8C = eax (count). Two identical tails.
 * Return EAX = count 0..32. No callees, no add esp, no 66, no setcc, no jump table.
 * TEST AL,2 / occupancy 1+2 / +44h / 0xD0 / 0x1D0 / OT tag 07 / code 24: ABSENT.
 */

extern unsigned int dword_1CA8A88; /* 0x1CA8A88, GteState +0x78 */
extern int dword_1CA8A8C;           /* 0x1CA8A8C, GteState +0x7C */

int __cdecl Gte_LZCS(int arg_0)
{
    unsigned int src;
    int count;
    unsigned int cur;

    src = (unsigned int)arg_0;
    count = 0;
    cur = src;

    if ((src & 0x80000000u) == 0u) {
        while (count < 32) {
            cur <<= 1;
            count++;
            if ((cur & 0x80000000u) != 0u)
                break;
        }
    } else {
        while (count < 32) {
            cur <<= 1;
            count++;
            if ((cur & 0x80000000u) == 0u)
                break;
        }
    }

    dword_1CA8A88 = src;
    dword_1CA8A8C = count;
    return count;
}
```
