# BattleTarget_GetRandomPartyMask @ 0x486DC0 — C descriptif relu (drain)

- Confiance : LIKELY NUMERIC ; rôle métier/type/prototype/ABI non certifiés.
- Parent gate native : `c66ec4b8841f307492c5b59346181b61803dd7a8183f8bd31608bbae6a82d911`, 19 EA / 62 octets ; [sémantique](../semantic/0x486DC0__BattleTarget_GetRandomPartyMask.md).
- C exact SHA-256 `431f10fad968ae3862455eafb14c90ef49613c56134132af9902d9bf0adf9ccc` ; ce C conditionnel est descriptif, pas certification compilateur/runtime.
- Payload C : exactement 4970 octets après ouverture de fence ; le LF séparateur Markdown éventuel avant fermeture est hors payload, pas normalisation du fichier C accepté.
- Aucun rename/SetType/patch ; les anciennes mentions Push/SetType ci-dessous sont **historiques**, pas opérations du drain.

## C réconcilié / indépendant relu — payload exact

```c
/* Canonical documentary C, 0x486dc0, outside the adaptive pilot.
 * Ground truth = supplied parent live numeric ASM + guarded instruction bytes,
 * not Hex-Rays. [0x486dc0,0x486dfe): 19 instructions, 62 bytes.
 * Raw SHA256 c66ec4b8841f307492c5b59346181b61803dd7a8183f8bd31608bbae6a82d911.
 * No fresh live recapture by R. No native prototype, compilation, backend,
 * runtime-equivalence, semantic-promotion or termination proof is asserted.
 * No explicit register saves, PUSH, stack-argument reads or ADD ESP in root;
 * both exits are C3. Frame metadata alone does not prove native callee ABI.
 *
 * CONDITIONAL MATHEMATICAL ADAPTER CONTRACT (not actual library calls):
 * invoke describes the ordered opaque CALL at the numeric target, with all
 * seven current non-ESP GPRs as inputs and their faithful post-call values.
 * It may read/write ordinary native RAM, including the three tested bytes.
 * It returns normally with balanced private frames and preserves whatever
 * state the normal native callee ABI requires; that ABI is NOT inferred here.
 * No particular EAX return width or register-input convention is invented.
 * read_u8 describes exactly one ordinary RAM byte load at its numeric address,
 * with no added write, call, register change or other observable effect.
 * Both operations share the SAME RAM state: no snapshot, restrict, caching,
 * load hoisting or disjointness between call effects and tested bytes.
 * The adapter descriptor is valid, immutable, and private; r and bookkeeping
 * are valid private storage, disjoint from descriptor and native RAM effects.
 * Initial GPRs are caller-supplied, unrestricted 32-bit values. Hooks must not
 * retain/modify bookkeeping except for invoke's faithful synchronous GPR output.
 * Hidden flags/stack/ESP/PC/non-GPR inputs must be irrelevant or supplied by a
 * stronger external adapter; none is established by this root. EFLAGS output,
 * exceptions, MMIO/concurrency, timing and return-address observation are not
 * modeled. These are explicit documentary limits, NOT verified native facts.
 * Synthetic C function-pointer signatures below encode these operations only.
 */
#include <stdint.h>

struct numeric_486dc0_gprs {
    uint32_t eax, ecx, edx, ebx, esi, edi, ebp;
};

struct numeric_486dc0_adapters {
    void *state;
    void (*invoke)(void *state, uint32_t target,
                   struct numeric_486dc0_gprs *r);
    uint8_t (*read_u8)(void *state, uint32_t address);
};

/* Numeric binding only: no inferred symbol name or struct identity.
 * Three reachable bytes: 0x01d27b90, 0x01d27c60, 0x01d27d30.
 * Encoded displacement is base; stride 0xd0 is derived, not a type sizeof. */
#define RAM_BYTE_BASE_01D27B90 UINT32_C(0x01d27b90)

uint32_t c_486dc0_reviewed(const struct numeric_486dc0_adapters *a,
                         struct numeric_486dc0_gprs *r)
{
    int32_t dividend;

    a->invoke(a->state, UINT32_C(0x4860a0), r); /* 0x486dc0: once only */
    /* 0x486dc5 CMP EAX,255; 0x486dca JNZ loc_486DD0 (unequal).
     * 0x000100ff does NOT take this early return; full EAX matters. */
    if (r->eax == UINT32_C(0xff)) {
        r->eax &= UINT32_C(0xffff0000); /* 0x486dcc: XOR AX,AX only */
        return r->eax;                 /* 0x486dcf: equality proves EAX=0 */
    }

    for (;;) {                        /* loc_486DD0; retry is unbounded */
        /* First entry forwards post-first-call GPRs unchanged by CMP.
         * Retry forwards EAX=208*i, ECX=i, EDX=3*i (not stale call outputs). */
        a->invoke(a->state, UINT32_C(0x48f020), r); /* 0x486dd0 */
        r->eax &= UINT32_C(0xff);      /* 0x486dd5: 256 possible low bytes */
        r->ecx = UINT32_C(3);          /* 0x486dda: signed positive divisor */
        r->edx = UINT32_C(0);          /* 0x486ddf: CDQ, EAX in [0,255] */
        dividend = (int32_t)r->eax;    /* conversion exact in this range */
        /* 0x486de0: signed IDIV ECX, EDX:EAX = nonnegative dividend.
         * Quotient <=85, remainder i in [0,2]; no local divide exception. */
        r->eax = (uint32_t)(dividend / (int32_t)r->ecx);
        r->edx = (uint32_t)(dividend % (int32_t)r->ecx);
        r->ecx = r->edx;                              /* 0x486de2 */
        r->edx = r->ecx + r->ecx * UINT32_C(2);        /* 0x486de4: LEA, 3*i */
        r->eax = r->ecx + r->edx * UINT32_C(4);        /* 0x486de7: LEA, 13*i */
        r->eax <<= 4;                                /* 0x486dea: 0xd0*i */

        /* 0x486ded: TEST BYTE [EAX+0x01d27b90],1, one ordered reload.
         * 0x486df4: JNZ loc_486DD0, mask 0x01 SET retries, CLEAR exits. */
        if ((a->read_u8(a->state, RAM_BYTE_BASE_01D27B90 + r->eax)
             & UINT32_C(1)) != 0)
            continue;

        r->eax = UINT32_C(1);                         /* 0x486df6: full EAX */
        r->eax <<= (r->ecx & UINT32_C(31));            /* 0x486dfb: SHL EAX,CL */
        return r->eax;                                /* 0x486dfd: EAX=1,2,4 */
    }
}
```
