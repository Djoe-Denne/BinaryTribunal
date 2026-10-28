# Independent C A — 0x47CF60

## Input and scope

Author: c-a-47cf60, GPT-6 Astra. Only the assigned projection and common factual compaction were used for this production. No sibling production, classifier, index, IDB or prior target C was consulted.

- Packet SHA-256 (manifest citation, not independently recomputed): `a502d16b154e08a955a468279c04dda5c926c4260a8b231a45a2bc2d45289fb2`.
- Compaction SHA-256 (manifest): `6925ce258d423a1b3b9e352cad9925a19202940e72df0121a3ac4681ed4f1fff`.
- Original executable SHA-256: `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.
- Read all nine `asm-*.txt`, both `bytes-*.txt`, `metadata.json`, and `manifest.json` under `inputs/ff8-decomp-semantics-20261011-r01/g07/0x47CF60.readable/`; common context: `inputs/ff8-decomp-semantics-20261011-r01/g07/common-compaction.md`.
- Complete single chunk `[0x47CF60,0x47D285)`, 209 listed instructions, both returns and all CFG paths represented below.

**Two byte/label discrepancies must not be repaired toward the labels:**

1. `47D26B: DD 05 E0 8B A7 01` loads the binary64 memory operand at **0x01A78BE0**, not the address suggested by the printed `...dbl_1A788B8` name.
2. `47D277: E8 94 EA FE FF` calls **0x46BD10**, not the address suggested by the printed `...sub_46BB10` name. The metadata code-target list also contains 0x46BD10.

## Representation contract

The following is complete C for the target's instruction-level behavior, deliberately retaining a machine-state boundary instead of inventing native callee prototypes, a return type, or floating-point conversion semantics. The adapter callbacks are **model interfaces, not additional game calls or inferred library calls**. Every actual native call is dispatched by its byte-decoded VA and exact return VA, with the original stack contents. Consequently unknown callee arguments, register returns, stack cleanup, x87 state and memory aliases remain visible, including earlier arguments left on the stack across subsequent calls.

`Machine` begins at native entry with ESP pointing to the caller return address and `[ESP+4]` the sole explicitly loaded argument. The adapter's memory operations perform little-endian x86 accesses of exactly the requested width without C pointer-aliasing or alignment assumptions. The same address space contains globals, argument memory and stack; do not map the locals into a separate nonaliasing C object. `native` executes the original native callee through its return to the supplied return VA, including RET's stack effects, without normalizing registers, flags or x87. It may propagate nonreturning behavior/faults rather than return to this model. `fld64` performs the x87 **FLD m64fp** instruction at 47D26B, reading eight bytes, updating the actual x87 register stack/tag/status/environment, and respecting its current control word, exceptional inputs and stack overflow. It must not be replaced by a host C cast or by resetting rounding mode. The following call to 55AD90 is likewise left native; no rounding/overflow policy for that helper is guessed.

Unsigned 32-bit register arithmetic supplies x86 wrap. Partial AL and CL writes preserve upper bits. `flags_known` records architecturally undefined arithmetic flag bits; these may not be assumed zero by an adapter. This is a sequential architectural model, not a cycle-level emulator or a precise asynchronous-interrupt/debug-trap model. Memory/call/FP faults belong to the adapter, not invented guards in this function. No host floating-point arithmetic or library calls are introduced.

```c
#include <stdint.h>

typedef struct Machine Machine;
struct Machine {
    uint32_t eax, ecx, edx, ebx, esp, ebp, esi, edi;
    uint32_t eip, flags, flags_known;
    void *environment; /* adapter-owned memory and complete x87 environment */
    uint8_t  (*read8)(Machine *, uint32_t);
    uint16_t (*read16)(Machine *, uint32_t);
    uint32_t (*read32)(Machine *, uint32_t);
    void (*write8)(Machine *, uint32_t, uint8_t);
    void (*write32)(Machine *, uint32_t, uint32_t);
    void (*native)(Machine *, uint32_t target, uint32_t return_va);
    void (*fld64)(Machine *, uint32_t operand_va, uint32_t instruction_va);
};

enum { CF=1u, PF=4u, AF=16u, ZF=64u, SF=128u, OF=2048u,
       ARITH=CF|PF|AF|ZF|SF|OF };

static uint32_t szp(uint32_t x)
{
    uint32_t p = x & 255u;
    p ^= p >> 4; p ^= p >> 2; p ^= p >> 1;
    return ((p & 1u) ? 0u : PF) | (x ? 0u : ZF) | ((x >> 31) ? SF : 0u);
}
static uint32_t add32(Machine *m, uint32_t a, uint32_t b)
{
    uint32_t r = a + b;
    m->flags = (m->flags & ~(uint32_t)ARITH) | szp(r)
        | ((r < a) ? CF : 0u) | (((a ^ b ^ r) & 16u) ? AF : 0u)
        | (((~(a ^ b) & (a ^ r)) >> 31) ? OF : 0u);
    m->flags_known |= ARITH;
    return r;
}
static uint32_t sub32(Machine *m, uint32_t a, uint32_t b)
{
    uint32_t r = a - b;
    m->flags = (m->flags & ~(uint32_t)ARITH) | szp(r)
        | ((a < b) ? CF : 0u) | (((a ^ b ^ r) & 16u) ? AF : 0u)
        | ((((a ^ b) & (a ^ r)) >> 31) ? OF : 0u);
    m->flags_known |= ARITH;
    return r;
}
static void cmp_small(Machine *m, uint32_t a, uint32_t b, unsigned bits)
{
    uint32_t mask = (1u << bits) - 1u, sign = 1u << (bits-1u);
    a &= mask; b &= mask;
    uint32_t r = (a-b) & mask;
    uint32_t f = szp(r) & ~(uint32_t)SF;
    m->flags = (m->flags & ~(uint32_t)ARITH) | f
        | ((r & sign) ? SF : 0u) | ((a < b) ? CF : 0u)
        | (((a ^ b ^ r) & 16u) ? AF : 0u)
        | (((a ^ b) & (a ^ r) & sign) ? OF : 0u);
    m->flags_known |= ARITH;
}
static uint32_t logic32(Machine *m, uint32_t r)
{
    m->flags = (m->flags & ~(uint32_t)ARITH) | szp(r);
    m->flags_known = (m->flags_known | ARITH) & ~(uint32_t)AF;
    return r;
}
static uint32_t shl3(Machine *m, uint32_t a)
{
    uint32_t r = a << 3;
    m->flags = (m->flags & ~(uint32_t)ARITH) | szp(r)
        | (((a >> 29) & 1u) ? CF : 0u);
    m->flags_known = (m->flags_known | ARITH) & ~(uint32_t)(AF|OF);
    return r;
}
static void push32(Machine *m, uint32_t x)
{
    m->esp -= 4u; m->write32(m, m->esp, x); /* PUSH does not set flags */
}
static uint32_t pop32(Machine *m)
{
    uint32_t x = m->read32(m, m->esp); m->esp += 4u; return x;
}
static void call_native(Machine *m, uint32_t target, uint32_t next)
{
    push32(m, next); m->eip = target; m->native(m, target, next);
}

#define A (m->eax)
#define B (m->ebx)
#define C (m->ecx)
#define D (m->edx)
#define S (m->esi)
#define SP (m->esp)
#define R8(a)  (m->read8(m,(uint32_t)(a)))
#define R16(a) (m->read16(m,(uint32_t)(a)))
#define R32(a) (m->read32(m,(uint32_t)(a)))
#define W8(a,v)  m->write8(m,(uint32_t)(a),(uint8_t)(v))
#define W32(a,v) m->write32(m,(uint32_t)(a),(uint32_t)(v))
#define PUSH(x) push32(m,(uint32_t)(x))
#define CALL(t,n) call_native(m,(t),(n))
#define ADJ(n) (SP=add32(m,SP,(n)))
#define CMP(a,b) ((void)sub32(m,(uint32_t)(a),(uint32_t)(b)))
#define CMP8(a,b) cmp_small(m,(a),(b),8)
#define CMP16(a,b) cmp_small(m,(a),(b),16)
#define TEST(x) ((void)logic32(m,(x)))
#define Z ((m->flags & ZF) != 0u)
#define AL(v) (A=(A & UINT32_C(0xffffff00)) | (uint8_t)(v))

void c_0047CF60(Machine *m)
{
    /* 47CF60..47CF71: original argument is at entry ESP+4. */
    SP = sub32(m,SP,0x1cu);
    PUSH(B); PUSH(S);
    S = R32(SP+0x28u);
    B = logic32(m,B^B);
    CMP(R32(S+0xba8u),B);
    if (!Z) goto L47CF87;
    /* 47CF73 */
    PUSH(0x1e0u); PUSH(0x280u); PUSH(B); PUSH(B);
    CALL(0x45B4C0u,0x47CF84u); ADJ(0x10u);
L47CF87:
    A = SP+8u;
    PUSH(S); PUSH(A);
    W32(SP+0x18u,0u); /* local +8, store order is intentional */
    W32(SP+0x14u,0u); /* local +4 */
    W32(SP+0x10u,0u); /* local +0 */
    W32(SP+0x1cu,0x3f800000u); /* local +12, binary32 bits */
    CALL(0x41E168u,0x47CFB2u);
    PUSH(S); PUSH(1u); PUSH(1u); PUSH(1u);
    CALL(0x41DFBAu,0x47CFBEu);
    A = R32(S+0xba8u); ADJ(0x18u); CMP(A,B);
    if (!Z) goto L47CFEE;
    /* 47CFCB..47CFEB */
    C=R32(0x01a77650u); D=R32(0x01a77654u); A=R32(0x01a77648u);
    PUSH(C); C=R32(0x01a7764cu); PUSH(D); PUSH(A); PUSH(C);
    CALL(0x45B4C0u,0x47CFEBu); ADJ(0x10u);
L47CFEE:
    PUSH(S); PUSH(B); CALL(0x41E972u,0x47CFF5u); ADJ(8u);
    TEST(A); if (Z) goto L47D243;
    /* 47D000..47D048; six outstanding arguments cleaned at 47D039. */
    D=R32(0x01d2a284u); PUSH(D); CALL(0x416B9Au,0x47D00Cu);
    A=R32(0x01d2a288u); PUSH(A); CALL(0x424BF9u,0x47D017u);
    CALL(0x49B120u,0x47D01Cu); CALL(0x499A40u,0x47D021u);
    PUSH(S); CALL(0x43FBE8u,0x47D027u);
    PUSH(S); CALL(0x409B42u,0x47D02Du);
    PUSH(S); CALL(0x409B08u,0x47D033u);
    PUSH(S); CALL(0x409B25u,0x47D039u); ADJ(0x18u);
    CALL(0x56BA40u,0x47D041u);
    AL(R8(0x01d28deau)); CMP8(A,B); if (Z) goto L47D0D3;
    /* 47D04E */
    CALL(0x4A71D0u,0x47D053u); TEST(A); if (Z) goto L47D0D3;
    /* 47D057 */
    W32(0x01cff834u,1u); W32(0x01cff844u,B);
L47D067:
    W32(S+0xb88u,1u); CALL(0x45B580u,0x47D076u);
L47D076:
    CALL(0x4701B0u,0x47D07Bu); CALL(0x4701B0u,0x47D080u);
    CALL(0x4701B0u,0x47D085u); CALL(0x4701B0u,0x47D08Au);
    CMP16(R16(0x01cdbfe0u),3u); if (!Z) goto L47D0BB;
    /* 47D094 */
    PUSH(B); CALL(0x4A76E0u,0x47D09Au); ADJ(4u);
    CALL(0x4A8E30u,0x47D0A2u); CALL(0x4A84E0u,0x47D0A7u);
    CALL(0x4A8E30u,0x47D0ACu); CALL(0x4A84E0u,0x47D0B1u);
    CALL(0x4A8E30u,0x47D0B6u); CALL(0x4A84E0u,0x47D0BBu);
L47D0BB:
    CALL(0x45B2E0u,0x47D0C0u); TEST(A); if (Z) goto L47D10A;
    /* 47D0C4..47D0D2: early exit omits the complete 47D243 tail. */
    PUSH(S); CALL(0x41E99Du,0x47D0CAu); ADJ(4u);
    S=pop32(m); B=pop32(m); ADJ(0x1cu); m->eip=pop32(m); return;
L47D0D3:
    W8(0x01d28de9u,B);
    A=R32(0x01cff834u); CMP(A,B); if (Z) goto L47D0E7;
    CALL(0x5003A0u,0x47D0E7u);
L47D0E7:
    A=R32(0x01cff844u); W32(0x01cff834u,B); CMP(A,B);
    if (Z) goto L47D067;
    /* 47D0FA */
    W32(S+0xb88u,B); CALL(0x45B590u,0x47D105u); goto L47D076;
L47D10A:
    AL(R8(0x01d28de9u)); CMP8(A,B); if (!Z) goto L47D118;
    CALL(0x47CCB0u,0x47D118u);
L47D118:
    CMP16(R16(0x01cdbfe0u),3u); if (!Z) goto L47D150;
    /* 47D122: byte index, no range guard, stride 92. */
    A=logic32(m,A^A); AL(R8(0x01d96a80u)); C=A+A*2u;
    C=shl3(m,C); C=sub32(m,C,A); D=0x01d969c8u+C*4u;
    PUSH(D); CALL(0x4A76E0u,0x47D13Eu); ADJ(4u);
    CALL(0x4A8E30u,0x47D146u); CALL(0x4A84E0u,0x47D14Bu);
    CALL(0x4A78E0u,0x47D150u);
L47D150:
    CMP(R32(0x01cff830u),B); if (Z) goto L47D1AA;
    CMP16(R16(0x01cdbfe0u),4u); if (!Z) goto L47D17C;
    /* 47D162: addresses are stored as 32-bit values, not called here. */
    W32(SP+0x10u,0x004a2280u); W32(SP+0x14u,0x004a22a0u);
    W32(SP+0x18u,0x004a2690u); goto L47D194;
L47D17C:
    W32(SP+0x10u,0x00470690u); W32(SP+0x14u,0x004706a0u);
    W32(SP+0x18u,0x004706b0u);
L47D194:
    A=SP+8u; PUSH(S); PUSH(A);
    W32(SP+0x24u,B); W32(SP+0x28u,B);
    CALL(0x409A57u,0x47D1A7u); ADJ(8u);
L47D1AA:
    AL(R8(0x01d28de9u)); CMP8(A,B); if (!Z) goto L47D1FA;
    A=R32(0x01cff6f4u); CMP(A,B); if (Z) goto L47D1F3;
    /* 47D1BC; SETZ consumes the CMP(A,2) flags across a MOV. */
    D=R32(0x01a77650u); C=logic32(m,C^C); CMP(A,2u);
    A=R32(0x01a77654u); C=(C & 0xffffff00u) | (Z ? 1u : 0u);
    PUSH(C); C=R32(0x01a77648u); PUSH(0x3ac49ba6u); PUSH(D);
    D=R32(0x01a7764cu); PUSH(A); PUSH(C); PUSH(D);
    CALL(0x56D1D0u,0x47D1EAu); ADJ(0x18u); W32(0x01cff6f4u,B);
L47D1F3:
    CALL(0x56BA80u,0x47D1F8u); goto L47D204;
L47D1FA:
    PUSH(0xffffffffu); CALL(0x45D610u,0x47D201u); ADJ(4u);
L47D204:
    CMP(R32(0x01cff834u),B); if (Z) goto L47D213;
    W8(0x01d28de9u,1u);
L47D213:
    CMP(R32(0x01cff844u),B); if (!Z) goto L47D235;
    CALL(0x4980C0u,0x47D220u); CALL(0x465930u,0x47D225u);
    PUSH(S); PUSH(1u); CALL(0x41E947u,0x47D22Du); ADJ(8u);
    CALL(0x499EA0u,0x47D235u);
L47D235:
    CALL(0x45B450u,0x47D23Au);
    PUSH(S); CALL(0x41E99Du,0x47D240u); ADJ(4u);
L47D243:
    CALL(0x56D9C0u,0x47D248u);
    A=R32(0x00b6d970u); CMP(A,B); if (Z) goto L47D265;
    CMP(R32(0x01cff834u),B); if (!Z) goto L47D265;
    CALL(0x4020F0u,0x47D25Eu); W32(0x01cff844u,A); goto L47D26B;
L47D265:
    W32(0x01cff844u,B);
L47D26B:
    m->eip=0x47D26Bu;
    m->fld64(m,0x01a78be0u,0x47D26Bu); /* raw bytes override label */
    CALL(0x55AD90u,0x47D276u); PUSH(A);
    CALL(0x46BD10u,0x47D27Cu); ADJ(4u); /* raw E8 overrides label */
    S=pop32(m); B=pop32(m); ADJ(0x1cu); m->eip=pop32(m);
}

#undef A
#undef B
#undef C
#undef D
#undef S
#undef SP
#undef R8
#undef R16
#undef R32
#undef W8
#undef W32
#undef PUSH
#undef CALL
#undef ADJ
#undef CMP
#undef CMP8
#undef CMP16
#undef TEST
#undef Z
#undef AL
```

## Stack, ABI and coverage notes

- Native prologue reserves 0x1C bytes and saves EBX/ESI (47CF60–65). After that, local base is ESP+8; incoming argument is ESP+0x28. EBP/EDI are not directly modified by this target. Plain RET at 47D0D2 and 47D284 leaves incoming argument cleanup to the caller. The C model returns through `m->eip`; `m->eax` preserves the native residual return register rather than inventing `bool`/`void` ABI evidence.
- Stack-local offsets relative to local base: +0,+4,+8 initialized to zero, +12 to 0x3F800000, in the original store order +8,+4,+0,+12. Later +8,+12,+16 receive the selected address triple; +20,+24 receive EBX. The first two words are **not** reinitialized before 409A57, and may have been modified through the earlier local pointer. The adapter retains that aliasing.
- 47CFAD and 47CFB9 share a later 24-byte cleanup. 47D007/12/22/28/2E/34 also share a 24-byte cleanup. A no-push call does not imply a proven zero-argument prototype, because outstanding stack words remain visible. No generic C expression evaluation order is used to supply native arguments.
- Mode comparisons at 47D08A/118/158 read WORDs. Pause latches at 47D041/10A/1AA and index 47D124 read BYTEs; the request/sleep/exit/overlay conditions read DWORDs. All branches here are equality/inequality, not signed relational comparisons. LEA/SHL/SUB index formation retains 32-bit wrap and zero-extension from AL after XOR EAX.
- CFG coverage: initial backend zero/nonzero paths; initial native-call success/failure; pause capability/result branches; request-clear/helper branch; sleeping/non-sleeping setup; mode-3 pre-call sequence; both 47D0BB outcomes; byte-gated 47CCB0; mode-3 indexed post-call sequence; both mode-dependent address triples; both overlay conditions and paused alternative; end latch and sleeping submission gate; both movie/request timing alternatives; common FP tail. Every metadata CFG block maps to a labeled block or its explicit straight-line fallthrough above.

## Evidence anchors and uncertainties

1. `asm-001:1–20`, `bytes-001:1–3`: stack/argument offsets, local stores, and first call boundary. This is not a declaration of an engine struct beyond the two observed DWORD offsets +BA8/+B88.
2. `asm-003:15–25`, `asm-005:1–17`: request DWORDs, separate BYTE latch, and the branch to 47CCB0. A latch is not blindly assigned a Boolean C type; its entire byte is compared.
3. `asm-004:15–24` versus `asm-008:16–25`, `asm-009`: early return and normal tail are observably different; no unconditional common cleanup was added.
4. `asm-005:18–25`, `bytes-001:15`: index reads exactly one byte, forms 92*index+0x1D969C8, and has no <=1 guard.
5. `asm-006:9–22`, `bytes-001:17–19`: exact address triples and partially reused local record; the assignments do not execute the stored callbacks.
6. `asm-007:1–24`: reread of latch, conditional six-word argument sequence, literal 0x3AC49BA6 preserved as bits, and distinct native target 56BA80 retained despite `nullsub` label.
7. `bytes-002:5–6`, `asm-009:1–9`, `metadata.json:363,350`: true FP operand address and final E8 target, non-Boolean residual EAX, saved-register restoration.
8. `metadata.json:315–327`: two data references (4709EC in 4706B0, 5598DD in 559890), `iscode:false`; not proof of direct calls or a specific higher-level caller ABI.

Native callee bodies/prototypes, full object layout, memory validity, meaning of residual EAX, exact conversion-helper implementation and x87 entry environment are not independently supplied/proved. The machine boundary is intentional, not a claim that these are known. Embedded semantic/LIVE comments have not been promoted to evidence. No semantic-volet verdict or name promotion is made in this C-only artifact.

Validation performed: source reading and manual instruction/byte/address/stack correspondence during authorship only. **Not executed:** compilation, native calls, runtime tests, differential testing, x87 edge-case testing, automated instruction coverage, hash recomputation, or independent review. Requested lead validation: compile the model with an authorized adapter; compare both returns, all branch alternatives and callback-visible stack/register/memory state; specifically verify the two byte/label discrepancies and exceptional x87 inputs. Output hash remains for parent computation.
