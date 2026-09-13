# MenuMagic_PruneZeroStockAndJunctionRefs @ 0x4BE790

- Instr (live): 79
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1498
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=767
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=1643
- A==B: non
- Push IDB: oui
- SetType: int __cdecl MenuMagic_PruneZeroStockAndJunctionRefs(int charIndex)
- Notes parent: CharacterData 0x98. Magic 32×2 BYTE @ +0x10 (pas 32×5 / F_CHAR 0x1D0). Junction 20 BYTE depuis +0x5C. Occupancy 1+2 présente (`dword_1D77154/158[ebp*8]`). GetRandomInt absent. EAX=0.

## C réconcilié

```c
/* MenuMagic_PruneZeroStockAndJunctionRefs @ 0x4BE790
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 79 instr, size 0xDE, end 0x4BE86E. IDA type int __cdecl(int).
 * CharacterData 0x98 via lea ebp*9, lea ebp+eax*2, shl 3.
 * Magic: ff8_id_quantity_storage[32] @ +0x10, stride 2 (BYTE id, BYTE amount).
 *   NOT battle F_CHAR 32x5 / 0x1D0 (unused here).
 * Junction: 0x14 BYTEs from JunctionHP @ +0x5C (inc edi).
 * Occupancy 1+2 PRESENT: dword_1D77154[ebp*8] and dword_1D77158[ebp*8] cleared,
 *   then or dword_1D77154[dwordIdx*4 + ebp*8], mask.
 * GetRandomInt: absent. No call. ja/jg/setcc/jpt: none.
 * Widths: Magic/junction BYTE (8A/88); bitmap/occupancy DWORD (8B/89/09).
 * Return EAX leftover 0 (last junction loop dec).
 */

#pragma pack(push, 1)
typedef struct {
    unsigned char id;       /* +0 BYTE */
    unsigned char amount;  /* +1 BYTE */
} ff8_id_quantity_storage;  /* size 2; IDA live */

typedef struct {
    short CurrentHP;                         /* +00 */
    short MaxHP;                            /* +02 */
    int Experience;                          /* +04 */
    unsigned char ModelID;                  /* +08 */
    unsigned char WeaponID;                 /* +09 */
    unsigned char STR;                       /* +0A */
    unsigned char VIT;                      /* +0B */
    unsigned char MAG;                      /* +0C */
    unsigned char SPR;                      /* +0D */
    unsigned char SPD;                      /* +0E */
    unsigned char LCK;                      /* +0F */
    ff8_id_quantity_storage Magic[32];     /* +10 size 0x40 */
    unsigned char Commands[4];              /* +50 */
    unsigned char Abilitie[4];              /* +54 */
    short JunctionedGFs;                    /* +58 */
    unsigned char Unknown1;                /* +5A */
    unsigned char AltModel;                 /* +5B */
    unsigned char JunctionHP;                /* +5C; first of 20 BYTE refs */
    unsigned char JunctionSTR;               /* +5D */
    unsigned char JunctionVIT;               /* +5E */
    unsigned char JunctionMAG;               /* +5F */
    unsigned char JunctionSPR;              /* +60 */
    unsigned char JunctionSPD;               /* +61 */
    unsigned char JunctionEVA;              /* +62 */
    unsigned char JunctionHIT;              /* +63 */
    unsigned char JunctionLCK;              /* +64 */
    unsigned char JunctionElemAttack;      /* +65 */
    unsigned char JunctionMentalAttack;    /* +66 */
    unsigned char JunctionElemDefense[4];  /* +67 */
    unsigned char JunctionMentalDefense[4];/* +6B */
    unsigned char Unknown2;                 /* +6F last of 0x14 BYTE walk */
    short GFCompatibility[16];              /* +70 */
    short NumKills;                          /* +90 */
    short NumKOs;                            /* +92 */
    unsigned char Exists;                    /* +94 */
    unsigned char Unknown3;                 /* +95 */
    unsigned char MentalStatus;             /* +96 */
    unsigned char Unknown4;                 /* +97 */
} CharacterData;                             /* size 0x98 IDA live */
#pragma pack(pop)

extern CharacterData SG_ARRAY_CHARA_DATA[8]; /* 0x1CFE0E8 */
extern unsigned int dword_1D77154[];          /* occupancy[0] base; [char*8] */
extern unsigned int dword_1D77158[];          /* occupancy[1] base; [char*8] */

int __cdecl MenuMagic_PruneZeroStockAndJunctionRefs(int charIndex)
{
    unsigned int bitmap[2]; /* var_8 / var_4; two DWORDs zeroed */
    unsigned char *magic;
    unsigned char *junction;
    int slot;

    /* mov dword_1D77154[ebp*8], ebx ; mov dword_1D77158[ebp*8], ebx */
    dword_1D77154[charIndex * 2] = 0;
    dword_1D77158[charIndex * 2] = 0;

    bitmap[0] = 0;
    bitmap[1] = 0;

    magic = &SG_ARRAY_CHARA_DATA[charIndex].Magic[0].id;

    /* 32 slots, count in overwritten arg_0; add esi,2 before bitmap test */
    for (slot = 32; slot != 0; slot--) {
        unsigned int amount;
        unsigned int id;

        amount = magic[1]; /* mov al, [esi+1] */
        id = magic[0];     /* mov cl, [esi] */

        if (amount == 0 || id == 0) {
            magic[0] = 0; /* BYTE */
            magic[1] = 0; /* BYTE */
            id = 0;       /* xor ecx, ecx */
        }

        magic += 2;

        if (id != 0 && amount != 0) {
            /* MSVC signed /32: cdq; and edx,1Fh; add eax,edx; sar eax,5 */
            unsigned int dwordIdx;
            unsigned int mask;

            dwordIdx = (unsigned int)((int)id / 32);
            mask = 1u << (id & 31);
            bitmap[dwordIdx] |= mask; /* DWORD */
        }
    }

    junction = &SG_ARRAY_CHARA_DATA[charIndex].JunctionHP;

    for (slot = 20; slot != 0; slot--) {
        unsigned int id;

        id = *junction; /* BYTE */
        if (id != 0) {
            unsigned int dwordIdx;
            unsigned int mask;

            dwordIdx = (unsigned int)((int)id / 32);
            mask = 1u << (id & 31);
            if (bitmap[dwordIdx] & mask) {
                /* or dword_1D77154[dwordIdx*4 + ebp*8], mask */
                dword_1D77154[charIndex * 2 + dwordIdx] |= mask;
            } else {
                *junction = 0; /* BYTE */
            }
        }
        junction++; /* inc edi */
    }

    return 0; /* EAX = last dec to 0; retn */
}
```
