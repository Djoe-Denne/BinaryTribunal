# Gpu_EmitPolyF3 @ 0x460F20

- Confidence: CERTAIN (structure) / LIKELY (precise roles of sub_4610C0/461000/461220) — solo parent: ASM derivation + §5.6 live, no V adversarial (subagent depth limit, limitation noted per function)
- Catalogue name: IDA preserved
- Mode: 1+V solo (spawn impossible)
- Push IDB: yes, [semantic-triple 2026-10-08], no rename, no SetType
- §5.6 parent evidence (live IDB 2026-10-08):
  - Callees present: `sub_4610C0` (460f2d), `sub_461000` (460f38), `sub_461220` (460f43)
  - **Direct xrefs absent** — indirect disp caller: entry in software dispatcher table `0xB7CF08` indices 32/33 (0x20/0x21) and `0xB7D308` indices 34/35 (0x22/0x23) → Gpu_EmitPolyF3 (same family: 36/37+38/39 → Gpu_EmitPolyFT3 ; 44/45+46/47 → Gpu_EmitPolyFT4)
  - FP math confirmed: `fmul dword_B7CC00` + `fadd flt_1CA89E0` (X) / `fmul dword_B7CC04` + `fadd flt_1CA89E4` (Y), per vertex — ×3 (esi/esi+0x20/esi+0x40)
  - `retn` without imm16 → cdecl 1 arg, 3 pushes ebx/esi/edi symmetric
- Notes commit: prim code read at `[pkt+7]` (460f29) — consistent with walker 0x45D080 (dispatch by GP0 code).

## Reconciled analysis

# Semantics Gpu_EmitPolyF3 @ 0x460F20 (1+V solo)

- Role (1 sentence): software/GP0 gateway for the flat triangle (codes 0x20/0x21): retrieves the state record via the code, color/Pkt parse (+4), prepares slot triplets of stride 0x20 of the frame target, then transforms and stores the 3 vertices (×scale B7CC00/B7CC04 + offsets 1CA89E0/1CA89E4) and the replicated color in each +0x10 slot of the 0x20 chute.
- Confidence: CERTAIN (structure) / LIKELY (sub helpers)
- In / Out / Effects: cdecl, 1 arg stack `pkt` (dword, header: header in +0..7, color at +4, 3 vertices at +8..+0x12 as 3×(2×S16 x,y)). No defined return (EAX last result, not consumed by table).
- Behavior:
  1. GP0 code = byte `[pkt+7]` → push via `sub_4610C0` to return the record esi (prob slot d'état par code).
  2. `sub_461000(pkt+4)` → color/dword (global color from packet) — stored ×3 at `[target+0x10/+0x30/+0x50]`.
  3. `esi = [record+74h]` (cible de dessin frame) ; `sub_461220(esi)` — update/pre-map range (rôle à préciser).
  4. Vert transform (FPU) — comments: v1 at `esi+0`/`+4`, v2 at `esi+0x20/0x24`, v3 at `esi+0x40/0x44` (stride 0x20 (32 bytes) per vertex record: 2 floats transform + color at +0x10 other slots of the record).
- Evidence (3-8, ASM addresses live):
  1. `460f27-460f2d mov al,[edi+7]; push; call sub_4610C0` — code GP0 read at `[pkt+7]` (double check with walker 45d080).
  2. `460f32-460f3d` : parse `[pkt+4]` (esi=eax return), 460f3d `[record+74h]` target.
  3. Color replica: `460f65/460f80/460f97` (writes `[esi+0x10/+0x30/+0x50]` = ebx same dword).
  4. 6 vertex stores (esi+{0,4,0x20,0x24,0x40,0x44}) float (`460f76/460f9b/460fb2/460fc9/460fe0/460ff3`) — eight/mix: B7CC00/B7CC04 scale + 1CA89E0/1CA89E4 offsets.
  5. Table entries: 0x460F20 at 32/33 of 0xB7CF08 (opaque pair) and 34/35 at 0xB7D308 (semi pair) — binaire posé — emit for F3 (0x20/0x21 GP0).
- Open questions: precise roles of sub_4610C0 (record per code), sub_461000 (color parse?), sub_461220 (target flush?) — LIKELY pending lots B/C; scale pair B7CC00/B7CC04 semantics (viewport? camera) — v lot C.
