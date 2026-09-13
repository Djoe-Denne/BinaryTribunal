# MagFx_IndexPackedNodeTree @ 0x6DA980

- Instr (live): 64
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=10
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=9
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=10
- A==B: non
- Push IDB: oui
- SetType: _DWORD *__cdecl MagFx_IndexPackedNodeTree(int level, _DWORD *packed, _DWORD *outCount)
- Notes parent: packed[0] offset octet self-relatif. Strides LEA 12/12/20/24/20/24/28. Success EAX=cursor après le DWORD count (même si outCount NULL). Fail level hors 0..7: *outCount=0, EAX=0. Occupancy/0xD0/0x1D0/0x44 absents. Stores DWORD.

## C réconcilié

```c
/* MagFx_IndexPackedNodeTree @ 0x6DA980
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 64 instr, size 0xAA, end 0x6DAA2A. IDA type _DWORD *__cdecl(int, _DWORD *, _DWORD *).
 * No callees. Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: unused.
 * No Hex-Rays. No domain::.
 *
 * packed[0] is a BYTE offset from packed itself to the root header.
 * Each level: DWORD count, then EAX += 4. If level matches, success.
 * Else skip count * stride bytes (LEA): 12,12,20,24,20,24,28 then next header.
 * Success loc_6DAA0E: optional DWORD *outCount = count; EAX = cursor past count.
 * Fail loc_6DAA19 (level not exactly 0..7): optional DWORD *outCount = 0; EAX = 0.
 * locret_6DAA29: NULL outCount on success still returns EAX cursor (no xor).
 */

_DWORD *__cdecl MagFx_IndexPackedNodeTree(int level, _DWORD *packed, _DWORD *outCount)
{
    unsigned char *cursor;
    unsigned int count;

    cursor = (unsigned char *)packed + packed[0];

    count = *(_DWORD *)cursor;
    cursor += 4;
    if (level == 0)
        goto loc_6DAA0E;

    cursor += count * 12; /* lea ecx,[ecx+ecx*2]; lea eax,[eax+ecx*4] */
    count = *(_DWORD *)cursor;
    cursor += 4;
    if (level == 1)
        goto loc_6DAA0E;

    cursor += count * 12;
    count = *(_DWORD *)cursor;
    cursor += 4;
    if (level == 2)
        goto loc_6DAA0E;

    cursor += count * 20; /* lea ecx,[ecx+ecx*4]; lea eax,[eax+ecx*4] */
    count = *(_DWORD *)cursor;
    cursor += 4;
    if (level == 3)
        goto loc_6DAA0E;

    cursor += count * 24; /* lea ecx,[ecx+ecx*2]; lea eax,[eax+ecx*8] */
    count = *(_DWORD *)cursor;
    cursor += 4;
    if (level == 4)
        goto loc_6DAA0E;

    cursor += count * 20;
    count = *(_DWORD *)cursor;
    cursor += 4;
    if (level == 5)
        goto loc_6DAA0E;

    cursor += count * 24;
    count = *(_DWORD *)cursor;
    cursor += 4;
    if (level == 6)
        goto loc_6DAA0E;

    cursor += count * 28; /* esi=ecx*8-ecx=ecx*7; [eax+esi*4]; eax+=esi*4+4 */
    count = *(_DWORD *)cursor;
    cursor += 4;
    if (level != 7)
        goto loc_6DAA19;

loc_6DAA0E:
    if (outCount)
        *outCount = count;
    return (_DWORD *)cursor;

loc_6DAA19:
    if (outCount)
        *outCount = 0;
    return 0;
}
```
