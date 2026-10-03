# battle_driver_lot24 — candidat instrumentation v15 0x5642 (2026-10-03)

Durable technical memory. Full evidence: docs/tech/investigation/battle-static-discovery/driver-passthrough/CAMPAIGN_lot24_2026-10-03.md + lot24/validation_receipt.json.

## Candidate identity
- v15-lot24, build-id **0x5642** (PROVEN free: repo-wide grep 2026-10-03; known builds 0x5638..0x5641). Fork append-only of lot22 v14 sources.
- Candidate sha256 `ba8d2d4e1c4f91d7461b61f67144d5e84319122c22f38de6ffb78085ed42f32c`, **NOT DEPLOYED**. Canonical build dir = lot24/ (DLL hash depends on build dir: embedded PDB path).
- Sources: lot24/gfx_driver_passthrough.{c,h}; readers: tools/af3dn_state/{lot24_contract.py, harness_lot24.c, gate_writer_lot24.py}.

## Codec v15 (vs v14 0x5641)
- ST09 = 40 B (10xu32: magic,build,seq,epoch,kind,type,value,aux,ctx_token,device_token); ctx/dev tokens raw opaque, 0 = not captured.
- Kinds 1..7 unchanged (kind1 RS type 0..25; kind2 slots 30/31/32 aux=RAW native return; kind3 blend 33 raw 0..4; kind4 target 39; kind5 init/uninit; kind6 setups 43/44/45/46/47/55 value=matdesc!=0, aux free, device_token=AC4 gate; kind7 40/41) + kind8 stage0 request / kind9 stage0 result (type=site: **0=unknown**, 1=bind 0x41EF5D, 2=unbind 0x41EF72; kind9 aux=raw HRESULT).
- ND08 footer = 68 B (17xu32: tpage,mode,clut,idc,[ids+pad],dropped,texobj,window,clut_sys,ot_z,epoch,flags,stage0_tex,stage0_dev,stage0_devvt,stage0_hr,st_emitted,st_lost). ND08 max 0x28188 ⊂ DumpNode record guard 0x100C80.
- Flags: bit0(1) HAS_EPOCH; bit1(2) STAGE0_VALID = armed AND >=1 kind9; bit2(4) INCOMPLETE = g_stStreamBroken; bit3(8) ST_LOSS = g_frameStLost>0.
- Loss semantics: ANY StEmit refusal DURING the armed window (frame>4096, cap 1024 ST/frame, ring full) sets broken+drops+lost+bit3 (no silent loss); OFF-window refusals stay silent (v14) — never mark idle as loss.
- Reader semantics: kind8=requested; kind9 aux==0=applied-witness (raw hr preserved), aux!=0=requested_failed; bit1=0 => stage0 unavailable; st_loss_frame sticky; no re-anchor encoded (epoch holes stay incomplete).

## Stage0 hook (option B)
- 2 sites: RVA 0x1EF5D (bind) / 0x1EF72 (unbind), preimage 6 B `FF 90 98 00 00 00`, patch = `E8 rel32` + `0x90`. Rel32 = stubVA-(site+5).
- `Passthrough_Stage0Stub` (naked, EXPORTED): pushad→kind8 logger→popad→push eax(devVT save)→3 pushes `[esp+16]` each (texture,stage,device replicated)→`call [eax+98h]`→`mov edx,[esp]`+`add esp,4`→pushad→kind9 logger (cache writer)→popad→**`ret 12` UNIQUE** — the stub REPLACES the stdcall callee; both harness-direct and real-site entries share this epilogue (a ret16 ate one slot too many = the s0b AV root cause; breakdown in CAMPAIGN_lot24 §4). EAX=HRESULT propagated.
- `Passthrough_InstallStage0Hooks` (EXPORTED, fail-closed): memcmp preimage per site, VirtualProtect RWX, write E8+90 (bounds |rel32|<0x7FFF0000), FlushInstructionCache, restore protection, save preimages (g_stage0_saved[2][6]) + ret VAs (g_stage0_ret[2]=site+5); ARMED iff BOTH ok, else partial restore + g_stage0Broken (bit1=0, dumping continues degraded). `Passthrough_RestoreStage0Hooks` (EXPORTED) = byte-exact restore, disarms.
- **DllMain NOT wired** — explicit installation only (harness / future live card). Accepted gap: device==0 early-return path (0x41EF78) not covered (no call, no HRESULT by construction).
- Export total = 17 (new_dll_graphics_driver + 7 Passthrough code + 9 dotemu_orig.* forwards).

## Proof state (offline build-only, 2026-10-03)
- Harness native: 648 assertions, 0 fail (stub functional: fake vtable [+0x98] hr 0x1234, arg echo, canaries EBX/ESI/EDI/EBP, esp balanced, kind8/kind9, footer bit1+triple; restore byte-exact bit1=0; fail-closed clean; cap/ring loss detected flags 1|4|8).
- Reader lot24_contract: 31/31 (requested/applied-witness, sticky, v14 regression via lot23_contract, cross-rejections both directions).
- Gate dedicated: PIN mode → PINNED (lot24/candidate_pin.json) then STRICT → BUILD_ONLY_BYTES_VERIFIED_NOT_DEPLOYED (lot24/gate_strict.json); 22 pure tests.
- Sweep 235 tests OK with env fixtures.

## Debugging lessons (durable)
- MSVC: `__declspec(naked)` on DEFINITION only (C2488 on declaration in .h).
- MSVC inline asm: C globals referenced in asm must be DECLARED BEFORE the asm block (C2094).
- stub_va via GetProcAddress; /MAP builds in Temp for symbol RVAs (verify .text/.data identical section-wise before applying map RVAs to the canonical DLL).
- Map globals: preferred VA 0x140572C4 => RVA 0x40572C4 (BSS far, beyond the 64MB ring; subtract 0x10000000 not 0x14000000).
- Never fix the writer to satisfy a wrong harness expectation; fix the harness.

## Verdicts / gates
Contract offline structural verified; state->draw coupling BLOCKED (certain unknowns: effective state at T_draw, real COM HRESULT, context association); install/runtime safety NOT closed; UI fidelity PARTIAL/BLOCKED; **live NOT AUTHORIZED** (entry gate = LIVE_NECESSITY_lot23.md). 0x5643 NOT reserved.
