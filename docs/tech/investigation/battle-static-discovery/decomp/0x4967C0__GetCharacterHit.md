# GetCharacterHit @ 0x4967C0

- Instr (live): 78
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=478
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=879
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=470
- A==B: non
- Push IDB: oui
- SetType: int __cdecl GetCharacterHit(int char_id)
- Notes parent: stride CharacterData 0x98 (pas F_CHAR 0x1D0). Occupancy 1+2 / GetRandomInt absents. hitJ BYTE K_MAGIC+0x1E lu avant test id. Weapon Laguna-dream flag bit0 ModelID 8/9/10 (dword+AND 0xFF / BYTE / BYTE). Loop jl signe 0x20 stride 2. CapTo255(qty*hitJ/100 + K_WEAPON.attackParameter+0x07). add esp 4. EAX.

## C réconcilié

```c
/* GetCharacterHit @ 0x4967C0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 78 instr, size 0xDC, end 0x49689C. IDA type int __cdecl(int char_id). No domain::.
 * CharacterData stride 0x98 @ SG_ARRAY_CHARA_DATA 0x1CFE0E8. F_CHAR 0x1D0 unused.
 * Occupancy 1+2 unused. GetRandomInt absent.
 * K_MAGIC stride 0x3C @ 0x1CF4064, hitJunctionValue +0x1E.
 * K_WEAPON stride 0x0C @ 0x1CF7400, attackParameter +0x07.
 * Loop bound SIGNED jl vs 0x20. Magic stride 2.
 * No packed struct: live offsets on CharacterData[char*0x98].
 */

extern unsigned char SG_ARRAY_CHARA_DATA[];      /* 0x1CFE0E8 CharacterData[] */
extern unsigned char K_MAGIC[];                  /* 0x1CF4064 FF8KernelMagicData[] */
extern unsigned char K_WEAPON[];                 /* 0x1CF7400 FF8KernelWeapon[] */
extern unsigned char SG_ODIN_ANGEL_GILGA_FLAG;   /* 0x1CFE97A */
extern unsigned char SG_WEAPON_ID_LAGUNA;        /* 0x1CFE760 */
extern unsigned char SG_WEAPON_ID_KIROS;         /* 0x1CFE761 */
extern unsigned char SG_WEAPON_ID_WARD;          /* 0x1CFE762 */
extern int __cdecl CapTo255(int value);          /* 0x495930, add esp 4 */

#define CD8(ch, off) (SG_ARRAY_CHARA_DATA[(unsigned int)(ch) * 0x98u + (off)])
#define KM8(id, off) (K_MAGIC[(unsigned int)(id) * 0x3Cu + (off)])
#define KW8(w, off)  (K_WEAPON[(unsigned int)(w) * 0x0Cu + (off)])

#define OFF_MODELID     0x08
#define OFF_WEAPONID    0x09
#define OFF_MAGIC_ID    0x10
#define OFF_MAGIC_AMT   0x11
#define OFF_JUNCTIONHIT 0x63
#define OFF_KM_HITJ     0x1E
#define OFF_KW_ATKPARAM 0x07

int __cdecl GetCharacterHit(int char_id)
{
    unsigned int junction_hit;
    unsigned int hit_j;
    unsigned int weapon;
    unsigned int model;
    int qty;
    int i;
    int prod;
    int atk;

    junction_hit = CD8(char_id, OFF_JUNCTIONHIT); /* BYTE, xor ecx; mov cl */
    hit_j = KM8(junction_hit, OFF_KM_HITJ);       /* BYTE +0x1E, loaded even if id==0 */

    if ((SG_ODIN_ANGEL_GILGA_FLAG & 1) == 0) {
        weapon = CD8(char_id, OFF_WEAPONID); /* BYTE +0x09 */
    } else {
        model = CD8(char_id, OFF_MODELID); /* BYTE +0x08 */
        if (model == 8)
            weapon = *(unsigned int *)&SG_WEAPON_ID_LAGUNA & 0xFF; /* dword + AND 0xFF */
        else if (model == 9)
            weapon = SG_WEAPON_ID_KIROS;
        else if (model == 10)
            weapon = SG_WEAPON_ID_WARD;
        else
            weapon = CD8(char_id, OFF_WEAPONID);
    }

    qty = 0;
    if (junction_hit != 0) {
        for (i = 0; i < 32; i++) { /* inc; add eax,2; cmp ecx,20h; jl */
            if (CD8(char_id, OFF_MAGIC_ID + i * 2) == junction_hit) {
                qty = CD8(char_id, OFF_MAGIC_AMT + i * 2); /* BYTE amount */
                break;
            }
        }
    }

    prod = qty * (int)hit_j;                      /* imul eax, edx (hitJ still in edx) */
    atk = KW8(weapon, OFF_KW_ATKPARAM);           /* BYTE +0x07, after the imul */
    return CapTo255(prod / 100 + atk);            /* 51EB851F / sar 5 / +(q<0); cdecl add esp 4 */
}
```
