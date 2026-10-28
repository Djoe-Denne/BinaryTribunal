# 0x701220 — C B

```c
#include <stdint.h>

/*
 * The call sites push the sign-extended angle and retain both arguments for
 * caller cleanup. These declarations describe only the observed x86 call
 * interface and EAX result; the callee bodies are not reproduced here.
 */
extern uint32_t __cdecl Fixed_Sin4096_Q12(int32_t angle_sx);
extern uint32_t __cdecl Fixed_Cos4096_Q12(int32_t angle_sx);

/* PE32 cdecl: arg_0 is a signed 16-bit stack value; arg_4 is the output. */
uint32_t __cdecl Mat3S16_MakeRotX_Q12(int16_t angle, void *out_arg)
{
    uint8_t *out = (uint8_t *)out_arg;
    int32_t angle_sx = (int32_t)angle;
    uint32_t sine_eax;
    uint32_t cosine_eax;
    uint32_t neg_sine_edx;

    /* Five ordered dword clears: offsets 0, 4, 8, 0x0c, and 0x10. */
    *(uint32_t *)(void *)(out + 0x00) = 0;
    *(uint32_t *)(void *)(out + 0x04) = 0;
    *(uint32_t *)(void *)(out + 0x08) = 0;
    *(uint32_t *)(void *)(out + 0x0c) = 0;
    *(uint32_t *)(void *)(out + 0x10) = 0;

    /* push angle; call; save EAX in EBX; push angle; call. */
    sine_eax = Fixed_Sin4096_Q12(angle_sx);
    cosine_eax = Fixed_Cos4096_Q12(angle_sx);

    /* 32-bit NEG wraps modulo 2^32; the subsequent store keeps DX only. */
    neg_sine_edx = 0u - sine_eax;

    /* MOV word stores preserve the low 16 bits of the corresponding regs. */
    *(uint16_t *)(void *)(out + 0x00) = UINT16_C(0x1000);
    *(uint16_t *)(void *)(out + 0x08) = (uint16_t)cosine_eax; /* AX */
    *(uint16_t *)(void *)(out + 0x0e) = (uint16_t)neg_sine_edx; /* DX */
    *(uint16_t *)(void *)(out + 0x0a) = (uint16_t)sine_eax; /* BX */
    *(uint16_t *)(void *)(out + 0x10) = (uint16_t)cosine_eax; /* AX */

    /* EAX remains the cosine callee's full 32-bit result through RETN. */
    return cosine_eax;
}
```

## Coverage and evidence

- Covers all 29/29 native instructions, one CFG block, `0x00701220–0x0070126b`; no branch or omitted chunk.
- Input authority: `inputs/ff8-decomp-semantics-20261011-r01/g02/0x701220.readable/manifest.json` cites original native packet SHA-256 `5a2d2dd11b9e5f5d5e3ec79fd236f5bbc03a85ec1d9b7065538ef166905b9141`; source PE SHA-256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.
- Complete ASM coverage is split across `asm-001.txt` lines 1–25 and `asm-002.txt` lines 1–4; the bytes are fully represented by `bytes-001.txt` lines 1–3. The manifest records 29 assembly lines and hashes each readable slice.
- ABI/stack mapping: entry stack `[ESP+4]` is signed `arg_0`, `[ESP+8]` is output `arg_4` (`asm-001` lines 3, 7); register saves/restores and plain `retn` are lines 1–2 and `asm-002` lines 1–4. Each helper gets one pushed sign-extended angle (lines 9, 14–17), and the caller reclaims 8 bytes after both calls (line 19).
- Dataflow: five dword clears including `out+0x10` (lines 8, 10–13); sine EAX saved to EBX and cosine returned in EAX (lines 14–18); 32-bit `neg edx` then five 16-bit stores at `+0,+8,+0xe,+0xa,+0x10` (lines 20–25). `asm-002` lines 1–4 close the epilogue.
- Raw matrix coefficient layout evidenced by those stores: `+0 = 0x1000`, `+8 = low16(cos)`, `+0xa = low16(sin)`, `+0xe = low16(0-sin)` and `+0x10 = low16(cos)`. The initial dword clear at `+0x10` writes through `+0x13`, beyond the 18-byte nine-WORD area.
- Label support is limited to the native label `Mat3S16_MakeRotX_Q12` in `metadata.json` line 3 and the inline ASM annotation on `asm-001.txt` line 1; the specific coefficient stores above are independent operand evidence. Callee names are only those present at the two call instructions, lines 14 and 17, and code-target metadata lists `0x56d130` / `0x56d100` (`metadata.json` lines 254–257).

## Assumptions and unresolved details

- The native packet records machine code and call-target addresses, not callee implementations or formal C prototypes. The helper declarations use 32-bit EAX results and a 32-bit sign-extended pushed argument as observed at this call site; helper internals and their own signedness contract are intentionally unspecified.
- The target's output allocation/valid extent and alignment are not established by this packet. The literal dword/word pointer stores model x86 PE32 widths/order; callers must provide writable storage covering at least bytes `out[0..0x13]`. No bounds/alignment guard is added.
- C uses `uint32_t` for raw EAX values so signed interpretation is not asserted; 32-bit subtraction wraps modulo 2^32 and narrowing stores retain low 16 bits. No x87 math is inferred in this function beyond the external calls.
- No compilation, execution, unit test, or independent review was performed.
