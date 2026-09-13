# SceneOut_InitEnemySlot @ 0x48AD10

- Instr (live): 77
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=16
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=40
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=13
- A==B: non
- Push IDB: oui
- SetType: WORD __cdecl SceneOut_InitEnemySlot(void)
- Notes parent: 0 args. edi=TARGET_SLOT_ID&0xFF ; esi=ATTACKER_SLOT_ID_0[3] BYTE. ebx=7-edi. visible DWORD+AND 0xFF (pas de test !=0 avant isBi). targetable BYTE +6 ; loaded BYTE +5. flag +0x7C stride 0xD0 : OR 2/0x40 DWORD ; OR 0x80 = `or cl,80h` + store DWORD. add esp 18h/8/8/0Ch. EAX=WORD InitPos. Pas occupancy 1+2, pas 66, pas setcc, pas jpt. A stride 0x100 faux.

## C réconcilié

```c
/* SceneOut_InitEnemySlot @ 0x48AD10
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 77 instr, size 0xE0. IDA type WORD(). No args. No domain::.
 * Slot stride 0xD0. No occupancy walk/test. No 66. No setcc. No jpt_.
 * ebx = 7 - (TARGET_SLOT_ID & 0xFF). jz skip each optional OR.
 * visible: DWORD load + AND 0xFF then isBi (always called; no extra !=0).
 * flag 0x02 / 0x40: DWORD OR. flag 0x80: or cl,80h then DWORD store.
 * add esp 18h / 8 / 8 / 0Ch. EAX = last callee WORD.
 */

extern unsigned int TARGET_SLOT_ID;              /* 0x1D28DFC */
extern unsigned char ATTACKER_SLOT_ID_0[];       /* 0x1D28DF8; slot BYTE at +3 */
extern unsigned char CURRENT_ENCOUNTER_DATA_SCENE_OUT[]; /* 0x1D287DC FF8SceneOut 0x80 */
extern unsigned char BATTLE_SLOT_DATA[];         /* 0x1D27B10 */

int __cdecl setMonsterInfoFromDatInfoSection(unsigned int p_slot_id, int p_level_code,
                                             unsigned char p_com_id);
unsigned int __cdecl computeMonsterHP(int p_attacker_slot_id);
BOOL __cdecl isBiAtpositionInIntegerSet(int integer_to_check, char bit_position);
unsigned char *__cdecl sub_48C8A0(int p_attacker_slot_id);
int *__cdecl Battle_InitDrawSpellAvailability(void);
char *sub_4ADCF0(void);
WORD __cdecl Battle_InitEnemySlotPositionFromScene(int param_attacker_slot_id,
                                                   int param_target_slot_id);

WORD __cdecl SceneOut_InitEnemySlot(void)
{
    unsigned int scene_idx;
    unsigned int slot;
    unsigned char com_id;
    unsigned char level_code;
    int bit_pos;
    unsigned int visible;
    unsigned int flags;
    unsigned char *p_flag;

    scene_idx = TARGET_SLOT_ID & 0xFFu; /* 8B 3D; 81 E7 FF */
    slot = ATTACKER_SLOT_ID_0[3];       /* 33 C0; A0 ...+3 */

    com_id = CURRENT_ENCOUNTER_DATA_SCENE_OUT[0x38 + scene_idx]; /* +0x38 BYTE */
    level_code = CURRENT_ENCOUNTER_DATA_SCENE_OUT[0x78 + scene_idx]; /* +0x78 BYTE */

    setMonsterInfoFromDatInfoSection(slot, (int)level_code, com_id);
    computeMonsterHP((int)slot);

    /* a1 visible @ +4; ebx=7; sub ebx,edi; 25 FF; isBi; add esp,18h */
    visible = *(unsigned int *)&CURRENT_ENCOUNTER_DATA_SCENE_OUT[4] & 0xFFu;
    bit_pos = 7 - (int)scene_idx;
    if (isBiAtpositionInIntegerSet((int)visible, (char)bit_pos)) {
        p_flag = &BATTLE_SLOT_DATA[slot * 0xD0 + 0x7C];
        flags = *(unsigned int *)p_flag;
        flags |= 2u; /* 83 C9 02 DWORD */
        *(unsigned int *)p_flag = flags;
    }
    /* loc_48AD7B */

    if (isBiAtpositionInIntegerSet((int)CURRENT_ENCOUNTER_DATA_SCENE_OUT[6],
                                   (char)bit_pos)) { /* BYTE +6 targetable; add esp,8 */
        p_flag = &BATTLE_SLOT_DATA[slot * 0xD0 + 0x7C];
        flags = *(unsigned int *)p_flag;
        flags |= 0x40u; /* 83 CA 40 DWORD */
        *(unsigned int *)p_flag = flags;
    }
    /* loc_48ADA7 */

    if (isBiAtpositionInIntegerSet((int)CURRENT_ENCOUNTER_DATA_SCENE_OUT[5],
                                   (char)bit_pos)) { /* BYTE +5 loaded; add esp,8 */
        p_flag = &BATTLE_SLOT_DATA[slot * 0xD0 + 0x7C];
        flags = *(unsigned int *)p_flag;          /* 8B 08 */
        *(unsigned char *)&flags |= 0x80u;        /* 80 C9 80 */
        *(unsigned int *)p_flag = flags;          /* 89 08 */
    }
    /* loc_48ADD2 */

    sub_48C8A0((int)slot);
    Battle_InitDrawSpellAvailability();
    sub_4ADCF0();
    return Battle_InitEnemySlotPositionFromScene((int)slot, (int)scene_idx);
    /* add esp,0Ch; pop edi/esi/ebx; retn — EAX leftover */
}
```
