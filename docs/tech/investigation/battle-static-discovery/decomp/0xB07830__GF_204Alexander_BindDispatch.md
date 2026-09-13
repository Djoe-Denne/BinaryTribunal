# GF_204Alexander_BindDispatch @ 0xB07830

- Instr (live): 124
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=81
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=235
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=346
- A==B: non
- Push IDB: oui
- SetType: int __cdecl GF_204Alexander_BindDispatch(void)
- Notes parent: STREAM16[57] @ 0x1872AA4 (funcs_B0BC5C @ 0x18729C0). WORD [slot+0x4A]>>12, dec, ja unsigned, jpt_B0784A 8 DWORD live. Cases 1=.00+0x20 BindResource; 2=.00+0x24 sub_4A29A0 store +168h[idx]; 3=3 slots jl signed; 4=DWORD snapshot + WORD 66; 5/6 sub_504270(1); 7 sub_504270(0); 8 ClearFlags; default seqState+9 bit 0x20 skip, movsx [IP+2] sub_B65370. IP+=4 toutes voies, EAX=nouvel IP. Occupancy/0xD0/0x1D0/0x44/K_GF 0x84 absents.

## C réconcilié

```c
/* GF_204Alexander_BindDispatch @ 0xB07830
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 124 instr, size 0x1E0, end 0xB07A10. IDA type int(). cdecl, 0 args, retn C3.
 * Saved ESI only. No EBP. No sub esp. FRSIZE 0x4 phantom.
 * Switch: WORD [g_GfCinematic_RuntimeSlotPtr+0x4A] >> 12, then dec/cmp 7 / ja UNSIGNED.
 * jpt_B0784A @ 0xB07A10 live: 0->case1, 1->case2, 2->case3, 3->case4,
 *   4+5->cases 5,6, 6->case7, 7->case8. Nibble 0 and >8 -> def_B0784A.
 * add esp: 4 (BindResource), 0Ch (sub_4A29A0), 4 (Table4x24 each), 4 (sub_504270 x2),
 *   4 (sub_B65370). Case 8: no add esp (0-arg).
 * BYTE: [IP+2]/[IP+3] case 2; test [seqState+9],20h.
 * WORD 66: [slot+4Ah]; case4 word_1D977A0/1D9771C; default Y/FOV/look-at words.
 * DWORD: chunk +20h/+24h, [obj+94h], [base+idx*4+168h], camera XZ, B8B8xx snapshot.
 * Case3 loop jl SIGNED, esi 0x168/0x16C/0x170 (three dwords, not 4).
 * STREAM16[57] @ 0x1872AA4 = 0xB07830 (funcs_B0BC5C @ 0x18729C0). Opcode 57.
 * Occupancy/0xD0/0x1D0/0x44/K_GF 0x84 absents.
 * Leftover EAX = new g_MagVm_IP. No packed struct. No domain::.
 */

extern unsigned char *g_GfCinematic_RuntimeSlotPtr;
extern unsigned char *g_MagVm_IP;
extern int g_MagicFileChunkTable[];
extern unsigned char *dword_279744C;
extern unsigned char *g_GfCinematic_SequenceStatePtr;
extern unsigned char *dword_27973E8;
extern int Battle_Camera_world_XZ_s16;
extern int Battle_Camera_world_Y;
extern int Battle_Camera_LookAt_XZ_s16;
extern int Battle_Camera_LookAt_Y;
extern int dword_B8B800;
extern int dword_B8B804;
extern int dword_B8B808;
extern int dword_B8B80C;
extern unsigned __int16 word_1D8E038;
extern unsigned __int16 word_1D977A0;
extern unsigned __int16 word_1D977A2;
extern unsigned __int16 word_1D9771C;

extern void __cdecl Camera_OrTakeover80_ClearFlags(void);
extern void *__cdecl BattleCamera_BindResource(void *);
extern int __cdecl sub_4A29A0(int, int, int);
extern void __cdecl Table4x24_Clear_1D6BBB8(int);
extern int __cdecl sub_504270(int);
extern int __cdecl sub_B65370(unsigned __int16);

int __cdecl GF_204Alexander_BindDispatch(void)
{
    unsigned int nibble;
    unsigned char *table;
    unsigned char *obj;
    unsigned char *look;
    unsigned __int8 idx;
    unsigned int count;
    int off;
    int slot;

    nibble = *(unsigned __int16 *)(g_GfCinematic_RuntimeSlotPtr + 0x4A) >> 12;

    switch (nibble) {
    case 8: /* loc_B07851, jpt[7] */
        Camera_OrTakeover80_ClearFlags();
        break;

    case 1: /* loc_B07865, jpt[0]: mag.00 +0x20 BindResource */
        table = (unsigned char *)g_MagicFileChunkTable;
        BattleCamera_BindResource((void *)(table + *(_DWORD *)(table + 0x20)));
        break;

    case 2: /* loc_B07887, jpt[1]: mag.00 +0x24 via sub_4A29A0 */
        idx = g_MagVm_IP[2];
        count = (unsigned int)g_MagVm_IP[3] + 1;
        table = (unsigned char *)g_MagicFileChunkTable;
        *(_DWORD *)(dword_279744C + (unsigned int)idx * 4 + 0x168) = sub_4A29A0(
            (int)(table + *(_DWORD *)(table + 0x24)),
            (int)count,
            0x80);
        break;

    case 3: /* loc_B078D1, jpt[2]: three slots +0x168/+0x16C/+0x170, jl signed */
        for (off = 0x168; off < 0x174; off += 4) {
            slot = *(_DWORD *)(dword_279744C + off);
            if (slot != 0)
                Table4x24_Clear_1D6BBB8(slot);
        }
        break;

    case 4: /* loc_B07906, jpt[3]: snapshot live camera */
        dword_B8B800 = Battle_Camera_world_XZ_s16;
        dword_B8B804 = Battle_Camera_world_Y;
        dword_B8B80C = Battle_Camera_LookAt_Y;
        dword_B8B808 = Battle_Camera_LookAt_XZ_s16;
        word_1D977A0 = word_1D8E038;
        word_1D9771C = word_1D977A2;
        break;

    case 5: /* loc_B0795D, jpt[4] and jpt[5] */
    case 6:
        sub_504270(1);
        break;

    case 7: /* loc_B07976, jpt[6] */
        sub_504270(0);
        break;

    default: /* def_B0784A @ 0xB0798F: nibble 0 or >8 */
        if ((g_GfCinematic_SequenceStatePtr[9] & 0x20) == 0) {
            obj = dword_27973E8;
            Battle_Camera_world_XZ_s16 = *(_DWORD *)(obj + 0x94);
            *(_WORD *)&Battle_Camera_world_Y = *(_WORD *)(obj + 0x98);
            word_1D8E038 = *(_WORD *)(obj + 0x8C);
            word_1D977A2 = *(_WORD *)(obj + 0x8E);
            look = (unsigned char *)sub_B65370((unsigned __int16)(signed __int16)*(_WORD *)(g_MagVm_IP + 2));
            Battle_Camera_LookAt_XZ_s16 = *(_DWORD *)(look + 0x94);
            *(_WORD *)&Battle_Camera_LookAt_Y = *(_WORD *)(look + 0x98);
        }
        break;
    }

    g_MagVm_IP += 4;
    return (int)g_MagVm_IP;
}
```
