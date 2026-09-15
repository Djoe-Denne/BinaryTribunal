# Gpu_PackDrawEnvPacket @ 0x45C0F0

- Instr (live): 109
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=3437 (retry high/65536 after auto length+empty)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=5756
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=2646
- A==B: non
- Push IDB: oui
- SetType: __int16 *__cdecl Gpu_PackDrawEnvPacket(unsigned int *packet, __int16 *env)
- Notes parent: Tag 8/5 BYTE +18 isbg. GP0 E3 E4 E5 E1 E2 + fill 02. sar E2 mask_x. clip.w 66 unsigned. Pas tag 07/code 24. Pas occupancy. EAX=env.

## C réconcilié

```c
/* Gpu_PackDrawEnvPacket @ 0x45C0F0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 109 instr, size 0x158, end 0x45C248. cdecl, 2 args, retn C3. No EBP frame.
 * EAX = env from entry to ret. Callees none. Occupancy / +44h GF Exists / tag 07 / code 24: absent.
 * OT len 8 (isbg) or 5. GP0 E3, E4, E5, E1, E2, optional fill code 02.
 * Superset of Gpu_PackClipRectPacket @ 0x45C940. Not 0x45C9B0 / 0x45CA50.
 */

__int16 *__cdecl Gpu_PackDrawEnvPacket(unsigned int *packet, __int16 *env)
{
    unsigned char *eb = (unsigned char *)env;
    unsigned char isbg;
    int clip_x;
    int clip_y;
    int clip_h;
    unsigned int clip_w;
    unsigned int ecx;
    unsigned int edx;
    unsigned char *tw;

    isbg = eb[0x18];

    if (isbg)
        packet[0] = (packet[0] & 0x00FFFFFFu) | 0x08000000u;
    else
        packet[0] = (packet[0] & 0x00FFFFFFu) | 0x05000000u;

    clip_y = (short)env[1];
    clip_x = (short)env[0];
    ecx = ((unsigned int)clip_y & 0x1FFu) | 0xFFF8C000u;
    ecx <<= 10;
    ecx |= (unsigned int)clip_x & 0x3FFu;
    packet[1] = ecx;

    clip_h = (short)env[3];
    ecx = (unsigned int)(clip_h + clip_y - 1);
    ecx <<= 10;
    clip_w = (unsigned short)env[2];
    edx = clip_w + (unsigned int)clip_x - 1u;
    ecx &= 0x7FC00u;
    edx &= 0x3FFu;
    ecx |= edx;
    ecx |= 0xE4000000u;
    packet[2] = ecx;

    edx = (unsigned int)(unsigned short)env[4] & 0x7FFu;
    ecx = (unsigned int)(unsigned short)env[5] & 0x7FFu;
    ecx |= 0xFFFCA000u;
    ecx <<= 11;
    ecx |= edx;
    packet[3] = ecx;

    ecx = (unsigned int)(unsigned short)env[10] & 0x9FFu;
    if (eb[0x17])
        ecx |= 0x400u;
    if (eb[0x16])
        ecx |= 0x200u;
    ecx |= 0xE1000000u;
    packet[4] = ecx;

    tw = eb + 0x0C;
    if (tw == 0)
    {
        ecx = 0;
    }
    else
    {
        unsigned int tw_x;
        unsigned int tw_y;
        int tw_h;
        int tw_w;
        int mask;

        tw_y = eb[0x0E];
        tw_x = tw[0];
        ecx = (tw_y & 0xF8u) | 0xFFFE2000u;
        ecx <<= 5;
        ecx |= tw_x & 0xF8u;
        tw_h = (unsigned short)env[9];
        ecx <<= 5;
        mask = ~(tw_h - 1);
        ecx |= (unsigned int)mask & 0xF8u;
        tw_w = (unsigned short)env[8];
        ecx <<= 2;
        mask = ~(tw_w - 1);
        mask >>= 3;
        ecx |= (unsigned int)mask & 0x1Fu;
    }
    packet[5] = ecx;

    if (isbg)
    {
        ecx = eb[0x1B];
        edx = eb[0x1A];
        ecx |= 0x200u;
        ecx <<= 8;
        ecx |= edx;
        edx = eb[0x19];
        ecx <<= 8;
        ecx |= edx;
        edx = *(unsigned int *)(eb + 4);
        packet[6] = ecx;
        packet[7] = *(unsigned int *)eb;
        packet[8] = edx;
    }

    return env;
}
```
