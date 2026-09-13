# BattleUI_RefreshEnemyAndGrieverNames @ 0x4AB450

- Instr (live): 53
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=68
- A==B: non
- Push IDB: oui
- SetType: void __cdecl BattleUI_RefreshEnemyAndGrieverNames(void)
- Notes parent: 4 slots CHARA_NAME stride 0x20 (edi 3..6), sentinelle `&dword_1D750B8`. WORD 66: MASK_B@+0 / MASK_A@+2 de dword_1D750BC. Combined (MASK_B|MASK_A)&0xFFFF. Name[0]==3 puis (name[1]-0x30) jge signé vs 16 ; ==0x20 → SG_GRIEVER_NAME. BYTE [esi]=0 si bit off. add esp 4/4/8. Occupancy 1+2 / GetRandomInt / 0xD0 / 0x1D0 absents. Pas de Hex-Rays. Pas de struct packée.

## C réconcilié

```c
/* BattleUI_RefreshEnemyAndGrieverNames @ 0x4AB450
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 53 instr, size 0x9A, end 0x4AB4EA. IDA type was int __cdecl(); EAX is
 * leftover, proto is void. No domain::.
 * CHARA_NAME stride 0x20, 4 slots (edi 3..6), end sentinel &dword_1D750B8.
 * Occupancy 1+2 / GetRandomInt / slot 0xD0 / F_CHAR 0x1D0 unused.
 * Mask loads/stores are WORD (66 prefix). Empty name is BYTE [esi]=0.
 * jge signed on (name[1]-'0') vs 16; loop end signed jl on esi.
 */

extern unsigned short BATTLE_VISIBILITY_MASK_A;
extern unsigned short BATTLE_VISIBILITY_MASK_B;
extern char CHARA_NAME[];
extern unsigned int dword_1D750B8;
extern unsigned int dword_1D750BC;
extern char SG_GRIEVER_NAME[];

extern int __cdecl getAddressMonsterName(int p_slot_id);
extern char *__cdecl getCharaName(int p_chara_id);
extern int __cdecl pre_strcpy(char *dst, const char *src);

void __cdecl BattleUI_RefreshEnemyAndGrieverNames(void)
{
    unsigned short mask_b;
    unsigned short mask_a;
    unsigned int combined;
    int slot;
    char *dst;
    const char *name;
    int code;

    mask_b = BATTLE_VISIBILITY_MASK_B;
    mask_a = BATTLE_VISIBILITY_MASK_A;
    *(unsigned short *)&dword_1D750BC = mask_b;
    *(unsigned short *)((char *)&dword_1D750BC + 2) = mask_a;

    combined = (unsigned int)(mask_b | mask_a) & 0xFFFF;

    slot = 3;
    dst = CHARA_NAME;
    do
    {
        if (combined & (1u << slot))
        {
            name = (const char *)getAddressMonsterName(slot);
            if ((unsigned char)name[0] != 3)
            {
                pre_strcpy(dst, name);
            }
            else
            {
                code = (unsigned char)name[1] - 0x30;
                if (code < 16)
                    pre_strcpy(dst, getCharaName(code));
                else if (code == 0x20)
                    pre_strcpy(dst, SG_GRIEVER_NAME);
                else
                    pre_strcpy(dst, name);
            }
        }
        else
        {
            *dst = 0;
        }
        dst += 0x20;
        ++slot;
    } while ((int)dst < (int)&dword_1D750B8);
}
```
