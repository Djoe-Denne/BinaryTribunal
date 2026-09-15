# BattleAnimation_StartActorAndWeaponClip @ 0x509520

- Instr (live): 59
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=920 (effort_used=high)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=1465 (effort_used=high)
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=694 (effort_used=high)
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleAnimation_StartActorAndWeaponClip(int actor, __int16 clip_id)
- Notes parent: Occupancy 1+2 PRESENT (AND 0xFC / OR 1 / OR 2 BYTE [actor+6Dh]; XOR-copy bits 0+1 onto [weapon+0Dh]; 0x80 exclusive over 0x40). CH=[actor+9] from DWORD [+8]. Pair [+74h] bytes [0]==[2], no null check. Weapon iff [+78h]. Two StartClip add esp,0Ch. EAX=2nd call. lea +6Ch then +60h. Pas 0xD0/0x9C. Pas 66. Caller or[+2Ch]/yield -1 hors de cette fonction.

## C réconcilié

```c
/* BattleAnimation_StartActorAndWeaponClip @ 0x509520
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes. 59 instr, size 0x86.
 * cdecl; 2 args; push ebp/esi/edi; ebp reused as clip_id GPR (not frame). retn C3.
 * EAX = leftover of the second BattleAnimation_StartClip (actor body).
 * Occupancy 1+2 PRESENT: AND 0xFC / OR 1 / OR 2 on BYTE [actor+6Dh];
 * XOR-copy bits 0+1 onto BYTE [weapon+0Dh]. 0x80 exclusive over 0x40.
 * Slot 0xD0 / stride 0x9C / F_CHAR 0x1D0 / GF Exists 0x44 absent. No 66 prefix.
 */

int __cdecl BattleAnimation_StartClip(void *, void *, __int16); /* 0x509440; add esp,0Ch */

int __cdecl BattleAnimation_StartActorAndWeaponClip(int actor, __int16 clip_id)
{
    unsigned char flags;
    unsigned int field8;
    unsigned char ch;
    unsigned char *pair;
    unsigned char *weapon;
    unsigned char wf;
    unsigned char af;
    unsigned char t;

    flags = *(unsigned char *)(actor + 0x6D); /* 8A 46 6D BYTE */
    field8 = *(unsigned int *)(actor + 8);    /* 8B 4E 08 DWORD */
    ch = (unsigned char)(field8 >> 8);        /* CH = [actor+9] */
    flags &= 0xFCu;                           /* 24 FC clear occupancy 1+2 */
    *(unsigned char *)(actor + 0x6D) = flags; /* 88 46 6D before jz */

    if (ch & 0xC0) { /* F6 C5 C0; jz loc_50955E */
        pair = *(unsigned char **)(actor + 0x74); /* 8B 7E 74; no null check */
        if (pair[0] == pair[2] /* 8A 17; 8A 5F 02; 3A D3; ebx scratch only */
            && !(*(unsigned char *)(actor + 2) & 8)) { /* F6 46 02 08; jnz skip */
            if (ch & 0x80) { /* F6 C5 80; jz loc_509554 */
                flags |= 1u; /* 0C 01; jmp loc_50955B */
                *(unsigned char *)(actor + 0x6D) = flags;
            } else if (ch & 0x40) { /* F6 C5 40; jz loc_50955E */
                flags |= 2u; /* 0C 02 */
                *(unsigned char *)(actor + 0x6D) = flags; /* loc_50955B */
            }
        }
    }

    weapon = *(unsigned char **)(actor + 0x78); /* 8B 7E 78 */
    if (weapon) { /* 85 FF; jz loc_509591 */
        wf = weapon[0x0D]; /* 8A 57 0D */
        af = *(unsigned char *)(actor + 0x6D); /* 8A 4E 6D */
        t = (unsigned char)(((wf ^ af) & 1) ^ wf); /* bit0 from actor+6Dh */
        t = (unsigned char)(((t ^ af) & 2) ^ t);   /* bit1 from actor+6Dh */
        weapon[0x0D] = t; /* 88 57 0D after 3 pushes, before call */
        BattleAnimation_StartClip(weapon, weapon + 0x0C, clip_id); /* add esp,0Ch */
    }

    /* lea ecx,[esi+6Ch] THEN add esi,60h; state uses original actor */
    return BattleAnimation_StartClip(
        (void *)(actor + 0x60),
        (void *)(actor + 0x6C),
        clip_id); /* add esp,0Ch; EAX leftover */
}
```
