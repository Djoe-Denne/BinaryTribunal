# BattleUI_DispatchCmdKey_80to8F @ 0x4A2F80

- Instr (live): 206
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=2770
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=1352
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=1599
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleUI_DispatchCmdKey_80to8F(int p_arg0, int p_arg4, int p_cmd_key, unsigned __int16 p_argC, unsigned __int16 p_arg10)
- Notes parent: jpt_4A2FA5 16 voies; ja UNSIGNED cmd_key-0x80>15; 0x89/0x8A default eax=0. Get_command_key(flag,slot,0) AL&0xFF jnz index sinon (0,slot,0). Transform A-Z +4 / 0-9 -0x0F / else 0x20 SIGNED jl/jg. sub_4A1020 6 args add esp 18h. Occupancy/F_CHAR/slot0xD0/GetRandomInt absents. Pas de Hex-Rays.

## C réconcilié

```c
/* BattleUI_DispatchCmdKey_80to8F @ 0x4A2F80
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes + jpt_4A2FA5 @ 0x4A31E0.
 * 206 instr, size 0x260, end 0x4A31E0. IDA type int __cdecl(int, int, int, unsigned __int16, unsigned __int16).
 * Occupancy 1+2 unused. F_CHAR 0x1D0 unused. slot 0xD0 unused. GetRandomInt absent.
 * ja UNSIGNED vs 0Fh after cmd_key-0x80. strlen jle / loop jl / A-Z 0-9 jg are SIGNED.
 * Stores BYTE to var_14[20]. arg_C/arg_10 AND 0xFFFF then inc arg_10. No 66 prefix. No setcc.
 * Return EAX = sub_4A1020. No packed struct.
 */

extern unsigned char byte_B8600E; /* 0xB8600E BYTE; ecx = 0 or 1 */
extern const char *off_B86010[];   /* 0xB86010 DWORD ptr table, index AL after AND 0xFF */

char __cdecl error_Get_command_key(unsigned int a0, int slot, unsigned int a8);
int __cdecl sub_4A1020(int *a0, int a1, int a2, int a3, unsigned __int8 *a4, int a5);

int __cdecl BattleUI_DispatchCmdKey_80to8F(int p_arg0, int p_arg4, int p_cmd_key,
                                           unsigned __int16 p_argC,
                                           unsigned __int16 p_arg10)
{
    unsigned char buf[20]; /* var_14, sub esp,14h */
    int flag;
    int slot;
    unsigned int idx;
    const char *s;
    int len;
    int i;
    signed char c;

    flag = 0;
    if (byte_B8600E != 0)
        flag = 1;

    /* edx = p_cmd_key + 0xFFFFFF80; cmp edx,0Fh; ja UNSIGNED def_4A2FA5; jmp jpt_4A2FA5[edx*4] */
    switch (p_cmd_key) {
    case 0x80: slot = 0; goto lookup;      /* jpt[0] loc_4A3072 */
    case 0x81: slot = 1; goto lookup;      /* jpt[1] loc_4A3093 */
    case 0x82: slot = 2; goto lookup;      /* jpt[2] loc_4A3030 */
    case 0x83: slot = 3; goto lookup;      /* jpt[3] loc_4A3051 */
    case 0x84: slot = 4; goto lookup;      /* jpt[4] loc_4A300F */
    case 0x85: slot = 5; goto lookup;      /* jpt[5] loc_4A2FAC */
    case 0x86: slot = 6; goto lookup;      /* jpt[6] loc_4A2FCD */
    case 0x87: slot = 7; goto lookup;      /* jpt[7] loc_4A2FEE */
    case 0x88: slot = 8; goto lookup;      /* jpt[8] loc_4A30D5 */
    case 0x8B: slot = 0xB; goto lookup;    /* jpt[11] loc_4A30B4 */
    case 0x8C: slot = 0xC; goto lookup;    /* jpt[12] loc_4A3109 */
    case 0x8D: slot = 0xD; goto lookup;    /* jpt[13] loc_4A3123 */
    case 0x8E: slot = 0xE; goto lookup;    /* jpt[14] loc_4A30EF */
    case 0x8F: slot = 0xF; goto lookup;    /* jpt[15] loc_4A313D */
    default:                              /* ja + jpt[9]=0x89 + jpt[10]=0x8A; eax still 0 */
        idx = 0;
        goto transform;
    }

lookup:
    /* push 0; push slot; push flag; call; add esp,0Ch; and eax,0FFh; jnz def_4A2FA5 */
    idx = (unsigned int)error_Get_command_key((unsigned int)flag, slot, 0) & 0xFFu;
    if (idx != 0)
        goto transform;
    /* loc_4A3155: push 0; push slot; push 0; call; add esp,0Ch; and eax,0FFh; fallthrough */
    idx = (unsigned int)error_Get_command_key(0, slot, 0) & 0xFFu;

transform:
    /* def_4A2FA5: esi = off_B86010[eax]; or ecx,-1; xor eax,eax; repne scasb; not ecx; dec ecx */
    s = off_B86010[idx];
    len = 0;
    while (s[len] != 0)
        len++;
    i = 0;
    if (len > 0) { /* test ecx,ecx; jle SIGNED loc_4A31A5 */
        do { /* loc_4A317F; cmp edx,ecx; jl SIGNED */
            c = (signed char)s[i];
            if (c >= 'A' && c <= 'Z') /* jl / jg SIGNED vs 41h / 5Ah */
                c = (signed char)(c + 4);
            else if (c >= '0' && c <= '9') /* jl / jg SIGNED vs 30h / 39h */
                c = (signed char)(c - 0x0F);
            else
                c = 0x20;
            buf[i] = (unsigned char)c; /* BYTE store */
            i++;
        } while (i < len);
    }
    buf[i] = 0; /* BYTE terminator at edx (0 if len<=0) */

    /* push 4; push &var_14; push (arg_10&0xFFFF)+1; push arg_C&0xFFFF; push arg_4; push arg_0 */
    return sub_4A1020((int *)p_arg0,
                      p_arg4,
                      (int)((unsigned int)p_argC & 0xFFFFu),
                      (int)(((unsigned int)p_arg10 & 0xFFFFu) + 1),
                      buf,
                      4);
}
```
