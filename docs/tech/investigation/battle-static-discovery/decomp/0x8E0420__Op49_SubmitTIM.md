# Op49_SubmitTIM @ 0x8E0420

- Instr (live): 29
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=24
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Op49_SubmitTIM(void)
- Notes parent: Busy BYTE yield sans IP+=2. WORD 66 [obj+0xC8]→[slot+0x3E], EAX=ptr pas deref. Index (opcode>>9)&0xF, pas stride TIM 0x10. sub_8E05D0 add esp 4. seqCtx+0xA3 avant test bit15 [slot+4Bh]. byte_1D96DC4=0 si bit15. BdTrans add esp 8. IP+=2 seulement chemin TIM. Occupancy 1+2 absente.

## C réconcilié

```c
/* Op49_SubmitTIM @ 0x8E0420
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 29 instr, size 0x6F, end 0x8E048F. cdecl, 0 args, retn C3. FLAGS 0x5400.
 * No saved regs, no sub esp.
 * add esp,4 after sub_8E05D0; add esp,8 after BdTransSummonStream.
 * Busy BYTE GF_IFRIT_ASSET_LOAD_BUSY (A0/84C0/754F): yield loc_8E0478, no IP+=2.
 * Yield: WORD 66 [obj+0xC8] -> [slot+0x3E]; EAX leftover = dword_27973E8 (pointer, not deref).
 * Else: WORD 66 [slot+0x4A] >>9 & 0xF -> sub_8E05D0; add seqCtx,0A3h; BYTE test [slot+4Bh],80h;
 *   if set C6 05 byte_1D96DC4=0; BdTransSummonStream(tim, seqCtx+0xA3); IP+=2; EAX leftover = IP.
 * Occupancy 1+2 / slot 0xD0 / actor 0x9C / F_CHAR 0x1D0 / GF+0x44 / K_GF 0x84 / TIM queue 0x10: absent.
 * Widths: BYTE busy, [slot+4Bh], byte_1D96DC4; WORD 66 opcode/yield; DWORD pointers/IP.
 * jnz/jz only. No setcc, no jpt, no ja/jg, no domain::.
 */

int __cdecl sub_8E05D0(int index);
int __cdecl BdTransSummonStream(_DWORD *tim, _BYTE *flag);

extern unsigned char GF_IFRIT_ASSET_LOAD_BUSY;
extern unsigned char *g_GfCinematic_RuntimeSlotPtr;
extern unsigned char *g_GfCinematic_SequenceCtxPtr;
extern unsigned int g_MagVm_IP;
extern unsigned char byte_1D96DC4;
extern unsigned char *dword_27973E8;

int __cdecl Op49_SubmitTIM(void)
{
    unsigned char *slot;
    unsigned int timIdx;
    int tim;
    _BYTE *flag;

    if (GF_IFRIT_ASSET_LOAD_BUSY) {
        slot = g_GfCinematic_RuntimeSlotPtr;
        *(unsigned short *)(slot + 0x3E) =
            *(unsigned short *)(dword_27973E8 + 0xC8);
        return (int)dword_27973E8;
    }

    slot = g_GfCinematic_RuntimeSlotPtr;
    timIdx = (*(unsigned short *)(slot + 0x4A) >> 9) & 0xF;
    tim = sub_8E05D0((int)timIdx);
    flag = g_GfCinematic_SequenceCtxPtr + 0xA3;
    if (slot[0x4B] & 0x80)
        byte_1D96DC4 = 0;
    BdTransSummonStream((_DWORD *)tim, flag);
    g_MagVm_IP += 2;
    return (int)g_MagVm_IP;
}
```
