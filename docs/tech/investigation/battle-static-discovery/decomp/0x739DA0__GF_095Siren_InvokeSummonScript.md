# GF_095Siren_InvokeSummonScript @ 0x739DA0

- Instr (live): 106
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1796
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=1409
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=106
- A==B: non
- Push IDB: oui
- SetType: _DWORD *__cdecl GF_095Siren_InvokeSummonScript(unsigned __int8 *)
- Notes parent: SharedInit Siren. BS_Memset stride/count 0x64x2 puis CreateAndInit(tick 0x739F40, size 0x64, parent 0). movsx [node+2Ah]*0x14 et [2Bh]*0x18. WORD 66 +5Ah/+58h depuis bytes inner+10/+11. jge signe 7D clamp +2Fh. TIM si !([arg0+1]&1). Fenetres TIM +0/+C00/+1800. 9 memset. EAX=&dword_257FA80. Occupancy/0xD0/0x1D0/0x44/K_GF 0x84/0x9C absents.

## C réconcilié

```c
/* GF_095Siren_InvokeSummonScript @ 0x739DA0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 106 instr, size 0x19B, end 0x739F3B. IDA type _DWORD *__cdecl(int); arg used as ptr.
 * cdecl. Saved ESI only. No sub esp. pop esi at 0x739E2F. retn C3.
 * add esp: 20h after first BS_Memset+CreateAndInit (8 dwords); 4 after TIM;
 *   40h + 40h + 10h after the nine later BS_Memset (16+16+4 dwords).
 * BYTE: [node+2Ah]/[2Bh] movsx; stores +2Ch/+29h/+2Dh/+2Fh; test [arg0+1],1.
 * WORD 66: [node+5Ah]/[58h] from bytes [inner+10h]/[11h]; movzx cx; cmp cx,si;
 *   jge SIGNED 7D (not ja). Clamp [node+2Fh] to low byte [node+58h] if less.
 * DWORD: [node+0Ch]=arg0; [arg0+4]; [rec+8]; TIM +0/+C00/+1800; c705 zeros.
 * Stride: [2Ah]*0x14 into *[arg0+4]; [2Bh]*0x18 into *[rec+8]. Not actor 0x9C.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * Return EAX = &dword_257FA80 (list head), not the CreateAndInit node.
 * No setcc. No jpt. No domain::.
 */

extern int dword_258FB70;
extern int dword_2585E38;
extern _DWORD dword_257FA80[4];
extern unsigned char unk_257F9B8;
extern unsigned char unk_258BE40;
extern unsigned char unk_257F8B0;
extern unsigned char unk_258A028;
extern unsigned char unk_2587670;
extern unsigned char unk_257FAA0;
extern unsigned char unk_2585F00;
extern unsigned char unk_258BBA0;
extern unsigned char unk_258EB00;
extern unsigned char unk_258EDD8;
extern int dword_258BE30[4];
extern int dword_257F988[9];
extern int dword_258BA90[4];
extern int dword_258A010[4];
extern int dword_257FA90[4];
extern int dword_2585EF0[4];
extern int dword_258BE20[4];
extern int dword_258EC40[4];
extern int dword_258FB48[6];
extern unsigned __int8 *dword_257F8A0;
extern unsigned __int8 *dword_258BFA4;
extern unsigned __int8 *dword_258A024;
extern unsigned __int8 *dword_258BFA0;
extern unsigned __int8 *dword_258FB74;
extern unsigned __int8 *dword_258A020;

extern int __cdecl GF_095Siren_SequenceTick(int);
extern int __cdecl BS_Memset(int, _WORD *, unsigned int, int);
extern int __cdecl BdLinkTask_CreateAndInitContext(_DWORD *, int, int, int);
extern unsigned __int8 *__cdecl BattleTimQueue_EnqueueType1(unsigned __int8 *);

_DWORD *__cdecl GF_095Siren_InvokeSummonScript(unsigned __int8 *arg0)
{
    unsigned __int8 *node;
    unsigned __int8 *rec;
    unsigned __int8 *inner;
    unsigned __int8 *tbl;
    signed __int16 idx_2a;
    signed __int16 idx_2b;
    unsigned __int16 word_5a;
    unsigned __int16 word_58;
    unsigned __int8 dec_cl;

    dword_258FB70 = 0;
    dword_2585E38 = 0;

    BS_Memset((int)dword_257FA80, (_WORD *)&unk_257F9B8, 0x64u, 2);
    node = (unsigned __int8 *)BdLinkTask_CreateAndInitContext(
        dword_257FA80,
        (int)GF_095Siren_SequenceTick,
        0x64,
        0);

    idx_2a = (signed __int8)node[0x2A];
    *(_DWORD *)(node + 0x0C) = (_DWORD)arg0;
    rec = *(unsigned __int8 **)(arg0 + 4) + idx_2a * 0x14;
    node[0x2C] = rec[0];
    tbl = *(unsigned __int8 **)(rec + 8);

    idx_2b = (signed __int8)node[0x2B];
    node[0x29] = 0;
    node[0x2D] = tbl[idx_2b * 0x18];

    inner = *(unsigned __int8 **)(arg0 + 4);
    word_5a = (unsigned __int8)inner[0x10];
    *(_WORD *)(node + 0x5A) = word_5a;
    word_58 = (unsigned __int8)inner[0x11];
    *(_WORD *)(node + 0x58) = word_58;
    dec_cl = (unsigned __int8)(word_5a - 1);
    node[0x2F] = dec_cl;
    if ((signed __int16)dec_cl < (signed __int16)word_58)
        node[0x2F] = (unsigned __int8)word_58;

    if (!(arg0[1] & 1))
        BattleTimQueue_EnqueueType1(dword_257F8A0);

    dword_258BFA4 = dword_257F8A0;
    dword_258A024 = dword_257F8A0 + 0xC00;
    dword_258BFA0 = dword_257F8A0 + 0xC00;
    dword_258FB74 = dword_257F8A0 + 0x1800;
    dword_258A020 = dword_257F8A0 + 0x1800;

    BS_Memset((int)dword_258BE30, (_WORD *)&unk_258BE40, 0x58u, 4);
    BS_Memset((int)dword_257F988, (_WORD *)&unk_257F8B0, 0x48u, 3);
    BS_Memset((int)dword_258BA90, (_WORD *)&unk_258A028, 0x2A4u, 0x0A);
    BS_Memset((int)dword_258A010, (_WORD *)&unk_2587670, 0x534u, 8);
    BS_Memset((int)dword_257FA90, (_WORD *)&unk_257FAA0, 0xE0u, 0x6E);
    BS_Memset((int)dword_2585EF0, (_WORD *)&unk_2585F00, 0x64u, 0x3C);
    BS_Memset((int)dword_258BE20, (_WORD *)&unk_258BBA0, 0x40u, 0x0A);
    BS_Memset((int)dword_258EC40, (_WORD *)&unk_258EB00, 0x140u, 1);
    BS_Memset((int)dword_258FB48, (_WORD *)&unk_258EDD8, 0x30u, 2);

    return dword_257FA80;
}
```
