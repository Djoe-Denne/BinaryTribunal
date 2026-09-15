# Gfx_BindDrawListBackendCallbacks @ 0x41619A

- Instr (live): 327
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=5412
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=2507
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=587
- A==B: non
- Push IDB: oui
- SetType: void __cdecl Gfx_BindDrawListBackendCallbacks(int, int *)
- Notes parent: ja unsigned var_2C>13h (jpt 20 @ 0x41669F, case 16=def). jl/jge/jg signed *list vs 12h/14h/7. Types 18-19 skip +5C/+3C/+40/+44/+48. +44h=(+3Ch)<<5 pas GF Exists. Occupancy absente (and 2 = flags bit1). DWORD only. void. Caller unique Gfx_CreateDrawList 0x41730A.

## C réconcilié

```c
/* Gfx_BindDrawListBackendCallbacks @ 0x41619A
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 327 instr, size 0x505, end exclusive 0x41669F. cdecl, 2 args, retn C3. EBP frame, sub esp,2Ch.
 * Occupancy 1+2 / slot 0xD0 F_CHAR / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * list+0x44 is (list+3Ch)<<5 of a GfxDrawList. driver+0D0h is gfx slot 52. and 2 = flags bit 1.
 * JCC: jz list==0; jl/jge SIGNED *list vs 12h/14h; jg SIGNED *list vs 7; jz/jnz flag bits; ja UNSIGNED var_2C>13h.
 * No jg on the switch bound. No setcc/66. Jump table jpt_4162FF @ 0x41669F: 20 dwords (cases 0..19).
 * Widths: all DWORD 89/C7/83. Callees: FFGetBufferAddress 0 args; GetBufApp_0xA74(engine) add esp,4.
 * NULL list: no stores. Type 16 + default: +9Ch/+0A0h stay 0. Types 18-19 skip +5C/+3C/+40/+44/+48.
 * Void: leftover EAX ignored (caller 0x41730A add esp,8 then unrelated cmp).
 */

int __cdecl FFGetBufferAddress(void);
int __cdecl GetBufApp_0xA74(int);

void __cdecl Gfx_BindDrawListBackendCallbacks(int flags, int *list)
{
    unsigned int var_2C; /* [ebp-2Ch] switch discriminator */
    unsigned int var_28; /* [ebp-28h] odd nested */
    unsigned int var_24; /* [ebp-24h] */
    unsigned int var_20; /* [ebp-20h] */
    unsigned int var_1C; /* [ebp-1Ch] even nested */
    unsigned int var_18; /* [ebp-18h] */
    unsigned int var_14; /* [ebp-14h] */
    unsigned int var_10; /* [ebp-10h] copied to list+5Ch */
    unsigned int var_C;  /* [ebp-0Ch] list+18h */
    unsigned int var_8;  /* [ebp-8] driver */
    unsigned int var_4;  /* [ebp-4] engine */
    int typeSigned;

    var_4 = (unsigned int)FFGetBufferAddress(); /* EAX = dword_1A79D88 */
    var_8 = (unsigned int)GetBufApp_0xA74((int)var_4); /* add esp,4 ; *(engine+0A74h) */

    if (list == 0) /* cmp [ebp+arg_4],0 ; jz def_4162FF */
        return;

    *(_DWORD *)((char *)list + 0x38) = (_DWORD)flags; /* 89 51 38 */
    *(_DWORD *)((char *)list + 0x9C) = 0;             /* setup */
    *(_DWORD *)((char *)list + 0xA0) = 0;             /* walk */

    typeSigned = *(int *)list; /* dword [list+0] */

    if (typeSigned >= 0x12 && typeSigned < 0x14) { /* jl 12h / jge 14h SIGNED — types 18,19 */
        *(_DWORD *)((char *)list + 0x60) = 2;
        *(_DWORD *)((char *)list + 0x64) = 2;
        *(_DWORD *)((char *)list + 0x68) = 0x40;
        *(_DWORD *)((char *)list + 0x6C) = 4;
        *(_DWORD *)((char *)list + 0x70) =
            *(_DWORD *)((char *)*(_DWORD *)((char *)list + 0x30) + 0x68);
        /* jmp loc_4162E0 — skip +5Ch/+3Ch/+40h/+44h/+48h */
    } else {
        if (typeSigned <= 7) { /* jg SIGNED loc_416261 */
            if (flags & 2) /* and edx,2 on list+38h ; jz loc_416253 — NOT occupancy */
                var_10 = *(_DWORD *)((char *)*(_DWORD *)((char *)list + 0x30) + 0x58);
            else
                var_10 = *(_DWORD *)((char *)*(_DWORD *)((char *)list + 0x30) + 0x60);
        } else {
            if (flags & 2) /* jz loc_41627C */
                var_10 = *(_DWORD *)((char *)*(_DWORD *)((char *)list + 0x30) + 0x5C);
            else
                var_10 = *(_DWORD *)((char *)*(_DWORD *)((char *)list + 0x30) + 0x64);
        }
        *(_DWORD *)((char *)list + 0x5C) = var_10;

        if (typeSigned <= 7) { /* jg SIGNED loc_4162AF */
            *(_DWORD *)((char *)list + 0x3C) = 3;
            *(_DWORD *)((char *)list + 0x40) = 3;
        } else {
            *(_DWORD *)((char *)list + 0x3C) = 4;
            *(_DWORD *)((char *)list + 0x40) = 6;
        }
        *(_DWORD *)((char *)list + 0x44) = *(_DWORD *)((char *)list + 0x3C) << 5; /* shl 5, NOT GF Exists */
        *(_DWORD *)((char *)list + 0x48) = *(_DWORD *)((char *)list + 0x40) << 1; /* shl 1 */
    }

    *(_DWORD *)((char *)list + 0x4C) = 0; /* loc_4162E0 */
    var_2C = *(_DWORD *)list;             /* 8B 11 ; 89 55 D4 */

    switch (var_2C) { /* cmp var_2C,13h ; ja UNSIGNED def_4162FF ; jmp jpt_4162FF[eax*4] */
    case 0: /* loc_416358 */
    case 8: /* loc_416306 */
        *(_DWORD *)((char *)list + 0x9C) = *(_DWORD *)((char *)var_8 + 0xAC); /* slot 43 */
        *(_DWORD *)((char *)list + 0xA0) = *(_DWORD *)((char *)var_8 + 0xC0); /* slot 48 */
        break;
    case 1: /* loc_4164FF */
    case 9: /* loc_4164AD */
        *(_DWORD *)((char *)list + 0x9C) = *(_DWORD *)((char *)var_8 + 0xD0); /* slot 52 */
        *(_DWORD *)((char *)list + 0xA0) = *(_DWORD *)((char *)var_8 + 0xE4); /* slot 57 */
        break;
    case 2: /* loc_416381 */
    case 10: /* loc_41632F */
        *(_DWORD *)((char *)list + 0x9C) = *(_DWORD *)((char *)var_8 + 0xB0); /* slot 44 */
        *(_DWORD *)((char *)list + 0xA0) = *(_DWORD *)((char *)var_8 + 0xC4); /* slot 49 */
        break;
    case 3: /* loc_416528 */
    case 11: /* loc_4164D6 */
        *(_DWORD *)((char *)list + 0x9C) = *(_DWORD *)((char *)var_8 + 0xD4); /* slot 53 */
        *(_DWORD *)((char *)list + 0xA0) = *(_DWORD *)((char *)var_8 + 0xE8); /* slot 58 */
        break;
    case 4: /* loc_4163AA */
    case 6:
    case 12:
    case 14:
    case 17:
        var_C = *(_DWORD *)((char *)list + 0x18);
        if (var_C == 0)
            break;
        if (*(_DWORD *)((char *)var_C + 0x38) == 0)
            break;
        var_18 = *(_DWORD *)((char *)var_C + 0x38);
        var_1C = *(_DWORD *)((char *)var_18 + 0x14);
        if (var_1C == 0)
            break;
        var_14 = *(_DWORD *)((char *)var_1C + 0xA0);
        if (var_14 == 0) {
            *(_DWORD *)((char *)list + 0x9C) = *(_DWORD *)((char *)var_8 + 0xB4); /* 45 */
            *(_DWORD *)((char *)list + 0xA0) = *(_DWORD *)((char *)var_8 + 0xC8); /* 50 */
        } else if ((*(_DWORD *)((char *)var_14 + 0x0C) == 1
                    || (*(_DWORD *)((char *)list + 0x38) & 0x8000))
                   && (*(_DWORD *)((char *)list + 0x38) & 0x10000) == 0) {
            /* loc_416414 */
            *(_DWORD *)((char *)list + 0x9C) = *(_DWORD *)((char *)var_8 + 0xB8); /* 46 */
            *(_DWORD *)((char *)list + 0xA0) = *(_DWORD *)((char *)var_8 + 0xCC); /* 51 */
            *(_DWORD *)((char *)list + 0x4C) = 1;
        } else {
            /* loc_416454 */
            *(_DWORD *)((char *)list + 0x9C) = *(_DWORD *)((char *)var_8 + 0xBC); /* 47 */
            *(_DWORD *)((char *)list + 0xA0) = *(_DWORD *)((char *)var_8 + 0xCC); /* 51 */
            *(_DWORD *)((char *)list + 0x4C) = 2;
        }
        break;
    case 5: /* loc_416551 */
    case 7:
    case 13:
    case 15:
        var_C = *(_DWORD *)((char *)list + 0x18);
        if (var_C == 0)
            break;
        if (*(_DWORD *)((char *)var_C + 0x38) == 0)
            break;
        var_24 = *(_DWORD *)((char *)var_C + 0x38);
        var_28 = *(_DWORD *)((char *)var_24 + 0x14);
        if (var_28 == 0)
            break;
        var_20 = *(_DWORD *)((char *)var_28 + 0xA0);
        if (var_20 == 0) {
            *(_DWORD *)((char *)list + 0x9C) = *(_DWORD *)((char *)var_8 + 0xD8); /* 54 */
            *(_DWORD *)((char *)list + 0xA0) = *(_DWORD *)((char *)var_8 + 0xEC); /* 59 */
        } else if ((*(_DWORD *)((char *)var_20 + 0x0C) == 1
                    || (*(_DWORD *)((char *)list + 0x38) & 0x8000))
                   && (*(_DWORD *)((char *)list + 0x38) & 0x10000) == 0) {
            /* loc_4165BC */
            *(_DWORD *)((char *)list + 0x9C) = *(_DWORD *)((char *)var_8 + 0xDC); /* 55 */
            *(_DWORD *)((char *)list + 0xA0) = *(_DWORD *)((char *)var_8 + 0xF0); /* 60 */
            *(_DWORD *)((char *)list + 0x4C) = 1;
        } else {
            /* loc_4165FB */
            *(_DWORD *)((char *)list + 0x9C) = *(_DWORD *)((char *)var_8 + 0xE0); /* 56 */
            *(_DWORD *)((char *)list + 0xA0) = *(_DWORD *)((char *)var_8 + 0xF0); /* 60 */
            *(_DWORD *)((char *)list + 0x4C) = 2;
        }
        break;
    case 18: /* loc_416651 */
        *(_DWORD *)((char *)list + 0x9C) = *(_DWORD *)((char *)var_8 + 0xF4); /* 61 */
        *(_DWORD *)((char *)list + 0xA0) = *(_DWORD *)((char *)var_8 + 0xFC); /* 63 */
        break;
    case 19: /* loc_416677 */
        *(_DWORD *)((char *)list + 0x9C) = *(_DWORD *)((char *)var_8 + 0xF8);  /* 62 */
        *(_DWORD *)((char *)list + 0xA0) = *(_DWORD *)((char *)var_8 + 0x100); /* 64 */
        break;
    case 16: /* jpt[16] = def_4162FF */
    default: /* ja type > 19u, including negatives as unsigned */
        /* +9Ch / +0A0h remain 0 */
        break;
    }
}
```
