# Mag213_BuildCtx_CursorInit_TwoPass @ 0x69FD00

- Instr (live): 31 (70 o, 0x69FD00-0x69FD45)
- Palier: 1+P (2 voix + sondes IDA parent P)
- Verdict: CERTAIN - initialise les deux curseurs d'ecriture de la zone de travail du ctx magie 213 (a1[8] = base+8 ; a1[9] = base + *(u32*)base + 0xC), puis enchaine deux passes de construction : sub_69FD50(a1,a2,a3,a4) dont le retour devient 4e arg de sub_6A01B0(a1,a2,a3,ret1) avec a1[9] avance de +0xC entre les deux ; retour EAX brut de sub_6A01B0 (callee-cleanup implicite, add esp,20h unique)
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: CERTAIN
- Nom IDA: sub_69FD00\nTYPE ; proposition: Mag213_BuildCtx_CursorInit_TwoPass
- Notes parent: checks 5.6 OK (role P) : mecanisme integral converge c_a/sem_a (init curseurs 0x69FD14/0x69FD25, call sub_69FD50 0x69FD28, push eax 0x69FD30, call sub_6A01B0 0x69FD3A, avance +0xC 0x69FD32-37, add esp,20h 0x69FD3F) ; sonde IDA xrefs_to 0x69FD00 = caller unique sub_69EF60 @0x69F359 (stepper effet MAG213, ferme) ; verdict UNCERTAIN de semantic_a leve par cette sonde

## C reconcilie

```c
/* c_a.c — sub_69FD00 @ 0x69FD00 (mode 1+P stub, voix c_a)
 * Ground truth = live ASM (pack asm.asm, 31 instr @ 0x69FD00..0x69FD45), PAS Hex-Rays.
 * Taille live: 0x46 octets. Type IDA: int __cdecl(int,int,int,int).
 * Sauvegardes de registres: push ebx, push esi, push edi (cal Vit, pas de ebp frame).
 *
 * Libellés d'args ( cdecl, poussés droite→gauche par le caller / lus arg_0..arg_C ) :
 *   arg_0 = a1 : pointeur sur un descripteur/buffer (DWORD* en tête)
 *   arg_4 = a2
 *   arg_8 = a3
 *   arg_C = a4
 * Tout est modelisé _DWORD par manque de preuve de largeur (IDA: int).
 *
 * Correction add esp: un SEUL `add esp, 0x20h` a 0x69FD3F couvre les 8 pushes
 * d'arguments (4 avant sub_69FD50 + 4 avant sub_6A01B0). Les deux callees
 * sont deeallee-cleanup (le caller nettoie) — coherent avec cdecl.
 *
 * Note Hex-Rays (verificateur) : son squelette correspond a l'ASM, mais il
 * (1) rend les ecritures [esi+0x20] / [esi+0x24] comme a1[8]/a1[9] via des
 * types pointeurs castes confus, (2) masque l'ordre exact des pushes et le
 * fait que a4 est pousse AVANT le recalcul de a1[9]. L'ASM fait foi.
 */

int __cdecl sub_69FD00(_DWORD *a1, int a2, int a3, int a4)
{
    _DWORD *hdr;   /* eax = [esi] = [a1] : pointeur/entete lu depuis l'objet a1 */
    _DWORD *seg;   /* edx = [hdr] : dword lu DANS l'entete (taille/offset de base) */
    int ret1;      /* eax retour de sub_69FD50, recycle comme arg_4 du 2e call */

    hdr = (_DWORD *)*a1;                       /* 69FD0F mov eax, [esi] */
    /* 69FD11/69FD14 : [a1 + 0x20] = hdr + 8  (curseur/offset courant, avance de 8) */
    a1[8] = (_DWORD)((char *)hdr + 8);
    seg = *hdr;                                /* 69FD1B mov edx, [eax] */

    /* 69FD25 : [a1 + 0x24] = seg + hdr + 0xC  (offset de section + 0xC) */
    /* 69FD1D..69FD28 : callee sub_69FD50(esi, ebx, edi, ecx) — args pousses
     * droite->gauche : a4 (ecx 69FD1D), a3 (edi 69FD1E), a2 (ebx 69FD1F),
     * a1  (esi 69FD24). DEUX ecritures struct (a1[8], a1[9]) effectuées AVANT
     * le push de esi a 0x69FD24. */
    a1[9] = (_DWORD)((char *)hdr + seg + 0xC); /* lea eax, [edx+eax+0Ch] @69FD20, store @69FD25 */
    ret1 = sub_69FD50((int)a1, a2, a3, a4);    /* call sub_69FD50 @69FD28 */

    /* 69FD2D mov edx,[esi+24h] ; 69FD32 add edx,0Ch ; 69FD37 mov [esi+24h],edx :
     * a1[9] avance encore de 0xC apres le premier callee. */
    a1[9] = (_DWORD)((char *)a1[9] + 0xC);

    /* 69FD30..69FD3A : second callee, memes quatre args mais arg_4 = ret1
     * (eax retour de sub_69FD50) au lieu de a4 : push eax, push edi, push ebx,
     * push esi -> sub_6A01B0(a1, a2, a3, ret1). */
    ret1 = sub_6A01B0((int)a1, a2, a3, ret1);  /* call sub_6A01B0 @69FD3A */

    /* 69FD3F add esp, 0x20 ; pop edi/esi/ebx ; 69FD45 retn.
     * Valeur de retour = eax a l'issue de sub_6A01B0 (aucune autre ecriture
     * de eax avant retn). Largeur declarée par IDA: 'int'. */
    return ret1;                               /* eax = retour sub_6A01B0 */
}

/* UNCERTAIN 0x69FD00 largeur exacte de retour : IDA dit 'int' (32 bits) et l'ASM
 * ne touche pas eax avant retn (donc retour = eax brut du callee sub_6A01B0),
 * mais la largeur logique (int vs unsigned vs pointeur) n'est pas prouvable
 * depuis le seul corps. Q: quel est le type de retour réel attendu par
 * sub_69EF60:0x69F359 (unique caller)?
 * UNCERTAIN 0x69FD0F rôle exact du descripteur lu via [esi]+[esi] : a1[8]=+8,
 * a1[9]=base+seg+0xC puis +0xC suggèrent un descripteur de stream/section
 * (header + record stride 0xC), mais le_nom/des offsets sémantiques ne sont
 * pas prouvés par l'ASM seul. Q: confirmés par globals.txt? (vide dans ce pack.)
 */
```

## Analyse semantique

# Sémantique sub_69FD00 @ 0x69FD00 (analyse A, mode aveugle 1+P)

- Rôle (1 phrase) : Initialise les deux curseurs d'écriture de la zone de travail passée en 1er paramètre (`ctx`) depuis le pointeur base stocké à [ctx+0x00] — région A à base+0x8, région B à base+0xC+*(u32*)base — puis enchaîne deux passes de construction `sub_69FD50(ctx,a,b,c)` puis `sub_6A01B0(ctx,a,b,ret1)`, en avançant le curseur B de 0xC entre les deux, et retourne tel quel le résultat de la seconde.
- Verdict : **UNCERTAIN** (mécanique ASM intégralement établie et citée ; identité sémantique de domaine non prouvée — voir motifs ci-dessous)
- Nom catalogue : aucun (`sub_69FD00`, jamais nommé). Proposition markdown seule (PAS de rename) : **`Ctx_CursorInit_TwoPassBuild`** — justifié par ≥2 preuves adresées : init des deux curseurs @0x69fd14 et @0x69fd25 (`mov [esi+20h],ecx` / `mov [esi+24h],eax`), deux passes @0x69fd28 (`call sub_69FD50`) et @0x69fd3a (`call sub_6A01B0`) avec chaînage du retour de la 1re en 4e arg de la 2de @0x69fd30 (`push eax`).

## Pourquoi pas CERTAIN (barème non atteint)

1. **Wiki absent** : wiki.md du pack = « qmd failed » ; QMD ff8-wiki (lecture seule) : 0 hit pour `69FD00`, `69FD50`, `6A01B0`, `69EF60` (4 requêtes lex). Aucune convergence wiki démontrable.
2. **Callees sans prototype** : callees.txt liste les deux calls (CALL/ADD-ESP LINES) mais la section PROTOS est vide — leur sémantique propre est inaccessible en aveugle.
3. **Caller non contextualisé** : callers.txt ne fournit que l'xref code unique @0x69f359 dans `sub_69EF60` (taille 0xbcb) ; les valeurs réelles des 4 arguments au site d'appel ne sont pas visibles (pas d'accès IDA en mode aveugle).

## In / Out / Effets

- In (cdecl, poussés droite→gauche) :
  - param1 `ctx` — zone de travail : pointeur `base` lu à +0x00, curseurs écrits à +0x20/+0x24 ; poussé en dernier des deux appels (@0x69fd24, @0x69fd36)
  - param2 `a` — transmis tel quel aux deux sous-appels (@0x69fd1f, @0x69fd35)
  - param3 `b` — transmis tel quel aux deux sous-appels (@0x69fd1e, @0x69fd31)
  - param4 `c` — passé en dernier argument du seul sub_69FD50 (@0x69fd1d)
- Out : retour **32 bits** (eax) = retour direct de sub_6A01B0 (@0x69fd3a), eax intact jusqu'au `retn` @0x69fd45 ; cohérent avec le type IDA `int __cdecl(int,int,int,int)`.
- Effets observables (ASM) :
  - `[ctx+0x20] = [ctx+0x00] + 0x8` (@0x69fd0f–0x69fd14)
  - `[ctx+0x24] = *(u32*)base + base + 0xC` (@0x69fd1b, 0x69fd20, 0x69fd25) — dépend d'une taille/count lu en tête du buffer base
  - `[ctx+0x24] += 0xC` entre les deux passes (@0x69fd2d, 0x69fd32, 0x69fd37) — avance faite par le wrapper
  - pile : `add esp,0x20` @0x69fd3f (2 calls × 4 args), `retn` sans immédiat → cdecl, l'appelant nettoie ses 16 octets
- Effets inférés (non prouvables depuis ce pack, marqués comme inférence) : sub_69FD50/sub_6A01B0 écrivent dans les régions pointées par les curseurs (sémantique usuelle de champs curseur +0x20/+0x24).

## Preuves (ASM cité, adresses exactes)

1. @0x69fd0f–0x69fd14 : `mov eax,[esi]` ; `lea ecx,[eax+8]` ; `mov [esi+20h],ecx` — curseur A = base+8, base = dword à [ctx+0x00].
2. @0x69fd1b+0x69fd20+0x69fd25 : `mov edx,[eax]` ; `lea eax,[edx+eax+0Ch]` ; `mov [esi+24h],eax` — curseur B = *(u32*)base + base + 0xC.
3. @0x69fd1d–0x69fd28 : pushes droite→gauche `ecx`(param4)→`edi`(param3)→`ebx`(param2)→`esi`(param1) puis `call sub_69FD50` — appel = sub_69FD50(ctx,a,b,c).
4. @0x69fd2d–0x69fd37 : `mov edx,[esi+24h]` ; `add edx,0Ch` ; `mov [esi+24h],edx` — avance de 12 octets du curseur B entre les deux passes, à la charge du wrapper.
5. @0x69fd30–0x69fd3a : `push eax` (retour de sub_69FD50) poussé en premier → dernier argument de `call sub_6A01B0` = sub_6A01B0(ctx,a,b,ret1) — dépendance passe 2 ← passe 1.
6. @0x69fd3f+0x69fd45 : `add esp,20h` ; `retn` — nettoyage des 8 args des deux sous-appels (cdecl callees), retour sans nettoyage d'args propres.
7. callers.txt : xref unique code @0x69f359 dans `sub_69EF60` (0xbcb) — un seul appelant, même quartier 0x69xxxx que les deux callees (0x69FD50, 0x6A01B0).
8. QMD ff8-wiki lecture seule : 0 résultat sur les 4 adresses — divergence/convergence wiki indéterminables (pas un CONFLICT : absence de donnée, pas de contradiction).

## Checks

- Callees cités présents dans callees.txt : `sub_69FD50` @0x69fd28 ✓ ; `sub_6A01B0` @0x69fd3a ✓. Aucune library call inventée : 2 calls directs, les seuls du flux.
- Strides/déplacements en nombres littéraux : +0x8, +0xC, +0x20, +0x24 — aucun stride reconstruit, aucun piège `*232`/`0x1D0` applicable ici.
- Polarités : aucun saut conditionnel dans les 31 instructions (aucun `ja/jb` vs `jg/jl` à arbitrer) ; aucun usage de flags.
- Largeur retour : 32 bits (eax de sub_6A01B0 retourné tel quel) ; ret1 également propagé en pleine largeur dword (push eax @0x69fd30).

## Questions ouvertes

1. [base+0x00] est-il la longueur de la région A (d'où région B = base+0xC+len) ? Que contiennent base+4..base+8 ?
2. Que retourne sub_69FD50 (index, handle, checksum, pointeur) pour que sub_6A01B0 le consomme en 4e argument ?
3. L'avance +0xC couvre-t-elle un record fixe de 12 octets écrit par la passe 1, ou un en-tête de région B ?
4. Quel est le contexte du site d'appel @0x69f359 dans sub_69EF60 (valeurs des 4 arguments, invariant d'état) — à vérifier par V avec accès IDA.
5. wiki.md vide : toute confrontation wiki reste à faire en phase V.

## IDBCOMMENT (proposition)

IDBCOMMENT: "Prepare les deux curseurs d'ecriture de la zone de travail passee en premier parametre : region A a base+8 et region B a base+0xC+taille lue en tete du buffer base. Enchaine deux passes de construction via sub_69FD50 puis sub_6A01B0, la seconde recevant le retour de la premiere, avec avance de 12 octets du curseur B entre les deux ; retourne le resultat eax de la seconde passe. [semantic-triple 2026-09-20]"
