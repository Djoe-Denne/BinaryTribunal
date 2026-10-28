# 0x50BF90 - independent C author B (run01, g27)

Inputs read (only): inputs/ff8-decomp-semantics-20261011-r01/g27/common-compaction.md and
inputs/ff8-decomp-semantics-20261011-r01/g27/0x50BF90.json (lead-verified identical frozen SHA).
Binary FF8_EN.exe SHA256 064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570.
Single chunk [0x50BF90,0x50C090), 256 bytes, 81 instructions, 15 CFG blocks, no call, no indirect branch.
Every instruction was re-decoded from the raw hex of the chunk (not from IDA comments/labels).
Labels (BattleActionSequence_PreparePayloadContext, g_GfSequenceContextSharedB, result_event,
dword_1D99Axx) are treated as identifiers only. No compilation or test was executed.

## 1. ABI / frame (from bytes)

- S = ESP at entry. 83EC08 reserves 8 bytes: [S-8] DWORD temp, [S-4] byte local.
- 55/56 push EBP, ESI. 8B742414 -> ESI = DWORD [S+4] = the single stack argument.
- 53/57 push EBX, EDI only on the (always taken, see 3.1) loop path; popped at 50C065/50C06D.
- Return is plain C3 after 83C408: caller cleanup, cdecl, one 4-byte argument
  (caller window 50A798 push / 50A7A5 add esp,4 per compaction).
- 89 44 24 1C (50BFF7) and 89 44 24 1C (50C05F) store the outer loop counter into the
  argument home slot [S+4]; on the normal path that slot holds 0 at return.
- 88 4C 24 0C (50BFB9) writes only the BYTE [S-4]; 8B 4C 24 14 (50C053) reloads the full
  DWORD [S-4] into ECX: upper 24 bits are uninitialized stack, but only CL is consumed afterwards.
- C7-free: [S-8] = 1 is written via ECX (50C01B/50C023) and reloaded at 50C02E.
- Callee-saved EBX/ESI/EDI/EBP restored; ECX/EDX clobbered; EAX returned (see 3.4).

## 2. Faithful C

~~~c
#include <stdint.h>

/* Exact-width absolute/relative accesses. volatile is a fidelity annotation only:
 * it pins access width and program order (stores to globals may alias the payload
 * and event records, every native re-read is a real memory read). It is not a
 * semantic claim that the memory is hardware-volatile. */
#define G8(a)     (*(volatile uint8_t  *)(uintptr_t)(a))
#define G16(a)    (*(volatile uint16_t *)(uintptr_t)(a))
#define G32(a)    (*(volatile uint32_t *)(uintptr_t)(a))
#define M8(b, o)  (*(volatile uint8_t  *)(uintptr_t)((uint32_t)(b) + (uint32_t)(o)))
#define M32(b, o) (*(volatile uint32_t *)(uintptr_t)((uint32_t)(b) + (uint32_t)(o)))

/* cdecl, one DWORD stack argument [S+4], caller pops. Pointer kept as uint32_t
 * (32-bit image) so that all address arithmetic is modulo 2^32 as in x86. */
uint32_t __cdecl sub_50BF90(uint32_t p)
{
    uint32_t eax;
    uint32_t edx;            /* inner record cursor */
    uint32_t ebx;            /* outer record cursor */
    uint32_t t8, tC;
    uint16_t bp;             /* EBP: xor ebp,ebp; only BP ever modified -> upper 16 stay 0 */
    uint8_t  b0;             /* byte local [S-4] */
    uint8_t  cl, al;
    int32_t  outer;          /* also mirrored into arg home slot [S+4] */
    int32_t  inner;          /* EDI */

    bp = 0;                                  /* 50BF99 xor ebp,ebp            */
    G32(0x1D99A50) = p;                      /* 50BF9B mov [1D99A50],esi       */
    G16(0x1D99A5C) = bp;                     /* 50BFA1 mov word [1D99A5C],bp   */
    t8 = M32(p, 0x08);                       /* 50BFA8 mov eax,[esi+8]         */
    b0 = M8(p, 0x00);                        /* 50BFAB mov cl,[esi]            */
    G32(0x1D99A60) = t8;                     /* 50BFAD mov [1D99A60],eax       */
    cl = b0;                                 /* 50BFB2/B4: eax = ecx & 0xFF    */
    /* 50BFB9 mov byte [S-4],cl  (b0 kept as the byte local)                   */
    G16(0x1D99A90) = 0;                      /* 50BFBD mov word [1D99A90],bp   */
    G8(0x1D99A6D)  = 0;                      /* 50BFC4 mov byte [1D99A6D],0    */
    tC = M32(p, 0x0C);                       /* 50BFDA mov edx,[esi+0Ch]       */
    /* 50BFCB lea edx,[eax+eax*4]; 50BFCE shl edx,3; 50BFD1 sub edx,eax (x39);
     * 50BFD3 lea eax,[edx*4+1D972C0h] (x4) => base + b0*0x9C, mod 2^32       */
    G32(0x1D99A40) = 0x1D972C0u + (uint32_t)b0 * 0x9Cu;   /* 50BFDD          */
    outer = (int32_t)(uint32_t)M8(p, 0x11);  /* 50BFE2 xor eax / 50BFE4 mov al */
    G32(0x1D99A74) = tC;                     /* 50BFE7 mov [1D99A74],edx       */
    outer = outer + 1;                       /* 50BFED inc eax  -> 1..256      */

    if (outer <= 0) {                        /* 50BFEE cmp eax,ebp(0); 50BFF0 jle (SIGNED) */
        /* Native path kept for completeness; with outer in 1..256 it is not
         * taken. Skips the loop and the 50C066 store; EAX = outer, CL = b0. */
        eax = (uint32_t)outer;
    } else {
        /* 50BFF2 push ebx; 50BFF3 push edi */
        ebx = p + 0x10u;                     /* 50BFF4 lea ebx,[esi+10h]       */
        /* 50BFF7 mov [S+4],eax : argument slot := outer                       */
        do {
            uint32_t cnt = (uint32_t)M8(ebx, 0);   /* 50BFFB xor eax / 50BFFD mov al,[ebx] */
            if ((int32_t)cnt > 0) {               /* 50BFFF test eax,eax; 50C001 jle (SIGNED, == "cnt!=0") */
                edx = M32(ebx, (uint32_t)-8);     /* 50C003 mov edx,[ebx-8]    */
                inner = (int32_t)cnt;             /* 50C006 mov edi,eax        */
                do {
                    cl = M8(edx, 0);              /* 50C008 mov cl,[edx]       */
                    /* 50C00A mov eax,1; 50C00F shl eax,cl (count masked & 31);
                     * 50C011 or bp,ax (16-bit: only low 16 bits retained)   */
                    bp = (uint16_t)(bp | (uint16_t)(1u << (cl & 31u)));
                    al = M8(edx, 3);              /* 50C014 mov al,[edx+3]     */
                    if ((al & 0x08u) != 0) {      /* 50C017 test al,8; 50C019 jz */
                        /* 50C01B mov ecx,1; 50C023 mov [S-8],ecx            */
                        al = (uint8_t)(al >> 6);  /* 50C020 shr al,6 (0..3)    */
                        G8(0x1D99A84) = al;       /* 50C027 mov [1D99A84],al   */
                        cl = al;                  /* 50C02C mov cl,al          */
                        /* 50C02E mov eax,[S-8] (=1); 50C032 shl eax,cl;
                         * 50C034 or word [1D99A90],ax  (16-bit RMW)          */
                        G16(0x1D99A90) = (uint16_t)(G16(0x1D99A90) |
                                          (uint16_t)(1u << (cl & 31u)));
                    }
                    cl = (uint8_t)(M8(edx, 2) & 0x30u);   /* 50C03B mov cl,[edx+2]; 50C03E and cl,30h */
                    if (cl == 0x30u) {                    /* 50C041 cmp cl,30h; 50C044 jnz */
                        G8(0x1D99A6D) = (uint8_t)(G8(0x1D99A6D) | 0x02u); /* 50C046 or byte [1D99A6D],2 */
                    }
                    edx += 0x18u;                 /* 50C04D add edx,18h        */
                } while (--inner != 0);           /* 50C050 dec edi; 50C051 jnz */
                cl = b0;                          /* 50C053 mov ecx,[S-4] (only CL used later) */
            }
            ebx += 0x14u;                         /* 50C05B add ebx,14h        */
        } while (--outer != 0);                   /* 50C057/5E/5F/63: reload [S+4], dec, store, jnz */
        eax = 0;                                  /* EAX = final counter value 0 */
        /* 50C065 pop edi */
        G16(0x1D99A5C) = bp;                      /* 50C066 mov word [1D99A5C],bp */
        /* 50C06D pop ebx */
    }

    al = M8(p, 0x10);                             /* 50C06E mov al,[esi+10h]   */
    eax = (eax & 0xFFFFFF00u) | al;
    G8(0x1D99A5A) = al;                           /* 50C073 (after 50C071 test al,al) */
    if (al != 0) {                                /* 50C078 jz 50C084          */
        uint32_t q = M32(p, 0x08);                /* 50C07A mov edx,[esi+8] (re-read, NOT cached 1D99A60) */
        al = M8(q, 0);                            /* 50C07D mov al,[edx]       */
        eax = (eax & 0xFFFFFF00u) | al;
        G8(0x1D99A48) = al;                       /* 50C07F mov [1D99A48],al   */
    }
    /* 50C084 pop esi */
    G8(0x1D99A56) = cl;                           /* 50C085 mov [1D99A56],cl   */
    /* 50C08B pop ebp; 50C08C add esp,8; 50C08F retn */
    return eax;
}
~~~

## 3. Verification notes (instruction-level)

### 3.1 Control flow / signedness
- 50BFF0 7E7C: jle (signed) to 50C06E. EAX = zext8([p+0x11]) + 1 is in 1..256, compared with
  EBP = 0: never <= 0, so this edge is dead under the shown definitions; kept, not removed.
- 50C001 7E54: jle (signed) after test of a zero-extended byte: equivalent to cnt == 0.
- 50C051 75B5 -> 50C008 and 50C063 7596 -> 50BFFB re-checked by displacement arithmetic.
- Loops are do/while with dec/jnz: inner runs exactly cnt (1..255) times, outer exactly
  zext8([p+0x11])+1 (1..256) times. No capacity / range guard exists in the native code.
- Outer record i (i = 0..n): count byte at p+0x10+0x14*i, event pointer DWORD at p+0x08+0x14*i.
  Inner record stride 0x18 with fields read at +0, +2, +3 (bytes).

### 3.2 Shifts / widths / wrap
- 50C00F d3e0 shl eax,cl: hardware masks the count to 5 bits -> (1u << (cl & 31)). For counts
  16..31 the bit is lost by the 16-bit OR (66 0B E8 = or bp,ax). Not range-checked.
- 50C020 c0e806 shr al,6 is an 8-bit logical shift -> 0..3; 50C034 is a 16-bit OR-to-memory (66 09 05).
- 50C046 is an 8-bit OR to 0x1D99A6D (80 0D ... 02). 50BFC4 is an 8-bit store (C6 05 ... 00),
  50BFA1/50BFBD/50C066 are 16-bit stores (66 89 2D). Do not widen per dword_ labels.
- 0x1D972C0 + b0*0x9C computed via lea/shl/sub/lea; b0 <= 255 so no 32-bit wrap occurs in practice.

### 3.3 Register-state facts used
- Final CL: initial CL = b0 (50BFAB). Each non-empty inner loop ends at 50C053 reloading CL from
  the byte local b0; empty groups do not touch ECX. Therefore [0x1D99A56] always receives the
  ENTRY value b0 (not a re-read of [p]) on every path.
- [S-4] reload at 50C053 reads 4 bytes, 3 uninitialized; no observable effect except ECX upper
  bits at return (ECX is caller-saved, not part of the result).
- BP accumulator: OR of all inner record bits; written to [0x1D99A5C] once at 50C066 (after a
  zero store at 50BFA1). Upper 16 bits of EBP never become nonzero.

### 3.4 Return value (AL/EAX)
- Reachable path: EAX = 0 after the outer loop (50C05E), then AL = [p+0x10] (50C06E) and, if
  nonzero, AL = [[p+8]] (50C07D). So EAX = zero-extended byte. No MOVZX: the zero upper bits come
  from the loop counter, not from an explicit extension. Modeled as uint32_t.
- Dead jle path: upper bits would be those of outer (not reachable).
- Per compaction (caller window 50A79E mov eax,[1D99A50]) the immediate caller overwrites EAX:
  return value is not consumed there. Prototype "void" would be an acceptable *caller-view*
  simplification but is NOT what the native register state shows; uint32_t kept for fidelity.

### 3.5 Memory order / alias
- Order of stores: A50, A5C(16), A60, [S-4], A90(16), A6D(8), A40, A74, then loop {A84(8), A90 RMW,
  A6D RMW}, A5C(16), A5A(8), A48(8, conditional), A56(8).
- Reads of [p+8] and [p] happen after the A50/A5C stores; [p+0xC] before the A40 store; [p+0x11]
  between the A40 and A74 stores; tail re-reads [p+0x10] and [p+8] after all loop stores. If any
  global aliases the payload/records the native re-read order is what the C preserves.

## 4. Semantic summary (factual, no business naming)

- Role (structural): latches a caller-supplied record pointer and derived values into a block of
  globals around 0x1D99A40..0x1D99A90, and computes OR-masks over a two-level list of records.
- In: DWORD stack arg p. Reads p+0 (byte), +8 (DWORD), +0xC (DWORD), +0x10 (byte), +0x11 (byte),
  outer records stride 0x14 from p+0x08/p+0x10, inner records stride 0x18 at +0,+2,+3.
- Out/effects: globals listed in 3.5; argument home slot [S+4] := 0; EAX = zext byte (unused by caller).
- Proofs: 50BF9B (A50 = p); 50BFD3/50BFDD (A40 = 0x1D972C0 + 0x9C*[p]); 50C00F/50C011 (bit mask
  1<<[rec+0] into BP); 50C017-50C034 ([rec+3] bit3 -> A84 = [rec+3]>>6, A90 |= 1<<that);
  50C03B-50C046 ([rec+2]&0x30 == 0x30 -> A6D |= 2); 50C066 (A5C = BP); 50C073/50C07F/50C085 tail.
- Confidence: high for the C (byte-level decode, all 81 instructions covered); semantic purpose of
  fields/globals UNKNOWN (labels/comments not evidence).
- Name proposal (neutral): Seq_LatchPayloadAndBuildEventMasks_50BF90 - hypothesis only.

## 5. Uncertainties / not done
- Global types/extents, field purposes, writers of p+0x10/+0x11, actor table capacity (0x9C stride
  index not bounded by the code): unproved.
- Full caller ASM not in the freeze (only the compaction-reported caller window).
- No compilation, no byte-diff, no runtime test performed; requests for the lead/reviewer.
