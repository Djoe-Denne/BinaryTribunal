# WM_Encounter_RollAndSelectScene @ 0x541C80

- Instr (live): 183
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=10229 (retry high/65536 after auto length)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=12642 (retry high/65536 after auto length)
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=12092 (retry high/65536 after auto length)
- A==B: non
- Push IDB: oui
- SetType: int __cdecl WM_Encounter_RollAndSelectScene(_WORD *)
- Notes parent: stride record 4 {u8 region, u8 terrain, u16 set_id}. Occupancy 1+2 / F_CHAR 0x1D0 / GetRandomInt absents. Meter WORD 66 add puis jle signed vs 0x100. Mode4 rate jl 0x51, scene jl 0x50. ja/jbe unsigned (scan + poids). jge signed seuil vs loco+rate. AX movsx region. Stores BYTE 203FDC8/204038C. Pas de Hex-Rays.

## C réconcilié

```c
/* WM_Encounter_RollAndSelectScene @ 0x541C80
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 183 instr, size 0x289, end 0x541F09. IDA type int __cdecl(_WORD *). No domain::.
 * Occupancy 1+2 unused. F_CHAR 0x1D0 unused. GetRandomInt absent
 * (Encounter_RandomRollArray only). Record stride 4. WORD ops use 66.
 * ja/jbe unsigned; jle/jl/jge signed. No packed struct.
 */

extern unsigned char  RARE_ITEM_ABILITY_IN_IT;                 /* 0x1CFF6D8 BYTE */
extern int            world_currentVehicle;                    /* DWORD, jl/jle signed */
extern int            isStateOfMovement;                    /* DWORD */
extern int            WORLD_MAP_COORD_X;
extern int            WORLD_MAP_COORD_Y;
extern unsigned char *wmsetRegionTerrainEncounterSetSection;  /* ptr; [0]=u32 end_off */
extern unsigned char *wmsetRegionIdByCell;                  /* BYTE table via ptr */
extern unsigned char *Worldmap_weirdregister0_LocationDRAW; /* terrain at +0x0D */
extern unsigned short  word_2040A5C;                         /* meter WORD (66) */
extern unsigned char  LOCOMOTION_METHOD;                      /* 0x2040A5E BYTE */
extern unsigned char  byte_2036BD8;
extern unsigned char *wmsetEncounterRateTableMain;          /* BYTE via ptr */
extern unsigned char *wmsetEncounterRateTableMode4;
extern unsigned short *wmsetEncounterSceneTableMain;        /* WORD via ptr, *2 */
extern unsigned short *wmsetEncounterSceneTableMode4;
extern unsigned int   dword_203FDC8;                        /* BYTE store, DWORD reload */
extern unsigned int   dword_20409C4;
extern unsigned int   dword_2040A60;                        /* BYTE overlay +0/+1/+2 */
extern unsigned char  byte_2040A5F;                          /* cycle bonus, wrap +0x0D */
extern unsigned char  Encounter_RandomRollArray[];            /* 0xC75D20 */
extern unsigned int   dword_204038C;                        /* BYTE store threshold */
extern unsigned char  byte_C75F10;                           /* weight[0] */
extern unsigned char  byte_C75F11[];                          /* weights[1..] */
extern unsigned short  word_20400A0;                         /* last scene WORD */

extern int __cdecl wm_GetRegionNumber(int x, int y);          /* add esp,8; AX then movsx */

int __cdecl WM_Encounter_RollAndSelectScene(unsigned short *out_scene)
{
    unsigned char *base;
    unsigned char *end;
    unsigned char *rec;
    unsigned char *ov;
    unsigned char flags;
    int enc_half;
    int vehicle;
    int result;
    unsigned char region_id;
    unsigned char terrain;
    unsigned char locomotion;
    unsigned char mode;

    base = wmsetRegionTerrainEncounterSetSection;
    end = base + *(unsigned int *)base;
    result = 0;
    ov = (unsigned char *)&dword_2040A60;

    flags = RARE_ITEM_ABILITY_IN_IT;
    if (flags & 8)                                              /* Enc-None → loc_541F00 xor eax */
        return 0;

    enc_half = (flags >> 2) & 1;                               /* var_14 DWORD */

    vehicle = world_currentVehicle;
    if (!((vehicle >= 0 && vehicle <= 9) || vehicle == 0x80))  /* jl / jle signed, else cmp 80h */
        return result;                                          /* loc_541EF6 */

    if (isStateOfMovement == 0)
        return result;

    region_id = wmsetRegionIdByCell[(short)wm_GetRegionNumber(WORLD_MAP_COORD_X, WORLD_MAP_COORD_Y)];
    terrain = Worldmap_weirdregister0_LocationDRAW[0x0D];
    if (terrain == 0x1B || terrain == 0x1C)                      /* 27/28 → loc_541F00 */
        return 0;

    if (end <= base + 4)                                       /* cmp ebx,esi; jbe unsigned */
        return result;

    locomotion = LOCOMOTION_METHOD;                            /* DL, once before scan */

    for (rec = base + 4; rec < end; rec += 4) {                 /* ja: unsigned end > rec */
        short set_id;
        unsigned int rate32;
        unsigned short meter;
        unsigned char step;
        unsigned char threshold;
        unsigned char cycle_bonus;
        unsigned char roll;
        unsigned char w;
        int slot;
        unsigned short scene;

        if (rec[0] != region_id)                                /* [eax] vs var_1 */
            continue;
        if (rec[1] != terrain)                                   /* [esi-1] */
            continue;

        set_id = *(short *)(rec + 2);                           /* mov di,[esi]; later movsx esi,di */

        meter = (unsigned short)(word_2040A5C + (unsigned short)(16 >> (enc_half + enc_half)));
        word_2040A5C = meter;                                   /* 66 add ax,di; store before jle */
        if ((short)meter <= 0x100)                             /* cmp ax,100h; jle signed */
            continue;

        word_2040A5C = 0;
        locomotion = (unsigned char)(locomotion + (unsigned char)(isStateOfMovement >> 3));
        LOCOMOTION_METHOD = locomotion;

        mode = (unsigned char)(byte_2036BD8 & 0x1F);           /* var_3 */

        if (mode == 4 && set_id >= 0x51)                       /* cmp di,51h; jl signed */
            rate32 = wmsetEncounterRateTableMode4[set_id - 0x51];
        else
            rate32 = wmsetEncounterRateTableMain[set_id];

        *(unsigned char *)&dword_203FDC8 = (unsigned char)rate32;
        rate32 = dword_203FDC8 & 0xFF;
        dword_20409C4 = rate32;

        step = (unsigned char)(ov[0] + 1);
        ov[0] = step;
        if (step == 0)
            byte_2040A5F = (unsigned char)(byte_2040A5F + 0x0D);

        threshold = (unsigned char)(Encounter_RandomRollArray[ov[0]] - byte_2040A5F);
        *(unsigned char *)&dword_204038C = threshold;
        if ((int)(dword_204038C & 0xFF) >= (int)(locomotion + rate32))  /* jge signed */
            continue;                                           /* loc_541EDF */

        cycle_bonus = ov[1];
        result = 0;

        for (;;) {                                              /* loc_541E3A */
            step = (unsigned char)(ov[2] + 1);
            ov[2] = step;
            if (step == 0)
                cycle_bonus = (unsigned char)(cycle_bonus + 0x0D);

            roll = (unsigned char)(Encounter_RandomRollArray[ov[2]] - cycle_bonus);
            slot = 0;
            w = byte_C75F10;
            if (roll > w) {                                    /* jbe unsigned → slot 0 */
                do {
                    roll = (unsigned char)(roll - w);
                    w = byte_C75F11[slot];
                    slot++;
                } while (roll > w);                             /* ja unsigned */
            }

            if (mode == 4 && set_id >= 0x50)                   /* cmp di,50h; jl signed */
                scene = wmsetEncounterSceneTableMode4[slot + set_id * 8 - 0x280];
            else
                scene = wmsetEncounterSceneTableMain[slot + set_id * 8];
            *out_scene = scene;                                  /* 66 store WORD */

            if (word_20400A0 == *out_scene) {
                result++;
                if (result < 2)                                 /* jl signed: one retry */
                    continue;
            }
            break;
        }

        ov[1] = cycle_bonus;
        result = 1;
        LOCOMOTION_METHOD = 0;
        /* fall through: scan remaining records (ebx/esi restored in ASM) */
    }

    return result;                                             /* loc_541EF6 */
}
```
