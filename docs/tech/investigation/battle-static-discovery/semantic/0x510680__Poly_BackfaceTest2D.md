# Poly_BackfaceTest2D @ 0x510680

- Confiance: CERTAIN (solo parent : dérivation ASM + §5.6 live ; 35 instr., mode 1+P)
- Nom catalogue: confirmé (≥2 preuves hors nom IDA) — proposition équivalente `Poly_WindingTest2D` possible ; IDA conservé
- Mode: 1+P (A = dérivation parent, P = §5.6 live)
- A==V: n/a (1+P)
- Push IDB: oui, [semantic-triple 2026-10-08], pas de rename
- Preuves §5.6 parent (live IDB 2026-10-08):
  - `5106bd imul edi,ebp` / `5106c0 imul eax,ecx` / `5106c3 sub eax,edi` — cross( p1−p0 , p1−p2 ) pivot p1
  - `5106c6 mov eax,0` / `5106ce sets al` `5106d1 retn` — bool AL signatif on SF (cf. `sub eax,edi` précédent)
  - return semantics: EAX = {0,1}, AL réel (EAX)
  - xrefs_to: 8 sites code (0x50FED4, 0x51011B, 0x510361, 0x510527, 0x5107CD, 0x5109C9, 0x510BD6, 0x510E41), caller cleanup `add esp,0Ch` + branch `test eax,eax`/`jle`
  - cdecl 3 args (retn sans imm16 ; 4 pushes symétriques ebx/ebp/esi/edi)
- Notes parent: decomp livré → `decomp/0x510680__Poly_BackfaceTest2D.md`.

## Analyse réconciliée

# Sémantique Poly_BackfaceTest2D @ 0x510680 (1+P)

- Rôle (1 phrase) : test d'orientation 2D d'un triangle : extrait les coordonnées (x,y) packées 2×S16 des 3 sommets, calcule `cross((p1−p0),(p1−p2))` pivot p1 (imul×2 + sub), retourne bool AL = (cross < 0) — culling backface / sens horaire.
- Confiance : CERTAIN
- In / Out / Effets : cdecl, 3 args dwords `p0xy, p1xy, p2xy` (x=low16, y=high16). Retour EAX ∈ {0,1} (AL).
- Preuves (3-8, adresses ASM live) :
  1. Extraction S16 par `shl 16/sar 16` (bas) et `sar 16` (haut) — packing (x=low16, y=high16 du même dword.
  2. xor des diffs (51069E/B7/B9/BB) : différences entre les 3 vertices.
  3. imul × 2 puis `sub` : cross 2D signé pivot p1.
  4. `mov eax,0 ; sets al` : bool signatif, non le FLAG (mov eax non-modifiant SF).
  5. 8 callers code ; `add esp,0Ch` (cdecl) + `jle` / branchage bool.
- Questions ouvertes : associé à la sémantique per-vertex des stages (F) et de ParsePolygons (D2).
