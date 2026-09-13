# GetCharacterHP @ 0x496310

- Instr (live): 68
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=164
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=89
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=74
- A==B: non
- Push IDB: oui
- SetType: int __cdecl GetCharacterHP(int lvl, int char_id)
- Notes parent: CharacterData stride 0x98 (edi=char_id*0x98), pas F_CHAR 0x1D0. Occupancy 1+2 absent. GetRandomInt absent. K_CHARACTER ModelID*0x24, A/D/C = hp[0..2] BYTE, hp[3] non lu. K_MAGIC JunctionHP*0x3C hpJ +0x17 BYTE. Magic 32×{id,amount} stride 2, jl signé vs 0x20. MaxHP WORD prefix 66. Formule EAX = MaxHP + C + lvl*A + qty*hpJ − 10*lvl²/D (idiv, D==0 UB). Pas de cap 9999. Pas de Hex-Rays. Pas de struct packée.

## C réconcilié

```c
/* GetCharacterHP @ 0x496310
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 68 instr, size 0xC8, end 0x4963D8. IDA type int __cdecl(int, int). No domain::.
 * CharacterData stride 0x98 @ SG_ARRAY_CHARA_DATA 0x1CFE0E8. F_CHAR 0x1D0 unused.
 * Occupancy 1+2 unused. GetRandomInt absent. hp[3] unread.
 * K_CHARACTER stride 0x24 @ 0x1CF75EC (hp A/D/C at +0x08/+0x09/+0x0A).
 * K_MAGIC stride 0x3C @ 0x1CF4064, hpJunctionValue +0x17.
 * WORD MaxHP uses prefix 66. Loop bound SIGNED jl vs 0x20.
 * No packed struct: live offsets on CharacterData[char*0x98].
 */

extern unsigned char SG_ARRAY_CHARA_DATA[]; /* 0x1CFE0E8 CharacterData[8] */
extern unsigned char K_CHARACTER[];        /* 0x1CF75EC FF8KernelCharacter[] */
extern unsigned char K_MAGIC[];            /* 0x1CF4064 FF8KernelMagicData[57] */

#define CD8(ch, off)  (SG_ARRAY_CHARA_DATA[(unsigned int)(ch) * 0x98u + (off)])
#define CD16(ch, off) (*(unsigned short *)(SG_ARRAY_CHARA_DATA + (unsigned int)(ch) * 0x98u + (off)))
#define KC8(model, off) (K_CHARACTER[(unsigned int)(model) * 0x24u + (off)])
#define KM8(id, off)  (K_MAGIC[(unsigned int)(id) * 0x3Cu + (off)])

#define OFF_MAXHP      0x02
#define OFF_MODELID    0x08
#define OFF_MAGIC_ID   0x10
#define OFF_MAGIC_AMT  0x11
#define OFF_JUNCTIONHP 0x5C
#define OFF_KC_HPA     0x08  /* A = hp[0] */
#define OFF_KC_HPD     0x09  /* D = hp[1] idiv divisor */
#define OFF_KC_HPC     0x0A  /* C = hp[2] */
#define OFF_KM_HPJ     0x17

int __cdecl GetCharacterHP(int lvl, int char_id)
{
    unsigned int junction_hp;
    unsigned int model_id;
    int spell_count;
    int i;
    int hpj;
    int result;
    int a;
    int d;
    int c;
    unsigned int max_hp;

    junction_hp = CD8(char_id, OFF_JUNCTIONHP); /* BYTE, xor ecx; mov cl */
    model_id    = CD8(char_id, OFF_MODELID);    /* BYTE, xor edx; mov dl */

    spell_count = 0; /* ASM overwrites the char_id arg slot */
    if (junction_hp != 0) {
        for (i = 0; i < 32; i++) { /* inc; add esi,2; cmp eax,20h; jl */
            if (CD8(char_id, OFF_MAGIC_ID + i * 2) == junction_hp) {
                spell_count = CD8(char_id, OFF_MAGIC_AMT + i * 2); /* BYTE amount */
                break;
            }
        }
    }

    /* ASM order: 10*lvl²/D (cdq/idiv), hpJ*spellCount, sub, +lvl*A, +C, +MaxHP. */
    d = KC8(model_id, OFF_KC_HPD);           /* BYTE hp[1] */
    result = ((lvl * lvl) * 10) / (int)d;    /* D==0 original UB, no guard */
    hpj = KM8(junction_hp, OFF_KM_HPJ);      /* BYTE +0x17, still indexed if spell_count==0 */
    result = hpj * spell_count - result;
    a = KC8(model_id, OFF_KC_HPA);           /* BYTE hp[0] */
    c = KC8(model_id, OFF_KC_HPC);           /* BYTE hp[2] */
    result += lvl * a;
    max_hp = CD16(char_id, OFF_MAXHP);       /* WORD, xor edx; mov dx */
    result += c;
    result += (int)max_hp;
    return result; /* EAX, no 9999 cap */
}
```
