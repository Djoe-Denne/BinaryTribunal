# 0x50BF90 - independent semantic B

## Scope, sources, confidence

Only authorized g27 inputs used: `common-compaction.md` (F) and `0x50BF90.json` (N), plus their identical native checkpoint. No peer output, target C, classifier, index, or new surrounding discovery. N:13-18 covers [0x50BF90,0x50C090), 256 bytes, 81 instructions; N:19-130 supplies all 15 CFG blocks. N:131-140 supplies one incoming call xref, 0x50A799 in 0x50A790, and no code targets. Comments and old labels are not evidence.

Overall confidence: **LIKELY** for battle presentation meaning; **CERTAIN** for the numeric memory/register operations below. Exact group/record types and formal return type remain **UNCERTAIN**. No mechanical conflict found between bytes, ASM, and F. Documentary disputes in F:37 are not promoted.

## Role and proposed name

Proposed name: `BattleSequenceContext_LatchPayloadAndAggregateRecordMasks` (**LIKELY**).

Mechanically this routine publishes a passed descriptor pointer and selected descriptor fields, selects a fixed-stride table element using its first byte, scans counted lists to accumulate two 16-bit masks and a byte flag, and publishes first-list/current-descriptor summary bytes. It does not dispatch callbacks, execute damage, allocate memory, or call another routine.

Independent naming evidence: pointer/field publication and table-element selection (proofs 1-2) establish context latching; nested record scans and independent mask reductions (proofs 3-5) establish aggregation. The battle-sequence prefix is supported only as LIKELY by the frozen surrounding presentation-table and caller-chain context, F:20,34-36, not by the old native label. A fully neutral name is `LatchDescriptorContextAndAggregateRecordMasks`.

## Input, output, and effects

Input is one stack DWORD pointer P, loaded at 0x50BF95. The frozen caller window in F:20 pushes this pointer and cleans four bytes after the call. The function has a plain RET, not RET 4. No extra register input affects the ordinary published low-byte results; initial ECX upper bits are not globally published. Descriptor/list storage and absolute globals are mutable memory dependencies, not assumed disjoint objects.

Descriptor reads: byte P+0; DWORD P+8 and P+0xC; byte P+0x11 for initial outer count; byte P+0x10 again at the tail. Outer groups step 0x14 bytes. Their count byte is at P+0x10+0x14*i, and their list pointer DWORD at P+8+0x14*i. Inner records step 0x18 bytes, reading bytes +0,+2,+3. No validated capacity or bounds checks exist.

Global writes, with exact widths:

| Address | Width | Effect |
| --- | --- | --- |
| 0x1D99A50 | DWORD | P, before later descriptor reads |
| 0x1D99A60 | DWORD | captured P+8 pointer |
| 0x1D99A40 | DWORD | 0x1D972C0 + 0x9C * captured unsigned byte P+0 |
| 0x1D99A74 | DWORD | captured DWORD P+0xC |
| 0x1D99A5C | WORD | cleared, then accumulated low-16 record-index mask |
| 0x1D99A90 | WORD | cleared, then OR of category bits from qualifying records |
| 0x1D99A6D | BYTE | cleared, then OR 2 for matching +2 flag pattern |
| 0x1D99A84 | BYTE | latest qualifying record's +3 byte shifted right 6; otherwise unchanged |
| 0x1D99A5A | BYTE | freshly reread P+0x10 count |
| 0x1D99A48 | BYTE | first byte at freshly reread DWORD P+8, only if tail count nonzero; otherwise unchanged |
| 0x1D99A56 | BYTE | CL, ordinarily original P+0 byte |

Stores are sequential, not atomic publication. Reset stores are only WORD/BYTE operations even where labels suggest DWORDs. Aliasing with descriptor/list/stack storage can alter later reads. In particular the final pointer is reread from P+8, not taken from the global copy. Counter updates overwrite the argument home DWORD at entry ESP+4; a byte temporary at entry ESP-4 is later reloaded as a DWORD into ECX. Its uninitialized upper bytes do not affect the final CL store, but cannot be claimed initialized.

## Eight exact native proofs

All root instruction citations refer to N:18, with raw bytes N:15 and address-to-block mapping N:19-130. F supplies corroboration, not replacement of native evidence.

1. **Pointer and field latching:** 0x50BF95 loads P; 0x50BF9B writes DWORD 0x1D99A50; 0x50BFA8 captures DWORD [P+8]; 0x50BFAB loads byte [P]; 0x50BFAD writes the previously captured pointer to 0x1D99A60. The intervening byte read must not be reordered past pointer capture. F:24.
2. **Table stride:** 0x50BFB4 AND EAX,0xFF; 0x50BFCB LEA EDX,[EAX+EAX*4]; 0x50BFCE SHL EDX,3; 0x50BFD1 SUB EDX,EAX; 0x50BFD3 LEA EAX,[0x1D972C0+EDX*4]; 0x50BFDD writes that address. Numeric stride is 39*4=0x9C, not 0xD0. Presentation-actor meaning is documentary F:36.
3. **Nested counts/strides:** 0x50BFE2/E4 zero-extend byte [P+0x11], 0x50BFED increments it (1..256), 0x50BFF4 starts EBX=P+0x10. 0x50BFFB/FD zero-extend [EBX]; 0x50C003 loads [EBX-8]; 0x50C04D increments EDX by 0x18; 0x50C05B increments EBX by 0x14. JLE at 0x50BFF0 and 0x50C001 is signed: first is unreachable under these register definitions, second skips only zero among byte-derived counts. F:26-27.
4. **First mask:** 0x50C008 reads record byte +0 into CL; 0x50C00A sets EAX=1; 0x50C00F SHL EAX,CL; 0x50C011 OR BP,AX; 0x50C066 writes WORD 0x1D99A5C. x86 masks shift count to five bits, then only low 16 bits survive. Byte values are not validated slot indices; shifts 16..31 contribute zero and 32 wraps to bit 0. F:28.
5. **Second mask/latest category:** 0x50C014 reads record byte +3; 0x50C017 tests bit 0x08; 0x50C020 SHR AL,6 yields 0..3; 0x50C027 publishes that byte; 0x50C032 shifts DWORD 1 by it; 0x50C034 ORs AX into WORD 0x1D99A90. This accumulates categories only for qualifying records; it does not select a single unique category. F:29.
6. **Flag reduction:** 0x50C03B loads byte +2 into CL; 0x50C03E masks 0x30; 0x50C041 compares 0x30; 0x50C044 JNZ skips the update unless equal; 0x50C046 ORs BYTE 0x1D99A6D with 2. This is an any-record predicate, not an all-record predicate. F:30.
7. **Tail and CL restoration:** 0x50C053 reloads DWORD stack temporary after each nonempty list; 0x50C06E rereads byte [P+0x10]; 0x50C073 always stores it to 0x1D99A5A; 0x50C078 JZ skips first-record publication; 0x50C07A/7D reread pointer then first byte; 0x50C07F stores 0x1D99A48; 0x50C085 stores CL to 0x1D99A56. Empty lists do not overwrite CL. F:18,31.
8. **ABI/return:** 0x50C05E decrements EAX outer counter; ordinary final iteration leaves full EAX=0. 0x50C06E replaces only AL with tail count; conditional 0x50C07D replaces only AL with first-record byte. 0x50C084/8B restore ESI/EBP; 0x50C08C restores ESP; 0x50C08F C3 returns. Conditional EBX/EDI saves are balanced. N:133-136 xref and F:20 show caller 0x50A79E immediately overwrites EAX, so observed return residue is not evidence of a formal return value.

## Return and interpretation limits

Ordinary non-aliasing completion yields EAX equal to zero if tail count is zero, otherwise zero-extended first-record byte. This is a register postcondition, not a justified `uint8_t`, `uint32_t`, or pointer API. There is no final MOVZX and no explicit AX-wide return assignment. If arbitrary aliasing changes the counter state or stack, retain the actual AL-only update and inherited EAX upper bits rather than asserting unconditional zero-extension. The signed outer bypass is represented in the CFG but not reachable from the shown initial byte count.

LIKELY business reading: this prepares shared presentation/sequence context, with an actor-like table pointer, participating-record mask, qualified category mask, and record-condition summary. There is insufficient evidence to name category bits as GF, damage, status, target ownership, or a particular command. Both documentary route-0 claims and conflicting writer attributions in F:37 stay outside target semantics.

Open questions for lead: validated descriptor/group/record layouts and writers; consumers of each global/mask; permitted aliasing and storage extents; maximum table/list capacities; domain meaning of +2 mask 0x30 and +3 bits 0x08/0xC0; whether other callers consume AL/AX/EAX. No additional native input is required for the bounded mechanical account, but these questions block a CERTAIN business name. No promotion or final supervisor validation performed.
