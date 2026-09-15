# BattleActionSequence_SetupContext @ 0x50AFC0

- Instr (live): 54
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1420
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=1423
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=1596
- A==B: non
- Push IDB: oui
- SetType: unsigned char *BattleActionSequence_SetupContext(void)
- Notes parent: 0 args (IDA __fastcall(char) rejeté). F0: walk 3 slots stride 0x9C jl signé vs 0x1D97498; edx=var_4 puis mov edx,ecx entre cmp+jz. BYTE [eax-4]&2 seulement. Occupancy 1+2 absente. 66 WORD A90/1D99A7A. add esp,8. EAX leftover SharedB. byte_1D99A81=0.

## C réconcilié

```c
/* BattleActionSequence_SetupContext @ 0x50AFC0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 54 instr, size 0xB7, end 0x50B077. 0 args. push ecx / pop ecx = 4-byte local.
 * retn C3. EAX leftover = g_GfSequenceContextSharedB (callers ignore EAX).
 * IDA TYPE int __fastcall(char) REJECTED: 9 bare calls, no arg push, no retn N.
 * BYTE F6 40 FC 02 [eax-4] value 2 only. Occupancy 1+2 ABSENT.
 * add eax,9Ch (05 9C000000) stride PRESENT. Bound 3D+jl 7C SIGNED vs 0x1D97498.
 * 3 iters: (0x1D97498-0x1D972C4)/0x9C == 3 (party 0..2, not 7 actors).
 * 66 WORD: test ax / cmp word dword_1D99A90 / mov word_1D99A7A, dx.
 * add esp,8 cdecl 2-arg sub_50D300. mov edx,ecx BETWEEN cmp [eax],4 and jz.
 * Slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 ABSENT. No setcc / jpt / ja.
 * No domain::.
 */

extern unsigned char *g_GfSequenceContextSharedB; /* 0x1D99A50 */
extern unsigned char byte_1D972C4[];              /* 0x1D972C4 = actors+4 */
extern unsigned char byte_1D97498[];              /* 0x1D97498 exclusive bound */
extern unsigned int dword_1D99A90;                /* DWORD object; WORD tests here */
extern unsigned int dword_1D99A5C;
extern unsigned int dword_1D99A6C;                /* this site reads BYTE at +1 */
extern unsigned char byte_1D99AAA;
extern unsigned short word_1D99A7A;
extern unsigned int dword_1D99A7C;
extern unsigned char byte_1D99A81;
extern unsigned char byte_1D99A83;
extern unsigned char byte_1D99A78;
extern unsigned char byte_1D99A79;

char __cdecl sub_50D300(char slot, unsigned short arg1); /* 0x50D300; not inlined */

unsigned char *BattleActionSequence_SetupContext(void)
{
    unsigned int var_4; /* push ecx local; 8B 54 24 00 */
    unsigned char *sharedB;
    unsigned int slot;
    unsigned char *cur;
    unsigned int idx;
    unsigned int arg1;
    unsigned int bits;
    unsigned int mask;

    sharedB = g_GfSequenceContextSharedB; /* A1 */

    if (sharedB[1] == 0xF0) { /* 80 78 01 F0 ; jnz loc_50AFF3 */
        slot = var_4; /* edx = [esp] after push ecx = incoming ECX, not an API arg */
        idx = 0; /* xor ecx, ecx */
        cur = byte_1D972C4; /* B8 offset actors+4 */
        do {
            if ((cur[-4] & 2) != 0) { /* F6 40 FC 02 BYTE; not occupancy 1+2 */
                slot = idx; /* 8B D1 BETWEEN cmp and jz */
                if (cur[0] == 4) /* 80 38 04 ; jz loc_50AFF7 */
                    break;
            }
            cur += 0x9C; /* 05 9C000000 */
            idx++;
        } while ((int)cur < (int)byte_1D97498); /* 3D ; jl 7C SIGNED */
    } else {
        slot = (unsigned char)sharedB[0]; /* 33 D2 ; 8A 10 */
    }

    arg1 = dword_1D99A90;
    if ((unsigned short)arg1 == 0) /* 66 85 C0 test ax, ax */
        arg1 = dword_1D99A5C;
    sub_50D300((char)slot, (unsigned short)arg1); /* push eax; push edx; add esp,8 */

    bits = dword_1D99A5C; /* 8B 15 full DWORD into edx; not clobbered later */

    if ((unsigned short)dword_1D99A90 != 0) { /* 66 83 3D ... 00 ; jz loc_50B042 */
        mask = bits & 0xFFFF; /* 25 FFFF0000 */
        idx = 0;
        do {
            if (mask & (1u << idx)) /* esi=1; shl esi,cl ; test eax,esi */
                byte_1D99AAA = (unsigned char)idx; /* 88 0D BYTE; last bit 0..2 wins */
            idx++;
        } while ((int)idx < 3); /* 83 F9 03 ; jl 7C SIGNED */
    }

    sharedB = g_GfSequenceContextSharedB; /* A1 reload */
    word_1D99A7A = (unsigned short)bits; /* 66 89 15 DX = low WORD of dword_1D99A5C */
    dword_1D99A7C = (unsigned int)sharedB; /* A3 DWORD */
    byte_1D99A81 = 0; /* C6 BYTE */
    byte_1D99A83 = 0; /* C6 BYTE; ASM loads cl=[eax] then this, then stores 78 */
    byte_1D99A78 = sharedB[0]; /* 8A 08 ; 88 0D BYTE */
    byte_1D99A79 = *((unsigned char *)&dword_1D99A6C + 1); /* 8A 0D 6D9AD901 BYTE 0x1D99A6D */
    return sharedB; /* leftover EAX */
}
```
