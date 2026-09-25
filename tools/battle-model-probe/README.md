# battle-model-probe

Minimal Python (stdlib + Pillow) probe parser for the FF8 PC battle monster
`c0mNNN.dat` format, extracted from the `battle.fi/fl/fs` archive with a
self-contained LZS decoder, byte-exactness-verified against the repo's
hash-anchored registry.

## What is here

| file | role |
|---|---|
| `extract_lzs.py` | FI/FL/FS reader + PSX LZS decompressor + sha256 anchor validator (registry cross-check) |
| `parse_c0m.py` | payload parser: sections 1/2/3/11; exports `*_structure.json`, textured `.glb`, TIM `*.png` |
| `render_check.py` | PIL-only isometric wireframe renders (bind pose + anim frames 0/mid/last) |
| `out/` | extracted payloads (`.dat`), structure JSON, GLB, TIM PNGs, render PNGs |

## Format summary

1. `battle.fl` = one DOS path per line (CRLF, 853 lines); line i = archive entry i
   (no NULs in practice; NUL-splitting yields a single segment).
2. `battle.fi` = 853 x 12 bytes = {u32 uncompressed_size, u32 offset, u32 flag};
   flag 1 = LZS-compressed (779), flag 0 = stored raw (74).
3. `battle.fs` = per entry: flag=1 -> `[u32 stream_len][LZS stream]`
   (stream_len == next_entry_offset - offset - 4, verified on all compressed
   entries); flag=0 -> raw bytes at `[offset, offset+size)`.
   FI's size field = UNCOMPRESSED payload size (verified byte-exact on c0m000
   and c0m090 via sha256).
4. LZS: control byte, bits LSB-first; bit=1 -> literal (1 byte); bit=0 ->
   backref: position = b0 | ((b1 & 0xF0) << 4), length = (b1 & 0x0F) + 3
   (3..18); ring window 4096 bytes, initial write cursor 4096-18, window
   zero-filled (NOT the classic Okumura space-filled window).
5. Payload container: u32 section_count, u32 offsets[count+1]; section i
   (1-based) = payload[offsets[i-1]:offsets[i]].
6. s1 skeleton: 16-byte header (u8 nb_bones @+0, u8 extra_data flag @+1,
   u16 unknowns @+2/+4/+6, s16 scale XYZ @+8/+10/+12, u16 unknown @+14), then
   nb_bones x 48 bytes: u16 parent (0xFFFF = root), s16 size (/2048),
   s16 rotX/rotY/rotZ (4096 units per turn), 38 unknown bytes (preserved).
7. s2 mesh: u32 nbObjects, u32 objectOffsets[nbObjects], objects..., u32 end.
   Object: u16 nbBlocks; blocks {u16 boneId, u16 nbVertices, nbVertices * 6B
   (s16 x, z, y - DISK ORDER X,Z,Y)}; ONE alignment pad to 4 bytes; u16
   nbTri, nbQuad, nbColTri, nbColQuad; u32 unused; faces: Tri 16B
   {u16 a (top nibble = depth_bias + 8), u16 b, u16 c, u8 uC vC, u8 uA vA,
   u16 clut, u8 uB vB, u16 tpage}, Quad 20B (a..d + uv pairs, same layout),
   ColTri 20B (tri + u32 GPU color), ColQuad 24B (quad + u32 color).
   Faces with tpage & 0xFE00 are engine-hidden (skipped by the renderer).
8. s3 animations: u32 nbAnim, u32 offsets[nbAnim]; per anim u8 nbFrames then
   a CONTINUOUS LSB-first bitstream (no per-frame byte alignment): per frame
   3x position channels (2-bit type -> size {3,6,9,16} bits, signed, deltas
   accumulated), 1 mode bit, per bone 3x rotation channels (1-bit present;
   if set 2-bit type -> size {3,6,8,12} bits, signed delta added to the
   previous frame's raw; if clear reuse previous raw), and if mode == 1 per
   bone 3x scale channels (1-bit flag; if set 16-bit payload,
   raw = payload + 1024, scale = raw / 1024, absolute).
9. s11 textures: u32 nbTIM, u32 offsets[nbTIM], u32 endOffset; complete PSX
   TIMs (4bpp/8bpp + CLUT, 16bpp supported) -> PNG (Pillow), black keyed
   transparent (engine rule: CLUT word 0x0000 = transparent).
10. Vertex viewer mapping (HobbitDur validated): disk (a,b,c) ->
    (-a, b, -c)/2048, then bone matrix M*(x,-y,-z) + translation, then the
    frame root position; bind pose = animation 0 frame 0.

## Anchor mapping (FI index <-> c0m name)

The "FI 166..309 = c0m000..143" claim is FALSE for the FS archive: FI 166 is
`a0stg095.x`. The verified mapping (every one of the 200 payloads sha256-
matched against the registry):

| c0m name | FI index |
|---|---|
| c0m000..c0m014 | 234..248 |
| c0m015 | 4 (early in the FL list) |
| c0m016..c0m050 | 249..283 |
| c0m051 | 5 |
| c0m052..c0m094 | 284..326 |
| c0m095, c0m096 | 6, 7 |
| c0m097..c0m143 | 327..373 |
| c0m144..c0m199 (filler, identical 63412B payloads) | 374..429 |

Border check requested by the orchestrator (FI 166..169 / 246..249):

| FI index | FL leaf |
|---|---|
| 166..169 | a0stg095.x, a0stg096.x, a0stg097.x, a0stg098.x |
| 246..249 | c0m012.dat, c0m013.dat, c0m014.dat, c0m016.dat |

`BattleFilesArray[166..309]` is the EXE's pointer-table wiring (proof note in
the registry), not an FI index.

Anchor results (byte-exact contract):
- c0m000.dat: FI 234, payload 24632 B, sha256 MATCH, 11/11 sections byte-exact.
- c0m090.dat: FI 322, payload 259904 B, sha256 MATCH, 11/11 sections byte-exact.
- --all run: 200/200 payloads sha MATCH (c0m127 = 2-section overlay 2/2).

## Registry anchors

Ground truth: `docs/tech/investigation/battle-static-discovery/c0m-registry.json`
(archive.sha256 for battle.fi/fl/fs; entries[].sha256/size; per-section
sha256/offset/size).  `extract_lzs.py` verifies archive hashes and payload/
section hashes against it; `parse_c0m.py` re-verifies section hashes.

## Assumptions & flagged doubts (not silently assumed)

- UV normalization: `(u & 0xFF) / 128` (HobbitDur's calibrated viewer rule,
  matching their GL viewer and validated textures).  The mission brief's
  `/256` reading is recorded here as a disputed alternative; with the 128-px
  texture pages of vanilla monsters the /128 rule matches the reference
  viewer, the /256 rule would sample only the upper-left quadrant of the
  128x128 TIM images.
- Vertex coordinate convention: disk triple (x, z, y) as three s16;
  viewer mapping `(-x, z, -y)`, bone chain `M * (x, -y, -z) + translation`
  exactly as HobbitDur's IfritManager._transform_vertex (calibrated against
  the game by their team; c0m000/c0m090 renders look anatomically coherent).
- s1 header: the mission spec's "+2 s16 model_scale" does not match the
  observed bytes; HobbitDur parses +8/+10/+12 as signed model-scale XYZ
  (÷2048) and treats +2..+7/+14 as unknowns.  We parse HobbitDur's layout and
  keep the raw header fields in the JSON; the bone tail (+10..+47) is
  non-zero for some monsters and is preserved verbatim, not zero-filled.
- s2 trailing u32: for multi-object meshes it can be SMALLER than the walked
  vertex sum (c0m090: 1376 vs 1490) - it equals the FIRST object's vertex
  count.  We record both values and keep global indices across objects (same
  as the reference exporter); not "optimized".
- Face tex-id -> material: rank of the sorted unique raw tex words -> TIM
  index (HobbitDur's viewer rule).  The full 16-bit CLUT word matters
  (c0m121's palettes at VRAM rows 224/228 share the low byte), so no low-byte
  aliasing is done.
- c0m127.dat is the 2-section overlay (info_stat + AI only, no mesh): the
  parser reports "no mesh" and writes structure-only JSON.

## Credits

- **HobbitDur / FF8UltimateEditor** (`FF8GameData/monsterdata.py`,
  `FF8GameData/fs/lzs.py`, `Ifrit/Ifrit3D/gltfexporter.py`,
  `FF8GameData/gltf/glbbuilder.py`) - GPL-3.0.  PRIMARY source of the format
  spec: LZS decode ported byte-exact; skeleton/mesh/animation parsing and the
  glTF coordinate/skinning conventions mirror its validated pipeline; the
  LZS-decode re-implementation makes `extract_lzs.py` GPL-3.0 too.
- **MaKiPL / ff8_blender** - GPL-3.0, independent cross-validation of the
  c0m format (mesh/bone conventions) and community reference.
- **FF8 Modding Wiki** - <https://hobbitdur.github.io/FF8ModdingWiki/>
  (archive format + monster data pages).
- Registry anchors: `docs/tech/investigation/battle-static-discovery/c0m-registry.json`
  (R0-pinned archive hashes; DO NOT regenerate - see
  `tools/extract_battle_fixtures.py` warning).
