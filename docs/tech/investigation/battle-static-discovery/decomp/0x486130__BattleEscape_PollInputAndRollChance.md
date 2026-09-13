# BattleEscape_PollInputAndRollChance @ 0x486130

- Instr (live): 108
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1730
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=5043
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=5346
- A==B: non
- Push IDB: oui
- SetType: char __cdecl BattleEscape_PollInputAndRollChance()
- Notes parent: jpt_486187 ja unsigned BACK-1 (1,2->0x10 ; 3,4->0xFF) ; default compte ennemis status_1 BYTE 0x25 / status_2 DWORD 0x4001 puis deux scans **monster+0xFE (0x10 puis 0x08) stride 0xD0 jl ; hold idiv 60 ; isRandomProbaNumDen255(num,255) add esp 8 ; pas de GetRandomInt ici ; flag_data BYTE bit0 slots 0..2 ; leftover EAX.

## C réconcilié

```c
/* BattleEscape_PollInputAndRollChance @ 0x486130
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 108 instr, size 0x156. IDA type char __cdecl(). Leftover EAX on every retn
 * (not a 0/1 status). Unique caller BattleATB_TickAndReady @ 0x484485.
 * GetRandomInt is NOT in this function (only inside isRandomProbaNumDen255).
 */

extern unsigned char BATTLE_ESCAPE_CANNOT_ESCAPE_PENDING; /* 0x1D27B0D BYTE */
extern unsigned char BATTLE_ESCAPE_INPUT_LATCH;           /* 0x1D28DED BYTE */
extern unsigned char ENCOUTER_BATTLE_FLAG;                /* 0x1CFF6E2 BYTE */
extern unsigned char BACK_PREEMTIVE_INFO;                 /* 0x1D28E08 BYTE */
extern unsigned char BATTLE_ESCAPE_STATE;                 /* 0x1D28DE8 BYTE */
extern unsigned char BATTLE_SLOT_DATA[];                   /* 0x1D27B10 stride 0xD0 */

extern int __cdecl BattleUI_GetEscapeInputActive(void); /* AL only; 0 args, no add esp */
extern int __cdecl BattleUI_GetEscapeHoldFrames(void);  /* full EAX; cdq/idiv 60 */
extern unsigned int __cdecl BattleTarget_IsEligibleByStatus(int slot_index); /* add esp,4 */
extern int __cdecl isRandomProbaNumDen255(int numerator, int denominator); /* add esp,8 */

char __cdecl BattleEscape_PollInputAndRollChance(void)
{
    unsigned char *p;
    unsigned char *mi;
    int numerator; /* ebp */
    int count;     /* ecx in def_486187 */
    int slot;      /* edi */
    int rolled;
    int hold;

    BATTLE_ESCAPE_CANNOT_ESCAPE_PENDING = 0;

    /* mov BATTLE_ESCAPE_INPUT_LATCH, al — AL only */
    BATTLE_ESCAPE_INPUT_LATCH = (unsigned char)BattleUI_GetEscapeInputActive();

    /* test al,al / jz loc_486272 */
    if (BATTLE_ESCAPE_INPUT_LATCH == 0) {
        /* mov al, STATE; cmp al,2; jz loc_486282; else STATE=0.
         * Store does not write EAX; leftover AL = STATE at the cmp. */
        rolled = (unsigned char)BATTLE_ESCAPE_STATE;
        if ((unsigned char)rolled != 2)
            BATTLE_ESCAPE_STATE = 0;
        return (char)rolled;
    }

    /* test byte ptr ENCOUTER_BATTLE_FLAG, 1 / jz loc_486165 */
    if (ENCOUTER_BATTLE_FLAG & 1) {
        BATTLE_ESCAPE_CANNOT_ESCAPE_PENDING = 1;
        return (char)BATTLE_ESCAPE_INPUT_LATCH; /* leftover AL = latch (nonzero) */
    }

    /* loc_486165: cdq; mov ecx,3Ch; idiv ecx; test edx,edx; jnz loc_486282
     * one call only; leftover EAX = signed quotient. */
    hold = BattleUI_GetEscapeHoldFrames();
    if (hold % 60 != 0)
        return (char)(hold / 60);

    /* xor eax,eax; mov al, BACK; dec eax; cmp eax,3; ja def (UNSIGNED).
     * jpt_486187: [0]=[1]=loc_48618E, [2]=[3]=loc_486224. */
    switch (BACK_PREEMTIVE_INFO) {
    case 1:
    case 2:
        numerator = 0x10; /* loc_48618E */
        break;
    case 3:
    case 4:
        numerator = 0xFF; /* loc_486224 */
        break;
    default:
        /* eax = BATTLE_SLOT_DATA.status_2+270h = 0x1D27D88
         * [eax+78h] BYTE mask 0x25 (= status_1 @ slot+0x80)
         * dword [eax] mask 0x4001. add 0D0h; cmp word_1D280C8; jl signed. */
        count = 0;
        p = (unsigned char *)0x1D27D88;
        while ((int)p < (int)0x1D280C8) {
            if (!(p[0x78] & 0x25) && !(*(unsigned int *)p & 0x4001))
                count++;
            p += 0xD0;
        }
        if (count == 0) {
            numerator = 0xFF; /* jz loc_486224 */
            break;
        }

        /* loc_4861C9: eax = monster_info_section+270h = 0x1D27D80
         * skip if BYTE [eax+80h] bit0. Else mov edx,[eax]; mov edx,[edx];
         * test [edx+0FEh], cl=10h → loc_486219 mov ebp,ecx. */
        p = (unsigned char *)0x1D27D80;
        while ((int)p < (int)0x1D280C0) {
            if (!(p[0x80] & 1)) {
                mi = *(unsigned char **)p;
                mi = *(unsigned char **)mi;
                if (mi[0xFE] & 0x10) {
                    numerator = 0x10;
                    goto loc_486229;
                }
            }
            p += 0xD0;
        }

        /* loc_4861F1: same walk, cl=8 → loc_48621D ebp=80h; else ebp=40h */
        p = (unsigned char *)0x1D27D80;
        while ((int)p < (int)0x1D280C0) {
            if (!(p[0x80] & 1)) {
                mi = *(unsigned char **)p;
                mi = *(unsigned char **)mi;
                if (mi[0xFE] & 0x08) {
                    numerator = 0x80;
                    goto loc_486229;
                }
            }
            p += 0xD0;
        }
        numerator = 0x40;
        break;
    }

loc_486229:
    /* xor edi,edi; esi = flag_data @ 0x1D27B8C; end flag_data+270h = 0x1D27DFC */
    slot = 0;
    p = (unsigned char *)0x1D27B8C;
    while ((int)p < (int)0x1D27DFC) {
        if (*p & 1) {
            if (BattleTarget_IsEligibleByStatus(slot)) {
                /* push 0FFh; push ebp; add esp,8 */
                rolled = isRandomProbaNumDen255(numerator, 0xFF);
                if (rolled)
                    BATTLE_ESCAPE_STATE = 1;
                return (char)rolled; /* leftover EAX = BOOL */
            }
        }
        p += 0xD0;
        slot++;
    }
    return (char)0; /* leftover EAX = last IsEligible 0, or walk ptr if never called */
}
```
