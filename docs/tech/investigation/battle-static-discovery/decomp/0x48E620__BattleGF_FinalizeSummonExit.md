# BattleGF_FinalizeSummonExit @ 0x48E620

- Instr (live): 145
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=5836 (retry high/65536 après length)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=4787
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=5473 (retry high/65536 après length)
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleGF_FinalizeSummonExit(int)
- Notes parent: persist HP WORD SG_ARRAY_GF_DATA[gf].HP+0x12 stride 0x44 ; test ch,4 = 0x400 ; GFSummoned 0x80000000 + timer WORD==0 → mask+sub_484F70 add esp 14h ; sinon Death skip sinon ATB+relay 0x72/0xF0/0 + WORD [eax]=si add esp 10h ; KO list +0x122 stride 5 jl signé |=2 sur F_CHAR 0x1D0 (pas 0xD0) ; teardown +0x1C&=0xFE (ebp) status_2&=7FFFFFFF flag&=~0x400 FinalizePartySetup [edi+0Fh]=1 ; EAX leftover.

## C réconcilié

```c
/* BattleGF_FinalizeSummonExit @ 0x48E620
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 145 instr, size 0x202. IDA type int __cdecl(int). No domain::.
 * F_CHAR stride 0x1D0 (ebp kept for whole fn). Slot stride 0xD0. GF record 0x44.
 * Junctioned-GF list +0x122 stride 5, 16 entries, jl signed vs 0x10.
 * Occupancy unused. GetRandomInt unused. No setcc. No ja/jg.
 */

extern unsigned char dword_1D28C44[];   /* cmd records, stride 0x10 @ 0x1D28C44 */
extern unsigned char F_CHAR_DATA[];     /* 0x1CFF000 */
extern unsigned char SG_ARRAY_GF_DATA[]; /* 0x1CFDCA8, HP field +0x12 */
extern unsigned char BATTLE_SLOT_DATA[]; /* 0x1D27B10; flag_data +0x7C; status_2 +0x08; status_1 +0x80 */

unsigned __int16 __cdecl BattleGF_BuildTargetMaskFromKernelInfo(int gf_command_arg);
unsigned char __cdecl sub_484F70(int a1, int a2, unsigned char a3, unsigned __int16 a4);
int __cdecl relatedToCharAtbFlagData(int param_slot_id);
int __cdecl BattleEvent_ActivateTargetRelay(__int16 a1, unsigned char a2, int a3);
__int16 __cdecl Battle_FinalizePartySetup(void);

int __cdecl BattleGF_FinalizeSummonExit(int cmd_index)
{
    unsigned char *cmd;
    unsigned int slot;
    unsigned int fchar_off; /* ebp: original slot * 0x1D0 for the whole function */
    unsigned int slot_off;
    unsigned int flag_data;
    unsigned char gf_id;
    unsigned char *list;
    int i;
    unsigned __int16 mask;
    __int16 leftover;

    /* edi = dword_1D28C44 + (cmd_index << 4) */
    cmd = dword_1D28C44 + (cmd_index << 4);
    slot = cmd[0x0C]; /* BYTE zero-extend → esi */
    /* ((slot*8-slot)*4+slot)<<4 */
    fchar_off = slot * 0x1D0;
    /* (slot+(slot+slot*2)*4)<<4 */
    slot_off = slot * 0xD0;

    /* Persist WORD F_CHAR+0x18 → SG_ARRAY_GF_DATA[kernel-0x40].HP (+0x12). 66 prefix. */
    gf_id = F_CHAR_DATA[fchar_off + 0x1D];
    *(__int16 *)&SG_ARRAY_GF_DATA[(gf_id - 0x40) * 0x44 + 0x12] =
        *(__int16 *)&F_CHAR_DATA[fchar_off + 0x18];

    flag_data = *(unsigned int *)&BATTLE_SLOT_DATA[slot_off + 0x7C];
    if (flag_data & 0x400) /* test ch,4 → DWORD bit 10 */
        return 0; /* loc_48E81C: EAX leftover, no mov eax */

    if (*(unsigned int *)&BATTLE_SLOT_DATA[slot_off + 0x08] & 0x80000000u) {
        /* GFSummoned: only requeue if CHARGE_TIMER WORD == 0 */
        if (*(__int16 *)&F_CHAR_DATA[fchar_off + 0x14] != 0)
            return 0; /* loc_48E81C */

        mask = BattleGF_BuildTargetMaskFromKernelInfo(cmd[0x0E]);
        sub_484F70(cmd[0x0C], cmd[0x0D], cmd[0x0E], mask);
        /* add esp,14h = mask-builder 1 + enqueue 4 */

        /* loc_48E6C2: re-read slot from [edi+0Ch], F_CHAR stride 0x1D0 (not 0xD0) */
        slot = cmd[0x0C];
        gf_id = F_CHAR_DATA[slot * 0x1D0 + 0x1D];
        if (*(__int16 *)&F_CHAR_DATA[slot * 0x1D0 + 0x18] == 0) {
            list = &F_CHAR_DATA[slot * 0x1D0 + 0x122];
            for (i = 0; i < 0x10; i++) { /* cmp esi,10h ; jl SIGNED */
                if (list[i * 5] == gf_id) {
                    /* lea F_CHAR_DATA[fchar+esi*4] + esi + 0x126 → list[n]+4 */
                    F_CHAR_DATA[slot * 0x1D0 + i * 5 + 0x126] |= 2;
                    break;
                }
            }
        }
    } else {
        /* loc_48E744: not GFSummoned. status_1 BYTE bit0 = Death */
        slot_off = slot * 0xD0;
        if (!(BATTLE_SLOT_DATA[slot_off + 0x80] & 1)) {
            relatedToCharAtbFlagData((int)slot);
            /* add esp,10h after ATB 1 + relay 3. 66 89 30 WORD store. */
            *(__int16 *)BattleEvent_ActivateTargetRelay(0x72, 0xF0, 0) = (__int16)slot;
        }

        /* loc_48E770: second HP==0 scan, same F_CHAR 0x1D0 / list +5 */
        slot = cmd[0x0C];
        gf_id = F_CHAR_DATA[slot * 0x1D0 + 0x1D];
        if (*(__int16 *)&F_CHAR_DATA[slot * 0x1D0 + 0x18] == 0) {
            list = &F_CHAR_DATA[slot * 0x1D0 + 0x122];
            for (i = 0; i < 0x10; i++) {
                if (list[i * 5] == gf_id) {
                    F_CHAR_DATA[slot * 0x1D0 + i * 5 + 0x126] |= 2; /* or byte ptr [esi],2 */
                    break;
                }
            }
        }
    }

    /* loc_48E7DA: +0x1C clear uses ebp (original fchar_off); slot RMW uses ecx=[edi+0Ch] */
    slot = cmd[0x0C];
    slot_off = slot * 0xD0;
    F_CHAR_DATA[fchar_off + 0x1C] &= 0xFEu;
    *(unsigned int *)&BATTLE_SLOT_DATA[slot_off + 0x08] &= 0x7FFFFFFFu;
    *(unsigned int *)&BATTLE_SLOT_DATA[slot_off + 0x7C] &= ~0x400u; /* and ch,0FBh */
    leftover = Battle_FinalizePartySetup();
    cmd[0x0F] = 1; /* BYTE; does not clobber EAX */
    return leftover;
}
```
