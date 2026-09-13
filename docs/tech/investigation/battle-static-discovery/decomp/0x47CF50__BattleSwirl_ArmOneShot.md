# BattleSwirl_ArmOneShot @ 0x47CF50

- Instr (live): 4
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non (sémantique identique)
- Push IDB: oui
- SetType: int __cdecl BattleSwirl_ArmOneShot(int);
- Notes parent: unique writer du latch swirl; store dword a1+1; retour EAX.

## C réconcilié

`c
/* BattleSwirl_ArmOneShot @ 0x47CF50
 * Ground truth = live ASM (asm_clean.asm), not Hex-Rays.
 * 4 instr. cdecl 1 arg; EAX leftover after inc + dword store.
 */

extern int battle_swirl_dword_1CFF6F4; /* unique writer @ 0x1CFF6F4 */

int __cdecl BattleSwirl_ArmOneShot(int a1)
{
    int v;

    v = a1 + 1;                     /* mov eax, [esp+arg_0]; inc eax */
    battle_swirl_dword_1CFF6F4 = v; /* dword store */
    return v;                       /* retn: EAX = a1+1 */
}
`
