# 0x419D8F — independent C A

## Provenance and scope

- Mission: `ff8-decomp-semantics-20261011-r01`, group g01, target only `0x419D8F`.
- Native packet SHA256 (manifest citation, not independently recomputed): `bf1ee669cd27c5fdeba32939d67727ddcef4bbb63153d0703d2e8de20d6d326a`.
- Executable SHA256: `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`; 32-bit; native export `2026-10-11T16:38:25.140966+00:00`.
- Common-compaction SHA256: `b1085a3007d76c5a2d8ca488b7247262aa52f66061b8d1aa1ead0ba16c9e41e3`. All ten authorized contiguous readable parts were read, without treating literal `\n` as new evidence. Original one-line read was truncated; the parent-supplied projection resolved this.
- Read all of `inputs/ff8-decomp-semantics-20261011-r01/g01/0x419D8F.readable/{manifest.json,metadata.json,asm-001.txt,asm-002.txt,bytes-001.txt}`. Below, A1/A2/B/M refer to those ASM/byte/metadata files respectively.
- Coverage: 34/34 instructions, 90/90 bytes, sole chunk `[0x419D8F,0x419DE9)`, all four CFG blocks. No target C, peer output, classifier result, or additional historical source was consulted in this author task.

## Complete target C

This is deliberately a 32-bit x86 GCC/Clang C11 representation, not a portable struct-layout guess. Parameters and return values are raw 32-bit words. The first two are used as addresses on the active path; the third is forwarded without interpreting its type. External symbol names identify the two actual native targets; integration must bind them to those targets with the declared stack ABI. Their bodies are outside this target and are not invented here.

```c
#include <stdint.h>
#include <limits.h>

#if !defined(__i386__) || !(defined(__GNUC__) || defined(__clang__))
#error This reconstruction requires a GCC-compatible 32-bit x86 C ABI.
#endif

_Static_assert(CHAR_BIT == 8, "8-bit bytes required");
_Static_assert(sizeof(uint32_t) == 4, "32-bit words required");
_Static_assert(sizeof(uintptr_t) == 4, "32-bit addresses required");

#define X86_CDECL __attribute__((cdecl))

/* Unaligned, alias-permitting DWORD access; no inferred object structure. */
typedef struct __attribute__((packed, may_alias)) x86_raw_dword {
    uint32_t value;
} x86_raw_dword;

#define X86_DWORD_AT(address_word) \
    (((volatile x86_raw_dword *)(uintptr_t)(uint32_t)(address_word))->value)

extern uint32_t X86_CDECL sub_00419410(uint32_t arg1,
                                      uint32_t arg2,
                                      uint32_t arg3);
extern uint32_t X86_CDECL sub_00419CBE(uint32_t arg1,
                                      uint32_t arg2,
                                      uint32_t arg3);

uint32_t X86_CDECL sub_00419D8F(uint32_t arg1,
                               uint32_t arg2,
                               uint32_t arg3)
{
    uint32_t result = UINT32_C(0);  /* native [EBP-8] */
    uint32_t intermediate;        /* native [EBP-4] */
    uint32_t copied_word;         /* native EDX at 00419DAE */

    if (arg2 == UINT32_C(0))
        goto exit;
    if (arg3 == UINT32_C(0))
        goto exit;

    copied_word = X86_DWORD_AT(arg1 + UINT32_C(0x64));
    X86_DWORD_AT(arg2 + UINT32_C(0x2C)) = copied_word;

    intermediate = sub_00419410(arg1, arg2, arg3);
    result = sub_00419CBE(arg1, arg2, intermediate);

exit:
    return result;
}

#undef X86_DWORD_AT
#undef X86_CDECL
```

The access macro is a C representation of the two native MOVs, not a new callee. No library call, allocation, inferred cache operation, reference-count operation, or additional guard is introduced. Volatile preserves the explicit read/write in this representation; it does not claim that the original fields were declared volatile or provide synchronization. Packed/alias-permitting access avoids adding an alignment or disjoint-object assumption. The compiler must implement these DWORD accesses as the expected x86 accesses; emitted-code verification belongs to the lead.

## Instruction and block coverage

| Native instructions | C/ABI correspondence |
|---|---|
| `419D8F push ebp; 419D90 mov ebp,esp; 419D92 sub esp,8` | EBP frame, two DWORD stack locals; generated C frame need not reproduce physical offsets. |
| `419D95 mov [ebp-8],0` | `result = 0`. |
| `419D9C cmp [ebp+0xC],0; 419DA0 jz 419DE2` | First guard, exact equality test of argument 2. |
| `419DA2 cmp [ebp+0x10],0; 419DA6 jz 419DE2` | Second guard, exact equality test of argument 3. |
| `419DA8 mov eax,[ebp+0xC]; 419DAB mov ecx,[ebp+8]; 419DAE mov edx,[ecx+0x64]; 419DB1 mov [eax+0x2C],edx` | One DWORD read followed by one DWORD write; loaded value captured before store, including overlap. |
| `419DB4 mov eax,[ebp+0x10]; 419DB7 push eax; 419DB8 mov ecx,[ebp+0xC]; 419DBB push ecx; 419DBC mov edx,[ebp+8]; 419DBF push edx` | Native push order argument 3, argument 2, argument 1. |
| `419DC0 call 419410; 419DC5 add esp,0xC; 419DC8 mov [ebp-4],eax` | Three-word caller-cleanup call; retain all 32 bits of returned EAX. |
| `419DCB mov eax,[ebp-4]; 419DCE push eax; 419DCF mov ecx,[ebp+0xC]; 419DD2 push ecx; 419DD3 mov edx,[ebp+8]; 419DD6 push edx` | Push first result, argument 2, argument 1, unconditionally after first call returns. |
| `419DD7 call 419CBE; 419DDC add esp,0xC; 419DDF mov [ebp-8],eax` | Second three-word caller-cleanup call; retain all 32 bits of returned EAX. |
| `419DE2 mov eax,[ebp-8]; 419DE5 mov esp,ebp; 419DE7 pop ebp; 419DE8 retn` | Common return, frame restoration, saved EBP restoration, plain near RET with no argument pop. |

CFG coverage (M:11–39): `[419D8F,419DA2)` leads to guard 2 or exit; `[419DA2,419DA8)` leads to active body or exit; `[419DA8,419DE2)` contains the copy and both calls; `[419DE2,419DE9)` is the common epilogue. There are no additional chunks or indirect edges in the supplied packet.

The three byte slices B:1–3 concatenate across instruction boundaries. In particular, the first split is inside the `419DAE` load; slices are not independent disassembly units. Raw `E8 4B F6 FF FF` at `419DC0` uses next-EIP `419DC5` and displacement `-0x9B5`, yielding `419410`. Raw `E8 E2 FE FF FF` at `419DD7` uses next-EIP `419DDC` and displacement `-0x11E`, yielding `419CBE`. Thus the external identities do not depend on their semantic labels.

## Width, ordering, and ABI decisions

- Incoming words are at EBP+8, +0xC, +0x10. Return is full EAX, not AL or AX. Both called functions receive three 32-bit stack words with caller cleanup of 12 bytes. A cdecl declaration captures that boundary; it does not establish the original source-language prototype.
- No signed relational branch exists: both branches are zero-equality tests, so no signedness interpretation is needed. `uint32_t` expresses preserved bit patterns, not a claim that the original return was an unsigned business integer.
- The only data-address arithmetic is addition of 0x64 and 0x2C. On the required 32-bit ABI the unsigned additions wrap modulo 2^32 before conversion to a pointer, matching flat x86 effective-address arithmetic. There are no shifts, multiplies, narrower writes, AL/AX merges, SSE or x87 instructions in the target. Stack ADD/SUB likewise have x86 word width but implement call/frame management rather than a C data calculation.
- The explicit field copy precedes the first call, and that call completes before the second begins. The first return value is passed through even when zero. No check of argument 1 or of the first callee's result is added.
- The load/store may alias fully or partially. A local captures the original source DWORD before the destination write. The extern calls have unrestricted memory effects; no `restrict`, `pure`, `const`, or `nonnull` annotation is used.
- Standard C does not specify argument-expression evaluation order. Here each call's arguments are already available scalar values with no expression side effects; the x86 cdecl machine boundary supplies the native argument positions/right-to-left logical stack order.

## Structural contract and bounded interpretation

On either zero guard, return the zero word without this wrapper's field access or calls. Otherwise copy `[arg1+0x64]` to `[arg2+0x2C]`, call `419410(arg1,arg2,arg3)`, and return `419CBE(arg1,arg2,first_result)`. Any faults or callee behavior remain observable; neither recovery nor success is assumed.

Optional neutral descriptive name: **`CopyField64To2C_ThenChainTwoCalls`**. Confidence is high for this structural description, not for any texture/cache/refcount meaning. Two independent instruction facts justify the name: `419DAE–419DB1` prove the offset-to-offset DWORD copy, and `419DC0` followed by `419DCE–419DD7` proves the two-call chain with the first result as the second call's third argument.

Proof anchors (within the authorized input projection):

1. A1:4–8, `419D95–419DA6`: zero initialization and both bypass branches establish the zero-return paths.
2. A1:9–12, `419DA8–419DB1`: DWORD source/destination offsets and read-before-write order.
3. A1:13–21, `419DB4–419DC8`, B:2: first call argument order, native address and full-EAX result.
4. A1:22–25 and A2:1–5, `419DCB–419DDF`, B:3: no result test before second call; full-EAX forwarding and result storage.
5. A2:6–9, `419DE2–419DE8`: common full-width return and caller-pop ABI.
6. M:41–58: entry code references at `407797` within `4076B6` and `414AD1` within `414A40`; the only listed direct callees are `419410` and `419CBE`. These xrefs alone prove no business meaning.

## Unknowns, assumptions, and validation limits

- Exact object layouts, field meanings, object bounds/lifetimes, third-argument pointer-versus-integer meaning, return pointer-versus-integer meaning, and complete callee effects remain unknown. The two field offsets require no invented concrete structure.
- `TextureRelated2`, `Texture_FindTexture`, and `Texture_UploadRefcountOrReuse`, including the embedded refcount/upload annotation, are labels/comments rather than proof. This C does not implement their claimed internals. Historical neighbourhood prose in the common compaction was not promoted into current target facts.
- The representation assumes the native flat 32-bit address model, ordinary mapped object memory, and ABI-conforming callees. Arbitrary aliases into the wrapper's own argument/local/return-address stack storage, callee stack introspection or deliberate ABI corruption are not modeled by ordinary function parameters. Exact machine stack addresses, incidental volatile-register values/EFLAGS, and exception/interleaving equivalence are not promised by C source. The target itself saves EBP and leaves EBX/ESI/EDI untouched; called code must satisfy the ABI.
- No floating-point operation is introduced. Nothing here proves that either external callee preserves or changes the x87 environment.
- No compilation, execution, tests, emulation, live access, or IDB validation was performed. Manual byte/ASM/CFG correspondence is the validation performed. Lead review should check the chosen compiler's packed/alias access lowering and cdecl linkage, plus zero-guard paths, overlapping memory copy, call ordering, and zero/nonzero first-callee returns. These are requests, not PASS claims.
- Output hash has not been computed; parent may compute it. No promotion or campaign closure is asserted.
