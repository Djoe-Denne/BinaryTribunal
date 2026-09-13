# Op33_SeqPtrBind @ 0x8E4EE0

- Instr (live): 63
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=10
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Op33_SeqPtrBind()
- Notes parent: Opcode 33 SeqPtrBind. WORD [slot+0x4A] bit15 -> Magic_b_01+[+0x1C] sinon dword_1D99A88. bits 12-14: 1=+0B8h, 2=+0D4h/+0DCh(*128 movsx[IP+6])/+0D8h(imul signed [slot+41h]), else +74h copie +70h. IP+=8. EAX=new IP. jz only. Occupancy/0xD0/0x1D0/0x44/0x84/0x9C absents.

## C réconcilié

```c
/* Op33_SeqPtrBind @ 0x8E4EE0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 63 instr, size 0xDE, end 0x8E4FBE. IDA type int(); cdecl retn C3 (three sites).
 * No args. No callees. No add esp. Scratch push/pop esi only on .01 base path.
 * Packet 8 bytes at g_MagVm_IP; IP+=8 every path. EAX return = new IP.
 * Offset: xor-extend WORD [IP+4]<<16 | WORD [IP+2] (66 reads). LE dword at IP+2.
 * Opcode WORD 66 at [RuntimeSlotPtr+0x4A]. test ch,80h = bit15 -> Magic_b_01+[+0x1C]
 *   else dword_1D99A88. Then sar 0Ch ; and 7 = bits 12-14. jz 74 only (not ja/jg).
 * dec/jz field==1 -> +0B8h ; field==2 -> +0D4h/+0DCh/+0D8h ; else +74h then copy +70h.
 * Field 2: movsx word [IP+6] ; shl 8 ; cdq ; sub eax,edx ; sar 1 == *128 DWORD +0DCh.
 *   movsx byte [slot+41h] ; imul signed ; add [+0D4h] ; DWORD +0D8h.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84 / 0x9C: absent.
 * No setcc. No jpt. No domain::.
 */

extern unsigned int g_MagVm_IP;
extern unsigned int g_GfCinematic_RuntimeSlotPtr;
extern unsigned int g_GfCinematic_SequenceCtxPtr;
extern unsigned int Magic_b_01;
extern unsigned int dword_1D99A88;

int __cdecl Op33_SeqPtrBind(void)
{
    unsigned int ip;
    unsigned int offset;
    unsigned int base;
    unsigned int opword;
    unsigned int field;
    unsigned int slot;
    unsigned int seq;

    ip = g_MagVm_IP;
    offset = (unsigned int)*(unsigned short *)(ip + 2)
           | ((unsigned int)*(unsigned short *)(ip + 4) << 16);

    slot = g_GfCinematic_RuntimeSlotPtr;
    opword = *(unsigned short *)(slot + 0x4A);

    if (opword & 0x8000)
        base = Magic_b_01 + *(unsigned int *)(Magic_b_01 + 0x1C);
    else
        base = dword_1D99A88;

    field = (opword >> 12) & 7;
    seq = g_GfCinematic_SequenceCtxPtr;

    if (field == 1) {
        *(unsigned int *)(seq + 0xB8) = base + offset;
    } else if (field == 2) {
        int v_dc;
        int v_d8;

        *(unsigned int *)(seq + 0xD4) = base + offset;
        v_dc = (int)*(short *)(ip + 6);
        v_dc = (v_dc << 8) / 2;
        *(int *)(seq + 0xDC) = v_dc;
        v_d8 = (int)*(signed char *)(slot + 0x41) * v_dc;
        v_d8 += *(int *)(seq + 0xD4);
        *(int *)(seq + 0xD8) = v_d8;
    } else {
        *(unsigned int *)(seq + 0x74) = base + offset;
        *(unsigned int *)(seq + 0x70) = *(unsigned int *)(seq + 0x74);
    }

    g_MagVm_IP = ip + 8;
    return (int)g_MagVm_IP;
}
```
