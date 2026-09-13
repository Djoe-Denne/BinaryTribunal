# MenuMagic_PreviewJunctionHpSpellTransfer @ 0x4F6140

- Instr (live): 161
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=6525
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=6037
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=5950 (1er appel length/c_len=0, retry --effort high --max-tokens 65536)
- A==B: non
- Push IDB: oui
- SetType: int __cdecl sub_4F6140(int char_id, int dest_char_id)
- Notes parent: Catalogue `sub_4F6140`. Preview non durable: cap transfert JunctionHP vers dest, décrémente stock source BYTE, snapshot F_CHAR 0x1D0, restaure id/amount/JunctionHP/CurrentHP. Dest Magic jamais écrit. Occupancy locale DWORD vs 0xFFFFFFFF (pas 1+2). GetRandomInt absent. Stride 0x98, Magic stride 2, jl/jle/setl signés. HP WORD 66 ; F_CHAR+0x172 movsx. add esp 8 puis 0Ch. EAX=setl (snapshot HP < CurrentHP sauvé).

## C réconcilié

```c
/* sub_4F6140 @ 0x4F6140
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 161 instr, size 0x1B7, end 0x4F62F7. IDA type int __cdecl(int, int).
 * CharacterData stride 0x98 @ SG_ARRAY_CHARA_DATA 0x1CFE0E8.
 * Magic 32 x {id BYTE, amount BYTE} stride 2 @ +0x10. JunctionHP BYTE +0x5C.
 * CurrentHP WORD +0x00 (66). F_CHAR snapshot 0x1D0 via sub_4BFC90; HP WORD +0x172.
 * Slot 0xD0 unused. GF Exists 0x44 unused.
 * Occupancy 1+2 globals absent. Local EAX bitmask vs 0xFFFFFFFF only.
 * GetRandomInt absent. Loops jl signed vs 0x20. jle signed (7E). setl signed.
 * add esp,8 after two sub_4C3120; add esp,0Ch after 4BFC90+Rebuild.
 * Dest Magic never stored. Return AL=1 iff snapshot HP < saved CurrentHP.
 */

#define CD_STRIDE        0x98
#define CD_CurrentHP     0x00
#define CD_Magic_id      0x10
#define CD_Magic_amount  0x11
#define CD_JunctionHP    0x5C
#define FCHAR_SIZE       0x1D0
#define FCHAR_CurrentHP  0x172

extern unsigned char SG_ARRAY_CHARA_DATA[]; /* 0x1CFE0E8 */

unsigned char *__cdecl sub_4C3120(int char_id);
__int16 __cdecl sub_4BFC90(int char_id, __int16 *fchar);
__int16 __cdecl MenuMagic_RebuildPartyDerivedState(int char_id);

int __cdecl sub_4F6140(int char_id, int dest_char_id)
{
    unsigned char fchar_snap[FCHAR_SIZE];
    unsigned char *dest_magic;
    unsigned char *src_magic;
    unsigned int occupancy;
    int src_off;
    int saved_hp;
    int junction_spell;
    int src_slot;
    int src_amount;
    int dest_amount;
    int transfer;
    int i;
    int pair_off;
    int snap_hp;

    src_off = char_id * CD_STRIDE; /* lea ebp*9 / lea ebp+eax*2 / shl 3 */
    saved_hp = *(unsigned short *)&SG_ARRAY_CHARA_DATA[src_off + CD_CurrentHP]; /* xor eax; 66 8B ax */

    sub_4C3120(char_id);
    sub_4C3120(dest_char_id); /* add esp,8; EAX unused */

    junction_spell = SG_ARRAY_CHARA_DATA[src_off + CD_JunctionHP]; /* xor ebx; mov bl */
    if (junction_spell == 0)
        return 0;

    dest_magic = &SG_ARRAY_CHARA_DATA[dest_char_id * CD_STRIDE + CD_Magic_id];

    occupancy = 0;
    for (i = 0; i < 32; i++) { /* cmp ecx,20h / jl */
        int id = (signed char)dest_magic[i * 2]; /* movsx */
        if (id == junction_spell) {
            if (dest_magic[i * 2 + 1] == 100) /* [edx+1]==0x64 */
                return 0;
        } else if (id != 0) {
            occupancy |= 1u << i;
        }
    }
    if (occupancy == 0xFFFFFFFFu)
        return 0;

    src_magic = &SG_ARRAY_CHARA_DATA[src_off + CD_Magic_id];
    src_slot = -1;
    for (i = 0; i < 32; i++) {
        if (junction_spell == (signed char)src_magic[i * 2]) {
            src_slot = i;
            break;
        }
    }
    if (src_slot < 0)
        return 0;

    src_amount = (signed char)src_magic[src_slot * 2 + 1]; /* movsx amount */
    if (src_amount == 0)
        return 0; /* loc_4F621B: EAX leftover 0, 4 pops */

    dest_amount = 0;
    for (i = 0; i < 32; i++) {
        if (junction_spell == (signed char)dest_magic[i * 2]) {
            dest_amount = (signed char)dest_magic[i * 2 + 1]; /* movsx */
            break;
        }
    }

    if (dest_amount != 0) {
        transfer = 100 - dest_amount;
        if (transfer > src_amount) /* jle signed: keep room if room <= src */
            transfer = src_amount;
    } else {
        transfer = 0;
        for (i = 0; i < 32; i++) {
            if (dest_magic[i * 2] == 0)
                transfer = src_amount; /* last empty wins */
        }
    }

    pair_off = src_off + src_slot * 2; /* (slot + char*19*4)*2 */
    SG_ARRAY_CHARA_DATA[pair_off + CD_Magic_amount] =
        (unsigned char)(SG_ARRAY_CHARA_DATA[pair_off + CD_Magic_amount] - (unsigned char)transfer);

    sub_4BFC90(char_id, (__int16 *)fchar_snap);

    snap_hp = *(short *)&fchar_snap[FCHAR_CurrentHP]; /* movsx var_5E */

    SG_ARRAY_CHARA_DATA[pair_off + CD_Magic_id] = (unsigned char)junction_spell; /* bl */
    SG_ARRAY_CHARA_DATA[pair_off + CD_Magic_amount] = (unsigned char)src_amount; /* cl=var_1E0 */
    SG_ARRAY_CHARA_DATA[src_off + CD_JunctionHP] = (unsigned char)junction_spell;
    *(unsigned short *)&SG_ARRAY_CHARA_DATA[src_off + CD_CurrentHP] = (unsigned short)saved_hp; /* 66 89 */

    MenuMagic_RebuildPartyDerivedState(char_id); /* add esp,0Ch */

    return snap_hp < saved_hp; /* xor eax; cmp edi,esi; setl al */
}
```
