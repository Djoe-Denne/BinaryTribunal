# BS_CameraAnim_Tick @ 0x5035E0

- Instr (live): 434
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=15631
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=12883
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=15064
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BS_CameraAnim_Tick(int task)
- Notes parent: ESI=*(task+0xC). Decode loop WORD time/dur jl/jge signes; EAX=0 => BYTE 0xFF, AND WORD flags, return 2. count 1 direct / 2 linear / else spline. Q12 cdq/idiv SAR 0Ch. Scratch 16 bs_modulo, Unwind 16. TEST 101h freeze time sinon +16. FOV word_1D8E038, roll word_1D977A2. Occupancy/0xD0/0x1D0 absents. Pas de Hex-Rays.

## C réconcilié

```c
/* BS_CameraAnim_Tick @ 0x5035E0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 434 instr, size 0x4F9, end 0x503AD9. IDA type int __cdecl(int).
 * cdecl 1 arg: BdLink node. ESI = *(task+0xC) record. push ecx scratch.
 * Saved ESI; interpolate path also EBX/EBP/EDI. Decode-fail only pops ESI+ECX.
 * add esp: Decode 8, bs_modulo 4, timeOp 8, two sub_50D1E0 then 50h, BF0 14h,
 * AE0 1Ch or paired 38h at loc_503A68, Unwind 4.
 * jl/jge signed (7C/7D/0F 8D). No ja/jg/setcc/jpt.
 * Widths: 66 WORD time/dur/xyz scratch/flags AND/FOV/roll/+10h; BYTE variant/count/flags;
 * DWORD ip [esi+10], task+0xC, test 101h, local EDI+8 over arg_0.
 * Occupancy / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / GetRandomInt: absent.
 * No Hex-Rays. No domain::.
 */

extern unsigned int g_BattleCameraFlags;                  /* 0x1D97718 itemsz 4; this fn ANDs WORD */
extern unsigned int battle_to_update_flags_dword_1D96A9C; /* 0x1D96A9C */
extern __int16 word_1D8E038;                             /* 0x1D8E038 FOV */
extern __int16 word_1D977A2;                             /* 0x1D977A2 roll */

extern __int16 *__cdecl BattleCamera_DecodeNextSegment(unsigned __int16 *ip, int rec);
extern int __cdecl bs_modulo(int);
extern int __cdecl bs_camera_timeOp_unk(int t_q12, __int16 op);
extern __int16 *__cdecl sub_50D1E0(int t, int times, int x, int y, int z, int count,
                                  int d0, int d1, int d2, __int16 *dst);
extern char __cdecl sub_503BF0(__int16 *dst, unsigned __int8 a, unsigned __int8 b, int t, int out14);
extern __int16 *__cdecl sub_503AE0(__int16 *x, __int16 *y, __int16 *z, unsigned __int8 flag,
                                   __int16 *o14, __int16 *o16, __int16 *o18);
extern char __cdecl BattleScratch_Unwind(int);

int __cdecl BS_CameraAnim_Tick(int task)
{
    unsigned char *rec;
    __int16 *scratch;
    __int16 *look_dst;
    int time;
    int dur;
    int count;
    int t;
    int knot;
    int t0;
    int t1;
    int seg;

    rec = *(unsigned char **)(task + 0xC); /* 8B 70 0C */
    time = *(__int16 *)(rec + 0xC);        /* 66 8B 4E 0C */
    dur = *(__int16 *)(rec + 0xE);         /* 66 3B 4E 0E */

    while (time >= dur) { /* jl loc_503615 signed */
        /* loc_5035F3 */
        seg = (int)BattleCamera_DecodeNextSegment(*(__int16 **)(rec + 0x10), (int)rec);
        *(int *)(rec + 0x10) = seg; /* 89 46 10 DWORD */
        if (seg == 0) {
            /* loc_503747: before push ebx; no Unwind */
            unsigned int mask = 1u << rec[0]; /* 8A 0E; D3 E2 */
            rec[0] = 0xFFu;                    /* C6 06 FF */
            *(unsigned __int16 *)&g_BattleCameraFlags &= (unsigned __int16)~mask; /* 66 21 */
            return 2;
        }
        time = *(__int16 *)(rec + 0xC);
        dur = *(__int16 *)(rec + 0xE);
    }

    scratch = (__int16 *)bs_modulo(0x10); /* EDI, add esp,4 */
    count = rec[1];                        /* 33 C0; 8A 46 01 */
    if (count == 1)
        goto loc_503A09;
    if (count == 2)
        goto loc_503833;

    /* spline: count==0 or >=3 */
    t = bs_camera_timeOp_unk((time << 12) / dur, *(__int16 *)(rec + 2));
    t = (dur * t) >> 12; /* IMUL; SAR 0Ch */
    count = rec[1] & 0xFF; /* 25 FF 00 00 00 after AL reload; high EAX was timeOp */
    knot = count - 1;     /* XOR CX,CX; MOV CL,AL; DEC ECX; MOVSX EBP,CX */
    if (t >= *(__int16 *)(rec + knot * 2 + 0x24))
        goto loc_5037D4;

    sub_50D1E0(
        t,
        (int)(rec + 0x24),
        (int)(rec + 0x64),
        (int)(rec + 0xA4),
        (int)(rec + 0xE4),
        count,
        (int)(rec + 0x224),
        (int)(rec + 0x2A4),
        (int)(rec + 0x324),
        scratch);
    look_dst = scratch + 4; /* LEA EAX,[EDI+8]; 89 44 24 44 overwrites arg_0 */
    sub_50D1E0(
        t,
        (int)(rec + 0x24),
        (int)(rec + 0x144),
        (int)(rec + 0x184),
        (int)(rec + 0x1C4),
        rec[1], /* 33 D2; 8A 56 01 */
        (int)(rec + 0x3A4),
        (int)(rec + 0x424),
        (int)(rec + 0x4A4),
        look_dst);
    /* add esp,50h after both calls */

    knot = 0; /* 33 ED */
    if (t >= *(__int16 *)(rec + 0x24)) { /* 7C loc_503709 */
        do {
            knot++; /* loc_5036FD: ADD EAX,2; INC EBP; CMP EBX,[EAX] JGE */
        } while (t >= *(__int16 *)(rec + knot * 2 + 0x24));
    }

    t0 = *(__int16 *)(rec + knot * 2 + 0x22); /* [esi+ebp*2+22h] even if knot==0 */
    t1 = *(__int16 *)(rec + knot * 2 + 0x24);
    t = ((t - t0) << 12) / (t1 - t0); /* CDQ/IDIV */

    if (rec[knot + 0x124] != rec[knot + 0x123])
        sub_503BF0(scratch, rec[knot + 0x123], rec[knot + 0x124], t, (int)(rec + 0x14));
    else
        sub_503AE0(
            scratch,
            scratch + 1,
            scratch + 2,
            rec[knot + 0x124],
            (__int16 *)(rec + 0x14),
            (__int16 *)(rec + 0x16),
            (__int16 *)(rec + 0x18));

    if (rec[knot + 0x204] != rec[knot + 0x203])
        sub_503BF0(look_dst, rec[knot + 0x203], rec[knot + 0x204], t, (int)(rec + 0x1C));
    else
        /* loc_5037AD: LEA [EDI+0Ch] then ADD EDI,0Ah => look_dst, +2, +4 */
        sub_503AE0(
            look_dst,
            look_dst + 1,
            look_dst + 2,
            rec[knot + 0x204],
            (__int16 *)(rec + 0x1C),
            (__int16 *)(rec + 0x1E),
            (__int16 *)(rec + 0x20));
    goto loc_503A70;

loc_5037D4:
    sub_503AE0(
        (__int16 *)(rec + knot * 2 + 0x64),
        (__int16 *)(rec + knot * 2 + 0xA4),
        (__int16 *)(rec + knot * 2 + 0xE4),
        rec[knot + 0x124],
        (__int16 *)(rec + 0x14),
        (__int16 *)(rec + 0x16),
        (__int16 *)(rec + 0x18));
    sub_503AE0(
        (__int16 *)(rec + knot * 2 + 0x144),
        (__int16 *)(rec + knot * 2 + 0x184),
        (__int16 *)(rec + knot * 2 + 0x1C4),
        rec[knot + 0x204],
        (__int16 *)(rec + 0x1C),
        (__int16 *)(rec + 0x1E),
        (__int16 *)(rec + 0x20)); /* 2nd via jmp loc_503A68; ADD ESP,38h */
    goto loc_503A70;

loc_503833:
    if (time >= *(__int16 *)(rec + 0x26)) /* times[1], signed JGE */
        goto loc_503995;
    t = bs_camera_timeOp_unk((time << 12) / *(__int16 *)(rec + 0x26), *(__int16 *)(rec + 2));

    scratch[0] = (__int16)(
        *(__int16 *)(rec + 0x64)
        + (((*(__int16 *)(rec + 0x66) - *(__int16 *)(rec + 0x64)) * t) >> 12)); /* 66 89 17 */
    scratch[1] = (__int16)(
        *(__int16 *)(rec + 0xA4)
        + (((*(__int16 *)(rec + 0xA6) - *(__int16 *)(rec + 0xA4)) * t) >> 12));
    scratch[2] = (__int16)(
        *(__int16 *)(rec + 0xE4)
        + (((*(__int16 *)(rec + 0xE6) - *(__int16 *)(rec + 0xE4)) * t) >> 12));
    if (rec[0x124] != rec[0x125])
        sub_503BF0(scratch, rec[0x124], rec[0x125], t, (int)(rec + 0x14));
    else
        sub_503AE0(
            scratch,
            scratch + 1,
            scratch + 2,
            rec[0x124],
            (__int16 *)(rec + 0x14),
            (__int16 *)(rec + 0x16),
            (__int16 *)(rec + 0x18));

    scratch[0] = (__int16)(
        *(__int16 *)(rec + 0x144)
        + (((*(__int16 *)(rec + 0x146) - *(__int16 *)(rec + 0x144)) * t) >> 12));
    scratch[1] = (__int16)(
        *(__int16 *)(rec + 0x184)
        + (((*(__int16 *)(rec + 0x186) - *(__int16 *)(rec + 0x184)) * t) >> 12));
    scratch[2] = (__int16)(
        *(__int16 *)(rec + 0x1C4)
        + (((*(__int16 *)(rec + 0x1C6) - *(__int16 *)(rec + 0x1C4)) * t) >> 12));
    if (rec[0x204] != rec[0x205])
        sub_503BF0(scratch, rec[0x204], rec[0x205], t, (int)(rec + 0x1C));
    else
        sub_503AE0(
            scratch,
            scratch + 1,
            scratch + 2,
            rec[0x204],
            (__int16 *)(rec + 0x1C),
            (__int16 *)(rec + 0x1E),
            (__int16 *)(rec + 0x20));
    goto loc_503A70;

loc_503995:
    scratch[0] = *(__int16 *)(rec + 0x66);
    scratch[1] = *(__int16 *)(rec + 0xA6);
    scratch[2] = *(__int16 *)(rec + 0xE6);
    sub_503AE0(
        scratch,
        scratch + 1,
        scratch + 2,
        rec[0x125],
        (__int16 *)(rec + 0x14),
        (__int16 *)(rec + 0x16),
        (__int16 *)(rec + 0x18));
    scratch[0] = *(__int16 *)(rec + 0x146);
    scratch[1] = *(__int16 *)(rec + 0x186);
    scratch[2] = *(__int16 *)(rec + 0x1C6);
    sub_503AE0(
        scratch,
        scratch + 1,
        scratch + 2,
        rec[0x205],
        (__int16 *)(rec + 0x1C),
        (__int16 *)(rec + 0x1E),
        (__int16 *)(rec + 0x20));
    goto loc_503A70;

loc_503A09:
    if ((rec[2] & 1) != 0 && *(__int16 *)(rec + 0xC) != 0) /* F6 46 02 01; 66 83 7E 0C 00 */
        goto loc_503A70;
    sub_503AE0(
        (__int16 *)(rec + 0x64),
        (__int16 *)(rec + 0xA4),
        (__int16 *)(rec + 0xE4),
        rec[0x124],
        (__int16 *)(rec + 0x14),
        (__int16 *)(rec + 0x16),
        (__int16 *)(rec + 0x18));
    sub_503AE0(
        (__int16 *)(rec + 0x144),
        (__int16 *)(rec + 0x184),
        (__int16 *)(rec + 0x1C4),
        rec[0x204],
        (__int16 *)(rec + 0x1C),
        (__int16 *)(rec + 0x1E),
        (__int16 *)(rec + 0x20));
    /* fall through; ADD ESP,38h */

loc_503A70:
    if ((battle_to_update_flags_dword_1D96A9C & 0x101) == 0) /* F7 05 ... 01 01 00 00 */
        *(__int16 *)(rec + 0xC) += 0x10; /* 66 83 46 0C 10 */
    t = ((int)*(__int16 *)(rec + 0xC) << 12) / (int)*(__int16 *)(rec + 0xE);
    word_1D8E038 = (__int16)(
        *(__int16 *)(rec + 4)
        + (((*(__int16 *)(rec + 6) - *(__int16 *)(rec + 4)) * t) >> 12)); /* 66 89 15 */
    word_1D977A2 = (__int16)(
        *(__int16 *)(rec + 8)
        + (((*(__int16 *)(rec + 0xA) - *(__int16 *)(rec + 8)) * t) >> 12));
    BattleScratch_Unwind(0x10); /* PUSH 10h at 503A93 */
    return 0;                   /* 33 C0 */
}
```
