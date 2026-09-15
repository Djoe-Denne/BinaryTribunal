# BattleScript_EvalUntilYield @ 0x50DB40

- Instr (live): 271
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=7872 (effort_used=high)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=8970 (effort_used=high)
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=20257 (effort_used=high)
- A==B: non
- Push IDB: oui
- SetType: unsigned __int8 *__cdecl BattleScript_EvalUntilYield(unsigned __int8 *, int (__cdecl *)(_DWORD, unsigned __int8 **), int (__cdecl *)(int), void (__cdecl *)(int, int))
- Notes parent: cdecl 4 args (add esp,10h), EDX unused. 3 jpt (fetch&3 / ALU byte_50DEA8 / E4-F3). ja unsigned, jl signe vs 80h, pas de jg ni 66. Slot DWORD [esp+40Ch-4*id]. E4 sans avancée PC. Yield dispatch EAX!=0. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. qmd vide. Pas de Hex-Rays.

## C réconcilié

```c
/* BattleScript_EvalUntilYield @ 0x50DB40
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 271 instr, size 0x32E, end 0x50DE6E. cdecl 4 args (callers add esp,10h). retn C3.
 * IDA __usercall+EDX is wrong: EDX unused. Saved ebx,ebp,esi,edi. sub esp,40h.
 * After prologue: [esp+54h] running PC (arg_0 home), [esp+58h] dispatch,
 * [esp+5Ch] getter, [esp+60h] setter — LOW BYTE overwritten with opcode each loop
 * (88 44 24 60). ebp keeps setter. ebx=rhs, esi=acc; both init = cursor as int.
 * <0xC0: call dispatch(dirty_dword, &pc) add esp,8; test eax / jnz yield.
 * 0xC0-0xE3: jpt_50DBA1[op&3] fetch then byte_50DEA8[(op&~3)-0xC0] ALU.
 * 0xE4-0xF3: jpt_50DC8B[op-0xE4]. 0xF4+: ja back to def_50DC23 (same byte).
 * E4 xor esi,esi does NOT advance PC (ASM). Slot DWORD [esp+40Ch-4*id]
 * = *(int *)((char *)&cursor + 0x3B8 - 4*id)  (0x40C-0x54=0x3B8).
 * ja unsigned jpt bounds. jl SIGNED vs 80h. No 66. No jg.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No Hex-Rays. No domain::.
 */

int __cdecl sub_50DAC0(unsigned char *); /* s16 LE movsx, add esp,4 */
int __cdecl sub_50DAA0(char *); /* s8 movsx, add esp,4 */
int __cdecl sub_50DAB0(unsigned char *); /* u8 movzx, add esp,4 */
int __cdecl Script_SkipS8_OrPlus2(int cond, int pc); /* add esp,8 */
int __cdecl Script_SkipU16BE_OrPlus3(int cond, int pc); /* add esp,8; offset is s16 LE via DAC0 */

/* 33 u8 @ 0x50DEA8; 9 = default -> def_50DC23 */
static const unsigned char byte_50DEA8[33] = {
    0, 9, 9, 9, 1, 9, 9, 9, 2, 9, 9, 9, 3, 9, 9, 9,
    4, 9, 9, 9, 5, 9, 9, 9, 6, 9, 9, 9, 7, 9, 9, 9,
    8
};

unsigned char *__cdecl BattleScript_EvalUntilYield(
    unsigned char *cursor,
    int (__cdecl *dispatch)(unsigned int, unsigned char **),
    int (__cdecl *getter)(int),
    void (__cdecl *setter)(int, int))
{
    unsigned char *pc;
    unsigned int op_dword;
    unsigned int opcode;
    unsigned int grp;
    int acc;
    int rhs;
    int id;

    pc = cursor;
    rhs = (int)cursor; /* ebx */
    acc = (int)cursor; /* esi */
    op_dword = (unsigned int)setter; /* arg_C; low byte smashed each loop */

    for (;;) { /* def_50DC23 */
        opcode = *pc; /* mov al,[ecx] */
        op_dword = (op_dword & 0xFFFFFF00u) | opcode; /* mov byte [esp+60h], al */

        if (opcode < 0xC0u) { /* cmp al,0C0h / jnb unsigned */
            pc += 1; /* inc ecx; store PC */
            if (dispatch(op_dword, &pc) != 0) /* add esp,8; test eax / jnz */
                return pc; /* loc_50DE62: EAX=[esp+54h] */
            continue;
        }

        if (opcode < 0xE4u) { /* cmp al,0E4h / jnb loc_50DC74 */
            switch (opcode & 3u) { /* jpt_50DBA1; cmp 3 / ja dead because &3<=3 */
            case 0: /* loc_50DBA8: s16 LE at pc+1, PC+=3 */
                rhs = sub_50DAC0(pc + 1);
                pc += 3;
                break;
            case 1: /* loc_50DBBD: s8, PC+=2 via loc_50DBF9 */
                rhs = sub_50DAA0((char *)(pc + 1));
                pc += 2;
                break;
            case 2: /* loc_50DBC6: u8, PC+=2 via loc_50DBF9 */
                rhs = sub_50DAB0(pc + 1);
                pc += 2;
                break;
            case 3: /* loc_50DBCF */
                id = sub_50DAB0(pc + 1);
                rhs = id; /* mov ebx,eax before cmp */
                if (id < 0x80) /* cmp 80h / jl SIGNED */
                    rhs = getter(id); /* loc_50DBF4; add esp,4 */
                else
                    rhs = *(int *)((char *)&cursor + 0x3B8 - 4 * id);
                pc += 2;
                break;
            }

            /* def_50DBA1: and edi,~3; add edi,0FFFFFF40h; cmp 20h / ja */
            grp = (opcode & 0xFFFFFFFCu) + 0xFFFFFF40u;
            if (grp > 0x20u) /* unsigned ja; dead for 0xC0..0xE3 */
                continue;
            switch (byte_50DEA8[grp]) { /* jpt_50DC23 */
            case 0: acc = rhs; break; /* loc_50DC2A C0-C3 mov */
            case 1: acc += rhs; break; /* loc_50DC31 C4-C7 add */
            case 2: acc -= rhs; break; /* loc_50DC38 C8-CB sub */
            case 3: acc *= rhs; break; /* loc_50DC3F CC-CF imul */
            case 4: acc /= rhs; break; /* loc_50DC47 D0-D3 cdq/idiv quot, signed, no 0 check */
            case 5: acc &= rhs; break; /* loc_50DC53 D4-D7 and */
            case 6: acc |= rhs; break; /* loc_50DC5A D8-DB or */
            case 7: acc ^= rhs; break; /* loc_50DC61 DC-DF xor */
            case 8: acc %= rhs; break; /* loc_50DC68 E0-E3 cdq/idiv rem edx */
            default: break; /* 9 -> def_50DC23 */
            }
            continue;
        }

        /* loc_50DC74 */
        grp = (opcode & 0xFFu) + 0xFFFFFF1Cu; /* opcode - 0xE4 */
        if (grp > 0xFu) /* cmp 0Fh / ja unsigned: 0xF4+ re-reads same byte */
            continue;

        switch (grp) { /* jpt_50DC8B */
        case 0: /* E4 loc_50DC92: no PC advance */
            acc = 0;
            break;
        case 1: /* E5 loc_50DC99 */
            id = sub_50DAB0(pc + 1);
            rhs = id;
            if (id < 0x80) /* jl SIGNED */
                setter(id, acc); /* loc_50DCCF: push esi; push ebx; call ebp; add esp,8 */
            else
                *(int *)((char *)&cursor + 0x3B8 - 4 * id) = acc; /* DWORD 89 32 */
            pc += 2;
            break;
        case 2: /* E6 loc_50DCE6 */
            pc = (unsigned char *)Script_SkipS8_OrPlus2(1, (int)pc);
            break;
        case 3: /* E7 setnle esi>0 */
            pc = (unsigned char *)Script_SkipS8_OrPlus2(acc > 0, (int)pc);
            break;
        case 4: /* E8 setnl esi>=0 */
            pc = (unsigned char *)Script_SkipS8_OrPlus2(acc >= 0, (int)pc);
            break;
        case 5: /* E9 setz */
            pc = (unsigned char *)Script_SkipS8_OrPlus2(acc == 0, (int)pc);
            break;
        case 6: /* EA setnz */
            pc = (unsigned char *)Script_SkipS8_OrPlus2(acc != 0, (int)pc);
            break;
        case 7: /* EB setle */
            pc = (unsigned char *)Script_SkipS8_OrPlus2(acc <= 0, (int)pc);
            break;
        case 8: /* EC setl */
            pc = (unsigned char *)Script_SkipS8_OrPlus2(acc < 0, (int)pc);
            break;
        case 9: /* ED loc_50DDA4 */
            pc = (unsigned char *)Script_SkipU16BE_OrPlus3(1, (int)pc);
            break;
        case 10: /* EE setnle */
            pc = (unsigned char *)Script_SkipU16BE_OrPlus3(acc > 0, (int)pc);
            break;
        case 11: /* EF setnl */
            pc = (unsigned char *)Script_SkipU16BE_OrPlus3(acc >= 0, (int)pc);
            break;
        case 12: /* F0 setz */
            pc = (unsigned char *)Script_SkipU16BE_OrPlus3(acc == 0, (int)pc);
            break;
        case 13: /* F1 setnz */
            pc = (unsigned char *)Script_SkipU16BE_OrPlus3(acc != 0, (int)pc);
            break;
        case 14: /* F2 setle */
            pc = (unsigned char *)Script_SkipU16BE_OrPlus3(acc <= 0, (int)pc);
            break;
        case 15: /* F3 setl */
            pc = (unsigned char *)Script_SkipU16BE_OrPlus3(acc < 0, (int)pc);
            break;
        }
    }
}
```
