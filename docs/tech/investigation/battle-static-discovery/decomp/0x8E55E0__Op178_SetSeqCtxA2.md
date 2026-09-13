# Op178_SetSeqCtxA2 @ 0x8E55E0

- Instr (live): 8
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int Op178_SetSeqCtxA2(void)
- Notes parent: BYTE `[IP+2]` → `seqCtx+0xA2` (`8A 48 02` / `88 8A A2 00 00 00`). IP reload puis `+4` (DWORD `A1`/`A3` @ `0x02797450`). EAX = nouvel IP. STREAM16[178] @ `0x1852D60` = `0x8E55E0`. ≠ `Op49_SubmitTIM` `0x8E0420`. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. Pas de CALL.

## C réconcilié

```c
/* Op178_SetSeqCtxA2 @ 0x8E55E0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 8 instr, size 0x22, end 0x8E5602. IDA type int(). cdecl, 0 args.
 * No prologue, no saved regs, no locals. retn C3 (not retn N).
 * Bytes: A1 50 74 79 02 / 8B 15 EC 73 79 02 / 8A 48 02 / 88 8A A2 00 00 00 /
 *        A1 50 74 79 02 / 83 C0 04 / A3 50 74 79 02 / C3
 * STREAM16[178] dword 0x1852D60 = 0x8E55E0. Opcode 178, not PH9 Op49_SubmitTIM 0x8E0420.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * No CALL. BYTE store seqCtx+0xA2. IP reload then +4. EAX = new IP.
 * No packed struct. No domain::.
 */

extern unsigned char *g_MagVm_IP;                      /* DWORD 0x02797450 */
extern unsigned char *g_GfCinematic_SequenceCtxPtr;      /* DWORD 0x027973EC */

int Op178_SetSeqCtxA2(void)
{
    unsigned char *ip;
    unsigned char *ctx;

    ip = g_MagVm_IP;                            /* A1 mov eax, [0x02797450] */
    ctx = g_GfCinematic_SequenceCtxPtr;        /* 8B 15 mov edx, [0x027973EC] */
    ctx[0xA2] = ip[2];                          /* 8A 48 02 / 88 8A A2 00 00 00 BYTE */

    ip = g_MagVm_IP;                            /* A1 reload, not leftover eax */
    ip += 4;                                   /* 83 C0 04 */
    g_MagVm_IP = ip;                            /* A3 DWORD store */
    return (int)ip;
}
```
