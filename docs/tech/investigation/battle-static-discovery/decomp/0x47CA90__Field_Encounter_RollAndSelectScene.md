# Field_Encounter_RollAndSelectScene @ 0x47CA90

- Instr (live): 115
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=3848
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=4032
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=6310
- A==B: non (A≠B≠C)
- Push IDB: oui
- SetType: `char Field_Encounter_RollAndSelectScene(void);` | ok (`char()` après)
- Notes parent: stride `idx*0x264+0x1FE` (shl 4 + *9 + *4) ; Enc-Half `test cl,4 / jz` = bit absent → rate pleine ; Enc-None bit 0x08 ; `jbe 0x100` / `jnb` unsigned ; magic `0x309E0185>>40` = signed `/1348` (0 mismatch sur tout int16) ; double deref rate/scènes, table région sans deref extra ; AL = module ou EAX du callee sur early-out. Réconciliation Grok 4.6 Extra High.

## C réconcilié

```c
/* Externs: widths as encoded in the live ASM (byte vs word). */
extern unsigned char  globalFieldNextModuleID;
extern unsigned char *VAR_MAP_ADDRESS;
extern unsigned short word_1CE4868;
extern unsigned char  byte_1CDC74C;
extern unsigned char  RARE_ITEM_ABILITY_IN_IT;
extern unsigned char **dword_1CF3D48;               /* ptr -> ptr -> rate byte */
extern unsigned short word_1CDC740;                 /* encounter meter */
extern short          word_1CD8FD0;                 /* signed region index (movsx) */
extern unsigned char *dword_1D9CF88;                /* region table base, stride 0x264 */
extern unsigned short word_1CDC74A;                 /* danger / threshold accumulator */
extern unsigned char  byte_1CD2FB8;                 /* shuffle / step counter */
extern unsigned char  byte_1CDC748;                 /* cycle bonus, += 0x0D on wrap */
extern unsigned char  byte_B80A18[256];             /* shuffled 256-entry table */
extern unsigned char  TOTAL_ENCOUNTER;
extern unsigned short **dword_1CF3D78;              /* ptr -> 4 x WORD scene IDs */
extern unsigned short word_1CDC6E0;                 /* last scene (anti-repeat) */
extern unsigned char  byte_1CD2EF8;
extern unsigned short MenuState_opcode_menu_id;

extern int sub_52B3A0(void);

char Field_Encounter_RollAndSelectScene(void)
{
    unsigned char   mod;
    unsigned char   abilities;
    unsigned char   rate;
    int             gate;
    int             idx;
    short           region_word;
    int             scaled;
    unsigned char   shuffle;
    unsigned short  roll;
    unsigned char   count;
    unsigned char   pick;
    unsigned short  last;
    unsigned short  scene;
    unsigned short *scenes;

    mod = globalFieldNextModuleID;
    if (mod == 1 || mod == 7)
        return (char)mod;                           /* AL = module id */

    gate = sub_52B3A0();
    if (gate != 0)
        return (char)gate;                          /* AL = low byte of callee EAX */

    if (VAR_MAP_ADDRESS[0xCF] != 0)
        return 0;

    if (word_1CE4868 == 4 || word_1CE4868 == 3 || word_1CE4868 == 2)
        return 0;

    if (byte_1CDC74C == 1)
        return 0;

    abilities = RARE_ITEM_ABILITY_IN_IT;
    if (abilities & 0x08)                           /* Enc-None: test cl,8 / jnz */
        return 0;

    /* dword_1CF3D48 -> pointer -> rate byte. test cl,4 / jz = bit 0x04 ABSENT -> full rate. */
    rate = **dword_1CF3D48;
    if (abilities & 0x04) {                         /* Enc-Half: shr al,1 then add cx */
        word_1CDC740 = (unsigned short)(word_1CDC740 + (unsigned char)(rate >> 1));
    } else {
        word_1CDC740 = (unsigned short)(word_1CDC740 + rate); /* movzx dx, byte */
    }

    if (word_1CDC740 <= 0x100)                      /* jbe unsigned: no step */
        return 0;
    word_1CDC740 &= 0xFF;                           /* and word, 0FFh */

    /* shl eax,4; add eax,ecx; lea eax,[eax+eax*8]; word [base+eax*4+0x1FE]
       = idx * 0x264 + 0x1FE (612), not *232. */
    idx = (int)word_1CD8FD0;                        /* movsx */
    region_word = *(short *)(dword_1D9CF88 + idx * 0x264 + 0x1FE);

    /* imul 0x309E0185; sar edx,8; shr eax,31; add edx,eax
       MSVC signed divide by 1348 toward 0. Magic = round(2^40 / 1348). */
    scaled = region_word / 1348;
    word_1CDC74A = (unsigned short)(word_1CDC74A + (unsigned short)scaled);

    shuffle = (unsigned char)(byte_1CD2FB8 + 1);    /* inc al, wrap */
    byte_1CD2FB8 = shuffle;
    if (shuffle == 0)                               /* jnz skips add when nonzero */
        byte_1CDC748 = (unsigned char)(byte_1CDC748 + 0x0D);

    /* dl = table[shuffle] + cycle bonus (byte add wraps); zero-extend to AX. */
    roll = (unsigned char)(byte_B80A18[shuffle] + byte_1CDC748);
    if (roll >= word_1CDC74A)                       /* jnb unsigned: no encounter */
        return 0;

    count = (unsigned char)(TOTAL_ENCOUNTER + 1);
    pick  = byte_B80A18[count];                     /* other lookup than threshold */
    last  = word_1CDC6E0;
    scenes = *dword_1CF3D78;                        /* [edx] then word at [eax+0/+2/+4/+6] */

    globalFieldNextModuleID = 3;
    byte_1CD2EF8 = 1;
    word_1CDC74A = 0;
    TOTAL_ENCOUNTER = count;

    /* Unsigned buckets. Anti-repeat falls into the next bucket. Last (+6) has none. */
    if (pick < 0x80) {
        scene = scenes[0];
        if (scene != last) {
            MenuState_opcode_menu_id = scene;
            word_1CDC6E0 = scene;
            return (char)scene;
        }
    }
    if (pick < 0xC0) {
        scene = scenes[1];
        if (scene != last) {
            MenuState_opcode_menu_id = scene;
            word_1CDC6E0 = scene;
            return (char)scene;
        }
    }
    if (pick < 0xF0) {
        scene = scenes[2];
        if (scene != last) {
            MenuState_opcode_menu_id = scene;
            word_1CDC6E0 = scene;
            return (char)scene;
        }
    }
    scene = scenes[3];
    MenuState_opcode_menu_id = scene;
    word_1CDC6E0 = scene;
    return (char)scene;
}
```
