# Monster_CalculateScaledStat @ 0x48C3F0

- Instr (live): 99
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=538
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=911
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=221
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Monster_CalculateScaledStat(int p_level, unsigned __int8 *p_stat_params, int p_stat_index)
- Notes parent: ja unsigned vs 5 (77). jpt_48C3FC @ 0x48C4E0 → +0x1C/+20/+24/+28/+2C/+30. Default esi=params. Index 0 et 2 quartered (`sub eax,0`/`sub eax,2`). Linear sinon. BYTE a/b/c/d. CapTo255 add esp 4, jle signed. Pas de 66. Pas de GetRandomInt. Pas de loop slot. Commentaire IDA HP/VIT faux (STR/MAG). Pas de Hex-Rays.

## C réconcilié

```c
/* Monster_CalculateScaledStat @ 0x48C3F0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes + jpt_48C3FC,
 * not Hex-Rays. 99 instr, size 0xED. End 0x48C4DD. No domain::.
 * IDA type: int __cdecl(int p_level, unsigned __int8 *p_stat_params, int p_stat_index).
 * Stack leftover names p_bci / p_attacker / p_stat_to_update are wrong:
 * 8B44240C at entry = arg2 index; after 3 pushes [esp+10h]=level, [esp+14h]=params.
 * No BATTLE_SLOT walk here (caller 0x48C1C0 uses stride 0xD0). No 66 prefix.
 * BYTE a/b/c/d via xor+mov cl/bl/dl. No stores. No GetRandomInt.
 * CapTo255 @ 0x495930 cdecl add esp 4; cmp/jle signed vs 255; no floor at 0.
 * ja vs 5 is UNSIGNED (77). Jump table @ 0x48C4E0 cases 0..5.
 */

int __cdecl CapTo255(int value);

int __cdecl Monster_CalculateScaledStat(
    int p_level,
    unsigned __int8 *p_stat_params,
    int p_stat_index)
{
    unsigned __int8 *curve; /* esi */
    int level;               /* edi */
    int a, b, c, d;
    int v;

    /* cmp eax,5 ; ja def_48C3FC */
    switch ((unsigned int)p_stat_index) {
    case 0: curve = p_stat_params + 0x1C; break; /* STR, jpt -> 0x48C403 */
    case 1: curve = p_stat_params + 0x20; break; /* VIT */
    case 2: curve = p_stat_params + 0x24; break; /* MAG */
    case 3: curve = p_stat_params + 0x28; break; /* SPR */
    case 4: curve = p_stat_params + 0x2C; break; /* SPD */
    case 5: curve = p_stat_params + 0x30; break; /* EVA */
    default:
        curve = p_stat_params; /* def_48C3FC: esi = arg1, no add */
        break;
    }

    /* loc_48C43D: sub eax,0 ; jz loc_48C480 ; sub eax,2 ; jz loc_48C480
     * original index still in eax: 0 and 2 take the quartered tail */
    if (p_stat_index == 0 || p_stat_index == 2) {
        level = p_level;
        d = (int)curve[3]; /* xor ecx; mov cl,[esi+3] */
        v = (level * level) / d; /* imul eax,edi ; cdq ; idiv ecx */
        /* cdq ; sub eax,edx ; sar ecx,1 — signed toward-zero /2 */
        v = v / 2;
        b = (int)curve[1]; /* xor ebx; mov bl,[esi+1] */
        v = (level / b) - v; /* cdq ; idiv ebx ; sub ebx,ecx */
        a = (int)curve[0]; /* xor ecx; mov cl,[esi] */
        /* 66666667h ; imul ecx ; sar edx,2 ; shr eax,1Fh ; add — signed /10 */
        v = (a * level) / 10 + v;
        c = (int)curve[2]; /* xor edx; mov dl,[esi+2] */
        v = v + c;
        /* cdq ; and edx,3 ; add eax,edx ; sar eax,2 — signed toward-zero /4 */
        v = v / 4;
        return CapTo255(v);
    }

    /* linear: index 1/3/4/5 and default (>5 unsigned) */
    level = p_level;
    d = (int)curve[3];
    v = level / d; /* cdq ; idiv ecx  -> ecx = lvl/d */
    b = (int)curve[1];
    v = (level / b) - v; /* eax = lvl/b - lvl/d */
    a = (int)curve[0]; /* xor edx; mov dl,[esi] ; imul edx,edi */
    v = v + a * level;
    c = (int)curve[2];
    v = v + c;
    return CapTo255(v);
}
```
