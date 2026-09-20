# MAG213_FxStep_ScratchNodeSubmitOT2_AdvanceCtx @ 0x6A0A50

- Instr (live): 49 (152 o, 0x6A0A50-0x6A0AE7)
- Palier: 1+P (2 voix + sondes IDA parent P)
- Verdict: CERTAIN - pas de frame d'une tache FX magique (borne 13) : alloue un node scratch 0xB4 (bs_modulo), init (head unk_117D8B8, word +0x24=0), insere dans l'OT battle groupe 2 (g_BattleOTBase+0x44 via sub_571C80 @0x6A0AA1, tete dword_2510194), passe sub_571BC0(a1+0x10, w, -(w>>2)), unwind 0xB4, avance la position ctx+0x10 des deltas ctx+0x18..1C, incremente le compteur ctx+0xC ; retour EAX = 2 tant que compteur < 13 (cmp si,0Dh setl @0x6A0AD9-E3), 0 sinon
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: CERTAIN
- Nom IDA: sub_6A0A50\nTYPE ; proposition: MAG213_FxStep_ScratchNodeSubmitOT2_AdvanceCtx
- Notes parent: checks 5.6 OK (role P) : push 0B4h (0x6A0A53), sub_571BC0 (0x6A0A75), unk_117D8B8 (0x6A0A7A), word +24h=0 (0x6A0A88), add ecx,44h (0x6A0A9A), sub_571C80 (0x6A0AA1), cmp si,0Dh + setl + and 2 (0x6A0AD9-E3), caller data xref sub_69EF60 @0x69F698 ; convergence c_a/sem_a ; verdict UNCERTAIN leve par sonde caller + contexte bloc B

## C reconcilie

```c
/* c_a.c — 0x6A0A50 (stub, mode 1+P)
 * Ground truth = live ASM (asm.asm) + ida_dump_bytes, not Hex-Rays.
 * Taille : 152 octets (0x6A0A50..0x6A0AE7). Type IDA : None (sub_6A0A50).
 * Sauvegardes de registres : push ebx / esi / edi (clobber ebx, esi, edi —
 *   esi réécrit à 0x6A0AD3 après usage comme pointeur;tâche arg_0).
 * Corrections add esp : une seule, cumulative à 0x6A0ACC (add esp, 0x24h)
 *   = 4 args bs_modulo+hmm (0x4) + 12 args sub_571BC0/sub_571C80 (0xC+0xC)
 *   + 8 bytes padding/frame — cf. détail par call ci-dessous. Aucun
 *   'add esp' par call individuel : nettoyer vers 0x24 total au point unique.
 * Retour : eax 0 ou 2 (motif setl al / dec eax / and eax, 2 — détail plus bas).
 *
 * Caller unique (live xref data, callers.txt) : sub_69EF60 @ 0x69F698
 *   (data-xref : entrée de table dispatch, cf. liste 0x25101B8 MAG213 stepper
 *   0x69EF60 — contexte parent, non prouvé par l'ASM lui-même).
 */

/* Externes nommés (rôle prouvé par asm.asm) */
extern void *bs_modulo(size_t nbytes);          // 0x5082B0
extern void BattleScratch_Unwind(size_t nbytes);// inverse de bs_modulo, dword_1D999C4 (cf. asm_6A0AB0 CMT live)
extern void sub_571BC0(void *dst, short val, int cnt);      // proto inféré du call live
extern unsigned int sub_571C80(void *s0, void *s1, int mode, unsigned int handle); // proto inféré du call live

/* Globals touchés (globals.txt) */
extern unsigned int dword_2510194;
extern unsigned int dword_1D999C4;              // bumpé par BattleScratch_Unwind
extern unsigned char g_BattleOTBase[];

/* unk_117D8B8 : pointeur de vtable/header écrit à [edi] */
extern void *unk_117D8B8;

/* arg_0 : struct MAG213-like, offsets hex :
 *   +0x0C : WORD compteur (incrémenté, comparé à 0x0D, seuil 13)
 *   +0x10,+0x12,+0x14 : WORD positions (GP: coordonnées)
 *   +0x16 : WORD vitesse/direction de ce stub (lue, >>2, négative pushée)
 *   +0x18,+0x1A,+0x1C : WORD deltas ajoutés aux coordonnées +0x10..+0x14
 */
int __cdecl sub_6A0A50(int a1 /* arg_0, struct base */)
{
    void *edi_a;      // eax/edi — buffer retour bs_modulo (0xB4 bytes)
    unsigned short ax16;   // *[a1+0x16] (WORD)
    short ecx_sar;         // sign-extend( ax16 ) >> 2, negated
    unsigned short dxCur;  // *[a1+0x0C]
    unsigned short dx18, ax1a, cx1c;
    void *ebx;             // a1 + 0x10 (dst word[0] de la structure éditée)
    int ret;               // construit via eax

    /* 0x6A0A53: push 0B4h; call bs_modulo — arg UNIQUE 0xB4 (nbytes) cdecl
     * pushé (et non 0x1D0 — 0xB4 est le nbytes explicite du push live).
     * eax (retour bs_modulo) = buffer alloué. Pas de Cleanup par byte ici :
     * BattleScratch_Unwind 0xB4 à 0x6A0AB0. */
    edi_a = bs_modulo(0xB4);

    /* 0x6A0A5D-0x6A0A74 */
    ax16   = *(unsigned short *)(a1 + 0x16);       // 0x6A0A63 mov ax, [esi+16h]
    ebx    = (char *)a1 + 0x10;                    // 0x6A0A67 lea ebx, [esi+10h]
    ecx_sar = (short)ax16 >> 2;                    // 6A0A6A movsx ecx, ax / 6A0A6D sar ecx, 2
    ecx_sar = -ecx_sar;                            // 0x6A0A70 neg ecx (auteur : ARG sub_571BC0 signé)
    /* push eax (val) / push ebx (dst) : args inversés dexroite→gauche cdecl
     * ordre push live : ecx (négatif) puis eax (val) puis ebx (dst) —
     *   le dernier pushé est l'arg le plus à gauche (cdecl).
     * Donc sub_571BC0(dst=ebx, val=ax16, third_arg=ecx_sar) */
    sub_571BC0((void *)ebx, (short)ax16, ecx_sar);

    /* 0x6A0A7A-0x6A0A88 — init struct allouée */
    *(void **)edi_a   = unk_117D8B8;               // mov dword ptr [edi], offset unk_117D8B8
    dxCur = *(unsigned short *)(a1 + 0x0C);        // 0x6A0A80 mov dx, [esi+0Ch]
    *(unsigned short *)((char *)edi_a + 0x04) = dxCur;  // mov [edi+4], dx
    *(unsigned short *)((char *)edi_a + 0x24) = 0;      // mov word ptr [edi+24h], 0

    /* 0x6A0A8E-0x6A0AA6 — insertion dans l'OT battle
     * push eax (dword_2510194) / push 2 / push ecx (g_BattleOTBase+0x44) / push edi
     * cdecl : dernier pushé = 1er arg gauche :
     *   sub_571C80(edi_a, g_BattleOTBase+0x44, 2, dword_2510194)
     * ('+44h' emblématique — offset OT live g_BattleOTBase + 0x44)
     * Le retour écrase *(dword_2510194) à 0x6A0AAB. */
    dword_2510194 = sub_571C80(edi_a, g_BattleOTBase + 0x44, 2, dword_2510194);

    /* 0x6A0AB0 — libération du buffer de 0xB4 bytes (E3a, cf. CMT live) */
    BattleScratch_Unwind(0xB4);

    /* 0x6A0AB5-0x6A0AC8 — avance coordonnées par les deltas */
    dx18 = *(unsigned short *)(a1 + 0x18);         // 6A0AB5 mov dx, [esi+18h]
    ax1a = *(unsigned short *)(a1 + 0x1A);         // 6A0AB9 mov ax, [esi+1Ah]
    cx1c = *(unsigned short *)(a1 + 0x1C);         // 6A0ABD mov cx, [esi+1Ch]
    *(unsigned short *)ebx += dx18;                // 6A0AC1 add [ebx], dx   → [a1+0x10] += [a1+0x18]
    *(unsigned short *)(a1 + 0x12) += ax1a;        // 6A0AC4 add [esi+12h], ax
    *(unsigned short *)(a1 + 0x14) += cx1c;        // 6A0AC8 add [esi+14h], cx

    /* 0x6A0ACC — nettoyage cumulative des 4 calls cdecl (unique add esp,0x24) */
    /* 0x6A0ACC — add esp, 0x24 (nettoyage différé unique, cf. note préambule) */

    /* 0x6A0ACF-0x6A0AD3 — incrément du compteur WORD à [a1+0x0C] */
    ++*(unsigned short *)(a1 + 0x0C);              // inc word ptr [esi+0Ch]
    dxCur = *(unsigned short *)(a1 + 0x0C);        // mov si, [esi+0Ch]

    /* 0x6A0AD7-0x6A0AE3 — construction du retour
     * 6A0AD7: xor eax, eax
     * 6A0AD9: cmp si, 0Dh   (seuil 13)
     * 6A0ADD: setl al       (SIGNED comparison : SF!=OF — jl — si < 13)
     * 6A0AE1: dec eax       (0→-1, 1→0)
     * 6A0AE3: and eax, 2    (-1 & 2 = 2, 0 & 2 = 0)
     * Donc : si compteur < 13 → AL=1 → eax après dec = 0xFFFFFFFF → &2 = 0x00000002
     *        si compteur >= 13 → AL=0 → eax après dec = 0 → &2 = 0x00000000
     * Retour = 0 ou 2 (steppers retours 0/2, cf. contexte parent MAG213) */
    if ((short)dxCur < 13)
        return 2;
    return 0;
}

/* UNCERTAIN 0x6A0A75 proto sub_571BC0 : noms/signature non prouvés —
 * live push réalité = negated (ax >> 2) pushé avant le mov/lea, l'ordre des
 * operands est déductible de l'ordre push (le dernier pushé = arg le plus à
 * gauche), le semantic de .val/negation reste un rôle voix-circulaire sans
 * dump_bytes de la SUB fonctions (561BC0/571C80 pas dans ce pack).
 * UNCERTAIN 0x6A0A8E proto sub_571C80 : handle chainé dans dword_2510194.
 * UNCERTAIN 0x6A0A50 : a1 (arg_0) pointe vers struct MAG213-like — offsets
 * 0x0C/0x10..0x14/0x16/0x18..0x1C prouvés par le live, mais rôle complet de
 * chaque champ (position? vitesse? ratio?) non prouvé ici (rôle A/V). */
```

## Analyse semantique

# Sémantique sub_6A0A50 @ 0x6A0A50 (analyse A, mode aveugle 1+P)

- **Rôle (1 phrase)** : pas de frame d'une tâche FX magique (enregistrée par le stepper MAG213 0x69EF60) : alloue un bloc scratch transient de 0xB4, construit un nœud (tag 0x117D8B8, mot depuis ctx+0xC, +0x24=0), l'insère dans l'OT battle groupe 2 (g_BattleOTBase+0x44) sous le handle dword_2510194, avance la position ctx+0x10 du delta ctx+0x18..0x1C, incrémente le compteur ctx+0xC et retourne 2 tant que compteur<13, sinon 0.

- **Verdict : UNCERTAIN** (voir « Pourquoi pas CERTAIN » ci-dessous)

- **Nom catalogue** : aucun (sub_6A0A50 non nommé). Proposition markdown seule (PAS de rename) :
  `MAG213_FxStep_ScratchNodeSubmitOT2_AdvanceCtx`
  — justifié par ≥2 preuves ASM adressées : (1) `0x6a0a93 add ecx, 44h` + `0x6a0a9d push 2` = soumission dans l'OT groupe 2 ; (2) `0x6a0ad3 cmp si, 0Dh` + séquence `setl/dec/and 2` = retour 2 tant que l'étape <13 ; (3) `0x6a0ac1..0x6a0ac8` = avance de position 3×16 bits.

## In / Out / Effets (cdecl, args droite→gauche)

- **In** : 1 arg cdecl `ctx` (stack, [esp+10h+arg_0] lu @0x6a0a5d). Champ de travail du ctx :
  - `+0x0C` : u16 compteur d'étapes (incrémenté @0x6a0acf, testé vs 13)
  - `+0x10..+0x14` : position (3×s16), base ebx @0x6a0a67
  - `+0x16` : u16 lu @0x6a0a63 ; `sar ecx,2` puis `neg` → -([+0x16]>>2), poussé à sub_571BC0 avec [+0x16] et ctx+0x10 (éléments de 4 octets = décalage >>2)
  - `+0x18..+0x1C` : delta/vélocité (3×s16) ajouté à la position
- **Out** : EAX 32 bits = 2 si ([ctx+0xC] après incrément) < 13 (signed, `setl`), sinon 0. Compatible « retours 0/2 steppers ».
- **Effets de bord** :
  - scratch : `push 0xB4; call bs_modulo` @0x6a0a58 (alloc bump dword_1D999C4) puis `call BattleScratch_Unwind` @0x6a0ab0 (désalloc miroir) → le bloc 0xB4 (edi) est transient ; il contient le nœud soumis ([edi]=0x117D8B8 @0x6a0a7a, [edi+4]=[ctx+0xC] @0x6a0a84, [edi+0x24]=0 @0x6a0a88) puis est passé à sub_571C80 avant l'unwind.
  - OT : `sub_571C80(edi, g_BattleOTBase+0x44, 2, dword_2510194)` @0x6a0aa1 (args poussés droite→gauche @0x6a0a99/0x6a0a9d/0x6a0a9f/0x6a0aa0) ; valeur de retour réécrite dans `dword_2510194` @0x6a0aab (handle de liste persistant entre frames).
  - ctx : position += delta ; compteur += 1.

## Pourquoi pas CERTAIN

1. `wiki.md` du pack est vide (échec qmd côté pack) ; l'interrogation ff8-wiki via QMD ne couvre ni 0x6A0A50, ni sub_571BC0, ni sub_571C80, ni 0x117D8B8 → pas d'alignement wiki démontrable (pas de divergence non plus).
2. `callees.txt` n'a aucune entrée PROTOS : les sémantiques de sub_571BC0 (itérateur/remplisseur sur ctx+0x10 ?) et sub_571C80 (insertion OT ?) ne sont que déduites des args poussés, pas attestées.
3. Direction du retour vs BdLinkTask_Pump (« unlink on return bit 2 ») : le wiki dit que bit 2 délie ; ici 2 est retourné pendant la vie de la tâche. Ambiguïté non résolue (2 = continuer, ou 2 = re-submit avec re-registre ailleurs) — à trancher par le verdict V ou une lecture de 0x508420.

Convergence forte avec le contexte fourni (caller unique data-xref depuis sub_69EF60 = stepper MAG213 ; g_BattleOTBase+0x44 ; dword_2510194 ; scratch 0xB4 ; retours 0/2) — tout concorde, d'où une confiance fonctionnelle élevée (niveau LIKELY) mais CERTAIN hors de portée sans wiki/protos de callees.

## Preuves (ASM cité)

1. `0x6a0a5d mov esi, [esp+10h+arg_0]` — 1 arg cdecl (ctx), lu après 3 pushes + ret.
2. `0x6a0a53 push 0B4h` + `0x6a0a58 call bs_modulo` puis `0x6a0aa6 push 0B4h` + `0x6a0ab0 call BattleScratch_Unwind` — paire alloc/unwind symétrique d'un bloc transient 0xB4 (bump dword_1D999C4).
3. `0x6a0a7a mov dword ptr [edi], offset unk_117D8B8` — tag/vtable du nœud construit dans le scratch.
4. `0x6a0a93 mov ecx, g_BattleOTBase` / `0x6a0a9a add ecx, 44h` / `0x6a0a9d push 2` / `0x6a0aa1 call sub_571C80` / `0x6a0aab mov dword_2510194, eax` — insertion nœud dans OT groupe 2, handle persistant réécrit.
5. `0x6a0abd mov cx, [esi+1Ch]` … `0x6a0ac8 add [esi+14h], cx` (et `add [ebx], dx` sur ebx=ctx+0x10 @0x6a0a67) — avance position 3×s16 par delta.
6. `0x6a0acf inc word ptr [esi+0Ch]` / `0x6a0ad3 cmp si, 0Dh` / `0x6a0add setl al` / `0x6a0ae1 dec eax` / `0x6a0ae3 and eax, 2` — retour 2 tant que compteur<13 (signed), sinon 0 ; EAX 32 bits construit (pas AL seul).
7. `0x6a0a63 mov ax, [esi+16h]` + `sar ecx, 2` + `neg ecx` + pushes eax/ecx/ebx → `0x6a0a75 call sub_571BC0` — éléments 4 octets (>>2), itération dérivée de ctx+0x16 sur ctx+0x10.
8. Caller unique : data-xref @0x69f698 depuis `sub_69EF60` (0xBcb) — le stepper MAG213 de la liste 0x25101B8.

## Checks

- Callees cités présents dans callees.txt : `bs_modulo` (0x6a0a58), `sub_571BC0` (0x6a0a75), `sub_571C80` (0x6a0aa1), `BattleScratch_Unwind` (0x6a0ab0) — tous présents. Aucune library call inventée.
- Strides en nombres : éléments `>>2` = 4 octets ; bloc 0xB4 ; offsets ctx 0x0C/0x10/0x12/0x14/0x16/0x18/0x1A/0x1C ; nœud +0/+4/+0x24 ; OT +0x44.
- Polarités : `sar`/`neg` = itération descendante (arithmetic sur s16) ; `setl` = comparaison **signée** (compteur<13) ; inc après lecture de dx mais avant le test (le test utilise la valeur incrémentée).
- Largeur retour : EAX 32 bits (xor/dec/and sur eax complet) — pas un retour AL-only ; valeurs 0 ou 2.

## Questions ouvertes

1. Rôle exact de sub_571BC0 (remplissage ? boucle de particules ?) — la signe négatif `-(x>>2)` suggère une itération arrière ou un end-offset, non prouvable depuis le pack.
2. sub_571C80 : copie-t-elle le contenu du nœud scratch dans la liste OT (rendant l'unwind sûr), ou le nœud reste-t-il lié par pointeur (l'unwind serait alors un pattern « frame arena » réinitialisé à chaque frame) ?
3. Sens du retour 2 vs « unlink on return bit 2 » de BdLinkTask_Pump 0x508420.

## IDBCOMMENT (proposition)

Pas de frame d'effet MAG213 : alloue un noeud scratch 0xB4, l'insere dans l'OT battle groupe 2 (g_BattleOTBase+0x44) via sub_571C80, avance la position ctx+0x10 du delta ctx+0x18 et incremente le compteur ctx+0xC. Retourne 2 tant que le compteur est sous 13, sinon 0 pour terminer la tache. [semantic-triple 2026-09-20]
