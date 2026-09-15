# BattleGF_LoadCallbackByMagicID @ 0x50AF20

- Instr (live): 38
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=113
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=31
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=46
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleGF_LoadCallbackByMagicID(int magicID, int (__cdecl **)(int))
- Notes parent: 38 instr size 0x97. dec esi; js 78; cmp 190h; jl 7C signed (pas ja). Illegal: sub_56D900 + xor esi. Logic[esi*4]; dword_1D99A64=1 DWORD; dword_1D99A68=esi avant xor null. sprintf mort + esi=0. dword_1DCD6E8=sub_534150. ClearMemory. TextureLoad call eax si non nul. Un seul GetFileArena; A3 dword_1D99A88; 89 0A *out_cb; EAX leftover. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. Pas de 66.

## C réconcilié

```c
/* BattleGF_LoadCallbackByMagicID @ 0x50AF20
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 38 instr, size 0x97, end 0x50AFB7. IDA type int __cdecl(int magicID, int (__cdecl **)(int)).
 * Frame: 81 EC 00 02 00 00 sub esp,200h (Buffer[512]), push esi, add esp,200h, retn C3.
 * Bytes: 4E dec esi; 78 js loc_50AF39; 81 FE 90 01 00 00 cmp esi,190h; 7C jl loc_50AF49.
 * Stores DWORD only: C7 05 dword_1D99A64,1 ; 89 35 dword_1D99A68,esi ; C7 05 dword_1DCD6E8,sub_534150 ;
 *   A3 dword_1D99A88 ; 89 0A *out_cb. No 66 prefix. No BYTE/WORD store.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 unused.
 * Tables stride 4 (esi*4): MagicList_Logic @ 0xC81774, MagicList_TextureLoad @ 0xC81DB8.
 * One Magic_GetFileArena call; EAX leftover is the return (A3 then 89 0A do not clobber EAX).
 * No domain::.
 */

extern int (__cdecl *MagicList_Logic[400])(int);       /* 0xC81774 */
extern int (__cdecl *MagicList_TextureLoad[400])(void); /* 0xC81DB8 */
extern int dword_1D99A64; /* 0x1D99A64 */
extern int dword_1D99A68; /* 0x1D99A68 */
extern int dword_1D99A88; /* 0x1D99A88 */
extern int dword_1DCD6E8; /* 0x1DCD6E8 */

void sub_56D900(char *Format, ...);
int _sprintf(char *const Buffer, const char *const Format, ...);
int Magic_ClearMemoryForTex(void);
void *Magic_GetFileArena(void);
int sub_534150(void);

int __cdecl BattleGF_LoadCallbackByMagicID(int magicID, int (__cdecl **out_cb)(int))
{
    char Buffer[512];
    int idx;
    int (__cdecl *logic)(int);
    int (__cdecl *tex_load)(void);
    void *arena;

    idx = magicID - 1; /* dec esi */
    if (idx < 0 || idx >= 400) { /* js 78 signed; jl 7C signed vs 190h — not ja */
        sub_56D900("read_effect: illegal magic ID: #%i\n", idx); /* add esp,8 */
        idx = 0; /* xor esi,esi then loc_50AF49 */
    }

    logic = MagicList_Logic[idx]; /* 8B 04 B5 74 17 C8 00 */
    dword_1D99A64 = 1;            /* C7 05 ... 01 00 00 00 */
    dword_1D99A68 = idx;          /* 89 35 — latched BEFORE null-Logic xor */
    if (!logic) {                 /* test eax,eax / jnz loc_50AF79 */
        _sprintf(Buffer, "read_effect: non existent magic ID: #%i\n", idx); /* add esp,0Ch */
        idx = 0; /* xor esi,esi; dword_1D99A68 not rewritten */
    }

    dword_1DCD6E8 = (int)sub_534150; /* loc_50AF79 C7 05 E8 D6 DC 01 50 41 53 00 */
    Magic_ClearMemoryForTex();

    tex_load = MagicList_TextureLoad[idx]; /* 8B 04 B5 B8 1D C8 00 */
    if (tex_load)                          /* test eax / jz loc_50AF95 */
        tex_load();                        /* FF D0 call eax, 0 args */

    arena = Magic_GetFileArena(); /* single call @ 50af95 */
    dword_1D99A88 = (int)arena;   /* A3 88 9A D9 01 — EAX leftover */
    *out_cb = MagicList_Logic[idx]; /* 89 0A DWORD; esi may be 0 after clamp */
    return (int)arena;
}
```
