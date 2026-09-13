# BattleTask_EscapeRelay74_Worker @ 0x502F90

- Instr (live): 55
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=501
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=123
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=106
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleTask_EscapeRelay74_Worker(unsigned char *node)
- Notes parent: switch BYTE [node+0x0D] 0/1/2. Case 0 wait FindFlag2(0x101A,0x40) puis fallthrough inc. Case 1 reload AL, or CL 0x80, DWORD flags. Case 2 BdPlaySy add esp 0Ch; 3 acteurs stride 0x9C jl signé; BYTE parent+1=0xFF; return 2. Occupancy/0xD0/0x1D0 absents.

## C réconcilié

```c
/* BattleTask_EscapeRelay74_Worker @ 0x502F90
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 55 instr, size 0xA4, end 0x503034. cdecl, 1 arg (BdLink child node).
 * Switch unsigned BYTE [node+0x0D] via xor-eax / mov al / sub 0 / dec / dec.
 * Case 0: FindFlag2_Match(0x101A, 0x40); if EAX!=0 return 0; else inc BYTE state, fall into case 1.
 * Case 1: DWORD flags load, or CL 0x80, inc AL (reloaded), DWORD store flags, BYTE store state, return 0.
 * Case 2: BdPlaySy(0x15,0,0x80) add esp 0Ch; walk 3 actors stride 0x9C, jl signed;
 *         BYTE [*(node+0x10)+1]=0xFF; return 2.
 * Occupancy / GetRandomInt / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No Hex-Rays. No domain::.
 */

extern unsigned int battle_to_update_flags_dword_1D96A9C; /* 0x1D96A9C DWORD */
extern unsigned char g_BattlePresentationActors[];            /* 0x1D972C0 */
extern unsigned char word_1D97494[];                       /* 0x1D97494 exclusive end */

extern int __cdecl BdPlaySy(unsigned int a, int b, unsigned int c);
extern char *__cdecl sub_509CD0(int actor, unsigned int flag400);
extern void __cdecl BattlePresentation_StartActorAnimation(int actor, int animId);
extern int __cdecl BattleActor_FindFlag2_Match(int mask, unsigned short extra);

int __cdecl BattleTask_EscapeRelay74_Worker(unsigned char *node)
{
    unsigned int flags;
    unsigned char state;
    unsigned char *actor;
    unsigned char *parent;

    switch (node[0x0D])
    {
    case 0:
        if (BattleActor_FindFlag2_Match(0x101A, 0x40) != 0)
            return 0;
        node[0x0D]++;
        /* fall through */
    case 1:
        flags = battle_to_update_flags_dword_1D96A9C;
        state = node[0x0D];
        *(unsigned char *)&flags |= 0x80;
        battle_to_update_flags_dword_1D96A9C = flags;
        node[0x0D] = (unsigned char)(state + 1);
        return 0;

    case 2:
        BdPlaySy(0x15, 0, 0x80);
        actor = g_BattlePresentationActors;
        do
        {
            if ((actor[0] & 2) != 0)
            {
                flags = *(unsigned int *)(actor + 8);
                if ((flags & 0x101A) == 0)
                {
                    sub_509CD0((int)actor, flags & 0x400);
                    BattlePresentation_StartActorAnimation((int)actor, 0x11);
                }
            }
            actor += 0x9C;
        } while ((int)actor < (int)word_1D97494);
        parent = *(unsigned char **)(node + 0x10);
        parent[1] = 0xFF;
        return 2;

    default:
        return 0;
    }
}
```
