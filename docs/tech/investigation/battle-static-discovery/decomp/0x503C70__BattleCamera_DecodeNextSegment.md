# BattleCamera_DecodeNextSegment @ 0x503C70

- Instr (live): 259
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=14500
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=15033
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=13615
- A==B: non
- Push IDB: oui
- SetType: __int16 *__cdecl BattleCamera_DecodeNextSegment(unsigned __int16 *, int)
- Notes parent: *stream==0xFFFF → EAX=0. FOV (hdr>>6)&3 cascade dec/jz (1=0x200, 2=un WORD, 3=deux WORDs). Roll (hdr>>8)&3 jpt_503CFA ja>3. bit0=0 copie 18o ; bit0=1 2×sub_503AE0 + BYTE 0xFB. Durée signée *16 (shl 4). Spline cmp dx,2 jle signé, 2×sub_50D010 add esp 40h (2e args +0x3A4/+0x424/+0x4A4). Tail (BYTE[out+2]&0x3E)==0x1E → sub_503300. BYTE count [out+1], WORD total [out+0Eh], WORD [out+0Ch]=0, EAX=edi+2. Occupancy 1+2 absent. Stores 66=WORD, C6/88=BYTE.

## C réconcilié

```c
/* BattleCamera_DecodeNextSegment @ 0x503C70
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 259 instr, size 0x355, end 0x503FC5. IDA type __int16 *__cdecl(unsigned __int16 *, int).
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 unused.
 * Keyframes 18 bytes (duration WORD + 16-byte body). Duration units shl 4.
 * Terminator = signed duration < 0 (0xFFFF). Spline iff signed key count > 2.
 * No Hex-Rays. No domain::.
 */

extern unsigned __int16 word_1D977A2; /* 0x1D977A2 */

extern unsigned __int16 *__cdecl sub_503AE0(
    unsigned __int16 *a,
    unsigned __int16 *b,
    unsigned __int16 *c,
    unsigned __int8 tag,
    unsigned __int16 *dst0,
    unsigned __int16 *dst1,
    unsigned __int16 *dst2);

extern int __cdecl sub_50D010(int, int, int, int, int, int, int, int);
extern int sub_503300(void);

__int16 *__cdecl BattleCamera_DecodeNextSegment(unsigned __int16 *stream, int out)
{
    unsigned char *o = (unsigned char *)out;
    unsigned __int16 *p = stream;
    unsigned int hdr;
    int cum_time; /* EBP / var_4: duration units * 16 */
    int nkeys;    /* EDX: key index then count */
    int i;
    unsigned __int16 fov;
    unsigned __int16 roll;
    unsigned __int16 w;
    short dur;

    if (*p == 0xFFFFu)
        return 0; /* xor eax,eax ; only EDI popped */

    hdr = *p;
    *(unsigned __int16 *)(o + 2) = (unsigned __int16)hdr;
    p++; /* add edi,2 */

    /* bits 6..7: (hdr>>6)&3 then dec/jz cascade (not a jump table) */
    switch ((hdr >> 6) & 3) {
    case 1: /* loc_503CE0 */
        *(unsigned __int16 *)(o + 6) = 0x200;
        *(unsigned __int16 *)(o + 4) = 0x200;
        break;
    case 2: /* loc_503CD0: one WORD copied to both */
        fov = *p++;
        *(unsigned __int16 *)(o + 6) = fov;
        *(unsigned __int16 *)(o + 4) = fov;
        break;
    case 3: /* fall after three dec: two WORDs */
        *(unsigned __int16 *)(o + 4) = *p++;
        *(unsigned __int16 *)(o + 6) = *p++;
        break;
    default: /* 0: no extra */
        break;
    }

    /* bits 8..9: jpt_503CFA @ 0x503FC8, ja unsigned >3 -> def_503CFA */
    switch ((hdr >> 8) & 3) {
    case 0: /* loc_503D01 */
        roll = word_1D977A2;
        *(unsigned __int16 *)(o + 0xA) = roll;
        *(unsigned __int16 *)(o + 8) = roll;
        break;
    case 1: /* loc_503D11: BX==0 */
        *(unsigned __int16 *)(o + 0xA) = 0;
        *(unsigned __int16 *)(o + 8) = 0;
        break;
    case 2: /* loc_503D1B then loc_503D39 add edi,2 */
        w = *p++;
        *(unsigned __int16 *)(o + 0xA) = w;
        *(unsigned __int16 *)(o + 8) = w;
        break;
    case 3: /* loc_503D28: WORD +8, WORD +0Ah */
        *(unsigned __int16 *)(o + 8) = *p++;
        *(unsigned __int16 *)(o + 0xA) = *p++;
        break;
    }

    cum_time = 0;
    nkeys = 0;

    /* bit0: and ecx,1 ; sub ecx,ebx (ebx==0) ; jz loc_503E90. dec/jnz loc_503F9B unreachable. */
    if ((hdr & 1) == 0) {
        /* loc_503E90: verbatim 18-byte keys until signed duration < 0 */
        dur = (short)*p;
        if (dur >= 0) {
            do {
                i = nkeys;
                *(unsigned __int16 *)(o + 0x24 + i * 2) = (unsigned __int16)cum_time;
                cum_time += (int)(unsigned __int16)dur << 4; /* shl ecx,4 */
                p++; /* skip duration WORD */
                o[0x124 + i] = *(unsigned char *)p; /* BYTE then add edi,2 */
                p++;
                *(unsigned __int16 *)(o + 0x64 + i * 2) = *p++;
                *(unsigned __int16 *)(o + 0xA4 + i * 2) = *p++;
                *(unsigned __int16 *)(o + 0xE4 + i * 2) = *p++;
                o[0x204 + i] = *(unsigned char *)p;
                p++;
                *(unsigned __int16 *)(o + 0x144 + i * 2) = *p++;
                *(unsigned __int16 *)(o + 0x184 + i * 2) = *p++;
                *(unsigned __int16 *)(o + 0x1C4 + i * 2) = *p++;
                nkeys++;
                dur = (short)*p;
            } while (dur >= 0); /* cmp cx,bx ; jge loc_503E9C */
        }
    } else {
        /* loc_503D4E: two sub_503AE0 per key; BYTE 0xFB at +0x204/+0x124 */
        dur = (short)*p;
        if (dur >= 0) { /* jl loc_503F9B */
            do {
                unsigned char *kb;
                i = nkeys;
                *(unsigned __int16 *)(o + 0x24 + i * 2) = (unsigned __int16)cum_time;
                cum_time += (int)(unsigned __int16)dur << 4; /* shl eax,4 */
                p++; /* add edi,2 past duration */
                kb = (unsigned char *)p;

                /* cdecl 7 args; add esp,38h after the pair (14*4) */
                sub_503AE0(
                    (unsigned __int16 *)(kb + 2),
                    (unsigned __int16 *)(kb + 4),
                    (unsigned __int16 *)(kb + 6),
                    kb[0],
                    (unsigned __int16 *)(o + 0x64 + i * 2),
                    (unsigned __int16 *)(o + 0xA4 + i * 2),
                    (unsigned __int16 *)(o + 0xE4 + i * 2));
                sub_503AE0(
                    (unsigned __int16 *)(kb + 0xA),
                    (unsigned __int16 *)(kb + 0xC),
                    (unsigned __int16 *)(kb + 0xE),
                    kb[8],
                    (unsigned __int16 *)(o + 0x144 + i * 2),
                    (unsigned __int16 *)(o + 0x184 + i * 2),
                    (unsigned __int16 *)(o + 0x1C4 + i * 2));

                o[0x204 + i] = 0xFB;
                o[0x124 + i] = 0xFB;

                p += 8; /* add edi,10h: 16-byte body */
                nkeys++;
                dur = (short)*p; /* test ax,ax ; jge loc_503D7E */
            } while (dur >= 0);
        }
    }

    /* loc_503F26: cmp dx,2 ; jle loc_503F9B (SIGNED). movsx ebx,dx count. */
    if (nkeys > 2) {
        /* first: push 324,2A4,224,count,E4,A4,64,24 then add esp,40h after pair */
        sub_50D010(
            (int)(o + 0x24),
            (int)(o + 0x64),
            (int)(o + 0xA4),
            (int)(o + 0xE4),
            nkeys,
            (int)(o + 0x224),
            (int)(o + 0x2A4),
            (int)(o + 0x324));
        /* second: push 4A4,424,3A4,count,1C4,184,144,24 */
        sub_50D010(
            (int)(o + 0x24),
            (int)(o + 0x144),
            (int)(o + 0x184),
            (int)(o + 0x1C4),
            nkeys,
            (int)(o + 0x3A4),
            (int)(o + 0x424),
            (int)(o + 0x4A4));
    }

    /* loc_503F9B: BYTE [out+2] & 0x3E == 0x1E -> sub_503300 (0 args) */
    if ((o[2] & 0x3E) == 0x1E)
        sub_503300();

    o[1] = (unsigned char)nkeys;                          /* DL */
    *(unsigned __int16 *)(o + 0xE) = (unsigned __int16)cum_time; /* BP */
    *(unsigned __int16 *)(o + 0xC) = 0;
    return (__int16 *)(p + 1); /* lea eax,[edi+2] past terminator WORD */
}
```
