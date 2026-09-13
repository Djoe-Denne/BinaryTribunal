# BattleStatus_EnqueueStatusCopyUpdate @ 0x47E250

- Instr (live): 31
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1592
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=1487
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=1293
- A==B: non
- Push IDB: oui
- SetType: _WORD *__cdecl BattleStatus_EnqueueStatusCopyUpdate(int);
- Notes parent: stride `0xD0`. Copies word `status_1` + dword `status_2` **avant** `jl` signé vs 3. Patch slot≥3 : double deref `monster_info` puis byte `+0xF7` ; AND word `0xFFBF` / `and ch,0DFh` (= `~0x2000`). `SomeListManipulation(0x75, 0x80, &field)` + store word slot. A/B/C avaient un overlay struct faux. Réconciliation Grok 4.6 Extra High.

## C réconcilié

```c
/* BattleStatus_EnqueueStatusCopyUpdate @ 0x47E250
 * Ground truth = live ASM + octets IDA, not Hex-Rays.
 * 31 instr, size 0x78. IDA: _WORD *__cdecl(int).
 * BATTLE_SLOT_DATA @ 0x1D27B10, type FF8BattleSlotData_s[11], stride 0xD0.
 * Access by live field offsets — no packed overlay.
 */

enum {
    kBattleSlotStride        = 0xD0,
    kOffMonsterInfoSection   = 0x00, /* dword @ 0x1D27B10, IDA monster_info_section */
    kOffStatus2              = 0x08, /* dword @ 0x1D27B18 */
    kOffStatus2Copy          = 0x0C, /* dword @ 0x1D27B1C */
    kOffStatus1              = 0x80, /* word  @ 0x1D27B90 */
    kOffStatus1Copy          = 0x82  /* word  @ 0x1D27B92 */
};

extern unsigned char BATTLE_SLOT_DATA[]; /* FF8BattleSlotData_s[11] */

/* IDA: int __cdecl(__int16 p_some_id, unsigned __int8 p_bitmask, int p_pointer_info_section) */
int __cdecl SomeListManipulation(short p_some_id, unsigned char p_bitmask, int p_pointer_info_section);

unsigned short *__cdecl BattleStatus_EnqueueStatusCopyUpdate(int slot)
{
    unsigned char *rec;
    unsigned short status_1;
    unsigned int status_2;
    unsigned short *node;
    void *section;
    unsigned char *monster;
    unsigned char flags;
    unsigned int status_2_copy;

    /* lea eax,[esi+esi*2]; lea eax,[esi+eax*4]; shl eax,4 → slot*0xD0, not *232 */
    rec = BATTLE_SLOT_DATA + slot * kBattleSlotStride;

    /* Copies always run before jl. cmp esi,3 flags survive the movs. */
    status_1 = *(unsigned short *)(rec + kOffStatus1);           /* mov cx, word [eax+0x1D27B90] */
    *(unsigned short *)(rec + kOffStatus1Copy) = status_1;       /* mov word [eax+0x1D27B92], cx */

    status_2 = *(unsigned int *)(rec + kOffStatus2);             /* mov edx, dword [eax+0x1D27B18] */
    *(unsigned int *)(rec + kOffStatus2Copy) = status_2;         /* mov dword [eax+0x1D27B1C], edx */

    if (slot >= 3) { /* cmp esi,3 ; jl loc_47E2AD (7C, signed). slot<3 skips patch */
        section = *(void **)(rec + kOffMonsterInfoSection);      /* mov ecx, dword [eax+0x1D27B10] */
        monster = *(unsigned char **)section;                    /* mov ecx, [ecx] — double deref */
        flags = monster[0xF7];                                   /* mov cl, [ecx+0xF7] flag_byte_1 */

        if ((flags & 1) != 0)                                    /* test cl,1 ; jz */
            *(unsigned short *)(rec + kOffStatus1Copy) &= (unsigned short)0xFFBF; /* 66 81 AND word, clear 0x40 */

        if ((flags & 2) != 0) {                                  /* test cl,2 ; jz */
            status_2_copy = *(unsigned int *)(rec + kOffStatus2Copy);
            status_2_copy &= ~0x2000u;                           /* and ch,0DFh — clear bit5 of byte1 */
            *(unsigned int *)(rec + kOffStatus2Copy) = status_2_copy; /* mov dword [eax+0x1D27B1C], ecx */
        }
    }

    /* push &monster_info_section ; push 80h ; push 75h ; add esp,0Ch */
    node = (unsigned short *)SomeListManipulation(
        0x75,
        0x80,
        (int)(rec + kOffMonsterInfoSection));
    *node = (unsigned short)slot; /* 66 89 30: mov word ptr [eax], si */
    return node;                  /* EAX still the list node (_WORD *) */
}
```
