# Battle_HiddenDebug @ 0x47EEF0

- Instr (live): 261
- Palier: high (consigne >=200: `--effort high --max-tokens 65536`)
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=7962
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=11056
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=8548
- A==B: non
- Push IDB: oui
- SetType: int Battle_HiddenDebug(void)
- Notes parent: pas de jpt dans la fonction ; tail-jmp depuis `FFBattleDirector_battleLoop` mode 4 (btitle.ovl) ; spin WORD `mode_Battle_AnimationState` ; `BATTLE_HIDDEN_DEBUG_RELATED` WORD=2 ; 1F800008 WORD ; `nullsub_8(1F800000, …)` cdecl ; `Battle_UnusedDebug` 0 args EAX→esi ; idiom exit `(esi==-1)?3:8` ; `jl` signé queue GF 3 octets ; checksum KERNEL 0x9E08 ; EAX leftover MusicVolumeControl.

## C réconcilié

```c
/* Battle_HiddenDebug @ 0x47EEF0
 * Ground truth = live ASM (asm_clean.asm), not Hex-Rays.
 * 261 instr, size 0x430, range 0x47EEF0..0x47F31F.
 * cdecl int(); tail-jmp from FFBattleDirector_battleLoop mode 4 (btitle.ovl).
 * No jump table in this function. EAX leftover from BS_Debug_MusicVolumeControl.
 */

typedef unsigned char  BYTE;
typedef unsigned short WORD;
typedef unsigned int   DWORD;

extern WORD  mode_Battle_AnimationState;          /* 0x1CDBFE0 WORD cmp bx */
extern BYTE  Battle_Debug_AnimState;              /* 0x1D27AB0 BYTE */
extern BYTE  byte_1CFF6F0;
extern DWORD battleDebugRelated;
extern BYTE  g_AKAO_BattleBankLatch;                /* 0x1CFF6E9 */
extern WORD  ENCOUTER_BATTLE_FLAG;
extern DWORD dword_1CFF6EC;
extern BYTE  BATTLE_HIDDEN_DEBUG_RELATED_4;         /* BYTE */
extern WORD  BATTLE_HIDDEN_DEBUG_RELATED;         /* 66 C7 = WORD 2 */
extern WORD  word_1D13A9E;
extern WORD  BS_Debug_eight2;
extern WORD  word_1D13AA2;
extern WORD  word_1CFFA2A;
extern BYTE  byte_1CFF9D8, byte_1CFF9D9, byte_1CFF9DA, byte_1CFF9DB;
extern BYTE  byte_1D13A50, byte_1D13A51, byte_1D13A52, byte_1D13A53;
extern BYTE  POST_BATTLE_GF_ID_QUEUE[];            /* 0x1CFF6E4 byte[3] */
extern BYTE  byte_1CFF6E6;                         /* queue+2 */
extern DWORD dword_1CFF858;
extern DWORD dword_1CFF850;
extern DWORD dword_1CFF990;
extern DWORD BATTLE_HIDDEN_DEBUG_RELATED_0;
extern DWORD BATTLE_HIDDEN_DEBUG_RELATED_1;
extern DWORD BATTLE_HIDDEN_DEBUG_RELATED_5;
extern DWORD BATTLE_HIDDEN_DEBUG_RELATED_2;
extern DWORD dword_1CFF9B8;
extern DWORD dword_1CFF984;
extern DWORD dword_1CDBFD8;
extern DWORD dword_1CDC6E4;
extern WORD  COMBAT_SCENE_ID;
extern WORD  mode_StateGlobal;
extern WORD  credits_intro_music_channel;
extern BYTE  BS_Debug_MemorySpace1[];
extern BYTE  unk_1D13A38[];
extern BYTE  BS_Debug_RetAddressMemory[];
extern BYTE  unk_1D13A94[];
extern BYTE  KERNEL_HEADER[];
extern void *off_B6D090;
extern BYTE  g_AKAO_BattleBSS[];
extern BYTE  off_B810BC[];                         /* offset stored, not deref */
extern char  aMar132000[];                         /* "Mar 13 2000" */
extern char  a180556[];                            /* "18:05:56" */

extern void  j_BattleDebug_CopyStructuresUNK(void);
extern void  Call_Bs_ParseCamera(int a, int b);    /* (0xA0, 0x70); outer cdecl 8B */
extern void  Call_Bs_parseCamera2(int a);           /* (0x200) */
extern int   BS_Debug_memset(int buf, short, short, short, short);
extern int   ReturnWroteListAddress(int buf, short, short, short, short);
extern int   isDravingOverlayImage(WORD *rect, int, int, int); /* 4 stack args */
extern int   BS_Debug_related1(int);
extern void  nullsub_7(void);
extern int   BS_Debug_UNKNOWNVOID_testit(int, int, int, int); /* add esp 10h */
extern void  nullsub_4_used(int);                  /* dummy; add esp 4 */
extern DWORD *BS_Debug_UnknownFloatOperations(DWORD *p, int);
extern int   Battle_UnusedDebug(void);            /* 0 stack args; EAX -> esi */
extern void  nullsub_8(int, int, int, int);         /* ret-only; 4 dummy pushes */
extern int   Gpu_DrawOTagCurrent(unsigned ot_head);
extern unsigned int smPcReadFileReadAll(char *FileName, void *DstBuf);
extern int   xorEAX_0(void *dst, int);             /* xor eax,eax; ret; 2 dummy */
extern int   PlayMusic_SdMusicPlay(char *);        /* AX */
extern int   BS_Debug_MusicVolumeControl(unsigned int, int);

int Battle_HiddenDebug(void)
{
    WORD rect[4];                                 /* var_8/var_6/var_4/var_2 */
    int esi;
    unsigned int edi;
    DWORD buf;
    int vol_eax;

    /* loc_47EEF9 / loc_47EF02: WORD spin until animation state idle */
    while (mode_Battle_AnimationState != 0)
        ;
    Battle_Debug_AnimState = 0;                   /* 47EF0B BYTE bl; not in loc_47EF11 */

loc_47EF11:                                        /* full (re)init; handlers jmp here */
    byte_1CFF6F0 = 1;
    esi = 0;
    battleDebugRelated = 0;
    g_AKAO_BattleBankLatch = 0;
    ENCOUTER_BATTLE_FLAG = 0;
    dword_1CFF6EC = 0x4D2;
    BATTLE_HIDDEN_DEBUG_RELATED_4 = 0;
    BATTLE_HIDDEN_DEBUG_RELATED = 2;               /* WORD */

    j_BattleDebug_CopyStructuresUNK();
    Call_Bs_ParseCamera(0xA0, 0x70);
    Call_Bs_parseCamera2(0x200);
    Call_Bs_ParseCamera(0xA0, 0x70);
    Call_Bs_parseCamera2(0x200);

    /* add esp 40h cleans camera×2 + parse2×2 + memset×2 */
    BS_Debug_memset((int)BS_Debug_MemorySpace1, 0, 0, 0x140, 0xE0);
    BS_Debug_memset((int)unk_1D13A38, 0x140, 0, 0x140, 0xE0);
    ReturnWroteListAddress((int)BS_Debug_RetAddressMemory, 0x140, 0, 0x140, 0xE0);
    ReturnWroteListAddress((int)unk_1D13A94, 0, 0, 0x140, 0xE0);

    word_1D13A9E = 8;
    BS_Debug_eight2 = 8;
    word_1D13AA2 = 0xE0;                          /* edi still 0xE0 */
    word_1CFFA2A = 0xE0;
    byte_1CFF9D8 = 1;
    byte_1CFF9D9 = 0;
    byte_1CFF9DA = 0;
    byte_1CFF9DB = 0;
    byte_1D13A50 = 1;
    byte_1D13A51 = 0;
    byte_1D13A52 = 0;
    byte_1D13A53 = 0;

    rect[0] = 0;
    rect[1] = 0;
    rect[2] = 0x280;
    rect[3] = 0xE0;
    isDravingOverlayImage(rect, 0, 0, 0);
    BS_Debug_related1((int)BS_Debug_MemorySpace1);
    BS_Debug_related1((int)unk_1D13A38);          /* add esp 40h */
    nullsub_7();

    /* loc_47F06B: byte checksum KERNEL_HEADER, 0x9E08 bytes */
    edi = 0;
    {
        const BYTE *p = KERNEL_HEADER;
        unsigned int n = 0x9E08;
        do {
            edi += *p++;
        } while (--n != 0);
    }
    dword_1CFF858 = edi;

    /* loc_47F07D: 3-byte GF-id queue, jl signed < 3 */
    for (edi = 0; (int)edi < 3; edi++) {
        BYTE id = POST_BATTLE_GF_ID_QUEUE[edi];
        if (id != 0xFF)
            BS_Debug_UNKNOWNVOID_testit((id & 0xFF) + 5, 0, 0, 0);
    }

    edi = 1;
    *(WORD *)POST_BATTLE_GF_ID_QUEUE = 0xFFFF;    /* dx; bytes 0..1 */
    byte_1CFF6E6 = 0xFF;                           /* dl; queue+2 */
    nullsub_4_used(1);                             /* push edi */

loc_47F0BF:
    if (esi != 0)
        goto loc_47F2BB;

    /* cmp 1CFF850 vs MemorySpace1; clears packed between cmp and jnz */
    dword_1CFF990 = 0;
    BATTLE_HIDDEN_DEBUG_RELATED_0 = 0;
    BATTLE_HIDDEN_DEBUG_RELATED_1 = 0;
    BATTLE_HIDDEN_DEBUG_RELATED_5 = 0;
    BATTLE_HIDDEN_DEBUG_RELATED_2 = 0;
    if (dword_1CFF850 == (DWORD)BS_Debug_MemorySpace1)
        buf = (DWORD)unk_1D13A38;
    else
        buf = (DWORD)BS_Debug_MemorySpace1;
    dword_1CFF850 = buf;

    BS_Debug_UnknownFloatOperations((DWORD *)(buf + 0x70), 0x1000);
    BS_Debug_UnknownFloatOperations((DWORD *)(buf + 0x4070), 1); /* edi==1 */
    BS_Debug_UnknownFloatOperations((DWORD *)(buf + 0x4074), 1); /* add esp 18h */

    dword_1CFF9B8 = 0;
    dword_1CFF984 = 0;
    esi = Battle_UnusedDebug();                    /* 0 args */

    if (dword_1CFF9B8 != 0)
        goto loc_47F26F;
    if (dword_1CFF984 != 0)
        goto loc_47F2A2;

    /* PS1 scratch 1F800000: DWORD/WORD/WORD/WORD/DWORD. 1F800008 is WORD (66 89). */
    *(volatile DWORD *)0x1F800000 = buf + 0x4070;
    *(volatile WORD *)0x1F800004 = 0x1A;          /* bp */
    *(volatile WORD *)0x1F800006 = 0x16;
    *(volatile WORD *)0x1F800008 = 1;              /* di */
    *(volatile DWORD *)0x1F80000C = (DWORD)aMar132000;
    nullsub_8(0x1F800000, 0, 0, 0);                /* cdecl: last push = arg0 */

    *(volatile DWORD *)0x1F800000 = buf + 0x4070;
    *(volatile WORD *)0x1F800004 = 0x1D;
    *(volatile WORD *)0x1F800006 = 0x17;
    *(volatile WORD *)0x1F800008 = 1;
    *(volatile DWORD *)0x1F80000C = (DWORD)a180556;
    nullsub_8(0x1F800000, 0, 0, 0);

    *(volatile DWORD *)0x1F800000 = buf + 0x4070;
    *(volatile WORD *)0x1F800004 = 0x1A;
    *(volatile WORD *)0x1F800006 = 0x1A;
    *(volatile WORD *)0x1F800008 = 1;
    *(volatile DWORD *)0x1F80000C = (DWORD)off_B810BC; /* offset off_B810BC */
    nullsub_8(0x1F800000, (int)dword_1CFF858, 0, 0);

    dword_1CDBFD8 = buf;
    dword_1CDC6E4 = buf + 0x5C;
    Gpu_DrawOTagCurrent(buf + 0x4074);
    Gpu_DrawOTagCurrent(buf + 0x406C);
    Gpu_DrawOTagCurrent(buf + 0x4070);            /* add esp 3Ch */
    goto loc_47F0BF;

loc_47F26F:
    {
        int tr = BS_Debug_UNKNOWNVOID_testit(0, 0xFFFF, 0, 0);
        dword_1CFF9B8 = 0;
        if ((tr & 4) != 0) {                       /* test al,4 */
            COMBAT_SCENE_ID = (WORD)(tr >> 16);    /* sar eax,16 */
            Battle_Debug_AnimState = 1;
        }
        goto loc_47EF11;
    }

loc_47F2A2:
    BS_Debug_UNKNOWNVOID_testit(0x16, 7, 0, 0);
    dword_1CFF984 = 0;
    goto loc_47EF11;

loc_47F2BB:
    smPcReadFileReadAll("y:\\battle\\work\\btlmusic\\btlwave.dat", off_B6D090);
    xorEAX_0(off_B6D090, 1);
    smPcReadFileReadAll("y:\\battle\\work\\btlmusic\\btlmusic.dat", g_AKAO_BattleBSS);
    credits_intro_music_channel = (WORD)PlayMusic_SdMusicPlay((char *)g_AKAO_BattleBSS);
    vol_eax = BS_Debug_MusicVolumeControl(
        (unsigned)(int)(short)credits_intro_music_channel, 0x7F); /* add esp 24h */

    /* inc/neg/sbb esi,esi / and 5 / add 3  — this path only when esi != 0 */
    mode_StateGlobal = (WORD)((esi == -1) ? 3 : 8);
    return vol_eax;                               /* pops; add esp 8; retn */
}
```
