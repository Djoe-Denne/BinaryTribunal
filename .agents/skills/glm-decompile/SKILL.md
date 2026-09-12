---
name: glm-decompile
description: Decompile x86 assembly to clean C via the glm-decompile MCP (LiteLLM gateway, glm53-flash). Use when the user asks to decompile a function with GLM, the gateway, or glm-decompile, or wants a second C reconstruction beyond Hex-Rays or Nova.
---

# GLM Decompile

Benchmark-validated workflow (2026-09-11, `EnemyAI_TargetHasStatus` 85 instr + `EnemyAI_VM_ExecuteScript` 653-line chunk, ground truth = IDA/Hex-Rays + project wiki).

## Settings

- **Model: `glm53-flash` first.** Fallback `glm53`.
- **`reasoning_effort`: `high` by default** (best fidelity: ~38 s / ~5k tokens on 85 lines).
  Switch to `low` above ~200 asm lines — `high` burns the whole budget thinking (32k tokens, 0 emitted on 653 lines); `low` emits in ~55 s but looser. The MCP `auto` default encodes exactly this split.
- `temperature`: 0. `max_tokens`: auto (8000 small / 32000 big).
- If `finish_reason=length` with empty output: raise the budget or drop effort one notch, retry once.

## Input: maximum context

The MCP pins the system prompt and output contract (single ```c fence). Pack `context_hints` with everything below, in this order:

1. **ASM**: Intel syntax + IDA labels (`def_`, `loc_`, `jpt_`). Labels help; raw hex targets cause hallucinations. Never AT&T.
2. **IDA prototype** (`export_funcs`, `prototypes`): exact signature + calling convention.
3. **Stack frame** (`stack_frame`): local names to keep.
4. **Callees + their prototypes**, and what each returns / cleans (`add esp` values).
5. **Callers/xrefs** + the 2-3 globals/structs the code touches (names, strides, field offsets if known).
6. **Wiki semantics** (`qmd search ff8-wiki`): what the function means in-game.
7. Keep **Hex-Rays output as verify-against**, not as input.

## Chunking

- One function ≤ ~600 lines: send whole.
- Above: split by region (prologue / dispatch / handler groups), note `TRUNCATED` + address range in hints, one call per chunk.

## Verification checklist (mandatory — every item failed at least once in benchmark)

- [ ] **Switch cases**: if dispatch is a jump table whose contents were NOT provided, case numbers are unknowable — any numbering is invented until cross-checked.
- [ ] **Completeness**: every visible handler/block rendered; silent drops disqualify.
- [ ] **Cursor advance**: count `inc`/reads per opcode; off-by-one desyncs the stream.
- [ ] **Call arg order**: pushes are reverse args under `__cdecl`; check against `add esp` cleanup.
- [ ] **`setcc` polarity** (`setz`→`==0`, `setnz`→`!=0`) and **unsigned vs signed** (`ja/jb` vs `jg/jl`, casts on bound compares).
- [ ] **Return values used**: `AX` after `call` (lookup results, display handles) must flow somewhere.
- [ ] **Stride math**: expand `lea/shl` chains numerically (`slot*0xD0`, `(slot-3)*71`, `hit*20`); reject quadratic-looking forms.
- [ ] **Shared tails**: `jmp` into another handler's tail must render as `goto`/label or faithful duplication, never dropped.
- [ ] **Compilability**: no undeclared idents, no segment prefixes (`ss:`), no phantom args that were never pushed, stores at the right width (DWORD vs byte).

## IDA push rule

Never push LLM output raw. Diff-push only: verify each note against live disassembly, translate to real opcodes/symbols, comments only, never overwrite existing annotations, skip anything ambiguous (calling-convention guesses, struct layouts).

## Example call

```python
glm_health()  # -> {ok, models, latency_ms}
glm_decompile_asm(
    asm="<Intel + IDA labels>",
    model="glm53-flash",
    reasoning_effort="auto",   # high <200 lines, else low
    max_tokens=0,              # 0 = auto (8000/32000)
    temperature=0.0,
    context_hints="Prototype: ... Callees: ... Globals: ... Semantics: ..."
)
# -> {c_code, fence_found, finish_reason, reasoning_tokens, usage, ...}
```
