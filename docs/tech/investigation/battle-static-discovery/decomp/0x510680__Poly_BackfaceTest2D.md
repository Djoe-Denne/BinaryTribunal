# Poly_BackfaceTest2D @ 0x510680

- Instr (live): 35 (35 (0x0x23), fin 0x5106D2)
- Palier: high
- GLM A: indisponible (pas de MCP glm-decompile dans cette session ; solo parent)
- GLM B: indisponible (idem)
- A==B: n/a
- Push IDB: oui
- SetType: non (pas de SetType dans cette session ; prototype note : `int __cdecl Poly_BackfaceTest2D(unsigned int p0xy, unsigned int p1xy, unsigned int p2xy)`)
- Notes parent: 0x510680 mov ecx,[esp+arg_4] ; 4 pushesebx/ebp/esi/edi ; `shl 16/sar 16` = sx16 bas ; `sar 16` = sx16 haut ; imul + imul + sub ; `mov eax,0 ; sets al` ⇒ EAX = booléen signé (SF produit par `sub eax,edi` de 5106C3 ; `mov` non-flag). 8 callers code (0x50FED4..0x510E41), `add esp,0Ch` après un « call ». SF==1 ⇒ AL=1 (cross<0), sinon AL=0.

## C réconcilié

```c
/* Poly_BackfaceTest2D @ 0x510680
 * Ground truth = live ASM (pack asm.asm), Hex-Rays/GLM absents de la session.
 * 35 instr, end 0x5106D2. cdecl 3 args, retn sans imm16 (caller cleanup: add esp,0Ch).
 * Args: 3 dwords, chacun = point 2D packé 2x S16 : low16 = x, high16 = y.
 * Test: cross = (p1.x-p0.x)*(p1.y-p2.y) - (p1.y-p0.y)*(p1.x-p2.x)
 *      = cross( p1-p0 , p1-p2 ) (pivot p1)
 * Retour: EAX = 1 si cross < 0 (sets al sur SF), sinon 0 (signe = orientation камеры 2D).
 * Caveat: produits 16-bit jusqu'à 2^32 — overflow signe possible (coordonnées battle petites en pratique).
 */

int __cdecl Poly_BackfaceTest2D(unsigned int p0xy, unsigned int p1xy, unsigned int p2xy)
{
    int dx10 = (short)p1xy - (short)p0xy;             /* (x1-x0)   ; 5106B9 sub eax,edx */
    int dy12 = (p1xy >> 16) - (p2xy >> 16);           /* (y1-y2) c ; sar signé 5106A6/5106BB */
    int dy10 = (p1xy >> 16) - (p0xy >> 16);           /* (y1-y0) d */
    int dx12 = (short)p1xy - (short)p2xy;             /* (x1-x2) b ; 51069C..51069E */
    int cross = dx10 * dy12 - dx12 * dy10;            /* 5106BD imul edi,ebp; 5106C0 imul eax,ecx; 5106C3 sub eax,edi */
    return cross < 0 ? 1 : 0;                         /* 5106C6 mov eax,0; 5106CE sets al */
}
```

## Preuves ASM (3-8)

1. `510680 mov ecx, [esp+arg_4]` + `510687 mov esi, [esp+0Cx+arg_8]` + `5106A0 mov edx, [esp+0x10+arg_0]` : trois args packés « x bas 16, y haut 16 » (`shl 16 / sar 16` sign-extension double).
2. `51069C-5106B9` : différence signée des parties basse (x) et haute (y) des trois sommets.
3. `5106BD..5106C3` : `imul edi, ebp ; imul eax, ecx ; sub eax, edi` — cross 2D avec pivot p1 = cross((p1-p0),(p1-p2)) enp1p0`, `p1p2`).
4. `5106C6 mov eax,0 ; 5106CE sets al` `5106D1 retn` : bool à = SF (1 si cross < 0).
5. Callers (8 xref(s) code) : `add esp,0Ch` + branche sur `test eax,eax` / `jle` — bool usage `test eax/eax` + branchement, variante `sub al/al` possible AMC check 8 sites incl. zones Parse*.
6. `retn` sans imm16 → cdecl (caller cleanup), 4 pushes symétriques ebx/ebp/esi/edi.

## Divergences Hex-Rays

Hex-Rays indisponible ce coup (pas d'accès MCP glm-decompile ; decompile via IDA MCP n'a pas été requis — 35 instr).

## Questions ouvertes

- Sens « backface » exact selon l'ordre de sommets attendu par les callers (CW vs CCW) — à caler avec F (workers de stage) et D2 (ParsePolygons).
- Le produit 16×16 peut débordé en signed 32 — jamais apparu dans les coordonnées battle examinées.
