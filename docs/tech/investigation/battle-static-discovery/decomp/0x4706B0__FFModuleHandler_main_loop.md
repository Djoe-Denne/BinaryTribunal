# FFModuleHandler_main_loop @ 0x4706B0

- Instr (live): 570
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=19950
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=23142
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=21139
- A==B: non
- Push IDB: oui
- SetType: char __cdecl FFModuleHandler_main_loop(int)
- Notes parent: ja UNSIGNED mode-1>0Ah et ENGINE_VAR1>6 et dword_1CD2EEC>4. jge SIGNED GF index>=3. C6 BYTE 5 sur var_20. loc_470EEF = intro+mode9 seulement. def_4707D3 = pop/ret. TEST [VAR_MAP+0B7h],2. Occupancy/+44h GF Exists/OT07/24/COM/GetActiveWindow absents.

## C réconcilié

```c
/* FFModuleHandler_main_loop @ 0x4706B0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 570 instr, size 0x85d, end exclusive 0x470F0D. cdecl, 1 arg, ebx=0.
 * Return = leftover EAX/AL (char). Do not force 0.
 * ja 0F87/77 UNSIGNED. jge 7D SIGNED only at 0x470BA7. No jg.
 * C6 44 24 14 05 = BYTE store 5 into var_20 (not DWORD C7).
 * Occupancy 1+2 / 0xD0 / 0x1D0 / GF Exists / OT07 / code 24 ABSENT.
 * +44h is stack notation only. TEST [VAR_MAP+0B7h],2 present; BdLink TEST AL,2 clone ABSENT.
 * COM / GetActiveWindow / GetForegroundWindow / gfx_driver / presentation:: ABSENT.
 */

typedef unsigned char BYTE;
typedef unsigned short WORD;
typedef unsigned int DWORD;

extern WORD ENGINE_VAR1_RELATED_MUSIC;
extern WORD mode_StateGlobal;
extern BYTE globalFieldNextModuleID;
extern BYTE BATTLE_RESULT_CODE;
extern BYTE POST_BATTLE_GF_ID_QUEUE[3];
extern WORD COMBAT_SCENE_ID;
extern WORD MenuState_opcode_menu_id;
extern BYTE wanted_game_mode_byte_2036B4C;
extern BYTE wanted_game_mode_dword_2036B4E;
extern BYTE wanted_game_mode_2036B4F;
extern BYTE CAN_SAVE_HERE;
extern DWORD menu_disabled_dword_1CE4900;
extern DWORD dword_1CD2EE0, dword_1CD2EE4, dword_1CD2EE8, dword_1CD2EEC, dword_1CD2EF0;
extern DWORD dword_1CD2ED0, dword_1CD2ED8, dword_1CD2EDC;
extern WORD word_1CD2ED4;
extern DWORD reset_game_dword_1CD2ECC;
extern DWORD menu_id_dword_1D2BB98, dword_1D2BB9C;
extern DWORD menu_sub_id_dword_B87798;
extern WORD CURRENT_FIELD_ID;
extern WORD wm2field_FieldX, wm2field_FieldY, wm2field_FieldZ, wm2field_FieldTarget;
extern DWORD count;
extern DWORD dword_B80878;
extern WORD word_B8087C;
extern char Paths_2[];
extern char FileNamePointer[];
extern DWORD big_data_B6D068;
extern BYTE *VAR_MAP_ADDRESS;

extern int cd_detect_disk_number(void);
extern void nullsub_used_23(int);
extern unsigned int smPcReadFileReadAll(char *FileName, void *DstBuf);
extern int FFSwitchModule_set_game_loop(const void *, int);
extern int xorEAX_0(void);
extern int set_dword_1D2BA24_sub_49F520(int);
extern int input_structure_vibrate_init(void);
extern void empty_sub(int);
extern int sub_46B450(int, unsigned int);
extern void *non_opcode_sub_522200(void);
extern int Battle_KeepMusicAfterBattle(void *);
extern int sub_559520(int);
extern int sub_52D110(void);
extern char sub_470250(void);
extern char *strcpy(char *, const char *);
extern char *strcat(char *, const char *);

extern int cdcheck_init(void), cdcheck_exit_sub_52DCA0(void), cdcheck_main_loop(void);
extern int sub_52D970(void), pubintro_exit_sub_52DB90(void), FFIntroModule_credits_main_loop(void);
extern int field_init_sub_46FD70(void), FFFieldExitSystem(void), FFFieldModule_field_main_loop(void);
extern int worldmap_init(void), FFWorldExitSystem_worldmap_exit(void), FFWorldModule_worldmap_main_loop(void);
extern int FFBattleInitSystem(void), FFBattleExitSystem(void), FFBattleModule(void);
extern int FFBattleTransitionInitSystem(void), FFBattleTransitionExitSystem(void), FFBattleTransitionModule(void);
extern int menu_init_sub_4A2280(void), menu_exit_sub_4A22A0(void), menu_or_tuto_main_loop_1(void);

char __cdecl FFModuleHandler_main_loop(int game_object)
{
    DWORD var_24;
    DWORD var_20;
    DWORD desc[7];
    DWORD eax;
    DWORD ecx;
    DWORD edx;
    WORD ax, cx, dx;
    BYTE *esi;
    void *keep_arg;
    int was1;

    eax = 0;

    if (ENGINE_VAR1_RELATED_MUSIC == 0) {
        eax = cd_detect_disk_number();
        esi = VAR_MAP_ADDRESS;
        ecx = esi[0xCC];
        if (ecx != eax) {
            nullsub_used_23(1);
            strcpy(FileNamePointer, Paths_2);
            strcat(FileNamePointer, "wm2field.tbl");
            smPcReadFileReadAll(FileNamePointer, (void *)(big_data_B6D068 - 0x6C0));
            desc[2] = (DWORD)cdcheck_init;
            desc[3] = (DWORD)cdcheck_exit_sub_52DCA0;
            desc[4] = (DWORD)cdcheck_main_loop;
            desc[5] = 0;
            desc[6] = 0;
            eax = FFSwitchModule_set_game_loop(desc, game_object);
        }
    }
    esi = VAR_MAP_ADDRESS;

    if (globalFieldNextModuleID == 4) {
        eax = xorEAX_0();
        set_dword_1D2BA24_sub_49F520(0);
        input_structure_vibrate_init();
        empty_sub(3);
        desc[2] = (DWORD)sub_52D970;
        desc[3] = (DWORD)pubintro_exit_sub_52DB90;
        desc[4] = (DWORD)FFIntroModule_credits_main_loop;
        goto loc_470EEF;
    }

    eax = (DWORD)(int)(short)mode_StateGlobal;
    eax--;
    if (eax > 0xA)
        goto def_4707D3;

    switch (eax) {
    case 0:
        desc[2] = (DWORD)field_init_sub_46FD70;
        desc[3] = (DWORD)FFFieldExitSystem;
        desc[4] = (DWORD)FFFieldModule_field_main_loop;
        desc[5] = 0;
        desc[6] = 0;
        eax = FFSwitchModule_set_game_loop(desc, game_object);
        goto def_4707D3;

    case 1:
        eax = dword_1CD2EE4;
        if (eax == 0)
            goto loc_470923;
        if (--eax == 0)
            goto loc_470966;
        if (--eax != 0)
            goto def_4707D3;
        if (reset_game_dword_1CD2ECC != 0) {
            MenuState_opcode_menu_id = 0;
            globalFieldNextModuleID = 4;
            wm2field_FieldZ = 0x7FFF;
            eax = xorEAX_0();
            dword_1CD2EE4 = 0;
            return (char)eax;
        }
        ENGINE_VAR1_RELATED_MUSIC = 2;
        eax = (DWORD)(int)(signed char)wanted_game_mode_byte_2036B4C;
        if (--eax == 0)
            goto loc_4708AC;
        eax -= 2;
        if (eax == 0) {
            mode_StateGlobal = 3;
            dword_1CD2EE4 = 0;
            return (char)eax;
        }
        eax -= 2;
        if (eax != 0)
            goto loc_470915;
        mode_StateGlobal = 6;
        dword_1CD2EE4 = 0;
        return (char)eax;

    loc_4708AC:
        ecx = big_data_B6D068;
        eax = ecx - 0x6C0;
        ecx = (DWORD)(int)(signed char)wanted_game_mode_dword_2036B4E;
        dword_1CD2EDC = eax;
        edx = ecx + ecx * 2;
        cx = *(WORD *)(eax + edx * 8 + 6);
        CURRENT_FIELD_ID = cx;
        eax = eax + edx * 8;
        dx = *(WORD *)eax;
        wm2field_FieldX = dx;
        cx = *(WORD *)(eax + 2);
        wm2field_FieldY = cx;
        dx = *(WORD *)(eax + 4);
        wm2field_FieldZ = dx;
        ax = (WORD)*(BYTE *)(eax + 8);
        wm2field_FieldTarget = ax;
        mode_StateGlobal = 1;
        eax = sub_46B450(-1, 0);
    loc_470915:
        dword_1CD2EE4 = 0;
        return (char)eax;

    loc_470923:
        eax = (DWORD)(int)(short)ENGINE_VAR1_RELATED_MUSIC;
        if (eax > 6)
            goto def_47092F;
        switch (eax) {
        case 0:
            wanted_game_mode_byte_2036B4C = 6;
            goto def_47092F;
        case 1:
            non_opcode_sub_522200();
            wanted_game_mode_byte_2036B4C = 0;
            goto def_47092F;
        case 3:
            wanted_game_mode_byte_2036B4C = 2;
            goto def_47092F;
        case 6:
            wanted_game_mode_byte_2036B4C = 4;
            goto def_47092F;
        default:
            break;
        }
    def_47092F:
        dword_1CD2EE4 = 1;
    loc_470966:
        desc[2] = (DWORD)worldmap_init;
        desc[3] = (DWORD)FFWorldExitSystem_worldmap_exit;
        desc[4] = (DWORD)FFWorldModule_worldmap_main_loop;
        desc[5] = 0;
        desc[6] = 0;
        eax = FFSwitchModule_set_game_loop(desc, game_object);
        dword_1CD2EE4 = 2;
        return (char)eax;

    case 2:
    case 3:
        eax = dword_1CD2EE0;
        if (eax == 0)
            goto loc_470ADC;
        if (--eax != 0)
            goto def_4707D3;
        ax = BATTLE_RESULT_CODE;
        dword_1CD2EE0 = 0;
        if ((BYTE)ax == 5) {
            MenuState_opcode_menu_id = 0;
            globalFieldNextModuleID = 4;
            wm2field_FieldZ = 0x7FFF;
            return (char)ax;
        }
        if ((BYTE)ax == 1) {
            if (esi[0xB7] & 2)
                goto loc_470A9D;
            goto loc_470A74;
        }
        if ((BYTE)ax != 3)
            goto loc_470A9D;
        if (esi[0xB7] & 1)
            goto loc_470A95;
    loc_470A74:
        CURRENT_FIELD_ID = 0x4B;
        ENGINE_VAR1_RELATED_MUSIC = 0;
        mode_StateGlobal = 1;
        return (char)ax;
    loc_470A95:
        eax = *(DWORD *)(esi + 0x68);
        *(BYTE *)&eax &= 0xBF;
        *(DWORD *)(esi + 0x68) = eax;
    loc_470A9D:
        eax = 1;
        was1 = (ENGINE_VAR1_RELATED_MUSIC == 1);
        ENGINE_VAR1_RELATED_MUSIC = 3;
        mode_StateGlobal = 0xB;
        if (was1) {
            word_1CD2ED4 = (WORD)eax;
            return (char)eax;
        }
        word_1CD2ED4 = 2;
        return (char)eax;

    loc_470ADC:
        esi = (BYTE *)1;
        if (ENGINE_VAR1_RELATED_MUSIC == 1) {
            ax = MenuState_opcode_menu_id;
            ecx = count;
            COMBAT_SCENE_ID = ax;
            keep_arg = (void *)ecx;
            goto loc_470B37;
        }
        var_24 = dword_B80878;
        ax = word_B8087C;
        ecx = (DWORD)wanted_game_mode_dword_2036B4E
            | ((DWORD)wanted_game_mode_2036B4F << 8);
        *(WORD *)&var_20 = ax;
        COMBAT_SCENE_ID = (WORD)ecx;
        *(BYTE *)&var_20 = 5;
        keep_arg = &var_24;
    loc_470B37:
        Battle_KeepMusicAfterBattle(keep_arg);
        desc[2] = (DWORD)FFBattleTransitionInitSystem;
        desc[3] = (DWORD)FFBattleTransitionExitSystem;
        desc[4] = (DWORD)FFBattleTransitionModule;
        desc[5] = 0;
        sub_559520(0);
        desc[6] = 0;
        eax = FFSwitchModule_set_game_loop(desc, game_object);
        dword_1CD2EE0 = (DWORD)esi;
        return (char)eax;

    case 4:
    case 6:
        goto def_4707D3;

    case 5:
    case 9:
        eax = dword_1CD2EF0;
        if (eax == 0)
            goto loc_470E22;
        if (--eax == 0)
            goto loc_470D97;
        if (--eax != 0)
            goto def_4707D3;
        eax = dword_1D2BB9C;
        dword_1CD2ED8 = eax;
        if (ENGINE_VAR1_RELATED_MUSIC == 1) {
            if (eax & 1) {
                sub_52D110();
                ax = mode_StateGlobal;
                ax = (WORD)(ax - 6);
                eax = (ax != 0) ? 0xFFFFFFFCu : 0;
                eax += 0xA;
                ENGINE_VAR1_RELATED_MUSIC = (WORD)eax;
                eax = dword_1CD2ED8;
                mode_StateGlobal = 1;
                goto loc_470CEB;
            }
            ENGINE_VAR1_RELATED_MUSIC = 6;
            mode_StateGlobal = 1;
            goto loc_470CEB;
        }
        ENGINE_VAR1_RELATED_MUSIC = 6;
        mode_StateGlobal = 2;
    loc_470CEB:
        if (!(eax & 4)) {
            dword_1CD2EF0 = 0;
            return (char)eax;
        }
        cx = mode_StateGlobal;
        ENGINE_VAR1_RELATED_MUSIC = cx;
        mode_StateGlobal = 3;
        COMBAT_SCENE_ID = (WORD)((int)eax >> 16);
        if (mode_StateGlobal == 1) {
            keep_arg = (void *)count;
            goto loc_470D4C;
        }
        cx = word_B8087C;
        *(WORD *)&var_20 = cx;
        var_24 = dword_B80878;
        *(BYTE *)&var_20 = 5;
        keep_arg = &var_24;
    loc_470D4C:
        Battle_KeepMusicAfterBattle(keep_arg);
        desc[2] = (DWORD)FFBattleTransitionInitSystem;
        desc[3] = (DWORD)FFBattleTransitionExitSystem;
        desc[4] = (DWORD)FFBattleTransitionModule;
        desc[5] = 0;
        desc[6] = 0;
        sub_559520(0);
        eax = FFSwitchModule_set_game_loop(desc, game_object);
        dword_1CD2EE0 = 1;
        return (char)eax;

    loc_470D97:
        sub_470250();
        if (ENGINE_VAR1_RELATED_MUSIC == 1) {
            ecx = (DWORD)(int)(short)MenuState_opcode_menu_id;
            menu_id_dword_1D2BB98 = ecx;
            ecx = 0;
            *(BYTE *)&ecx = CAN_SAVE_HERE;
            menu_sub_id_dword_B87798 = ecx;
        } else {
            esi = VAR_MAP_ADDRESS;
            eax = 0;
            menu_id_dword_1D2BB98 = 0x80000000;
            eax = esi[0xD1];
            eax |= 1;
            menu_sub_id_dword_B87798 = eax;
        }
        desc[2] = (DWORD)menu_init_sub_4A2280;
        desc[3] = (DWORD)menu_exit_sub_4A22A0;
        desc[4] = (DWORD)menu_or_tuto_main_loop_1;
        desc[5] = 0;
        desc[6] = 0;
        eax = FFSwitchModule_set_game_loop(desc, game_object);
        dword_1CD2EF0 = 2;
        return (char)eax;

    loc_470E22:
        dword_1CD2EF0 = 1;
        return (char)eax;

    case 7:
        eax = dword_1CD2EE8;
        if (eax == 0)
            goto loc_4709D6;
        if (--eax != 0)
            goto def_4707D3;
        ENGINE_VAR1_RELATED_MUSIC = 3;
        mode_StateGlobal = 1;
        dword_1CD2EE8 = 0;
        return (char)eax;
    loc_4709D6:
        desc[2] = (DWORD)FFBattleInitSystem;
        desc[3] = (DWORD)FFBattleExitSystem;
        desc[4] = (DWORD)FFBattleModule;
        desc[5] = 0;
        desc[6] = 0;
        eax = FFSwitchModule_set_game_loop(desc, game_object);
        dword_1CD2EE8 = 1;
        return (char)eax;

    case 8:
        eax = menu_disabled_dword_1CE4900 & 0xFF;
        nullsub_used_23((int)eax);
        ax = (BYTE)menu_disabled_dword_1CE4900;
        if ((BYTE)ax != 1)
            goto def_4707D3;
        strcpy(FileNamePointer, Paths_2);
        strcat(FileNamePointer, "wm2field.tbl");
        smPcReadFileReadAll(FileNamePointer, (void *)(big_data_B6D068 - 0x6C0));
        cx = MenuState_opcode_menu_id;
        CURRENT_FIELD_ID = cx;
        ENGINE_VAR1_RELATED_MUSIC = 0;
        mode_StateGlobal = 1;
        desc[2] = (DWORD)cdcheck_init;
        desc[3] = (DWORD)cdcheck_exit_sub_52DCA0;
        desc[4] = (DWORD)cdcheck_main_loop;
        goto loc_470EEF;

    case 10:
        eax = dword_1CD2EEC;
        if (eax > 4)
            goto def_4707D3;
        if (eax == 0) {
            eax = 0;
            dword_1CD2ED0 = 0;
            goto loc_470BA9;
        }
        if (eax == 1) {
            eax = dword_1CD2ED0;
            if ((int)eax >= 3)
                goto loc_470C18;
            goto loc_470BA9;
        }
        if (eax == 2)
            goto loc_470BBC;
        if (eax == 3)
            goto loc_470C2A;
        goto loc_470C47;

    loc_470BA9:
        if (POST_BATTLE_GF_ID_QUEUE[eax] == 0xFF)
            goto loc_470C06;
        dword_1CD2EEC = 2;
    loc_470BBC:
        desc[2] = (DWORD)menu_init_sub_4A2280;
        desc[3] = (DWORD)menu_exit_sub_4A22A0;
        desc[4] = (DWORD)menu_or_tuto_main_loop_1;
        desc[5] = 0;
        desc[6] = 0;
        FFSwitchModule_set_game_loop(desc, game_object);
        ecx = dword_1CD2ED0;
        eax = 0;
        menu_sub_id_dword_B87798 = 0;
        eax = POST_BATTLE_GF_ID_QUEUE[ecx];
        eax += 5;
        menu_id_dword_1D2BB98 = eax;
    loc_470C06:
        dword_1CD2EEC = 3;
        return (char)eax;
    loc_470C18:
        dword_1CD2EEC = 4;
        return (char)eax;
    loc_470C2A:
        eax = dword_1CD2ED0 + 1;
        dword_1CD2ED0 = eax;
        dword_1CD2EEC = 1;
        return (char)eax;
    loc_470C47:
        dx = word_1CD2ED4;
        dword_1CD2EEC = 0;
        mode_StateGlobal = dx;
        return (char)eax;
    }

    goto def_4707D3;

loc_470EEF:
    desc[5] = 0;
    desc[6] = 0;
    eax = FFSwitchModule_set_game_loop(desc, game_object);

def_4707D3:
    return (char)eax;
}
```
