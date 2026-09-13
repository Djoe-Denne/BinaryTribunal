# MAG_140_PHOENIX_FL_Callback @ 0x6A6360

- Instr (live): 72
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=20
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=11
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=20
- A==B: non
- Push IDB: oui
- SetType: char __cdecl MAG_140_PHOENIX_FL_Callback(void)
- Notes parent: jg signé 7F vs ax=2/4 ; WORD 66 opcode ; stride 8 à ctx+8 ; BdTrans arg0 = [rec+4] pas rec+4 ; TIM ax==16 base dword_2517B28+0x1F7A0/0x219C0/0x23BE0 ; occupance/0xD0 absents ; AL leftover = index+1.

## C réconcilié

```c
/* MAG_140_PHOENIX_FL_Callback @ 0x6A6360
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 72 instr, size 0xCB, end 0x6A642B. cdecl, 0 args. Saved ESI EDI. retn C3.
 * Callees: BattleTimQueue_EnqueueType1 (add esp,4 once; or add esp,0Ch after 3 calls);
 *          BdTransSummonStream add esp,8 (push &ctx[+2] then push [rec+4]).
 * WORD opcode: 66 8B 44 C6 08 then 66 3D 02/04/10. jg SIGNED 7F (not ja). jnz vs 16.
 * ctx = dword_1DCD6E4: BYTE +0 state, +1 result, +2 stream-flag, +4 index.
 * Records at ctx+8 stride 8: WORD +0, DWORD ptr +4. lea edi,[esi+eax*8+8] after xor eax,eax.
 * TIM case ax==16: dword_2517B28 + 0x1F7A0 / 0x219C0 / 0x23BE0.
 * Occupancy / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * EAX leftover: AL = incremented index; AH from callee/opcode. IDA char().
 * No domain::.
 */

extern int dword_1DCD6E4;
extern int dword_2517B28;

unsigned __int8 *__cdecl BattleTimQueue_EnqueueType1(unsigned __int8 *);
int __cdecl BdTransSummonStream(_DWORD *, _BYTE *);

char __cdecl MAG_140_PHOENIX_FL_Callback(void)
{
    unsigned __int8 *ctx;
    unsigned __int8 *rec;
    unsigned __int8 idx;
    __int16 opcode;

    ctx = (unsigned __int8 *)dword_1DCD6E4; /* ESI */
    idx = ctx[4];                            /* xor eax,eax ; mov al,[esi+4] */
    rec = ctx + idx * 8 + 8;                /* lea edi,[esi+eax*8+8] */
    opcode = *(__int16 *)rec;                /* mov ax,[esi+eax*8+8] */

    if (opcode <= 2) {                       /* cmp ax,2 ; jg loc_6A639B */
        BattleTimQueue_EnqueueType1(*(unsigned __int8 **)(rec + 4));
        ctx[1] = rec[0];                     /* mov dl,[edi] ; BYTE */
    } else if (opcode <= 4) {               /* loc_6A639B: cmp ax,4 ; jg loc_6A63CA */
        ctx[2] = 0;                          /* lea eax,[esi+2] ; mov byte ptr [eax],0 */
        BdTransSummonStream(*(_DWORD **)(rec + 4), (_BYTE *)(ctx + 2));
        ctx[1] = rec[0] - 3;                 /* mov cl,[edi] ; sub cl,3 */
    } else if (opcode == 16) {              /* loc_6A63CA: cmp ax,10h ; jnz loc_6A6419 */
        BattleTimQueue_EnqueueType1((unsigned __int8 *)(dword_2517B28 + 0x1F7A0));
        BattleTimQueue_EnqueueType1((unsigned __int8 *)(dword_2517B28 + 0x219C0));
        BattleTimQueue_EnqueueType1((unsigned __int8 *)(dword_2517B28 + 0x23BE0));
        ctx[1] = 2;
    } else {                                 /* loc_6A6419 */
        ctx[1] = 0;
    }

    idx++;
    ctx[4] = idx;                            /* inc al ; mov [esi+4],al BYTE */
    ctx[0] = 0;                              /* mov byte ptr [esi],0 */
    return (char)idx;                        /* leftover AL */
}
```
