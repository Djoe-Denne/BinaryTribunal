# GFXPT_DumpNode — decomp réconciliée (image déployée 53464B47) + localisation du +2

**Cible** : `GFXPT_DumpNode` @ RVA 0x19D0–0x1DDC du DLL passthrough (NOTRE code), image
déployée SHA256 `53464B477C58F39D3ACF39BC3C1438DB15291B080A7669B11BA347EEEB888960`
(`docs\tech\investigation\battle-static-discovery\driver-passthrough\gfx_driver_passthrough.dll`
== copie jeu `C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII\AF3DN.P`,
mtime 15:40:51). **Pas d'IDB. Ground truth = listing `dumpbin /DISASM` du DLL déployé**
(`%TEMP%\dis.txt`, lignes 864–1198 ; en-tête ligne 5 « Dump of file …gfx_driver_passthrough.dll »)
**+ expériences live** (harnais + ReadProcessMemory sur le jeu en cours).

Extraction : `tools\_tmp_af3dn_drop\decode\_audit\dumpnode_full.asm` — 336 instructions,
aucune lacune d'adresse 0x19D0→0x1DDC (`83 EC 48 sub esp,48h` … `C3 ret`).

Appelant : `Proxy_List51` @ RVA 0x333A (dis.txt 3217–3232) : `push ebp/esi/edi; push 33h;
call 100019D0; add esp,1Ch` — **cdecl, 3 args (slot, ctx, node)**. Les 22 wrappers
43–64 = même pattern (sites `10002EBA`…`10003A8A`, push 0x2B..0x40).

---

## VERDICT (une ligne)

**Le `+2` n'est PAS dans GFXPT_DumpNode. Il est dans le flush : `fopen(binPath, "a")` ouvre le
.bin en mode TEXTE → chaque octet `0x0A` des données devient `0D 0A` dans le fichier.**
L'anneau live lu par ReadProcessMemory dans le jeu en cours est **contrat exact**
(grille FVF à rec+172, magic suivant à +1324) et le fichier = l'anneau avec les LF expansés
(**preuve 1326/1326 octets**, §4). Patch minimal = une lettre : `"a"` → `"ab"`.

---

## 0. L'anomalie en un tableau (avant/après lecture de l'anneau live)

| observation capture | lecture « writer +2 » (hypothèse de départ) | lecture réelle (prouvée §2) |
|---|---|---|
| records slot-51 multigroupes = declared+2 o, « préfixe u16 `22 00`/`36 00` » entre idx et fvf | le writer copie `[verts−2, +vc*32+2)` | **CRLF** : le .bin est ouvert en mode TEXTE ; chaque `0x0A` des données → `0D 0A` ; le « préfixe » = le dernier mot idx vu décalé |
| magic suivant à `+32+psize+2` | curseur `need+2` | le magic est bien à `+1324` **dans l'anneau** ; dans le fichier il est repoussé par les expansions |
| `remaining=1` → +0 | pas de walk | ces records ne contiennent aucun `0x0A` |
| log `bytes=4380` vs fichier 4384/frame | ledger ≠ curseur | log = `pending` (contrat) ; fichier = pending + 4 LF/frame |
| battle vc=19482/ic=29184 fails=0 | gardes absentes du writer | **réel mais image 13:47 uniquement** (perV 3247 × rem 6 ; le build actuel a les caps ratio 0x1BB6/0x1BD0 et reverify.bin ne montre que vc 36/56/4) |

---

## 1. C réconcilié (ground truth = ASM du DLL déployé, validé par harnais)

```c
/* GFXPT_DumpNode @ RVA 0x19D0..0x1DDC — build déployé 53464B47 (lot 13 v7, 25/09 15:40).
 * 336 instr, cdecl 3 args. F = 100013E0 = GFXPT_ReadU32 (SEH), G = 10001890 =
 * GFXPT_CopyBytes (SEH→memcpy), Z = 10005B40 = memset CRT.
 * Globales (VA absolues, relogées par .reloc) :
 *   [10054E94]=g_dumpWrite (offset ring)   [14054E98]=g_dumpCommit
 *   ring 64 Mo = BSS .data @VA 0x10054E98..0x14054E98 (d'où .data vsize=0x4033888)
 *   [14054EB0]=g_frameSeq  [14054EB4]=g_capEndSeq  [14054EB8]=g_frameRecords(=cap 4096/frame)
 *   [14054EA8]=fails globaux  [14054EAC]/[14054EC4]=guard skips  [14054EA4]/[14054EC0]=ring drops
 *   [14054EBC]=fails cumulés  [14054EC8]=g_frameOverflow  [14054E9C]=records frame log
 *   [14054EA0]=g_dumpBytes (ledger = somme des need — sert au --strict du décodeur, pas au log)
 *   [14054EB8] sert AUSSI de compteur one-shot? non : c'est le compteur records/frame,
 *   comparé à 0x1000 @0x1A2F = cap 4096 records/frame ; à 4096 atteints → [14054EC8]=1. */
#define NODE_BYTES 24ul
#define VCOUNT_MAX 4096ul      /* 0x1000 @0x1BF7 */
#define ICOUNT_MAX 16384ul     /* 0x4000 @0x1BFF */
#define REC_MAX    0x40000ul   /* 256 Ko @0x1C66 */
#define RING_BYTES 0x4000000ul /* 64 Mo @0x1CA0 */

void GFXPT_DumpNode(unsigned slot, const void* ctx, const void* node)
{
    /* — 0x19D0..0x1A2F : zéros locaux + fenêtre — */
    if (g_frameSeq == 0 || g_frameSeq > g_capEndSeq) return;   /* 0x1A0F test / 0x1A17 ja (u) */
    if (g_frameOverflow != 0)                        return;   /* 0x1A23 cmp/jne */
    if (g_frameRecords >= 4096) { g_frameOverflow = 1; return; } /* 0x1A2F jb / 0x1A3D mov 1 */

    /* — 0x1A4C..0x1A6B : node non nul + copie 24 o (G) — */
    if (!node)                                       return;   /* 0x1A51 test/jg-esque je */
    if (!GFXPT_CopyBytes(nodeCopy, node, NODE_BYTES)) {        /* 0x1A61 call, add esp,0Ch */
        g_frameFails++;  return;                               /* 0x1C19 inc [14054EA8] */
    }

    /* — 0x1A71..0x1A88 : dispatch slot (table 2 niveaux) —
     *   0x1A71 mov eax,[esp+5Ch](slot) ; 0x1A75 add eax,-30h ; 0x1A78 cmp eax,10h ;
     *   0x1A7B ja 0x1C27 (default kind0 — couvre slots 43..47, index négatif non signé)
     *   0x1A81 movzx eax,byte [eax+0x1DEC]          (byte map, 17 entrées)
     *   0x1A88 jmp dword [eax*4+0x1DE0]             (table 3 cibles)
     * byte map @0x1DEC : 00 00 00 01 02 02 02 02 02 00 00 00 01 02 02 00 00
     *   → 48,49,50,57,58,59,63,64 = 0 (0x1A8F direct kind2)
     *     51,60                    = 1 (0x1B0D VB batch)
     *     52..56,61,62             = 2 (0x1C27 kind0) ; 43..47 → default (kind0). */
    switch (slot) {
      case 48: case 49: case 50: case 57: case 58: case 59: case 63: case 64: {
        /* 0x1A8F..0x1B08 : descriptor direct */
        if (!GFXPT_ReadU32(&L_vc,    node + 0x0C) ||   /* 0x1AA1 dst[esp+24] */
            !GFXPT_ReadU32(&L_ic,    node + 0x18) ||   /* 0x1ABA dst[esp+28] */
            !GFXPT_ReadU32(&L_verts,  node + 0x14) ||  /* 0x1AD3 dst[esp+14] */
            !GFXPT_ReadU32(&L_idx,    node + 0x20))    /* 0x1AEC dst[esp+18] */
            { g_frameFails++; return; }
        vcount = L_vc; icount = L_ic;                  /* 0x1B00 mov ebx / 0x1B04?? edi */
        geomKind = 2;                                  /* 0x1A93/0x1A9C mov esi,2 + store */
        goto guards;                                   /* 0x1B08 jmp 0x1BE9 */
      }
      case 51: case 60: {
        /* 0x1B0D..0x1BE4 : VB batch (0x43E356/0x43E692) */
        if (!GFXPT_ReadU32(&L_rem,   node + 0x08) ||   /* 0x1B1E dst[esp+30] */
            !GFXPT_ReadU32(&L_geom,  node + 0x2C) ||   /* 0x1B37 dst[esp+10] */
            !GFXPT_ReadU32(&L_verts, node + 0x14) ||   /* 0x1B50 dst[esp+14] */
            !GFXPT_ReadU32(&L_idx,   node + 0x20))     /* 0x1B69 dst[esp+18] */
            { g_frameFails++; return; }
        geomKind = 2;                                  /* 0x1B11 mov [esp+1C],2 */
        vcount = icount = 0;
        if (L_rem != 0 && L_geom != 0) {               /* 0x1B79/0x1BAC + 0x1B7D */
            unsigned perV = 0, perI = 0;
            GFXPT_ReadU32(&perV, L_geom + 0x3C);       /* 0x1B8A (échec→0, record quand même) */
            GFXPT_ReadU32(&perI, L_geom + 0x40);       /* 0x1B9C */
            /* caps par division (0x1BB6 div 0x1000 ; 0x1BD0 div 0x4000) :
             * produit SEULEMENT si remaining <= cap/perV (resp. /perI) — ja = unsigned. */
            if (perV && L_rem <= VCOUNT_MAX / perV)  vcount = perV * L_rem;  /* 0x1BC1/0x1BC3 imul */
            if (perI && L_rem <= ICOUNT_MAX / perI)  icount = perI * L_rem;  /* 0x1BDB/0x1BDD imul */
        }
        /* fallthrough guards */
      }
      default:                                          /* 0x1C27 : kind0, node jamais lu */
        geomKind = 0;                                   /* 0x1C27 xor esi,esi */
        goto sizes;
    }

guards:                                             /* 0x1BE9 */
    if (vcount == 0 && icount == 0)                 return;   /* 0x1BED/0x1BEF */
    if (vcount > VCOUNT_MAX)                        return;   /* 0x1BF7 ja */
    if (icount > ICOUNT_MAX)                        return;   /* 0x1BFF ja */

    /* — 0x1C07..0x1C13 : snapshot src — */
    L_verts_snap = L_verts;   /* → [esp+3C] */     /* 0x1C07/0x1C0B */
    L_idx_snap   = L_idx;     /* → [esp+38] */     /* 0x1C0F/0x1C13 */

sizes:                                              /* 0x1C2D */
    idxBytes = icount * 2ul;                        /* 0x1C2D lea ecx,[ebx+ebx] */
    idxPad   = (4 - (idxBytes & 3)) & (0 - ((idxBytes & 3) != 0)); /* 0x1C3B and/0x1C3E sub/0x1C40 neg/0x1C42 sbb/0x1C44 and */
    if (geomKind != 2) {                            /* 0x1C46 cmp esi,2 / 0x1C49 jne */
        psize = 0x18; need = 0x38;                  /* 0x1C82 mov edx,38h / 0x1C87 mov [esp+34],18h */
    } else {
        psize = 0x20ul + idxPad + idxBytes + vcount * 32ul;   /* 0x1C53 lea esi,[eax+20h] (+pad+idx) */
        need  = 0x40ul + idxPad + idxBytes + vcount * 32ul;   /* 0x1C50 lea edx,[eax+40h] (+pad+idx) */
    }
    if (need > REC_MAX) { g_frameGuardSkips++; g_dumpGuardSkips++; return; } /* 0x1C66 jbe / 0x1C6E,0x1C74 inc */
    if (need > RING_BYTES - (g_dumpWrite - g_dumpCommit)) {                  /* 0x1C93 sub/0x1CA0 add/0x1CA5 cmp */
        g_frameDrops++; g_dumpDrops++; return;                               /* 0x1CA9,0x1CAF inc */
    }

    /* — 0x1CC1..0x1D08 : entête + node — */
    unsigned char* rec = g_ring + g_dumpWrite;      /* 0x1CC1 lea esi,[ecx+10054E98h] */
    *(u32*)(rec + 0x00) = 0x3730444E;               /* 0x1CC7 */
    *(u32*)(rec + 0x04) = slot;                     /* 0x1CCD [esp+5Ch] */
    *(u32*)(rec + 0x08) = g_frameSeq;               /* 0x1CD0 [14054EB0] */
    *(u32*)(rec + 0x0C) = ctx;                      /* 0x1CD8 [esp+60h] */
    *(u32*)(rec + 0x10) = (u32)node;                /* 0x1CE3 ebp */
    *(u32*)(rec + 0x14) = geomKind;                 /* 0x1CDF [esp+1Ch] */
    *(u32*)(rec + 0x18) = 0;                        /* 0x1CE9 (fails écrit APRÈS copies si >0, 0x1DB5) */
    *(u32*)(rec + 0x1C) = psize;                    /* 0x1CF0/0x1CF4 [esp+34h] */
    /* node 24 o : 0x1CF9 movups xmm0,[esp+40h] → [rec+20h] ; 0x1D02 movq [esp+50h] → [rec+30h] */

    unsigned fails = 0;                             /* ebp, 0x1CF7 xor ebp,ebp */
    if (geomKind != 2) {                            /* 0x1D0D cmp eax,2 / 0x1D10 jne 0x1DBB */
        g_ringWrite += need; /* + compteurs */ return;
    }
    *(u32*)(rec + 0x38) = vcount;                   /* 0x1D1A?? NON : 0x1D21 mov [esi+38h],edi */
    *(u32*)(rec + 0x3C) = icount;                   /* 0x1D16/0x1D1A mov eax,[esp+20h] → [esi+3Ch] */
    unsigned char* p = rec + 0x40;                  /* 0x1D24 add esi,40h */

    /* — idx (0x1D2B..0x1D74) — */
    if (idxBytes) {
        if (GFXPT_CopyBytes(p, L_idx_snap, idxBytes)) {      /* 0x1D31 call G */
            if (idxPad) memset(p + idxBytes, 0, idxPad);     /* 0x1D45..0x1D4A push ebx/ebp=0/add eax,esi → Z@0x1D66 */
        } else {
            memset(p, 0, idxBytes + idxPad); fails++;        /* 0x1D4C..0x1D52 ; 0x1D9A inc ebp */
        }
    } else if (idxPad) {
        memset(p, 0, idxPad);                                /* 0x1D5E..0x1D66 */
    }
    p += idxBytes + idxPad;                                  /* 0x1D6B reload eax=[esp+10] ; 0x1D72 add eax,ebx ; 0x1D74 add esi,eax */

    /* — fvf (0x1D76..0x1D9A) — LONGUEUR EXACTE vc*32 (shl edi,5 @0x1D7A), src = verts
     *   TEL QUEL (aucun -2, aucun +2) — validé par harnais (sentinelles 0xA1A2 à verts-2
     *   NON copiées) et par l'anneau live (ReadProcessMemory). */
    if (vcount) {
        if (GFXPT_CopyBytes(p, L_verts_snap, vcount * 32ul)) {  /* 0x1D83 call G */
            /* ok */
        } else {
            memset(p, 0, vcount * 32ul); fails++;               /* 0x1D92 Z ; 0x1D9A inc ebp */
        }
    }
    /* PAS de write-back vers node+0x14 (les curseurs du walk natif restent locaux). */

    /* — 0x1D9B..0x1DCF : ledger + commit — */
    if (fails) {                                    /* 0x1DA5 test ebp */
        g_dumpSehFails += fails;                    /* 0x1DA9 add [14054EA8],ebp */
        g_dumpFailsTot += fails;                    /* 0x1DAF add [14054EBC],ebp */
        *(u32*)(rec + 0x18) = fails;                /* 0x1DB5 mov [ecx+10054EB0h],ebp (=rec+0x18) */
    }
    g_frameRecords++;                               /* 0x1DBB inc [14054E9C] */
    g_dumpWrite += need;                            /* 0x1DC1 mov ecx,[10054E94] ; 0x1DC3 add [14054EA0],edx ; 0x1DCF mov [10054E94],ecx */
    g_dumpRecords++;                                /* 0x1DC9 inc [14054EB8] */
}
```

NB offsets push : dumpbin affiche les [esp+N] APRÈS pushes ; les dst réels :
rec1 dst=P+0x30(rem), rec2 P+0x10(geom), rec3 P+0x14(verts), rec4 P+0x18(idx),
perV P+0x2C, perI P+0x34 (recalculés avec le décale des 2 pushes pendants @0x1B8F/0x1BA1).

### Table instruction↔C (extraits à ancre)

| RVA | octets | C |
|---|---|---|
| 0x1A0F | `85 C0 test; 0F 84 je` | `if (g_frameSeq == 0) return;` |
| 0x1A17 | `39 05 cmp [14054EB0]`… `0F 87 ja` | `if (g_frameSeq > g_capEndSeq) return;` (unsigned) |
| 0x1A2F | `81 3D cmp [14054EB8],1000h; 72 jb` | cap 4096 records/frame |
| 0x1A3D | `C7 05 [14054EC8],1` | `g_frameOverflow = 1` |
| 0x1A81/0x1A88 | `movzx/jmp [eax*4+1DE0]` | switch(slot) table 2 niveaux |
| 0x1B8A/0x1B9C | `call ReadU32` ×2 | `perV=geom[0x3C]; perI=geom[0x40]` |
| 0x1BBB/0x1BD5 | `F7 F6 div esi` (0x1000/0x4000) | caps par division |
| 0x1BC3/0x1BDD | `0F AF imul` | `vcount=perV*rem; icount=perI*rem` |
| 0x1C3B..0x1C44 | `and/neg/sbb/and` | `idxPad` sans branche |
| 0x1C53/0x1C50 | `lea esi,[eax+20h]/lea edx,[eax+40h]` | `psize` / `need` |
| 0x1CF9/0x1D02 | `movups/movq` | copie node 24 o SSE |
| 0x1D21/0x1D1A | `mov [esi+38h],edi / mov [esi+3Ch],eax` | vcount/icount du payload |
| 0x1D24 | `83 C6 40 add esi,40h` | `p = rec + 64` |
| 0x1D7A | `C1 E7 05 shl edi,5` | longueur fvf = vc*32 **exacte** |

---

## 2. Localisation du +2 : `fopen(binPath, "a")` = mode TEXTE

### 2.1 Preuves que DumpNode est contrat-exact

**(a) Désasm** : énumération exhaustive des écritures (§1) — la seule copie fvf =
`GFXPT_CopyBytes(p, [esp+3C], EDI<<5)` (0x1D7A `shl edi,5` ; 0x1D7D push edi ;
0x1D7E push [esp+40h] ; 0x1D82 push esi ; 0x1D83 call 10001890) : src = verts lu
@node+0x14 (0x1AD3/0x1B50), longueur = vc*32 **exacte**. Aucun −2, aucun +2, aucune
écriture de 2 octets entre idx et fvf, aucun write-back vers node+0x14.

**(b) Harnais** (sur `harness_target.dll` = copie du déployé, SHA vérifié 53464B47) :
- `h2.c` : DumpNode(51, node{rem=9,perV=4,perI=6}, sentinelles) → `g_dumpWrite` delta
  = **1324 = contrat** ; ring : idx sentinelles [64..172), grille 0x22 [172..) ;
  **les octets 0xA1A2 plantés à verts−2 ne sont PAS copiés**.
- `h5.c` : ring[1324..1344) = zéros → **aucun spill** ; le bin fait 1325 = pending+1.
- `h7.c` : remaining=1 → delta 204 = contrat, **+0**.
- `h8.c` : frame menu-like 6 records → write=3720 = contrat exact.

### 2.2 Preuve du mécanisme réel

**(c) h5/h6 : le fichier = l'anneau avec `0x0A` → `0D 0A`.**
h6 : diff complète ring(1400 o) vs bin(1326 o) — premier écart à file[17] :
ring[17]=0x0A → file[17]=0x0D, puis file[k]=ring[k−1] (shift +1) — **insertion de CR
devant chaque LF**. h7 (données sans 0x0A) → delta 0. h8 (8 LF dans les données) → +8.

**(d) PREUVE LIVE : ReadProcessMemory dans le jeu EN COURS** (pid 51772, boot 18:37:48,
module AF3DN.P base 0x57360000 = le fichier 53464B47) : l'anneau du jeu contient le
record s51 vc36/ic54 seq=1998 **contrat exact** — grille à rec+172
(`55 55 85 43` = X0), **magic suivant à rec+1324** (+0, aucun gap), aucun préfixe.
Le MÊME record dans `reverify.bin` (dernière frame, seq=1998) = 1326 octets = **les octets
de l'anneau avec chaque 0x0A expansé en 0D 0A — 1326/1326 octets identiques**
(`_crlf_proof.py`). Le record contient exactement **2 octets 0x0A** → +2.

**(e) Pourquoi « remaining>1 ⇒ +2 » : corrélation, pas causalité.** Les records
multigroupes sont ceux dont la **zone idx est corrompue par la capture post-walk**
(mots u16 = octets du f32 X du blob fvf réécrit par le jeu — le décodeur les reconstruit
déjà en quad-strip) ; ces mots contiennent des octets 0x0A. **Positions exactes dans
l'anneau live (seq 1998) : `0x0A` à rec+0x58 et rec+0x62** = octets bas des mots
« garbage » idx[12] et idx[17] (`0a 00` = 10) ; le fichier insère `0D 0A` à rec+0x58 et
rec+0x63 (vérifié octet par octet). Les records propres (vc=4, vc=8, kind0) n'ont pas de
0x0A → +0. D'où la corrélation 32/32 observée. Les deltas impairs de battle_base
(1,3,5,6,7) = le NOMBRE de LF par record (data-dépendant) — cohérent uniquement avec le
modèle CRLF. Et le « préfixe `22 00` » = le mot idx[53] (= 34, dernier indice du stream,
`21 00`/`22 00` = mots 52/53) poussé hors de la zone idx par les 2 insertions — lu à
tort comme un champ intercalé.

**(f) Conséquences annexes expliquées :**
- **log 4380 / fichier 4384** : le log imprime `pending = g_dumpWrite − g_dumpCommit`
  (comptage contrat, @0x1E15/0x1FE9/0x3E3D) ; le fwrite écrit `pending` octets de ring
  mais le fichier grossit de pending + #LF (expansion). 4384−4380 = 4 = 2 LF/record × 2 records.
- **« préfixe u16 `22 00`/`36 00` entre idx et fvf »** : artéfact de lecture à offsets
  fixes sur le flux décalé — en fait le dernier mot de la zone idx du ring
  (`22 00` = idx[53] = 34 = last_idx, vérifié dans l'anneau live : mots 48..53 =
  34,33,32,35,33,34 = pattern quad-strip) qui semble « sortir » de la zone idx à
  cause du shift. Idem pour « `c0 3e` après la fin déclarée » = la queue de grille
  (V de v35 ≈ 0.469) qui « dépasse » à cause du shift. **Aucun champ u16 natif
  intercalé** — la note du parent (last_idx+1) tombait sur les bonnes VALEURS par
  la corrélation, mais le mécanisme est le CRLF.
- **La grille lue « propre » à +2** : le décodeur lit déjà la grille alignée en queue
  (`ff8dump.py` : `fvf_start = len(payload) − vcount*32` sur skew) — c'est pourquoi
  les rendus étaient sains malgré le shift.

### 2.3 Ce que le +2 n'est PAS (réfutations)

| hypothèse | réfutation |
|---|---|
| copie `[verts−2, verts−2+vc*32+2)` | h2 : sentinelles 0xA1A2 à verts−2 absentes du record ; longueur shl edi,5 = vc*32 exacte |
| write-back du walk natif 0x43E356 vers node+0x14 | aucune écriture via ebp/arg dans 0x19D0..0x1DDC ; l'anneau live montre verts = grille exacte |
| image déployée ≠ code courant (« drift ») pour le +2 | l'anneau du jeu EN COURS (53464B47) = contrat ; le +2 se reproduit in vitro sur 53464B47 (h5/h6) |
| champ u16 natif entre idx et fvf | l'anneau live : grille à rec+172 immédiatement après idx (108 o, pad 0) |

---

## 3. Chronologie des builds (établie par les bytes)

| heure | artefact | fait |
|---|---|---|
| 11:41 | commit `50419da` (v6.1) | pas de DumpNode |
| 12:38 | `…\Temp\opencode\v7smoke\…dll` (2E417A66) | .text **identique** au 53464B47 (diff 0/101888, `_recon_diff_dlls.py`) — seul diff : timestamp debug .rdata @RVA 0x1fb0c |
| 13:47:59 | boot jeu (pid 10308, mort 16:19:52) | **l'image EN MÉMOIRE pendant menu/battle/fireaga** = un état antérieur **sans les caps ratio** : les records battle vc=19482 (= perV 3247 × rem 6 ; ic = 4864 × 6) avec fails=0 sont impossibles avec les gardes 0x1BB6/0x1BD0 du code actuel |
| 15:40 | déployé 53464B47 (disque) | sans effet sur le process 13:47 (les captures 15:39/16:11 = l'ancienne image) |
| 18:37:48 | boot jeu (pid 51772, toujours vivant) | charge AF3DN.P du game dir = 53464B47 (module path vérifié par Toolhelp32) |
| 18:38:27 | `reverify.bin` | records vc 36/56/4 **uniquement** (caps actives ✓) + **+2 CRLF** (le bug flush, présent dans le build actuel) |

⇒ **Deux bugs distincts** : (1) l'absence de caps ratio + (peut-être) d'autres écarts
dans l'image 13:47 (jamais dumpée — le hash « 2E417A66.357B » du rapport ne peut pas
correspondre au code qui a produit vc=19482) ; (2) **le flush texte**, présent dans
TOUTES les builds y compris 53464B47 et dans le `.c` du dépôt.

---

## 4. Diff `.c` repo vs DLL déployé

- `GFXPT_DumpNode` (.c l.475–642) vs ASM 0x19D0–0x1DDC : **conformes** (closure, gardes,
  tailles, layout, copies, ledger). **Diff minimal : aucun.**
- **`GFXPT_DumpFlushAtPresent` (.c l.663) : `f = fopen(binPath, "a");` = LE bug**
  (le DLL déployé l'a aussi : mode texte prouvé par h6 + la preuve live 1326/1326).
  Le `.c` du dépôt décrit donc un writer dont l'anneau est conforme mais dont le
  fichier n'est PAS conforme au contrat annoncé (§ « FORMAT … PINÉ »).
- Les autres divergences observées dans les captures (vc 19482) = l'image 13:47
  uniquement ; le .c courant ne les décrit pas (correct).

---

## 5. Patch minimal proposé (SANS application)

```diff
--- gfx_driver_passthrough.c (l.663)
-    f = fopen(binPath, "a");
+    f = fopen(binPath, "ab");
```

- **Effet writer** : le .bin = l'anneau octet-pour-octet → records contigus au contrat
  (32+psize), plus aucun décalage, plus aucun octet parasite.
- **Effet décodeur** : les dumps futurs passent `ff8dump.py --strict` (0 resync) —
  le chemin resync/chain-break + tail-realign devient mort pour les nouveaux dumps et
  reste réservé aux 4 fichiers historiques du 25/09 (menu, battle_base, fireaga_only,
  dump_v7_cumulative) + reverify.bin (5e historique, produit avant le fix).
- **Effet log** : rien (le .log = texte voulu).
- **Complément optionnel (leçon process)** : stamp de build dans l'entête de record.

Validation proposée (post-patch, non exécutée ici) : re-boot + dump menu + `--strict`.

---

## Anomalies / limites du pack

- Listing = dumpbin (pas IDA) : pas de labels `loc_`/`jpt_` ; VAs absolues reproduites.
- L'image 13:47 (productrice de menu/battle/fireaga) n'existe plus sur disque : son
  absence de caps ratio est **prouvée par les bytes des captures** (vc 19482 impossible
  avec les gardes du code actuel), le reste de ses écarts éventuels est indémontrable.
- Le jeu était EN COURS pendant l'audit (pid 51772) : aucune écriture, seulement
  ReadProcessMemory (VM_READ) — aucune campagne lancée, captures intactes.
- Scripts one-shot produits sous `decode\_audit\` : `h2/h5/h6/h7/h8.c(+exe)`,
  `_recon_diff_dlls.py`, `_recon_diff_bytes.py`, `_plus2_probe.py`, `_plus2_fvf_probe.py`,
  `_bfly_probe.py`, `_bfly_battle.py`, `_bfly_big.py`, `_walk_reverify.py`,
  `_gapbytes.py`, `_h8_walk.py`, `_h6_diff.py`, `_mods.py`, `_rpm.py`,
  `_live_ring_walk.py`, `_ring_vs_file.py`, `_crlf_proof.py`, `_callers.py`, `_slots.py`,
  `dumpnode_full.asm` (extraction 336 instr), `live_ring.bin`, `h6_ring.bin`,
  `h6_file.bin`, `h8_file.bin`, `h4_ring_copy.bin`.
