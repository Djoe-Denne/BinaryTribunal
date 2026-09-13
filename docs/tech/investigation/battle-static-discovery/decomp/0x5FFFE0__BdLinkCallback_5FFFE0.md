# BdLinkCallback_5FFFE0 @ 0x5FFFE0

- Instr (live): 93
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=4111
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=6165
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=2626
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BdLinkCallback_5FFFE0(int node)
- Notes parent: WORD [node+0xC] et WORD [node+0xE] (pas BYTE +0x0D). Pas de Register ici. Retour 0/2 via setnl (TEST AL,2). Stride acteur 0x9C. Table 0x10x40. Bone BYTE[**(actor+0x64)]. Occupancy/0xD0/0x1D0/0x44 absents. MAG_160 helper 0x5FF180.

## C réconcilié

```c
/* BdLinkCallback_5FFFE0 @ 0x5FFFE0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 93 instr, size 0x12A, end 0x60010A. cdecl, 1 arg (BdLink node). retn C3.
 * Saved EBX/EBP/ESI/EDI after flags gate. FRSIZE 0.
 * WORD [node+0xC] phase and WORD [node+0xE] (66), not BYTE +0x0D.
 * No BdLinkTask_Register in this body. Pump unlink = this return EAX=2 (TEST AL,2).
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / GetRandomInt: absent.
 * Actor stride lea+shl+sub+lea = idx*0x9C. Table stride 0x10, 40 slots.
 * Bone count = BYTE [ **(actor+0x64) ] (mov ecx,[actor+0x64]; mov edx,[ecx]; mov cl,[edx]).
 * jl/jge signed. idiv signed. setnl -> 0 keep / 2 unlink. add esp,10h on Geom.
 * No domain::.
 */

extern unsigned int battle_to_update_flags_dword_1D96A9C;
extern int dword_23D5634;
extern int dword_23D559C;
extern unsigned char g_BattlePresentationActors[]; /* 0x1D972C0, stride 0x9C */
extern short word_23D3710[]; /* table base */
extern short word_23D3990[]; /* table end exclusive */

int __cdecl _rand(void);
int __cdecl BattleGeom_ResolveBoneIndexAndPose(int p_actor, int p_bone_index, int p_scale, unsigned short *p_out);

int __cdecl BdLinkCallback_5FFFE0(int node)
{
    int spawned;
    int slot_i;
    int actor_idx;
    int bone_index;
    int bone_count;
    int phase;
    unsigned char *actor;
    unsigned char *p;
    short *slot;

    if (battle_to_update_flags_dword_1D96A9C & 0x201)
        return 0;

    if ((int)*(short *)(node + 0xC) >= dword_23D5634 - 8)
        goto tick;

    spawned = 0;
    do {
        slot_i = 0;
        slot = word_23D3710;
        while (*slot >= 0) {
            slot += 8;
            slot_i++;
            if (slot >= word_23D3990)
                goto tick;
        }
        if (slot_i >= 0x28)
            goto tick;

        slot[0] = 0;
        slot[1] = (short)(_rand() % 0x300 + 0x400);

        actor_idx = dword_23D559C;
        actor = g_BattlePresentationActors + actor_idx * 0x9C;
        p = *(unsigned char **)(actor + 0x64);
        p = *(unsigned char **)p;
        bone_count = *p;
        bone_index = 0;
        if (bone_count != 0) {
            bone_index = _rand() % bone_count;
            actor_idx = dword_23D559C;
            actor = g_BattlePresentationActors + actor_idx * 0x9C;
        }

        BattleGeom_ResolveBoneIndexAndPose(
            (int)actor,
            bone_index,
            0,
            (unsigned short *)(slot + 2));

        slot[5] = (short)(_rand() % 10 + 2);
        slot[6] = (short)((int)*(short *)(node + 0xE) % 24);
        spawned++;
    } while (spawned < 3);

tick:
    *(short *)(node + 0xC) += 1;
    phase = *(short *)(node + 0xC);
    *(short *)(node + 0xE) += 1;
    if (phase >= dword_23D5634 - 1)
        return 2;
    return 0;
}
```
