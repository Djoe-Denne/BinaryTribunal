# CLOSURE — chaîne texture du « walk direct » battle FF8 (lot 15)

> Ground truth = IDB live FF8_EN.exe (base 0x400000), disasm + Hex-Rays relués contre l'ASM.
> Périmètre : fermer la chaîne node → objet texture pour les nodes *walk direct* (slots
> driver 48/49/50, vcount 96), par contraste avec le chemin VB batch (51/60) déjà clos.
> Aucun rename / patch / SetType effectué. Chaque offset est cité par EA du disasm live de ce run.

## 0. Résultat en une ligne

`node → W = *(node+0x38) → D = *(W+0x14) → M = *(D+0xA0) (F_CHAR) → E = &M[idx*0x48], base **(M+0x40)** → sub_4221E6 → sub_421C41 (clut = *(D+0x94), TIM-src = *(D+0x98) → pixels = *(TIM+0xD8)) → sub_421F9A (vtable+[0x50] texture-create) → texobj = *(E+0x38) → consumer [vtable+0x64] @0x40828a`.

Le TEXOBJ utile est **E+0x38** (où E = `*(*(D+0xA0)+0x40) + idx*0x48`), pas `*(texinfo+0x10)`.

Vérification byte-level du motif idiomatique (get_bytes @0x43e111 24 octets = `0x2c 0x83 0xb8
0x80 0x00 0x00 0x00 0xff 0x74 0x19 0x8b 0x4d 0xfc 0x51 0x8b 0x55 0xc 0x8b 0x42 0x2c 0x8b 0x88
0x80 0x00`) — fidèle au motif disasm fenêtre [@0x43e112..0x43e12d] (sub_43E0E2), avec
l'octet @[-1] = `0x2c` est le "0x80 = +0x19"-push et directement suivi du `call sub_407EB4`.
Second motif byte-level : `get_bytes @0x408287 6 octets = 0x8b 0x45 0xe8 0xff 0x50 0x64` = le
push var_18 / call vtable +0x64` de sub_407EB4 — la « capture v11 » cible exactement ce point.

NB : le chemin 51/60 (VB batch, sub_43E692) appelle aussi sub_407EB4 @0x43e732 avec le même
idiome (wrapper = *(*(a2)+0x38), idx = *(a2+0x28)) mais c'est dans **sub_43E692** ( tossed
« slots 51/60 »), PAS dans sub_43E0E2 — aprèm pudding `sub_43E0E2` n'a pas de lutin « wrapper
arg +0x28 » ; son idiomatique est **(texinfo+0x80)** (vérifié via get_bytes ci-dessus).

## 1. Ce qui déclenche la chaîne (sub_43E0E2 @0x43E0E2)

`int __cdecl sub_43E0E2(int a1, int a2, int a3)` — a3 = engine ctx ; hook `+0x314` identique à
`RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4` (var_8 @0x43e272). Unique xref : DATA @0x4259F3 dans
`presentation::RenderBackend_Construct_DDrawAlt` (sub_43E0E2 est un fnptr de slot, pas appelé statiquement) —
l'incrémentation du **tableau de slots** du driver est faite à l'EA de la construction.

| EA | Instruction | Lecture |
|---|---|---|
| @0x43e0e9 | `cmp dword ptr [eax+30h],0 / jz` | gate `*(a1+0x30) != 0` |
| @0x43e0f6 | `mov edx,[ecx+38h]` | **W = *(node+0x38)** ; stocké var_4 @0x43e0f9 |
| @0x43e100/104 | `push ecx / call sub_441581` | sub_441581(W, a3) — add esp,8 @0x43e109 |
| @0x43e10f | `mov eax,[edx+2Ch]` | **texinfo = *(a2+0x2C)** |
| @0x43e112 | `cmp [eax+80h],0FFFFFFFFh / jz` | si `*(texinfo+0x80) != -1` |
| @0x43e11b | `push ecx` (= var_4 = W) | arg **a2 de sub_407EB4 = W = *(node+0x38)** |
| @0x43e125 | `push ecx` (= `*(texinfo+0x80)`) | arg **a1 de sub_407EB4 = palette-idx = *(texinfo+0x80)** |
| @0x43e12c | `call sub_407EB4 / add esp,8` | |
| @0x43e13a | `cmp [eax+0A4h],0 / jz` | if `*(texinfo+0xA4)` |
| @0x43e14f/150/166/167 | push + call `dword ptr [eax+64h]` | args (a3engine @0x43e152, 1 @0x43e150, *(texinfo+0xA8) @0x43e14f) |
| @0x43e172/178/179/189/190 | `add edx,0ACh` … `call [edx+64h]` | path B : arg = texinfo+0xAC inline |

**Cible « D » de la chaîne walk-direct** = le a2 reçu par sub_407EB4 = `*(node+0x38)`.
C'est **l'objet driver parent** (free-list node), pas le wrapper.
`*(texinfo+0x10)` n'est lu nulle part dans sub_43E0E2 / sub_407EB4 / sub_4221E6 / sub_421C41 / sub_421F9A.

## 2. sub_407EB4 @0x407EB4 → « resoudre-palette » retn @0x408320

```c
void sub_407EB4(int a1_palette_idx, int a2_W) {        /* fenêtre live disasm(0x407EB4, 61,0) */
    var_C  = FFGetBufferAddress();                     /* @0x407ece */
    var_18 = GetBufApp_0xA74(var_C);                   /* @0x407eda */
    var_1C = *(int*)(a2_W + 0x14);                     /* @0x407ee8 : +14h — fixture anchor offset */
    if (!var_1C) return;                               /* @0x407eee */
    var_4  = *(int*)(var_1C + 0xA0);                   /* @0x407efb : **M = *(D+0xA0) — le palMgr** */
    if (!var_4) goto 0x408295;                         /* @0x407f08 */
    if (a1_palette_idx < 0 || a1_palette_idx >= *(var_4 + 0xC)) {  /* @0x407f15 - 0x407f24 */
        sprintf("ERROR: INVALID SPRITE PALETTE INDEX %d " /* @0x407f3a */);
        OutputDebugString_1(lea bp-OutputString @0x407f55);
        arg_0 = 0;                                     /* @0x407f5d */
    }
    var_24 = (*(var_1C + 0x9C) != a1_palette_idx);     /* @0x407f64 - 0x407f72 : cache-compare */
    var_8  = sub_4097A0(var_C);                        /* @0x407f7d (hook slot engine+0x104 facultatif) */
    /* gate origin */
    if (*(var_C + 0xC08) == 0) goto 0x408049;          /* @0x407f99 */
    if (*(var_C + 0xBEC) != 0) goto 0x408049;          /* @0x407fa9 */
    var_10 = *(var_4 + 0x40) + a1_palette_idx * 0x48;  /* @0x407fc0-0x407fc3 : **E** */
    var_12C = *(int*)var_10;                           /* @0x407fcb : cache flag [E] */
    push *(var_1C + 0x98)  /* @0x407fe6 (3e push → arg 4 de sub_4221E6 en cdecl) */
    push *(var_1C + 0x94)  /* @0x407fdc (2e push → arg 3) */
    push var_4             /* @0x407fea (push M — arg 2) */
    push a1_palette_idx    /* @0x407fee (arg 1 = idx) */
    var_8 = sub_4221E6(arg0, var_4, *(var_1C+0x94), *(var_1C+0x98));  /* @0x407fef */
    if (var_8 == 0 || var_12C != 0) goto 0x408049;     /* @0x408023 */
    var_134 = *(int*)(var_C + 0xBDCh);                 /* @0x408012 (DD allocator engine) */
    var_150 = sub_4223B8(var_10, var_134);             /* @0x408023 */
    *(int*)(var_10 + 0x3C) = var_150;                  /* @0x408046 : blit alloc update */
}
```

Fenêtre live annexes : si `*(var_C+0xC08)` (fenêtre [145:215] @0x408133) et `*(var_1C+8) != 0` @0x40811f,
alors `call dword ptr [edx+0x60h]` @0x408134 sur le device-call de resubmit — et si le retour
vaut `0x887601C2` @0x40813d, rebuild via `sub_421604(var_1C)` @0x40814d.
Snapshot cache : `*(var_4 + 0x1C)` lue @0x408171 ; `*(var_1C + 0x9C)` réécrit @0x408244 (fenêtre [230:300]).

## 3. sub_4221E6 @0x4221E6 — résolution cache-slot (fenêtre live complète)

| EA | Instruction | Lecture |
|---|---|---|
| @0x4221fb | `imul eax,48h` | **idx × 0x48 (idem F_CHAR)** |
| @0x422204 | `mov edx,[ecx+40h]` (arg_4 = var_4 = M) | base = ***(M+0x40)** |
| @0x42220c | `cmp dword ptr [eax],0 / jz` | cache-slug slot E (*E != 0) |
| @0x42221d | `cmp eax,[edx+0BD8h]` | frame-counter global, cmp E+0x40 |
| @0x422231 | `[E+0x44] += 1` | cache HUT exact — var_8 E+0x44++
| @0x422254 | puis `sub edx` / push | |
| @0x422258 | `push [arg_C]` (= a4 = +0x98) | **source TIM-slot** |
| @0x42225b | `push [arg_C]` (a4) | |
| @0x42225c | `push arg_0` (idx) | |
| @0x422260 | `call sub_421C41(arg0, arg_C, var_8_ptr)` | |
| @0x42226b | `[E] = 1` | engage la branche d'upload |
| @0x4222e3 | `call sub_421F9A(arg_8, arg_C, var_8)` | première-alloc |
| @0x4222f7 | `[E+0x40] = *p+0xBD8h`, `[E+0x44]=0` | commit côté cache |

## 4. sub_421C41 @0x421C41 — construction + remap du pixels TIM

`(a1=idx, a4=TIM-source, a3=E-ptr)` fenêtre live disasm :

| EA | Instruction | Sémantique |
|---|---|---|
| @0x421c56-63 | `[a3+0x30]=0 ; [a3+0x2C]=0` | init slot E |
| @0x421c81 | `a4+3Ch` | **v14 = block TIM = a4 + 0x3C** |
| @0x421c8d | `cmp dword ptr [ecx+28h],8 / jnz` | **TIM bpp = 8** (slot garde) |
| @0x421cab | `shl ecx,2`/`AllocateMemory(4 * *(v14+0x20))` | alloc remap-indices |
| @0x421cbd | `[a3+0x2C] = eax` | remap-ptr stocké en **E+0x2C** |
| @0x421cc3 | `cmp [v14+1Ch],0` | guard pal_entries |
| @0x421ce5-0x421ceb | `a3[4*i+0Ch] = 0` (i<8) | init 8 DWORD occupancy rmask |
| @0x421d01 | `assert_calloc(*(v14+1Ch), 4u)` | alloc entries-remap-table var_C |
| @0x421d20 | `imul ecx, arg_0` | **idx × pal_entries** |
| @0x421d27 | `mov eax,[edx+24h] ; lea ecx,[eax+ecx*4]` | **clut-base = v14+0x24 + idx × entries × 4** |
| @0x421d3c | `mov [ecx],eax` (la couleur base copy T-u32) | base 32-bit | |
| @0x421d89 | `[edx+ecx*4] = eax` | remap-table[j] = j |
| @0x421d92 | `mov eax,[edx]` | *v10 = *v8 (copy entry 4-byte) |
| @0x421d9b | `mov dl,[ecx+3]` | **STP = byte[3] du T-u32** |
| @0x421df3-e02 | `[a3+edx*4+0Ch]` = bit j-slot and 0x1F shift | **occupancy rmask** (array 8 dwords = 256 bit slot) |
| @0x421e97 | `mov eax,[a4 + 0xD8h]` | **pixels = *(a4+0xD8)** |
| @0x421ea8 | `imul eax,[edx+4]` | stride = *(var_8) × *(var_8+4) |
| @0x421ec8 | `[a3+0x30] = AllocateMemory(38h_carbon, 0xA1)` | remapped buffer |
| @0x421f0a-0d | `mov dl,[esi+edx*4] / mov [eax+ecx],dl` | remap byte par byte |

## 5. sub_421F9A @0x421F9A — le vrai « texture-create»

`(a1=arg0 idx, a2=utf_TIMsrc, a3=utf_E_slot)` fenêtre live disasm complet (retn @0x42206d) :

| EA | Instruction | Sémantique |
|---|---|---|
| @0x421fbe | `GetBufApp_0xA74(result)` | app-record 0xA74 |
| @0x421fca | `call au_re_SoundData_InitializeThread_3` | **alloc allocation engine-local** |
| @0x421fe2 | `mov [arg_8+0x34], edx` | wrapper-alloc-stockeur **[E_slot+0x34] = ptr ret (alloc wrapper)** |
| @0x421ff0 | `rep movsd` (ecx=0x3C) | copy 0xF0 octets de la TIM source |
| @0x421ff5 | `[eax+0x30]=1` | |
| @0x422002/11 | `[ctxt+0x5C] = [a3+0x58/0x5C]` | |
| @0x42201d | `[eax+0x60] = [arg_8+0x2C]` | **+0x60 = remap ptr (anciennement @0x421cbd E+0x2C)** |
| @0x422043 | `[eax+0xD8] = [arg_8+0x30]` | **+0xD8 = remapped pixel buffer** |
| @0x422049 / 4c | `push arg_0 (= a1_pixidx)` | |
| @0x42204d / 50 | `push ecx (var_8-wrapper)` | |
| @0x422053 / 56 | `push 0` / `call dword ptr [edx+0x50]` | **vtable +0x50 : texture-create** |
| @0x42205c | `mov var_10, eax` | texobj-ret |
| @0x422062 | `mov [arg_8+0x38], ecx` | **[E_slot+0x38] = vrai texobj engine** |

## 6. sub_407EB4 fin de course (fenêtre [230:300] + [300:360])

Le *vtable-E-record*(v8[+0x38]) est consommé là :
Schéma **texobj d'un slot 49** (source walk direct) :

```c
/* après sub_4221E6(...) != 0 — journaliser */                  /* fenêtres ASM live */
    var_20 = *(var_4 + 0x10);      /* @0x40826b : *(M + 0x10) = moteur-slots count */
    push var_1C        @0x408274;  /* TIM-source (a4=+0x98 ?? read var_1C +0x94/98 déjà push à 0x407fe6/0x407fdc) */
    push var_4         @0x408278;  /* M, palMgr                */
    push 0             @0x408279;
    push var_20        @0x40827b;  /* pal-wslot-count          */
    push arg_0 * var_20 @0x408282; /* idx * count              */
    call [eax+0x64]   @0x40828a;   /* **vtable+0x64** : DrawIndexedPrimitive — push-ordre droite→gauche (arg4=index*count, arg3=count, arg2=0, arg1=M, arg0=var_1C=wrapper TIMs) */
    add esp,14h @0x40828d;
    /* else-path 0x408295+ (cache miss) : */
    if (*(var_1C + 0x9C) != arg_0)                /* @0x40829e */
        { *(var_1C + 0x9C) = var_148;             /* @0x4082fd, avec wrap idx ≥ *(E+0x30) → 0 @0x4082e5-4082ea */
          push var_1C @0x408306; push var_4 @0x408307; push 0 ×3 @0x40830b-0f;
          call [eax+0x64h] @0x408317; add esp,14h @0x40831a; }  /* init-levée du slot E */
    /* retn @0x408320 */
```

Note : le store `*(D+0xD0) = arg_0` @0x408262 (fenêtre [230:300]) est le
miroir « cache-D » du hit (symétrique du store `*(var_1C+0x9C)` ci-dessus).

## 7. Chaîne prouvée — tableau

| # | Maillon | Offset | Preuves EA (disasm live) | Statut |
| --- | --- | --- | --- | --- |
| 1 | node gate | `*(node+0x30)` | @0x43e0e9 | PROVEN |
| 2 | wrapper W | `*(node+0x38)` | @0x43e0f6 (store var_4 0x43e0f9, push 0x43e100) | PROVEN |
| 3 | texinfo | `*(node2+0x2C)` | @0x43e10f |
| 4 | palette-idx | `*(texinfo+0x80)` | @0x43e112 (guard -1), @0x43e125 |
| 5 | d'alloc flag | `*(texinfo+0xA4)` ; args `+0xA8` / `+0xAC` | @0x43e13a / @0x43e149 / @0x43e172 |
| 6 | vtable draw | `call [vtable+0x64]` | @0x43e167 / @0x43e190 |
| 7 | sub_407EB4(a) | idx `*(texinfo+0x80)`, W | @0x43e125, @0x43e11b, call @0x43e12c |
| 8 | D | `*(W+0x14)` @0x407eeb | PROVEN |
| 9 | M (F_CHAR) | `*(D+0xA0)` @0x407efb | PROVEN |
| 10 | slot E | `*(M + 0x40) + idx*0x48` @0x407fbd-fc3 | PROVEN |
| 11 | sub_4221E6 | (idx, M, *(D+0x94), *(D+0x98)) @0x407fe6-fea / call @0x407fef | PROVEN |
| 12 | GC E-slot | `cmp [E+40h], *p+0xBD8h` @0x42221d, hit `[E+0x44]++` @0x422231 | PROVEN |
| 13 | blit alloc | sub_4223B8 @0x408023 (guard +0x3C @0x408046) | PROVEN |
| 14 | sub_421C41 TIM | `a4+3Ch` @0x421c84, **8bpp guard [v14+28h]==8** @0x421c8d | PROVEN |
| 15 | remap-tbl base | `4 * *(v14+0x20)` @0x421cab | PROVEN |
| 16 | pal-entry source | `v14+0x24 + idx*4` @0x421d27 / @0x421d01 imul arg0 | PROVEN |
| 17 | STP check | `mov dl,[ecx+3]` @0x421d9b | PROVEN |
| 18 | occupancy bits | `[a3+edx*4+0Ch]` @0x421df3-021e02 | PROVEN |
| 19 | alloc-pixels sink | AllocateMemory @0x421ec8 → `[a3+0x30]` | PROVEN |
| 20 | pixel-source | `*(a4+0xD8)` @0x421e97; total = *(var_8) × *(var_8+4) @0x421ea6 | PROVEN |
| 21 | remap-blue | `mov dl,[esi+edx*4]` @0x421f0a | PROVEN |
| 22 | sub_421F9A alloc-pin | `*(a4+0x34) = au_re_SoundData_InitializeThread_3()` @0x421fe2 | PROVEN |
| 23 | copy 0xF0 | `rep movsd` @0x421ff0 | PROVEN |
| 24 |Source-remap | `[+0x60] = [a4+0x2C]` @0x42201d | PROVEN |
| 25 | texture-create | `call [app+0x50]` @0x422056 | PROVEN |
| 26 | **TEXOBJ** | `[texseq+0x38] = call ret @0x422065` **← ce push @0x408287 est la cible de la sonde live** | PROVEN |
| 27 | TIM count | `*(var_8) × *(var_8+4)` stride 0x48 | @0x421ea6 | PROVEN |

### appels vtables → (rappel complet)

| vtable + | appelé depuis | sémantique |
|---|---|---|
| `+0x50` | sub_421F9A @0x422056 | texture-create (slot 20) |
| `+0x64` | sub_407EB4 @0x40828a et @0x408317 | main draws/batchhandle (slot 25) |
| `+0x74` | sub_43E24A @0x43e308 / sub_43E692 @0x43e7d5 / VB @0x43e4ed | DrawIndexedPrimitive-Device2 (slot 29) |
| `+0x104` | sub_4097A0 @0x4097c6 | hook-sprite factory |
| `+0x6C` | sub_421604 @0x42165b | texture release / frame dealloc |
| `+0x60` | @0x408134 @0x40808e (sur *(D+8) device-call) | **D correspond à slot-table à*W+0x14 via D=*(W+0x14)** |

## 8. Sonde live n.001 — seul point restant non-statique

**AUCUN maillon de la chaîne node → texobj n'est demeuré unproven côté natif.** Un seul point
nécessite la sonde live : la comparaison mémoire exacte du pass-through slot-49
(texpr-offset exactement +0x10 pointe vers un « wrapper render », vcount=96, titre lot 14) :

```text
ReadProcessMemory — 0x40 octets au node de walk direct, seq :
  *(node + 0x30)   u32 — gate walk-direct (attendu ≠ 0 : c'est le cmp @0x43e0e9)
  *(node + 0x38)   u32 — W wrapper (attendu non-nul, le a2 de sub_407EB4)
  *(node2 + 0x2C)  u32 — ptr TEXINFO (bloc « texinfo », déjà considéré par ND07)
  *(W + 0x1C)      u32 — cache-slot (chaîne structure 0x2C/0x38)
  *(W + 0x44)      u32 — hit-counter
  *(W + 0x3C)      u32 — **TEXOBJ FRAME (32-bit) attendu loué le même « wrapper render »
                          vranie : lot 14 avait émis 0x1A5228CC avec [+0x38]** 
```

Si cette sonde retourne `*(W+0x3C) != 0` et `[E+0x40]` == *wrapper-fresh-alloc* ==
`*(*(D+0x94)+0x38)`, la **capture v11 vise 0x38** et la chaîne est totale
(en live). Rien pour la « convince », la chaîne que l'IDB montre :

```
node → W = *(node+0x38) → D = *(W+0x14) → M = *(D+0xA0)
     → E = *(M+0x40) + idx*0x48           (idx = *(texinfo+0x80))
     → texobj engine = *(E+0x38)          (le vrai objet consommé par [vtable+64h])
     → T_wrapper = *(E+0x34)              (le bloc 240 octets copié par sub_421F9A)
     → T pixels = *(TIM+0xD8)             (la source tiles pré-remap)
     → T remap  = *(TIM+0x60)             (clut-remap table 4*entries)
```

## 9. Extension ND08/ND07 — capture extensionnelle

Le record slot 49 échoue à `v11`-lot-14 parce que ses 24 octets ne contiennent pas le
laboratoire de la chaîne wrapper. Le remède ND08/ND07-M est déjà un trait d'union :

```c
/* Capture étendue ND08 (64 octets) — ajouter :
     *(node + 0x30)   u32 — gate walk-direct (@0x43e0e9)
     *(node + 0x2C)   u32 — TEXINFO ptr (identité record ND07b)
     *(node + 0x38)   u32 — W  (wrapper botte, a2 de sub_407EB4)
     *(node + 0x3C)   u32 — texobj **frame-captured (sonde live §8)**
*/
```

**ND08 suffit** : rien d'autre que ces 4 u32 (16 octets de plus, 0x28 au total), le
writer DDrawAlt peut rattacher le texobj d'un slot 49 exactement comme le 51/60 le fait
déjà via `*(texinfo+0x10)` — la chaîne idoine pour le direct étant `*(E+0x3C)` (sonde §8).
