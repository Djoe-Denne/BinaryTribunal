# computeCardCommandDrop @ 0x48FBA0

- Instr (live): 64
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=8
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=8
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=9
- A==B: non
- Push IDB: oui
- SetType: int __cdecl computeCardCommandDrop(int slot)
- Notes parent: stride slot 0xD0; occupancy / F_CHAR 0x1D0 absents; deux loads `monster_info_section`; Card[1]/[2] +0xF9/+0xFA; `idiv` signé DWORD; GetRandomInt AL only puis AND 0xFF puis `jb` unsigned; rare `AL<0x10`; `sub_534840` add esp 4; pas de setcc; pas de ja/jg; pas de 66.

## C réconcilié

```c
/* computeCardCommandDrop @ 0x48FBA0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 64 instr, size 0xB8. End 0x48FC57. IDA type int __cdecl(int). No domain::.
 * Slot stride 0xD0. Occupancy unused. F_CHAR 0x1D0 unused.
 * GetRandomInt AL only; call1 AND EAX,0FFh; call2 cmp AL,10h.
 * No setcc. jb/jnb unsigned (not ja/jg). No 66 prefix. idiv DWORD F7 B9.
 * No packed struct: live offsets only.
 */

extern unsigned char BATTLE_SLOT_DATA[];       /* 0x1D27B10, FF8BattleSlotData_s[11], stride 0xD0 */
extern unsigned char END_BATTLE_CARD_OBTAINED; /* 0x1D28E15 BYTE */

unsigned char __cdecl Battle_GetRandomInt(void); /* AL only; 0 args, no add esp */
int __cdecl sub_534840(int card_id);           /* cdecl 1 DWORD, add esp 4 */

int __cdecl computeCardCommandDrop(int slot)
{
    unsigned char *base;
    unsigned char *info;
    int hp;
    int max_hp;
    int n;
    unsigned int threshold;
    unsigned int roll;
    unsigned char card;

    /* lea ecx,[eax+eax*2]; lea ecx,[eax+ecx*4]; shl ecx,4 → slot*0xD0 */
    base = BATTLE_SLOT_DATA + (unsigned int)slot * 0xD0u;

    /* mov edx, dword [ecx+0x1D27B10]; mov edi,[edx] — two DWORD loads */
    info = **(unsigned char ***)base;

    /* BYTE [edi+0xF9] / [edi+0xFA]; Card BYTE[3] @ +0xF8; Card[0] unread */
    if (info[0xF9] == 0xFF && info[0xFA] == 0xFF)
        return 0;

    /* current_hp DWORD +0x18 @ 0x1D27B28; max_hp DWORD +0x1C @ 0x1D27B2C */
    hp = *(int *)(base + 0x18);
    max_hp = *(int *)(base + 0x1C);
    /* shl eax,8; sub eax,edx; cdq; idiv dword (F7 B9, signed, no 66) */
    n = (int)((unsigned int)hp * 255u) / max_hp;

    /* mov edx,100h; sub edx,eax; then (n*255)/255 via 80808081h = identity */
    threshold = 0x100u - (unsigned int)n;

    /* call Battle_GetRandomInt; and eax,0FFh (25 FF 00 00 00) — RNG burned even if esi==0 */
    roll = (unsigned int)Battle_GetRandomInt() & 0xFFu;

    /* test esi,esi jz loc_48FC49; cmp esi,eax; jb loc_48FC49 (unsigned) */
    if (threshold == 0 || threshold < roll) {
        END_BATTLE_CARD_OBTAINED = 0xFF; /* BYTE C6 05 */
        return 1;
    }

    /* cmp al,10h; jnb loc_48FC28 */
    if ((unsigned char)Battle_GetRandomInt() < 0x10)
        card = info[0xFA]; /* rare Card[2] */
    else
        card = info[0xF9]; /* common Card[1] */

    END_BATTLE_CARD_OBTAINED = card; /* BYTE A2 */
    /* xor ecx,ecx; mov cl,al; push ecx; call sub_534840; add esp,4 */
    if (sub_534840((int)card) != 0)
        return 0; /* gate nonzero: card already stored, EAX=0 */
    return 1;
}
```
