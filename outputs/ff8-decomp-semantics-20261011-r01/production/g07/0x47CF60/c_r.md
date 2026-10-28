# C reconciliation R — 0x47CF60

## Provenance and decision

R: c-r-47cf60, GPT-6.1 Sol. Scope: C only, single chunk
`[0x0047CF60,0x0047D285)`, 209 instructions, 41 CFG blocks, two RETs.
Read own deposited A/B, common-compaction, original packet, native manifest,
all nine native-asm slices, both native-bytes slices and all native-metadata.
The original packet's long assembly string is clipped by the reader; **it was
not used as an incomplete assembly source**. All 209 instructions were read
from the complete native-asm slices, and all chunk hex from the byte slices.
No other volet, history, index, service, IDA, output or prior verdict consulted.

The reconciliation manifest provides two different native author sessions:

| Author | Session | Effective model recorded by parent | SHA256 of deposited C |
|---|---|---|---|
| A | ses_ed3cfe75bffeGgINda9F8bGSss | openai/gpt-6-astra, high | 2810c65305af0d2428e865980bbc0df109aeabaaebc7bec8f7cc390fd086f1f2 |
| B | ses_ed3cfe388ffe5kJRUFtdn4FgSV | openai/gpt-6.1-sol, high | 8d32d56390a6db56c4119231f3a4de9a57f71abab995be7e69137066bba20c59 |

Freeze: packet `a502d16b154e08a955a468279c04dda5c926c4260a8b231a45a2bc2d45289fb2`;
compaction `6925ce258d423a1b3b9e352cad9925a19202940e72df0121a3ac4681ed4f1fff`;
EXE `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`;
export 2026-10-11T16:38:25.140966+00:00, 32 bits.
Native manifest and reconciliation manifest agree on packet/compaction/slice
identifiers; neither author is missing. These are **recorded hashes, not hashes
recomputed by R**; direct byte-file hashing is unavailable in the permitted
toolset. Parent must verify deposited/output bytes. No inconsistency observed.

**Reconciled at the caller-instruction level**, conditional on the explicit
machine backend contract below. No drop-in native implementation or promotion
is claimed. No unresolved A/B functional disagreement was found after checking
the instruction sequence, operand widths, stack displacements, branches and
encoded addresses. This is not acceptance merely because A=B.

## Convergences, divergences, shared-risk check

| Subject | A versus B | ASM/bytes decision |
|---|---|---|
| CFG, call targets, widths, stack ordering | Agree | Retain only after independent correspondence to all slices. CFF8 tests full EAX; D0C2 early RET skips D243; D08A/D118/D158 compare WORD; D041/D10A/D1AA compare AL/BL. |
| Undefined EFLAGS representation | A uses `flags_known`, clears stored undefined bits; B uses `undefined_flags`, retains their old stored values | Neither stored value is an architectural promise. XOR/TEST leave AF undefined; SHL by 3 leaves AF/OF undefined. R uses an explicit undefined mask and preserves uninterpretable old bits, following B's representation, not its values as evidence. SUB after SHL defines all arithmetic flags before the indexed call. |
| Interface/style | A macros; B expanded fields; backend signatures differ | Non-native implementation choice, no vote needed. R keeps a compact address-named machine interface, including actual return-address pushes and explicit stack cleanup. |
| Fault/debugger fidelity | Both exclude instruction-by-instruction EIP/trap behavior | Limit preserved explicitly. This is an ordered sequential translation, not a precise fault-restart CPU emulator. Backend FLD/native calls must propagate exceptional/nonlocal behavior; no invented guards. |
| Returning to a modified CALL continuation | Both describe running through native RET, but do not explicitly reject a different returned EIP in C control flow | Shared interface ambiguity: a callee can overwrite its return address. R requires the backend to return to the C continuation **only at the supplied next VA**; other transfers propagate nonlocally. No target instruction or call is added. |
| Address labels | Both reject two misleading labels | Independently confirmed: `DD 05 E0 8B A7 01` at D26B reads **1A78BE0**, not 1A788B8. `E8 94 EA FE FF` at D277 targets **46BD10**, not 46BB10. Metadata independently lists 46BD10. |
| Opaque calls / apparent nullsub / cdecl | Both retain machine boundary | Retain all native calls, including 56BA80. No-push calls still see outstanding stack words; not proof of zero-argument prototypes. Plain RET leaves incoming argument to caller. Native return meaning remains UNCERTAIN. |
| FP conversion | Both leave FLD and 55AD90 native | Correct boundary: host `(int)double` would invent conversion/rounding/exception behavior. Input x87 environment remains intact. |

Additional common-error checks: preserve reloaded mode/latch values across calls;
do not substitute the request DWORD for the director's BYTE gate; do not hoist
sleep reads past request clears; do not force the ping-pong BYTE to 0/1; do not
replace the reused local record by a new zeroed nonaliasing struct; do not erase
incidental scratch registers/flags or force EAX into a Boolean result. None of
these substitutions occurs in the reconciled code.

## Complete reconciled C and execution contract

This C is a complete translation of the **target caller**, with opaque native
callees supplied by a backend. Its callback types are model interfaces, not
guessed game prototypes or additional game/library calls.

At entry `sp` addresses the native return address; `[sp+4]` is the explicitly
loaded 32-bit context argument. One shared little-endian address space contains
stack, context and globals. Memory hooks perform one exact-width access, in the
listed order, allowing unaligned accesses and all aliases; they do not mutate
CPU registers/flags as an extra effect. No separate C-local record, assumed
purity, lifetime guarantee or bounds check is introduced. Unsigned arithmetic
wraps modulo 2^32. Native hooks preserve all actual register/flag/memory/x87
effects, including non-cdecl stack effects if any; cleanup here is exactly the
caller's encoded ADD ESP, not a guessed argument count.

`native` starts with the CALL return address already pushed and EIP at target.
It returns to this C continuation only after native execution reaches `next`;
faults, nonreturning behavior and different control transfers must propagate
outside this wrapper, not be silently normalized. `fld64` executes x87 FLD
m64real in the existing control/status/tag/register environment, including
stack overflow and exceptional operands. No x87 rounding policy, conversion
helper implementation, register-stack cleanup or C cast is inferred.

The wrapper's `void` is not a native return-type inference: residual EAX remains
in the machine. EIP is maintained at native-call/FLD/RET boundaries only; precise
instruction trap timing, restart state after a memory fault, concurrent host
atomicity and asynchronous execution are outside this sequential model.
Undefined EFLAGS bits must not be consumed as defined by the backend.

```c
#include <stdint.h>

typedef struct M M;
struct M {
    uint32_t a,c,d,b,sp,bp,s,di,ip,flags,undef;
    void *shared_memory_and_native_state;
    void *x87_environment;
    uint8_t  (*r8)(M *,uint32_t);
    uint16_t (*r16)(M *,uint32_t);
    uint32_t (*r32)(M *,uint32_t);
    void (*w8)(M *,uint32_t,uint8_t);
    void (*w32)(M *,uint32_t,uint32_t);
    void (*native)(M *,uint32_t target,uint32_t next);
    void (*fld64)(M *,uint32_t operand);
};
enum { CF=1u, PF=4u, AF=16u, ZF=64u, SF=128u, OF=2048u,
       AR=CF|PF|AF|ZF|SF|OF };

static uint32_t szp(uint32_t r,unsigned bits) {
    uint32_t p=r&255u;
    p^=p>>4; p^=p>>2; p^=p>>1;
    return ((p&1u)?0u:PF) | (r?0u:ZF)
         | ((r&(UINT32_C(1)<<(bits-1u)))?SF:0u);
}
static uint32_t subf(M *m,uint32_t a,uint32_t b,unsigned bits) {
    uint32_t mask=bits==32u?UINT32_MAX:((UINT32_C(1)<<bits)-1u);
    uint32_t sign=UINT32_C(1)<<(bits-1u),r;
    a&=mask; b&=mask; r=(a-b)&mask;
    m->flags=(m->flags&~(uint32_t)AR)|szp(r,bits)
        | (a<b?CF:0u) | ((a^b^r)&16u?AF:0u)
        | ((a^b)&(a^r)&sign?OF:0u);
    m->undef&=~(uint32_t)AR;
    return r;
}
static uint32_t addf(M *m,uint32_t a,uint32_t b) {
    uint32_t r=a+b;
    m->flags=(m->flags&~(uint32_t)AR)|szp(r,32u)
        | (r<a?CF:0u) | ((a^b^r)&16u?AF:0u)
        | ((~(a^b))&(a^r)&UINT32_C(0x80000000)?OF:0u);
    m->undef&=~(uint32_t)AR;
    return r;
}
static uint32_t logicf(M *m,uint32_t r) {
    uint32_t def=CF|PF|ZF|SF|OF;
    m->flags=(m->flags&~def)|szp(r,32u);
    m->undef=(m->undef&~def)|AF;
    return r;
}
static uint32_t shl3(M *m,uint32_t a) {
    uint32_t r=a<<3u,def=CF|PF|ZF|SF;
    m->flags=(m->flags&~def)|szp(r,32u)|((a>>29u)&1u?CF:0u);
    m->undef=(m->undef&~def)|AF|OF;
    return r;
}
static void push(M *m,uint32_t v) {
    m->sp-=4u; m->w32(m,m->sp,v);
}
static uint32_t pop(M *m) {
    uint32_t v=m->r32(m,m->sp); m->sp+=4u; return v;
}
static void call(M *m,uint32_t target,uint32_t next) {
    push(m,next); m->ip=target; m->native(m,target,next);
}

#define A (m->a)
#define B (m->b)
#define C (m->c)
#define D (m->d)
#define S (m->s)
#define SP (m->sp)
#define R8(x) m->r8(m,(uint32_t)(x))
#define R16(x) m->r16(m,(uint32_t)(x))
#define R32(x) m->r32(m,(uint32_t)(x))
#define W8(x,v) m->w8(m,(uint32_t)(x),(uint8_t)(v))
#define W32(x,v) m->w32(m,(uint32_t)(x),(uint32_t)(v))
#define P(x) push(m,(uint32_t)(x))
#define N(t,n) call(m,(t),(n))
#define ADDSP(x) (SP=addf(m,SP,(x)))
#define CMP(x,y) ((void)subf(m,(x),(y),32u))
#define CMP8(x,y) ((void)subf(m,(x),(y),8u))
#define CMP16(x,y) ((void)subf(m,(x),(y),16u))
#define TEST(x) ((void)logicf(m,(x)))
#define Z ((m->flags&ZF)!=0u)
#define AL(x) (A=(A&UINT32_C(0xffffff00))|(uint8_t)(x))

void reconciled_0047CF60(M *m) {
    /* CF60: local allocation, saves, incoming argument. */
    SP=subf(m,SP,0x1cu,32u); P(B); P(S);
    S=R32(SP+0x28u); B=logicf(m,B^B);
    CMP(R32(S+0xba8u),B); if (!Z) goto LCF87;
    /* CF73 */
    P(0x1e0u); P(0x280u); P(B); P(B);
    N(0x45b4c0u,0x47cf84u); ADDSP(0x10u);
LCF87:
    A=SP+8u; P(S); P(A);
    W32(SP+0x18u,0u); W32(SP+0x14u,0u);
    W32(SP+0x10u,0u); W32(SP+0x1cu,0x3f800000u);
    N(0x41e168u,0x47cfb2u);
    P(S); P(1u); P(1u); P(1u); N(0x41dfbau,0x47cfbeu);
    A=R32(S+0xba8u); ADDSP(0x18u); CMP(A,B);
    if (!Z) goto LCFEE;
    /* CFCB: load order remains distinct from push order. */
    C=R32(0x01a77650u); D=R32(0x01a77654u); A=R32(0x01a77648u);
    P(C); C=R32(0x01a7764cu); P(D); P(A); P(C);
    N(0x45b4c0u,0x47cfebu); ADDSP(0x10u);
LCFEE:
    P(S); P(B); N(0x41e972u,0x47cff5u); ADDSP(8u);
    TEST(A); if (Z) goto LD243;
    /* D000: six pushed words survive until D039. */
    D=R32(0x01d2a284u); P(D); N(0x416b9au,0x47d00cu);
    A=R32(0x01d2a288u); P(A); N(0x424bf9u,0x47d017u);
    N(0x49b120u,0x47d01cu); N(0x499a40u,0x47d021u);
    P(S); N(0x43fbe8u,0x47d027u);
    P(S); N(0x409b42u,0x47d02du);
    P(S); N(0x409b08u,0x47d033u);
    P(S); N(0x409b25u,0x47d039u); ADDSP(0x18u);
    N(0x56ba40u,0x47d041u);
    AL(R8(0x01d28deau)); CMP8(A,B); if (Z) goto LD0D3;
    /* D04E */
    N(0x4a71d0u,0x47d053u); TEST(A); if (Z) goto LD0D3;
    /* D057 */
    W32(0x01cff834u,1u); W32(0x01cff844u,B);
LD067:
    W32(S+0xb88u,1u); N(0x45b580u,0x47d076u);
LD076:
    N(0x4701b0u,0x47d07bu); N(0x4701b0u,0x47d080u);
    N(0x4701b0u,0x47d085u); N(0x4701b0u,0x47d08au);
    CMP16(R16(0x01cdbfe0u),3u); if (!Z) goto LD0BB;
    /* D094 */
    P(B); N(0x4a76e0u,0x47d09au); ADDSP(4u);
    N(0x4a8e30u,0x47d0a2u); N(0x4a84e0u,0x47d0a7u);
    N(0x4a8e30u,0x47d0acu); N(0x4a84e0u,0x47d0b1u);
    N(0x4a8e30u,0x47d0b6u); N(0x4a84e0u,0x47d0bbu);
LD0BB:
    N(0x45b2e0u,0x47d0c0u); TEST(A); if (Z) goto LD10A;
    /* D0C4: separate return, not the D243 tail. */
    P(S); N(0x41e99du,0x47d0cau); ADDSP(4u);
    S=pop(m); B=pop(m); ADDSP(0x1cu); m->ip=pop(m); return;
LD0D3:
    W8(0x01d28de9u,B);
    A=R32(0x01cff834u); CMP(A,B); if (Z) goto LD0E7;
    /* D0E2 */
    N(0x5003a0u,0x47d0e7u);
LD0E7:
    A=R32(0x01cff844u); W32(0x01cff834u,B); CMP(A,B);
    if (Z) goto LD067;
    /* D0FA */
    W32(S+0xb88u,B); N(0x45b590u,0x47d105u); goto LD076;
LD10A:
    AL(R8(0x01d28de9u)); CMP8(A,B); if (!Z) goto LD118;
    /* D113 */
    N(0x47ccb0u,0x47d118u);
LD118:
    CMP16(R16(0x01cdbfe0u),3u); if (!Z) goto LD150;
    /* D122: zero-extend byte, LEA/SHL/SUB/LEA, no guard. */
    A=logicf(m,A^A); AL(R8(0x01d96a80u)); C=A+A*2u;
    C=shl3(m,C); C=subf(m,C,A,32u); D=0x01d969c8u+C*4u;
    P(D); N(0x4a76e0u,0x47d13eu); ADDSP(4u);
    N(0x4a8e30u,0x47d146u); N(0x4a84e0u,0x47d14bu);
    N(0x4a78e0u,0x47d150u);
LD150:
    CMP(R32(0x01cff830u),B); if (Z) goto LD1AA;
    /* D158 */
    CMP16(R16(0x01cdbfe0u),4u); if (!Z) goto LD17C;
    /* D162: store addresses, do not execute them. */
    W32(SP+0x10u,0x004a2280u); W32(SP+0x14u,0x004a22a0u);
    W32(SP+0x18u,0x004a2690u); goto LD194;
LD17C:
    W32(SP+0x10u,0x00470690u); W32(SP+0x14u,0x004706a0u);
    W32(SP+0x18u,0x004706b0u);
LD194:
    A=SP+8u; P(S); P(A);
    W32(SP+0x24u,B); W32(SP+0x28u,B);
    N(0x409a57u,0x47d1a7u); ADDSP(8u);
LD1AA:
    AL(R8(0x01d28de9u)); CMP8(A,B); if (!Z) goto LD1FA;
    /* D1B3 */
    A=R32(0x01cff6f4u); CMP(A,B); if (Z) goto LD1F3;
    /* D1BC: MOV does not change flags consumed by SETZ CL. */
    D=R32(0x01a77650u); C=logicf(m,C^C); CMP(A,2u);
    A=R32(0x01a77654u); C=(C&UINT32_C(0xffffff00))|(Z?1u:0u);
    P(C); C=R32(0x01a77648u); P(0x3ac49ba6u); P(D);
    D=R32(0x01a7764cu); P(A); P(C); P(D);
    N(0x56d1d0u,0x47d1eau); ADDSP(0x18u); W32(0x01cff6f4u,B);
LD1F3:
    N(0x56ba80u,0x47d1f8u); goto LD204;
LD1FA:
    P(UINT32_MAX); N(0x45d610u,0x47d201u); ADDSP(4u);
LD204:
    CMP(R32(0x01cff834u),B); if (Z) goto LD213;
    /* D20C */
    W8(0x01d28de9u,1u);
LD213:
    CMP(R32(0x01cff844u),B); if (!Z) goto LD235;
    /* D21B */
    N(0x4980c0u,0x47d220u); N(0x465930u,0x47d225u);
    P(S); P(1u); N(0x41e947u,0x47d22du); ADDSP(8u);
    N(0x499ea0u,0x47d235u);
LD235:
    N(0x45b450u,0x47d23au);
    P(S); N(0x41e99du,0x47d240u); ADDSP(4u);
LD243:
    N(0x56d9c0u,0x47d248u);
    A=R32(0x00b6d970u); CMP(A,B); if (Z) goto LD265;
    /* D251 */
    CMP(R32(0x01cff834u),B); if (!Z) goto LD265;
    /* D259 */
    N(0x4020f0u,0x47d25eu); W32(0x01cff844u,A); goto LD26B;
LD265:
    W32(0x01cff844u,B);
LD26B:
    m->ip=0x47d26bu; m->fld64(m,0x01a78be0u);
    N(0x55ad90u,0x47d276u); P(A);
    N(0x46bd10u,0x47d27cu); ADDSP(4u);
    S=pop(m); B=pop(m); ADDSP(0x1cu); m->ip=pop(m);
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
#undef P
#undef N
#undef ADDSP
#undef CMP
#undef CMP8
#undef CMP16
#undef TEST
#undef Z
#undef AL
```

## Coverage, ABI and exact accesses

All 41 CFG starts are represented by code labels or their explicit commented
fallthrough sections (addresses below omit the common 0x47 prefix):
CF60, CF73, CF87, CFCB, CFEE, D000, D04E, D057, D067, D076,
D094, D0BB, D0C4, D0D3, D0E2, D0E7, D0FA, D10A, D113, D118,
D122, D150, D158, D162, D17C, D194, D1AA, D1B3, D1BC, D1F3,
D1FA, D204, D20C, D213, D21B, D235, D243, D251, D259, D265, D26B.
Every conditional edge and both exit blocks match native-metadata. No external
chunk, jump table, indirect call or target instruction is omitted.

After the prologue, local base is SP+8; arg1 is SP+0x28, corresponding to entry
SP+4. Initial record store order relative to local base is +8,+4,+0,+12; later
only +8,+12,+16,+20,+24 are overwritten. Earlier +0/+4 contents can have been
modified by 41E168 and are **not** zeroed before 409A57. Stored callback triples
are 4A2280/4A22A0/4A2690 or 470690/4706A0/4706B0. They are not calls here.
EBX/ESI are saved/restored; EBP/EDI are not directly changed by this target.
RET consumes only the return address; incoming argument cleanup is cdecl-style,
without evidence for a semantic native return type or complete prototype.

Direct accesses: DWORD context +BA8 twice and stores +B88; WORD 1CDBFE0 at
three separate mode comparisons; BYTE 1D28DEA, BYTE 1D28DE9 loads/stores, BYTE
1D96A80 index; DWORD 1CFF830/834/844/6F4, 1D2A284/288, B6D970, render operands
1A77648/4C/50/54; DWORD stack operations; x87 eight-byte load 1A78BE0.
AL loads preserve EAX[31:8] except after XOR EAX; SETZ modifies CL only after
XOR ECX. No AX assignment or signed relational branch exists. SHL count is
literal 3 (x86 masked count also 3); effective index address is
`1D969C8 + 92*(uint8_t)[1D96A80]` with no 0/1 validation. Literal pushes
3F800000, 3AC49BA6 and sign-extended FFFFFFFF are preserved as bits.

## Bounded role/contract and evidence anchors

Structural role, high confidence: a context-driven gated orchestration caller,
with a separate byte-gated progression call, repeated state-3 support-call
sequences, context-backed begin/leave boundaries, next-callback-record selection
and conditional timing/x87 tail. Neutral descriptive name:
`ContextFrameOrchestrator_0047CF60` (proposal only, not an IDB change).
The supplied compaction relates these addresses to battle/render scheduling;
that motivates a battle-frame interpretation, but individual callee business
effects and semantic return type remain **UNCERTAIN** without their bodies.
No independent semantic-volet reconciliation or name promotion is asserted.

Exact native anchors, not labels/comments as proof:

1. **47CF60–47CF6B / 47D0CD–47D0D2 / 47D27F–47D284**:
   `83 EC 1C`, saved EBX/ESI, `8B 74 24 28`, and plain C3 prove stack
   allocation, original arg1 load and the two caller-cleaned exits.
2. **47CFF0–47CFFA / 47D0BB–47D0D2 / 47D23B**: CALLs to 41E972 and
   41E99D plus EAX tests establish a begin-result gate and separate early-leave
   exit; repeated context argument supports orchestration, not a pure computation.
3. **47D0D3–47D0F4 / 47D10A–47D113 / 47D204–47D20C**:
   BYTE clear/load at 1D28DE9, DWORD request/sleep accesses, and byte-gated CALL
   47CCB0 prove distinct latch/request state and the late conditional byte set.
4. **47D08A–47D0B6 / 47D118–47D14B**:
   `66 83 3D E0 BF CD 01 03` and repeated calls 4A8E30/4A84E0 prove the
   WORD-state-3 orchestration; D122–D131 proves zero-extended byte/92-byte stride.
5. **47D150–47D1A7**: DWORD exit test, WORD mode-4 test, exact stack callback
   address stores and pointer/context pushes to 409A57 prove conditional record
   selection/reuse. No callback prototype or immediate callback invocation follows.
6. **47D1BC–47D201 / 47D213–47D240**: CMP EAX,2 before MOV/SETZ CL proves
   flag-dependent sixth pushed word; all six ordered pushes, post-call latch clear,
   paused FFFFFFFF alternative and sleeping-dependent submission sequence remain.
7. **47D243–47D284**, native-bytes-002:4–6: rate-call result store, exact
   `DD 05 E0 8B A7 01`, CALL 55AD90 and `E8 94 EA FE FF` prove the shared
   tail, FP operand and true final call target; they do not prove host cast semantics.
8. **native-metadata:315–327**: inbound references 4709EC (owner 4706B0) and
   5598DD (owner 559890) are type 1, `iscode:false`; not direct-call ABI evidence.

The structural role has at least two independent local proofs: guarded/repeated
native-call scheduling (anchors 2–4) and conditional callback-record construction
(anchor 5). Effects are the exact direct writes and ordered opaque calls shown;
transitive effects, full object/global layouts, valid memory ranges and callback
lifetimes cannot be exhaustively inferred from this freeze.

## Residual risks / parent validation

- Native callees, semantic prototypes/return meaning, initial x87 environment,
  55AD90 conversion policy and 46BD10 effects are external **UNCERTAIN** contracts;
  not filled with invented CERTAIN semantics. Backend implementation is absent.
- Hashes are recorded but not recomputed. No compilation, execution, differential
  testing, precise fault/trap simulation or automated coverage test was performed.
- Parent should verify native readback for both misleading labels, compile with
  its authorized backend, and exercise both RETs, failed begin, byte/request/sleep
  transitions, mode reloads across callees, all callback choices, arbitrary BYTE
  indices, aliased stack writes, nonlocal call returns and exceptional x87 inputs.
- Offline reconciliation does **not** replace lead's final native §5.6,
  IDB/save/readback or promotion control. No IDB/git/registry/config/live mutation.
