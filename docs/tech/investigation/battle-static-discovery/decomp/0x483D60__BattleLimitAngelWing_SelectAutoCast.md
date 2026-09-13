# BattleLimitAngelWing_SelectAutoCast @ 0x483D60

- Instr (live): 109
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1265
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=1374
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=657
- A==B: non
- Push IDB: oui
- SetType: _WORD *__cdecl BattleLimitAngelWing_SelectAutoCast(int, _DWORD *, int *, _WORD *);
- Notes parent: F_CHAR stride 0x1D0 (pas slot 0xD0) ; 32 magies BYTE +0x82 stride 5 ; K_MAGIC defaultTarget BYTE +0x0A stride 0x3C ; GetRandomInt AL + and 0FFh puis %32 (jns) wrap &0x1F ; command DWORD 2/1 ; target WORD 66 ; loc_483E58 EAX=arg_4 ptr ; fallback AX GetRandomMonsterMask ; pas de jpt_ ; pas de add esp.

## C réconcilié

```c
/* BattleLimitAngelWing_SelectAutoCast @ 0x483D60
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 109 instr, size 0x146. IDA type _WORD *__cdecl(int, _DWORD *, int *, _WORD *).
 * Two retn: magic path EAX leftover = arg_C ; fallback EAX leftover = GetRandomMonsterMask.
 * cdecl 4 args; callee does not add esp.
 */

extern unsigned char F_CHAR_DATA[]; /* 0x1CFF000 ; row stride 0x1D0 */
extern unsigned char K_MAGIC[];     /* 0x1CF4064 ; stride 0x3C ; defaultTarget BYTE +0x0A */

extern unsigned char __cdecl Battle_GetRandomInt(void); /* AL only; 0 args, no add esp */
extern unsigned short BattleTarget_GetEveryoneMask(void);
extern unsigned short BattleTarget_GetRandomMonsterMask(void);
extern unsigned short BattleTarget_GetRandomPartyMask(void);
extern unsigned short BattleTarget_GetAllEnemyMask(void);
extern unsigned short BattleTarget_GetAllPartyMask(void);

_WORD *__cdecl BattleLimitAngelWing_SelectAutoCast(
    int char_index,
    _DWORD *command_out,
    int *magic_id_out,
    _WORD *target_mask_out)
{
    unsigned char *fchar; /* esi */
    unsigned int count;   /* edi */
    unsigned int edx;     /* 32-slot counter */
    unsigned char *ecx;   /* inventory cursor */
    unsigned int slot;    /* ecx after GetRandomInt */
    unsigned int magic;    /* eax: BYTE id zext, or 0xFF sentinel */
    unsigned char dt;     /* cl = K_MAGIC.defaultTarget */
    unsigned int mask;    /* EAX from target helper, or arg_4 pointer on 0x30 */
    unsigned int flags;   /* edx in loc_483E5C */

    /* lea ecx,[eax*8]; sub ecx,eax; lea esi,[eax+ecx*4]; shl esi,4 ; add F_CHAR_DATA
     * = char_index * 0x1D0. Not BATTLE_SLOT 0xD0. */
    fchar = &F_CHAR_DATA[(unsigned int)char_index * 0x1D0];

    /* loc_483D8B: edx=20h ; ecx=esi+82h ; bl=40h stays for the whole function */
    count = 0;
    edx = 0x20;
    ecx = fchar + 0x82;
    do {
        magic = ecx[0]; /* mov al,[ecx] ; BYTE */
        if (magic != 0) {
            magic &= 0xFF; /* 25 FF 00 00 00 after mov al */
            /* test K_MAGIC.defaultTarget[id*3Ch], bl */
            if ((K_MAGIC[magic * 0x3C + 0x0A] & 0x40) != 0)
                count++; /* inc edi */
        }
        ecx += 5; /* add ecx,5 */
        edx--;
    } while (edx != 0); /* dec edx ; jnz loc_483D8B */

    if (count == 0) {
        magic = 0xFF; /* loc_483DAC */
        goto loc_483DFA;
    }

    /* loc_483DB3: GetRandomInt AL only, then and eax,0FFh, then MSVC signed % 32
     * (and ecx,8000001Fh ; jns). r is 0..255 so jns always; slot = r % 32. */
    slot = (unsigned int)(Battle_GetRandomInt() & 0xFF);
    slot = slot % 32;

    for (;;) {
        /* loc_483DCC: lea edx,[esi+ecx*4+68h] ; mov al,[ecx+edx+1Ah]
         * = fchar + slot*5 + 0x82 */
        magic = fchar[0x82 + slot * 5];
        if (magic != 0) {
            magic &= 0xFF;
            if ((K_MAGIC[magic * 0x3C + 0x0A] & 0x40) != 0)
                break; /* jnz loc_483DEE */
        }
        slot = (slot + 1) & 0x1F; /* loc_483DE8 */
    }

    /* loc_483DEE: xor edx,edx ; mov dl,[id] ; mov eax,edx */
    magic = (unsigned int)fchar[0x82 + slot * 5];

loc_483DFA:
    *magic_id_out = (int)magic; /* 89 06 DWORD, including sentinel 0xFF */

    if (magic == 0xFF)
        goto loc_483E8A; /* cmp eax,0FFh ; jz after the DWORD store */

    /* imul eax,3Ch ; mov dword ptr [ecx],2 */
    *command_out = 2;
    dt = K_MAGIC[magic * 0x3C + 0x0A]; /* xor ecx,ecx ; mov cl, defaultTarget */

    /* and eax,30h dispatch ; test bl,cl uses leftover 40h in bl */
    if ((dt & 0x30) == 0) {
        /* loc_483E46 */
        if ((dt & 0x40) != 0)
            mask = BattleTarget_GetAllEnemyMask();
        else
            mask = BattleTarget_GetAllPartyMask();
    } else if ((dt & 0x30) == 0x10) {
        /* loc_483E34 */
        if ((dt & 0x40) != 0)
            mask = BattleTarget_GetRandomMonsterMask();
        else
            mask = BattleTarget_GetRandomPartyMask();
    } else if ((dt & 0x30) == 0x20) {
        mask = BattleTarget_GetEveryoneMask();
    } else {
        /* loc_483E58: (dt & 30h) == 30h ; mov eax, [esp+arg_4] */
        mask = (unsigned int)command_out;
    }

    /* loc_483E5C: mov edx,[esi] ; imul 3Ch ; reload defaultTarget BYTE */
    dt = K_MAGIC[(unsigned int)(*magic_id_out) * 0x3C + 0x0A];
    flags = 0; /* xor edx,edx */
    if ((dt & 1) != 0)
        flags = 0x4000; /* loc_483E70 */
    /* loc_483E75: test cl,2 ; jz ; or dh,20h */
    if ((dt & 2) != 0)
        flags |= 0x2000;
    flags |= mask; /* or edx,eax */
    *target_mask_out = (unsigned short)flags; /* 66 89 10 WORD */
    return target_mask_out; /* EAX = arg_C */

loc_483E8A:
    *command_out = 1;  /* C7 DWORD Attack */
    *magic_id_out = 0; /* C7 DWORD */
    mask = BattleTarget_GetRandomMonsterMask();
    *target_mask_out = (unsigned short)mask; /* 66 89 02 */
    return (_WORD *)mask; /* EAX leftover = GetRandomMonsterMask */
}
```
