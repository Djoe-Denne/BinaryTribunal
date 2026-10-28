# 0x485EC0 — independent semantic A

## Boundary and coverage

Analyzed the complete original packet `inputs/ff8-decomp-semantics-20261011-r01/g07/0x485EC0.json` (P), readable manifest, all 23 assembly lines (A = `0x485EC0.readable/asm-001.txt` in the same input directory), both byte lines, all metadata, and `common-compaction.md` (K). One chunk `[0x485EC0,0x485EFB)`, 59 bytes, all five CFG blocks covered. Original packet is authoritative. Manifest records packet SHA256 `50a28e8cec513ad24cf73574d698fa89d1877ea254fe333b0b6d761db3c711af` and compaction SHA256 `6925ce258d423a1b3b9e352cad9925a19202940e72df0121a3ac4681ed4f1fff`; these are supplied provenance, not an independently computed hash. No other author, classifier, C, review, or verdict consulted. No compilation, execution, or differential test performed.

## Role, proposed name, confidence

**Mechanical name:** `BattleSlot_ProcessAndClearTwoStoredIds` — **CERTAIN** about processing two byte entries and clearing each nonzero entry after calling 0x486B40; **LIKELY** about their interpretation as stored item IDs associated with a battle slot.

**Business interpretation:** likely returns/refunds two stashed battle items to an item-count buffer, then consumes the stash. `BattleItem_RefundStashedItems` is a plausible business name, **LIKELY**, not independently CERTAIN: this input does not include the callee's instructions, so `(id, 0)` cannot alone establish add/refund semantics. Old names and embedded comments were not used as name proofs.

Independent support for the mechanical name: (1) address arithmetic selects slot-stride 0xD0 and offsets +0xB8/+0xB9; (2) each nonzero entry is forwarded as a zero-extended byte to one helper and explicitly cleared afterward, with a two-iteration bound. Independent contextual support for a cleanup role is the call from 0x486903 within the frozen end-cleanup context summarized in K:57, rather than its label alone.

## Input / output / effects

- Input: one DWORD at entry `[esp+4]`. Mechanically an unvalidated 32-bit index; battle-slot interpretation comes from the numeric layout corroborated in K:29–30. No signed/unsigned range validation occurs. Address = `0x01D27BC8 + (index * 0xD0 modulo 2^32)` modulo 2^32. No invented valid-slot guard.
- Reads bytes at that address +0 and +1, in that order. A zero byte skips the call and explicit store. A nonzero byte invokes 0x486B40 with first stack argument the zero-extended byte ID and second argument literal zero, then writes zero to the same byte after the call returns. Zero entries are not redundantly stored; helper effects can change memory before the next read. IDs are not prefetched or deduplicated.
- Direct memory effects: up to two BYTE zero stores, at slot +0xB8/+0xB9. Indirect effects of 0x486B40 are not proven by this function's native body. K:31 describes a 32-row, stride-5 item buffer and K:62 notes contradictory historical descriptions; neither supplies a full native callee contract here.
- ABI: stack-argument, caller-cleanup behavior consistent with cdecl: two DWORD helper arguments pushed right-to-left; caller adds 8 to ESP. Own return is plain `RET`, not `RET 4`; ESI/EDI saved/restored, EBX/EBP untouched directly. ECX/EDX/EAX and flags are not preserved. Correct loop behavior across calls relies on ordinary preservation of ESI/EDI by the helper.
- Return: no explicit return-value construction or status normalization. Treat API return meaning as **UNCERTAIN**, plausibly void. `MOV AL` changes only bits 0–7 of EAX; AX is not separately initialized. On a nonzero branch, `AND EAX,0xFF` produces a full zero-extended ID before the call, whose EAX result is thereafter incidental. If the second byte is zero, exit AL is zero and high 24 bits retain the prior EAX state (entry index or previous helper result). If the second byte is nonzero, exit EAX is the second helper's incidental result. No Boolean/item-count return follows from the bytes.
- No direct x87, SIMD, or floating-point instruction/environment change. Helper environment effects are unknown.

## Exact evidence (six independent instruction/xref groups)

1. **Argument and stride:** A:1,5–8 / P:15,18: `485EC0 MOV EAX,[ESP+4]` (`8B442404`); `485EC8 LEA ECX,[EAX+EAX*2]`; `485ECB LEA EDX,[EAX+ECX*4]`; `485ECE SHL EDX,4`. This is 13*16 = 208 = 0xD0, with 32-bit wrap, not stride 0x1D0. `485ED1` bytes `8DBAC87BD201` select absolute base 0x01D27BC8. K:29–30 gives slot base 0x01D27B10, hence +0xB8.
2. **Byte selection/zero filtering:** A:3,9–11: `485EC5 XOR ESI,ESI`; `485ED7 MOV AL,[EDI+ESI]`; `485EDA TEST AL,AL`; `485EDC JZ 485EF2`. Entry contents are eight-bit identifiers/sentinels; no signed-byte extension or negative-ID check occurs.
3. **Helper contract visible at this call:** A:12–16 / P:15,82–84: `485EDE AND EAX,0FFh`; `485EE3 PUSH 0`; `485EE5 PUSH EAX`; `485EE6 E8 550C0000` decodes to 0x486B40; `485EEB ADD ESP,8`. This proves `(uint8-value zero-extended to DWORD, 0)`, not the semantic polarity of zero.
4. **Destructive consumption:** A:17: `485EEE MOV BYTE PTR [EDI+ESI],0`, after the helper, only on the nonzero path. This independently supports “clear stored IDs” rather than just enumerate/query.
5. **Two-element loop / signedness / ABI:** A:18–23: `485EF2 INC ESI`; `485EF3 CMP ESI,2`; `485EF6 JL 485ED7` is signed JL, but actual ESI states 0,1,2 avoid sign ambiguity. `485EF8 POP EDI`; `485EF9 POP ESI`; `485EFA RET`. Combined with A:2–4, it preserves ESI/EDI and establishes exactly two iterations under the helper ABI, without asserting a meaningful EAX return.
6. **Independent callers:** P:56–80 records code xrefs at 0x485835 (owner 0x485610), 0x486903 (0x4868C0), 0x486CB7 (0x486C70), 0x493A84 (0x493840). K:57 places 0x486903 within a three-slot loop with 0xD0 slot stride and subsequent WORD character synchronization; K:50 places 0x493A84 in a status-update path. This supports reuse in cleanup/synchronization, not a purpose deduced from the target label.

## Disagreements and open questions

- K:62 reports CAT:36 “queue-clear,” CAT:324 helper “magic-deduction,” and draft item-buffer prose. Historical labels/comments conflict and are not fresh validation. The concrete behavior is forwarding two byte IDs with zero mode and clearing them; item refund remains a context-supported interpretation.
- Need frozen 0x486B40 body and, if necessary, its callers to prove the zero-mode polarity, count caps, missing-ID handling, and precise indirect writes. Do not assert cap 100 or save-inventory persistence solely from the target's comments.
- What valid slot indices do callers enforce? No bounds are present here; invalid inputs can address unrelated memory through modulo arithmetic.
- Is any caller consuming incidental AL/AX/EAX? The provided xref list does not include surrounding return-use instructions; no return meaning is promoted.
- Adjacent-field labels (+0xB9 especially) are explicitly hypotheses in K:30,62. Byte accesses and offsets are certain; their business ownership is not.

No promotion, §5.6 validation, IDB/Git/ledger/registry/live action performed.
