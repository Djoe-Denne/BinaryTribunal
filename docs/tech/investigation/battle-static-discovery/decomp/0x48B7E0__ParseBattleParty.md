# ParseBattleParty @ 0x48B7E0

- Instr (live): 67
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=925
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=383
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=981
- A==B: non
- Push IDB: oui
- SetType: int __cdecl ParseBattleParty();
- Notes parent: clear 2 DWORD / stride `0x1D0`, `jl` signé vs `0x1CFF6F4` (CMP only). Magic skip `id==0xFF` ; `0x1CFE0F8+152*id` ; 32× BYTE +2 ; OR `SG_KNOWN_MAGIC[(id-1)>>5]`. `RARE_ITEM` BYTE `C6`. Slots 0..2 toujours 4 calls + `add esp,18h`. Pas occupancy 1+2. EAX leftover Finalize. Pas 66 / setcc / ja / jpt.

## C réconcilié

```c
/* ParseBattleParty @ 0x48B7E0
 * Ground truth = live ASM (asm_clean.asm + dump_bytes), not Hex-Rays.
 * 67 instr, size 0xC6, retn. IDA type int() → int __cdecl(void).
 * No domain::. No packed struct. No occupancy 1+2 (party BYTE 0xFF sentinel).
 * No 66. No setcc. No ja/jg (jl 7C / jz / jnz / jns). No jpt_.
 */

extern int dword_1CFF184;                         /* 0x1CFF184 ; F_CHAR[+0x184] slot0 */
extern int battle_swirl_dword_1CFF6F4;            /* 0x1CFF6F4 ; cmp bound only */
extern unsigned char SG_PARTY_BATTLE[];           /* 0x1CFE74C BYTE ids, 0xFF empty */
extern int SG_KNOWN_MAGIC[];                      /* 0x1CFE95C DWORD OR [idx] */
extern unsigned char RARE_ITEM_ABILITY_IN_IT;     /* 0x1CFF6D8 BYTE C6 */

int __cdecl ParseBattleCharacter(int p_char_id, int p_slot_id);
int __cdecl Battle_CalculateJunctionStats(int p_char_id, int p_slot_id);
char __cdecl Battle_InitPartySlotStatusFromChar(int p_slot_id);
int __cdecl setBattleSlotData(int p_slot_id);
__int16 __cdecl Battle_FinalizePartySetup(void);

int __cdecl ParseBattleParty(void)
{
    int *p;                 /* eax clear cursor */
    int party_i;            /* ebp */
    int slot;               /* esi */
    unsigned int char_id;   /* zero-extend BYTE */
    unsigned char *magic;   /* esi magic pairs */
    int n;                  /* edi = 32 */
    unsigned int id;
    int v;

    /* loc_48B7E5: two DWORD stores, add eax,1D0h, cmp vs swirl, jl signed (7C).
     * 3 iters: 0x1CFF180/184, 0x1CFF350/354, 0x1CFF520/524 = F_CHAR[+0x180/+0x184].
     * Bound 0x1CFF6F4 is CMP only, not a writer. Stride F_CHAR 0x1D0. */
    p = &dword_1CFF184;
    do {
        p[-1] = 0;
        p[0] = 0;
        p = (int *)((char *)p + 0x1D0);
    } while ((int)p < (int)&battle_swirl_dword_1CFF6F4);

    /* loc_48B803: party 0..2, signed jl vs 3. Skip magic scan iff id==0xFF. */
    party_i = 0;
    do {
        char_id = (unsigned char)SG_PARTY_BATTLE[party_i];
        if (char_id != 0xFF) {
            /* esi = 0x1CFE0F8 + 152*char_id
             * lea ecx,[eax+eax*8]; lea edx,[eax+ecx*2]; lea esi,[edx*8+0x1CFE0F8]
             * CharacterData stride 152, Magic at +0x10 from SG_ARRAY_CHARA_DATA. */
            magic = (unsigned char *)(0x1CFE0F8 + 152 * char_id);
            n = 0x20;
            do {
                id = (unsigned char)magic[0]; /* mov al,[esi] */
                if (id != 0) {
                    /* MSVC signed /32 and %32 of (id-1): cdq; and 1Fh; add; sar 5;
                     * and ecx,8000001Fh; jns else dec / or -32 / inc; shl 1,cl.
                     * BYTE id => v in 0..254, jns always; equivalent: idx=v>>5, bit=v&31. */
                    v = (int)id - 1;
                    SG_KNOWN_MAGIC[v >> 5] |= (int)(1u << (v & 31));
                }
                magic += 2; /* add esi, 2 — pair (id,qty) */
                n--;
            } while (n != 0);
        }
        party_i++;
    } while (party_i < 3);

    RARE_ITEM_ABILITY_IN_IT = 0; /* BYTE store C6 05 */

    /* loc_48B86A: always 3 slots, even char_id==0xFF. add esp,18h after 4 cdecls. */
    slot = 0;
    do {
        char_id = (unsigned char)SG_PARTY_BATTLE[slot];
        ParseBattleCharacter((int)char_id, slot);
        Battle_CalculateJunctionStats((int)char_id, slot);
        Battle_InitPartySlotStatusFromChar(slot);
        setBattleSlotData(slot);
        slot++;
    } while (slot < 3);

    /* retn: EAX leftover from FinalizePartySetup (__int16). */
    return Battle_FinalizePartySetup();
}
```
