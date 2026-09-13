# EnemyAI_CompareValues @ 0x48A680

- Instr (live): 42
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non (sémantique A=B=C identique ; formatage)
- Push IDB: oui
- SetType: int __cdecl EnemyAI_CompareValues(unsigned int left, int op, unsigned int right)
- Notes parent: `cmp op,5` puis `JA` unsigned (`77 73`) puis `jpt_48A689` @ `0x48A700` (6 dwords live). Cas 0== 1< 2> 3!= 4<= 5>= en **unsigned** (`jnz/jnb/jbe/jz/ja/jb`, pas `jg/jl`). Pas de `setcc`. DWORD `8B`/`3B`. Queue partagée `def_48A689` `xor eax,eax`. U15.6 « signed 16-bit » = operand IF, pas ce helper.

## C réconcilié

```c
/* EnemyAI_CompareValues @ 0x48A680
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes + jpt_48A689, not Hex-Rays.
 * 42 instr, size 0x7F. IDA type int __cdecl(unsigned int, int, unsigned int).
 * No callees, no add esp. No domain::.
 * Dispatch: cmp op,5 ; ja unsigned def_48A689 ; jmp jpt_48A689[op*4]
 * jpt live @ 0x48A700: 0x48A690,0x48A6A2,0x48A6B4,0x48A6C6,0x48A6D8,0x48A6EA
 * Unsigned jcc only (jnz/jnb/jbe/jz/ja/jb). No setcc. No prefix 66. DWORD 8B loads.
 * Shared false/default tail def_48A689: xor eax,eax ; ret
 */

int __cdecl EnemyAI_CompareValues(unsigned int left, int op, unsigned int right)
{
    switch (op)
    {
    case 0: /* 48a690: cmp left,right ; jnz def */
        if (left == right)
            return 1;
        break;
    case 1: /* 48a6a2: cmp left,right ; jnb def  => unsigned <  (not jl) */
        if (left < right)
            return 1;
        break;
    case 2: /* 48a6b4: cmp left,right ; jbe def  => unsigned >  (not jg) */
        if (left > right)
            return 1;
        break;
    case 3: /* 48a6c6: cmp left,right ; jz def */
        if (left != right)
            return 1;
        break;
    case 4: /* 48a6d8: cmp left,right ; ja def  => unsigned <= (not jle) */
        if (left <= right)
            return 1;
        break;
    case 5: /* 48a6ea: cmp left,right ; jb def  => unsigned >= (not jge) */
        if (left >= right)
            return 1;
        break;
    default: /* ja after cmp op,5 : op > 5 unsigned (negatives too) */
        break;
    }

    return 0; /* 48a6fc: xor eax,eax ; retn */
}
```
