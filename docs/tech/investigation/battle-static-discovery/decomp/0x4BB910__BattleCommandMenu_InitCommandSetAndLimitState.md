# BattleCommandMenu_InitCommandSetAndLimitState @ 0x4BB910

- Instr (live): 48
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=10
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=53
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=10
- A==B: non
- Push IDB: oui
- SetType: unsigned int __cdecl BattleCommandMenu_InitCommandSetAndLimitState(int menu_state, int char_index)
- Notes parent: stride entrée `+4` jusqu’à `esi < 0x10` (`jl` 7C signé, pas 0xD0/0x1D0/Exists 0x44) ; `[+2Ah]` BYTE = AL de Populate ; extra nom `[+8][0]` si `test byte [list+esi+3],4` ; `jnb` 73 unsigned max ; retour `(max+0x1B)&~1` ; occupancy 1+2 absent ; GetRandomInt absent.

## C réconcilié

```c
/* BattleCommandMenu_InitCommandSetAndLimitState @ 0x4BB910
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 48 instr, size 0x77. cdecl. BYTE store +0x2A. entry stride 4.
 */

char __cdecl BattleLimit_ComputeCrisisAndToggleAttackSlot(int char_index);
int __cdecl BattleCommandMenu_PopulateSubcommandList(int char_index);
char *__cdecl getAddressAbilityName(int p_command_type);
int __cdecl Thunk_4A0D10_Push0_AndFFFF(int name);

unsigned int __cdecl BattleCommandMenu_InitCommandSetAndLimitState(int menu_state, int char_index)
{
    unsigned int max_width; /* edi, xor before the two setup calls */
    int esi;                /* byte offset 0,4,8,0xC */
    unsigned int width;     /* EAX after thunk (and 0xFFFF inside callee) */
    unsigned char *list;
    unsigned int cmd_id;

    max_width = 0; /* 33 FF before ComputeCrisis */

    BattleLimit_ComputeCrisisAndToggleAttackSlot(char_index);
    /* add esp,8 after both cdecl 1-arg calls; AL from Populate only */
    *(unsigned char *)(menu_state + 0x2A) =
        (unsigned char)BattleCommandMenu_PopulateSubcommandList(char_index); /* 88 45 2A */

    for (esi = 0; esi < 0x10; esi += 4) { /* 83 C6 04 ; 83 FE 10 ; 7C signed jl */
        list = *(unsigned char **)(menu_state + 4); /* 8B 45 04 each iter */
        cmd_id = list[esi]; /* xor ecx,ecx ; 8A 0C 06 ; push ecx */
        width = (unsigned int)Thunk_4A0D10_Push0_AndFFFF(
            (int)getAddressAbilityName((int)cmd_id));
        if (max_width < width) /* 3B F8 ; 73 jnb unsigned */
            max_width = width;

        list = *(unsigned char **)(menu_state + 4); /* 8B 55 04 */
        if (list[esi + 3] & 4) { /* F6 44 16 03 04 ; 74 jz */
            unsigned char *extra = *(unsigned char **)(menu_state + 8); /* 8B 45 08 */
            cmd_id = extra[0]; /* 8A 08 index 0, not +esi */
            width = (unsigned int)Thunk_4A0D10_Push0_AndFFFF(
                (int)getAddressAbilityName((int)cmd_id));
            if (max_width < width)
                max_width = width;
        }
    }

    return (max_width + 0x1Bu) & ~1u; /* 8D 47 1B ; D1 E8 ; D1 E0 */
}
```
