# BattleUI_WriteGp0Codes_E1E5 @ 0x4A8C10

- Instr (live): 16
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=13
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=13
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=13
- A==B: non
- Push IDB: oui
- SetType: unsigned char *__cdecl BattleUI_WriteGp0Codes_E1E5(int, unsigned char *, int, int)
- Notes parent: 4 paquets stride 0xC. BYTE +7 = E1,E1,E5,E3 ; BYTE +0Bh = E2,E4 (paquets 1 et 3). DWORD +8 = 0 (paquets 0 et 2, 89 48 08). Caller unique add esp,10h (4 args) ; body lit seulement [esp+8]. EAX = pkt+0x30. Occupancy/GetRandomInt/slot/F_CHAR absents. DL=0xE1 une fois.

## C réconcilié

```c
/* BattleUI_WriteGp0Codes_E1E5 @ 0x4A8C10
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 16 instr, size 0x31, end 0x4A8C41. No domain::.
 * Unique caller BattleUI_RenderHud @ 0x4A8BFC: 4 pushes + add esp,10h.
 * Body reads only [esp+8] (pkt). unused0/8/C never loaded.
 * Occupancy 1+2 unused. GetRandomInt absent. Slot 0xD0 / F_CHAR 0x1D0 unused.
 * GP0 codes at packet+7 / +0Bh, stride 0xC. DWORD zeros via 89 48 08.
 * Return EAX = pkt + 0x30 (four add eax,0Ch, no mov eax before retn).
 */

unsigned char *__cdecl BattleUI_WriteGp0Codes_E1E5(int unused0, unsigned char *pkt, int unused8, int unusedC)
{
    unsigned char *eax;
    unsigned char dl;  /* B2 E1 once; reused for packets 0 and 1 */
    unsigned int ecx;  /* 33 C9 once; reused for both DWORD stores */

    eax = pkt;
    dl = 0xE1u;
    ecx = 0;

    /* Packet 0 @ pkt+0x00 */
    eax[7] = dl;                      /* 88 50 07 BYTE 0xE1 */
    *(unsigned int *)(eax + 8) = ecx; /* 89 48 08 DWORD 0 */
    eax += 0x0C;

    /* Packet 1 @ pkt+0x0C — +8 low 24 bits not written */
    eax[7] = dl;                      /* 88 50 07 BYTE 0xE1 (same DL) */
    eax[0x0B] = 0xE2u;               /* C6 40 0B E2 BYTE */
    eax += 0x0C;

    /* Packet 2 @ pkt+0x18 */
    eax[7] = 0xE5u;                  /* C6 40 07 E5 BYTE */
    *(unsigned int *)(eax + 8) = ecx; /* 89 48 08 DWORD 0 */
    eax += 0x0C;

    /* Packet 3 @ pkt+0x24 — +8 low 24 bits not written */
    eax[7] = 0xE3u;                  /* C6 40 07 E3 BYTE */
    eax[0x0B] = 0xE4u;               /* C6 40 0B E4 BYTE */
    eax += 0x0C;

    return eax; /* pkt + 0x30 */
}
```
