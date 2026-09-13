# BS_StageMusicAndActorInit @ 0x503040

- Instr (live): 116
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=3215
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=440
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=420
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BS_StageMusicAndActorInit(unsigned char *ctx)
- Notes parent: Switch BYTE [ctx+0Dh] ja unsigned, jpt 4 cases. Case 1 jl signed FILE_RESULT skip inc. Stride acteurs 0x9C (3) pas 0xD0. test BYTE [esi],2 seulement (pas occupancy 1+2). test al,1Ah ; and 400h. Paires +2 jusqu'à B8B7EC jl ; edi==6 anim 0x12. Case 3 EAX=2 + BYTE [*(ctx+10h)+1]=FF. Pas de 66/setcc.

## C réconcilié

```c
/* BS_StageMusicAndActorInit @ 0x503040
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 116 instr, size 0x13F, end 0x50317F. cdecl, 1 arg ctx. retn C3.
 * Switch unsigned BYTE [ctx+0Dh] via xor eax,eax / 8A 45 0D; cmp eax,3; ja def.
 * jpt_50304F @ 0x503180 (4 DWORD): 503056/503075/503094/5030B7.
 * Case 0/1/2: inc BYTE [ctx+0Dh], EAX=0. Case 1 jl signed on FILE_RESULT skips inc.
 * Case 3: jz if BYTE [ctx+0Eh]==0; else actors stride 0x9C bound word_1D97494;
 *   test BYTE [actor],2 (not occupancy 1+2); test al,1Ah on DWORD [actor+8];
 *   and eax,400h; pair scan BYTE +2 to byte_B8B7EC jl; edi==6 -> anim 0x12.
 *   ebx := EAX sub_5022C0. BYTE [*(ctx+10h)+1]=0xFF. EAX=2.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / GetRandomInt: absent.
 * No 66. No setcc. No domain::.
 */

extern unsigned char *BS_Location_4;              /* 0xB6D08C DWORD ptr */
extern int BATTLE_PRESENTATION_FILE_RESULT;       /* 0x1D999C8 DWORD, signed jl */
extern unsigned char g_BattlePresentationActors[]; /* 0x1D972C0 */
extern unsigned char word_1D97494[];               /* 0x1D97494 loop bound address */
extern unsigned char g_ActorSectionPairs[];        /* 0xB8B7E0 */
extern unsigned char byte_B8B7E1[];                /* 0xB8B7E1 pairs+1 */
extern unsigned char byte_B8B7EC[];                /* 0xB8B7EC pair scan end */

extern int __cdecl BattleFile_CharacterLoad(int file_id, int base);
extern int __cdecl sub_501B40(int a);
extern int __cdecl BS_MusicSetupCopyAndRegister(unsigned int *header, unsigned char *flag);
extern int __cdecl sub_501B10(int a, int b);
extern char *__cdecl sub_509CD0(int actor, unsigned int mask);
extern unsigned int *__cdecl sub_5022C0(int actor, unsigned int *handle, unsigned int *section);
extern void __cdecl BattlePresentation_StartActorAnimation(int actor, int anim);
extern void __cdecl sub_5064F0(int resource);

int __cdecl BS_StageMusicAndActorInit(unsigned char *ctx)
{
    unsigned int state;
    unsigned char *base;
    unsigned char *actor;
    unsigned char *pairs;
    unsigned int *ebx_handle;
    int edi;
    unsigned int flags;
    unsigned int sec_idx;
    unsigned int *sec_ptr;
    unsigned char *node;

    state = ctx[0x0D]; /* xor eax,eax; mov al,[ebp+0Dh] */
    if (state > 3)     /* cmp eax,3; ja def_50304F unsigned */
        return 0;

    switch (state) {
    case 0: /* loc_503056 */
        BattleFile_CharacterLoad(0x2FE, (int)BS_Location_4);
        ctx[0x0D]++; /* 8A 45 0D; FE C0; 88 45 0D */
        return 0;

    case 1: /* loc_503075 */
        if (BATTLE_PRESENTATION_FILE_RESULT < 0) /* test eax,eax; jl def */
            return 0;
        sub_501B40(3);
        ctx[0x0D]++;
        return 0;

    case 2: /* loc_503094 */
        base = (unsigned char *)BS_Location_4;
        BS_MusicSetupCopyAndRegister(
            (unsigned int *)(base + *(unsigned int *)(base + 4)),
            &ctx[0x0E]);
        ctx[0x0D]++;
        return 0;

    case 3: /* loc_5030B7 */
        if (ctx[0x0E] == 0) /* 8A 45 0E; test al,al; jz def */
            return 0;

        sub_501B10(0, 0x7F); /* push 7Fh; push 0; add esp,8 */

        base = (unsigned char *)BS_Location_4;
        ebx_handle = (unsigned int *)(base + *(unsigned int *)(base + 0x24));

        for (actor = g_BattlePresentationActors;
             (int)actor < (int)word_1D97494; /* cmp esi,offset; jl signed */
             actor += 0x9C) {
            if ((actor[0] & 2) == 0) /* F6 06 02; jz loc_50314D */
                continue;

            flags = *(unsigned int *)(actor + 8); /* 8B 46 08 */
            if ((unsigned char)flags & 0x1A)      /* A8 1A; jnz loc_50314D */
                continue;

            sub_509CD0((int)actor, flags & 0x400); /* 25 00 04 00 00; add esp,8 */

            edi = 0;
            pairs = g_ActorSectionPairs;
            for (;;) {
                if (actor[4] == pairs[0]) /* 8A 4E 04; 3A 08 */
                    break;
                pairs += 2;
                edi++;
                if ((int)pairs >= (int)byte_B8B7EC) /* jl loc_503101 */
                    goto loc_50313D;
            }

            /* loc_503112: xor eax,eax; 8A 04 7D E1 B7 B8 00 */
            sec_idx = byte_B8B7E1[edi * 2];
            base = (unsigned char *)BS_Location_4;
            sec_ptr = (unsigned int *)(base + *(unsigned int *)(base + sec_idx * 4 + 4));
            ebx_handle = sub_5022C0((int)actor, ebx_handle, sec_ptr);
            BattlePresentation_StartActorAnimation((int)actor, 1); /* add esp,14h */

        loc_50313D:
            if (edi == 6)
                BattlePresentation_StartActorAnimation((int)actor, 0x12); /* add esp,8 */
        }

        base = (unsigned char *)BS_Location_4;
        sub_5064F0((int)(base + *(unsigned int *)(base + 8)));
        node = *(unsigned char **)(ctx + 0x10); /* 8B 55 10 */
        node[1] = 0xFF;                         /* C6 42 01 FF */
        return 2;                               /* B8 02 00 00 00 */
    }

    return 0; /* def_50304F */
}
```
