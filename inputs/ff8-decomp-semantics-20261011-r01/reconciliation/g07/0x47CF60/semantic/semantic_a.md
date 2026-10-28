# 0x47CF60 — independent semantic A

## Scope and evidence

- Role: semantic A only, run01/g07; no C reconstruction, peer output, classifier, IDB, live action or promotion.
- Read all 209 assembly lines (`asm-001.txt` through `asm-009.txt`), both complete byte slices covering `[0x47CF60,0x47D285)`, all CFG/xref metadata, manifest and common compaction. Paths below are relative to `inputs/ff8-decomp-semantics-20261011-r01/g07/0x47CF60.readable/` unless stated otherwise.
- Manifest records original packet SHA256 `a502d16b154e08a955a468279c04dda5c926c4260a8b231a45a2bc2d45289fb2` and common-compaction SHA256 `6925ce258d423a1b3b9e352cad9925a19202940e72df0121a3ac4681ed4f1fff`. These are supplied hashes, not independently recomputed here. Projection declares complete verbatim ASM/bytes.
- Historical native comments and semantic labels are not independent evidence. Frozen neighboring-document facts are used only with the qualification given in `../common-compaction.md`.

## Proposed role and name

**Proposed name: `BattleModule_RunFrame`. Overall confidence: LIKELY.**

The function orchestrates a battle-module frame: graphics setup/admission, pause and scheduling gates, repeated UI-related service pulses, a conditional battle director call, possible next-module selection, conditional render submission, and a shared pacing/support tail. It is not just the battle director or a single HUD/render operation. “Battle/module/frame” is an interpretation supported by the frozen scheduling context and the multiple distinct native sequences below, not by the old name.

Two independent naming supports are (1) pause-gated call to `0x47CCB0`, bracketed by three pre-call service pairs and one post-call pair with draw-environment selection, and (2) exit-gated construction of one of two three-callback tuples and dispatch through `0x409A57`, within graphics begin/leave and submission scaffolding. The former supports battle-frame progression; the latter supports ownership at module/frame level. Exact imported/helper purposes remain partially contextual rather than proven from this target alone.

Mechanical control flow, widths and direct writes: **CERTAIN** within the supplied frozen bytes. Full helper contracts, exact timer/audio interpretation and C return type: **UNCERTAIN**. Raw target discrepancies with label suffixes are documented below, not silently normalized.

## Inputs, outputs and ABI

- A stack argument at original entry `ESP+4` is loaded into ESI at `0x47CF65` (`8B 74 24 28`, after 0x1C locals and two saved registers). It is treated as a context pointer. Direct accesses are DWORD `[context+0xBA8]` reads and DWORD `[context+0xB88]` writes. No null check or local bounds guard exists. Other unseen caller arguments are not excluded by this observation.
- EBX and ESI are saved/restored; EBX is zeroed, BL supplies byte zero. Both exits use plain `RET`; caller owns argument cleanup. All explicit pushed arguments are caller-cleaned, sometimes in batches (notably `ADD ESP,0x18` at `0x47CFBE` and `0x47D039`). Callsite shapes do not prove helper prototypes.
- A 0x1C-byte local region is reused. Initially its DWORD fields at +0/+4/+8 are zero and +0xC is `0x3F800000`; its pointer and context are passed to `0x41E168`. Later the same region receives callback values at +8/+0xC/+0x10 and zeros at +0x14/+0x18, and is passed to `0x409A57`. Prefix fields are not reinitialized there, and the first helper may modify the region. Do not replace this with an invented zeroed independent descriptor.
- There is **no demonstrated Boolean/integer return contract**. Normal and begin-failure paths leave EAX from the final call to raw target `0x46BD10`; the early window-predicate path leaves EAX from `0x41E99D`. Neither is tested or standardized before return. EAX/AL/AX are not interchangeable return types.
- Indirect effects through all helpers include context/global mutation and rendering/UI/domain activity, but their complete read/write sets are not exported. This routine performs no explicit allocation, slot loop or inventory/status update itself.

## Mechanical execution and effects

1. If DWORD `context+0xBA8` equals zero, call `0x45B4C0` with pushed values corresponding to `(0,0,0x280,0x1E0)`. Initialize/pass the local region; call `0x41DFBA` with three literal ones and context. Re-read `context+0xBA8`; if zero, call `0x45B4C0` again with four DWORD globals: `0x1A7764C`, `0x1A77648`, `0x1A77654`, `0x1A77650` in first-to-fourth argument order. Equality to zero is not proof of a missing driver object.
2. Call `0x41E972` with `(0,context)`. Test full EAX: zero skips directly to the tail at `0x47D243`, without scene leave, pause processing, director, callback switching, or submission. Nonzero runs the main body.
3. Main-body preparation calls `0x416B9A` with DWORD `0x1D2A284`, `0x424BF9` with DWORD `0x1D2A288`, then `0x49B120`, `0x499A40`, and four context-argument calls `0x43FBE8`, `0x409B42`, `0x409B08`, `0x409B25`, followed by `0x56BA40`.
4. Read BYTE `0x1D28DEA`. If nonzero and full EAX from `0x4A71D0` is nonzero, set DWORD `0x1CFF834=1` and DWORD `0x1CFF844=0`, then DWORD `context+0xB88=1` and call `0x45B580`. This path does **not** immediately set BYTE `0x1D28DE9`.
5. Otherwise clear BYTE `0x1D28DE9`; if DWORD `0x1CFF834` was nonzero call `0x5003A0`; read DWORD `0x1CFF844`, clear DWORD `0x1CFF834`, and select the context flag/helper by the read value: zero selects `context+0xB88=1`/`0x45B580`, nonzero selects `context+0xB88=0`/`0x45B590`. The read occurs after `0x5003A0`, so it must not be hoisted across that call.
6. Call `0x4701B0` four times. If WORD `0x1CDBFE0==3`, call `0x4A76E0(0)` and three consecutive pairs `0x4A8E30`/`0x4A84E0`. Then call `0x45B2E0`; nonzero full EAX causes `0x41E99D(context)` and an immediate epilogue/return, bypassing the entire ordinary tail.
7. If BYTE `0x1D28DE9==0`, call `0x47CCB0`. Independently re-read WORD `0x1CDBFE0`; if equal to 3, zero-extend BYTE `0x1D96A80`, derive address `0x1D969C8 + 92*index`, call `0x4A76E0` with that address, then `0x4A8E30`, `0x4A84E0`, `0x4A78E0`. Thus this post-director service sequence can run with director skipped.
8. If DWORD `0x1CFF830` is nonzero, re-read WORD `0x1CDBFE0`: value 4 selects callback values `0x4A2280/0x4A22A0/0x4A2690`; otherwise select `0x470690/0x4706A0/0x4706B0`. Write the local fields described above and call `0x409A57(local,context)`. This does not terminate the current function; rendering/tail work follows. Literal callback tuples are proven; lifecycle roles are contextual.
9. Re-read BYTE `0x1D28DE9`. If zero, read DWORD `0x1CFF6F4`; if nonzero call `0x56D1D0` with the four coordinate/extent globals, raw bits `0x3AC49BA6`, and a full DWORD 0/1 obtained from equality of the original latch to 2. Clear `0x1CFF6F4` after that call, then call `0x56BA80` (also called when the latch was already zero). If pause byte is nonzero, instead call `0x45D610(0xFFFFFFFF)` and do not clear that latch here.
10. If DWORD `0x1CFF834!=0`, set BYTE `0x1D28DE9=1`; there is no complementary clear at this location. If DWORD `0x1CFF844==0`, call `0x4980C0`, `0x465930`, `0x41E947(1,context)`, then `0x499EA0`. In all cases then call `0x45B450` and `0x41E99D(context)`.
11. Shared tail at `0x47D243`: call `0x56D9C0`. Read DWORD `0xB6D970`; if nonzero and DWORD `0x1CFF834==0`, call `0x4020F0` and store its complete EAX into DWORD `0x1CFF844`; otherwise store zero there. Load a memory double into ST(0), call `0x55AD90`, push EAX to `0x46BD10`, discard that argument, restore saved registers/local space and return.

The distinct final helpers in steps 7 and 10 are byte-derived: `0x47D14B` (`E8 90 A7 02 00`) resolves to `0x4A78E0`, whereas `0x47D230` (`E8 6B CC 01 00`) resolves to `0x499EA0`.

## Widths, signedness, strides and floating point

- Pause capability/current latch and ping-pong index are BYTE accesses; requested pause, scheduling flag, exit latch, overlay latch, movie gate and the two context fields are DWORD accesses. Animation-state comparisons use WORD encoding `66 83 3D ... 03/04`. No DWORD widening of those WORD predicates is justified.
- Branches use equality/zero (`JZ/JNZ`), not signed greater/less comparisons. Arbitrary nonzero DWORD values are accepted by the corresponding gates; only the SETZ-derived overlay argument is normalized to 0/1.
- `XOR EAX,EAX; MOV AL,[index]` proves unsigned zero-extension before the `LEA/SHL/SUB/LEA` calculation: 23*index*4 = 92*index. No `index<=1` guard exists. This is a draw-environment stride, not a battle-slot stride; no 0xD0 slot iteration occurs in this target. Intermediate x86 arithmetic is 32-bit wrapping; the byte domain gives a bounded offset here.
- Other `MOV AL` gate reads replace only AL; upper EAX bits remain unspecified, but the following `CMP AL,BL` inspects only the byte. `XOR ECX,ECX; SETZ CL` yields a defined full DWORD 0/1.
- The final instruction is an x87 **64-bit memory load** (`DD 05 E0 8B A7 01`) from **VA `0x1A78BE0`**. The ASM label's suffix `...1A788B8` does not match that encoded address. The target does not explicitly change x87 control/rounding mode. Full `0x55AD90` conversion behavior, exceptional-input handling, ST stack effect and any EDX high result are unavailable; only EAX is forwarded to the final helper. Do not invent a C cast/rounding rule or call it a proven volume conversion from the label alone.

## Eight instruction/xref evidence anchors

1. `asm-001.txt:2-25`, `asm-002.txt:1-21`; VAs `0x47CF63–0x47CFFA`: stack context input, render-like parameter setup and full-EAX admission gate. `bytes-001.txt:1-5` corroborates argument load, widths and calls.
2. `asm-003.txt:15-24`, `asm-005.txt:1-11`; VAs `0x47D041–0x47D105`: distinct BYTE current latch/DWORD requested latch, context flag and scheduling gates, not one interchangeable pause Boolean. `bytes-001.txt:8-14` supplies addresses.
3. `asm-003.txt:25`, `asm-004.txt:1-24`; VAs `0x47D076–0x47D0D2`: four service ticks, WORD-state-3 pre-service triplet, nonzero-EAX early return. Early return proves not all invocations execute the common tail.
4. `asm-005.txt:12-25`, `asm-006.txt:1-4`; VAs `0x47D10A–0x47D14B`: byte-pause-gated `0x47CCB0`, then independently gated draw-environment calculation and post-service pulse. `bytes-001.txt:14-16` establishes unsigned byte input/92-byte stride and final raw target `0x4A78E0`.
5. `asm-006.txt:5-22`, `bytes-001.txt:16-19`; VAs `0x47D150–0x47D1A7`: exit gate, WORD-state-4 selection of two callback tuples and shared module-switch call. Independent support for module/frame ownership rather than director-only purpose.
6. `asm-006.txt:23-25`, `asm-007.txt:1-25`, `asm-008.txt:1-15`; VAs `0x47D1AA–0x47D240`: pause-dependent overlay/OT paths, delayed pause-byte write, scheduling-dependent submission and scene leave. `bytes-002.txt:1-4` resolves raw calls without semantic labels.
7. `asm-008.txt:16-25`, `asm-009.txt:1-9`, `bytes-002.txt:4-6`; VAs `0x47D243–0x47D284`: pacing-result DWORD store, actual x87 address `0x1A78BE0`, conversion-target `0x55AD90`, final target `0x46BD10`, and no return normalization. The latter target conflicts with ASM label suffix `46BB10` as already noted in common compaction line 35.
8. `metadata.json:315-327`: references from `0x4709EC` in `0x4706B0` and `0x5598DD` in `0x559890` have type 1 and `iscode:false`. These are references, **not proven direct CALL callers**. This supports callback use only weakly; native callback-tuple construction above is stronger. `../common-compaction.md:33-36` supplies prior rendering-scheduling context with bounded provenance, not a substitute for these bytes.

## Contextual interpretation versus hypotheses

- LIKELY: the common-compaction scheduling facts distinguish the pre-director zero HUD draw target from the post-director 92-stride DRAWENV target. This agrees with the two different arguments to `0x4A76E0`, repeated service-call pattern and native gate structure.
- LIKELY: the `context+0xB88` branch controls whether a host/render pass is enabled; its exact meaning relies on previously recorded helper evidence, not this write alone.
- LIKELY: `0x1CFF844` is a pacing/catch-up scheduling value, and `0x1CFF834`/BYTE `0x1D28DE9` implement requested-versus-current pause state. The native shows the delay precisely: the director uses the pre-tail current byte; the positive requested state is copied only later. “Next frame” is a scheduling interpretation, not a local explicit frame counter.
- UNCERTAIN: true meanings of `0xB6D970`, overlay states other than 2, availability policy of the graphics admission helper, and full semantics of the last two helpers. No name/comment alone establishes them.
- No evidence conflict in the raw control flow was found. Two label/address mismatches affect source presentation: conversion-input label suffix versus actual memory address, and final-helper label suffix versus actual E8 destination. Use bytes for both.

## Open questions and limits

1. Obtain frozen helper evidence for `0x41E972`, `0x41E99D`, `0x4020F0`, `0x55AD90`, `0x46BD10` to establish admission polarity semantics, return types and floating-point/environment behavior. This is not authorization to read them independently.
2. What is the full context layout, and can `0x41E168` mutate any descriptor prefix later reused by `0x409A57`? Stack lifetime/retention rules for that pointer need helper evidence.
3. What enforces the ping-pong byte's expected domain? No local bound prevents use of 2..255.
4. Which globals can each helper modify before later reloads? Pause/state/index/exit checks occur at several points and cannot be consolidated without alias evidence.
5. Callback registration sites are non-code references in this packet; their installation/dispatch contract is not fully exported. Likewise no direct hardware present/SwapBuffers operation is proven here; common compaction distinguishes leave-scene from global present elsewhere.
6. Need authoritative global mapping for actual double address `0x1A78BE0`; do not propagate the misleading label suffix as an address.

All native instructions/CFG paths were inspected, including begin-failure, inactive early return, paused/unpaused, animation-state 3/4, module-switch and scheduling branches. No compilation, test, differential execution, live validation, hash computation or final §5.6 was performed. Only the lead may integrate/promote.
