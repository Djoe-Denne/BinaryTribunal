# BattlePresentation_StartActorAnimation @ 0x505C00

- Instr (live): 42
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=781
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=632
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=817
- A==B: non
- Push IDB: oui
- SetType: void __cdecl BattlePresentation_StartActorAnimation(int actor, int animId)
- Notes parent: animId==0 abort. BYTE [actor+8]&0x18 exige bit 0x1000 puis `and bh,0EFh`. [+8Ch]==0 → sub_505BC0 add esp,8. Sinon BdLink sub_505C70 add esp,4 ; DWORD node+0Ch ; BYTE node+15h=bl ; walk +8Ch ; test BYTE [esi],2 (pas occupancy 1+2) ; 66 AND WORD [*(+74)+2Ch],0xFFBF. void. Pas de 0xD0/0x1D0.

## C réconcilié

```c
/* BattlePresentation_StartActorAnimation @ 0x505C00
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 42 instr, size 0x6E, end 0x505C6E. cdecl, 2 args. retn C3. void (no EAX write).
 * Gate: BYTE [actor+8] & 0x18 then require animId bit 0x1000 (test bh,10h).
 * and bh,0EFh then: [actor+8Ch]==0 -> sub_505BC0(actor, ebx) add esp,8
 * else au_re_BdLinkTask_0(sub_505C70) add esp,4; DWORD [node+0Ch]=actor; BYTE [node+15h]=bl;
 *   walk [ +8Ch ] chain: test BYTE [esi],2; 66 AND WORD [*(esi+74h)+2Ch], 0xFFBF; stop if next==start or NULL.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent. No setcc. No jpt.
 * No domain::.
 */

extern int __cdecl au_re_BdLinkTask_0(int callback); /* 0x506C10 */
extern int __cdecl sub_505BC0(int actor, int animId); /* 0x505BC0 */
extern int __cdecl sub_505C70(int node);              /* 0x505C70 address only */

void __cdecl BattlePresentation_StartActorAnimation(int actor, int animId)
{
    unsigned int anim; /* ebx */
    int walk;          /* esi */
    int start;         /* ecx */
    int node;          /* eax BdLink */
    int state;         /* eax [esi+74h] */

    anim = (unsigned int)animId;
    if (anim == 0) /* test ebx,ebx / jz loc_505C6B */
        return;

    walk = actor; /* mov esi, [esp+8+arg_0] — pointer, not deref */

    if ((*(unsigned char *)(walk + 8) & 0x18) != 0) { /* F6 46 08 18 */
        if ((anim & 0x1000u) == 0) /* F6 C7 10 test bh,10h */
            return;
    }

    /* loc_505C19: 8B 86 8C 00 00 00 then 80 E7 EF */
    anim &= ~0x1000u;
    if (*(int *)(walk + 0x8C) == 0) {
        sub_505BC0(walk, (int)anim); /* loc_505C61: push ebx; push esi; add esp,8 */
        return;
    }

    node = au_re_BdLinkTask_0((int)sub_505C70); /* push offset; add esp,4 */
    if (node == 0)
        return;

    *(int *)(node + 0x0C) = walk;                        /* 89 70 0C DWORD */
    *(unsigned char *)(node + 0x15) = (unsigned char)anim; /* 88 58 15 BYTE bl */

    start = walk; /* ecx */
    for (;;) { /* loc_505C44; edx=0xFFBF once */
        if ((*(unsigned char *)walk & 2) != 0) { /* F6 06 02; not occupancy 1+2 */
            state = *(int *)(walk + 0x74); /* 8B 46 74 */
            *(unsigned short *)(state + 0x2C) &= (unsigned short)0xFFBF; /* 66 21 50 2C */
        }
        walk = *(int *)(walk + 0x8C); /* loc_505C50 */
        if (walk == start) /* cmp esi,ecx / jz loc_505C6B */
            return;
        if (walk == 0) /* test esi,esi / jnz loc_505C44 else pop/pop/retn */
            return;
    }
}
```
